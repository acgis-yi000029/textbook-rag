/**
 * response_synthesizers API — Prompt mode CRUD via Payload CMS.
 *
 * All API calls for the response_synthesizers module.
 * Reads / writes to Payload CMS Prompts collection (type='mode').
 */

import type { PromptMode, PromptModeUpdatePayload } from './types'

// ============================================================
// Payload CMS (same-origin)
// ============================================================

/** Fetch all prompt modes (type='mode') from Payload CMS. */
export async function fetchPromptModes(): Promise<PromptMode[]> {
  const res = await fetch(
    '/api/prompts?limit=50&sort=sortOrder&where[type][equals]=mode',
    { headers: { 'Content-Type': 'application/json' } },
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return json.docs ?? []
}

/** Fetch a single prompt mode by Payload ID. */
export async function fetchPromptMode(id: number): Promise<PromptMode> {
  const res = await fetch(`/api/prompts/${id}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** Update a prompt mode via Payload PATCH. */
export async function updatePromptMode(
  id: number,
  data: PromptModeUpdatePayload,
): Promise<PromptMode> {
  const res = await fetch(`/api/prompts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HTTP ${res.status}: ${body}`)
  }
  return (await res.json()).doc
}
