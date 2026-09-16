from datetime import datetime, timezone
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
    verify_password,
)
from models.auth_session import AuthSession
from models.user import User
from modules.auth.schema import LoginRequest, RegisterRequest


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def login(self, data: LoginRequest) -> dict:
        email = normalize_email(data.email)
        user = self.db.scalar(select(User).where(User.email == email))

        if user is None or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
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
        email = normalize_email(data.email)
        user = User(
            name=data.name,
            email=email,
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
        try:
            session = self._lock_valid_session(refresh_token)
            user = self.db.scalar(select(User).where(User.id == session.user_id))

            if user is None or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token",
                )

            session.revoked_at = datetime.now(timezone.utc)
            self.db.add(session)
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
        """Revoke the session identified by refresh token. Idempotent if missing."""
        if not refresh_token:
            return

        now = datetime.now(timezone.utc)
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
                session.revoked_at = now
                self.db.add(session)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def logout_all(self, user_id: UUID) -> None:
        """Revoke every active session for the authenticated user."""
        now = datetime.now(timezone.utc)
        try:
            sessions = self.db.scalars(
                select(AuthSession)
                .where(
                    AuthSession.user_id == user_id,
                    AuthSession.revoked_at.is_(None),
                )
                .with_for_update()
            ).all()

            for session in sessions:
                session.revoked_at = now
                self.db.add(session)

            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def _issue_tokens(self, user: User) -> dict:
        """Create access + refresh session. Caller owns commit/rollback."""
        refresh_token = create_refresh_token()
        session = AuthSession(
            user_id=user.id,
            refresh_token_hash=hash_token(refresh_token),
            expires_at=refresh_token_expires_at(),
        )
        self.db.add(session)
        self.db.flush()

        return {
            "user": user,
            "access_token": create_access_token(user.id),
            "refresh_token": refresh_token,
        }

    def _lock_valid_session(self, refresh_token: str) -> AuthSession:
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

        expires_at = session.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired",
            )

        return session
