"""Orchestrate document_process jobs: parse → chunk → embed → persist."""

from __future__ import annotations

import logging
from datetime import timedelta
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from core.config import settings
from core.time import ensure_utc, utcnow
from models.document import Document
from models.document_chunk import DocumentChunk
from models.enums import DocumentStatus, JobStatus
from models.job import Job
from services.chunking import split_document
from services.embeddings import embed_texts
from services.jobs import mark_job_failed
from services.parsers import extract_text
from services.storage import get_storage

logger = logging.getLogger(__name__)

_CLAIMABLE = {
    JobStatus.PENDING.value,
    JobStatus.FAILED.value,
    JobStatus.RUNNING.value,
}


class DocumentProcessor:
    def __init__(self, db: Session):
        self.db = db
        self.storage = get_storage()

    def process_job(self, job_id: UUID) -> dict:
        """Claim a job, process the file, mark document ready/failed."""
        job = self.db.scalar(select(Job).where(Job.id == job_id).with_for_update())
        if job is None:
            raise ValueError(f"Job not found: {job_id}")

        if job.status == JobStatus.COMPLETED.value:
            return {"skipped": True, "status": job.status}

        # Fresh RUNNING = another worker owns it. Stale RUNNING = reclaim after crash.
        if job.status == JobStatus.RUNNING.value and not self._is_stale_running(job):
            return {"skipped": True, "status": job.status}

        if job.status not in _CLAIMABLE:
            return {"skipped": True, "status": job.status}

        if job.status == JobStatus.RUNNING.value:
            logger.warning("Reclaiming stale running job %s", job_id)

        document_id = job.document_id
        if document_id is None and job.payload:
            raw = job.payload.get("document_id")
            document_id = UUID(str(raw)) if raw else None
        if document_id is None:
            mark_job_failed(self.db, job, None, "Job is missing document_id")
            raise ValueError("Job is missing document_id")

        document = self.db.scalar(
            select(Document).where(Document.id == document_id).with_for_update()
        )
        if document is None:
            mark_job_failed(self.db, job, None, f"Document not found: {document_id}")
            raise ValueError(f"Document not found: {document_id}")

        # Claim, then commit so locks are released before OpenAI I/O.
        job.status = JobStatus.RUNNING.value
        job.started_at = utcnow()
        job.error = None
        document.status = DocumentStatus.PROCESSING.value
        document.error_message = None
        self.db.commit()

        try:
            document = self.db.get(Document, document_id)
            job = self.db.get(Job, job_id)
            if document is None or job is None:
                raise ValueError("Document or job missing after claim")

            result = self._run(document)
            job.status = JobStatus.COMPLETED.value
            job.result = result
            job.completed_at = utcnow()
            job.error = None
            self.db.commit()
            return result
        except Exception as exc:
            logger.exception("Document processing failed for job %s", job_id)
            self.db.rollback()
            mark_job_failed(
                self.db,
                self.db.get(Job, job_id),
                self.db.get(Document, document_id),
                str(exc),
            )
            raise

    def _is_stale_running(self, job: Job) -> bool:
        if job.started_at is None:
            return True
        age = utcnow() - ensure_utc(job.started_at)
        return age >= timedelta(minutes=max(1, settings.JOB_STALE_MINUTES))

    def _run(self, document: Document) -> dict:
        data = self.storage.read(document.storage_key)
        extracted = extract_text(
            data,
            original_name=document.original_name,
            mime_type=document.mime_type,
        )
        chunks = split_document(extracted)
        embeddings = embed_texts([chunk.content for chunk in chunks])

        # Replace any previous chunks (reprocess / reclaim).
        self.db.execute(
            delete(DocumentChunk).where(DocumentChunk.document_id == document.id)
        )

        for chunk, vector in zip(chunks, embeddings, strict=True):
            self.db.add(
                DocumentChunk(
                    document_id=document.id,
                    chunk_index=chunk.chunk_index,
                    content=chunk.content,
                    page_number=chunk.page_number,
                    token_count=chunk.token_count,
                    chunk_metadata=chunk.metadata or None,
                    embedding=vector,
                )
            )

        document.status = DocumentStatus.READY.value
        document.page_count = extracted.page_count
        document.chunk_count = len(chunks)
        document.embedding_model = settings.embedding_model
        document.error_message = None
        self.db.flush()

        return {
            "document_id": str(document.id),
            "chunk_count": len(chunks),
            "page_count": extracted.page_count,
            "embedding_model": settings.embedding_model,
        }
