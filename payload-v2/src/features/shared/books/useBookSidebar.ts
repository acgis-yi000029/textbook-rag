/**
 * useBookSidebar — builds SidebarItem[] from a book list.
 *
 * Two modes:
 *   'by-book'     — each sidebar item = one book, count from external countMap
 *   'by-category'  — each sidebar item = one category/subcategory, count = books in that group
 *
 * Usage:
 *   const { sidebarItems, filterItems } = useBookSidebar(books, { mode: 'by-book', countMap })
 *   const { sidebarItems, filterItems } = useBookSidebar(books, { mode: 'by-category' })
 */

'use client'

import { useMemo, type ReactNode } from 'react'
import type { SidebarItem } from '@/features/shared/components/SidebarLayout'
import type { BookBase } from './types'
import { CATEGORY_CONFIGS } from './types'

// ============================================================
// Types
// ============================================================

interface ByBookOptions {
  mode: 'by-book'
  /** Map of book_id → count for the sidebar badge. */
  countMap?: Map<string, number>
  /** Whether to use Chinese labels. Default: false. */
  isZh?: boolean
  /** "All" label. Default: 'All'. */
  allLabel?: string
  /** Icon for each book item. */
  bookIcon?: ReactNode
  /** Icon for "All" item. */
  allIcon?: ReactNode
  /** Map of category key → icon ReactNode (for category headers). */
  categoryIcons?: Record<string, ReactNode>
}

interface ByCategoryOptions {
  mode: 'by-category'
  /** Whether to use Chinese labels. Default: false. */
  isZh?: boolean
  /** "All" label. Default: 'All Books'. */
  allLabel?: string
  /** Icon for "All" item. */
  allIcon?: ReactNode
  /** Map of category key → icon ReactNode. */
  categoryIcons?: Record<string, ReactNode>
}

export type UseBookSidebarOptions = ByBookOptions | ByCategoryOptions

// ============================================================
// Hook
// ============================================================

export function useBookSidebar(
  books: BookBase[],
  options: UseBookSidebarOptions,
) {

  // ==========================================================
  // Build sidebar items
  // ==========================================================
  const sidebarItems = useMemo<SidebarItem[]>(() => {
    if (options.mode === 'by-book') {
      return buildByBook(books, options)
    }
    return buildByCategory(books, options)
  }, [books, options])

  // ==========================================================
  // Filter helper
  // ==========================================================

  /** Filter a list of items by the current sidebar filter key. */
  function filterItems<T extends { bookId?: string; category?: string; subcategory?: string }>(
    items: T[],
    filter: string,
  ): T[] {
    if (filter === 'all') return items

    // by-book mode: filter = "book::<book_id>"
    if (filter.startsWith('book::')) {
      const bookId = filter.slice(6)
      return items.filter((item) => item.bookId === bookId)
    }

    // by-category mode: filter = "category::subcategory" or just "category"
    if (filter.includes('::')) {
      const sub = filter.split('::')[1]
      return items.filter((item) => item.subcategory === sub)
    }

    // plain category key
    return items.filter((item) => (item.category || 'textbook') === filter)
  }

  /** Filter books by the current sidebar filter key. */
  function filterBooks(filter: string): BookBase[] {
    if (filter === 'all') return books

    if (filter.startsWith('book::')) {
      const bookId = filter.slice(6)
      return books.filter((b) => b.book_id === bookId)
    }

    if (filter.includes('::')) {
      const [cat, sub] = filter.split('::')
      return books.filter((b) => (b.category || 'textbook') === cat && b.subcategory === sub)
    }

    return books.filter((b) => (b.category || 'textbook') === filter)
  }

  // ==========================================================
  // Return
  // ==========================================================
  return { sidebarItems, filterItems, filterBooks }
}

// ============================================================
// Internal builders
// ============================================================

