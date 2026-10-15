"""Auth HTTP routes: JWT access in body, refresh in HttpOnly cookie."""

from fastapi import APIRouter, HTTPException, Request, status

from core.config import settings
from core.cookies import clear_refresh_cookie, set_refresh_cookie
from core.deps import CurrentUserDep, DbDep
from core.rate_limit import AuthRateLimitDep
from core.responses import success
from modules.auth.schema import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    UserResponse,
)
from modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


def _auth_body(result: dict) -> dict:
    """Public auth payload — refresh token is cookie-only, not in JSON."""
    return AuthResponse(
        user=UserResponse.model_validate(result["user"]),
        access_token=result["access_token"],
    ).model_dump(mode="json")


def _resolve_refresh_token(
    request: Request,
    payload: RefreshRequest | LogoutRequest | None,
) -> str | None:
    # Prefer body override (tests/clients); default to cookie.
    if payload and payload.refresh_token:
        return payload.refresh_token
    return request.cookies.get(settings.REFRESH_COOKIE_NAME)


@router.post("/login")
def login(payload: LoginRequest, db: DbDep, _rate_limit: AuthRateLimitDep):
    result = AuthService(db).login(payload)
    response = success(message="Login successful", result=_auth_body(result))
    set_refresh_cookie(response, result["refresh_token"])
    return response


@router.post("/register")
def register(payload: RegisterRequest, db: DbDep, _rate_limit: AuthRateLimitDep):
    result = AuthService(db).register(payload)
    response = success(message="Registration successful", result=_auth_body(result))
    set_refresh_cookie(response, result["refresh_token"])
    return response


@router.post("/refresh")
def refresh(
    request: Request,
    db: DbDep,
    payload: RefreshRequest = RefreshRequest(),
):
    refresh_token = _resolve_refresh_token(request, payload)
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    result = AuthService(db).refresh(refresh_token)
    response = success(
        message="Token refreshed successfully",
        result=_auth_body(result),
    )
    set_refresh_cookie(response, result["refresh_token"])
    return response


@router.get("/me")
def me(current_user: CurrentUserDep):
    return success(
        message="User fetched successfully",
        result=UserResponse.model_validate(current_user),
    )


@router.post("/logout")
def logout(
    request: Request,
    db: DbDep,
    payload: LogoutRequest = LogoutRequest(),
):
    refresh_token = _resolve_refresh_token(request, payload)
    AuthService(db).logout_session(refresh_token)
    response = success(message="Logged out successfully")
    clear_refresh_cookie(response)
    return response


@router.post("/logout-all")
def logout_all(current_user: CurrentUserDep, db: DbDep):
    AuthService(db).logout_all(current_user.id)
    response = success(message="Logged out from all sessions")
    clear_refresh_cookie(response)
    return response
