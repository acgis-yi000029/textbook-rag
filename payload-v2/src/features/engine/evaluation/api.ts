/**
 * engine/evaluation/api.ts
 * Aligned with: llama_index.evaluation → engine-v2/evaluation/evaluator.py
 *               → collections/Evaluations
 *
 * API wrappers for evaluation CRUD and batch evaluation triggers.
 */

import type { EvaluationResult, EvaluationStats, BatchEvalRequest, BatchEvalResponse } from './types'

const ENGINE = process.env.NEXT_PUBLIC_ENGINE_URL || 'http://localhost:8000'

// ── Helpers ─────────────────────────────────────────────────────────────────

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

// ── 1. Fetch evaluations from Payload CMS ───────────────────────────────────

/** Fetch all evaluation results, optionally filtered by batchId or model */
export async function fetchEvaluations(opts?: {
  batchId?: string
  model?: string
  limit?: number
}): Promise<{ evaluations: EvaluationResult[]; total: number }> {
  const params = new URLSearchParams()
  params.set('limit', String(opts?.limit ?? 100))
  params.set('sort', '-createdAt')

  if (opts?.batchId) params.set('where[batchId][equals]', opts.batchId)
  if (opts?.model) params.set('where[model][equals]', opts.model)

  const data = await request<{ docs: any[]; totalDocs: number }>(
    `/api/evaluations?${params}`
  )

  return {
    evaluations: data.docs.map(mapEvaluation),
    total: data.totalDocs,
  }
}

/** Fetch a single evaluation by ID */
export async function fetchEvaluation(id: number): Promise<EvaluationResult> {
  const data = await request<any>(`/api/evaluations/${id}`)
  return mapEvaluation(data)
}

// ── 2. Aggregated statistics ────────────────────────────────────────────────

/** Compute aggregated evaluation stats (client-side) */
export async function fetchEvaluationStats(batchId?: string): Promise<EvaluationStats> {
  const { evaluations } = await fetchEvaluations({ batchId, limit: 500 })

  if (evaluations.length === 0) {
    return { totalEvaluations: 0, avgFaithfulness: null, avgRelevancy: null, avgCorrectness: null }
  }

  const avg = (vals: (number | null)[]) => {
    const valid = vals.filter((v): v is number => v !== null)
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null
  }

  return {
    totalEvaluations: evaluations.length,
    avgFaithfulness: avg(evaluations.map((e) => e.faithfulness)),
    avgRelevancy: avg(evaluations.map((e) => e.relevancy)),
    avgCorrectness: avg(evaluations.map((e) => e.correctness)),
  }
}

// ── 3. Trigger batch evaluation (Engine FastAPI) ────────────────────────────

/** Trigger a batch evaluation run via engine */
export async function triggerBatchEvaluation(req: BatchEvalRequest): Promise<BatchEvalResponse> {
  return request<BatchEvalResponse>(`${ENGINE}/engine/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      book_ids: req.bookIds,
      question_count: req.questionCount ?? 10,
      model: req.model,
    }),
  })
}

// ── Internal: map Payload doc → typed interface ─────────────────────────────

function mapEvaluation(raw: any): EvaluationResult {
  return {
    id: raw.id,
    query: raw.query ?? '',
    answer: raw.answer ?? null,
    referenceAnswer: raw.referenceAnswer ?? null,
    faithfulness: raw.faithfulness ?? null,
    relevancy: raw.relevancy ?? null,
    correctness: raw.correctness ?? null,
    feedback: raw.feedback ?? null,
    model: raw.model ?? null,
    sourceCount: raw.sourceCount ?? null,
    batchId: raw.batchId ?? null,
    createdAt: raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? '',
  }
}
