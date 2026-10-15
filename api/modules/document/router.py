"""Document list/upload/download/delete under an owned workspace."""

from uuid import UUID

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import FileResponse

from core.deps import CurrentUserDep, DbDep
from core.rate_limit import UploadRateLimitDep
from core.responses import success
from models.enums import DocumentStatus
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
    _rate_limit: UploadRateLimitDep,
    file: UploadFile = File(...),
):
    document = DocumentService(db).upload(workspace_id, current_user, file)
    if document.status == DocumentStatus.FAILED.value:
        return success(
            message="Document saved but processing could not be started",
            result=DocumentResponse.model_validate(document),
            status_code=201,
        )
    return success(
        message="Document uploaded successfully",
        result=DocumentResponse.model_validate(document),
        status_code=201,
    )


@router.get("/workspaces/{workspace_id}/documents/{document_id}/download")
def download_document(
    workspace_id: UUID,
    document_id: UUID,
    current_user: CurrentUserDep,
    db: DbDep,
):
    # Authenticated FileResponse only — never a public /uploads URL.
    download = DocumentService(db).get_download(workspace_id, document_id, current_user)
    return FileResponse(
        path=download.path,
        media_type=download.media_type,
        filename=download.filename,
    )


@router.delete("/workspaces/{workspace_id}/documents/{document_id}")
def delete_document(
    workspace_id: UUID,
    document_id: UUID,
    current_user: CurrentUserDep,
    db: DbDep,
):
    DocumentService(db).delete(workspace_id, document_id, current_user)
    return success(message="Document deleted successfully", result=None)
