"""MetadataFilterStrategy — structured-condition chunk filtering.

STORY-006: filter-type strategy that returns chunks matching exact metadata
conditions.  Unlike semantic strategies, the query string is NOT used for
scoring; chunks are ranked by reading_order.

Supported filter dimensions (from QueryConfig.filters):
  - book_ids         → c.book_id IN (...)
  - chapter_ids      → c.chapter_id IN (...)
  - content_types    → c.content_type IN (...)
  - categories       → b.category IN (...)

This strategy is disabled by default.  Enable it when the user selects
specific structural filters (e.g. via the frontend CategoryFilter panel).
"""

from __future__ import annotations

import sqlite3

from backend.app.core.config import QueryConfig
from backend.app.core.strategies.base import RetrievalStrategy
from backend.app.core.types import ChunkHit, StrategyResult


class MetadataFilterStrategy(RetrievalStrategy):
    """Exact-match chunk filter strategy.

    Returns chunks satisfying the QueryFilters conditions, ranked by
    reading_order.  If no filters are active the strategy returns an
    empty result (it makes no sense to return *all* chunks unfiltered).

    Design choice: score = 1.0 for all returned chunks (uniform, since
    this strategy does not rank by relevance — RRF handles the blending
    with semantic strategies).
    """

    name: str = "metadata_filter"
    display_name: str = "Metadata Filter"
    default_enabled: bool = False

    def search(
        self,
        query: str,  # not used for scoring, but kept for interface compatibility
        config: QueryConfig,
        db: sqlite3.Connection,
    ) -> StrategyResult:
        f = config.filters

        # Guard: no filters → don't flood results with every chunk
        has_filters = any([
            f.book_ids,
            f.chapter_ids,
            f.content_types,
            f.categories,
        ])
        if not has_filters:
            return StrategyResult(strategy=self.name, hits=[], query_used=query)

        fetch_k = config.effective_fetch_k

        # ── Build WHERE clause ────────────────────────────────────────────
        where_clauses: list[str] = []
        params: list[object] = []
        need_books_join = bool(f.categories)

        if f.book_ids:
            ph = ",".join("?" * len(f.book_ids))
            where_clauses.append(f"c.book_id IN ({ph})")
            params.extend(f.book_ids)

        if f.chapter_ids:
            ph = ",".join("?" * len(f.chapter_ids))
            where_clauses.append(f"c.chapter_id IN ({ph})")
            params.extend(f.chapter_ids)

        if f.content_types:
            ph = ",".join("?" * len(f.content_types))
            where_clauses.append(f"c.content_type IN ({ph})")
            params.extend(f.content_types)

        if f.categories:
            ph = ",".join("?" * len(f.categories))
            where_clauses.append(f"b.category IN ({ph})")
            params.extend(f.categories)

        where_sql = "WHERE " + " AND ".join(where_clauses)
        books_join = "LEFT JOIN books b ON b.id = c.book_id" if need_books_join else ""

        sql = (
            "SELECT c.id, c.chunk_id, c.book_id, c.chapter_id, c.primary_page_id,"
            "       c.content_type, c.text, c.reading_order, c.chroma_document_id "
            "FROM chunks c "
            f"{books_join} "
            f"{where_sql} "
            "ORDER BY c.book_id, c.reading_order ASC "
            f"LIMIT {fetch_k}"
        )

        try:
            rows = db.execute(sql, params).fetchall()
        except Exception as exc:  # noqa: BLE001
            return StrategyResult(
                strategy=self.name, hits=[], query_used=query, error=str(exc)
            )

        hits: list[ChunkHit] = []
        for rank, row in enumerate(rows, start=1):
            r = dict(row)
            hits.append(
                ChunkHit(
                    id=r["id"],
                    chunk_id=r["chunk_id"],
                    book_id=r["book_id"],
                    text=r["text"],
                    content_type=r.get("content_type", "text"),
                    reading_order=r.get("reading_order", 0),
                    chroma_document_id=r.get("chroma_document_id"),
                    # No semantic score; use a uniform signal for RRF
                    fts_score=1.0,
                    fts_rank=rank,
                )
            )

        return StrategyResult(strategy=self.name, hits=hits, query_used=query)
