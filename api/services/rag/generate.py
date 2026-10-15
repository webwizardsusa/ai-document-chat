"""Answer workspace questions with LangChain OpenAI chat."""

from __future__ import annotations

from collections.abc import Iterator

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from core.config import settings
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


def _llm() -> ChatOpenAI:
    api_key = settings.openai_api_key
    if not api_key:
        raise ChatGenerationError("OPENAI_API_KEY is not configured")
    return ChatOpenAI(
        model=settings.CHAT_MODEL,
        api_key=api_key,
        temperature=0.2,
        request_timeout=60,
        max_retries=1,
    )


def _content_text(content: object) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and item.get("type") == "text":
                parts.append(str(item.get("text", "")))
        return "".join(parts)
    return ""


def iter_answer_tokens(question: str, chunks: list[RetrievedChunk]) -> Iterator[str]:
    """Stream answer tokens (no DB access)."""
    try:
        for piece in _llm().stream(_build_messages(question, chunks)):
            text = _content_text(getattr(piece, "content", None))
            if text:
                yield text
    except ChatGenerationError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise ChatGenerationError("Failed to generate an answer") from exc


def generate_answer(question: str, chunks: list[RetrievedChunk]) -> str:
    """Non-streaming answer — same path as stream, then join."""
    text = "".join(iter_answer_tokens(question, chunks)).strip()
    if not text:
        raise ChatGenerationError("Empty model response")
    return text
