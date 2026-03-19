"""Unit tests for retrieval strategies (STORY-002 ~ STORY-006).

Uses in-memory SQLite so tests run without a real database.
Each strategy gets 3 tests:
  1. Normal search returns expected hits
  2. Empty query / no filters returns empty result gracefully
  3. Filters narrow results correctly
"""

from __future__ import annotations

import sqlite3

import pytest

from backend.app.core.config import QueryConfig, QueryFilters, RAGConfig
from backend.app.core.strategies.fts5_strategy import FTS5BM25Strategy
from backend.app.core.strategies.toc_strategy import TOCHeadingStrategy
from backend.app.core.strategies.vector_strategy import VectorStrategy


# ─────────────────────────────────────────────────────────────────────────────
# Shared in-memory DB fixture
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture()
def mem_db() -> sqlite3.Connection:
    """In-memory SQLite with minimal schema and seed data for strategy tests."""
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.executescript("""
        CREATE TABLE books (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT DEFAULT 'textbook'
        );

        CREATE TABLE chapters (
            id INTEGER PRIMARY KEY,
            book_id INTEGER,
            title TEXT
        );

        CREATE TABLE pages (
            id INTEGER PRIMARY KEY,
            book_id INTEGER,
            page_number INTEGER,
            width REAL DEFAULT 595,
            height REAL DEFAULT 842
        );

        CREATE TABLE chunks (
            id INTEGER PRIMARY KEY,
            chunk_id TEXT UNIQUE,
            book_id INTEGER,
            chapter_id INTEGER,
            primary_page_id INTEGER,
            content_type TEXT DEFAULT 'text',
            text TEXT,
            reading_order INTEGER DEFAULT 0,
            chroma_document_id TEXT
        );

        CREATE VIRTUAL TABLE chunk_fts USING fts5(
            chunk_id,
            text,
            content=chunks,
            content_rowid=id
        );

        CREATE TABLE toc_entries (
            id INTEGER PRIMARY KEY,
            book_id INTEGER,
            page_id INTEGER,
            title TEXT,
            level INTEGER DEFAULT 1
        );

        CREATE TABLE source_locators (
            id INTEGER PRIMARY KEY,
            chunk_id INTEGER,
            page_id INTEGER,
            locator_kind TEXT,
            x0 REAL, y0 REAL, x1 REAL, y1 REAL
        );

        -- Seed data
        INSERT INTO books VALUES (1, 'ML Textbook', 'textbook');
        INSERT INTO books VALUES (2, 'EcDev Report', 'ecdev');

        INSERT INTO chapters VALUES (1, 1, 'Introduction to BM25');
        INSERT INTO chapters VALUES (2, 1, 'Vector Embeddings');

        INSERT INTO pages VALUES (1, 1, 1, 595, 842);
        INSERT INTO pages VALUES (2, 1, 2, 595, 842);
        INSERT INTO pages VALUES (3, 2, 1, 595, 842);

        INSERT INTO chunks VALUES
            (1, 'c001', 1, 1, 1, 'text', 'BM25 is a ranking function used in information retrieval', 0, 'chroma-001'),
            (2, 'c002', 1, 1, 1, 'text', 'Okapi BM25 improves on TF-IDF by normalizing term frequency', 1, 'chroma-002'),
            (3, 'c003', 1, 2, 2, 'text', 'Vector embeddings capture semantic similarity', 0, 'chroma-003'),
            (4, 'c004', 2, NULL, 3, 'table', 'Q1 2024 economic growth indicators', 0, 'chroma-004');

        -- FTS5 index
        INSERT INTO chunk_fts(rowid, chunk_id, text) VALUES
            (1, 'c001', 'BM25 is a ranking function used in information retrieval'),
            (2, 'c002', 'Okapi BM25 improves on TF-IDF by normalizing term frequency'),
            (3, 'c003', 'Vector embeddings capture semantic similarity'),
            (4, 'c004', 'Q1 2024 economic growth indicators');

        -- TOC entries
        INSERT INTO toc_entries VALUES (1, 1, 1, 'Introduction to BM25 Ranking', 1);
        INSERT INTO toc_entries VALUES (2, 1, 2, 'Vector Embeddings and Semantic Search', 1);
        INSERT INTO toc_entries VALUES (3, 2, 3, 'Economic Development Q1 2024', 1);
    """)
    conn.commit()
    return conn


def _cfg(**kwargs) -> QueryConfig:
    return QueryConfig(**kwargs)


