/**
 * QuestionsPage — unified question bank: browse + generate in one page.
 *
 * Route: /engine/question_gen
 *
 * Layout:
 *   [Books sidebar]  |  [PDF preview (left, resizable)]  |  [Questions grid/table (right)]
 *   Chapters appear as checkable items under the selected book in the sidebar.
 *   Toolbar integrates: count input, generate button, clear, refresh, view toggle.
 */

'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import ResizeHandle from '@/features/shared/ResizeHandle'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import {
  MessageSquare, BookOpen, ThumbsUp,
  RefreshCw, Layers, Trash2, Building2, Home, Sparkles,
  Loader2, AlertCircle, Hash, Zap, FileText, X,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { useI18n } from '@/features/shared/i18n/I18nProvider'
import { cn } from '@/features/shared/utils'
import { SidebarLayout, type SidebarItem, type ViewMode } from '@/features/shared/components/SidebarLayout'
import { useBooks, useBookSidebar } from '@/features/shared/books'
import type { TocEntry } from '@/features/shared/books'
import type { Question } from '../types'
import { fetchQuestions, likeQuestion, deleteQuestion, deleteAllQuestions, generateQuestions, saveQuestionToPayload } from '../api'

// ============================================================
// Constants
// ============================================================

const ENGINE = process.env.NEXT_PUBLIC_ENGINE_URL || 'http://localhost:8001'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

/** Badge config: maps question type to icon + gradient colours */
const TYPE_CONFIG: Record<string, { icon: typeof Zap; gradient: string; text: string }> = {
  analytical:  { icon: Zap,  gradient: 'from-violet-500/20 to-purple-500/10', text: 'text-violet-400' },
  conceptual:  { icon: Hash, gradient: 'from-cyan-500/20 to-blue-500/10',     text: 'text-cyan-400'   },
  factual:     { icon: BookOpen, gradient: 'from-emerald-500/20 to-green-500/10', text: 'text-emerald-400' },
  applied:     { icon: Sparkles, gradient: 'from-amber-500/20 to-orange-500/10', text: 'text-amber-400'  },
}

// ============================================================
// Component
// ============================================================

