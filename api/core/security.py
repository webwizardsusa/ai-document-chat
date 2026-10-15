"""Password hashing, JWT access tokens, and current-user dependency."""

from datetime import timedelta
from hashlib import sha256
from secrets import token_urlsafe
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.config import settings
from core.db import get_db
from core.time import utcnow
from models.user import User

password_hash = PasswordHash.recommended()
# Missing bearer → None (we map to 401 ourselves, not FastAPI's default 403).
bearer_scheme = HTTPBearer(auto_error=False)

# Precomputed Argon2 hash used only to equalize login timing when email is unknown.
_DUMMY_PASSWORD_HASH = (
    "$argon2id$v=19$m=65536,t=3,p=4$NSOeARuB5TY09MexaebwOg$"
    "gdOHYzgDvEqDWO2+C6th4Apjp8tELvZ0znwdpRdxV74"
)


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def verify_password_or_dummy(password: str, hashed_password: str | None) -> bool:
    """Always run a verify so missing users don't fail faster than real ones."""
    return verify_password(password, hashed_password or _DUMMY_PASSWORD_HASH)


def normalize_email(email: str) -> str:
    return str(email).strip().lower()


def hash_token(token: str) -> str:
    """Hash refresh tokens before storing (never store raw refresh tokens)."""
    return sha256(token.encode("utf-8")).hexdigest()


def create_access_token(user_id: UUID) -> str:
    expire = utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token() -> str:
    return token_urlsafe(48)


def refresh_token_expires_at():
    return utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> User:
    """Resolve Bearer access JWT → active user (401 on any failure)."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise credentials_exception

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != "access":
            raise credentials_exception
        user_id = UUID(str(payload["sub"]))
    except (JWTError, KeyError, TypeError, ValueError):
        raise credentials_exception

    user = db.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active:
        raise credentials_exception

    return user
