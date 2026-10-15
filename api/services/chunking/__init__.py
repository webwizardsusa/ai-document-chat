"""Split extracted document text into overlapping chunks.

CHUNK_SIZE / CHUNK_OVERLAP are character counts (LangChain default), not tokens.
token_count on each chunk is informational for UI/debug only.
"""

from __future__ import annotations

from dataclasses import dataclass

import tiktoken
from langchain_text_splitters import RecursiveCharacterTextSplitter

from core.config import settings
from services.parsers import ExtractedDocument, ExtractedPage


@dataclass(frozen=True)
class TextChunk:
    chunk_index: int
    content: str
    page_number: int | None
    token_count: int
    metadata: dict


def split_document(
    extracted: ExtractedDocument,
    *,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[TextChunk]:
    size = chunk_size if chunk_size is not None else settings.CHUNK_SIZE
    overlap = chunk_overlap if chunk_overlap is not None else settings.CHUNK_OVERLAP
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=size,
        chunk_overlap=overlap,
        length_function=len,
        separators=["\n\n", "\n", " ", ""],
    )

    encoding = _encoding()
    chunks: list[TextChunk] = []
    index = 0

    # Split per page so page_number stays accurate for citations.
    for page in extracted.pages:
        parts = splitter.split_text(page.text)
        for part in parts:
            content = part.strip()
            if not content:
                continue
            chunks.append(
                TextChunk(
                    chunk_index=index,
                    content=content,
                    page_number=page.page_number,
                    token_count=len(encoding.encode(content)),
                    metadata=_page_metadata(page),
                )
            )
            index += 1

    if not chunks:
        raise ValueError("No text chunks produced from document")
    return chunks


def _encoding():
    try:
        return tiktoken.encoding_for_model(settings.EMBEDDING_MODEL)
    except KeyError:
        return tiktoken.get_encoding("cl100k_base")


def _page_metadata(page: ExtractedPage) -> dict:
    meta: dict = {}
    if page.page_number is not None:
        meta["page_number"] = page.page_number
    return meta
