# Unit tests for data models.
# Ref: okken, Python Testing with pytest, Ch2 — testing dataclasses

from __future__ import annotations

from backend.app.models import (
    BookInfo,
    Chunk,
    ContentItem,
    PageIndexNode,
    QueryResult,
    RetrievedChunk,
    SourceReference,
)


class TestContentItem:
    """Tests for ContentItem dataclass."""

    def test_create_minimal(self) -> None:
        item = ContentItem(type="text", text="hello", bbox=[0, 0, 100, 100], page_idx=0)
        assert item.type == "text"
        assert item.text_level is None

    def test_text_level_optional(self) -> None:
        item = ContentItem(
            type="text", text="heading", bbox=[0, 0, 100, 20], page_idx=0, text_level=1
        )
        assert item.text_level == 1


class TestChunk:
    """Tests for Chunk dataclass."""

    def test_create_with_defaults(self) -> None:
        chunk = Chunk(
            chunk_id="test_p0_0",
            book_key="test",
            book_title="Test Book",
            chapter="Ch1",
            section="",
            page_number=0,
            content_type="text",
            text="some text",
            bbox=[0, 0, 100, 100],
        )
        assert chunk.token_count == 0
        assert chunk.text_level is None

    def test_all_content_types(self) -> None:
        for ct in ("text", "table", "formula", "figure"):
            chunk = Chunk(
                chunk_id=f"test_p0_{ct}",
                book_key="test",
                book_title="Test",
                chapter="Ch1",
                section="",
                page_number=0,
                content_type=ct,
                text="content",
                bbox=[0, 0, 0, 0],
            )
            assert chunk.content_type == ct


class TestRetrievedChunk:
    """Tests for RetrievedChunk."""

    def test_create(self, sample_chunks: list[Chunk]) -> None:
        rc = RetrievedChunk(chunk=sample_chunks[0], score=0.95, method="bm25")
        assert rc.score == 0.95
        assert rc.method == "bm25"
        assert rc.chunk.chunk_id == "test_book_p0_0"


class TestSourceReference:
    """Tests for SourceReference."""

    def test_create(self, sample_chunks: list[Chunk]) -> None:
        sr = SourceReference(citation_id=1, chunk=sample_chunks[0], relevance_score=0.8)
        assert sr.citation_id == 1


class TestQueryResult:
    """Tests for QueryResult."""

    def test_empty_result(self) -> None:
        result = QueryResult(answer="No answer", sources=[])
        assert result.answer == "No answer"
        assert result.sources == []
        assert result.retrieval_stats == {}

    def test_result_with_stats(self) -> None:
        result = QueryResult(
            answer="answer",
            sources=[],
            retrieval_stats={"bm25": "5 results in 50ms"},
        )
        assert "bm25" in result.retrieval_stats


class TestPageIndexNode:
    """Tests for PageIndexNode."""

    def test_create_with_children(self) -> None:
        child = PageIndexNode(title="Section 1.1", level=2, page_start=5)
        parent = PageIndexNode(
            title="Chapter 1", level=1, page_start=0, children=[child]
        )
        assert len(parent.children) == 1
        assert parent.children[0].title == "Section 1.1"

    def test_default_children_empty(self) -> None:
        node = PageIndexNode(title="Ch1", level=1, page_start=0)
        assert node.children == []
        assert node.page_end == 0


class TestBookInfo:
    """Tests for BookInfo."""

    def test_create(self) -> None:
        info = BookInfo(
            book_key="test", book_title="Test Book", author="Author", total_pages=100
        )
        assert info.total_chunks == 0
