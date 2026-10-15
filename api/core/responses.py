"""Standard JSON envelope helpers: {status, message, result, errors}."""

from typing import Any, Mapping

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def api_response(
    *,
    success: bool,
    message: str,
    result: Any = None,
    errors: Any = None,
    status_code: int = 200,
    headers: Mapping[str, str] | None = None,
):
    return JSONResponse(
        status_code=status_code,
        headers=dict(headers) if headers else None,
        content=jsonable_encoder(
            {
                "status": success,
                "message": message,
                "result": result,
                "errors": errors,
            }
        ),
    )


def success(result=None, message="Success", status_code=200, headers=None):
    return api_response(
        success=True,
        message=message,
        result=result,
        errors=None,
        status_code=status_code,
        headers=headers,
    )


def error(message="Error", status_code=400, result=None, errors=None, headers=None):
    # Allow non-string message to become the errors payload.
    if isinstance(message, str):
        return api_response(
            success=False,
            message=message,
            result=result,
            errors=errors,
            status_code=status_code,
            headers=headers,
        )
    return api_response(
        success=False,
        message="Error",
        result=result,
        errors=errors if errors is not None else message,
        status_code=status_code,
        headers=headers,
    )


def unprocessable(message="Validation failed", errors=None, result=None, headers=None):
    return error(
        message=message,
        status_code=422,
        result=result,
        errors=errors,
        headers=headers,
    )


def internal_error(message="Internal Server Error", headers=None):
    return error(message=message, status_code=500, headers=headers)
