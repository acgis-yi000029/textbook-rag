"""Embedding model resolver — select and configure embedding models.

Aligns with llama_index.core.embeddings.BaseEmbedding.
Ref: llama_index.core.embeddings — BaseEmbedding, resolve_embed_model()

Supports:
    - HuggingFace local models (default, always available)
    - OpenAI embeddings (if API key configured)
    - Azure OpenAI embeddings (if endpoint configured)

Extracted from settings.py to give embeddings first-class module status.
"""

from __future__ import annotations

import logging
from typing import Any

from llama_index.core.embeddings import BaseEmbedding
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

from engine_v2.settings import EMBEDDING_MODEL

logger = logging.getLogger(__name__)


def resolve_embed_model(
    model_name: str | None = None,
) -> BaseEmbedding:
    """Resolve and return an embedding model instance.

    Priority:
        1. Explicit model_name parameter
        2. EMBEDDING_MODEL env var (default: all-MiniLM-L6-v2)

    Currently always returns HuggingFaceEmbedding (local).
    Future: add OpenAI / Azure OpenAI embedding support.

    Args:
        model_name: Override model name. If None, uses settings.

    Returns:
        BaseEmbedding instance ready for use.
    """
    name = model_name or EMBEDDING_MODEL
    logger.info("Resolving embedding model: %s", name)

    # Currently only HuggingFace local is supported
    return HuggingFaceEmbedding(model_name=name)


def get_embed_info() -> dict[str, Any]:
    """Return current embedding model configuration info.

    Returns:
        Dict with model details for API exposure.
    """
    from llama_index.core.settings import Settings

    embed = Settings.embed_model
    if embed is None:
        return {
            "model": None,
            "provider": "none",
            "status": "not_initialized",
        }

    model_name = getattr(embed, "model_name", str(embed))
    embed_dim = getattr(embed, "embed_batch_size", None)

    return {
        "model": model_name,
        "provider": "huggingface",
        "embed_batch_size": embed_dim,
        "status": "ready",
    }
