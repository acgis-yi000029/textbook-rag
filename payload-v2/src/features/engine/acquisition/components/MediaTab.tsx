/**
 * MediaTab — Browse PDF files with card/table dual-view.
 *
 * Data source: Payload CMS books (pre-filtered by ImportPage via sidebar).
 * PDF links: Engine API /engine/books/{book_id}/pdf (URL only, no fetch).
 *
 * Shows: Title, Author, Status, Pages, File Size, PDF links (origin + layout).
 * Table columns are resizable via drag handles.
 *
 * Ref: AQ-04 — Media Tab
 */

'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import {
  HardDrive,
  FileText,
  Eye,
  Layers,
  ExternalLink,
  LayoutGrid,
  List,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Hash,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  FileDown,
} from 'lucide-react'
import { useI18n } from '@/features/shared/i18n'
import { cn } from '@/features/shared/utils'
import type { BookBase, BookStatus } from '@/features/shared/books'

// ============================================================
// Constants
// ============================================================
const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || 'http://localhost:8001'

// ============================================================
// Props
// ============================================================
interface MediaTabProps {
  books: BookBase[]
  filter: string
}

// ============================================================
// Types
// ============================================================
type ViewMode = 'cards' | 'table'
type SortField = 'title' | 'status' | 'pages' | 'size'
type SortDir = 'asc' | 'desc'

// ============================================================
// Helpers
// ============================================================

function titleToGradient(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h1 = Math.abs(hash) % 360
  const h2 = (h1 + 40) % 360
  return `linear-gradient(135deg, hsl(${h1}, 45%, 25%), hsl(${h2}, 55%, 18%))`
}

