/**
 * QuestionsPage — question bank management with sidebar filtering.
 *
 * Route: /engine/question_gen
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  MessageSquare, BookOpen, ThumbsUp,
  RefreshCw, Layers, Trash2, Building2, Home,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { useI18n } from '@/features/shared/i18n/I18nProvider'
import { cn } from '@/features/shared/utils'
import { SidebarLayout, type ViewMode } from '@/features/shared/components/SidebarLayout'
import { useBooks, useBookSidebar } from '@/features/shared/books'
import type { Question } from '../types'
import { fetchQuestions, likeQuestion, deleteQuestion, deleteAllQuestions } from '../api'

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

  // ==========================================================
  // Hooks
  // ==========================================================
  const { books, loading: booksLoading } = useBooks({ status: 'indexed' })

  const questionCountByBook = useMemo(() => {
    const m = new Map<string, number>()
    for (const q of questions) {
      const bid = q.bookId || ''
      m.set(bid, (m.get(bid) || 0) + 1)
    }
    return m
  }, [questions])

  const { sidebarItems } = useBookSidebar(books, {
    mode: 'by-book',
    countMap: questionCountByBook,
    isZh,
    allLabel: isZh ? '全部问题' : 'All Questions',
    allIcon: <Layers className="h-4 w-4 shrink-0" />,
    bookIcon: <BookOpen className="h-4 w-4 shrink-0 text-amber-400" />,
    categoryIcons: {
      textbook:    <BookOpen  className={cn('h-4 w-4 shrink-0', 'text-blue-400')} />,
      ecdev:       <Building2 className={cn('h-4 w-4 shrink-0', 'text-emerald-400')} />,
      real_estate: <Home      className={cn('h-4 w-4 shrink-0', 'text-amber-400')} />,
    },
  })

  // ==========================================================
  // Data loading
  // ==========================================================
  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchQuestions()
      setQuestions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  // ==========================================================
  // Effects
  // ==========================================================
  useEffect(() => { load() }, [load])

  // ==========================================================
  // Handlers
  // ==========================================================
  const handleLike = async (id: number) => {
    setLikingIds((prev) => new Set(prev).add(id))
    const q = questions.find((x) => x.id === id)
    if (!q) return
    try {
      await likeQuestion(id, q.likes)
      setQuestions((prev) => prev.map((x) => x.id === id ? { ...x, likes: x.likes + 1 } : x))
    } catch { /* silently fail */ }
    finally {
      setLikingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingIds((prev) => new Set(prev).add(id))
    try {
      await deleteQuestion(id)
      setQuestions((prev) => prev.filter((x) => x.id !== id))
    } catch { /* silently fail */ }
    finally {
      setDeletingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const handleClearAll = async () => {
    if (!confirm(isZh ? `确定要删除全部 ${displayQuestions.length} 个问题吗？` : `Delete all ${displayQuestions.length} questions?`)) return
    setClearingAll(true)
    try {
      await deleteAllQuestions(displayQuestions.map((q) => q.id))
      setQuestions((prev) => {
        const deletedIds = new Set(displayQuestions.map((q) => q.id))
        return prev.filter((q) => !deletedIds.has(q.id))
      })
    } catch { /* silently fail */ }
    finally { setClearingAll(false) }
  }

  // ==========================================================
  // Derived state
  // ==========================================================
  const displayQuestions = useMemo(() => {
    if (filter === 'all') return questions
    if (filter.startsWith('book::')) {
      const bookId = filter.slice(6)
      return questions.filter((q) => q.bookId === bookId)
    }
    // Subcategory filter: "category::subcategory"
    if (filter.includes('::')) {
      const [cat, sub] = filter.split('::')
      const subBookIds = new Set(
        books.filter((b) => (b.category || 'textbook') === cat && b.subcategory === sub).map((b) => b.book_id)
      )
      return questions.filter((q) => subBookIds.has(q.bookId))
    }
    // Category-level filter: show all questions from books in this category
    const catBookIds = new Set(
      books.filter((b) => (b.category || 'textbook') === filter).map((b) => b.book_id)
    )
    if (catBookIds.size > 0) {
      return questions.filter((q) => catBookIds.has(q.bookId))
    }
    return questions
  }, [questions, filter, books])

  const selectedBookId = filter.startsWith('book::') ? filter.slice(6) : null

  // ==========================================================
  // Helpers
  // ==========================================================
  const formatDate = (d: string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString(isZh ? 'zh-CN' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
    ai:     { label: 'AI',     color: 'text-purple-400 bg-purple-500/10' },
    manual: { label: 'Manual', color: 'text-blue-400 bg-blue-500/10' },
  }

  // ==========================================================
  // Render
  // ==========================================================
  return (
    <SidebarLayout
      title={isZh ? '书籍' : 'Books'}
      icon={<BookOpen className="h-4 w-4 text-primary" />}
      sidebarItems={sidebarItems}
      activeFilter={filter}
      onFilterChange={setFilter}
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
        <div className="flex items-center gap-1">
          {displayQuestions.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearingAll}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
              title={isZh ? '清空当前列表' : 'Clear all'}
            >
              <Trash2 className={cn('h-3 w-3', clearingAll && 'animate-spin')} />
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
      {/* ── Empty state ─────────────────────────────────────── */}
      {!loading && displayQuestions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            {selectedBookId
              ? <BookOpen className="h-7 w-7 text-muted-foreground" />
              : <MessageSquare className="h-7 w-7 text-muted-foreground" />
            }
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {selectedBookId
              ? (isZh ? '此书暂无问题' : 'No questions for this book')
              : (isZh ? '暂无问题' : 'No questions yet')
            }
          </h3>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            {selectedBookId
              ? (isZh ? '该书籍目前没有生成任何问题' : 'No questions have been generated for this book yet')
              : (isZh ? '从左侧选择一本书查看该书的问题' : 'Select a book from the sidebar to view its questions')
            }
          </p>
        </div>
      )}

      {/* ── Card view ───────────────────────────────────────── */}
      {displayQuestions.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayQuestions.map((q) => (
            <div
              key={q.id}
              className="group rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
            >
              {/* Header: topic + source + model */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {q.topicHint && (
                  <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-muted text-muted-foreground">
                    {q.topicHint}
                  </span>
                )}
                <span className={cn(
                  'text-[10px] font-semibold rounded-full px-2 py-0.5',
                  SOURCE_CONFIG[q.source]?.color || 'bg-muted text-muted-foreground'
                )}>
                  {SOURCE_CONFIG[q.source]?.label || q.source}
                </span>
                {q.model && (
                  <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-cyan-500/10 text-cyan-400">
                    {q.model}
                  </span>
                )}
              </div>

              {/* Question text */}
              <div className="text-sm text-foreground leading-relaxed mb-2 line-clamp-3 [&_p]:m-0">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {q.question}
                </ReactMarkdown>
              </div>

              {/* Scores */}
              {q.scoreOverall != null && (
                <div className="flex items-center gap-3 mb-3 text-[10px] text-muted-foreground">
                  <span title={isZh ? '相关性' : 'Relevance'} className="flex items-center gap-0.5">
                    <span className={cn('inline-block w-1.5 h-1.5 rounded-full',
                      q.scoreRelevance! >= 4 ? 'bg-emerald-400' : q.scoreRelevance! >= 3 ? 'bg-amber-400' : 'bg-red-400'
                    )} />
                    {isZh ? '相关' : 'Rel'} {q.scoreRelevance}
                  </span>
                  <span title={isZh ? '清晰度' : 'Clarity'} className="flex items-center gap-0.5">
                    <span className={cn('inline-block w-1.5 h-1.5 rounded-full',
                      q.scoreClarity! >= 4 ? 'bg-emerald-400' : q.scoreClarity! >= 3 ? 'bg-amber-400' : 'bg-red-400'
                    )} />
                    {isZh ? '清晰' : 'Clr'} {q.scoreClarity}
                  </span>
                  <span title={isZh ? '难度' : 'Difficulty'} className="flex items-center gap-0.5">
                    <span className={cn('inline-block w-1.5 h-1.5 rounded-full',
                      q.scoreDifficulty! >= 4 ? 'bg-purple-400' : q.scoreDifficulty! >= 3 ? 'bg-blue-400' : 'bg-sky-300'
                    )} />
                    {isZh ? '难度' : 'Dif'} {q.scoreDifficulty}
                  </span>
                  <span className="ml-auto font-semibold text-foreground">
                    ★ {q.scoreOverall}
                  </span>
                </div>
              )}

              {/* Footer: book + actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate max-w-[50%]">
                  <BookOpen className="h-3 w-3 shrink-0" />
                  <span className="truncate">{q.bookTitle || q.bookId}</span>
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
                        : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
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

              {/* Date */}
              {q.createdAt && (
                <p className="text-[9px] text-muted-foreground/60 mt-2">
                  {formatDate(q.createdAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Table view ──────────────────────────────────────── */}
      {displayQuestions.length > 0 && viewMode === 'table' && (
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 px-4 py-2 bg-muted/50 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border select-none">
            <span className="flex-1">{isZh ? '问题' : 'Question'}</span>
            <span className="w-28 hidden sm:block text-right">{isZh ? '书籍' : 'Book'}</span>
            <span className="w-24 hidden md:block text-center">{isZh ? '模型' : 'Model'}</span>
            <span className="w-16 hidden md:block text-center">{isZh ? '来源' : 'Source'}</span>
            <span className="w-24 hidden lg:block text-right">{isZh ? '时间' : 'Date'}</span>
            <span className="w-16 text-center">👍</span>
            <span className="w-8" />
          </div>

          {/* Rows */}
          {displayQuestions.map((q, idx) => (
            <div
              key={q.id}
              className={cn(
                'group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary/50',
                idx > 0 && 'border-t border-border'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground truncate [&_p]:m-0 [&_p]:inline">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {q.question}
                  </ReactMarkdown>
                </div>
                {q.topicHint && (
                  <span className="text-[10px] text-muted-foreground">{q.topicHint}</span>
                )}
              </div>

              <span className="w-28 hidden sm:block text-xs text-muted-foreground truncate text-right">
                {q.bookTitle || q.bookId}
              </span>

              <span className="w-24 hidden md:block text-[10px] text-cyan-400 text-center truncate">
                {q.model || '—'}
              </span>

              <div className="w-16 hidden md:flex justify-center">
                <span className={cn(
                  'text-[10px] font-semibold rounded-full px-2 py-0.5',
                  SOURCE_CONFIG[q.source]?.color
                )}>
                  {SOURCE_CONFIG[q.source]?.label}
                </span>
              </div>

              <span className="w-24 hidden lg:block text-[10px] text-muted-foreground text-right">
                {formatDate(q.createdAt)}
              </span>

              <div className="w-16 flex justify-center">
                <button
                  type="button"
                  onClick={() => handleLike(q.id)}
                  disabled={likingIds.has(q.id)}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all',
                    q.likes > 0
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  )}
                >
                  <ThumbsUp className={cn('h-3 w-3', likingIds.has(q.id) && 'animate-bounce')} />
                  {q.likes}
                </button>
              </div>

              <div className="w-8 flex justify-center">
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
          ))}
        </div>
      )}
    </SidebarLayout>
  )
}
