/**
 * chat/history/api — Payload CMS CRUD for ChatSessions + ChatMessages.
 *
 * Provides typed fetch wrappers for the Payload REST API.
 * Used by useChatHistory hook for server-side persistence.
 */

import type { SourceInfo, QueryTrace } from '@/features/shared/types'

// ============================================================
// Types — Payload REST response shapes
// ============================================================

/** Raw ChatSession document from Payload REST API. */
export interface PayloadChatSession {
  id: number
  user: number | { id: number }
  title: string
  bookIds: number[]
  bookTitles: string[]
  createdAt: string
  updatedAt: string
}

/** Raw ChatMessage document from Payload REST API. */
export interface PayloadChatMessage {
  id: number
  session: number | { id: number }
  role: 'user' | 'assistant'
  content: string
  sources?: SourceInfo[] | null
  trace?: QueryTrace | null
  createdAt: string
}

// ============================================================
// Helpers
// ============================================================

/** Typed fetch wrapper with error handling (same-origin, credentials included). */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

// ============================================================
// ChatSessions CRUD
// ============================================================

/** Fetch all chat sessions for the current user (newest first). */
export async function fetchSessions(limit = 50): Promise<PayloadChatSession[]> {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('sort', '-createdAt')
  params.set('depth', '0') // Don't populate relationships

  const data = await request<{ docs: PayloadChatSession[] }>(
    `/api/chat-sessions?${params}`,
  )
  return data.docs
}

/** Create a new chat session.  Returns the created document. */
export async function createServerSession(opts: {
  userId: number
  title: string
  bookIds: number[]
  bookTitles: string[]
}): Promise<PayloadChatSession> {
  // Payload v3 REST POST wraps the doc: { doc: {...}, message: "..." }
  const res = await request<{ doc: PayloadChatSession }>('/api/chat-sessions', {
    method: 'POST',
    body: JSON.stringify({
      user: opts.userId,
      title: opts.title,
      bookIds: opts.bookIds,
      bookTitles: opts.bookTitles,
    }),
  })
  return res.doc
}

/** Delete a chat session by Payload ID. */
export async function deleteServerSession(sessionId: number): Promise<void> {
  await request<unknown>(`/api/chat-sessions/${sessionId}`, {
    method: 'DELETE',
  })
}

// ============================================================
// ChatMessages CRUD
// ============================================================

/** Fetch all messages for a session (oldest first). */
export async function fetchMessages(
  sessionId: number,
  limit = 500,
): Promise<PayloadChatMessage[]> {
  const params = new URLSearchParams()
  params.set('where[session][equals]', String(sessionId))
  params.set('sort', 'createdAt')
  params.set('limit', String(limit))
  params.set('depth', '0')

  const data = await request<{ docs: PayloadChatMessage[] }>(
    `/api/chat-messages?${params}`,
  )
  return data.docs
}

/** Append messages to a session (batch create). */
export async function appendServerMessages(
  sessionId: number,
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    sources?: SourceInfo[] | null
    trace?: QueryTrace | null
  }>,
): Promise<void> {
  // Payload REST API doesn't support batch create — send sequentially
  // but fire-and-forget from the caller's perspective
  await Promise.all(
    messages.map((msg) =>
      request<unknown>('/api/chat-messages', {
        method: 'POST',
        body: JSON.stringify({
          session: sessionId,
          role: msg.role,
          content: msg.content,
          sources: msg.sources ?? null,
          trace: msg.trace ?? null,
        }),
      }),
    ),
  )
}

// ============================================================
// User history — for evaluation dedup
// ============================================================

/**
 * Fetch all user-role messages across all sessions for the current user.
 * Returns an array of question strings, newest first.
 * Used by the evaluation module for automatic dedup detection.
 */
export async function fetchUserQuestionHistory(
  limit = 200,
): Promise<string[]> {
  const params = new URLSearchParams()
  params.set('where[role][equals]', 'user')
  params.set('sort', '-createdAt')
  params.set('limit', String(limit))
  params.set('depth', '0')

  const data = await request<{ docs: PayloadChatMessage[] }>(
    `/api/chat-messages?${params}`,
  )
  return data.docs.map((msg) => msg.content)
}
