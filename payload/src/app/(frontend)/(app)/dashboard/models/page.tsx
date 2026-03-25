'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Brain, Loader2, AlertCircle, RefreshCw, CheckCircle2,
  Cpu, Globe, Zap, DollarSign, Folder, FolderOpen,
} from 'lucide-react'
import { cn } from '@/features/shared/utils'

interface LlmModel {
  id: number
  name: string
  displayName?: string
  provider: string
  description?: string
  useCases?: string[]
  languages?: string
  parameterSize?: string
  contextWindow?: number
  maxOutputTokens?: number
  minRamGb?: number
  quantization?: string
  isFree: boolean
  costPer1kInput?: number
  costPer1kOutput?: number
  isDefault: boolean
  isEnabled: boolean
  sortOrder: number
}

const PROVIDER_CONFIG: Record<string, { label: string; labelZh: string; color: string; bg: string; emoji: string }> = {
  ollama:       { label: 'Ollama',       labelZh: 'Ollama (本地)', color: 'text-emerald-400', bg: 'bg-emerald-500/10', emoji: '🦙' },
  azure_openai: { label: 'Azure OpenAI', labelZh: 'Azure OpenAI', color: 'text-blue-400',    bg: 'bg-blue-500/10',    emoji: '☁️' },
  openai:       { label: 'OpenAI',       labelZh: 'OpenAI',       color: 'text-purple-400',  bg: 'bg-purple-500/10',  emoji: '🤖' },
  other:        { label: 'Other',        labelZh: '其他',          color: 'text-gray-400',    bg: 'bg-gray-500/10',    emoji: '⚙️' },
}

type FilterKey = 'all' | string

export default function Page() {
  const [models, setModels] = useState<LlmModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')

  const fetchModels = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/llm-models?limit=100&sort=sortOrder')
      const data = await res.json()
      setModels(data.docs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchModels() }, [])

  /** Count by provider */
  const providerCounts = useMemo(() => {
    const c: Record<string, number> = { all: models.length }
    for (const m of models) {
      c[m.provider] = (c[m.provider] || 0) + 1
    }
    return c
  }, [models])

  /** Visible providers (only show those that have models) */
  const visibleProviders = useMemo(() => {
    return Object.keys(PROVIDER_CONFIG).filter((k) => (providerCounts[k] || 0) > 0)
  }, [providerCounts])

  /** Filtered models */
  const displayModels = useMemo(() => {
    if (filter === 'all') return models
    return models.filter((m) => m.provider === filter)
  }, [models, filter])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <AlertCircle className="h-8 w-8 text-destructive mb-3" />
        <p className="text-sm text-destructive mb-3">{error}</p>
        <button onClick={fetchModels} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          <RefreshCw className="h-4 w-4 inline mr-2" />重试
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* ════════ Sub-sidebar: Provider filter ════════ */}
      <aside className="w-48 shrink-0 border-r border-border bg-card/50 flex flex-col">
        <div className="px-3 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-semibold text-foreground">模型管理</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-1.5">
          {/* All */}
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-left transition-colors mb-0.5',
              filter === 'all'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {filter === 'all' ? <FolderOpen className="h-4 w-4 shrink-0" /> : <Folder className="h-4 w-4 shrink-0" />}
            <span className="text-xs flex-1">全部模型</span>
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
              filter === 'all' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
            )}>
              {providerCounts.all || 0}
            </span>
          </button>

          {/* Per provider */}
          {visibleProviders.map((key) => {
            const prov = PROVIDER_CONFIG[key]
            const isActive = filter === key
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  'flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-left transition-colors mb-0.5 ml-3',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                {isActive ? <FolderOpen className="h-4 w-4 shrink-0" /> : <Folder className="h-4 w-4 shrink-0" />}
                <span className="text-xs flex-1 truncate">{prov.labelZh}</span>
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                )}>
                  {providerCounts[key] || 0}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-2.5 border-t border-border">
          <p className="text-[10px] text-muted-foreground">共 {models.length} 个模型</p>
        </div>
      </aside>

      {/* ════════ Main content ════════ */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {filter === 'all' ? '全部模型' : PROVIDER_CONFIG[filter]?.labelZh || filter}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {displayModels.length} 个模型{filter !== 'all' ? ` · ${PROVIDER_CONFIG[filter]?.label}` : ''}
            </p>
          </div>
          <button onClick={fetchModels} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Model grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayModels.map((m) => {
            const prov = PROVIDER_CONFIG[m.provider] || PROVIDER_CONFIG.other
            return (
              <div
                key={m.id}
                className={cn(
                  'rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
                  !m.isEnabled && 'opacity-50',
                )}
              >
                {/* Name + provider */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {m.displayName || m.name}
                      </h3>
                      {m.isDefault && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          默认
                        </span>
                      )}
                    </div>
                    <code className="text-xs text-muted-foreground font-mono">{m.name}</code>
                  </div>
                  <div className={cn('shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium', prov.bg, prov.color)}>
                    {prov.label}
                  </div>
                </div>

                {/* Description */}
                {m.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{m.description}</p>
                )}

                {/* Specs */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                  {m.parameterSize && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Cpu className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">参数</span>
                      <span className="text-foreground font-medium ml-auto">{m.parameterSize}</span>
                    </div>
                  )}
                  {m.contextWindow && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Zap className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">上下文</span>
                      <span className="text-foreground font-medium ml-auto">{(m.contextWindow / 1000).toFixed(0)}K</span>
                    </div>
                  )}
                  {m.languages && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">语言</span>
                      <span className="text-foreground font-medium ml-auto truncate max-w-[80px]">{m.languages}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs">
                    <DollarSign className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">费用</span>
                    <span className={cn('font-medium ml-auto', m.isFree ? 'text-emerald-400' : 'text-amber-400')}>
                      {m.isFree ? '免费' : `$${m.costPer1kInput}/1K`}
                    </span>
                  </div>
                </div>

                {/* Use cases */}
                {m.useCases && Array.isArray(m.useCases) && m.useCases.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {m.useCases.map((uc, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-muted-foreground">
                        {uc}
                      </span>
                    ))}
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {m.isEnabled ? (
                      <><CheckCircle2 className="h-3 w-3 text-emerald-500" /><span className="text-emerald-400">启用</span></>
                    ) : (
                      <><AlertCircle className="h-3 w-3" /><span>禁用</span></>
                    )}
                  </div>
                  {m.quantization && (
                    <span className="text-[10px] text-muted-foreground font-mono">{m.quantization}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {displayModels.length === 0 && (
          <div className="flex flex-col items-center py-20">
            <Brain className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === 'all' ? '暂无模型，请先在 Settings 执行 Seed' : '此分类暂无模型'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
