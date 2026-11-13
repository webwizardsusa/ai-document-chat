"""Request ID + timing middleware for production logs (pure ASGI — safe with SSE)."""

from __future__ import annotations

import logging
import time
import uuid

from starlette.types import ASGIApp, Message, Receive, Scope, Send

logger = logging.getLogger("api.request")


class RequestIdMiddleware:
    """Attach X-Request-ID and log method/path/status/duration without buffering the body."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = {
            key.decode("latin-1").lower(): value.decode("latin-1")
            for key, value in scope.get("headers", [])
        }
        request_id = headers.get("x-request-id") or str(uuid.uuid4())
        scope.setdefault("state", {})
        # Starlette Request.state reads from scope["state"]
        if not isinstance(scope.get("state"), dict):
            scope["state"] = {}
        scope["state"]["request_id"] = request_id

        started = time.perf_counter()
        status_code = 500

        async def send_wrapper(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = int(message.get("status", 500))
                raw_headers = list(message.get("headers") or [])
                raw_headers.append((b"x-request-id", request_id.encode("latin-1")))
                message = {**message, "headers": raw_headers}
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            duration_ms = (time.perf_counter() - started) * 1000
            path = scope.get("path", "")
            method = scope.get("method", "")
            logger.info(
                "request completed request_id=%s method=%s path=%s status_code=%s duration_ms=%.2f",
                request_id,
                method,
                path,
                status_code,
                duration_ms,
            )
