/**
 * engine/llms — LLM model registry and availability
 * Aligned with: llama_index.llms → engine-v2/llms/ (resolver)
 *
 * Manages LLM model CRUD, provider health detection, and local model discovery
 * via Payload CMS Llms collection and Engine FastAPI endpoints.
 */

// ── Data layer ──────────────────────────────────────────────────────────────
export * from './types'
export * from './api'
export { useModels } from './useModels'
export type { UseModelsOptions, UseModelsReturn } from './useModels'

// ── Context ─────────────────────────────────────────────────────────────────
export { ModelProvider, useModelContext } from './ModelContext'
