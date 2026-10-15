"""Workspace chat: retrieve → generate → persist user/assistant messages."""

from __future__ import annotations

import json
from collections.abc import Iterator
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from models.document import Document
from models.document_chunk import DocumentChunk
from models.enums import DocumentStatus, SenderType
from models.message import Message
from models.message_source import MessageSource
from models.user import User
from modules.chat.schema import (
    AskMessageRequest,
    AskMessageResponse,
    MessageResponse,
    MessageSourceResponse,
)
from modules.workspace.service import WorkspaceService
from services.embeddings import EmbeddingError, embed_query
from services.rag import RetrievedChunk, search_similar_chunks
from services.rag.generate import (
    ChatGenerationError,
    generate_answer,
    iter_answer_tokens,
)


class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.workspaces = WorkspaceService(db)

    def list_messages(self, workspace_id: UUID, user: User) -> list[MessageResponse]:
        self.workspaces.get_owned(workspace_id, user)
        messages = list(
            self.db.scalars(
                select(Message)
                .where(Message.workspace_id == workspace_id)
                .order_by(Message.created_at.asc())
            ).all()
        )
        sources_by_message = self._load_sources(
            [m.id for m in messages if m.sender_type == SenderType.ASSISTANT.value]
        )
        return [
            self._to_response(m, sources=sources_by_message.get(m.id, []))
            for m in messages
        ]

    def clear_messages(self, workspace_id: UUID, user: User) -> int:
        """Delete all messages in an owned workspace (sources cascade)."""
        self.workspaces.get_owned(workspace_id, user)
        result = self.db.execute(
            delete(Message).where(Message.workspace_id == workspace_id)
        )
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        return int(result.rowcount or 0)

    def ask(
        self,
        workspace_id: UUID,
        user: User,
        data: AskMessageRequest,
    ) -> AskMessageResponse:
        chunks = self._retrieve(workspace_id, user, data.content)
        try:
            answer = generate_answer(data.content, chunks)
        except ChatGenerationError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI chat is not available right now",
            ) from exc
        return self._persist(workspace_id, data.content, answer, chunks)

    def ask_stream(
        self,
        workspace_id: UUID,
        user: User,
        data: AskMessageRequest,
    ) -> Iterator[str]:
        """SSE: token events, then done with persisted messages."""
        try:
            chunks = self._retrieve(workspace_id, user, data.content)
        except HTTPException as exc:
            yield _sse("error", {"message": str(exc.detail)})
            return

        parts: list[str] = []
        try:
            for token in iter_answer_tokens(data.content, chunks):
                parts.append(token)
                yield _sse("token", {"text": token})
        except ChatGenerationError:
            yield _sse("error", {"message": "AI chat is not available right now"})
            return

        answer = "".join(parts).strip()
        if not answer:
            yield _sse("error", {"message": "Empty model response"})
            return

        try:
            result = self._persist(workspace_id, data.content, answer, chunks)
        except Exception:
            yield _sse("error", {"message": "Failed to save messages"})
            return

        yield _sse("done", result.model_dump(mode="json"))

    def _retrieve(
        self,
        workspace_id: UUID,
        user: User,
        question: str,
    ) -> list[RetrievedChunk]:
        self.workspaces.get_owned(workspace_id, user)
        ready_count = self.db.scalar(
            select(func.count())
            .select_from(Document)
            .where(
                Document.workspace_id == workspace_id,
                Document.status == DocumentStatus.READY.value,
            )
        )
        if not ready_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Upload and wait for at least one ready document before chatting",
            )

        try:
            query_vector = embed_query(question)
        except EmbeddingError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI embeddings are not available right now",
            ) from exc

        chunks = search_similar_chunks(
            self.db,
            workspace_id=workspace_id,
            query_vector=query_vector,
        )
        # Release DB connection before LLM latency.
        self.db.commit()
        return chunks

    def _persist(
        self,
        workspace_id: UUID,
        question: str,
        answer: str,
        chunks: list[RetrievedChunk],
    ) -> AskMessageResponse:
        user_message = Message(
            workspace_id=workspace_id,
            sender_type=SenderType.USER.value,
            content=question,
        )
        assistant_message = Message(
            workspace_id=workspace_id,
            sender_type=SenderType.ASSISTANT.value,
            content=answer,
        )
        self.db.add(user_message)
        self.db.add(assistant_message)

        try:
            self.db.flush()
            for rank, chunk in enumerate(chunks, start=1):
                self.db.add(
                    MessageSource(
                        message_id=assistant_message.id,
                        document_chunk_id=chunk.chunk_id,
                        relevance_score=chunk.score,
                        rank=rank,
                    )
                )
            self.db.commit()
            self.db.refresh(user_message)
            self.db.refresh(assistant_message)
        except Exception:
            self.db.rollback()
            raise

        sources = self._load_sources([assistant_message.id]).get(assistant_message.id, [])
        return AskMessageResponse(
            user_message=self._to_response(user_message),
            assistant_message=self._to_response(assistant_message, sources=sources),
        )

    def _to_response(
        self,
        message: Message,
        *,
        sources: list[MessageSourceResponse] | None = None,
    ) -> MessageResponse:
        return MessageResponse(
            id=message.id,
            workspace_id=message.workspace_id,
            sender_type=message.sender_type,
            content=message.content,
            created_at=message.created_at,
            sources=sources or [],
        )

    def _load_sources(
        self,
        message_ids: list[UUID],
    ) -> dict[UUID, list[MessageSourceResponse]]:
        """Batch-load citations (avoids N+1)."""
        if not message_ids:
            return {}

        rows = self.db.execute(
            select(
                MessageSource.id,
                MessageSource.message_id,
                MessageSource.document_chunk_id,
                MessageSource.relevance_score,
                MessageSource.rank,
                DocumentChunk.document_id,
                DocumentChunk.content,
                DocumentChunk.page_number,
                Document.original_name,
            )
            .join(DocumentChunk, DocumentChunk.id == MessageSource.document_chunk_id)
            .join(Document, Document.id == DocumentChunk.document_id)
            .where(MessageSource.message_id.in_(message_ids))
            .order_by(
                MessageSource.message_id.asc(),
                MessageSource.rank.asc().nulls_last(),
                MessageSource.created_at.asc(),
            )
        ).all()

        grouped: dict[UUID, list[MessageSourceResponse]] = {
            message_id: [] for message_id in message_ids
        }
        for row in rows:
            text = " ".join(row.content.split())
            excerpt = text if len(text) <= 180 else f"{text[:179]}…"
            grouped[row.message_id].append(
                MessageSourceResponse(
                    id=row.id,
                    document_chunk_id=row.document_chunk_id,
                    document_id=row.document_id,
                    document_name=row.original_name,
                    page_number=row.page_number,
                    excerpt=excerpt,
                    relevance_score=row.relevance_score,
                    rank=row.rank,
                )
            )
        return grouped


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"
