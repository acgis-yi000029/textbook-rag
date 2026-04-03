/**
 * engine/question_gen/api.ts
 * Aligned with: llama_index.question_gen → engine-v2/question_gen/generator.py
 *               → collections/Questions
 *
 * CRUD operations via Payload CMS and generation triggers via Engine FastAPI.
 */

import type { Question, GeneratedQuestion, QuestionsApiResponse } from './types'

const ENGINE = process.env.NEXT_PUBLIC_ENGINE_URL || 'http://localhost:8000'

// NOTE: fetchIndexedBooks moved to @/features/shared/books

// ── CRUD (Payload CMS REST API) ─────────────────────────────────────────────

/** Fetch all questions from Payload CMS, sorted by likes desc */
export async function fetchQuestions(limit = 500): Promise<Question[]> {
  const res = await fetch(`/api/questions?limit=${limit}&sort=-likes`)
  if (!res.ok) throw new Error(`Failed to fetch questions: ${res.status}`)

  const data: QuestionsApiResponse = await res.json()
  return data.docs.map(mapDoc)
}

/** Fetch high-quality questions for a set of books */
export async function fetchHighQualityQuestions(
  bookIds: string[],
  limit = 6,
  minScore = 3,
): Promise<Question[]> {
  if (bookIds.length === 0) return []

  const whereParams = bookIds
    .map((id, i) => `where[or][${i}][bookId][equals]=${encodeURIComponent(id)}`)
    .join('&')
  const scoreFilter = `where[and][1][scoreOverall][greater_than_equal]=${minScore}`
  const url = `/api/questions?${whereParams}&${scoreFilter}&sort=-scoreOverall,-likes&limit=${limit}`

  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data: QuestionsApiResponse = await res.json()
    return data.docs.map(mapDoc)
  } catch {
    return []
  }
}

/** Like a question (increment likes by 1) */
export async function likeQuestion(id: number, currentLikes: number): Promise<void> {
  const res = await fetch(`/api/questions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ likes: currentLikes + 1 }),
  })
  if (!res.ok) throw new Error(`Like failed: ${res.status}`)
}

/** Delete a question by ID */
export async function deleteQuestion(id: number): Promise<void> {
  const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}

/** Delete all questions (bulk delete) */
export async function deleteAllQuestions(ids: number[]): Promise<void> {
  const batchSize = 10
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)
    await Promise.all(batch.map((id) =>
      fetch(`/api/questions/${id}`, { method: 'DELETE' }).catch(() => {})
    ))
  }
}

// ── Generation (Engine FastAPI) ─────────────────────────────────────────────

/** Trigger question generation via engine LLM */
export async function generateQuestions(
  bookIds: string[],
  count = 6,
  model?: string,
): Promise<GeneratedQuestion[]> {
  try {
    const body: Record<string, unknown> = { book_ids: bookIds, count }
    if (model) body.model = model
    const res = await fetch(`${ENGINE}/engine/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.questions ?? []
  } catch {
    return []
  }
}

/** Save a generated question to Payload CMS */
export async function saveQuestionToPayload(doc: {
  question: string
  bookId: string
  bookTitle: string
  topicHint: string
  source: 'ai' | 'manual'
  likes: number
  category?: string
  subcategory?: string
}): Promise<void> {
  await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  })
}

// ── Internal helpers ────────────────────────────────────────────────────────

function mapDoc(d: Record<string, any>): Question {
  return {
    id: d.id,
    question: d.question,
    bookId: d.bookId ?? '',
    bookTitle: d.bookTitle ?? null,
    topicHint: d.topicHint ?? null,
    source: d.source ?? 'ai',
    likes: d.likes ?? 0,
    category: d.category ?? null,
    subcategory: d.subcategory ?? null,
    model: d.model ?? null,
    scoreRelevance: d.scoreRelevance ?? null,
    scoreClarity: d.scoreClarity ?? null,
    scoreDifficulty: d.scoreDifficulty ?? null,
    scoreOverall: d.scoreOverall ?? null,
    createdAt: d.createdAt ?? '',
  }
}
