/**
 * ParsePreviewTab — MinerU parse statistics viewer.
 *
 * Data source: Engine GET /engine/books/{book_id}/parse-stats
 *
 * Layout: 2-column
 *   Left:  Book selector grouped by category folders (uses shared useBookSidebar)
 *   Right: Stats cards + content sample table
 *
 * Ref: AQ-03 — Parse Preview Tab
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileSearch,
  BookOpen,
  Layers,
  FileText,
  Image,
  Table2,
  Heading,
  Hash,
  ChevronRight,
  Folder,
  FolderOpen,
  Trash2,
} from 'lucide-react'
import { useI18n } from '@/features/shared/i18n'
import { useBooks, useBookSidebar } from '@/features/shared/books'
import { cn } from '@/features/shared/utils'
import { fetchParseStats, deleteBookWithCleanup } from '../api'
import type { ParseStats } from '../types'

// ============================================================
// Type icon mapping
// ============================================================
const TYPE_ICONS: Record<string, React.ElementType> = {
  text: FileText,
  image: Image,
  table: Table2,
  title: Heading,
}

// ============================================================
// Component
// ============================================================
export default function ParsePreviewTab() {
  const { locale } = useI18n()
  const isFr = locale === 'fr'
  const { books, loading: booksLoading, refetch } = useBooks()

  // Build sidebar items with category folders
  const { sidebarItems, filterBooks } = useBookSidebar(books, {
    mode: 'by-book',
    isFr,
    bookIcon: <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
    categoryIcons: {},
  })

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [stats, setStats] = useState<ParseStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null)

  // ==========================================================
  // Fetch parse stats when book is selected
  // ==========================================================
  const loadStats = useCallback(async (bookId: string) => {
    setLoadingStats(true)
    setError(null)
    try {
      const data = await fetchParseStats(bookId)
      setStats(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load'
      setError(msg)
      setStats(null)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    if (selectedBookId) {
      loadStats(selectedBookId)
    }
  }, [selectedBookId, loadStats])

  // ==========================================================
  // Collapse toggle
  // ==========================================================
  const toggleExpand = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // ==========================================================
  // Delete book
  // ==========================================================
  const handleDeleteBook = useCallback(async (bookId: string) => {
    const book = books.find((b) => b.book_id === bookId)
    const title = book?.title ?? bookId
    const confirmed = window.confirm(
      isFr
        ? `确定删除「${title}」？将同时清理向量库和解析文件。`
        : `Delete "${title}"? This will also clean up vectors and parsed files.`,
    )
    if (!confirmed) return

    setDeletingBookId(bookId)
    try {
      await deleteBookWithCleanup(book?.id ?? 0, bookId)
      if (selectedBookId === bookId) {
        setSelectedBookId(null)
        setStats(null)
      }
      refetch()
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeletingBookId(null)
    }
  }, [books, isFr, selectedBookId, refetch])

  // ==========================================================
  // Determine visible sidebar items (respecting collapsed state)
  // ==========================================================
  const visibleItems = sidebarItems.filter((item, idx) => {
    // "All" item always visible
    if (item.key === 'all') return true

    // Category items always visible
    const indentLevel = (item as { indentLevel?: number }).indentLevel ?? 0
    if (indentLevel === 0) return true

    // Find parent — walk backwards to find item with lower indent
    for (let i = idx - 1; i >= 0; i--) {
      const parent = sidebarItems[i]
      const parentIndent = (parent as { indentLevel?: number }).indentLevel ?? 0
      if (parentIndent < indentLevel) {
        // If parent is NOT expanded, hide this item
        if (!expanded.has(parent.key)) return false
        // Check grandparent too
        if (parentIndent > 0) {
          for (let j = i - 1; j >= 0; j--) {
            const gp = sidebarItems[j]
            const gpIndent = (gp as { indentLevel?: number }).indentLevel ?? 0
            if (gpIndent < parentIndent) {
              if (!expanded.has(gp.key)) return false
              break
            }
          }
        }
        break
      }
    }
    return true
  })

  return (
    <div className="flex gap-4 h-full min-h-[400px]">
      {/* ── Left: Book selector with category folders ── */}
      <div className="w-56 shrink-0 rounded-lg border border-border bg-card overflow-y-auto">
        <div className="px-3 py-2.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {isFr ? '选择书本' : 'Select Book'}
          </span>
        </div>

        {booksLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : books.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <Layers className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground">
              {isFr ? '暂无书本' : 'No books available'}
            </p>
          </div>
        ) : (
          <div className="p-1">
            {visibleItems.map((item) => {
              const indentLevel = (item as { indentLevel?: number }).indentLevel ?? 0
              const isBookItem = item.key.startsWith('book::')
              const isCollapsible = (item as { collapsible?: boolean }).collapsible
              const isExpanded = expanded.has(item.key)
              const bookId = isBookItem ? item.key.slice(6) : null

              // Skip "all" — we show category folders
              if (item.key === 'all') return null

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (isBookItem && bookId) {
                      setSelectedBookId(bookId)
                    } else if (isCollapsible) {
                      toggleExpand(item.key)
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 py-2 rounded-md text-left transition-colors text-xs group/item',
                    isBookItem && selectedBookId === bookId
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                  style={{ paddingLeft: `${10 + indentLevel * 14}px`, paddingRight: '8px' }}
                >
                  {/* Collapse chevron — rotates 90° when expanded */}
                  {isCollapsible && (
                    <ChevronRight className={cn(
                      'h-3 w-3 shrink-0 transition-transform duration-200',
                      isExpanded && 'rotate-90',
                    )} />
                  )}

                  {/* Icon — Folder/FolderOpen for categories, BookOpen for books */}
                  {isBookItem ? (
                    <BookOpen className="h-4 w-4 shrink-0" />
                  ) : (
                    isExpanded
                      ? <FolderOpen className="h-4 w-4 shrink-0" />
                      : <Folder className="h-4 w-4 shrink-0" />
                  )}

                  {/* Label */}
                  <span className="truncate flex-1">{item.label}</span>

                  {/* Delete button for book items */}
                  {isBookItem && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteBook(bookId!) }}
                      disabled={deletingBookId === bookId}
                      className="opacity-0 group-hover/item:opacity-100 flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                      title={isFr ? '删除' : 'Delete'}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}

                  {/* Count badge (pill style like SidebarLayout) */}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                      {item.count}
                    </span>
                  )}

                  {/* Selected indicator */}
                  {isBookItem && selectedBookId === bookId && (
                    <ChevronRight className="h-3 w-3 shrink-0 text-primary" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Right: Stats + Samples ── */}
      <div className="flex-1 min-w-0 space-y-4 overflow-y-auto">
        {!selectedBookId && (
          <EmptyState
            title={isFr ? '选择一本书查看解析数据' : 'Select a book to view parse data'}
            subtitle={isFr
              ? '左侧选择已解析的书本，查看 MinerU 解析产物统计。'
              : 'Choose a parsed book from the left panel to view MinerU parse statistics.'}
            icon={FileSearch}
          />
        )}

        {selectedBookId && loadingStats && (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {selectedBookId && error && (
          <EmptyState
            title={isFr ? '未找到解析数据' : 'No parse data found'}
            subtitle={error.includes('404')
              ? (isFr ? '该书尚未被 MinerU 解析，请先在导入 Tab 上传并触发解析。' : 'This book has not been parsed by MinerU yet. Upload and trigger parsing in the Import tab.')
              : error}
            icon={FileSearch}
          />
        )}

        {selectedBookId && !loadingStats && !error && stats && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label={isFr ? '内容项' : 'Content Items'}
                value={stats.totalItems}
                icon={Hash}
              />
              <StatCard
                label={isFr ? '页数' : 'Pages'}
                value={stats.totalPages}
                icon={Layers}
              />
              {Object.entries(stats.typeCounts).map(([type, count]) => (
                <StatCard
                  key={type}
                  label={type}
                  value={count}
                  icon={TYPE_ICONS[type] ?? FileText}
                />
              ))}
            </div>

            {/* Content samples table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? `内容采样 (前 ${stats.samples.length} 条)` : `Content Samples (first ${stats.samples.length})`}
                </span>
              </div>

              {stats.samples.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                  {isFr ? '无文本内容' : 'No text content found'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {/* Table header */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    <span className="w-8 shrink-0 text-center">#</span>
                    <span className="w-16 shrink-0">Type</span>
                    <span className="w-12 shrink-0 text-right">Page</span>
                    <span className="flex-1">Text</span>
                  </div>

                  {/* Table rows */}
                  {stats.samples.map((sample, idx) => {
                    const Icon = TYPE_ICONS[sample.contentType] ?? FileText
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3 px-4 py-2.5 hover:bg-secondary/30 transition-colors"
                      >
                        <span className="w-8 shrink-0 text-center text-[10px] text-muted-foreground tabular-nums pt-0.5">
                          {idx + 1}
                        </span>
                        <span className="w-16 shrink-0">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                            sample.contentType === 'title' && 'bg-purple-500/10 text-purple-400',
                            sample.contentType === 'text' && 'bg-blue-500/10 text-blue-400',
                            sample.contentType === 'table' && 'bg-amber-500/10 text-amber-400',
                            sample.contentType === 'image' && 'bg-emerald-500/10 text-emerald-400',
                            !['title', 'text', 'table', 'image'].includes(sample.contentType) && 'bg-muted text-muted-foreground',
                          )}>
                            <Icon className="h-2.5 w-2.5" />
                            {sample.contentType}
                          </span>
                        </span>
                        <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums pt-0.5">
                          {sample.pageIdx + 1}
                        </span>
                        <p className="flex-1 text-xs text-foreground leading-relaxed line-clamp-2">
                          {sample.text}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-lg font-bold text-foreground tabular-nums">{value.toLocaleString()}</p>
        <p className="text-[10px] text-muted-foreground capitalize">{label}</p>
      </div>
    </div>
  )
}

function EmptyState({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string
  subtitle: string
  icon: React.ElementType
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground text-center max-w-xs">{subtitle}</p>
    </div>
  )
}
