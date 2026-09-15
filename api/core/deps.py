from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from core.db import get_db
from core.security import get_current_user
from models.user import User

DbDep = Annotated[Session, Depends(get_db)]

security = HTTPBearer()
BearerDep = Annotated[HTTPAuthorizationCredentials, Depends(security)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]
