"""citation — Orchestrate retriever + synthesizer into a full query engine.

Responsibilities:
    - Build RetrieverQueryEngine from hybrid retriever + citation synthesizer
    - Execute RAG queries and convert results to RAGResponse schema

Ref: llama_index — RetrieverQueryEngine
"""

from __future__ import annotations

from loguru import logger

from llama_index.core.postprocessor.types import BaseNodePostprocessor
from llama_index.core.schema import NodeWithScore, QueryBundle

from llama_index.core.query_engine import RetrieverQueryEngine

from engine_v2.response_synthesizers.citation import get_citation_synthesizer
from engine_v2.retrievers.hybrid import get_hybrid_retriever
from engine_v2.schema import RAGResponse, build_source
from engine_v2.settings import TOP_K


# ============================================================
# Node postprocessor — label each source with [Source N]
# ============================================================
class CitationLabelPostprocessor(BaseNodePostprocessor):
    """Prepend 'Source N:' to each chunk's text before synthesis.

    Mirrors LlamaIndex's CitationQueryEngine behavior so the LLM uses
    integer [N] citation markers instead of inventing section numbers.
    """

    def _postprocess_nodes(
        self,
        nodes: list[NodeWithScore],
        query_bundle: QueryBundle | None = None,
    ) -> list[NodeWithScore]:
        for i, nws in enumerate(nodes, start=1):
            original = nws.node.get_content()
            nws.node.set_content(f"Source {i}:\n{original}")
        return nodes


# ============================================================
# Engine factory
# ============================================================
def get_query_engine(
    similarity_top_k: int = TOP_K,
    streaming: bool = False,
) -> RetrieverQueryEngine:
    """Build a RetrieverQueryEngine from hybrid retriever + citation synthesizer.

    Architecture:
        RetrieverQueryEngine
        ├── retriever  → QueryFusionRetriever (BM25 + Vector → RRF)
        ├── synthesizer → CitationSynthesizer (COMPACT + citation prompts)
        └── postprocessor → CitationLabelPostprocessor (Source N: labels)

    Args:
        similarity_top_k: Number of chunks to retrieve.
        streaming: Whether to enable streaming generation.

    Returns:
        RetrieverQueryEngine ready for .query() / .aquery()
    """
    retriever = get_hybrid_retriever(similarity_top_k=similarity_top_k)
    synthesizer = get_citation_synthesizer(streaming=streaming)

    engine = RetrieverQueryEngine(
        retriever=retriever,
        response_synthesizer=synthesizer,
        node_postprocessors=[CitationLabelPostprocessor()],
    )

    logger.info("TextbookQueryEngine ready (top_k={}, streaming={})",
                similarity_top_k, streaming)
    return engine


# ============================================================
# Query convenience wrapper
# ============================================================
# _build_source removed — use shared build_source() from engine_v2.schema


def query(
    question: str,
    engine: RetrieverQueryEngine | None = None,
) -> RAGResponse:
    """Execute a RAG query and return a structured response.

    Convenience wrapper that converts LlamaIndex's Response
    into our project-specific RAGResponse schema.

    Args:
        question: User question string.
        engine: Optional pre-built engine. If None, builds a new one.

    Returns:
        RAGResponse with answer, sources, warnings, stats.
    """
    if engine is None:
        engine = get_query_engine()

    response = engine.query(question)

    # Map source nodes to our source format
    sources = [
        build_source(nws, i)
        for i, nws in enumerate(response.source_nodes, start=1)
    ]

    # Warnings
    warnings: list[str] = []
    if not response.source_nodes:
        warnings.append("No chunks retrieved — answer is unsupported by any source.")

    return RAGResponse(
        answer=str(response),
        sources=sources,
        warnings=warnings,
        stats={
            "source_count": len(response.source_nodes),
        },
    )
