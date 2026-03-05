# RAG Engine — orchestrates retrieval, fusion, and generation.
# This is the main entry point for query processing.
# Ref: DDIA (Kleppmann), Ch12 — composing data systems from specialized components

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout

from loguru import logger

from backend.app.config import Config
from backend.app.generation.generator import AnswerGenerator
from backend.app.indexing.chroma_indexer import ChromaIndexer
from backend.app.indexing.pageindex_builder import PageIndexBuilder
from backend.app.indexing.sqlite_indexer import SQLiteIndexer
from backend.app.models import BookInfo, QueryResult, RetrievedChunk
from backend.app.retrieval.bm25_retriever import BM25Retriever
from backend.app.retrieval.pageindex_retriever import PageIndexRetriever
from backend.app.retrieval.rrf_fuser import RRFFuser
from backend.app.retrieval.semantic_retriever import SemanticRetriever
from backend.app.tracing.source_tracer import SourceTracer


class RAGEngine:
    """Orchestrates the full RAG pipeline: retrieve → fuse → generate.

    Designed as a standalone class with no UI dependency,
    ready for ROS 2 wrapping (architecture ADR — OOP-ready design).
    """

    def __init__(self, config: Config) -> None:
        self._config = config

        # Data stores
        self._sqlite = SQLiteIndexer(config.paths.sqlite_db)
        self._chroma = ChromaIndexer(
            config.paths.chroma_db,
            model_name=config.embedding.model,
        )

        # PageIndex trees
        pi_builder = PageIndexBuilder()
        self._trees = pi_builder.load_all_trees(config.paths.pageindex_trees)

        # Retrievers
        self._bm25 = BM25Retriever(self._sqlite)
        self._semantic = SemanticRetriever(self._chroma)
        self._pageindex = PageIndexRetriever(
            ollama_host=config.ollama.host,
            model=config.ollama.model,
            sqlite_indexer=self._sqlite,
        )
        self._fuser = RRFFuser(k=config.retrieval.rrf_k)

        # Generator
        self._generator = AnswerGenerator(
            host=config.ollama.host,
            model=config.ollama.model,
            timeout=config.ollama.timeout,
        )

        # Source tracer
        self._tracer = SourceTracer(
            textbooks_dir=config.paths.textbooks_dir,
            mineru_output_dir=config.paths.mineru_output,
        )

        logger.info(
            "RAGEngine initialized: {} SQLite chunks, {} ChromaDB chunks, {} PageIndex trees",
            self._sqlite.total_chunks(),
            self._chroma.count(),
            len(self._trees),
        )

    def query(
        self,
        question: str,
        book_filter: list[str] | None = None,
        content_type_filter: list[str] | None = None,
        top_k: int | None = None,
    ) -> QueryResult:
        """Execute the full RAG pipeline.

        1. Run retrieval methods in parallel (with timeout).
        2. Fuse results with RRF.
        3. Generate answer with LLM.

        Args:
            question: User's natural language question.
            book_filter: Optional book_key whitelist.
            content_type_filter: Optional content type filter.
            top_k: Override default top_k from config.

        Returns:
            QueryResult with answer, sources, and stats.
        """
        if top_k is None:
            top_k = self._config.retrieval.top_k

        methods = self._config.retrieval.methods
        timeout = self._config.retrieval.parallel_timeout
        results_per_method: dict[str, list[RetrievedChunk]] = {}
        stats: dict[str, str] = {}

        # Parallel retrieval using ThreadPoolExecutor
        # Ref: Ramalho, Fluent Python, Ch20 — concurrent.futures for I/O-bound parallelism
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = {}

            if methods.get("bm25"):
                futures["bm25"] = executor.submit(
                    self._bm25.search,
                    question,
                    top_k * 2,
                    book_filter,
                    content_type_filter,
                )
            if methods.get("semantic"):
                futures["semantic"] = executor.submit(
                    self._semantic.search,
                    question,
                    top_k * 2,
                    book_filter,
                    content_type_filter,
                )
            if methods.get("pageindex") and self._trees:
                futures["pageindex"] = executor.submit(
                    self._pageindex.search,
                    question,
                    self._trees,
                    top_k,
                )

            for method, future in futures.items():
                try:
                    results_per_method[method] = future.result(timeout=timeout)
                    stats[method] = f"✅ {len(results_per_method[method])} results"
                except FutureTimeout:
                    logger.warning("{} retrieval timed out ({}s)", method, timeout)
                    results_per_method[method] = []
                    stats[method] = f"⏱️ timeout ({timeout}s)"
                except Exception as exc:
                    logger.error("{} retrieval failed: {}", method, exc)
                    results_per_method[method] = []
                    stats[method] = f"❌ error: {exc}"

        # RRF fusion
        fused = self._fuser.fuse(results_per_method, top_k=top_k)
        stats["rrf_fused"] = f"{len(fused)} chunks"

        # Generate answer
        fused_chunks = [rc.chunk for rc in fused]
        result = self._generator.generate(question, fused_chunks)
        result.retrieval_stats = stats

        return result

    def get_available_books(self) -> list[BookInfo]:
        """List all indexed books."""
        return self._sqlite.get_books()

    def render_source(
        self,
        book_key: str,
        page_number: int,
        bbox: list[float],
        zoom: float = 1.5,
    ):
        """Render a PDF page with highlighted source region."""
        return self._tracer.render_page_with_highlight(
            book_key,
            page_number,
            bbox,
            zoom,
        )

    def check_health(self) -> dict[str, bool]:
        """Check health of all system components."""
        return {
            "sqlite": self._sqlite.total_chunks() > 0,
            "chroma": self._chroma.count() > 0,
            "pageindex": len(self._trees) > 0,
            "ollama": self._generator.check_health(),
        }

    def close(self) -> None:
        """Clean up resources."""
        self._sqlite.close()
