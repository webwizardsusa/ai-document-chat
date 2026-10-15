from hashlib import sha256
from pathlib import Path
from uuid import UUID

from core.config import settings


class LocalStorage:
    """Store files under absolute STORAGE_ROOT. Never expose this path publicly."""

    def __init__(self, root: Path | None = None):
        self.root = (root or settings.STORAGE_ROOT).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def build_key(
        self,
        workspace_id: UUID,
        document_id: UUID,
        filename: str,
    ) -> str:
        safe_name = Path(filename).name.replace("..", "_").strip() or "file"
        return f"{workspace_id}/{document_id}/{safe_name}"

    def absolute_path(self, storage_key: str) -> Path:
        # Reject traversal; require resolved path under STORAGE_ROOT.
        if not storage_key or storage_key.startswith("/") or ".." in Path(storage_key).parts:
            raise ValueError("Invalid storage key")
        path = (self.root / storage_key).resolve()
        try:
            path.relative_to(self.root)
        except ValueError as exc:
            raise ValueError("Invalid storage key") from exc
        return path

    def save(self, storage_key: str, data: bytes) -> None:
        path = self.absolute_path(storage_key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def read(self, storage_key: str) -> bytes:
        path = self.absolute_path(storage_key)
        if not path.is_file():
            raise FileNotFoundError(f"Missing file for storage key: {storage_key}")
        return path.read_bytes()

    def delete(self, storage_key: str) -> None:
        path = self.absolute_path(storage_key)
        if path.is_file():
            path.unlink()

    def delete_quiet(self, storage_key: str | None) -> None:
        """Best-effort delete; ignore missing/invalid keys (post-commit cleanup)."""
        if not storage_key or storage_key == "pending":
            return
        try:
            self.delete(storage_key)
        except (OSError, ValueError):
            pass


def file_sha256(data: bytes) -> str:
    return sha256(data).hexdigest()


def get_storage() -> LocalStorage:
    return LocalStorage()
