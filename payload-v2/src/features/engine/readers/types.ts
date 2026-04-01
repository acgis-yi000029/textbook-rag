/**
 * engine/readers/types.ts
 * Aligned with: llama_index.readers → engine-v2/readers/ → collections/Books
 *
 * Type definitions for book/document sources managed by Payload CMS.
 */

// ── Book overall status from Payload collection ─────────────────────────────
export type BookStatus = 'pending' | 'processing' | 'indexed' | 'error'

// ── Book category from Payload collection ───────────────────────────────────
export type BookCategory = 'textbook' | 'ecdev' | 'real_estate'

// ── Pipeline stage status (per-stage) ───────────────────────────────────────
export type StageStatus = 'pending' | 'done' | 'error'

/**
 * Pipeline stages — maps to engine-v2/ingestion/pipeline.py
 *
 *   chunked — MinerU → chunks[]
 *   stored  — chunks → Payload PG
 *   vector  — chunks → ChromaDB
 *   fts     — chunks → SQLite FTS5
 *   toc     — TOC extraction
 */
export interface PipelineStages {
  chunked: StageStatus
  stored: StageStatus
  vector: StageStatus
  fts: StageStatus
  toc: StageStatus
}

// ── Stage keys and display config ───────────────────────────────────────────
export const PIPELINE_STAGE_KEYS = ['chunked', 'stored', 'vector', 'fts', 'toc'] as const
export type PipelineStageKey = (typeof PIPELINE_STAGE_KEYS)[number]

export interface PipelineStageConfig {
  key: PipelineStageKey
  label: string
  labelZh: string
}

export const PIPELINE_STAGE_CONFIGS: PipelineStageConfig[] = [
  { key: 'chunked', label: 'Chunked', labelZh: '分块' },
  { key: 'stored',  label: 'Stored',  labelZh: '存储' },
  { key: 'vector',  label: 'Vector',  labelZh: '向量' },
  { key: 'fts',     label: 'FTS',     labelZh: 'FTS' },
  { key: 'toc',     label: 'TOC',     labelZh: 'TOC' },
]

// ── Full book record from Payload REST API ──────────────────────────────────
export interface LibraryBook {
  id: number
  engineBookId: string
  title: string
  authors: string | null
  isbn: string | null
  category: BookCategory
  subcategory: string | null
  status: BookStatus
  chunkCount: number | null
  metadata: {
    pageCount?: number
    chapterCount?: number
    source?: string
  } | null
  pipeline: PipelineStages
  createdAt: string
  updatedAt: string
}

// ── Category filter option (UI) ─────────────────────────────────────────────
export interface CategoryOption {
  value: BookCategory | 'all'
  label: string
  labelZh: string
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'all', label: 'All', labelZh: '全部' },
  { value: 'textbook', label: 'Textbook', labelZh: '教材' },
  { value: 'ecdev', label: 'EC Dev', labelZh: '经济发展' },
  { value: 'real_estate', label: 'Real Estate', labelZh: '房地产' },
]
