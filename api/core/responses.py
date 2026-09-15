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
    return api_response(
        success=False,
        message=message if isinstance(message, str) else "Error",
        result=result,
        errors=errors if errors is not None else (
            message if not isinstance(message, str) else None
        ),
        status_code=status_code,
        headers=headers,
    )


def unprocessable(message="Validation failed", errors=None, result=None, headers=None):
    return api_response(
        success=False,
        message=message if isinstance(message, str) else "Validation failed",
        result=result,
        errors=errors if errors is not None else (
            message if not isinstance(message, str) else None
        ),
        status_code=422,
        headers=headers,
    )


def internal_error(message="Internal Server Error", headers=None):
    return api_response(
        success=False,
        message=message,
        result=None,
        errors=None,
        status_code=500,
        headers=headers,
    )


def not_found(message="Not Found", headers=None):
    return api_response(
        success=False,
        message=message,
        result=None,
        errors=None,
        status_code=404,
        headers=headers,
    )
