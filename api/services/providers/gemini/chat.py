"""Gemini chat via LangChain."""

from __future__ import annotations

from collections.abc import Iterator

from langchain_core.messages import BaseMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from core.config import settings
from services.providers.content import content_text


class GeminiChatError(RuntimeError):
    pass


_llm_singleton: ChatGoogleGenerativeAI | None = None


def _llm() -> ChatGoogleGenerativeAI:
    global _llm_singleton
    if _llm_singleton is not None:
        return _llm_singleton
    api_key = settings.gemini_api_key
    if not api_key:
        raise GeminiChatError("GEMINI_API_KEY is not configured")
    _llm_singleton = ChatGoogleGenerativeAI(
        model=settings.GEMINI_CHAT_MODEL,
        google_api_key=api_key,
        temperature=0.2,
        timeout=60,
        max_retries=1,
    )
    return _llm_singleton


def stream_tokens(messages: list[BaseMessage]) -> Iterator[str]:
    for piece in _llm().stream(messages):
        text = content_text(getattr(piece, "content", None))
        if text:
            yield text
