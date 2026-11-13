"""Public embedding facade — dispatches to AI_PROVIDER (OpenAI or Gemini)."""

from __future__ import annotations

from models.constants import VECTOR_DIMENSION
from services.providers import get_ai_provider


class EmbeddingError(RuntimeError):
    pass


def _backend():
    if get_ai_provider() == "gemini":
        from services.providers.gemini import embeddings as backend
    else:
        from services.providers.openai import embeddings as backend
    return backend


def _validate_dimension(vector: list[float]) -> list[float]:
    if len(vector) != VECTOR_DIMENSION:
        raise EmbeddingError(
            f"Embedding dimension {len(vector)} does not match "
            f"schema VECTOR_DIMENSION={VECTOR_DIMENSION}. "
            "For Gemini use models/gemini-embedding-001 with output_dimensionality=1536."
        )
    return vector


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Batch-embed chunk texts for storage in pgvector."""
    if not texts:
        return []

    try:
        vectors = _backend().embed_documents(texts)
    except EmbeddingError:
        raise
    except RuntimeError as exc:
        raise EmbeddingError(str(exc) or "Failed to embed texts") from exc
    except Exception as exc:  # noqa: BLE001
        raise EmbeddingError("Failed to embed texts") from exc

    if len(vectors) != len(texts):
        raise EmbeddingError("Embedding API returned unexpected vector count")
    return [_validate_dimension(list(v)) for v in vectors]


def embed_query(text: str) -> list[float]:
    """Embed a single search/chat query."""
    query = text.strip()
    if not query:
        raise EmbeddingError("Query text is empty")

    try:
        vector = _backend().embed_query(query)
    except EmbeddingError:
        raise
    except RuntimeError as exc:
        raise EmbeddingError(str(exc) or "Failed to embed query") from exc
    except Exception as exc:  # noqa: BLE001
        raise EmbeddingError("Failed to embed query") from exc

    return _validate_dimension(list(vector))
