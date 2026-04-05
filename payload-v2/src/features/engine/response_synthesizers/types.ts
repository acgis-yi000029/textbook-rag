/**
 * response_synthesizers types — Prompt mode and query template definitions.
 *
 * Aligned with: collections/Prompts (type='mode' | 'template')
 */

// ============================================================
// Domain types
// ============================================================

/** Prompt mode — system prompt controlling LLM answer style. */
export interface PromptMode {
  id: number
  name: string
  slug: string
  description: string
  systemPrompt: string
  icon?: string
  isDefault: boolean
  isEnabled: boolean
  sortOrder: number
  type: 'mode' | 'template'
  updatedAt: string
  createdAt: string
}

/** Query template — question clarification pattern (type='template'). */
export interface QueryTemplate extends PromptMode {
  category?: 'disambiguation' | 'scope' | 'format' | 'followup'
  triggerPatterns?: string[]
  clarifyPrompt?: string
  clarifyPromptZh?: string
  suggestedQuestions?: string[]
  suggestedQuestionsZh?: string[]
  answerFormat?: string
  answerFormatZh?: string
}

// ============================================================
// API types
// ============================================================

/** Partial payload for updating a prompt mode via Payload PATCH. */
export interface PromptModeUpdatePayload {
  name?: string
  description?: string
  systemPrompt?: string
  icon?: string
  isDefault?: boolean
  isEnabled?: boolean
  sortOrder?: number
}

/** Generation trace — model + prompts used during synthesis. */
export interface GenerationTrace {
  model: string
  system_prompt: string
  user_prompt: string
}
