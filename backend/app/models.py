# Shared data models for the Textbook Q&A system.
# Ref: Ramalho, Fluent Python, Ch5 — Data Class Builders

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ContentItem:
    """Single element from MinerU content_list.json."""

    type: str  # "text" | "table" | "formula" | "figure" | "discarded"
    text: str  # Extracted content
    bbox: list[float]  # [x0, y0, x1, y1] bounding box on page
    page_idx: int  # 0-indexed page number
    text_level: int | None = None  # Heading level (1, 2, 3) if applicable


@dataclass
class Chunk:
    """Fundamental retrieval unit — a piece of textbook content with metadata."""

    chunk_id: str  # Unique: "{book_key}_p{page}_{idx}"
    book_key: str  # e.g. "goodfellow_deep_learning"
    book_title: str  # e.g. "Deep Learning"
    chapter: str  # e.g. "8 Optimization for Training Deep Models"
    section: str  # e.g. "8.5"
    page_number: int  # Original PDF page (0-indexed from MinerU)
    content_type: str  # "text" | "table" | "formula" | "figure"
    text: str  # Content (plain text / HTML / LaTeX)
    bbox: list[float]  # [x0, y0, x1, y1]
    text_level: int | None = None
    token_count: int = 0


@dataclass
class RetrievedChunk:
    """A chunk with retrieval score, used in ranked result lists."""

    chunk: Chunk
    score: float
    method: str  # "bm25" | "semantic" | "pageindex" | "metadata"


@dataclass
class SourceReference:
    """A source citation in the generated answer."""

    citation_id: int  # [1], [2], etc.
    chunk: Chunk
    relevance_score: float


@dataclass
class QueryResult:
    """Full RAG pipeline output for a single query."""

    answer: str  # Generated text with [1], [2] citations
    sources: list[SourceReference] = field(default_factory=list)
    retrieval_stats: dict = field(default_factory=dict)


@dataclass
class BookInfo:
    """Metadata about an indexed book."""

    book_key: str
    book_title: str
    author: str = ""
    total_pages: int = 0
    total_chunks: int = 0


@dataclass
class PageIndexNode:
    """A node in the hierarchical TOC tree."""

    title: str
    level: int
    page_start: int
    page_end: int = 0
    children: list[PageIndexNode] = field(default_factory=list)
