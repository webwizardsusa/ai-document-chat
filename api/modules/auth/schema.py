"""Auth request/response schemas."""

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be empty")
        return value


class RefreshRequest(BaseModel):
    refresh_token: str | None = None


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    is_active: bool

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"
