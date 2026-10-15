"""
Seed a single local/dev user.

Usage (from api/):
  python -m seeders.seed_user
"""

from core.config import settings
from core.db import SessionLocal
from core.security import hash_password, normalize_email
from models.user import User
from sqlalchemy import select

SEED_NAME = "Admin User"
SEED_EMAIL = "admin@example.com"
SEED_PASSWORD = "Admin@12345"


def seed_user() -> None:
    if settings.APP_ENV != "local":
        raise SystemExit("Refusing to seed users when APP_ENV is not local")

    email = normalize_email(SEED_EMAIL)
    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.email == email))
        if existing is not None:
            print("Seed user already exists.")
            print(f"  email:    {SEED_EMAIL}")
            print(f"  password: {SEED_PASSWORD}")
            return

        user = User(
            name=SEED_NAME,
            email=email,
            password_hash=hash_password(SEED_PASSWORD),
            is_active=True,
        )
        db.add(user)
        db.commit()
        print("Seed user created.")
        print(f"  email:    {SEED_EMAIL}")
        print(f"  password: {SEED_PASSWORD}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_user()
