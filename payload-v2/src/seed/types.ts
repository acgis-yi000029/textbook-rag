/**
 * seed/types.ts — Shared seed infrastructure types.
 */

export interface SeedCollection {
  label: string
  slug: string
  uniqueField: string
  data: Record<string, unknown>[]
}
