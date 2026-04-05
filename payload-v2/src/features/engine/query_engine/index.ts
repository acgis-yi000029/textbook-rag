/**
 * engine/query_engine — Query execution and response
 * Aligned with: llama_index.query_engine → engine-v2/query_engine/ (RetrieverQueryEngine)
 *
 * Wraps Engine FastAPI /engine/query and /engine/query/stream endpoints.
 * The QueryEngine orchestrates retriever + response_synthesizer internally.
 */

export * from './types'
export * from './api'
export { useQueryEngine } from './useQueryEngine'
