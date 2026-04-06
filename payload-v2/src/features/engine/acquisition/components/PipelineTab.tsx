/**
 * PipelineTab — 3-column pipeline status + execution + output viewer.
 *
 * Layout: Pipeline Stepper (220px) │ Execute Panel (~300px) │ Output Panel (~400px)
 *
 * Data source: Payload CMS
 *   - Books.pipeline (chunked / toc / bm25 / embeddings / vector)
 *   - IngestTasks collection — task progress / log / error
 *   - Engine API — per-stage output data + embedding model list
 *
 * Execution modes:
 *   - Run All: sequential Chunked → TOC → BM25 → Embeddings → Vector
 *   - Run {Stage}: single-step execution for the selected stage
 *
 * Ref: AQ-08 — Pipeline Tab (v5 three-column design)
 */

'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Play,
  RefreshCw,
  Copy,
  Zap,
  FileText,
  BookOpen,
  Search,
  Cpu,
  Database,
  Pause,
  Square,
  RotateCcw,
  Activity,
  ChevronDown,
  ChevronRight,
  Radio,
} from 'lucide-react'
import { useI18n } from '@/features/shared/i18n'
import { cn } from '@/features/shared/utils'
import { authFetch } from '@/features/shared/authFetch'
import type { BookBase, PipelineStage, PipelineInfo } from '@/features/shared/books'

// ============================================================
// Constants
// ============================================================
const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || 'http://localhost:8001'
const POLL_TASKS_MS = 3000
const POLL_OUTPUT_MS = 5000

// ============================================================
// Types
// ============================================================
type PipelineKey = 'chunked' | 'toc' | 'bm25' | 'embeddings' | 'vector'

interface IngestTask {
  id: number
  taskType: string
  book: { id: number; title: string } | number | null
  status: 'queued' | 'running' | 'done' | 'error'
  progress: number
  log: string | null
  error: string | null
  startedAt: string | null
  finishedAt: string | null
}

interface EmbeddingModel {
  name: string
  provider: string
  dimensions: number
  description: string
}

// ============================================================
// Props
// ============================================================
interface PipelineTabProps {
  books: BookBase[]
  filter: string
}

// ============================================================
// Stage config
// ============================================================
interface StageConfig {
  key: PipelineKey
  label: string
  labelZh: string
  icon: React.ElementType
  description: string
  descriptionZh: string
  steps: string[]
  stepsZh: string[]
}

const STAGES: StageConfig[] = [
  {
    key: 'chunked',
    label: 'Chunked', labelZh: '分块',
    icon: FileText,
    description: 'MinerU Reader parses content_list.json into Document nodes.',
    descriptionZh: 'MinerU Reader 解析 content_list.json 为 Document 节点。',
    steps: ['Read MinerU output (content_list.json)', 'Parse documents → Document[]', 'Push chunks to Payload CMS'],
    stepsZh: ['读取 MinerU 输出 (content_list.json)', '解析文档 → Document[]', '推送 chunks 到 Payload CMS'],
  },
  {
    key: 'toc',
    label: 'TOC', labelZh: '目录',
    icon: BookOpen,
    description: 'Extract PDF bookmarks and heading hierarchy.',
    descriptionZh: '提取 PDF 书签与标题层级结构。',
    steps: ['Extract PDF bookmarks / headings', 'Build heading hierarchy', 'Map chapters ↔ page ranges'],
    stepsZh: ['提取 PDF 书签 / 标题', '构建标题层级结构', '映射章节 ↔ 页码范围'],
  },
  {
    key: 'bm25',
    label: 'BM25', labelZh: 'BM25',
    icon: Search,
    description: 'Build FTS5 inverted index for BM25 keyword retrieval.',
    descriptionZh: '构建 FTS5 倒排索引，用于 BM25 关键词检索。',
    steps: ['Build FTS5 inverted index', 'Calculate term frequencies (TF-IDF)', 'BM25 scoring ready'],
    stepsZh: ['构建 FTS5 倒排索引', '计算词频 (TF-IDF)', 'BM25 评分就绪'],
  },
  {
    key: 'embeddings',
    label: 'Embeddings', labelZh: '嵌入',
    icon: Cpu,
    description: 'Generate vector embeddings via selected model.',
    descriptionZh: '通过选定模型生成向量嵌入。',
    steps: ['Load embedding model', 'Batch generate vectors', 'Validate dimension consistency'],
    stepsZh: ['加载嵌入模型', '批量生成向量', '验证维度一致性'],
  },
  {
    key: 'vector',
    label: 'Vector', labelZh: '向量',
    icon: Database,
    description: 'Ingest vectors into ChromaDB persistent collection.',
    descriptionZh: '将向量写入 ChromaDB 持久化集合。',
    steps: ['Initialize ChromaDB collection', 'Batch upsert vectors', 'Verify vector count vs chunk count'],
    stepsZh: ['初始化 ChromaDB collection', '批量 upsert 向量', '验证向量数 vs chunk 数'],
  },
]

