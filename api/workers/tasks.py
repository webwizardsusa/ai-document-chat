"""Celery tasks for async document processing and job reaping."""

from __future__ import annotations

import logging
from uuid import UUID

from core.db import SessionLocal
from services.document_processing import DocumentProcessor
from services.jobs import reap_stale_jobs as reap_stale_jobs_service
from workers.celery_app import celery_app

logger = logging.getLogger(__name__)


def _with_db(fn):
    """Open a DB session for a Celery task and always close it."""
    db = SessionLocal()
    try:
        return fn(db)
    finally:
        db.close()


@celery_app.task(
    name="workers.tasks.process_document_job",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
    autoretry_for=(ConnectionError, TimeoutError),
    retry_backoff=True,
)
def process_document_job(self, job_id: str) -> dict:
    """Parse, chunk, embed, and store a document."""
    logger.info(
        "Processing document job %s (attempt %s)",
        job_id,
        self.request.retries + 1,
    )
    try:
        return _with_db(lambda db: DocumentProcessor(db).process_job(UUID(job_id)))
    except Exception:
        logger.exception("Document job %s failed", job_id)
        raise


@celery_app.task(name="workers.tasks.reap_stale_jobs")
def reap_stale_jobs() -> dict:
    """Beat task: re-enqueue or fail abandoned PENDING/RUNNING jobs."""
    stats = _with_db(reap_stale_jobs_service)
    logger.info("Job reaper finished: %s", stats)
    return stats
