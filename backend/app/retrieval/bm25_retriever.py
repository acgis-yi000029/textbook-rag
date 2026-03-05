# BM25 retriever — wraps SQLite FTS5 for keyword-based retrieval.
# Ref: Manning, Intro to IR, Ch11 — BM25 probabilistic ranking

from __future__ import annotations

from backend.app.indexing.sqlite_indexer import SQLiteIndexer
from backend.app.models import RetrievedChunk


class BM25Retriever:
    """Keyword-based retrieval using SQLite FTS5 with BM25 ranking."""

    def __init__(self, indexer: SQLiteIndexer) -> None:
        self._indexer = indexer

    def search(
        self,
        query: str,
        top_k: int = 10,
        book_filter: list[str] | None = None,
        content_type_filter: list[str] | None = None,
    ) -> list[RetrievedChunk]:
        """Execute BM25 keyword search.

        Args:
            query: User question.
            top_k: Max results.
            book_filter: Optional book_key whitelist.
            content_type_filter: Optional content type filter.

        Returns:
            Ranked list of RetrievedChunk objects.
        """
        chunks = self._indexer.search(
            query=query,
            top_k=top_k,
            book_filter=book_filter,
            content_type_filter=content_type_filter,
        )
        return [
            RetrievedChunk(chunk=c, score=1.0 / (i + 1), method="bm25")
            for i, c in enumerate(chunks)
        ]
