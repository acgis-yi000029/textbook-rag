# Test Report — AI Textbook Q&A System

**Date**: 2026-03-04
**Tester**: Frank (QA Engineer)
**Framework**: pytest 7.4.3 + Python 3.12.10

---

## Overview

| Metric      | Value |
| ----------- | ----- |
| Total tests | 55    |
| Passed      | 55    |
| Failed      | 0     |
| Skipped     | 0     |
| Duration    | 0.31s |

## Test Coverage by Module

| Module                          | Test File                   | Tests | Status      |
| ------------------------------- | --------------------------- | ----- | ----------- |
| `models.py`                     | `test_models.py`            | 10    | ✅ All pass |
| `preprocessing/parser.py`       | `test_parser.py`            | 12    | ✅ All pass |
| `preprocessing/chunker.py`      | `test_chunker.py`           | 10    | ✅ All pass |
| `indexing/sqlite_indexer.py`    | `test_sqlite_indexer.py`    | 9     | ✅ All pass |
| `indexing/pageindex_builder.py` | `test_pageindex_builder.py` | 7     | ✅ All pass |
| `retrieval/rrf_fuser.py`        | `test_rrf_fuser.py`         | 7     | ✅ All pass |

## Modules Not Unit-Tested (External Dependencies)

These modules require live external services and are tested via integration/manual:

| Module                             | Reason                                         | Covered By                                             |
| ---------------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `indexing/chroma_indexer.py`       | Requires Qwen3-Embedding model download        | Manual indexing test (build_index.py ran successfully) |
| `retrieval/bm25_retriever.py`      | Thin wrapper over SQLiteIndexer (tested above) | SQLite tests cover core logic                          |
| `retrieval/semantic_retriever.py`  | Thin wrapper over ChromaIndexer                | Manual via Streamlit UI                                |
| `retrieval/pageindex_retriever.py` | Requires live Ollama                           | Manual via Streamlit UI                                |
| `generation/generator.py`          | Requires live Ollama                           | Manual via Streamlit UI + 20-question eval             |
| `tracing/source_tracer.py`         | Requires PDF files                             | Manual via Streamlit UI                                |
| `rag_engine.py`                    | Orchestrator, uses all above                   | Manual via Streamlit UI + 20-question eval             |

## Bugs Found During Testing

| #   | Severity | Description                                                                                                                                                                                      | File                 | Fix                                                                |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------ |
| 1   | **HIGH** | Infinite loop in chunker overlap split — when text exceeds `max_tokens`, the overlap loop never terminates because `start = end - overlap_chars` goes backwards but `end` stays at `len(merged)` | `chunker.py:157-160` | ✅ **Fixed**: Break when `end >= len(merged)` before stepping back |

## Test Details

### Models (10 tests)

- ContentItem: minimal creation, text_level optional
- Chunk: defaults, all content types
- RetrievedChunk: creation with score and method
- SourceReference: citation_id linkage
- QueryResult: empty, with stats
- PageIndexNode: children, defaults
- BookInfo: creation with defaults

### Parser (12 tests)

- parse_content_list: valid JSON, discarded/empty filtering
- Type normalization: image → figure
- text_level, bbox, page_idx preservation
- Edge cases: nonexistent file, invalid bbox
- discover_books: empty dir, nonexistent dir, valid structure

### Chunker (10 tests)

- Basic chunking with correct metadata
- Tables and formulas never split (standalone chunks)
- Chapter/section heading tracking
- Chunk ID format validation
- Book title lookup and fallback
- Long text splitting with overlap (bug found and fixed!)
- Empty input edge case
- Token count population

### SQLite Indexer (9 tests)

- Index and count correctness
- Idempotent re-indexing (skip duplicates)
- BM25 search returns relevant results
- Book filter and content_type filter
- Page range queries
- get_books() metadata
- Empty database search

### PageIndex Builder (7 tests)

- Basic tree construction
- Heading hierarchy (L1 → root, L2 → children)
- Page range computation
- Save/load JSON roundtrip
- load_all_trees directory scan
- Empty items edge case
- Nonexistent directory handling

### RRF Fuser (7 tests)

- Single method preserves order
- Multi-method overlap boosting
- Deduplication across methods
- top_k output limiting
- Empty input handling
- Method label set to "rrf_fused"
- Mathematical formula verification: `score = Σ 1/(k + rank + 1)`
