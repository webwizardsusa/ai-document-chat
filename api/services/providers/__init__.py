"""AI provider switch — OpenAI or Gemini for both chat and embeddings."""

from __future__ import annotations

from typing import Literal

from core.config import settings

AiProvider = Literal["openai", "gemini"]


def get_ai_provider() -> AiProvider:
    return settings.AI_PROVIDER
