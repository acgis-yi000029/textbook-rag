import type { Question, QuestionsApiResponse } from './types'

/**
 * Fetch all questions from Payload CMS REST API.
 * 从 Payload CMS 获取全部问题，按点赞数降序。
 */
export async function fetchQuestions(limit = 500): Promise<Question[]> {
  const res = await fetch(`/api/questions?limit=${limit}&sort=-likes`)
  if (!res.ok) throw new Error(`Failed to fetch questions: ${res.status}`)

  const data: QuestionsApiResponse = await res.json()
  return data.docs.map(mapDoc)
}

/**
 * Like a question (increment likes by 1).
 * 给问题点赞（likes + 1）。
 */
export async function likeQuestion(id: number, currentLikes: number): Promise<void> {
  const res = await fetch(`/api/questions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ likes: currentLikes + 1 }),
  })
  if (!res.ok) throw new Error(`Like failed: ${res.status}`)
}

/**
 * Delete a question by ID.
 * 删除指定问题。
 */
export async function deleteQuestion(id: number): Promise<void> {
  const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}

/**
 * Delete all questions (bulk delete).
 * 批量删除所有问题。
 */
export async function deleteAllQuestions(ids: number[]): Promise<void> {
  // Payload CMS bulk delete: DELETE /api/questions with where clause
  // We delete in parallel batches for speed
  const batchSize = 10
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)
    await Promise.all(batch.map((id) =>
      fetch(`/api/questions/${id}`, { method: 'DELETE' }).catch(() => {})
    ))
  }
}

/** Map Payload doc → typed Question / 映射 Payload 文档到类型化 Question */
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
