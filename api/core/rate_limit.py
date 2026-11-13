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
_WINDOW_SECONDS = 60


def _client() -> redis.Redis | None:
    """Lazy Redis client; limits no-op if Redis is down (fail open)."""
    global _redis
    if not settings.RATE_LIMIT_ENABLED:
        return None
    if _redis is None:
        try:
            redis_url = (settings.RATE_LIMIT_REDIS_URL or "").strip() or settings.CELERY_BROKER_URL
            _redis = redis.from_url(
                redis_url,
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
        # Always set TTL in the same round-trip so keys cannot stick forever.
        pipe = client.pipeline()
        pipe.incr(key)
        pipe.expire(key, _WINDOW_SECONDS)
        count, _ = pipe.execute()
        if int(count) > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again shortly.",
            )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Rate limit check failed for key %s", key)


def _client_ip(request: Request) -> str:
    """Peer IP by default; X-Forwarded-For only when TRUST_PROXY_HEADERS=true."""
    if settings.TRUST_PROXY_HEADERS:
        forwarded = (request.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
        if forwarded:
            return forwarded
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def rate_limit_auth(request: Request) -> None:
    _check(f"rl:auth:{_client_ip(request)}", settings.RATE_LIMIT_AUTH_PER_MINUTE)


def rate_limit_chat(user: CurrentUserDep) -> None:
    _check(f"rl:chat:{user.id}", settings.RATE_LIMIT_CHAT_PER_MINUTE)


def rate_limit_upload(user: CurrentUserDep) -> None:
    _check(f"rl:upload:{user.id}", settings.RATE_LIMIT_UPLOAD_PER_MINUTE)


AuthRateLimitDep = Annotated[None, Depends(rate_limit_auth)]
ChatRateLimitDep = Annotated[None, Depends(rate_limit_chat)]
UploadRateLimitDep = Annotated[None, Depends(rate_limit_upload)]
