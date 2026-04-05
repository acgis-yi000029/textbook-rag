/**
 * chat/QuestionsSidebar — Right-side collapsible panel for suggested questions
 *
 * Inspired by: RAG-Project/frontend/src/components/SuggestedQuestionsPanel.tsx
 * Data source: Payload CMS pre-scored high-quality questions (via useSuggestedQuestions)
 *
 * Layout:
 *  ┌─────────────────────┐
 *  │ 💡 Questions  [X]   │  ← header
 *  │ 🔍 Search...        │  ← filter
 *  │ ─── Book Title ───  │
 *  │  question text       │  ← scrollable list
 *  │  question text       │
 *  └─────────────────────┘
 */
'use client'

import { useState, useMemo } from 'react'
import {
  Lightbulb,
  X,
  Search,
  RefreshCw,
  ChevronRight,
  MessageCircleQuestion,
  Loader2,
} from 'lucide-react'
import { cn } from '@/features/shared/utils'
import { useSuggestedQuestions } from '@/features/engine/question_gen'
import type { Question } from '@/features/engine/question_gen'

// ============================================================
// Types
// ============================================================
interface QuestionsSidebarProps {
  /** Active session book IDs to query questions for */
  bookIds: string[]
  /** Called when user clicks a question */
  onSelect: (question: string) => void
  /** Close this panel */
  onClose: () => void
  className?: string
}

// ============================================================
// Helpers
// ============================================================
function groupByBook(questions: Question[]): { bookTitle: string; items: Question[] }[] {
  const map = new Map<string, Question[]>()
  for (const q of questions) {
    const key = q.bookTitle || 'General'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(q)
  }
  return Array.from(map, ([bookTitle, items]) => ({ bookTitle, items }))
}

function difficultyColor(score: number | null): string {
  if (!score) return 'text-muted-foreground'
  if (score <= 2) return 'text-emerald-500'
  if (score <= 3) return 'text-amber-500'
  return 'text-rose-500'
}

function difficultyLabel(score: number | null): string {
  if (!score) return ''
  if (score <= 2) return 'Basic'
  if (score <= 3) return 'Medium'
  return 'Advanced'
}

// ============================================================
// Component
// ============================================================
export default function QuestionsSidebar({
  bookIds,
  onSelect,
  onClose,
  className,
}: QuestionsSidebarProps) {
  const { questions, loading, refetch } = useSuggestedQuestions(bookIds, 20)
  const [search, setSearch] = useState('')
  const [expandedBook, setExpandedBook] = useState<string | null>(null)

  // Filter questions by search
  const filtered = useMemo(() => {
    if (!search.trim()) return questions
    const lower = search.toLowerCase()
    return questions.filter(
      (q) =>
        q.question.toLowerCase().includes(lower) ||
        (q.bookTitle || '').toLowerCase().includes(lower),
    )
  }, [questions, search])

  const groups = useMemo(() => groupByBook(filtered), [filtered])

  // Auto-expand first group
  const effectiveExpanded = expandedBook ?? (groups.length > 0 ? groups[0].bookTitle : null)

  return (
    <aside
      className={cn(
        'flex flex-col h-full w-[280px] shrink-0 bg-card border-l border-border',
        className,
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />
          <span className="text-sm font-semibold text-foreground">Questions</span>
          <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
            {questions.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Search ── */}
      <div className="px-3 py-2 border-b border-border shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-background pl-8 pr-8 py-1.5 text-xs outline-none focus:border-primary transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Question List ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Loading questions…</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 px-4 text-center">
            <MessageCircleQuestion size={28} className="text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              {search ? 'No results found' : 'No questions available'}
            </p>
          </div>
        ) : (
          groups.map(({ bookTitle, items }) => {
            const isExpanded = effectiveExpanded === bookTitle
            return (
              <div key={bookTitle} className="border-b border-border/50 last:border-b-0">
                {/* Book group header */}
                <button
                  type="button"
                  onClick={() => setExpandedBook(isExpanded ? null : bookTitle)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs">📖</span>
                    <span className="text-xs font-medium text-foreground truncate">
                      {bookTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-medium text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                      {items.length}
                    </span>
                    <ChevronRight
                      size={14}
                      className={cn(
                        'text-muted-foreground transition-transform duration-200',
                        isExpanded && 'rotate-90',
                      )}
                    />
                  </div>
                </button>

                {/* Questions */}
                {isExpanded && (
                  <div className="pb-1">
                    {items.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => onSelect(q.question)}
                        className="w-full text-left px-3 py-2 hover:bg-secondary/60 transition-colors group"
                      >
                        <div className="flex items-start gap-2">
                          <MessageCircleQuestion
                            size={13}
                            className="mt-0.5 text-primary/50 group-hover:text-primary shrink-0 transition-colors"
                          />
                          <p className="text-[11px] text-foreground leading-relaxed line-clamp-3">
                            {q.question}
                          </p>
                        </div>
                        {q.scoreDifficulty && (
                          <span
                            className={cn(
                              'ml-5 text-[10px] font-medium',
                              difficultyColor(q.scoreDifficulty),
                            )}
                          >
                            {difficultyLabel(q.scoreDifficulty)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 px-3 py-2 border-t border-border">
        <button
          type="button"
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={cn(loading && 'animate-spin')} />
          Refresh
        </button>
      </div>
    </aside>
  )
}
