/**
 * shared/books API — unified book fetching from Payload CMS.
 *
 * Single entry point for /api/books queries.
 * Replaces: query_engine/api.ts::fetchBooks, question_gen/api.ts::fetchIndexedBooks
 */

import type { BookBase, BookCategory, BookStatus } from './types'

// ============================================================
// Fetch options
// ============================================================

export interface FetchBooksOptions {
  /** Filter by overall book status. */
  status?: BookStatus
  /** Filter by category. */
  category?: BookCategory
  /** Filter by title (partial match). */
  search?: string
  /** Max results. Default 200. */
  limit?: number
  /** Sort field. Default '-updatedAt'. */
  sort?: string
}

// ============================================================
// API
// ============================================================

/** Fetch books from Payload CMS with optional filters. */
export async function fetchBooks(opts?: FetchBooksOptions): Promise<BookBase[]> {
  const params = new URLSearchParams()
  params.set('limit', String(opts?.limit ?? 200))
  params.set('sort', opts?.sort ?? '-updatedAt')

  if (opts?.status) params.set('where[status][equals]', opts.status)
  if (opts?.category) params.set('where[category][equals]', opts.category)
  if (opts?.search) params.set('where[title][contains]', opts.search)

  const res = await fetch(`/api/books?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch books: ${res.status}`)

  const data: { docs: Array<Record<string, any>> } = await res.json()
  return data.docs.map(mapPayloadBook)
}

/** Fetch indexed books only (convenience wrapper). */
export async function fetchIndexedBooks(): Promise<BookBase[]> {
  return fetchBooks({ status: 'indexed' })
}

// ============================================================
// Internal mapper
// ============================================================

function mapPayloadBook(b: Record<string, any>): BookBase {
  return {
    id: b.id,
    book_id: b.engineBookId ?? String(b.id),
    title: b.title ?? '(untitled)',
    authors: b.authors ?? '',
    chunk_count: b.chunkCount ?? 0,
    category: b.category ?? 'textbook',
    subcategory: b.subcategory ?? '',
  }
}
