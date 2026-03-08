"""Query service - orchestrates retrieval -> generation -> response assembly."""

from __future__ import annotations

import sqlite3

from backend.app.schemas.query import (
    GenerationTrace,
    QueryFilters,
    QueryResponse,
    QueryTrace,
    RetrievalStats,
    RetrievalTrace,
    SourceInfo,
)
from backend.app.services import generation_service, retrieval_service


def query(
    db: sqlite3.Connection,
    question: str,
    filters: dict | None = None,
    top_k: int = 5,
    active_book_title: str | None = None,
    model: str | None = None,
) -> QueryResponse:
    """Full RAG pipeline: retrieve -> generate -> assemble response."""

    chunks, stats, retrieval_trace = retrieval_service.retrieve(
        db,
        question,
        filters=filters,
        top_k=top_k,
    )

    messages = generation_service.build_messages(
        question,
        chunks,
        active_book_title=active_book_title,
    )
    answer = generation_service.generate_from_messages(
        messages,
        model=model,
        max_citation=len(chunks),
    )

    sources = _build_sources(chunks)
    generation_trace = generation_service.build_generation_trace(messages, model=model)

    return QueryResponse(
        answer=answer,
        sources=sources,
        retrieval_stats=RetrievalStats(**stats),
        trace=QueryTrace(
            question=question,
            top_k=top_k,
            filters=QueryFilters(**filters) if filters else None,
            active_book_title=active_book_title,
            retrieval=RetrievalTrace(**retrieval_trace),
            generation=GenerationTrace(**generation_trace),
        ),
    )


def _build_sources(chunks: list[dict]) -> list[SourceInfo]:
    sources: list[SourceInfo] = []
    for c in chunks:
        locs = c.get("source_locators", [])
        loc = locs[0] if locs else {}
        bbox = None
        if loc:
            bbox = {
                "x0": loc.get("x0", 0),
                "y0": loc.get("y0", 0),
                "x1": loc.get("x1", 0),
                "y1": loc.get("y1", 0),
            }

        snippet = (c.get("text") or "")[:300]

        sources.append(
            SourceInfo(
                source_id=c.get("chunk_id", ""),
                book_id=c.get("book_id", 0),
                book_title=c.get("book_title", ""),
                chapter_title=c.get("chapter_title") or None,
                page_number=(loc.get("page_number", 0) + 1) if loc else 1,
                snippet=snippet,
                bbox=bbox,
                confidence=1.0,
            )
        )
    return sources
