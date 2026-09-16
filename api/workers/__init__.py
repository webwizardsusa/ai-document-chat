"""Background workers (Celery document processing jobs)."""

from workers.celery_app import celery_app

__all__ = ["celery_app"]
