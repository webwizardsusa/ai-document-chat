"""CRUD for workspaces owned by the current user."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models.document import Document
from models.user import User
from models.workspace import Workspace
from modules.workspace.schema import CreateWorkspaceRequest, WorkspaceResponse
from services.storage import get_storage


class WorkspaceService:
    def __init__(self, db: Session):
        self.db = db
        self.storage = get_storage()

    def list_for_user(self, user: User) -> list[WorkspaceResponse]:
        count_sq = (
            select(func.count())
            .select_from(Document)
            .where(Document.workspace_id == Workspace.id)
            .correlate(Workspace)
            .scalar_subquery()
        )
        rows = self.db.execute(
            select(Workspace, count_sq)
            .where(Workspace.user_id == user.id)
            .order_by(Workspace.created_at.desc())
        ).all()
        return [
            self._to_response(workspace, int(document_count or 0))
            for workspace, document_count in rows
        ]

    def create(self, user: User, data: CreateWorkspaceRequest) -> WorkspaceResponse:
        workspace = Workspace(user_id=user.id, name=data.name)
        self.db.add(workspace)
        try:
            self.db.commit()
            self.db.refresh(workspace)
            return self._to_response(workspace, 0)
        except Exception:
            self.db.rollback()
            raise

    def get_owned(self, workspace_id: UUID, user: User) -> Workspace:
        """Ownership gate used by document/chat modules."""
        workspace = self.db.scalar(
            select(Workspace).where(
                Workspace.id == workspace_id,
                Workspace.user_id == user.id,
            )
        )
        if workspace is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found",
            )
        return workspace

    def get_owned_response(self, workspace_id: UUID, user: User) -> WorkspaceResponse:
        workspace = self.get_owned(workspace_id, user)
        document_count = self.db.scalar(
            select(func.count())
            .select_from(Document)
            .where(Document.workspace_id == workspace.id)
        )
        return self._to_response(workspace, int(document_count or 0))

    def delete(self, workspace_id: UUID, user: User) -> None:
        """Delete workspace (DB cascades) then best-effort remove stored files."""
        workspace = self.get_owned(workspace_id, user)
        storage_keys = list(
            self.db.scalars(
                select(Document.storage_key).where(Document.workspace_id == workspace.id)
            ).all()
        )
        try:
            self.db.delete(workspace)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        for key in storage_keys:
            self.storage.delete_quiet(key)

    @staticmethod
    def _to_response(workspace: Workspace, document_count: int) -> WorkspaceResponse:
        return WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,
            document_count=document_count,
            created_at=workspace.created_at,
            updated_at=workspace.updated_at,
        )
