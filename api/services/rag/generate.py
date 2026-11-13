"""Answer workspace questions — dispatches chat to AI_PROVIDER."""

from __future__ import annotations

from collections.abc import Iterator

from langchain_core.messages import HumanMessage, SystemMessage

from services.providers import get_ai_provider
from services.rag import RetrievedChunk, build_context

SYSTEM_PROMPT = """You are a helpful assistant for an AI document chat product.
Answer using only the provided document context.
If the context is empty or does not contain the answer, say you could not find that in the uploaded documents.
Be concise and accurate. When helpful, refer to sources by their bracket numbers like [1]."""


class ChatGenerationError(RuntimeError):
    pass


def _build_messages(question: str, chunks: list[RetrievedChunk]) -> list:
    context = build_context(chunks)
    if context:
        user_prompt = (
            f"Document context:\n{context}\n\n"
            f"Question: {question.strip()}\n\n"
            "Answer based on the context above."
        )
    else:
        user_prompt = (
            f"Document context: (none)\n\n"
            f"Question: {question.strip()}\n\n"
            "There is no retrieved context. Tell the user you could not find relevant "
            "information in their uploaded documents."
        )
    return [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_prompt),
    ]


def iter_answer_tokens(question: str, chunks: list[RetrievedChunk]) -> Iterator[str]:
    """Stream answer tokens (no DB access)."""
    messages = _build_messages(question, chunks)
    if get_ai_provider() == "gemini":
        from services.providers.gemini import chat as backend
    else:
        from services.providers.openai import chat as backend
    try:
        yield from backend.stream_tokens(messages)
    except ChatGenerationError:
        raise
    except RuntimeError as exc:
        raise ChatGenerationError(str(exc) or "Failed to generate an answer") from exc
    except Exception as exc:  # noqa: BLE001
        raise ChatGenerationError("Failed to generate an answer") from exc


def generate_answer(question: str, chunks: list[RetrievedChunk]) -> str:
    """Non-streaming answer — same path as stream, then join."""
    text = "".join(iter_answer_tokens(question, chunks)).strip()
    if not text:
        raise ChatGenerationError("Empty model response")
    return text
