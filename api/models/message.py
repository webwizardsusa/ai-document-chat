from datetime import datetime
from uuid import uuid4, UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Message(Base):
    """Chat turn: sender_type is user or assistant (no Q/A pairing table)."""

    __tablename__ = "messages"
    __table_args__ = (
        CheckConstraint(
            "sender_type IN ('user', 'assistant')",
            name="ck_messages_sender_type",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    workspace_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_type: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
