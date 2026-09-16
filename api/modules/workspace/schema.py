from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CreateWorkspaceRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be empty")
        return value


class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    document_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
