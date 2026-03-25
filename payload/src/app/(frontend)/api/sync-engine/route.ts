/**
 * POST /api/sync-engine
 *
 * Syncs books from Engine SQLite → Payload CMS using Payload Local API.
 * No authentication needed since Local API bypasses access control.
 */

import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const ENGINE = process.env.NEXT_PUBLIC_ENGINE_URL || 'http://localhost:8000'

export async function POST() {
  try {
    // 1. Fetch book list from Engine API
    const engineRes = await fetch(`${ENGINE}/engine/books`)
    if (!engineRes.ok) {
      return NextResponse.json(
        { success: false, error: `Engine /engine/books returned ${engineRes.status}` },
        { status: 502 },
      )
    }
    const engineBooks: Array<{
      id: number
      book_id: string
      title: string
      authors: string | null
      page_count: number | null
      chapter_count: number | null
      chunk_count: number | null
    }> = await engineRes.json()

    // 2. Use Payload Local API (bypasses access control)
    const payload = await getPayload({ config })

    const results = { created: 0, updated: 0, errors: [] as string[], total: engineBooks.length }

    for (const eb of engineBooks) {
      const bookData = {
        engineBookId: eb.book_id,
        title: eb.title,
        authors: eb.authors || '',
        category: inferCategory(eb.book_id),
        status: 'indexed' as const,
        chunkCount: eb.chunk_count || 0,
        pipeline: {
          chunked: 'done' as const,
          stored: 'done' as const,
          vector: 'done' as const,
          fts: 'done' as const,
          toc: 'done' as const,
        },
        metadata: {
          pageCount: eb.page_count || 0,
          chapterCount: eb.chapter_count || 0,
        },
      }

      try {
        // Check if exists
        const existing = await payload.find({
          collection: 'books',
          where: { engineBookId: { equals: eb.book_id } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          await payload.update({
            collection: 'books',
            id: existing.docs[0].id,
            data: bookData,
          })
          results.updated++
        } else {
          await payload.create({
            collection: 'books',
            data: bookData,
          })
          results.created++
        }
      } catch (err) {
        const msg = `${eb.book_id}: ${err instanceof Error ? err.message : String(err)}`
        results.errors.push(msg)
      }
    }

    return NextResponse.json({ success: true, ...results })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/** Infer book category from engine book_id */
function inferCategory(bookId: string): string {
  if (bookId.startsWith('ed_update') || bookId.startsWith('oreb_')) return 'ecdev'
  return 'textbook'
}
