"""LangChain OpenAI embeddings for document chunks and queries."""

from __future__ import annotations

from langchain_openai import OpenAIEmbeddings

from core.config import settings
from models.constants import VECTOR_DIMENSION


class EmbeddingError(RuntimeError):
    pass


def _client() -> OpenAIEmbeddings:
    api_key = settings.openai_api_key
    if not api_key:
        raise EmbeddingError("OPENAI_API_KEY is not configured")
    return OpenAIEmbeddings(
        model=settings.EMBEDDING_MODEL,
        api_key=api_key,
        chunk_size=max(1, settings.EMBEDDING_BATCH_SIZE),
        timeout=60,
        max_retries=1,
    )


def _validate_dimension(vector: list[float]) -> list[float]:
    if len(vector) != VECTOR_DIMENSION:
        raise EmbeddingError(
            f"Embedding dimension {len(vector)} does not match "
            f"schema VECTOR_DIMENSION={VECTOR_DIMENSION}"
        )
    return vector


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Batch-embed chunk texts for storage in pgvector."""
    if not texts:
        return []

    vectors = _client().embed_documents(texts)
    if len(vectors) != len(texts):
        raise EmbeddingError("Embedding API returned unexpected vector count")
    return [_validate_dimension(list(v)) for v in vectors]


def embed_query(text: str) -> list[float]:
    """Embed a single search/chat query."""
    query = text.strip()
    if not query:
        raise EmbeddingError("Query text is empty")
    return _validate_dimension(list(_client().embed_query(query)))
