"""Workspace CRUD routes (scoped to current user)."""

from uuid import UUID

from fastapi import APIRouter

from core.deps import CurrentUserDep, DbDep
from core.responses import success
from modules.workspace.schema import CreateWorkspaceRequest
from modules.workspace.service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.get("")
def list_workspaces(current_user: CurrentUserDep, db: DbDep):
    workspaces = WorkspaceService(db).list_for_user(current_user)
    return success(
        message="Workspaces fetched successfully",
        result=workspaces,
    )


@router.post("")
def create_workspace(
    payload: CreateWorkspaceRequest,
    current_user: CurrentUserDep,
    db: DbDep,
):
    workspace = WorkspaceService(db).create(current_user, payload)
    return success(
        message="Workspace created successfully",
        result=workspace,
        status_code=201,
    )


@router.get("/{workspace_id}")
def get_workspace(
    workspace_id: UUID,
    current_user: CurrentUserDep,
    db: DbDep,
):
    workspace = WorkspaceService(db).get_owned_response(workspace_id, current_user)
    return success(
        message="Workspace fetched successfully",
        result=workspace,
    )


@router.delete("/{workspace_id}")
def delete_workspace(
    workspace_id: UUID,
    current_user: CurrentUserDep,
    db: DbDep,
):
    WorkspaceService(db).delete(workspace_id, current_user)
    return success(message="Workspace deleted successfully", result=None)
