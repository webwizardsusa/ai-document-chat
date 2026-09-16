from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from models.constants import VECTOR_DIMENSION


class Settings(BaseSettings):
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

    OPENAI_API_KEY: SecretStr | None = None
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    EMBEDDING_BATCH_SIZE: int = 64

    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

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

    @model_validator(mode="after")
    def reject_weak_jwt_in_non_local(self) -> "Settings":
        weak = {
            "change-me-to-a-long-random-secret",
            "changeme",
            "secret",
            "local-dev-only-change-me-32chars-min",
        }
        if self.APP_ENV != "local" and self.jwt_secret in weak:
            raise ValueError("JWT_SECRET_KEY must be a strong non-placeholder secret")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
