from datetime import datetime
from uuid import uuid4, UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class MessageSource(Base):
    """Citation linking an assistant message to a retrieved chunk."""

    __tablename__ = "message_sources"
    __table_args__ = (
        UniqueConstraint(
            "message_id",
            "document_chunk_id",
            name="uq_message_sources_message_chunk",
        ),
        CheckConstraint(
            "rank IS NULL OR rank >= 1",
            name="ck_message_sources_rank",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    message_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_chunk_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("document_chunks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    relevance_score: Mapped[float | None] = mapped_column(Float)
    rank: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
