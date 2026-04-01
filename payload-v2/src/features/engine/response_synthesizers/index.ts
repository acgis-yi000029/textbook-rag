/**
 * engine/response_synthesizers — Prompt and synthesis configuration
 * Aligned with: llama_index.response_synthesizers → engine-v2/response_synthesizers/
 *
 * Manages prompt modes (system prompts) and query templates
 * via Payload CMS Prompts collection.
 */

export * from './types'
export { usePromptModes } from './usePromptModes'
export type { UsePromptModesReturn } from './usePromptModes'
