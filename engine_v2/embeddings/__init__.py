"""embeddings — embedding model management.

Aligns with llama_index.core.embeddings (BaseEmbedding).
Centralises embedding model selection, configuration, and info exposure.
Used by ingestion/ (IngestionPipeline) and settings.py (Settings.embed_model).
"""

from engine_v2.embeddings.resolver import resolve_embed_model, get_embed_info

__all__ = ["resolve_embed_model", "get_embed_info"]
