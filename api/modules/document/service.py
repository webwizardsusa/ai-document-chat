from pathlib import Path
from uuid import UUID
import logging

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
from services.storage import file_sha256, get_storage
from workers.tasks import process_document_job

logger = logging.getLogger(__name__)

_READ_CHUNK = 64 * 1024


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

    def upload(
        self,
        workspace_id: UUID,
        user: User,
        file: UploadFile,
    ) -> Document:
        self.workspaces.get_owned(workspace_id, user)

        original_name = (file.filename or "document").strip() or "document"
        original_name = Path(original_name).name.strip() or "document"
        if len(original_name) > MAX_ORIGINAL_NAME_LENGTH:
            stem = Path(original_name).stem[: MAX_ORIGINAL_NAME_LENGTH - 12]
            suffix = Path(original_name).suffix[:11]
            original_name = f"{stem}{suffix}"

        extension = Path(original_name).suffix.lower()
        mime_type = (file.content_type or "").split(";")[0].strip().lower() or None

        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF, TXT, and MD files are allowed",
            )
        if mime_type and mime_type not in ALLOWED_MIME_TYPES:
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
        self._validate_magic(extension, data)

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
        try:
            self.db.flush()
            storage_key = self.storage.build_key(
                workspace_id,
                document.id,
                original_name,
            )
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
        except Exception:
            self.db.rollback()
            if storage_key:
                try:
                    self.storage.delete(storage_key)
                except OSError:
                    pass
            raise

        try:
            process_document_job.delay(str(job.id))
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

        storage_key = document.storage_key
        try:
            self.db.delete(document)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        if storage_key and storage_key != "pending":
            try:
                self.storage.delete(storage_key)
            except OSError:
                pass

    @staticmethod
    def _read_upload_limited(file: UploadFile) -> bytes:
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

    @staticmethod
    def _validate_magic(extension: str, data: bytes) -> None:
        if extension == ".pdf" and not data.lstrip().startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content does not match a PDF",
            )
