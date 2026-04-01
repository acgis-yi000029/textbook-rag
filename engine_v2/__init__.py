"""
Textbook RAG Engine v2 — LlamaIndex-native rewrite.

Module naming follows llama_index.core.* conventions:

    chunking/                — Chapter extraction + text splitting (core.node_parser alias)
    embeddings/              — Embedding model management (core.embeddings)
    toc/                     — TOC extraction and structuring (project-specific)
    readers/                 — MinerUReader → Document[] (uses chunking/)
    ingestion/               — IngestionPipeline + transformations → ChromaDB (uses embeddings/)
    retrievers/              — HybridRetriever (BM25 + Vector → RRF)
    response_synthesizers/   — CitationSynthesizer (citation-aware generation)
    query_engine/            — RetrieverQueryEngine (retriever + synthesizer)
    llms/                    — LLM resolver (Ollama / Azure OpenAI routing)
    evaluation/              — Faithfulness / Relevancy / Correctness
    question_gen/            — LLM-based question generation
    api/                     — FastAPI thin layer (project-specific)
    schema.py                — Project-specific types (BookMeta, RAGResponse)
    settings.py              — LlamaIndex Settings singleton + env config
"""

__version__ = "2.0.0"
