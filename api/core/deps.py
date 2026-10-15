"""FastAPI dependency aliases used by routers."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from core.db import get_db
from core.security import get_current_user
from models.user import User

DbDep = Annotated[Session, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]
