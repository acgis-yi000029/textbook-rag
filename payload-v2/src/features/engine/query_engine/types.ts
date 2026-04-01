/**
 * engine/query_engine/types.ts
 * Aligned with: llama_index.query_engine → engine-v2/query_engine/
 *               → collections/Queries
 *
 * Types for query requests, responses, and full trace data.
 */

import type { SourceInfo, RetrievalStats, RetrievalTrace } from '../retrievers/types'
import type { GenerationTrace } from '../response_synthesizers/types'

// ── Query filters ───────────────────────────────────────────────────────────
export interface QueryFilters {
  book_ids?: number[]
  book_id_strings?: string[]
  chapter_ids?: number[]
  content_types?: string[]
}

// ── Query request ───────────────────────────────────────────────────────────
export interface QueryRequest {
  question: string
  filters?: QueryFilters
  top_k?: number
  model?: string
  provider?: string
}

// ── Full query trace (retrieval + generation) ───────────────────────────────
export interface QueryTrace {
  question: string
  top_k: number
  filters: QueryFilters | null
  active_book_title: string | null
  retrieval: RetrievalTrace
  generation: GenerationTrace
}

// ── Query response ──────────────────────────────────────────────────────────
export interface QueryResponse {
  answer: string
  sources: SourceInfo[]
  retrieval_stats: RetrievalStats
  trace: QueryTrace
}

// ── Book summary (for query context) ────────────────────────────────────────
export interface BookSummary {
  id: number
  book_id: string
  title: string
  authors: string
  page_count: number
  chapter_count: number
  chunk_count: number
  category: string
  subcategory: string
}

export interface ChapterInfo {
  id: number
  chapter_key: string
  title: string
  start_page: number | null
}

export interface BookDetail extends BookSummary {
  chapters: ChapterInfo[]
}

export interface TocEntry {
  id: number
  level: number
  number: string
  title: string
  pdf_page: number
}
