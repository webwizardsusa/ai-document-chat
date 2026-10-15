"""Auth domain logic: login, register, refresh rotation, logout."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token,
    normalize_email,
    refresh_token_expires_at,
    verify_password_or_dummy,
)
from core.time import ensure_utc, utcnow
from models.auth_session import AuthSession
from models.user import User
from modules.auth.schema import LoginRequest, RegisterRequest


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def login(self, data: LoginRequest) -> dict:
        email = normalize_email(data.email)
        user = self.db.scalar(select(User).where(User.email == email))

        # Always verify (dummy hash if unknown) to reduce email-timing leaks.
        password_ok = verify_password_or_dummy(
            data.password,
            user.password_hash if user is not None else None,
        )
        if user is None or not password_ok or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        try:
            result = self._issue_tokens(user)
            self.db.commit()
            self.db.refresh(user)
            return result
        except Exception:
            self.db.rollback()
            raise

    def register(self, data: RegisterRequest) -> dict:
        user = User(
            name=data.name,
            email=normalize_email(data.email),
            password_hash=hash_password(data.password),
            is_active=True,
        )
        self.db.add(user)

        try:
            self.db.flush()
            result = self._issue_tokens(user)
            self.db.commit()
            self.db.refresh(user)
            return result
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        except Exception:
            self.db.rollback()
            raise

    def refresh(self, refresh_token: str) -> dict:
        """Rotate refresh: lock session → revoke old → issue new (single commit)."""
        try:
            session = self._lock_valid_session(refresh_token)
            user = self.db.scalar(select(User).where(User.id == session.user_id))
            if user is None or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token",
                )

            session.revoked_at = utcnow()
            self.db.flush()
            result = self._issue_tokens(user)
            self.db.commit()
            self.db.refresh(user)
            return result
        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise

    def logout_session(self, refresh_token: str | None) -> None:
        """Revoke the session for this refresh token. Idempotent if missing."""
        if not refresh_token:
            return
        try:
            session = self.db.scalar(
                select(AuthSession)
                .where(
                    AuthSession.refresh_token_hash == hash_token(refresh_token),
                    AuthSession.revoked_at.is_(None),
                )
                .with_for_update()
            )
            if session is not None:
                session.revoked_at = utcnow()
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def logout_all(self, user_id: UUID) -> None:
        """Revoke every active session for the authenticated user."""
        try:
            sessions = self.db.scalars(
                select(AuthSession)
                .where(
                    AuthSession.user_id == user_id,
                    AuthSession.revoked_at.is_(None),
                )
                .with_for_update()
            ).all()
            now = utcnow()
            for session in sessions:
                session.revoked_at = now
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def _issue_tokens(self, user: User) -> dict:
        """Create access JWT + hashed refresh session. Caller owns commit/rollback."""
        refresh_token = create_refresh_token()
        self.db.add(
            AuthSession(
                user_id=user.id,
                refresh_token_hash=hash_token(refresh_token),
                expires_at=refresh_token_expires_at(),
            )
        )
        self.db.flush()
        return {
            "user": user,
            "access_token": create_access_token(user.id),
            "refresh_token": refresh_token,
        }

    def _lock_valid_session(self, refresh_token: str) -> AuthSession:
        """SELECT … FOR UPDATE so concurrent refresh cannot reuse the same token."""
        session = self.db.scalar(
            select(AuthSession)
            .where(AuthSession.refresh_token_hash == hash_token(refresh_token))
            .with_for_update()
        )
        if session is None or session.revoked_at is not None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        if ensure_utc(session.expires_at) < utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired",
            )
        return session
