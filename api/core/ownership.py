from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.document import Document
from models.message import Message
from models.workspace import Workspace


def get_owned_workspace(
    db: Session,
    workspace_id: UUID,
    user_id: UUID,
) -> Workspace:
    workspace = db.scalar(
        select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.user_id == user_id,
        )
    )
    if workspace is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )
    return workspace


def get_owned_document(
    db: Session,
    document_id: UUID,
    user_id: UUID,
) -> Document:
    document = db.scalar(
        select(Document)
        .join(Workspace, Document.workspace_id == Workspace.id)
        .where(
            Document.id == document_id,
            Workspace.user_id == user_id,
        )
    )
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return document


def get_owned_message(
    db: Session,
    message_id: UUID,
    user_id: UUID,
) -> Message:
    message = db.scalar(
        select(Message)
        .join(Workspace, Message.workspace_id == Workspace.id)
        .where(
            Message.id == message_id,
            Workspace.user_id == user_id,
        )
    )
    if message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
    return message
