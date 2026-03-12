"""RAGCore — unified RAG pipeline shared by FastAPI and ROS2."""

from __future__ import annotations

import sqlite3

from backend.app.core.config import QueryConfig, RAGConfig
from backend.app.core.types import RAGResponse


class RAGCore:
    """Unified RAG pipeline entry point.

    Both FastAPI routers and the ROS2 node import and instantiate this class.
    Internal components are wired here; callers only call query().

    Components are resolved lazily on first use to keep startup fast.

    Example (FastAPI):
        core = RAGCore(db_path=str(DATABASE_PATH), config=rag_cfg)
        response = core.query("What is BM25?")

    Example (ROS2):
        core = RAGCore(db_path="/path/to/db", config=RAGConfig(default_model="qwen2.5:0.5b"))
        response = core.query(question, QueryConfig(top_k=3))
    """

    def __init__(self, db_path: str, config: RAGConfig | None = None) -> None:
        self._db_path = db_path
        self._config = config or RAGConfig(db_path=db_path)
        self._config.db_path = db_path

        # Components wired lazily (avoid circular import at module load time)
        self._retriever = None
        self._generator = None
        self._citation = None
        self._trace = None
        self._quality = None

    # ------------------------------------------------------------------
    # Lazy component accessors
    # ------------------------------------------------------------------

    def _get_db(self) -> sqlite3.Connection:
        """Open a fresh connection (thread-safe; caller closes it)."""
        conn = sqlite3.connect(self._db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def _get_retriever(self):
        if self._retriever is None:
            from backend.app.core.retrieval import RetrievalOrchestrator
            self._retriever = RetrievalOrchestrator(self._config)
        return self._retriever

    def _get_generator(self):
        if self._generator is None:
            from backend.app.core.generation import GenerationEngine
            self._generator = GenerationEngine(self._config)
        return self._generator

    def _get_citation(self):
        if self._citation is None:
            from backend.app.core.citation import CitationEngine
            self._citation = CitationEngine()
        return self._citation

    def _get_trace(self):
        from backend.app.core.trace import TraceCollector
        # TraceCollector is per-query; return a fresh instance each time
        return TraceCollector()

    def _get_quality(self):
        if self._quality is None:
            from backend.app.core.quality import QualityChecker
            self._quality = QualityChecker()
        return self._quality

    # ------------------------------------------------------------------
    # Main entry point
    # ------------------------------------------------------------------

    def query(self, question: str, config: QueryConfig | None = None) -> RAGResponse:
        """Execute the full RAG pipeline.

        Pipeline:
            1. Retrieve — run enabled strategies, fuse with RRF
            2. Generate — build prompt, call Ollama
            3. Citation  — validate, sanitize, map to sources
            4. Quality   — check for warnings
            5. Trace     — collect full audit trail

        Args:
            question: User question string.
            config:   Per-query config. None → sensible defaults (v1.0 behaviour).

        Returns:
            RAGResponse with answer, sources, trace, warnings, stats.
        """
        cfg = config or QueryConfig()
        trace = self._get_trace()
        db = self._get_db()

        try:
            # 1. Retrieve
            retrieval_result = self._get_retriever().retrieve(question, cfg, db)
            trace.record_retrieval(question, cfg, retrieval_result)

            # 2. Generate
            raw_answer = self._get_generator().generate(
                question, retrieval_result.chunks, cfg
            )
            trace.record_generation(cfg, raw_answer)

            # 3. Citation
            citation_result = self._get_citation().process(raw_answer, retrieval_result.chunks)
            trace.record_citations(citation_result)

            # 4. Quality
            warnings = self._get_quality().check(retrieval_result, citation_result)

        finally:
            db.close()

        return RAGResponse(
            answer=citation_result.cleaned_answer,
            sources=citation_result.sources,
            trace=trace.get_trace(),
            warnings=warnings,
            stats=retrieval_result.stats,
        )

    # ------------------------------------------------------------------
    # Utility
    # ------------------------------------------------------------------

    def list_strategies(self) -> list[dict]:
        """Return metadata for all registered strategies."""
        db = self._get_db()
        try:
            retriever = self._get_retriever()
            return retriever.registry.list_all()
        finally:
            db.close()
