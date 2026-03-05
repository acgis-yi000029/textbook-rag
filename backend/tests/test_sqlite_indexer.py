# Unit tests for SQLite FTS5 indexer.
# Ref: okken, Python Testing with pytest, Ch3 — fixtures for db setup/teardown
# Ref: Manning, Intro to IR, Ch11 — BM25 ranking validation

from __future__ import annotations

from pathlib import Path

from backend.app.indexing.sqlite_indexer import SQLiteIndexer
from backend.app.models import Chunk


class TestSQLiteIndexer:
    """Tests for SQLiteIndexer."""

    def test_index_and_count(self, sample_chunks: list[Chunk], tmp_path: Path) -> None:
        """Chunks are indexed and count matches."""
        indexer = SQLiteIndexer(tmp_path / "test.db")
        count = indexer.index_chunks(sample_chunks, "test_book", "Test ML Book")
        assert count == len(sample_chunks)
        assert indexer.total_chunks() == len(sample_chunks)
        indexer.close()

    def test_idempotent_indexing(
        self, sample_chunks: list[Chunk], tmp_path: Path
    ) -> None:
        """Re-indexing same book returns 0 (idempotent)."""
        indexer = SQLiteIndexer(tmp_path / "test.db")
        indexer.index_chunks(sample_chunks, "test_book", "Test ML Book")
        # Second call should skip
        count2 = indexer.index_chunks(sample_chunks, "test_book", "Test ML Book")
        assert count2 == 0
        indexer.close()

    def test_bm25_search_returns_results(
        self, sample_chunks: list[Chunk], tmp_path: Path
    ) -> None:
        """BM25 search for 'supervised learning' returns relevant chunks."""
        indexer = SQLiteIndexer(tmp_path / "test.db")
        indexer.index_chunks(sample_chunks, "test_book", "Test ML Book")

        results = indexer.search("supervised learning")
        assert len(results) > 0
        # At least one result should mention supervised learning
        found = any("supervised" in r.text.lower() for r in results)
        assert found
        indexer.close()

    def test_search_with_book_filter(
        self, sample_chunks: list[Chunk], tmp_path: Path
    ) -> None:
        """Book filter restricts results to specified book_keys."""
        indexer = SQLiteIndexer(tmp_path / "test.db")
        indexer.index_chunks(sample_chunks, "test_book", "Test ML Book")

        # Filter to nonexistent book should return nothing
        results = indexer.search("learning", book_filter=["nonexistent_book"])
        assert len(results) == 0
        indexer.close()

    def test_get_chunks_by_pages(
        self, sample_chunks: list[Chunk], tmp_path: Path
    ) -> None:
        """Page range query returns chunks within that range."""
        indexer = SQLiteIndexer(tmp_path / "test.db")
        indexer.index_chunks(sample_chunks, "test_book", "Test ML Book")

        results = indexer.get_chunks_by_pages("test_book", 0, 1)
        assert len(results) > 0
        for chunk in results:
            assert 0 <= chunk.page_number <= 1
        indexer.close()

    def test_get_books(self, sample_chunks: list[Chunk], tmp_path: Path) -> None:
        """get_books() returns indexed book metadata."""
        indexer = SQLiteIndexer(tmp_path / "test.db")
        indexer.index_chunks(sample_chunks, "test_book", "Test ML Book")

        books = indexer.get_books()
        assert len(books) == 1
        assert books[0].book_key == "test_book"
        assert books[0].book_title == "Test ML Book"
        assert books[0].total_chunks == len(sample_chunks)
        indexer.close()

    def test_search_empty_db(self, tmp_path: Path) -> None:
        """Search on empty database returns empty list."""
        indexer = SQLiteIndexer(tmp_path / "test.db")
        results = indexer.search("anything")
        assert results == []
        indexer.close()

    def test_content_type_filter(
        self, sample_chunks: list[Chunk], tmp_path: Path
    ) -> None:
        """Content type filter restricts results."""
        indexer = SQLiteIndexer(tmp_path / "test.db")
        indexer.index_chunks(sample_chunks, "test_book", "Test ML Book")

        # Search for all but filter to tables only
        results = indexer.search("learning", content_type_filter=["table"])
        for r in results:
            assert r.content_type == "table"
        indexer.close()
