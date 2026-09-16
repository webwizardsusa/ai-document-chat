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
    MAX_UPLOAD_BYTES,
)
from modules.workspace.service import WorkspaceService
from services.storage import file_sha256, get_storage
from workers.tasks import process_document_job


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
        extension = Path(original_name).suffix.lower()
        mime_type = (file.content_type or "").split(";")[0].strip().lower() or None

        if extension not in ALLOWED_EXTENSIONS and mime_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF, TXT, and MD files are allowed",
            )

        data = file.file.read()
        if not data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file",
            )
        if len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File exceeds 25 MB limit",
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
            process_document_job.delay(str(job.id))
            return document
        except Exception:
            self.db.rollback()
            raise