function titleInitials(title: string): string {
  return title
    .split(/[\s_\-]+/)
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Status config — using "Ready" instead of "Indexed" for the Files context. */
const STATUS_CONFIG: Record<BookStatus, { icon: React.ElementType; color: string; label: string; labelFr: string }> = {
  indexed:    { icon: CheckCircle2, color: 'text-emerald-400', label: 'Ready',      labelFr: '已就绪' },
  processing: { icon: Loader2,     color: 'text-amber-400',   label: 'Processing', labelFr: '处理中' },
  pending:    { icon: Clock,       color: 'text-muted-foreground', label: 'Pending', labelFr: '待处理' },
  error:      { icon: AlertTriangle, color: 'text-red-400',   label: 'Error',      labelFr: '错误' },
}

function compareBooks(a: BookBase, b: BookBase, field: SortField, dir: SortDir): number {
  let cmp = 0
  switch (field) {
    case 'title':  cmp = a.title.localeCompare(b.title); break
    case 'pages':  cmp = a.pageCount - b.pageCount; break
    case 'size':   cmp = a.fileSize - b.fileSize; break
    case 'status': {
      const order = { indexed: 0, processing: 1, pending: 2, error: 3 }
      cmp = (order[a.status] ?? 9) - (order[b.status] ?? 9)
      break
    }
  }
  return dir === 'asc' ? cmp : -cmp
}

// ============================================================
// Default column widths (px)
// ============================================================
const DEFAULT_COLS = {
  title:  0,    // flex-1 (auto)
  author: 130,
  category: 100,
  subcategory: 100,
  status: 90,
  pages:  60,
  size:   80,
  pdf:    120,
}

// ============================================================
// useColumnResize — lightweight drag-to-resize hook
// ============================================================
function useColumnResize(initial: Record<string, number>) {
  const [widths, setWidths] = useState(initial)
  const dragRef = useRef<{ col: string; startX: number; startW: number } | null>(null)

  const onMouseDown = useCallback((col: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { col, startX: e.clientX, startW: widths[col] }

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const delta = ev.clientX - dragRef.current.startX
      const newW = Math.max(40, dragRef.current.startW - delta)
      setWidths((prev) => ({ ...prev, [dragRef.current!.col]: newW }))
    }

    const onMouseUp = () => {
      dragRef.current = null
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [widths])

  return { widths, onMouseDown }
}

// ============================================================
// Component
// ============================================================
export default function MediaTab({ books, filter }: MediaTabProps) {
  const { locale } = useI18n()
  const isFr = locale === 'fr'

  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [localSearch, setLocalSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const { widths, onMouseDown } = useColumnResize(DEFAULT_COLS)

  // Local search + sort
  const displayBooks = useMemo(() => {
    let filtered = books
    if (localSearch.trim()) {
      const q = localSearch.trim().toLowerCase()
      filtered = filtered.filter((b) =>
        b.title.toLowerCase().includes(q) ||
        b.authors.toLowerCase().includes(q) ||
        b.book_id.toLowerCase().includes(q)
      )
    }
    return [...filtered].sort((a, b) => compareBooks(a, b, sortField, sortDir))
  }, [books, localSearch, sortField, sortDir])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover/th:opacity-50" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />
  }

  /** Resize handle at LEFT edge of each column */
  const ResizeGrip = ({ col }: { col: string }) => (
    <div
      onMouseDown={onMouseDown(col)}
      className="absolute left-0 top-1 bottom-1 w-[3px] cursor-col-resize rounded-full
                 bg-border hover:bg-primary/60 active:bg-primary transition-colors z-10"
    />
  )

  // ==========================================================
  // Empty state
  // ==========================================================
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <HardDrive className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {isFr ? '暂无书籍' : 'No books'}
        </h3>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          {isFr
            ? '在「导入」标签页上传 PDF 即可开始。'
            : 'Upload PDFs via the Import tab to get started.'}
        </p>
      </div>
    )
  }

  // ==========================================================
  // Main view
  // ==========================================================
  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={isFr ? '搜索书名、作者...' : 'Search title, author...'}
            className="w-full h-8 pl-9 pr-3 rounded-md border border-input bg-background text-xs text-foreground
                       placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/30 transition-colors"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>

        <span className="text-[10px] tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {displayBooks.length}
        </span>

        <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={cn(
              'p-1.5 rounded transition-colors',
              viewMode === 'cards' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              'p-1.5 rounded transition-colors',
              viewMode === 'table' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Empty search */}
      {displayBooks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {isFr ? '未找到匹配结果' : 'No matches found'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isFr ? '尝试不同的关键词' : 'Try different keywords'}
          </p>
        </div>
      )}

      {/* ── Card view ── */}
      {displayBooks.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {displayBooks.map((book) => (
            <PdfBookCard key={book.id} book={book} isFr={isFr} />
          ))}
        </div>
      )}

      {/* ── Table view ── */}
      {displayBooks.length > 0 && viewMode === 'table' && (
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center bg-muted/50 text-[11px] font-medium text-muted-foreground tracking-wider border-b border-border select-none">
            {/* Icon spacer */}
            <span className="w-10 shrink-0 px-2" />

            {/* Title — flex-1 auto, no resize grip */}
            <button
              onClick={() => toggleSort('title')}
              className="flex items-center gap-1 flex-1 min-w-[100px] px-2 py-2 group/th hover:text-foreground transition-colors"
            >
              {isFr ? '书名' : 'Title'}
              <SortIcon field="title" />
            </button>

            {/* Author */}
            <span className="relative px-2 py-2 hidden sm:block" style={{ width: widths.author }}>
              {isFr ? '作者' : 'Author'}
              <ResizeGrip col="author" />
            </span>

            {/* Category */}
            <span className="relative px-2 py-2 hidden lg:block" style={{ width: widths.category }}>
              {isFr ? '分类' : 'Category'}
              <ResizeGrip col="category" />
            </span>

            {/* Subcategory */}
            <span className="relative px-2 py-2 hidden lg:block" style={{ width: widths.subcategory }}>
              {isFr ? '子分类' : 'Subcategory'}
              <ResizeGrip col="subcategory" />
            </span>

            {/* Status */}
            <button
              onClick={() => toggleSort('status')}
              className="relative px-2 py-2 hidden sm:flex items-center gap-1 group/th hover:text-foreground transition-colors"
              style={{ width: widths.status }}
            >
              {isFr ? '状态' : 'Status'}
              <SortIcon field="status" />
              <ResizeGrip col="status" />
            </button>

            {/* Pages */}
            <button
              onClick={() => toggleSort('pages')}
              className="relative px-2 py-2 hidden md:flex items-center gap-1 justify-end group/th hover:text-foreground transition-colors"
              style={{ width: widths.pages }}
            >
              {isFr ? '页数' : 'Pages'}
              <SortIcon field="pages" />
              <ResizeGrip col="pages" />
            </button>

            {/* Size */}
            <button
              onClick={() => toggleSort('size')}
              className="relative px-2 py-2 hidden md:flex items-center gap-1 justify-end group/th hover:text-foreground transition-colors"
              style={{ width: widths.size }}
            >
              {isFr ? '大小' : 'Size'}
              <SortIcon field="size" />
              <ResizeGrip col="size" />
            </button>

            {/* PDF actions */}
            <span className="relative px-2 py-2 text-center shrink-0" style={{ width: widths.pdf }}>
              PDF
              <ResizeGrip col="pdf" />
            </span>
          </div>

          {/* Rows */}
          {displayBooks.map((book, idx) => {
            const pdfUrl = `${ENGINE_URL}/engine/books/${book.book_id}/pdf`
            const layoutUrl = `${pdfUrl}?variant=layout`
            const st = STATUS_CONFIG[book.status]
            const StatusIcon = st.icon
            return (
              <div
                key={book.id}
                className={cn(
                  'flex items-center transition-colors hover:bg-secondary/50',
                  idx > 0 && 'border-t border-border',
                )}
              >
                {/* Icon */}
                <div className="w-10 shrink-0 flex items-center justify-center px-2 py-2.5">
                  <div className="w-7 h-7 rounded bg-red-500/10 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-red-400" />
                  </div>
                </div>

                {/* Title */}
                <div className="flex-1 min-w-[100px] px-2 py-2.5 min-w-0">
                  <span className="text-sm text-foreground truncate block">{book.title}</span>
                </div>

                {/* Author */}
                <span
                  className="px-2 py-2.5 hidden sm:block text-xs text-muted-foreground truncate"
                  style={{ width: widths.author }}
                >
                  {book.authors || '—'}
                </span>

                {/* Category */}
                <span
                  className="px-2 py-2.5 hidden lg:block text-xs text-muted-foreground truncate"
                  style={{ width: widths.category }}
                >
                  {book.category || '—'}
                </span>

                {/* Subcategory */}
                <span
                  className="px-2 py-2.5 hidden lg:block text-xs text-muted-foreground truncate"
                  style={{ width: widths.subcategory }}
                >
                  {book.subcategory || '—'}
                </span>

                {/* Status */}
                <div
                  className="px-2 py-2.5 hidden sm:flex items-center gap-1.5 shrink-0"
                  style={{ width: widths.status }}
                >
                  <StatusIcon className={cn('h-3.5 w-3.5', st.color, book.status === 'processing' && 'animate-spin')} />
                  <span className={cn('text-[11px]', st.color)}>
                    {isFr ? st.labelFr : st.label}
                  </span>
                </div>

                {/* Pages */}
                <span
                  className="px-2 py-2.5 hidden md:block text-xs text-muted-foreground text-right tabular-nums"
                  style={{ width: widths.pages }}
                >
                  {book.pageCount || '—'}
                </span>

                {/* Size */}
                <span
                  className="px-2 py-2.5 hidden md:block text-xs text-muted-foreground text-right tabular-nums"
                  style={{ width: widths.size }}
                >
                  {formatFileSize(book.fileSize)}
                </span>

                {/* PDF links */}
                <div
                  className="px-2 py-2.5 shrink-0 flex items-center justify-center gap-2"
                  style={{ width: widths.pdf }}
                >
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
                    title={isFr ? '原始 PDF' : 'Original PDF'}
                  >
                    <Eye className="h-3 w-3" />
                    {isFr ? '原始' : 'Origin'}
                  </a>
                  {book.status === 'indexed' && (
                    <a
                      href={layoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline"
                      title={isFr ? 'MinerU 排版' : 'MinerU Layout'}
                    >
                      <Layers className="h-3 w-3" />
                      Layout
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// CoverImage — engine cover with gradient fallback
// ============================================================
function CoverImage({
  bookId,
  title,
  status,
  className,
}: {
  bookId: string
  title: string
  status: BookStatus
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const handleError = useCallback(() => setFailed(true), [])

  const coverUrl = status === 'indexed' && !failed
    ? `${ENGINE_URL}/engine/books/${bookId}/cover`
    : null

  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={title}
        onError={handleError}
        className={cn('w-full object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn('w-full flex items-center justify-center', className)}
      style={{ background: titleToGradient(title) }}
    >
      <span className="text-3xl font-bold text-white/25 select-none tracking-widest">
        {titleInitials(title)}
      </span>
    </div>
  )
}

// ============================================================
// PdfBookCard — card view item
// ============================================================
function PdfBookCard({ book, isFr }: { book: BookBase; isFr: boolean }) {
  const pdfUrl = `${ENGINE_URL}/engine/books/${book.book_id}/pdf`
  const layoutUrl = `${pdfUrl}?variant=layout`
  const st = STATUS_CONFIG[book.status]
  const StatusIcon = st.icon

  return (
    <div className="relative w-full text-left group rounded-xl border border-border bg-card
                    hover:bg-secondary/50 transition-all duration-200 hover:shadow-md
                    hover:border-primary/20 overflow-hidden">
      {/* Cover */}
      <div className="relative w-full h-28 overflow-hidden">
        <CoverImage bookId={book.book_id} title={book.title} status={book.status} className="h-28 group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-card/60 backdrop-blur-sm px-1.5 py-0.5">
          <StatusIcon className={cn('h-3 w-3', st.color, book.status === 'processing' && 'animate-spin')} />
          <span className={cn('text-[10px] font-medium', st.color)}>
            {isFr ? st.labelFr : st.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 pt-2">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-0.5 group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        {book.authors && (
          <p className="text-[11px] text-muted-foreground truncate mb-1">{book.authors}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
          {book.pageCount > 0 && (
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {book.pageCount} {isFr ? '页' : 'pages'}
            </span>
          )}
          {book.fileSize > 0 && (
            <span className="flex items-center gap-1">
              <FileDown className="h-3 w-3" />
              {formatFileSize(book.fileSize)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-border flex items-center gap-3">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Eye className="h-3.5 w-3.5" />
            {isFr ? '原始' : 'Origin'}
          </a>
          {book.status === 'indexed' && (
            <a
              href={layoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              <Layers className="h-3.5 w-3.5" />
              Layout
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
