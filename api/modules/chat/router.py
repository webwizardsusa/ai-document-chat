"""Workspace chat: list history, ask (JSON or SSE stream), clear history."""

from uuid import UUID

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from core.deps import CurrentUserDep, DbDep
from core.rate_limit import ChatRateLimitDep
from core.responses import success
from modules.chat.schema import AskMessageRequest
from modules.chat.service import ChatService

router = APIRouter(tags=["Chat"])


@router.get("/workspaces/{workspace_id}/messages")
def list_messages(
    workspace_id: UUID,
    current_user: CurrentUserDep,
    db: DbDep,
):
    messages = ChatService(db).list_messages(workspace_id, current_user)
    return success(
        message="Messages fetched successfully",
        result=messages,
    )


@router.post("/workspaces/{workspace_id}/messages")
def ask_message(
    workspace_id: UUID,
    payload: AskMessageRequest,
    current_user: CurrentUserDep,
    db: DbDep,
    _rate_limit: ChatRateLimitDep,
):
    result = ChatService(db).ask(workspace_id, current_user, payload)
    return success(
        message="Message answered successfully",
        result=result,
        status_code=201,
    )


@router.post("/workspaces/{workspace_id}/messages/stream")
def ask_message_stream(
    workspace_id: UUID,
    payload: AskMessageRequest,
    current_user: CurrentUserDep,
    db: DbDep,
    _rate_limit: ChatRateLimitDep,
):
    # SSE token stream; final "done" event carries persisted messages + sources.
    generator = ChatService(db).ask_stream(workspace_id, current_user, payload)
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/workspaces/{workspace_id}/messages")
def clear_messages(
    workspace_id: UUID,
    current_user: CurrentUserDep,
    db: DbDep,
):
    deleted = ChatService(db).clear_messages(workspace_id, current_user)
    return success(
        message="Chat history cleared",
        result={"deleted": deleted},
    )
