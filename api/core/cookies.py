from fastapi import Response

from core.config import settings


def _cookie_flags() -> dict:
    return {
        "httponly": True,
        "secure": settings.REFRESH_COOKIE_SECURE or settings.APP_ENV != "local",
        "samesite": settings.REFRESH_COOKIE_SAMESITE,
        "path": settings.REFRESH_COOKIE_PATH,
    }


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        **_cookie_flags(),
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        **_cookie_flags(),
    )