export default function QuestionsPage() {
  const { locale } = useI18n()
  const isZh = locale === 'zh'

  // ==========================================================
  // State
  // ==========================================================
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [likingIds, setLikingIds] = useState<Set<number>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const [clearingAll, setClearingAll] = useState(false)

  // Generation state
  const [genCount, setGenCount] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  // Chapter state (merged into sidebar)
  const [selectedChapterKeys, setSelectedChapterKeys] = useState<Set<string>>(new Set())
  const [chapters, setChapters] = useState<TocEntry[]>([])
  const [chaptersLoading, setChaptersLoading] = useState(false)

  // PDF preview state
  const [previewPage, setPreviewPage] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [pdfWidth, setPdfWidth] = useState(480)
  const [numPdfPages, setNumPdfPages] = useState(0)

  // ==========================================================
  // Hooks
  // ==========================================================
  const { books, loading: booksLoading } = useBooks({ status: 'indexed' })

  // Build sidebar with question counts per book
  const countMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const q of questions) {
      map.set(q.bookId, (map.get(q.bookId) || 0) + 1)
    }
    return map
  }, [questions])

  const { sidebarItems: baseSidebarItems } = useBookSidebar(books, {
    mode: 'by-book',
    countMap,
    isZh,
    allLabel: isZh ? '全部问题' : 'All Questions',
    allIcon: <Layers className="h-4 w-4 text-cyan-400" />,
    bookIcon: <BookOpen className="h-3.5 w-3.5" />,
    categoryIcons: {
      textbook: <BookOpen className="h-3.5 w-3.5 text-blue-400" />,
      ecdev: <Building2 className="h-3.5 w-3.5 text-emerald-400" />,
      real_estate: <Home className="h-3.5 w-3.5 text-amber-400" />,
    },
  })

  // ==========================================================
  // Derived state
  // ==========================================================
  const selectedBookId = filter.startsWith('book::') ? filter.slice(6) : null
  const isSingleBook = selectedBookId !== null

  // Target books for generation
  const targetBookIds = useMemo(() => {
    if (filter === 'all') return books.map((b) => b.book_id)
    if (isSingleBook) return [selectedBookId]
    if (filter.includes('::')) {
      const [cat, sub] = filter.split('::')
      return books
        .filter((b) => (b.category || 'textbook') === cat && b.subcategory === sub)
        .map((b) => b.book_id)
    }
    return books
      .filter((b) => (b.category || 'textbook') === filter)
      .map((b) => b.book_id)
  }, [filter, books, isSingleBook, selectedBookId])

  // ==========================================================
  // Merge chapters into sidebar items
  // ==========================================================

  // Fetch chapters when a single book is selected
  useEffect(() => {
    setSelectedChapterKeys(new Set())
    setChapters([])

    if (!isSingleBook || !selectedBookId) return

    setChaptersLoading(true)
    fetch(`${ENGINE}/engine/books/${selectedBookId}/toc`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: TocEntry[]) => setChapters(data))
      .catch(() => setChapters([]))
      .finally(() => setChaptersLoading(false))
  }, [isSingleBook, selectedBookId])

  // Show PDF when book is selected; jump to chapter page when checked
  useEffect(() => {
    if (!isSingleBook || !selectedBookId) {
      setPreviewPage(null)
      return
    }

    setShowPreview(true)

    if (selectedChapterKeys.size > 0) {
      // Jump to the selected chapter's page
      const tocId = Array.from(selectedChapterKeys)[0]
      const chapter = chapters.find((ch) => String(ch.id) === tocId)
      if (chapter?.pdf_page) {
        setPreviewPage(chapter.pdf_page)
      }
    } else {
      // Default: show page 1 when book is selected
      setPreviewPage(1)
    }
  }, [isSingleBook, selectedBookId, selectedChapterKeys, chapters])

  // Build final sidebar items: base items + chapter items injected under selected book
  const sidebarItems = useMemo<SidebarItem[]>(() => {
    if (!isSingleBook || chapters.length === 0) return baseSidebarItems

    const bookKey = `book::${selectedBookId}`
    const bookIdx = baseSidebarItems.findIndex((item) => item.key === bookKey)
    if (bookIdx === -1) return baseSidebarItems

    // Find the indent level of the book item to nest chapters one level deeper
    const bookLevel = baseSidebarItems[bookIdx].indentLevel ?? 1
    const chapterLevel = (bookLevel + 1) as number

    // Build chapter sidebar items
    const chapterItems: SidebarItem[] = chapters.map((ch) => ({
      key: `chapter::${ch.id}`,
      label: ch.number ? `${ch.number} ${ch.title}` : ch.title,
      indentLevel: chapterLevel,
      checkable: true,
      checked: selectedChapterKeys.has(String(ch.id)),
      icon: <Hash className="h-3 w-3 text-muted-foreground/50" />,
    }))

    // Splice chapter items right after the book item
    const result = [...baseSidebarItems]
    result.splice(bookIdx + 1, 0, ...chapterItems)
    return result
  }, [baseSidebarItems, isSingleBook, selectedBookId, chapters, selectedChapterKeys])

  // ==========================================================
  // Data loading
  // ==========================================================
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchQuestions(200)
      setQuestions(data)
    } catch {
      setError(isZh ? '加载问题失败' : 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [isZh])

  useEffect(() => { load() }, [load])

  // ==========================================================
  // Filtered questions
  // ==========================================================
  const displayQuestions = useMemo(() => {
    let filtered = questions
    if (filter === 'all') {
      // no book filter
    } else if (filter.startsWith('book::')) {
      const bookId = filter.slice(6)
      filtered = filtered.filter((q) => q.bookId === bookId)
    } else {
      const catBooks = books.filter((b) => {
        if (filter.includes('::')) {
          const [cat, sub] = filter.split('::')
          return (b.category || 'textbook') === cat && b.subcategory === sub
        }
        return (b.category || 'textbook') === filter
      })
      const catBookIds = new Set(catBooks.map((b) => b.book_id))
      if (catBookIds.size > 0) {
        filtered = filtered.filter((q) => catBookIds.has(q.bookId))
      }
    }

    // Further filter by selected chapter (page range)
    if (selectedChapterKeys.size > 0 && chapters.length > 0) {
      const tocId = Array.from(selectedChapterKeys)[0]
      const chIdx = chapters.findIndex((ch) => String(ch.id) === tocId)
      if (chIdx !== -1) {
        const ch = chapters[chIdx]
        const pStart = (ch.pdf_page ?? 1) - 1  // 0-indexed
        let pEnd = Infinity
        for (let j = chIdx + 1; j < chapters.length; j++) {
          const nxt = chapters[j]
          if (nxt.pdf_page && nxt.pdf_page > (ch.pdf_page ?? 1)) {
            pEnd = nxt.pdf_page - 1
            break
          }
        }
        filtered = filtered.filter((q) =>
          q.sourcePage != null && q.sourcePage >= pStart && q.sourcePage < pEnd
        )
      }
    }

    return filtered
  }, [questions, filter, books, selectedChapterKeys, chapters])

  // ==========================================================
  // Handlers
  // ==========================================================

  // Custom filter change handler: intercept chapter clicks for checkbox toggle
  const handleFilterChange = useCallback((key: string) => {
    if (key.startsWith('chapter::')) {
      // Single-select: click to select, click again to deselect
      const chapterId = key.slice(9)
      setSelectedChapterKeys((prev) => {
        if (prev.has(chapterId)) return new Set()  // Deselect
        return new Set([chapterId])                 // Select only this one
      })
      // Don't change the main filter — keep the book selected
      return
    }
    // Normal filter change
    setFilter(key)
  }, [])

  const handleLike = useCallback(async (id: number) => {
    const q = questions.find((q) => q.id === id)
    if (!q) return
    setLikingIds((p) => new Set(p).add(id))
    try {
      await likeQuestion(id, q.likes)
      setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, likes: q.likes + 1 } : q)))
    } finally {
      setLikingIds((p) => { const n = new Set(p); n.delete(id); return n })
    }
  }, [questions])

  const handleDelete = useCallback(async (id: number) => {
    setDeletingIds((p) => new Set(p).add(id))
    try {
      await deleteQuestion(id)
      setQuestions((qs) => qs.filter((q) => q.id !== id))
    } finally {
      setDeletingIds((p) => { const n = new Set(p); n.delete(id); return n })
    }
  }, [])

  const handleClearAll = useCallback(async () => {
    const idsToDelete = displayQuestions.map((q) => q.id)
    if (idsToDelete.length === 0) return
    setClearingAll(true)
    try {
      await deleteAllQuestions(idsToDelete)
      if (selectedBookId) {
        setQuestions((qs) => qs.filter((q) => q.bookId !== selectedBookId))
      } else {
        setQuestions([])
      }
    } finally {
      setClearingAll(false)
    }
  }, [selectedBookId, displayQuestions])

  const handleGenerate = useCallback(async () => {
    if (targetBookIds.length === 0) return
    setGenerating(true)
    setGenError(null)

    try {
      const category = !filter.startsWith('book::') && filter !== 'all' && !filter.includes('::')
        ? filter : undefined

      // Resolve page range from selected chapter's TOC entry
      let pageStart: number | undefined
      let pageEnd: number | undefined
      let chapterLabel: string | undefined
      if (selectedChapterKeys.size === 1) {
        const tocId = Array.from(selectedChapterKeys)[0]
        const chIdx = chapters.findIndex((c) => String(c.id) === tocId)
        if (chIdx !== -1) {
          const ch = chapters[chIdx]
          chapterLabel = ch.number ? `${ch.number} ${ch.title}` : ch.title
          // pdf_page is 1-indexed; ChromaDB page_idx is 0-indexed
          pageStart = (ch.pdf_page ?? 1) - 1
          // End = next chapter on a DIFFERENT page (skip same-page entries)
          for (let j = chIdx + 1; j < chapters.length; j++) {
            const nxt = chapters[j]
            if (nxt.pdf_page && nxt.pdf_page > (ch.pdf_page ?? 1)) {
              pageEnd = nxt.pdf_page - 1
              break
            }
          }
          // pageEnd remains undefined for last chapter → no upper bound
        }
      }

      const qs = await generateQuestions(targetBookIds, genCount, {
        category,
        pageStart,
        pageEnd,
      })

      if (qs.length === 0) {
        setGenError(isZh ? '未生成问题，请检查索引' : 'No questions generated')
      } else {
        await Promise.all(
          qs.map((q: Record<string, any>) =>
            saveQuestionToPayload({
              question: q.question,
              bookId: q.book_id || targetBookIds[0] || '',
              bookTitle: q.book_title || '',
              topicHint: q.type || q.difficulty || '',
              source: 'ai',
              likes: 0,
              // Store the source page from the chunk metadata
              sourcePage: q.source_page ?? pageStart ?? undefined,
              scoreRelevance: q.score_relevance || undefined,
              scoreClarity: q.score_clarity || undefined,
              scoreDifficulty: q.score_difficulty || undefined,
              scoreOverall: q.score_overall || undefined,
            }).catch(() => {})
          )
        )
      }
      load()
    } catch {
      setGenError(isZh ? '生成失败' : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }, [targetBookIds, selectedChapterKeys, chapters, filter, genCount, isZh, load])

  // ==========================================================
  // Helpers
  // ==========================================================
  const formatDate = (d: string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString(isZh ? 'zh-CN' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const getBookTitle = (q: Question) => {
    if (q.bookTitle) return q.bookTitle
    const book = books.find((b) => b.book_id === q.bookId)
    return book?.title || q.bookId
  }

  const getTypeConfig = (q: Question) => {
    const hint = (q.topicHint || '').toLowerCase()
    return TYPE_CONFIG[hint] || { icon: MessageSquare, gradient: 'from-slate-500/20 to-slate-500/10', text: 'text-slate-400' }
  }

  // ==========================================================
  // Chapter selection summary (for toolbar)
  // ==========================================================
  const chapterHint = useMemo(() => {
    if (!isSingleBook) return null
    if (selectedChapterKeys.size === 0) return isZh ? '全书' : 'Whole book'
    if (selectedChapterKeys.size === 1) {
      const ch = chapters.find((c) => String(c.id) === Array.from(selectedChapterKeys)[0])
      return ch ? (ch.number ? `Ch ${ch.number}` : ch.title.slice(0, 20)) : null
    }
    return isZh ? `${selectedChapterKeys.size} 章` : `${selectedChapterKeys.size} chapters`
  }, [isSingleBook, selectedChapterKeys, chapters, isZh])

  // ==========================================================
  // Render
  // ==========================================================
  return (
    <SidebarLayout
      title={isZh ? '书籍' : 'Books'}
      icon={<BookOpen className="h-4 w-4 text-primary" />}
      sidebarItems={sidebarItems}
      activeFilter={filter}
      onFilterChange={handleFilterChange}
      showViewToggle
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      sidebarFooter={
        <p className="text-[10px] text-muted-foreground">
          {booksLoading
            ? (isZh ? '正在加载书籍…' : 'Loading books…')
            : (isZh ? `${books.length} 本书 · ${questions.length} 个问题` : `${books.length} books · ${questions.length} questions`)
          }
        </p>
      }
      loading={loading}
      loadingText={isZh ? '正在加载...' : 'Loading...'}
      error={error}
      onRetry={load}
      toolbar={
        <div className="flex items-center gap-2">
          {/* Chapter hint badge */}
          {chapterHint && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {chapterHint}
            </span>
          )}

          {/* ── Generate controls ────────────────────── */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={20}
              value={genCount}
              onChange={(e) => setGenCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              className="w-10 h-7 rounded-md border border-border bg-card text-xs text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={generating}
              title={isZh ? '生成数量' : 'Count'}
            />
            <button
              onClick={handleGenerate}
              disabled={generating || targetBookIds.length === 0}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                generating
                  ? 'bg-primary/20 text-primary cursor-wait'
                  : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] shadow-sm'
              )}
              title={isZh ? '生成问题' : 'Generate questions'}
            >
              {generating
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Sparkles className="h-3.5 w-3.5" />
              }
              {isZh ? '生成' : 'Generate'}
            </button>
          </div>

          {/* ── Divider ──────────────────────────────── */}
          <div className="w-px h-5 bg-border" />

          {/* ── List controls ────────────────────────── */}
          {displayQuestions.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearingAll}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
              title={isZh ? '清空当前列表' : 'Clear all'}
            >
              <Trash2 className={`h-3 w-3 ${clearingAll ? 'animate-spin' : ''}`} />
              {isZh ? '清空' : 'Clear'}
            </button>
          )}
          <button
            onClick={load}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title={isZh ? '刷新' : 'Refresh'}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      }
    >

      {/* ── Generation error feedback ──────────────────────── */}
      {genError && !generating && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs mb-4">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {genError}
          <button onClick={() => setGenError(null)} className="ml-auto text-[10px] underline hover:no-underline">
            {isZh ? '关闭' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* ── Generating indicator ──────────────────────────── */}
      {generating && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10 mb-4">
          <div className="relative">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="absolute inset-0 h-5 w-5 animate-ping rounded-full bg-primary/20" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isZh ? `正在生成 ${genCount} 个问题…` : `Generating ${genCount} questions…`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isZh ? '大约需要 10-30 秒' : 'This may take 10-30 seconds'}
            </p>
          </div>
        </div>
      )}

      {/* ── PDF Preview (left) + Questions (right) split layout ── */}
      <div className="flex flex-1 min-h-0">

      {/* ── PDF Preview Panel (LEFT) ──────────────────── */}
      {previewPage && showPreview && selectedBookId && (
        <>
          <div
            className="shrink-0 flex flex-col rounded-xl border border-border bg-card/50 overflow-hidden"
            style={{ width: pdfWidth }}
          >
            {/* Preview header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {isZh ? '原文预览' : 'PDF Preview'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  p.{previewPage}
                </span>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title={isZh ? '关闭预览' : 'Close preview'}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* PDF rendered via react-pdf — single page with nav */}
            <div className="flex-1 min-h-0 overflow-auto bg-muted/20 p-4 flex flex-col items-center" id="pdf-scroll-container">
              <Document
                file={`${ENGINE}/engine/books/${selectedBookId}/pdf`}
                loading={
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isZh ? '加载 PDF...' : 'Loading PDF...'}
                  </div>
                }
                onLoadSuccess={({ numPages: n }) => setNumPdfPages(n)}
              >
                <Page
                  pageNumber={previewPage}
                  width={pdfWidth - 48}
                  renderTextLayer
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>

            {/* Page navigation */}
            <div className="flex items-center justify-center gap-3 px-3 py-1.5 border-t border-border bg-muted/30">
              <button
                className="px-2 py-0.5 rounded text-xs hover:bg-accent disabled:opacity-30 transition-colors"
                disabled={previewPage <= 1}
                onClick={() => setPreviewPage((p) => Math.max(1, (p ?? 1) - 1))}
              >◀</button>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {previewPage} / {numPdfPages || '…'}
              </span>
              <button
                className="px-2 py-0.5 rounded text-xs hover:bg-accent disabled:opacity-30 transition-colors"
                disabled={numPdfPages > 0 && previewPage >= numPdfPages}
                onClick={() => setPreviewPage((p) => Math.min(numPdfPages || 9999, (p ?? 1) + 1))}
              >▶</button>
            </div>
          </div>

          {/* Resize handle */}
          <ResizeHandle
            width={pdfWidth}
            onResize={setPdfWidth}
            min={280}
            max={800}
          />
        </>
      )}

      {/* ── Questions content (RIGHT) ─────────────────── */}
      <div className="flex-1 min-w-0 pl-4">
        {/* Empty state */}
        {!loading && displayQuestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-5 shadow-lg shadow-primary/5">
              {selectedBookId
                ? <BookOpen className="h-8 w-8 text-primary/60" />
                : <MessageSquare className="h-8 w-8 text-primary/60" />
              }
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">
              {selectedBookId
                ? (isZh ? '此书暂无问题' : 'No questions for this book')
                : (isZh ? '暂无问题' : 'No questions yet')
              }
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
              {selectedBookId
                ? (isZh ? '点击工具栏「生成」按钮来创建问题' : 'Click "Generate" in the toolbar to create questions')
                : (isZh ? '从左侧选择一本书，然后点击「生成」' : 'Select a book, then click "Generate"')
              }
            </p>
          </div>
        )}

        {/* ── Card view ───────────────────────────────────── */}
        {displayQuestions.length > 0 && viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayQuestions.map((q) => {
              const typeConf = getTypeConfig(q)
              const TypeIcon = typeConf.icon
              return (
                <div
                  key={q.id}
                  className={cn(
                    'group relative rounded-xl border border-border bg-card overflow-hidden',
                    'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
                    'transition-all duration-300 ease-out',
                  )}
                >
                  {/* Gradient top accent */}
                  <div className={cn(
                    'h-0.5 w-full bg-gradient-to-r',
                    typeConf.gradient.replace('/20', '/60').replace('/10', '/30'),
                  )} />

                  <div className="p-4">
                    {/* Header: type badge + source */}
                    <div className="flex items-center gap-2 mb-3">
                      {q.topicHint && (
                        <span className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5',
                          'bg-gradient-to-r', typeConf.gradient, typeConf.text,
                        )}>
                          <TypeIcon className="h-2.5 w-2.5" />
                          {q.topicHint}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-purple-500/10 text-purple-400">
                        AI
                      </span>
                      {q.model && (
                        <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground ml-auto">
                          {q.model}
                        </span>
                      )}
                    </div>

                    {/* Question text — full display, no truncation */}
                    <div className="text-sm text-foreground leading-relaxed mb-4 [&_p]:m-0">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {q.question}
                      </ReactMarkdown>
                    </div>

                    {/* Scores row */}
                    {q.scoreOverall != null && (
                      <div className="flex items-center gap-3 mb-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className={cn('inline-block w-1.5 h-1.5 rounded-full',
                            q.scoreRelevance! >= 4 ? 'bg-emerald-400' : q.scoreRelevance! >= 3 ? 'bg-amber-400' : 'bg-red-400'
                          )} />
                          {isZh ? '相关' : 'Rel'} {q.scoreRelevance}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className={cn('inline-block w-1.5 h-1.5 rounded-full',
                            q.scoreClarity! >= 4 ? 'bg-emerald-400' : q.scoreClarity! >= 3 ? 'bg-amber-400' : 'bg-red-400'
                          )} />
                          {isZh ? '清晰' : 'Clr'} {q.scoreClarity}
                        </span>
                        <span className="ml-auto font-semibold text-amber-400">
                          ★ {q.scoreOverall}
                        </span>
                      </div>
                    )}

                    {/* Footer: book info + actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0 max-w-[70%]">
                        <BookOpen className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                        <span className="truncate">{getBookTitle(q)}</span>
                        {q.sourcePage != null && (
                          <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            p.{q.sourcePage + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleLike(q.id)}
                          disabled={likingIds.has(q.id)}
                          className={cn(
                            'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all',
                            q.likes > 0
                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                              : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                          )}
                        >
                          <ThumbsUp className={cn('h-3 w-3', likingIds.has(q.id) && 'animate-bounce')} />
                          {q.likes}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(q.id)}
                          disabled={deletingIds.has(q.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          title={isZh ? '删除' : 'Delete'}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Date */}
                    {q.createdAt && (
                      <p className="text-[9px] text-muted-foreground/50 mt-2">
                        {formatDate(q.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Table view ──────────────────────────────────── */}
        {displayQuestions.length > 0 && viewMode === 'table' && (
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-2.5 bg-muted/40 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border select-none">
              <span>{isZh ? '问题' : 'Question'}</span>
              <span className="w-32 text-right hidden md:block">{isZh ? '书籍' : 'Book'}</span>
              <span className="w-20 text-center hidden sm:block">{isZh ? '类型' : 'Type'}</span>
              <span className="w-24 text-right hidden lg:block">{isZh ? '时间' : 'Date'}</span>
              <span className="w-20 text-center">👍</span>
            </div>

            {/* Rows */}
            {displayQuestions.map((q, idx) => {
              const typeConf = getTypeConfig(q)
              const TypeIcon = typeConf.icon
              return (
                <div
                  key={q.id}
                  className={cn(
                    'group grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-secondary/40',
                    idx > 0 && 'border-t border-border/50'
                  )}
                >
                  {/* Question text */}
                  <div className="min-w-0">
                    <div className="text-sm text-foreground leading-relaxed [&_p]:m-0 [&_p]:inline line-clamp-3">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {q.question}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Book */}
                  <span className="w-32 hidden md:block text-xs text-muted-foreground truncate text-right">
                    {getBookTitle(q)}
                  </span>

                  {/* Type badge */}
                  <div className="w-20 hidden sm:flex justify-center">
                    {q.topicHint && (
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5',
                        'bg-gradient-to-r', typeConf.gradient, typeConf.text,
                      )}>
                        <TypeIcon className="h-2.5 w-2.5" />
                        {q.topicHint}
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <span className="w-24 hidden lg:block text-[10px] text-muted-foreground text-right">
                    {formatDate(q.createdAt)}
                  </span>

                  {/* Actions */}
                  <div className="w-20 flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleLike(q.id)}
                      disabled={likingIds.has(q.id)}
                      className={cn(
                        'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all',
                        q.likes > 0
                          ? 'bg-primary/10 text-primary hover:bg-primary/20'
                          : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                      )}
                    >
                      <ThumbsUp className={cn('h-3 w-3', likingIds.has(q.id) && 'animate-bounce')} />
                      {q.likes}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      disabled={deletingIds.has(q.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      title={isZh ? '删除' : 'Delete'}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>{/* end questions */}

      </div>{/* end split layout */}
    </SidebarLayout>
  )
}