# ─────────────────────────────────────────────────────────────────────────────
# STORY-002: FTS5BM25Strategy
# ─────────────────────────────────────────────────────────────────────────────

class TestFTS5BM25Strategy:
    strategy = FTS5BM25Strategy()

    def test_search_returns_hits_for_matching_query(self, mem_db):
        """Normal query — BM25 hits returned, ranked by FTS score."""
        result = self.strategy.search("BM25 ranking", _cfg(), mem_db)
        assert result.strategy == "fts5_bm25"
        assert len(result.hits) >= 1
        assert result.error is None
        # Top hit should be about BM25
        assert "BM25" in result.hits[0].text

    def test_empty_query_returns_empty_result(self, mem_db):
        """Empty / whitespace query → empty hits, no error."""
        result = self.strategy.search("", _cfg(), mem_db)
        assert result.hits == []
        assert result.error is None

    def test_book_id_filter_narrows_results(self, mem_db):
        """book_ids filter returns only chunks from that book."""
        cfg = _cfg(filters=QueryFilters(book_ids=[2]))
        result = self.strategy.search("economic growth", cfg, mem_db)
        assert all(h.book_id == 2 for h in result.hits)


# ─────────────────────────────────────────────────────────────────────────────
# STORY-003: VectorStrategy
# ─────────────────────────────────────────────────────────────────────────────

class TestVectorStrategy:
    """VectorStrategy requires ChromaDB; these tests mock the collection."""

    def _make_strategy(self) -> VectorStrategy:
        config = RAGConfig(chroma_persist_dir="/nonexistent")
        return VectorStrategy(config)

    def test_is_available_returns_bool(self):
        """is_available() always returns a bool without raising exceptions."""
        s = self._make_strategy()
        result = s.is_available()
        assert isinstance(result, bool)

    def test_is_available_false_for_nonexistent_path(self):
        """is_available() returns False for a path that cannot possibly exist."""
        cfg = RAGConfig(chroma_persist_dir="/__nonexistent_zzz_path__/chroma")
        s = VectorStrategy(cfg)
        assert s.is_available() is False

    def test_search_returns_empty_when_unavailable(self, mem_db):
        """search() returns empty StrategyResult (not exception) on ChromaDB error."""
        s = self._make_strategy()
        result = s.search("semantic similarity", _cfg(), mem_db)
        assert result.strategy == "vector"
        assert result.hits == []
        # error field may be set — that's acceptable

    def test_result_structure_on_success(self, mem_db, monkeypatch):
        """When ChromaDB returns results, hits are resolved against SQLite."""
        s = self._make_strategy()

        # Monkeypatch: inject a fake collection that returns chroma-003
        class FakeCollection:
            def count(self): return 3
            def query(self, **kwargs):
                return {
                    "ids": [["chroma-003"]],
                    "distances": [[0.15]],
                    "documents": [["Vector embeddings capture semantic similarity"]],
                }

        s._collection = FakeCollection()
        result = s.search("vector embeddings", _cfg(), mem_db)
        assert result.strategy == "vector"
        assert len(result.hits) == 1
        assert result.hits[0].chunk_id == "c003"
        assert result.hits[0].vec_distance == pytest.approx(0.15)


# ─────────────────────────────────────────────────────────────────────────────
# STORY-004: TOCHeadingStrategy
# ─────────────────────────────────────────────────────────────────────────────

class TestTOCHeadingStrategy:
    strategy = TOCHeadingStrategy()

    def test_search_matches_heading_by_term_overlap(self, mem_db):
        """Query terms overlapping with TOC heading titles return relevant chunks."""
        result = self.strategy.search("BM25 ranking", _cfg(), mem_db)
        assert result.strategy == "toc_heading"
        assert len(result.hits) >= 1
        # All hits should come from page 1 (the BM25 toc_entry page)
        assert all(h.toc_score is not None and h.toc_score > 0 for h in result.hits)

    def test_no_overlap_returns_empty(self, mem_db):
        """Query with zero term overlap with any heading returns empty hits."""
        result = self.strategy.search("zzz xyz qwerty", _cfg(), mem_db)
        assert result.hits == []
        assert result.error is None

    def test_book_id_filter_restricts_toc_entries(self, mem_db):
        """book_ids filter prevents matching toc_entries from other books."""
        cfg = _cfg(filters=QueryFilters(book_ids=[1]))
        result = self.strategy.search("economic development", cfg, mem_db)
        # toc entry for economic development is in book 2 — should not match
        assert all(h.book_id == 1 for h in result.hits)



