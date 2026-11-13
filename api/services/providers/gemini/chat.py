"""Gemini chat via LangChain."""

from __future__ import annotations

from collections.abc import Iterator

from langchain_core.messages import BaseMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from core.config import settings


class GeminiChatError(RuntimeError):
    pass


def _llm() -> ChatGoogleGenerativeAI:
    api_key = settings.gemini_api_key
    if not api_key:
        raise GeminiChatError("GEMINI_API_KEY is not configured")
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_CHAT_MODEL,
        google_api_key=api_key,
        temperature=0.2,
        timeout=60,
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


def stream_tokens(messages: list[BaseMessage]) -> Iterator[str]:
    for piece in _llm().stream(messages):
        text = _content_text(getattr(piece, "content", None))
        if text:
            yield text
