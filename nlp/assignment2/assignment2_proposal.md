# CST8507 Assignment 2 — Proposal

## Title

**AI Textbook Q&A System: A RAG-Based Educational Question Answering System with Deep Source Tracing**

## Team Details

- Wang, Peng
- Yoo, Hye Ran

## Topic and Motivation

We will build an **Educational Question Answering** system that answers questions about AI/ML concepts using a curated collection of canonical textbooks as the knowledge base.

**Motivation:** Students studying AI, machine learning, and NLP face the challenge of navigating across many textbooks to find relevant information. Our system allows users to ask natural language questions and receive accurate, grounded answers with **deep source tracing** — not just citing a book title, but pinpointing the exact page and region where the answer was found. Users can click on any source reference to see the original PDF page with the relevant area highlighted. This promotes transparency and efficient learning.

## Dataset

Our knowledge base consists of **30+ canonical textbooks** in PDF format, covering:

| Domain                 | Books   | Examples                                                                  |
| ---------------------- | ------- | ------------------------------------------------------------------------- |
| Machine Learning       | 7 books | ISLR, ESL, PRML, Deep Learning (Goodfellow), PML (Murphy)                 |
| Mathematics            | 5 books | MML (Deisenroth), Convex Optimization (Boyd), Information Theory (MacKay) |
| NLP                    | 3 books | SLP3 (Jurafsky), Intro to IR (Manning), NLP Notes (Eisenstein)            |
| Reinforcement Learning | 1 book  | RL: An Introduction (Sutton & Barto)                                      |
| Computer Vision        | 1 book  | Computer Vision (Szeliski)                                                |
| Python                 | 3 books | Fluent Python (Ramalho), Python Cookbook (Beazley), Think Python (Downey) |

**Preprocessing pipeline:**

1. **Layout analysis** using MinerU (magic-pdf) with DocLayout-YOLO (GPU-accelerated) to detect document regions (text, tables, formulas, figures) with bounding box coordinates
2. **Specialized extraction** per content type: text → plain text, tables → HTML, formulas → LaTeX, figures → image + caption
3. Intelligent chunking with metadata (book title, chapter, page number, **bounding box coordinates**)
4. **Dual indexing:** SQLite with FTS5 full-text search index (BM25) + ChromaDB vector store with sentence-transformers embeddings (all-MiniLM-L6-v2)
5. **PageIndex tree generation** — hierarchical table-of-contents tree per book for reasoning-based retrieval

**Source:** All textbooks are publicly available open-access editions (e.g., from authors' websites or institutional repositories) or legally obtained educational copies already in our possession. Total dataset size: ~500MB of PDF documents.

## Approach

**RAG Architecture:** We adopt a **hybrid retrieval** architecture that combines four complementary retrieval methods, fused via Reciprocal Rank Fusion (RRF), to maximize retrieval quality across different query types.

1. **Document Processing:** MinerU (magic-pdf) for layout-aware PDF parsing — uses DocLayout-YOLO to detect 10 categories of document elements (title, text, table, formula, figure, etc.) and applies specialized models for each type, preserving bounding box coordinates throughout
2. **Chunking:** Layout-aware chunking that keeps tables and formulas intact as single chunks, with source metadata (book, page, section, bbox)
3. **Four Retrieval Methods:**
   - **① SQLite FTS5 Keyword Search (BM25):** Full-text search using SQLite's built-in FTS5 extension with BM25 ranking — fast exact keyword matching, sub-millisecond queries
   - **② ChromaDB Vector Search (Semantic):** Embedding-based retrieval using sentence-transformers (all-MiniLM-L6-v2) + ChromaDB — understands synonyms and semantic similarity
   - **③ PageIndex Tree Search (LLM Reasoning):** Inspired by [VectifyAI/PageIndex](https://github.com/VectifyAI/PageIndex), we build a hierarchical table-of-contents tree for each textbook, then use the LLM to navigate the tree top-down to find relevant sections — mimics how humans search through textbooks
   - **④ Metadata Filter Search (Structured):** Structured filtering by book title, chapter, page number, and content type (text/table/formula/figure) — handles specific queries like "show table 3.2 in PRML"
4. **Result Fusion:** Reciprocal Rank Fusion (RRF) combines results from all four methods into a single ranked list
5. **LLM:** Ollama with `qwen2.5:0.5b` model (~0.4GB memory footprint)
6. **UI:** Streamlit interface with question input, answer display, and **clickable source references that highlight the exact region on the original PDF page**

**Key Feature — Deep Source Tracing:** Each answer includes references to the exact book, chapter, page, and spatial location. Clicking a reference renders the original PDF page with the source region highlighted in a yellow bounding box, enabling users to instantly verify the answer against the original material.

## Plan of Work

| Week                  | Milestone                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------- |
| Week 1 (Mar 3–9)      | MinerU setup, PDF layout analysis pipeline, SQLite + ChromaDB schema, batch processing    |
| Week 2 (Mar 10–16)    | Chunking + embedding, FTS5 + ChromaDB indexing, PageIndex tree building, retrieval tuning |
| Week 3 (Mar 17–23)    | Four retrieval methods + RRF fusion, Ollama integration, RAG pipeline end-to-end          |
| Week 4 (Mar 24–30)    | Streamlit UI with source tracing, evaluation (20 test questions)                          |
| Week 5 (Mar 31–Apr 3) | ROS 2 integration (Part 2), final report, presentation                                    |

**Evaluation Method:** We will prepare 20 domain-specific questions spanning multiple textbooks, run the system on each, and manually assess correctness using a 3-level scale (1 = correct, 0.5 = partially correct, 0 = incorrect). For each question, we will also list the top 3 retrieved chunks and mark their relevance. The final accuracy score will be the average across all 20 questions.

## Expected Results

- A functional RAG-based Q&A system that answers AI/ML educational questions with **>80% accuracy**
- **Deep source tracing** with clickable references that highlight the exact region on original PDF pages
- Layout-aware processing that correctly handles tables, formulas, and figures without losing structure
- A responsive Streamlit UI for interactive querying

## Why Is It Interesting?

1. **Deep source tracing** — Goes beyond basic RAG by providing pixel-level traceability to original documents, not just page references
2. **Layout-aware parsing** — Uses YOLO-based document layout detection to preserve tables, formulas, and figures that traditional text extraction would break
3. **Practical utility** — Directly useful for students studying AI/ML across multiple textbooks
4. **Scalable** — The same architecture can be applied to any domain of knowledge
5. **Low resource** — Runs entirely locally with <1.5GB model, suitable for deployment on constrained hardware (robots)
