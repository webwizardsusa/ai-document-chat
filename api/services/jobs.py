"""Enqueue Celery jobs, mark failures, and reap abandoned work."""

from __future__ import annotations

import logging
from datetime import timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.config import settings
from core.time import ensure_utc, utcnow
from models.document import Document
from models.enums import DocumentStatus, JobStatus
from models.job import Job

logger = logging.getLogger(__name__)

# Shown on documents; job.error keeps the detailed ops message.
USER_FACING_FAILURE = "Document processing failed. Please try uploading again."
MAX_REENQUEUE = 3


def enqueue_document_process(job_id: UUID) -> None:
    # Late import avoids circular import with workers → processor.
    from workers.tasks import process_document_job

    process_document_job.delay(str(job_id))


def mark_job_failed(
    db: Session,
    job: Job | None,
    document: Document | None,
    detail: str,
    *,
    commit: bool = True,
) -> None:
    """Mark job (+ optional document) failed. Ops detail on job; generic text on document."""
    now = utcnow()
    if job is not None:
        job.status = JobStatus.FAILED.value
        job.error = detail[:4000]
        job.completed_at = now
    if document is not None and document.status != DocumentStatus.READY.value:
        document.status = DocumentStatus.FAILED.value
        document.error_message = USER_FACING_FAILURE
    if commit:
        db.commit()


def reap_stale_jobs(db: Session) -> dict[str, int]:
    """Beat task helper: re-enqueue abandoned jobs, or fail if too old."""
    now = utcnow()
    reenqueue_after = timedelta(minutes=max(1, settings.JOB_PENDING_REENQUEUE_MINUTES))
    fail_after = timedelta(minutes=max(1, settings.JOB_PENDING_FAIL_MINUTES))
    stale_running = timedelta(minutes=max(1, settings.JOB_STALE_MINUTES))

    stats = {"failed": 0, "reenqueued": 0, "skipped": 0}

    for job in _lock_jobs(db, JobStatus.PENDING.value):
        age = now - ensure_utc(job.created_at)
        if age >= fail_after:
            mark_job_failed(
                db,
                job,
                _document(db, job),
                "Processing timed out while waiting in queue",
                commit=False,
            )
            stats["failed"] += 1
        elif age >= reenqueue_after:
            if _try_reenqueue(db, job):
                stats["reenqueued"] += 1
            else:
                mark_job_failed(
                    db,
                    job,
                    _document(db, job),
                    "Processing could not be started after multiple attempts",
                    commit=False,
                )
                stats["failed"] += 1
        else:
            stats["skipped"] += 1

    for job in _lock_jobs(db, JobStatus.RUNNING.value):
        started = ensure_utc(job.started_at) if job.started_at else None
        if started is None or (now - started) >= stale_running:
            if _try_reenqueue(db, job, reset_to_pending=True):
                stats["reenqueued"] += 1
            else:
                mark_job_failed(
                    db,
                    job,
                    _document(db, job),
                    "Processing stalled and could not be restarted",
                    commit=False,
                )
                stats["failed"] += 1
        else:
            stats["skipped"] += 1

    db.commit()
    return stats


def _lock_jobs(db: Session, status: str) -> list[Job]:
    return list(
        db.scalars(
            select(Job).where(Job.status == status).with_for_update(skip_locked=True)
        ).all()
    )


def _document(db: Session, job: Job) -> Document | None:
    return db.get(Document, job.document_id) if job.document_id else None


def _try_reenqueue(db: Session, job: Job, *, reset_to_pending: bool = False) -> bool:
    payload = dict(job.payload or {})
    count = int(payload.get("reenqueue_count", 0))
    if count >= MAX_REENQUEUE:
        return False

    payload["reenqueue_count"] = count + 1
    job.payload = payload
    if reset_to_pending:
        job.status = JobStatus.PENDING.value
        job.started_at = None
        job.error = None
        document = _document(db, job)
        if document is not None and document.status == DocumentStatus.PROCESSING.value:
            document.status = DocumentStatus.UPLOADED.value
            document.error_message = None
    db.flush()

    try:
        enqueue_document_process(job.id)
        logger.info("Re-enqueued job %s (attempt %s)", job.id, count + 1)
        return True
    except Exception:
        logger.exception("Failed to re-enqueue job %s", job.id)
        return False
