# Semantic retriever — wraps ChromaDB for embedding-based similarity search.
# Ref: Manning, Intro to IR, Ch6 — Vector space model

from __future__ import annotations

from backend.app.indexing.chroma_indexer import ChromaIndexer
from backend.app.models import RetrievedChunk


class SemanticRetriever:
    """Embedding-based retrieval using ChromaDB and sentence-transformers."""

    def __init__(self, indexer: ChromaIndexer) -> None:
        self._indexer = indexer

    def search(
        self,
        query: str,
        top_k: int = 10,
        book_filter: list[str] | None = None,
        content_type_filter: list[str] | None = None,
    ) -> list[RetrievedChunk]:
        """Execute semantic similarity search.

        Args:
            query: User question.
            top_k: Max results.
            book_filter: Optional book_key whitelist..
            content_type_filter: Optional content type filter.

        Returns:
            Ranked list of RetrievedChunk objects.
        """
        results = self._indexer.search(
            query=query,
            top_k=top_k,
            book_filter=book_filter,
            content_type_filter=content_type_filter,
        )
        return [
            RetrievedChunk(chunk=chunk, score=similarity, method="semantic")
            for chunk, similarity in results
        ]
