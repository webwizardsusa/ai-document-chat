from datetime import datetime
from uuid import uuid4, UUID

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base
from .constants import VECTOR_DIMENSION


class DocumentChunk(Base):
    """Embedded text slice used for RAG retrieval (pgvector)."""

    __tablename__ = "document_chunks"
    __table_args__ = (
        UniqueConstraint(
            "document_id",
            "chunk_index",
            name="uq_document_chunks_document_chunk",
        ),
        CheckConstraint("chunk_index >= 0", name="ck_document_chunks_chunk_index"),
        CheckConstraint(
            "page_number IS NULL OR page_number >= 0",
            name="ck_document_chunks_page_number",
        ),
        CheckConstraint(
            "token_count IS NULL OR token_count >= 0",
            name="ck_document_chunks_token_count",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    document_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    page_number: Mapped[int | None] = mapped_column(Integer)
    token_count: Mapped[int | None] = mapped_column(Integer)
    chunk_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB)
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(VECTOR_DIMENSION),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
