/**
 * /engine/evaluation — Unified evaluation hub page.
 *
 * Thin shell: only imports and renders the feature page component.
 */

'use client'

import EvaluationPage from '@/features/engine/evaluation/components/EvaluationPage'

export default function Page() {
  return <EvaluationPage />
}
