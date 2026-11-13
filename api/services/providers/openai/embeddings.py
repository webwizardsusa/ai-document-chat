"""OpenAI embeddings via LangChain."""

from __future__ import annotations

from langchain_openai import OpenAIEmbeddings

from core.config import settings

class OpenAIEmbeddingError(RuntimeError):
    pass


_client_singleton: OpenAIEmbeddings | None = None


def _client() -> OpenAIEmbeddings:
    global _client_singleton
    if _client_singleton is not None:
        return _client_singleton
    api_key = settings.openai_api_key
    if not api_key:
        raise OpenAIEmbeddingError("OPENAI_API_KEY is not configured")
    _client_singleton = OpenAIEmbeddings(
        model=settings.OPENAI_EMBEDDING_MODEL,
        api_key=api_key,
        chunk_size=max(1, settings.EMBEDDING_BATCH_SIZE),
        timeout=60,
        max_retries=1,
    )
    return _client_singleton


def embed_documents(texts: list[str]) -> list[list[float]]:
    return [list(v) for v in _client().embed_documents(texts)]


def embed_query(text: str) -> list[float]:
    return list(_client().embed_query(text))
