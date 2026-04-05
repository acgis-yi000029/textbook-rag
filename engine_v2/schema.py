"""Shared data types — aligns with llama_index.core.schema.

Extends LlamaIndex's Document/TextNode with textbook-specific metadata.
Replaces engine v1's rag/types.py + ingest/chunk_builder.py dataclasses.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any


@dataclass
class BookMeta:
    """Metadata for a single book (lives in Payload CMS)."""

    book_id: str
    title: str
    authors: str = ""
    category: str = "textbook"
    total_pages: int = 0


@dataclass
class SourceLocator:
    """Bounding box for a chunk on a PDF page."""

    page: int
    x0: float
    y0: float
    x1: float
    y1: float
    page_width: float = 0.0
    page_height: float = 0.0


@dataclass
class RAGResponse:
    """Full response from QueryEngine.query()."""

    answer: str
    sources: list[dict[str, Any]]
    warnings: list[str] = field(default_factory=list)
    stats: dict[str, Any] = field(default_factory=dict)


# ============================================================
# Source builder — shared across query routes + query_engine
# ============================================================
# Maximum characters to include in full_content (for hover preview)
_FULL_CONTENT_MAX = 2000
# Maximum characters for the backwards-compatible snippet field
_SNIPPET_MAX = 300


def build_source(node_with_score: Any, index: int) -> dict[str, Any]:
    """Convert a LlamaIndex NodeWithScore to our source dict.

    Used by both the sync query route and the SSE streaming route.

    Fields added for Citation UX (Sprint 2):
        full_content  — complete chunk text (≤2000 chars) for hover preview
        book_title    — human-readable book name from node metadata
        chapter_title — chapter heading from node metadata
    """
    node = node_with_score.node
    meta = node.metadata
    page_idx = meta.get("page_idx", 0)
    content = node.get_content()

    # Strip "Source N:\n" prefix added by CitationLabelPostprocessor
    content = re.sub(r"^Source \d+:\n", "", content)

    # ── Bounding box resolution ──────────────────────────────
    x0 = float(meta.get("bbox_x0", 0))
    y0 = float(meta.get("bbox_y0", 0))
    x1 = float(meta.get("bbox_x1", 0))
    y1 = float(meta.get("bbox_y1", 0))
    pw = float(meta.get("page_width", 0))
    ph = float(meta.get("page_height", 0))
    has_bbox = any(v != 0 for v in (x0, y0, x1, y1))

    # Fallback: legacy flat bbox array (from MinerUReader ingestion path)
    if not has_bbox:
        bbox = meta.get("bbox", [0, 0, 0, 0])
        if bbox and any(v != 0 for v in bbox):
            x0, y0, x1, y1 = bbox[0], bbox[1], bbox[2], bbox[3]
            has_bbox = True

    bboxes = []
    if has_bbox:
        bboxes.append({
            "x0": x0, "y0": y0,
            "x1": x1, "y1": y1,
            "page_number": page_idx + 1,
            "page_width": pw,
            "page_height": ph,
        })

    return {
        "citation_index": index,
        "chunk_id": node.id_,
        "book_id": meta.get("book_id", ""),
        "book_title": meta.get("book_title", ""),
        "chapter_title": meta.get("chapter_title", meta.get("chapter_key", "")),
        "page_number": page_idx + 1,
        "content_type": meta.get("content_type", "text"),
        "chapter_key": meta.get("chapter_key"),
        "category": meta.get("category", "textbook"),
        "full_content": content[:_FULL_CONTENT_MAX],
        "snippet": content[:_SNIPPET_MAX],
        "score": node_with_score.score,
        "bbox": {
            "x0": x0, "y0": y0,
            "x1": x1, "y1": y1,
            "page": page_idx,
        } if has_bbox else None,
        "bboxes": bboxes,
    }
