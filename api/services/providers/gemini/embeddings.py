"""Gemini embeddings via LangChain (always request VECTOR_DIMENSION)."""

from __future__ import annotations

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from core.config import settings
from models.constants import VECTOR_DIMENSION


class GeminiEmbeddingError(RuntimeError):
    pass


def _client() -> GoogleGenerativeAIEmbeddings:
    api_key = settings.gemini_api_key
    if not api_key:
        raise GeminiEmbeddingError("GEMINI_API_KEY is not configured")
    return GoogleGenerativeAIEmbeddings(
        model=settings.GEMINI_EMBEDDING_MODEL,
        google_api_key=api_key,
    )


def embed_documents(texts: list[str]) -> list[list[float]]:
    # Must match pgvector column size (1536). Use gemini-embedding-001 (not text-embedding-004).
    return [
        list(v)
        for v in _client().embed_documents(
            texts,
            batch_size=max(1, settings.EMBEDDING_BATCH_SIZE),
            output_dimensionality=VECTOR_DIMENSION,
        )
    ]


def embed_query(text: str) -> list[float]:
    return list(
        _client().embed_query(text, output_dimensionality=VECTOR_DIMENSION)
    )
