/**
 * engine/question_gen — LLM-based question generation
 * Aligned with: llama_index.question_gen → engine-v2/question_gen/
 *
 * Manages AI-generated study questions via Payload CMS Questions collection.
 */

// ── Data layer ──────────────────────────────────────────────────────────────
export type { Question, GeneratedQuestion, QuestionsApiResponse } from './types'
export * from './api'
export { useQuestionGeneration } from './useQuestionGeneration'
export type { UseQuestionGenerationReturn } from './useQuestionGeneration'
export { useSuggestedQuestions } from './useSuggestedQuestions'
// NOTE: useBooks moved to @/features/shared/books

// ── UI components ───────────────────────────────────────────────────────────
export { default as GenerationPanel } from './components/GenerationPanel'
export { default as GenerationProgress } from './components/GenerationProgress'
export { default as QuestionCards } from './components/QuestionCards'
export { default as QuestionsPage } from './components/QuestionsPage'
export { default as SuggestedQuestions } from './components/SuggestedQuestions'
