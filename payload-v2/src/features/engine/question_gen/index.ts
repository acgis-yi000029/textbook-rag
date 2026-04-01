/**
 * engine/question_gen — LLM-based question generation
 * Aligned with: llama_index.question_gen → engine-v2/question_gen/
 *
 * Manages AI-generated study questions via Payload CMS Questions collection.
 */

// ── Data layer ──────────────────────────────────────────────────────────────
export * from './types'
export * from './api'
export { useQuestionGeneration } from './useQuestionGeneration'
export type { UseQuestionGenerationReturn } from './useQuestionGeneration'

// ── UI components ───────────────────────────────────────────────────────────
export { default as GenerationProgress } from './components/GenerationProgress'
export { default as QuestionCards } from './components/QuestionCards'
export { default as QuestionsPage } from './components/QuestionsPage'