function buildByBook(books: BookBase[], opts: ByBookOptions): SidebarItem[] {
  const countMap = opts.countMap ?? new Map()
  const isZh = opts.isZh ?? false

  const items: SidebarItem[] = [
    {
      key: 'all',
      label: opts.allLabel ?? 'All',
      count: books.length,
      icon: opts.allIcon,
    },
  ]

  // Group books by category → subcategory
  const grouped: Record<string, Record<string, BookBase[]>> = {}
  for (const book of books) {
    const cat = book.category || 'textbook'
    const sub = book.subcategory || ''
    if (!grouped[cat]) grouped[cat] = {}
    if (!grouped[cat][sub]) grouped[cat][sub] = []
    grouped[cat][sub].push(book)
  }

  // Build category → subcategory → book hierarchy
  for (const [catKey, cfg] of Object.entries(CATEGORY_CONFIGS)) {
    const catSubs = grouped[catKey]
    if (!catSubs) continue

    const allCatBooks = Object.values(catSubs).flat()
    if (allCatBooks.length === 0) continue

    // Category shows book count (always visible)
    items.push({
      key: catKey,
      label: isZh ? cfg.labelZh : cfg.label,
      count: allCatBooks.length,
      icon: opts.categoryIcons?.[catKey],
      collapsible: true,
    })

    // Sort subcategory keys (empty string = no subcategory, goes first)
    const subKeys = Object.keys(catSubs).sort((a, b) => {
      if (a === '') return -1
      if (b === '') return 1
      return a.localeCompare(b)
    })

    for (const subKey of subKeys) {
      const subBooks = catSubs[subKey]

      if (subKey) {
        // Subcategory shows book count (always visible)
        items.push({
          key: `${catKey}::${subKey}`,
          label: subKey,
          count: subBooks.length,
          indentLevel: 1,
          collapsible: true,
        })
      }

      // Sort books within group: books with questions first, then alphabetical
      const sorted = [...subBooks].sort((a, b) => {
        const ca = countMap.get(a.book_id) || 0
        const cb = countMap.get(b.book_id) || 0
        if (cb !== ca) return cb - ca
        return a.title.localeCompare(b.title)
      })

      for (const book of sorted) {
        items.push({
          key: `book::${book.book_id}`,
          label: book.title,
          count: countMap.get(book.book_id) || 0,
          icon: opts.bookIcon,
          indentLevel: subKey ? 2 : 1,
        })
      }
    }
  }

  return items
}

function buildByCategory(books: BookBase[], opts: ByCategoryOptions): SidebarItem[] {
  const isZh = opts.isZh ?? false

  // Count per category and subcategory
  const counts: Record<string, number> = { all: books.length }
  const subMap: Record<string, Set<string>> = {}

  for (const b of books) {
    const cat = b.category || 'textbook'
    counts[cat] = (counts[cat] || 0) + 1
    if (b.subcategory) {
      const subKey = `${cat}::${b.subcategory}`
      counts[subKey] = (counts[subKey] || 0) + 1
      if (!subMap[cat]) subMap[cat] = new Set()
      subMap[cat].add(b.subcategory)
    }
  }

  const items: SidebarItem[] = [
    {
      key: 'all',
      label: opts.allLabel ?? (isZh ? '全部' : 'All Books'),
      count: counts.all || 0,
      icon: opts.allIcon,
    },
  ]

  for (const [catKey, cfg] of Object.entries(CATEGORY_CONFIGS)) {
    const count = counts[catKey] || 0
    if (count === 0) continue

    items.push({
      key: catKey,
      label: isZh ? cfg.labelZh : cfg.label,
      count,
      icon: opts.categoryIcons?.[catKey],
      collapsible: !!subMap[catKey],
    })

    // Subcategories
    const subs = subMap[catKey]
    if (subs) {
      for (const sub of [...subs].sort()) {
        items.push({
          key: `${catKey}::${sub}`,
          label: sub,
          count: counts[`${catKey}::${sub}`] || 0,
          indent: true,
        })
      }
    }
  }

  return items
}
