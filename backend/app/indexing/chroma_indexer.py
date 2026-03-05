# ChromaDB vector indexer — semantic similarity search with embeddings.
# Ref: Manning, Intro to IR, Ch6 — Vector space model and cosine similarity
# Uses Qwen3-Embedding with query/document prompt distinction for best retrieval.

from __future__ import annotations

import json
from pathlib import Path

import chromadb
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
from loguru import logger
from sentence_transformers import SentenceTransformer

from backend.app.models import Chunk

_COLLECTION_NAME = "textbook_chunks"
_BATCH_SIZE = 100  # Chunks per batch to avoid OOM


class _QwenEmbeddingFunction(EmbeddingFunction[Documents]):
    """Custom embedding function that uses Qwen3-Embedding with proper prompts.

    Qwen3-Embedding distinguishes between query and document embedding:
    - Documents are embedded without a prompt (used during indexing).
    - Queries use prompt_name="query" (used during search).

    ChromaDB's built-in SentenceTransformerEmbeddingFunction doesn't support
    this query/document distinction.
    """

    def __init__(self, model_name: str = "Qwen/Qwen3-Embedding-0.6B") -> None:
        self._model = SentenceTransformer(model_name, trust_remote_code=True)
        self._model_name = model_name

    def __call__(self, input: Documents) -> Embeddings:
        """Embed documents (no query prompt)."""
        embeddings = self._model.encode(input, show_progress_bar=False)
        return embeddings.tolist()

    def embed_query(self, query: str) -> list[float]:
        """Embed a query with the 'query' prompt for better retrieval."""
        embedding = self._model.encode(
            [query], prompt_name="query", show_progress_bar=False
        )
        return embedding[0].tolist()


class ChromaIndexer:
    """Create and query a ChromaDB vector index with Qwen3 embeddings."""

    def __init__(
        self, db_path: Path, model_name: str = "Qwen/Qwen3-Embedding-0.6B"
    ) -> None:
        db_path.mkdir(parents=True, exist_ok=True)
        self._embedding_fn = _QwenEmbeddingFunction(model_name=model_name)
        self._client = chromadb.PersistentClient(path=str(db_path))
        self._collection = self._client.get_or_create_collection(
            name=_COLLECTION_NAME,
            embedding_function=self._embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

    def index_chunks(self, chunks: list[Chunk]) -> int:
        """Add chunks to the vector index in batches.

        Skips chunks whose chunk_id already exists (idempotent).

        Returns:
            Number of new chunks inserted.
        """
        # Filter out already-indexed chunks
        existing_ids = set(self._collection.get(include=[])["ids"])
        new_chunks = [c for c in chunks if c.chunk_id not in existing_ids]

        if not new_chunks:
            logger.info("All {} chunks already indexed", len(chunks))
            return 0

        # Insert in batches
        for i in range(0, len(new_chunks), _BATCH_SIZE):
            batch = new_chunks[i : i + _BATCH_SIZE]
            self._collection.add(
                ids=[c.chunk_id for c in batch],
                documents=[c.text for c in batch],
                metadatas=[
                    {
                        "book_key": c.book_key,
                        "book_title": c.book_title,
                        "chapter": c.chapter or "",
                        "section": c.section or "",
                        "page_number": c.page_number,
                        "content_type": c.content_type,
                        "bbox_json": json.dumps(c.bbox),
                    }
                    for c in batch
                ],
            )

        logger.info(
            "Indexed {} new chunks (total: {})",
            len(new_chunks),
            self._collection.count(),
        )
        return len(new_chunks)

    def search(
        self,
        query: str,
        top_k: int = 10,
        book_filter: list[str] | None = None,
        content_type_filter: list[str] | None = None,
    ) -> list[tuple[Chunk, float]]:
        """Semantic similarity search using query-specific embedding.

        Args:
            query: Natural language question.
            top_k: Max results.
            book_filter: Optional book_key whitelist.
            content_type_filter: Optional content type whitelist.

        Returns:
            List of (Chunk, distance_score) tuples ranked by relevance.
        """
        where_clauses: list[dict] = []
        if book_filter:
            where_clauses.append({"book_key": {"$in": book_filter}})
        if content_type_filter:
            where_clauses.append({"content_type": {"$in": content_type_filter}})

        where = None
        if len(where_clauses) == 1:
            where = where_clauses[0]
        elif len(where_clauses) > 1:
            where = {"$and": where_clauses}

        # Use query-specific embedding for better retrieval
        query_embedding = self._embedding_fn.embed_query(query)

        results = self._collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, self._collection.count() or 1),
            where=where,
            include=["documents", "metadatas", "distances"],
        )

        chunks: list[tuple[Chunk, float]] = []
        if not results["ids"] or not results["ids"][0]:
            return chunks

        for idx, chunk_id in enumerate(results["ids"][0]):
            meta = results["metadatas"][0][idx]
            doc = results["documents"][0][idx]
            dist = results["distances"][0][idx]

            chunk = Chunk(
                chunk_id=chunk_id,
                book_key=meta.get("book_key", ""),
                book_title=meta.get("book_title", ""),
                chapter=meta.get("chapter", ""),
                section=meta.get("section", ""),
                page_number=int(meta.get("page_number", 0)),
                content_type=meta.get("content_type", "text"),
                text=doc,
                bbox=json.loads(meta.get("bbox_json", "[0,0,0,0]")),
            )
            # ChromaDB cosine distance → similarity: 1 - distance
            similarity = 1.0 - dist
            chunks.append((chunk, similarity))

        return chunks

    def count(self) -> int:
        """Total chunks in the collection."""
        return self._collection.count()
