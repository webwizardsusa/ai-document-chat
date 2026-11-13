import logging

from fastapi import APIRouter, FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from core.config import settings
from core.db import engine
from core.exceptions import register_exception_handlers
from core.logging import RequestIdMiddleware
from modules import auth, chat, document, workspace

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    # request_id / path / status are embedded in the message by RequestIdMiddleware
)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

app = FastAPI(title="AI Document Chat")

register_exception_handlers(app)

app.add_middleware(RequestIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Liveness: process is up."""
    return {"status": "ok"}


@app.get("/ready", tags=["health"])
def ready(response: Response) -> dict[str, str | dict[str, str]]:
    """Readiness: Postgres + Redis (Celery broker) are reachable."""
    checks: dict[str, str] = {}

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "unavailable"

    try:
        import redis

        client = redis.from_url(settings.CELERY_BROKER_URL)
        try:
            client.ping()
            checks["redis"] = "ok"
        finally:
            client.close()
    except Exception:
        checks["redis"] = "unavailable"

    if any(value != "ok" for value in checks.values()):
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "unavailable", "checks": checks}
    return {"status": "ready", "checks": checks}


api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(workspace.router)
api_router.include_router(document.router)
api_router.include_router(chat.router)

app.include_router(api_router)
