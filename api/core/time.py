"""UTC datetime helpers used across auth, jobs, and workers."""

from datetime import datetime, timezone


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def ensure_utc(value: datetime) -> datetime:
    """Treat naive datetimes as UTC (Postgres may return naive values)."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value
