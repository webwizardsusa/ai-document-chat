"""Retrieve relevant document chunks for a workspace question."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.config import settings
from models.document import Document
from models.document_chunk import DocumentChunk
from models.enums import DocumentStatus


@dataclass(frozen=True)
class RetrievedChunk:
    chunk_id: UUID
    document_id: UUID
    document_name: str
    content: str
    page_number: int | None
    score: float


def search_similar_chunks(
    db: Session,
    *,
    workspace_id: UUID,
    query_vector: list[float],
    top_k: int | None = None,
) -> list[RetrievedChunk]:
    """Cosine search over ready-document chunks (query vector already embedded)."""
    k = top_k if top_k is not None else settings.RAG_TOP_K
    k = max(1, min(k, 20))

    distance = DocumentChunk.embedding.cosine_distance(query_vector)
    rows = db.execute(
        select(
            DocumentChunk.id,
            DocumentChunk.document_id,
            DocumentChunk.content,
            DocumentChunk.page_number,
            Document.original_name,
            distance.label("distance"),
        )
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(
            Document.workspace_id == workspace_id,
            Document.status == DocumentStatus.READY.value,
            Document.embedding_model == settings.embedding_model,
            DocumentChunk.embedding.is_not(None),
        )
        .order_by(distance)
        .limit(k)
    ).all()

    results: list[RetrievedChunk] = []
    for row in rows:
        distance_value = float(row.distance) if row.distance is not None else 1.0
        # pgvector cosine_distance: 0 = identical; convert to similarity score.
        score = max(0.0, 1.0 - distance_value)
        results.append(
            RetrievedChunk(
                chunk_id=row.id,
                document_id=row.document_id,
                document_name=row.original_name,
                content=row.content,
                page_number=row.page_number,
                score=score,
            )
        )
    return results


def build_context(chunks: list[RetrievedChunk]) -> str:
    """Format chunks as numbered context blocks for the chat prompt."""
    if not chunks:
        return ""
    parts: list[str] = []
    for index, chunk in enumerate(chunks, start=1):
        page = f", page {chunk.page_number}" if chunk.page_number is not None else ""
        parts.append(f"[{index}] {chunk.document_name}{page}\n{chunk.content.strip()}")
    return "\n\n".join(parts)
