import logging

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.exceptions import register_exception_handlers
from core.logging import RequestIdMiddleware
from modules import auth

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
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

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)

app.include_router(api_router)
