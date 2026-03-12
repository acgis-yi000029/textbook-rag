"""Tests for query_service — orchestration via RAGCore.

Updated for STORY-001 T-001.5: query_service now delegates to RAGCore.query().
We patch RAGCore.query() directly instead of the old retrieval/generation services.
"""

from __future__ import annotations

import sqlite3
from unittest.mock import MagicMock, patch

from backend.app.core.types import (
    ChunkHit,
    CitationResult,
    RAGResponse,
    RetrievalResult,
    StrategyResult,
)
from backend.app.schemas.query import QueryResponse
from backend.app.services import query_service


def _fake_rag_response(answer: str = "Test answer.", chunks: list | None = None) -> RAGResponse:
    """Build a minimal RAGResponse for mocking."""
    if chunks is None:
        chunks = [
            ChunkHit(
                id=1,
                chunk_id="ch-1",
                book_id=10,
                text="Backpropagation is a method for computing gradients.",
                book_title="Deep Learning",
                chapter_title="Training",
                primary_page_number=42,
                source_locators=[
                    {"chunk_id": 1, "page_number": 42, "x0": 0.0, "y0": 0.0, "x1": 100.0, "y1": 100.0,
                     "width": 595.0, "height": 842.0},
                ],
            )
        ]

    citation = CitationResult(
        cleaned_answer=answer,
        raw_answer=answer,
        valid_citations=[1],
        invalid_citations=[],
        sources=[
            {
                "citation_index": 1,
                "chunk_id": "ch-1",
                "book_title": "Deep Learning",
                "chapter_title": "Training",
                "page_number": 42,
                "content_type": "text",
                "snippet": "Backpropagation is a method for computing gradients.",
                "bbox": {"x0": 0, "y0": 0, "x1": 100, "y1": 100,
                         "page_width": 595, "page_height": 842},
                "rrf_score": 0.1,
                "fts_score": 1.0,
                "vec_distance": None,
            }
        ] if chunks else [],
    )

    retrieval = RetrievalResult(
        chunks=chunks,
        per_strategy={"fts5_bm25": StrategyResult(strategy="fts5_bm25", hits=chunks)},
        stats={"fts5_bm25_hits": len(chunks), "vector_hits": 0, "total_hits": len(chunks)},
    )

    return RAGResponse(
        answer=citation.cleaned_answer,
        sources=citation.sources,
        trace={
            "retrieval": {
                "question": "test",
                "top_k": 5,
                "fetch_k": 15,
                "enabled_strategies": ["fts5_bm25"],
                "rrf_k": 60,
                "filters": {},
                "per_strategy": {
                    "fts5_bm25": {"query_used": "test", "hit_count": len(chunks), "error": None, "hits": []}
                },
                "fused_count": len(chunks),
                "stats": retrieval.stats,
            },
            "generation": {"model": "llama3.2:3b", "prompt_template": "default", "custom_system_prompt": None, "raw_answer_length": len(answer)},
            "citations": {"valid": [1], "invalid": [], "removed_count": 0},
        },
        warnings=[],
        stats=retrieval.stats,
    )


def test_query_happy_path(db: sqlite3.Connection) -> None:
    """query() should return a QueryResponse with answer, sources, stats."""
    fake = _fake_rag_response("Backpropagation computes gradients.")
    with patch(
        "backend.app.services.query_service._get_rag_core",
        return_value=MagicMock(**{"query.return_value": fake}),
    ):
        resp = query_service.query(db, "What is backpropagation?", top_k=3)

    assert isinstance(resp, QueryResponse)
    assert resp.answer == "Backpropagation computes gradients."
    assert len(resp.sources) == 1
    assert resp.sources[0].book_title == "Deep Learning"
    assert resp.retrieval_stats.fts_hits >= 0
    assert resp.trace.question == "What is backpropagation?"


def test_query_sources_have_bbox(db: sqlite3.Connection) -> None:
    """Sources with locators should include bbox data."""
    fake = _fake_rag_response("Answer with citations [1].")
    with patch(
        "backend.app.services.query_service._get_rag_core",
        return_value=MagicMock(**{"query.return_value": fake}),
    ):
        resp = query_service.query(db, "test", top_k=1)

    src = resp.sources[0]
    assert src.bbox is not None


def test_query_no_results(db: sqlite3.Connection) -> None:
    """When RAGCore returns no sources, the response sources list is empty."""
    fake = _fake_rag_response("I don't have enough context.", chunks=[])
    with patch(
        "backend.app.services.query_service._get_rag_core",
        return_value=MagicMock(**{"query.return_value": fake}),
    ):
        resp = query_service.query(db, "nonexistent topic xyz", top_k=3)

    assert resp.sources == []
    assert resp.answer == "I don't have enough context."
