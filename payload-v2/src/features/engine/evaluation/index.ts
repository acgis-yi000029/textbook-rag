/**
 * engine/evaluation — RAG quality evaluation
 * Aligned with: llama_index.evaluation → engine-v2/evaluation/ (evaluator)
 *
 * Manages evaluation results (faithfulness, relevancy, correctness)
 * via Payload CMS Evaluations collection.
 */

// ── Data layer ──────────────────────────────────────────────────────────────
export * from './types'
export * from './api'

// ── UI components ───────────────────────────────────────────────────────────
export { default as TracePanel } from './components/TracePanel'
export { default as ThinkingProcessPanel } from './components/ThinkingProcessPanel'
export { TraceStat, TracePromptBlock, TraceHitList, formatScore } from './components/TraceComponents'
