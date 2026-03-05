# Unit tests for layout-aware chunker.
# Ref: okken, Python Testing with pytest, Ch4 — parametrize for data-driven tests
# Ref: Manning, Intro to IR, Ch2 — text segmentation validation

from __future__ import annotations

from backend.app.models import ContentItem
from backend.app.preprocessing.chunker import BOOK_TITLES, LayoutAwareChunker


class TestLayoutAwareChunker:
    """Tests for LayoutAwareChunker.chunk()."""

    def test_basic_chunking(self, sample_content_items: list[ContentItem]) -> None:
        """Content items are converted to chunks with correct metadata."""
        chunker = LayoutAwareChunker(max_tokens=512, overlap_tokens=50)
        chunks = chunker.chunk(sample_content_items, "test_book")
        assert len(chunks) > 0
        for chunk in chunks:
            assert chunk.book_key == "test_book"
            assert chunk.text.strip() != ""

    def test_tables_never_split(self, sample_content_items: list[ContentItem]) -> None:
        """Table items become exactly one chunk, never split."""
        chunker = LayoutAwareChunker(max_tokens=512, overlap_tokens=50)
        chunks = chunker.chunk(sample_content_items, "test_book")
        table_chunks = [c for c in chunks if c.content_type == "table"]
        assert len(table_chunks) == 1
        assert "Linear Regression" in table_chunks[0].text

    def test_formulas_never_split(
        self, sample_content_items: list[ContentItem]
    ) -> None:
        """Formula items become exactly one chunk, never split."""
        chunker = LayoutAwareChunker(max_tokens=512, overlap_tokens=50)
        chunks = chunker.chunk(sample_content_items, "test_book")
        formula_chunks = [c for c in chunks if c.content_type == "formula"]
        assert len(formula_chunks) == 1
        assert "y = w^T x + b" in formula_chunks[0].text

    def test_chapter_section_tracking(
        self, sample_content_items: list[ContentItem]
    ) -> None:
        """Chapter and section headings are tracked and assigned to subsequent chunks."""
        chunker = LayoutAwareChunker(max_tokens=512, overlap_tokens=50)
        chunks = chunker.chunk(sample_content_items, "test_book")

        # Chunks after the heading should have chapter assigned
        for chunk in chunks:
            assert chunk.chapter != "" or chunk.page_number == 0

    def test_chunk_id_format(self, sample_content_items: list[ContentItem]) -> None:
        """Chunk IDs follow the pattern '{book_key}_p{page}_{idx}'."""
        chunker = LayoutAwareChunker(max_tokens=512, overlap_tokens=50)
        chunks = chunker.chunk(sample_content_items, "test_book")
        for chunk in chunks:
            assert chunk.chunk_id.startswith("test_book_p")

    def test_book_title_lookup(self) -> None:
        """Known book keys map to correct titles."""
        assert BOOK_TITLES["goodfellow_deep_learning"] == "Deep Learning"
        assert "Pattern Recognition" in BOOK_TITLES["bishop_prml"]

    def test_unknown_book_key_fallback(
        self, sample_content_items: list[ContentItem]
    ) -> None:
        """Unknown book key gets a title-cased fallback name."""
        chunker = LayoutAwareChunker(max_tokens=512, overlap_tokens=50)
        chunks = chunker.chunk(sample_content_items, "unknown_new_book")
        assert chunks[0].book_title == "Unknown New Book"

    def test_long_text_split_with_overlap(self) -> None:
        """Text exceeding max_tokens is split into overlapping sub-chunks."""
        # Create a content item with very long text (~600 tokens at 4 chars/token)
        long_text = "word " * 600  # ~600 tokens
        items = [
            ContentItem(type="text", text=long_text, bbox=[0, 0, 100, 100], page_idx=0),
        ]
        chunker = LayoutAwareChunker(max_tokens=100, overlap_tokens=20)
        chunks = chunker.chunk(items, "test_book")
        # Should produce multiple chunks
        assert len(chunks) > 1

    def test_empty_items_produce_no_chunks(self) -> None:
        """Empty item list produces empty chunk list."""
        chunker = LayoutAwareChunker()
        chunks = chunker.chunk([], "test_book")
        assert chunks == []

    def test_token_count_populated(
        self, sample_content_items: list[ContentItem]
    ) -> None:
        """Each chunk has a positive token_count."""
        chunker = LayoutAwareChunker(max_tokens=512, overlap_tokens=50)
        chunks = chunker.chunk(sample_content_items, "test_book")
        for chunk in chunks:
            assert chunk.token_count > 0
