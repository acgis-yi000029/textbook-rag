"""embeddings routes — Embedding model listing + configuration.

Endpoints:
    GET  /engine/embeddings/models  — list available models + current config
"""

from __future__ import annotations

from fastapi import APIRouter
from loguru import logger

from engine_v2.embeddings.resolver import get_embed_info
from engine_v2.settings import EMBEDDING_MODEL

# ============================================================
# Router
# ============================================================
router = APIRouter()

# ============================================================
# Available models
# ============================================================
AVAILABLE_MODELS = [
    {
        "name": "all-MiniLM-L6-v2",
        "provider": "huggingface",
        "dimensions": 384,
        "description": "Fast, lightweight (80MB). Good for prototyping.",
    },
    {
        "name": "BAAI/bge-small-en-v1.5",
        "provider": "huggingface",
        "dimensions": 384,
        "description": "BGE small — strong retrieval quality, compact.",
    },
    {
        "name": "BAAI/bge-base-en-v1.5",
        "provider": "huggingface",
        "dimensions": 768,
        "description": "BGE base — balanced quality and speed.",
    },
    {
        "name": "BAAI/bge-large-en-v1.5",
        "provider": "huggingface",
        "dimensions": 1024,
        "description": "BGE large — best quality, slower.",
    },
]


# ============================================================
# Endpoints
# ============================================================
@router.get("/embeddings/models")
async def list_embedding_models():
    """List available embedding models and current configuration.

    Returns models list, currently active model info, and env default.
    Used by Pipeline Tab to populate the model selector dropdown.
    """
    logger.info("Listing embedding models")

    return {
        "models": AVAILABLE_MODELS,
        "current": get_embed_info(),
        "default": EMBEDDING_MODEL,
    }
