"""Map exceptions to the standard API envelope."""

import logging

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError

from core.responses import error, internal_error, unprocessable

logger = logging.getLogger(__name__)


def register_exception_handlers(app):

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ):
        return unprocessable(
            message="Validation failed",
            errors=exc.errors(include_input=False),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request,
        exc: HTTPException,
    ):
        detail = exc.detail
        headers = exc.headers
        if isinstance(detail, str):
            return error(
                message=detail,
                status_code=exc.status_code,
                headers=headers,
            )
        return error(
            message="Request failed",
            status_code=exc.status_code,
            errors=detail,
            headers=headers,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request,
        exc: Exception,
    ):
        request_id = getattr(request.state, "request_id", None)
        logger.exception(
            "Unhandled exception request_id=%s method=%s path=%s",
            request_id,
            request.method,
            request.url.path,
        )
        return internal_error(message="Internal Server Error")
