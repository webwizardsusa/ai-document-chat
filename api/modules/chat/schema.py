"""Chat request/response schemas (messages + citation sources)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class AskMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4000)

    @field_validator("content")
    @classmethod
    def strip_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty")
        return value


class MessageSourceResponse(BaseModel):
    id: UUID
    document_chunk_id: UUID
    document_id: UUID
    document_name: str
    page_number: int | None = None
    excerpt: str | None = None
    relevance_score: float | None = None
    rank: int | None = None

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    sender_type: str
    content: str
    created_at: datetime
    sources: list[MessageSourceResponse] = []

    model_config = {"from_attributes": True}


class AskMessageResponse(BaseModel):
    user_message: MessageResponse
    assistant_message: MessageResponse
