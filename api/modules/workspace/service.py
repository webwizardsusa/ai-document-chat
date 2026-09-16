from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.user import User
from models.workspace import Workspace
from modules.workspace.schema import CreateWorkspaceRequest


class WorkspaceService:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user: User) -> list[Workspace]:
        return list(
            self.db.scalars(
                select(Workspace)
                .where(Workspace.user_id == user.id)
                .order_by(Workspace.created_at.desc())
            ).all()
        )

    def create(self, user: User, data: CreateWorkspaceRequest) -> Workspace:
        workspace = Workspace(
            user_id=user.id,
            name=data.name,
        )
        self.db.add(workspace)
        try:
            self.db.commit()
            self.db.refresh(workspace)
            return workspace
        except Exception:
            self.db.rollback()
            raise

    def get_owned(self, workspace_id: UUID, user: User) -> Workspace:
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
