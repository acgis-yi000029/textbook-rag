/**
 * /engine/query_engine — Query engine debug console.
 *
 * Thin shell: only imports and renders the feature page component.
 */

import QueryEnginePage from '@/features/engine/query_engine/components/QueryEnginePage'

// ============================================================
// Page
// ============================================================
export default function Page() {
  return <QueryEnginePage />
}
