"""String enums mirrored by DB CHECK constraints."""

import enum


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class SenderType(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class JobType(str, enum.Enum):
    DOCUMENT_PROCESS = "document_process"
