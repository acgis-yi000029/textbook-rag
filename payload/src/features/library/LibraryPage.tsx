'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Library,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  BookOpen,
  LayoutGrid,
  List,
  ChevronRight,
  FolderOpen,
  Folder,
  Hash,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MessageSquarePlus,
  CheckSquare,
  Square,
} from 'lucide-react'
import { useI18n } from '@/features/shared/i18n'
import { useLibraryBooks } from './useLibraryBooks'
import type { LibraryBook, BookCategory } from './types'
import { PIPELINE_STAGE_CONFIGS } from './types'
import BookCard from './BookCard'
import StatusBadge, { StageDot } from './StatusBadge'
import { cn } from '@/features/shared/utils'

type ViewMode = 'grid' | 'list'

/** 排序配置 */
type SortField = 'title' | 'authors' | 'pages' | 'chunks' | 'status' | 'updatedAt'
type SortDir = 'asc' | 'desc'

/** 分类树节点配置 */
interface TreeNode {
  key: 'all' | BookCategory
  label: string
  labelZh: string
  emoji: string
  color: string
}

const TREE_NODES: TreeNode[] = [
  { key: 'all',         label: 'All Books',   labelZh: '全部教材', emoji: '📚', color: 'text-primary' },
  { key: 'textbook',    label: 'Textbooks',   labelZh: '教材',     emoji: '📘', color: 'text-brand-400' },
  { key: 'ecdev',       label: 'EC Dev',      labelZh: '经济发展', emoji: '📊', color: 'text-purple-400' },
  { key: 'real_estate', label: 'Real Estate', labelZh: '房地产',   emoji: '🏠', color: 'text-teal-400' },
]

/** 全字段模糊匹配 */
function fuzzyMatch(book: LibraryBook, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    book.title.toLowerCase().includes(q) ||
    (book.authors?.toLowerCase().includes(q) ?? false) ||
    book.engineBookId.toLowerCase().includes(q) ||
    (book.isbn?.toLowerCase().includes(q) ?? false) ||
    book.category.toLowerCase().includes(q) ||
    book.status.toLowerCase().includes(q)
  )
}

/** 排序比较 */
function compareBooks(a: LibraryBook, b: LibraryBook, field: SortField, dir: SortDir): number {
  let cmp = 0
  switch (field) {
    case 'title':
      cmp = a.title.localeCompare(b.title)
      break
    case 'authors':
      cmp = (a.authors ?? '').localeCompare(b.authors ?? '')
      break
    case 'pages':
      cmp = (a.metadata?.pageCount ?? 0) - (b.metadata?.pageCount ?? 0)
      break
    case 'chunks':
      cmp = (a.chunkCount ?? 0) - (b.chunkCount ?? 0)
      break
    case 'status': {
      const order = { indexed: 0, processing: 1, pending: 2, error: 3 }
      cmp = (order[a.status] ?? 9) - (order[b.status] ?? 9)
      break
    }
    case 'updatedAt':
      cmp = (a.updatedAt ?? '').localeCompare(b.updatedAt ?? '')
      break
  }
  return dir === 'asc' ? cmp : -cmp
}

/**
 * LibraryPage — Windows Explorer 风格资料库
 *
 * 左侧：分类文件夹树
 * 右侧：搜索 + 可排序表格 / 网格
 */
