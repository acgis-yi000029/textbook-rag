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
 * Pipeline stages — maps to engine-v2/ingestion/pipeline.py (v2, LlamaIndex-native)
 *
 *   chunked — MinerUReader → Document[] (BaseReader.load_data)
 *   toc     — TOC extraction from headings (project-specific)
 *   vector  — IngestionPipeline → ChromaDB (includes BM25 in-memory)
 *
 * v1 had 5 stages (chunked/stored/vector/fts/toc).
 * v2 drops "stored" (atomic in IngestionPipeline) and "fts" (BM25 is in-memory).
 */
export interface PipelineStages {
  chunked: StageStatus
  toc: StageStatus
  vector: StageStatus
}

// ── Stage keys and display config ───────────────────────────────────────────
export const PIPELINE_STAGE_KEYS = ['chunked', 'toc', 'vector'] as const
export type PipelineStageKey = (typeof PIPELINE_STAGE_KEYS)[number]

export interface PipelineStageConfig {
  key: PipelineStageKey
  label: string
  labelZh: string
}

export const PIPELINE_STAGE_CONFIGS: PipelineStageConfig[] = [
  { key: 'chunked', label: 'Chunked', labelZh: '分块' },
  { key: 'toc',     label: 'TOC',     labelZh: 'TOC' },
  { key: 'vector',  label: 'Vector',  labelZh: '向量' },
]

// ── Cover image from Payload Media upload ───────────────────────────────────
export interface CoverImage {
  id: number
  url: string
  alt?: string
  sizes?: {
    thumbnail?: { url: string; width: number; height: number }
    card?: { url: string; width: number; height: number }
  }
}

// ── Full book record from Payload REST API ──────────────────────────────────
export interface LibraryBook {
  id: number
  engineBookId: string
  title: string
  authors: string | null
  isbn: string | null
  coverImage: CoverImage | null
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
