/**
 * engine/evaluation/types.ts
 * Aligned with: llama_index.evaluation → engine-v2/evaluation/evaluator.py
 *               → collections/Evaluations
 *
 * Types for RAG quality evaluation results.
 */

// ── Evaluation result from Payload CMS ──────────────────────────────────────
export interface EvaluationResult {
  id: number
  query: string
  answer: string | null
  referenceAnswer: string | null

  // Scores (0-1)
  faithfulness: number | null
  relevancy: number | null
  correctness: number | null

  // Evaluator feedback per dimension
  feedback: Record<string, string> | null

  // Meta
  model: string | null
  sourceCount: number | null
  batchId: string | null

  createdAt: string
  updatedAt: string
}

// ── Aggregated evaluation statistics ────────────────────────────────────────
export interface EvaluationStats {
  totalEvaluations: number
  avgFaithfulness: number | null
  avgRelevancy: number | null
  avgCorrectness: number | null
}

// ── Batch evaluation request ────────────────────────────────────────────────
export interface BatchEvalRequest {
  bookIds?: string[]
  questionCount?: number
  model?: string
}

// ── Batch evaluation response ───────────────────────────────────────────────
export interface BatchEvalResponse {
  batchId: string
  status: 'queued' | 'running' | 'done' | 'error'
  evaluated: number
  total: number
}
