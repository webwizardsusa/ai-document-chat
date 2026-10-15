"""Redis fixed-window rate limits for auth, upload, and chat."""

from __future__ import annotations

import logging
from typing import Annotated

import redis
from fastapi import Depends, HTTPException, Request, status

from core.config import settings
from core.deps import CurrentUserDep

logger = logging.getLogger(__name__)

_redis: redis.Redis | None = None


def _client() -> redis.Redis | None:
    """Lazy Redis client; limits no-op if Redis is down (fail open)."""
    global _redis
    if not settings.RATE_LIMIT_ENABLED:
        return None
    if _redis is None:
        try:
            _redis = redis.from_url(
                settings.CELERY_BROKER_URL,
                decode_responses=True,
                socket_connect_timeout=1,
                socket_timeout=1,
            )
        except Exception:
            logger.exception("Rate-limit Redis client init failed")
            return None
    return _redis


def _check(key: str, limit: int) -> None:
    if limit <= 0:
        return
    client = _client()
    if client is None:
        return
    try:
        count = int(client.incr(key))
        if count == 1:
            client.expire(key, 60)
        if count > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again shortly.",
            )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Rate limit check failed for key %s", key)


def rate_limit_auth(request: Request) -> None:
    ip = (request.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
    if not ip and request.client:
        ip = request.client.host
    _check(f"rl:auth:{ip or 'unknown'}", settings.RATE_LIMIT_AUTH_PER_MINUTE)


def rate_limit_chat(user: CurrentUserDep) -> None:
    _check(f"rl:chat:{user.id}", settings.RATE_LIMIT_CHAT_PER_MINUTE)


def rate_limit_upload(user: CurrentUserDep) -> None:
    _check(f"rl:upload:{user.id}", settings.RATE_LIMIT_UPLOAD_PER_MINUTE)


AuthRateLimitDep = Annotated[None, Depends(rate_limit_auth)]
ChatRateLimitDep = Annotated[None, Depends(rate_limit_chat)]
UploadRateLimitDep = Annotated[None, Depends(rate_limit_upload)]