export default function LibraryPage() {
  const router = useRouter()
  const { locale } = useI18n()
  const isZh = locale === 'zh'

  const {
    books,
    total,
    loading,
    error,
    search,
    setSearch,
    category,
    setCategory,
    refresh,
  } = useLibraryBooks()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  /** 全字段模糊搜索 (客户端) */
  const [localSearch, setLocalSearch] = useState('')

  /** 多选模式 */
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const toggleSelect = (book: LibraryBook) => {
    if (book.status !== 'indexed') return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(book.id)) next.delete(book.id)
      else next.add(book.id)
      return next
    })
  }

  const startNewChat = () => {
    if (selected.size === 0) return
    const state = {
      currentBookId: [...selected][0],
      sessionBookIds: [...selected],
      sessionStarted: true,
      currentPage: 1,
    }
    sessionStorage.setItem('textbook-rag-state', JSON.stringify(state))
    router.push('/chat')
  }

  /** 处理后的书籍列表：模糊搜索 + 排序 */
  const displayBooks = useMemo(() => {
    let filtered = books
    if (localSearch.trim()) {
      filtered = books.filter((b) => fuzzyMatch(b, localSearch.trim()))
    }
    return [...filtered].sort((a, b) => compareBooks(a, b, sortField, sortDir))
  }, [books, localSearch, sortField, sortDir])

  /** 按分类统计数量（基于原始 books，不受搜索影响） */
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0 }
    for (const b of books) {
      const cat = b.category || 'textbook'
      c[cat] = (c[cat] || 0) + 1
      c.all++
    }
    return c
  }, [books])

  /** 切换排序 */
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  /** 排序图标 */
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover/th:opacity-50" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />
  }

  /** 点击书籍 → 切换多选（indexed 才可选） */
  const handleSelect = (book: LibraryBook) => {
    toggleSelect(book)
  }

  const activeNode = TREE_NODES.find((n) => n.key === (category === 'all' ? 'all' : category)) ?? TREE_NODES[0]

  return (
    <div className="flex h-full">
      {/* ════════════ Left Panel: Folder Tree ════════════ */}
      <aside className="w-52 shrink-0 border-r border-border bg-card/50 flex flex-col">
        <div className="px-3 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              {isZh ? '资料库' : 'Library'}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-1.5">
          {TREE_NODES.map((node) => {
            const isActive = category === node.key || (category === 'all' && node.key === 'all')
            const count = counts[node.key] ?? 0
            const IconComp = isActive ? FolderOpen : Folder

            return (
              <button
                key={node.key}
                type="button"
                onClick={() => setCategory(node.key as any)}
                className={cn(
                  'flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-left transition-colors mb-0.5',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  node.key !== 'all' && 'ml-3'
                )}
              >
                <IconComp className="h-4 w-4 shrink-0" />
                <span className="text-xs flex-1 truncate">
                  {isZh ? node.labelZh : node.label}
                </span>
                {count > 0 && (
                  <span className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                    isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-2.5 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            {isZh ? `共 ${total} 本` : `${total} total`}
          </p>
        </div>
      </aside>

      {/* ════════════ Right Panel: Content ════════════ */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* ── Floating "New Chat" action bar ── */}
        {selected.size > 0 && (
          <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-slate-900 text-white border-b border-slate-800 animate-in slide-in-from-top-1 duration-200">
            <CheckSquare className="h-4 w-4 shrink-0 text-green-400" />
            <span className="text-sm font-medium flex-1">
              {isZh
                ? `已选 ${selected.size} 本书`
                : `${selected.size} book${selected.size > 1 ? 's' : ''} selected`}
            </span>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded"
            >
              {isZh ? '清除' : 'Clear'}
            </button>
            <button
              type="button"
              onClick={startNewChat}
              className="flex items-center gap-2 bg-white text-slate-900 rounded-lg px-4 py-1.5 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              <MessageSquarePlus className="h-4 w-4" />
              {isZh ? '开始对话' : 'New Chat'}
            </button>
          </div>
        )}
        {/* Toolbar */}
        <div className="shrink-0 px-4 py-2.5 border-b border-border bg-card/30 space-y-2">
          {/* Row 1: breadcrumb + view toggle + refresh */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              <Library className="h-3.5 w-3.5" />
              <ChevronRight className="h-3 w-3" />
              <span className={cn('font-medium', activeNode.color)}>
                {isZh ? activeNode.labelZh : activeNode.label}
              </span>
              <span className="text-muted-foreground">
                ({displayBooks.length}{localSearch ? ` / ${books.length}` : ''})
              </span>
            </div>

            <div className="flex-1" />

            <div className="flex items-center rounded-md border border-input p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1 rounded transition-colors',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={isZh ? '网格' : 'Grid'}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1 rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={isZh ? '列表' : 'List'}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={refresh}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title={isZh ? '刷新' : 'Refresh'}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Row 2: Full-field fuzzy search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={isZh
                ? '搜索书名、作者、ISBN、分类...'
                : 'Search title, author, ISBN, category...'}
              className="w-full h-8 pl-9 pr-3 rounded-md border border-input bg-background text-xs text-foreground
                         placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/30
                         transition-colors"
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
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">
                {isZh ? '正在加载...' : 'Loading...'}
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="h-8 w-8 text-destructive mb-3" />
              <p className="text-sm text-destructive mb-3">{error}</p>
              <button
                onClick={refresh}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium
                           hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                {isZh ? '重试' : 'Retry'}
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && displayBooks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <BookOpen className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {localSearch
                  ? (isZh ? '未找到匹配结果' : 'No matches found')
                  : (isZh ? '此分类暂无教材' : 'No books in this category')}
              </h3>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                {localSearch
                  ? (isZh ? '尝试不同的关键词' : 'Try different keywords')
                  : (isZh ? '运行 sync_to_payload.py 同步，或通过 Admin 上传 PDF。' : 'Run sync_to_payload.py to sync, or upload via Admin.')}
              </p>
            </div>
          )}

          {/* ── Grid view ── */}
          {!loading && !error && displayBooks.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {displayBooks.map((book) => (
                <div key={book.id} className="relative group/card">
                  <BookCard book={book} onSelect={handleSelect} />
                  {book.status === 'indexed' && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleSelect(book) }}
                      className={cn(
                        'absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all shadow-sm',
                        selected.has(book.id)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40 bg-card/80 text-transparent group-hover/card:text-muted-foreground'
                      )}
                    >
                      {selected.has(book.id)
                        ? <CheckSquare className="h-4 w-4" />
                        : <Square className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── List view (sortable table) ── */}
          {!loading && !error && displayBooks.length > 0 && viewMode === 'list' && (
            <div className="rounded-lg border border-border overflow-hidden">
              {/* Sortable table header */}
              <div className="flex items-center gap-4 px-4 py-2 bg-muted/50 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border select-none">
                <span className="w-5 shrink-0" />
                <button
                  onClick={() => toggleSort('title')}
                  className="flex items-center gap-1 flex-1 group/th hover:text-foreground transition-colors"
                >
                  {isZh ? '书名' : 'Title'}
                  <SortIcon field="title" />
                </button>
                <button
                  onClick={() => toggleSort('authors')}
                  className="w-28 hidden sm:block text-right group/th hover:text-foreground transition-colors"
                >
                  {isZh ? '作者' : 'Author'}
                </button>
                <button
                  onClick={() => toggleSort('pages')}
                  className="w-16 hidden md:block text-right group/th hover:text-foreground transition-colors"
                >
                  {isZh ? '页数' : 'Pages'}
                </button>
                <button
                  onClick={() => toggleSort('chunks')}
                  className="w-16 hidden lg:block text-right group/th hover:text-foreground transition-colors"
                >
                  Chunks
                </button>
                {/* 5 个独立阶段列 */}
                {PIPELINE_STAGE_CONFIGS.map((cfg) => (
                  <span key={cfg.key} className="w-10 hidden xl:block text-center" title={cfg.label}>
                    {cfg.label}
                  </span>
                ))}
                <button
                  onClick={() => toggleSort('status')}
                  className="flex items-center justify-center gap-1 w-20 group/th hover:text-foreground transition-colors"
                >
                  {isZh ? '状态' : 'Status'}
                  <SortIcon field="status" />
                </button>
              </div>

              {/* Table rows */}
              {displayBooks.map((book, idx) => {
                const isChecked = selected.has(book.id)
                return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => handleSelect(book)}
                  className={cn(
                    'flex items-center gap-4 w-full px-4 py-2.5 text-left transition-colors',
                    isChecked ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-secondary/50',
                    idx > 0 && 'border-t border-border',
                    book.status !== 'indexed' && 'opacity-60'
                  )}
                >
                  {/* Checkbox */}
                  <div className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                    isChecked
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30'
                  )}>
                    {isChecked && <CheckSquare className="h-3.5 w-3.5" />}
                  </div>

                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground truncate">
                      {book.title}
                      <span className="text-muted-foreground">.pdf</span>
                    </span>
                  </div>

                  <span className="w-28 hidden sm:block text-xs text-muted-foreground truncate text-right">
                    {book.authors || '—'}
                  </span>

                  <span className="w-16 hidden md:block text-xs text-muted-foreground text-right tabular-nums">
                    {book.metadata?.pageCount || '—'}
                  </span>

                  <span className="w-16 hidden lg:block text-xs text-muted-foreground text-right tabular-nums">
                    {book.chunkCount || '—'}
                  </span>

                  {/* 5 个独立阶段状态 */}
                  {PIPELINE_STAGE_CONFIGS.map((cfg) => (
                    <div key={cfg.key} className="w-10 hidden xl:flex justify-center shrink-0">
                      <StageDot value={book.pipeline[cfg.key]} label={cfg.label} />
                    </div>
                  ))}

                  <div className="w-20 flex justify-center shrink-0">
                    <StatusBadge status={book.status} />
                  </div>
                </button>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
