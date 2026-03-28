/**
 * Question — AI-generated or user-submitted study question.
 * 存储自动生成或用户提交的学习问题，用于后续分析和复习。
 */
export interface Question {
  id: number
  question: string
  bookId: string
  bookTitle: string | null
  topicHint: string | null
  source: 'ai' | 'manual'
  likes: number
  category: string | null
  subcategory: string | null
  model: string | null
  scoreRelevance: number | null
  scoreClarity: number | null
  scoreDifficulty: number | null
  scoreOverall: number | null
  createdAt: string
}

/** Payload REST API response shape for questions collection */
export interface QuestionsApiResponse {
  docs: Array<Record<string, any>>
  totalDocs: number
  totalPages: number
  page: number
}
