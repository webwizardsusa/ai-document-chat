"""Local filesystem storage for uploaded documents."""

from .local import LocalStorage, file_sha256, get_storage

__all__ = ["LocalStorage", "file_sha256", "get_storage"]
