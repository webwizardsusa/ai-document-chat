"""Extract plain text from uploaded documents."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader


@dataclass(frozen=True)
class ExtractedPage:
    page_number: int | None
    text: str


@dataclass(frozen=True)
class ExtractedDocument:
    pages: list[ExtractedPage]
    page_count: int | None

    @property
    def full_text(self) -> str:
        return "\n\n".join(page.text for page in self.pages if page.text.strip())


def extract_text(
    data: bytes,
    *,
    original_name: str,
    mime_type: str | None = None,
) -> ExtractedDocument:
    extension = Path(original_name).suffix.lower()
    mime = (mime_type or "").split(";")[0].strip().lower()

    if extension == ".pdf" or mime == "application/pdf":
        return _extract_pdf(data)
    if extension in {".txt", ".md"} or mime in {"text/plain", "text/markdown"}:
        return _extract_plain_text(data)

    raise ValueError(f"Unsupported file type for parsing: {original_name}")


def _extract_pdf(data: bytes) -> ExtractedDocument:
    reader = PdfReader(BytesIO(data))
    pages: list[ExtractedPage] = []
    for index, page in enumerate(reader.pages):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append(ExtractedPage(page_number=index + 1, text=text))
    if not pages:
        raise ValueError("PDF has no extractable text")
    return ExtractedDocument(pages=pages, page_count=len(reader.pages))


def _extract_plain_text(data: bytes) -> ExtractedDocument:
    text = data.decode("utf-8", errors="replace").strip()
    if not text:
        raise ValueError("File is empty or has no text")
    return ExtractedDocument(
        pages=[ExtractedPage(page_number=None, text=text)],
        page_count=None,
    )
