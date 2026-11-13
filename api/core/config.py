from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from models.constants import VECTOR_DIMENSION

# Committed example / placeholder secrets — never allow outside APP_ENV=local.
_WEAK_JWT_SECRETS = frozenset(
    {
        "change-me-to-a-long-random-secret",
        "changeme",
        "secret",
        "local-dev-only-change-me-32chars-min",
        "replace-with-a-unique-random-secret-at-least-32-chars",
        "BFwiMx8o59jwmWmOh8ADiHuKc7NmAV8qJKjpr0D8ahxv5d5TbpFt1eYcM2e4ymAB",
    }
)


class Settings(BaseSettings):
    """App settings loaded from env / .env. Prefer absolute STORAGE_ROOT in all envs."""

    APP_ENV: Literal["local", "development", "staging", "production"] = "local"
    FRONTEND_URL: str
    DATABASE_URL: str
    STORAGE_ROOT: Path = Path("uploads")

    JWT_SECRET_KEY: SecretStr = Field(min_length=32)
    JWT_ALGORITHM: Literal["HS256"] = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    REFRESH_COOKIE_NAME: str = "refresh_token"
    REFRESH_COOKIE_PATH: str = "/api/v1/auth"
    REFRESH_COOKIE_SECURE: bool = False
    REFRESH_COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"

    AI_PROVIDER: Literal["openai", "gemini"] = "openai"
    OPENAI_API_KEY: SecretStr | None = None
    GEMINI_API_KEY: SecretStr | None = None
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"
    GEMINI_EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    GEMINI_CHAT_MODEL: str = "gemini-3.5-flash-lite"
    # Character counts for LangChain splitter (not tokens).
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    EMBEDDING_BATCH_SIZE: int = 64
    RAG_TOP_K: int = 5
    # Reclaim Celery jobs stuck in "running" after a worker crash.
    JOB_STALE_MINUTES: int = 30
    # Beat reaper: re-enqueue abandoned PENDING, then fail if still stuck.
    JOB_PENDING_REENQUEUE_MINUTES: int = 5
    JOB_PENDING_FAIL_MINUTES: int = 120
    JOB_REAPER_INTERVAL_SECONDS: int = 60

    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE: int = 1800

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_AUTH_PER_MINUTE: int = 20
    RATE_LIMIT_CHAT_PER_MINUTE: int = 30
    RATE_LIMIT_UPLOAD_PER_MINUTE: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def vector_dimension(self) -> int:
        return VECTOR_DIMENSION

    @property
    def jwt_secret(self) -> str:
        return self.JWT_SECRET_KEY.get_secret_value()

    @property
    def openai_api_key(self) -> str | None:
        if self.OPENAI_API_KEY is None:
            return None
        value = self.OPENAI_API_KEY.get_secret_value().strip()
        return value or None

    @property
    def gemini_api_key(self) -> str | None:
        if self.GEMINI_API_KEY is None:
            return None
        value = self.GEMINI_API_KEY.get_secret_value().strip()
        return value or None

    @property
    def embedding_model(self) -> str:
        if self.AI_PROVIDER == "gemini":
            return self.GEMINI_EMBEDDING_MODEL
        return self.OPENAI_EMBEDDING_MODEL

    @property
    def chat_model(self) -> str:
        if self.AI_PROVIDER == "gemini":
            return self.GEMINI_CHAT_MODEL
        return self.OPENAI_CHAT_MODEL

    @model_validator(mode="after")
    def validate_security_settings(self) -> "Settings":
        # API + Celery must share the same absolute upload root.
        object.__setattr__(self, "STORAGE_ROOT", self.STORAGE_ROOT.expanduser().resolve())

        if self.CHUNK_OVERLAP >= self.CHUNK_SIZE:
            raise ValueError("CHUNK_OVERLAP must be smaller than CHUNK_SIZE")

        # Browsers require Secure when SameSite=None.
        if self.REFRESH_COOKIE_SAMESITE == "none" and not self.REFRESH_COOKIE_SECURE:
            raise ValueError(
                "REFRESH_COOKIE_SAMESITE=none requires REFRESH_COOKIE_SECURE=true"
            )

        if self.APP_ENV != "local" and self.jwt_secret in _WEAK_JWT_SECRETS:
            raise ValueError(
                "JWT_SECRET_KEY must be a strong unique secret in non-local environments"
            )

        if self.AI_PROVIDER == "openai" and not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required when AI_PROVIDER=openai")
        if self.AI_PROVIDER == "gemini" and not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required when AI_PROVIDER=gemini")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
