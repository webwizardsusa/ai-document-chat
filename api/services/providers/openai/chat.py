"""OpenAI chat via LangChain."""

from __future__ import annotations

from collections.abc import Iterator

from langchain_core.messages import BaseMessage
from langchain_openai import ChatOpenAI

from core.config import settings
from services.providers.content import content_text


class OpenAIChatError(RuntimeError):
    pass


_llm_singleton: ChatOpenAI | None = None


def _llm() -> ChatOpenAI:
    global _llm_singleton
    if _llm_singleton is not None:
        return _llm_singleton
    api_key = settings.openai_api_key
    if not api_key:
        raise OpenAIChatError("OPENAI_API_KEY is not configured")
    _llm_singleton = ChatOpenAI(
        model=settings.OPENAI_CHAT_MODEL,
        api_key=api_key,
        temperature=0.2,
        request_timeout=60,
        max_retries=1,
    )
    return _llm_singleton


def stream_tokens(messages: list[BaseMessage]) -> Iterator[str]:
    for piece in _llm().stream(messages):
        text = content_text(getattr(piece, "content", None))
        if text:
            yield text
