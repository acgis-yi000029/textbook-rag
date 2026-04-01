/**
 * engine/response_synthesizers/types.ts
 * Aligned with: llama_index.response_synthesizers → engine-v2/response_synthesizers/
 *               → collections/Prompts
 *
 * Prompt modes control the system prompt sent to the LLM (answer style).
 * Query templates control question clarification patterns.
 */

// ── Prompt mode (system prompt for answer style) ────────────────────────────
export interface PromptMode {
  id: number
  name: string
  slug: string
  description: string
  systemPrompt: string
  icon?: string
  isDefault: boolean
  updatedAt: string
}

// ── Generation trace (model + prompts used) ─────────────────────────────────
export interface GenerationTrace {
  model: string
  system_prompt: string
  user_prompt: string
}
