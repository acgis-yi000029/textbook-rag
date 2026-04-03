/**
 * engine/question_gen/types.ts
 * Aligned with: llama_index.question_gen → engine-v2/question_gen/generator.py
 *               → collections/Questions
 *
 * Types for AI-generated and user-submitted study questions.
 */

// ── Question record from Payload CMS ────────────────────────────────────────
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

// ── Raw question from LLM generation (engine response shape) ────────────────
export interface GeneratedQuestion {
  question: string
  book_id: string
  book_title: string
  topic_hint: string
}

// ── Payload REST API response shape ─────────────────────────────────────────
export interface QuestionsApiResponse {
  docs: Array<Record<string, any>>
  totalDocs: number
  totalPages: number
  page: number
}

// NOTE: BookSummary moved to @/features/shared/books as BookBase
