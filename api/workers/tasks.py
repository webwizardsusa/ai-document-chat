"""Celery tasks."""

from __future__ import annotations

import logging
from uuid import UUID

from core.db import SessionLocal
from services.document_processing import DocumentProcessor
from workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="workers.tasks.process_document_job",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
    autoretry_for=(ConnectionError, TimeoutError),
    retry_backoff=True,
)
def process_document_job(self, job_id: str) -> dict:
    """Parse, chunk, embed, and store a document for a pending job."""
    logger.info("Processing document job %s (attempt %s)", job_id, self.request.retries + 1)
    db = SessionLocal()
    try:
        processor = DocumentProcessor(db)
        return processor.process_job(UUID(job_id))
    finally:
        db.close()
