"""Celery application for background document processing + beat reaper."""

from celery import Celery
from celery.schedules import schedule

from core.config import settings

celery_app = Celery(
    "ai_document",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    # Ack after success so a crash redelivers; pair with stale RUNNING reclaim.
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_queue="document_processing",
    broker_connection_retry_on_startup=True,
    task_soft_time_limit=600,
    task_time_limit=720,
    beat_schedule={
        "reap-stale-document-jobs": {
            "task": "workers.tasks.reap_stale_jobs",
            "schedule": schedule(run_every=max(15, settings.JOB_REAPER_INTERVAL_SECONDS)),
        },
    },
)
