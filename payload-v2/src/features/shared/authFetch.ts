/**
 * authFetch — Fetch wrapper that redirects to login on 401/403.
 *
 * Usage: import { authFetch } from '@/features/shared/authFetch'
 *        const res = await authFetch('/api/books', { method: 'POST', ... })
 *
 * On 401 (Unauthorized) or 403 (Forbidden), clears user state and
 * redirects to the home page for re-login. This handles:
 *   - Session timeout (cookie expired)
 *   - Insufficient permissions (role-based access)
 */

// ============================================================
// Auth-guarded fetch
// ============================================================

/**
 * Wrapper around native fetch that auto-redirects on auth failure.
 * Drop-in replacement for `fetch()` in client-side code.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, {
    credentials: 'include',
    ...init,
  })

  if (res.status === 401 || res.status === 403) {
    // Session expired or insufficient permissions → redirect to home
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    throw new Error(
      res.status === 401
        ? 'Session expired. Redirecting to login...'
        : 'Insufficient permissions. Redirecting to login...',
    )
  }

  return res
}