// ============================================================
// Status config
// ============================================================
const STAGE_STATUS: Record<PipelineStage, {
  icon: React.ElementType
  color: string
  bg: string
  border: string
  label: string
  labelZh: string
}> = {
  done:    { icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Done',    labelZh: '完成' },
  pending: { icon: Clock,         color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border',          label: 'Pending', labelZh: '待处理' },
  error:   { icon: AlertTriangle, color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     label: 'Error',   labelZh: '错误' },
}

const TASK_STATUS: Record<string, { icon: React.ElementType; color: string; label: string; labelZh: string }> = {
  queued:  { icon: Clock,         color: 'text-muted-foreground', label: 'Queued',  labelZh: '排队中' },
  running: { icon: Loader2,       color: 'text-amber-400',        label: 'Running', labelZh: '运行中' },
  done:    { icon: CheckCircle2,  color: 'text-emerald-400',      label: 'Done',    labelZh: '完成' },
  error:   { icon: AlertTriangle, color: 'text-red-400',          label: 'Error',   labelZh: '错误' },
}

// ============================================================
// Component
// ============================================================
export default function PipelineTab({ books, filter }: PipelineTabProps) {
  const { locale } = useI18n()
  const isZh = locale === 'zh'

  // ==========================================================
  // State
  // ==========================================================
  const [activeStage, setActiveStage] = useState<PipelineKey>('chunked')
  const [tasks, setTasks] = useState<IngestTask[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())
  const [embeddingModels, setEmbeddingModels] = useState<EmbeddingModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const logRef = useRef<HTMLPreElement>(null)

  // — Resizable panel widths (same pattern as EvaluationPage)
  const [stepperWidth, setStepperWidth] = useState(220)
  const [executeWidth, setExecuteWidth] = useState(320)

  // ==========================================================
  // Selected book (from sidebar filter)
  // ==========================================================
  const selectedBook = useMemo(() => {
    if (filter === 'all' || !filter) return null
    if (filter.startsWith('book::')) {
      const bookId = filter.slice(6)
      return books.find((b) => b.book_id === bookId) ?? null
    }
    return null
  }, [books, filter])

  // Pipeline info from book
  const pipeline: PipelineInfo = useMemo(() => {
    if (!selectedBook?.pipeline) {
      return { chunked: 'pending', toc: 'pending', bm25: 'pending', embeddings: 'pending', vector: 'pending' }
    }
    return selectedBook.pipeline
  }, [selectedBook])

  // ==========================================================
  // Fetch IngestTasks
  // ==========================================================
  const fetchTasks = useCallback(async () => {
    if (!selectedBook) return
    setLoadingTasks(true)
    try {
      const params = new URLSearchParams({
        limit: '50',
        depth: '1',
        sort: '-createdAt',
        'where[book][equals]': selectedBook.id.toString(),
      })
      const res = await authFetch(`/api/ingest-tasks?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.docs ?? [])
      }
    } catch (e) {
      console.error('Failed to fetch ingest tasks:', e)
    } finally {
      setLoadingTasks(false)
    }
  }, [selectedBook])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // ==========================================================
  // Auto-poll when tasks are running
  // ==========================================================
  const hasRunning = tasks.some((t) => t.status === 'running' || t.status === 'queued')

  useEffect(() => {
    if (!hasRunning) return
    const interval = setInterval(fetchTasks, POLL_TASKS_MS)
    return () => clearInterval(interval)
  }, [hasRunning, fetchTasks])

  // ==========================================================
  // Auto-scroll log
  // ==========================================================
  const activeTask = tasks.find((t) => t.status === 'running')
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [activeTask?.log])

  // ==========================================================
  // Fetch embedding models
  // ==========================================================
  useEffect(() => {
    fetch(`${ENGINE_URL}/engine/embeddings/models`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.models) {
          setEmbeddingModels(data.models)
          setSelectedModel(data.default || data.models[0]?.name || '')
        }
      })
      .catch(() => {})
  }, [])

  // ==========================================================
  // Trigger action
  // ==========================================================
  const triggerAction = useCallback(async (stage: PipelineKey) => {
    if (!selectedBook) return
    setTriggerLoading(true)
    try {
      await fetch(`${ENGINE_URL}/engine/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: selectedBook.id,
          title: selectedBook.title,
          category: selectedBook.category,
          ...(stage === 'embeddings' && selectedModel ? { embed_model: selectedModel } : {}),
        }),
      })
      setTimeout(() => fetchTasks(), 1000)
    } catch (e) {
      console.error('Failed to trigger:', e)
    } finally {
      setTriggerLoading(false)
    }
  }, [selectedBook, selectedModel, fetchTasks])

  // ==========================================================
  // Resize drag handler (same pattern as EvaluationPage)
  // ==========================================================
  const createDragHandler = useCallback(
    (setter: React.Dispatch<React.SetStateAction<number>>, min: number, max: number) => {
      return (e: React.MouseEvent) => {
        e.preventDefault()
        const startX = e.clientX
        let startWidth = 0
        setter(w => { startWidth = w; return w })

        const onMove = (ev: MouseEvent) => {
          const delta = ev.clientX - startX
          setter(Math.min(max, Math.max(min, startWidth + delta)))
        }
        const onUp = () => {
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('mouseup', onUp)
          document.body.style.cursor = ''
          document.body.style.userSelect = ''
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
      }
    },
    [],
  )

  // ==========================================================
  // Helpers
  // ==========================================================
  const copyText = (text: string) => navigator.clipboard.writeText(text)

  const fmtDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleString(isZh ? 'zh-CN' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const toggleTask = (id: number) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ==========================================================
  // No book selected
  // ==========================================================
  if (!selectedBook) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Activity className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {isZh ? '请选择一本书' : 'Select a book'}
        </h3>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          {isZh
            ? '从侧栏选择书籍以查看 Pipeline 状态。'
            : 'Choose a book from the sidebar to view pipeline status.'}
        </p>
      </div>
    )
  }

  // ==========================================================
  // Active stage config
  // ==========================================================
  const stageConfig = STAGES.find((s) => s.key === activeStage)!
  const stageStatus: PipelineStage = pipeline[activeStage]
  const statusCfg = STAGE_STATUS[stageStatus]

  // Tasks filtered for active stage
  const stageTasks = tasks.filter((t) =>
    t.taskType === activeStage || t.taskType === 'ingest' || t.taskType === 'full',
  )

  // ==========================================================
  // Render
  // ==========================================================
  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-end">
        <button
          onClick={fetchTasks}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border
                     text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <RefreshCw className={cn('h-3 w-3', loadingTasks && 'animate-spin')} />
          {isZh ? '刷新' : 'Refresh'}
        </button>
      </div>

      {/* ── 3-column layout (flex + resize handles, same as EvaluationPage) ── */}
      <div className="flex overflow-hidden rounded-lg border border-border" style={{ minHeight: '480px' }}>

        {/* ════════════════════════════════════════════════
            LEFT: Pipeline Stepper
            ════════════════════════════════════════════════ */}
        <div className="flex flex-col shrink-0 border-r border-border p-3" style={{ width: stepperWidth }}>
          <div className="flex-1 space-y-0">
            {STAGES.map((stage, idx) => {
              const st = pipeline[stage.key]
              const sc = STAGE_STATUS[st]
              const Icon = sc.icon
              const isActive = activeStage === stage.key
              const isLast = idx === STAGES.length - 1

              return (
                <div key={stage.key}>
                  {/* Stage row */}
                  <button
                    type="button"
                    onClick={() => setActiveStage(stage.key)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-start gap-2.5',
                      isActive
                        ? cn(sc.bg, sc.border, 'border')
                        : 'hover:bg-secondary/30',
                    )}
                  >
                    {/* Status icon */}
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                      st === 'done' ? 'bg-emerald-500/15' :
                      st === 'error' ? 'bg-red-500/15' :
                      'bg-muted',
                    )}>
                      <Icon className={cn(
                        'h-3.5 w-3.5',
                        sc.color,
                        st === 'done' ? '' : st === 'error' ? '' : '',
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">{isZh ? stage.labelZh : stage.label}</span>
                        <span className={cn('text-[10px] font-medium', sc.color)}>
                          {isZh ? sc.labelZh : sc.label}
                        </span>
                      </div>
                      {isActive && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight truncate">
                          {isZh ? stage.descriptionZh : stage.description}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* Connector line */}
                  {!isLast && (
                    <div className="flex justify-start pl-[22px] py-0.5">
                      <div className={cn(
                        'w-0.5 h-3 rounded-full',
                        st === 'done' ? 'bg-emerald-500/40' :
                        st === 'error' ? 'bg-red-500/40' :
                        'bg-border',
                        st !== 'done' && st !== 'error' && 'opacity-50',
                      )} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Action buttons */}
          <div className="mt-4 space-y-2">
            <button
              onClick={() => triggerAction(activeStage)}
              disabled={triggerLoading || stageStatus === 'done'}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md
                         bg-primary text-primary-foreground text-xs font-medium
                         hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {triggerLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {isZh ? `运行 ${stageConfig.labelZh}` : `Run ${stageConfig.label}`}
            </button>
            <button
              onClick={() => triggerAction('chunked')}
              disabled={triggerLoading}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md
                         border border-border text-xs font-medium text-muted-foreground
                         hover:text-foreground hover:bg-secondary/50 disabled:opacity-40 transition-colors"
            >
              <Play className="h-3 w-3" />
              {isZh ? '全部运行' : 'Run All'}
            </button>
          </div>
        </div>

        {/* Stepper ↔ Execute resize handle */}
        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors relative group"
          onMouseDown={createDragHandler(setStepperWidth, 160, 300)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* ════════════════════════════════════════════════
            MIDDLE: Execute Panel
            ════════════════════════════════════════════════ */}
        <div className="flex flex-col shrink-0 border-r border-border p-4 overflow-y-auto" style={{ width: executeWidth }}>
          {/* Stage header */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', statusCfg.bg)}>
              <stageConfig.icon className={cn('h-4 w-4', statusCfg.color)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {isZh ? stageConfig.labelZh : stageConfig.label}
                </h3>
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                  statusCfg.bg, statusCfg.color,
                )}>
                  {isZh ? statusCfg.labelZh : statusCfg.label}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground mb-3">
            {isZh ? stageConfig.descriptionZh : stageConfig.description}
          </p>

          {/* Steps checklist */}
          <div className="space-y-1.5 mb-3">
            {(isZh ? stageConfig.stepsZh : stageConfig.steps).map((step, i) => {
              const stepDone = stageStatus === 'done'
              const stepError = stageStatus === 'error' && i === stageConfig.steps.length - 1
              return (
                <div key={i} className="flex items-start gap-2">
                  {stepDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : stepError ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border-[1.5px] border-muted-foreground/20 shrink-0 mt-0.5" />
                  )}
                  <span className={cn(
                    'text-[11px] leading-relaxed',
                    stepDone ? 'text-foreground' :
                    stepError ? 'text-red-400' :
                    'text-muted-foreground',
                  )}>
                    <span className="text-muted-foreground/40 mr-1">{i + 1}.</span>
                    {step}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Embedding model selector (only for embeddings stage) */}
          {activeStage === 'embeddings' && embeddingModels.length > 0 && (
            <div className="mb-3 p-2.5 rounded-md bg-card border border-border">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                {isZh ? '嵌入模型' : 'Embedding Model'}
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full text-xs bg-background border border-border rounded-md px-2 py-1.5
                           text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {embeddingModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.dimensions}d)
                  </option>
                ))}
              </select>
              {embeddingModels.find((m) => m.name === selectedModel)?.description && (
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  {embeddingModels.find((m) => m.name === selectedModel)?.description}
                </p>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border my-2" />

          {/* Progress bar (from active running task) */}
          {activeTask && (
            <div className="mb-3">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    activeTask.status === 'error' ? 'bg-red-500' :
                    activeTask.status === 'done' ? 'bg-emerald-500' :
                    'bg-amber-400',
                  )}
                  style={{ width: `${activeTask.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {activeTask.progress}%
                </span>
                {activeTask.startedAt && (
                  <span className="text-[10px] text-muted-foreground">
                    {fmtDate(activeTask.startedAt)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Task log (terminal style) */}
          <div className="flex-1 min-h-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {isZh ? '任务日志' : 'Task Log'}
              </span>
              {activeTask?.log && (
                <button onClick={() => copyText(activeTask.log!)} className="text-muted-foreground hover:text-foreground">
                  <Copy className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
            <pre
              ref={logRef}
              className="text-[10px] text-muted-foreground bg-[#0a0d14] rounded-md p-2.5
                         whitespace-pre-wrap font-mono leading-relaxed
                         max-h-36 overflow-auto border border-border/50"
            >
              {activeTask?.log || (isZh ? '等待执行...' : 'Waiting for execution...')}
            </pre>
          </div>

          {/* Error display */}
          {activeTask?.error && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-red-400 font-medium">Error</span>
                <button onClick={() => copyText(activeTask.error!)} className="text-muted-foreground hover:text-foreground">
                  <Copy className="h-2.5 w-2.5" />
                </button>
              </div>
              <pre className="text-[10px] text-red-400 bg-red-500/5 rounded-md p-2 whitespace-pre-wrap max-h-20 overflow-auto border border-red-500/20 font-mono">
                {activeTask.error}
              </pre>
            </div>
          )}

          {/* Action buttons */}
          {hasRunning && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <button
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border
                           text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Square className="h-3 w-3" />
                {isZh ? '取消' : 'Cancel'}
              </button>
            </div>
          )}
        </div>

        {/* Execute ↔ Results resize handle */}
        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors relative group"
          onMouseDown={createDragHandler(setExecuteWidth, 240, 500)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* ════════════════════════════════════════════════
            RIGHT: Output / Results Panel
            ════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                {isZh ? '执行结果' : 'Results'}
              </span>
              {stageTasks.length > 0 && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {stageTasks.length}
                </span>
              )}
            </div>
            {hasRunning && (
              <div className="flex items-center gap-1.5">
                <Radio className="h-2.5 w-2.5 text-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">Live</span>
              </div>
            )}
          </div>

          {/* Task results list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loadingTasks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : stageTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Zap className="h-6 w-6 mb-2 opacity-40" />
                <span className="text-xs">
                  {isZh ? '暂无任务记录' : 'No task records'}
                </span>
                <span className="text-[10px] text-muted-foreground/60 mt-1">
                  {isZh ? '点击左侧按钮开始执行' : 'Click a Run button to start'}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {stageTasks.map((task) => {
                  const tcfg = TASK_STATUS[task.status] ?? TASK_STATUS.queued
                  const TaskIcon = tcfg.icon
                  const isExpanded = expandedTasks.has(task.id)

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'rounded-lg border overflow-hidden transition-colors',
                        task.status === 'running' ? 'border-amber-500/30 bg-amber-500/5' :
                        task.status === 'error' ? 'border-red-500/20 bg-red-500/5' :
                        task.status === 'done' ? 'border-emerald-500/20' :
                        'border-border',
                      )}
                    >
                      {/* Task header (clickable to expand) */}
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className="w-full flex items-center justify-between p-2.5 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <TaskIcon className={cn(
                            'h-3.5 w-3.5',
                            tcfg.color,
                            task.status === 'running' && 'animate-spin',
                          )} />
                          <span className="text-[11px] font-medium text-foreground">
                            {task.taskType.toUpperCase()}
                          </span>
                          <span className={cn('text-[10px] font-medium', tcfg.color)}>
                            {isZh ? tcfg.labelZh : tcfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground tabular-nums">{task.progress}%</span>
                          <span className="text-[10px] text-muted-foreground">{fmtDate(task.startedAt)}</span>
                          {isExpanded
                            ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      </button>

                      {/* Progress bar */}
                      <div className="px-2.5 pb-1">
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              task.status === 'error' ? 'bg-red-500' :
                              task.status === 'done' ? 'bg-emerald-500' :
                              'bg-amber-400',
                            )}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-2.5 pb-2.5 space-y-2">
                          {task.log && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-muted-foreground font-medium">Log</span>
                                <button onClick={() => copyText(task.log!)} className="text-muted-foreground hover:text-foreground">
                                  <Copy className="h-2.5 w-2.5" />
                                </button>
                              </div>
                              <pre className="text-[10px] text-muted-foreground bg-[#0a0d14] rounded p-2 whitespace-pre-wrap max-h-24 overflow-auto border border-border/50 font-mono">
                                {task.log}
                              </pre>
                            </div>
                          )}
                          {task.error && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-red-400 font-medium">Error</span>
                                <button onClick={() => copyText(task.error!)} className="text-muted-foreground hover:text-foreground">
                                  <Copy className="h-2.5 w-2.5" />
                                </button>
                              </div>
                              <pre className="text-[10px] text-red-400 bg-red-500/5 rounded p-2 whitespace-pre-wrap max-h-20 overflow-auto border border-red-500/20 font-mono">
                                {task.error}
                              </pre>
                            </div>
                          )}
                          {task.finishedAt && (
                            <p className="text-[10px] text-muted-foreground">
                              {isZh ? '完成于' : 'Finished'} {fmtDate(task.finishedAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
