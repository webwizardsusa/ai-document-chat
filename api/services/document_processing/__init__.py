"""Orchestrate document_process jobs: parse → chunk → embed → persist."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from core.config import settings
from models.document import Document
from models.document_chunk import DocumentChunk
from models.enums import DocumentStatus, JobStatus
from models.job import Job
from services.chunking import split_document
from services.embeddings import embed_texts
from services.parsers import extract_text
from services.storage import get_storage

logger = logging.getLogger(__name__)


class DocumentProcessor:
    def __init__(self, db: Session):
        self.db = db
        self.storage = get_storage()

    def process_job(self, job_id: UUID) -> dict:
        job = self.db.scalar(
            select(Job).where(Job.id == job_id).with_for_update()
        )
        if job is None:
            raise ValueError(f"Job not found: {job_id}")

        if job.status == JobStatus.COMPLETED.value:
            return {"skipped": True, "status": job.status}

        document_id = job.document_id
        if document_id is None and job.payload:
            raw = job.payload.get("document_id")
            document_id = UUID(str(raw)) if raw else None
        if document_id is None:
            self._fail_job(job, "Job is missing document_id")
            raise ValueError("Job is missing document_id")

        document = self.db.scalar(
            select(Document).where(Document.id == document_id).with_for_update()
        )
        if document is None:
            self._fail_job(job, f"Document not found: {document_id}")
            raise ValueError(f"Document not found: {document_id}")

        now = datetime.now(timezone.utc)
        job.status = JobStatus.RUNNING.value
        job.started_at = now
        job.error = None
        document.status = DocumentStatus.PROCESSING.value
        document.error_message = None
        self.db.commit()

        try:
            result = self._run(document)
            job.status = JobStatus.COMPLETED.value
            job.result = result
            job.completed_at = datetime.now(timezone.utc)
            job.error = None
            self.db.commit()
            return result
        except Exception as exc:
            logger.exception("Document processing failed for job %s", job_id)
            self.db.rollback()
            self._mark_failed(job_id, document_id, str(exc))
            raise

    def _run(self, document: Document) -> dict:
        data = self.storage.read(document.storage_key)
        extracted = extract_text(
            data,
            original_name=document.original_name,
            mime_type=document.mime_type,
        )
        chunks = split_document(extracted)
        embeddings = embed_texts([chunk.content for chunk in chunks])

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
        document.embedding_model = settings.EMBEDDING_MODEL
        document.error_message = None
        self.db.flush()

        return {
            "document_id": str(document.id),
            "chunk_count": len(chunks),
            "page_count": extracted.page_count,
            "embedding_model": settings.EMBEDDING_MODEL,
        }

    def _mark_failed(self, job_id: UUID, document_id: UUID, message: str) -> None:
        job = self.db.get(Job, job_id)
        document = self.db.get(Document, document_id)
        now = datetime.now(timezone.utc)
        if job is not None:
            job.status = JobStatus.FAILED.value
            job.error = message[:4000]
            job.completed_at = now
        if document is not None:
            document.status = DocumentStatus.FAILED.value
            document.error_message = message[:4000]
        self.db.commit()

    def _fail_job(self, job: Job, message: str) -> None:
        job.status = JobStatus.FAILED.value
        job.error = message[:4000]
        job.completed_at = datetime.now(timezone.utc)
        self.db.commit()
