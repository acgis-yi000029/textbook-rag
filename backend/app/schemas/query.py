"""Pydantic schemas for the /query endpoint."""

from __future__ import annotations

from pydantic import BaseModel, Field


class QueryFilters(BaseModel):
    book_ids: list[int] = Field(default_factory=list)
    chapter_ids: list[int] = Field(default_factory=list)
    content_types: list[str] = Field(default_factory=list)


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    filters: QueryFilters | None = None
    top_k: int = Field(default=5, ge=1, le=20)
    model: str | None = Field(default=None, min_length=1, max_length=200)


class SourceInfo(BaseModel):
    source_id: str
    book_id: int
    book_title: str
    chapter_title: str | None = None
    page_number: int
    snippet: str
    bbox: dict | None = None
    confidence: float


class RetrievalStats(BaseModel):
    fts_hits: int
    vector_hits: int
    fused_count: int


class TraceChunkHit(BaseModel):
    strategy: str
    rank: int
    chunk_id: str
    book_title: str
    chapter_title: str | None = None
    page_number: int | None = None
    score: float | None = None
    snippet: str


class RetrievalTrace(BaseModel):
    fetch_k: int
    fts_query: str
    fts_results: list[TraceChunkHit]
    vector_results: list[TraceChunkHit]
    fused_results: list[TraceChunkHit]


class GenerationTrace(BaseModel):
    model: str
    system_prompt: str
    user_prompt: str


class QueryTrace(BaseModel):
    question: str
    top_k: int
    filters: QueryFilters | None = None
    active_book_title: str | None = None
    retrieval: RetrievalTrace
    generation: GenerationTrace


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceInfo]
    retrieval_stats: RetrievalStats
    trace: QueryTrace


class ModelInfo(BaseModel):
    name: str
    is_default: bool = False
