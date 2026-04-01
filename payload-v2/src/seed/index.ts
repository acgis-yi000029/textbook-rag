/**
 * seed/index.ts — Seed registry barrel export.
 *
 * Aggregates per-collection seed data and exposes a unified
 * `seedCollections` array consumed by the POST /api/seed route.
 */

export type { SeedCollection } from './types'

export { llmsData } from './llms'
export { promptsData } from './prompts'

// ── Registry ────────────────────────────────────────────────────────────────

import type { SeedCollection } from './types'
import { llmsData } from './llms'
import { promptsData } from './prompts'

export const seedCollections: SeedCollection[] = [
  { label: 'LLMs', slug: 'llms', uniqueField: 'name', data: llmsData },
  { label: 'Prompts', slug: 'prompts', uniqueField: 'slug', data: promptsData },
]
