"""LangChain OpenAI embeddings for document chunks."""

from __future__ import annotations

from langchain_openai import OpenAIEmbeddings

from core.config import settings


class EmbeddingError(RuntimeError):
    pass


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    api_key = settings.openai_api_key
    if not api_key:
        raise EmbeddingError("OPENAI_API_KEY is not configured")

    embeddings = OpenAIEmbeddings(
        model=settings.EMBEDDING_MODEL,
        api_key=api_key,
        chunk_size=max(1, settings.EMBEDDING_BATCH_SIZE),
    )
    vectors = embeddings.embed_documents(texts)

    if len(vectors) != len(texts):
        raise EmbeddingError("Embedding API returned unexpected vector count")
    return vectors
