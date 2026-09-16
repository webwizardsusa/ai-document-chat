from uuid import UUID

from fastapi import APIRouter, File, UploadFile

from core.deps import CurrentUserDep, DbDep
from core.responses import success
from modules.document.schema import DocumentResponse
from modules.document.service import DocumentService

router = APIRouter(tags=["Documents"])


@router.get("/workspaces/{workspace_id}/documents")
def list_documents(
    workspace_id: UUID,
    current_user: CurrentUserDep,
    db: DbDep,
):
    documents = DocumentService(db).list_for_workspace(workspace_id, current_user)
    return success(
        message="Documents fetched successfully",
        result=[DocumentResponse.model_validate(d) for d in documents],
    )


@router.post("/workspaces/{workspace_id}/documents")
def upload_document(
    workspace_id: UUID,
    current_user: CurrentUserDep,
    db: DbDep,
    file: UploadFile = File(...),
):
    document = DocumentService(db).upload(workspace_id, current_user, file)
    return success(
        message="Document uploaded successfully",
        result=DocumentResponse.model_validate(document),
        status_code=201,
    )
