"""Owned-workspace document list/upload/download/delete + process-job enqueue."""

import logging
from dataclasses import dataclass
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.document import Document
from models.enums import DocumentStatus, JobStatus, JobType
from models.job import Job
from models.user import User
from modules.document.schema import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    MAX_ORIGINAL_NAME_LENGTH,
    MAX_UPLOAD_BYTES,
)
from modules.workspace.service import WorkspaceService
from services.jobs import enqueue_document_process
from services.storage import file_sha256, get_storage

logger = logging.getLogger(__name__)

_READ_CHUNK = 64 * 1024


@dataclass(frozen=True)
class DocumentDownload:
    path: Path
    filename: str
    media_type: str


class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.workspaces = WorkspaceService(db)
        self.storage = get_storage()

    def list_for_workspace(self, workspace_id: UUID, user: User) -> list[Document]:
        self.workspaces.get_owned(workspace_id, user)
        return list(
            self.db.scalars(
                select(Document)
                .where(Document.workspace_id == workspace_id)
                .order_by(Document.created_at.desc())
            ).all()
        )

    def get_download(
        self,
        workspace_id: UUID,
        document_id: UUID,
        user: User,
    ) -> DocumentDownload:
        """Resolve owned document file for authenticated download."""
        document = self._get_owned_document(workspace_id, document_id, user)
        if not document.storage_key or document.storage_key == "pending":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file is not available",
            )
        try:
            path = self.storage.absolute_path(document.storage_key)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file is not available",
            ) from exc
        if not path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file is not available",
            )
        return DocumentDownload(
            path=path,
            filename=document.original_name,
            media_type=document.mime_type or "application/octet-stream",
        )

    def upload(
        self,
        workspace_id: UUID,
        user: User,
        file: UploadFile,
    ) -> Document:
        """Save file + pending job, then enqueue Celery (after commit)."""
        self.workspaces.get_owned(workspace_id, user)

        original_name = _safe_filename(file.filename)
        extension = Path(original_name).suffix.lower()
        mime_type = (file.content_type or "").split(";")[0].strip().lower() or None

        if extension not in ALLOWED_EXTENSIONS or (
            mime_type and mime_type not in ALLOWED_MIME_TYPES
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF, TXT, and MD files are allowed",
            )

        data = self._read_upload_limited(file)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file",
            )
        if extension == ".pdf" and not data.lstrip().startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content does not match a PDF",
            )

        document = Document(
            workspace_id=workspace_id,
            original_name=original_name,
            storage_key="pending",
            mime_type=mime_type,
            file_size=len(data),
            file_hash=file_sha256(data),
            status=DocumentStatus.UPLOADED.value,
        )
        self.db.add(document)

        storage_key: str | None = None
        job: Job | None = None
        try:
            self.db.flush()
            storage_key = self.storage.build_key(workspace_id, document.id, original_name)
            self.storage.save(storage_key, data)
            document.storage_key = storage_key

            job = Job(
                type=JobType.DOCUMENT_PROCESS.value,
                workspace_id=workspace_id,
                document_id=document.id,
                status=JobStatus.PENDING.value,
                payload={"document_id": str(document.id)},
            )
            self.db.add(job)
            self.db.commit()
            self.db.refresh(document)
            self.db.refresh(job)
        except Exception:
            self.db.rollback()
            self.storage.delete_quiet(storage_key)
            raise

        try:
            enqueue_document_process(job.id)
        except Exception:
            logger.exception("Failed to enqueue document job %s", job.id)
            job.status = JobStatus.FAILED.value
            job.error = "Failed to enqueue processing task"
            document.status = DocumentStatus.FAILED.value
            document.error_message = (
                "Processing could not be started. Please try uploading again."
            )
            self.db.commit()
            self.db.refresh(document)

        return document

    def delete(
        self,
        workspace_id: UUID,
        document_id: UUID,
        user: User,
    ) -> None:
        """Delete DB row (chunks cascade) then best-effort remove the file."""
        document = self._get_owned_document(workspace_id, document_id, user)
        storage_key = document.storage_key
        try:
            self.db.delete(document)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        self.storage.delete_quiet(storage_key)

    def _get_owned_document(
        self,
        workspace_id: UUID,
        document_id: UUID,
        user: User,
    ) -> Document:
        self.workspaces.get_owned(workspace_id, user)
        document = self.db.scalar(
            select(Document).where(
                Document.id == document_id,
                Document.workspace_id == workspace_id,
            )
        )
        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )
        return document

    @staticmethod
    def _read_upload_limited(file: UploadFile) -> bytes:
        """Stream upload in chunks and abort once size exceeds the limit."""
        chunks: list[bytes] = []
        total = 0
        while True:
            chunk = file.file.read(_READ_CHUNK)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_UPLOAD_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File exceeds 25 MB limit",
                )
            chunks.append(chunk)
        return b"".join(chunks)


def _safe_filename(filename: str | None) -> str:
    name = (filename or "document").strip() or "document"
    name = Path(name).name.strip() or "document"
    if len(name) <= MAX_ORIGINAL_NAME_LENGTH:
        return name
    stem = Path(name).stem[: MAX_ORIGINAL_NAME_LENGTH - 12]
    suffix = Path(name).suffix[:11]
    return f"{stem}{suffix}"
