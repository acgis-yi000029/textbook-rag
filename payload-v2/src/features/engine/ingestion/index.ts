/**
 * engine/ingestion — Ingestion pipeline management
 * Aligned with: llama_index.ingestion → engine-v2/ingestion/
 *
 * Manages ingestion task lifecycle via Payload CMS IngestTasks collection.
 */

// ── Data layer ──────────────────────────────────────────────────────────────
export * from './types'
export * from './api'

// ── UI components ───────────────────────────────────────────────────────────
export { default as PipelineActions } from './components/PipelineActions'
export { default as PipelineDashboard } from './components/PipelineDashboard'
