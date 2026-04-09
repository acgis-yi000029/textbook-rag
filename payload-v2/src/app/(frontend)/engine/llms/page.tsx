'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import {
  Brain, Loader2, AlertCircle, RefreshCw, CheckCircle2, XCircle,
  Cpu, Globe, Zap, DollarSign, Activity,
  Search, Wifi, WifiOff, HardDrive, Clock, Trash2, Plus, Star,
  MessageSquare, Database,
} from 'lucide-react'
import { cn } from '@/features/shared/utils'
import { SidebarLayout, type ViewMode, type SidebarItem } from '@/features/shared/components/SidebarLayout'
import { useModels } from '@/features/engine/llms/useModels'
import type { RuntimeModel, DiscoveredLocalModel, ModelProvider } from '@/features/engine/llms/types'
import { PROVIDER_CONFIGS } from '@/features/engine/llms/types'
import { useQueryState } from '@/features/shared/hooks/useQueryState'
import { useI18n } from '@/features/shared/i18n'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Detect if a model name refers to an embedding model */
function isEmbeddingModel(name: string): boolean {
  const lower = name.toLowerCase()
  return (
    lower.includes('embed') ||
    lower.includes('bge-') ||
    lower.includes('e5-') ||
    lower.includes('gte-') ||
    lower.includes('instructor') ||
    lower.includes('all-minilm') ||
    lower.includes('nomic-embed') ||
    lower.includes('mxbai-embed') ||
    lower.includes('snowflake-arctic-embed') ||
    lower.includes('text-embedding')
  )
}

type FilterKey = 'all' | 'available' | 'discovered' | ModelProvider

export default function Page() {
  return (
    <Suspense>
      <LlmsPageInner />
    </Suspense>
  )
}

function LlmsPageInner() {
  const { locale } = useI18n()
  const isFr = locale === 'fr'

  const {
    models,
    loading,
    checking,
    error,
    discovered,
    discovering,
    refresh,
    runDiscovery,
    deleteModel,
    registerDiscoveredModel,
    removeOllamaModel,
    setDefaultModel,
  } = useModels({ autoLoad: true, autoCheck: true, pollInterval: 0 })

  const [filter, setFilter] = useQueryState('filter', 'all') as [FilterKey, (v: string) => void]
  const [viewMode, setViewMode] = useQueryState('view', 'cards') as [ViewMode, (v: string) => void]

  // ── Auto-discover on first load ────────────────────────────────────────────
  const [hasDiscovered, setHasDiscovered] = useState(false)
  useEffect(() => {
    if (!loading && !hasDiscovered) {
      runDiscovery().then(() => setHasDiscovered(true))
    }
  }, [loading, hasDiscovered, runDiscovery])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const availableModels = useMemo(
    () => models.filter((m) => m.availability.status === 'available'),
    [models],
  )
  const unavailableCount = useMemo(
    () => models.filter((m) => m.availability.status === 'unavailable').length,
    [models],
  )

  const providerCounts = useMemo(() => {
    const c: Record<string, number> = {
      all: models.length,
      available: availableModels.length,
      discovered: discovered.length,
    }
    for (const m of models) {
      c[m.provider] = (c[m.provider] || 0) + 1
    }
    return c
  }, [models, availableModels, discovered])

  const visibleProviders = useMemo(() => {
    return (Object.keys(PROVIDER_CONFIGS) as ModelProvider[]).filter(
      (k) => (providerCounts[k] || 0) > 0,
    )
  }, [providerCounts])

  // ── Split models into LLM vs Embedding ────────────────────────────────────
  const displayModels = useMemo(() => {
    let base: RuntimeModel[]
    if (filter === 'available') {
      base = availableModels
    } else if (filter === 'all' || filter === 'discovered') {
      base = models
    } else {
      base = models.filter((m) => m.provider === filter)
    }
    return [...base].sort((a, b) => {
      const aAvail = a.availability.status === 'available' ? 0 : 1
      const bAvail = b.availability.status === 'available' ? 0 : 1
      if (aAvail !== bAvail) return aAvail - bAvail
      return a.sortOrder - b.sortOrder
    })
  }, [models, availableModels, filter])

  const llmModels = useMemo(
    () => displayModels.filter((m) => !isEmbeddingModel(m.name)),
    [displayModels],
  )
  const embeddingModels = useMemo(
    () => displayModels.filter((m) => isEmbeddingModel(m.name)),
    [displayModels],
  )

  // ── Sidebar items ─────────────────────────────────────────────────────────
  const sidebarItems = useMemo<SidebarItem[]>(() => {
    const items: SidebarItem[] = [
      {
        key: 'available',
        label: isFr ? 'Disponibles' : 'Available',
        count: providerCounts.available || 0,
        icon: <Wifi className="h-4 w-4 shrink-0 text-emerald-500" />,
      },
      {
        key: 'all',
        label: isFr ? 'Tous les modèles' : 'All Models',
        count: providerCounts.all || 0,
      },
      ...visibleProviders.map((key) => ({
        key,
        label: PROVIDER_CONFIGS[key].label,
        count: providerCounts[key] || 0,
        indent: true,
      })),
    ]
    if (discovered.length > 0) {
      items.push({
        key: 'discovered',
        label: isFr ? 'Découverts' : 'Discovered',
        count: discovered.length,
        highlight: true,
        dividerBefore: true,
        icon: <Search className="h-4 w-4 shrink-0" />,
      })
    }
    return items
  }, [providerCounts, visibleProviders, discovered, isFr])

  // ── Subtitle ──────────────────────────────────────────────────────────────
  const subtitle = useMemo(() => {
    const parts: string[] = []
    if (filter === 'discovered') {
      parts.push(isFr
        ? `${discovered.length} modèle(s) local non enregistré(s)`
        : `${discovered.length} unregistered local model(s)`)
    } else {
      parts.push(isFr
        ? `${displayModels.length} modèle(s)`
        : `${displayModels.length} model(s)`)
    }
    if (checking || discovering) {
      parts.push(discovering
        ? (isFr ? 'Détection en cours...' : 'Discovering...')
        : (isFr ? 'Vérification...' : 'Checking...'))
    }
    return parts.join(' · ')
  }, [filter, discovered, displayModels, checking, discovering, isFr])

  // ── Section renderer ──────────────────────────────────────────────────────
  function renderModelSection(
    sectionModels: RuntimeModel[],
    title: string,
    icon: React.ReactNode,
    emptyText: string,
  ) {
    if (sectionModels.length === 0) return null
    return (
      <div className="mb-8 last:mb-0">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
            {sectionModels.length}
          </span>
        </div>
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {sectionModels.map((m) => (
              <RegisteredModelCard key={m.id} model={m} onDelete={deleteModel} onSetDefault={setDefaultModel} isFr={isFr} />
            ))}
          </div>
        ) : (
          <ModelTable models={sectionModels} onDelete={deleteModel} onSetDefault={setDefaultModel} isFr={isFr} />
        )}
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SidebarLayout
      title={isFr ? 'Modèles' : 'Models'}
      icon={<Brain className="h-4 w-4 text-purple-400" />}
      sidebarItems={sidebarItems}
      activeFilter={filter}
      onFilterChange={(k) => setFilter(k as FilterKey)}
      sidebarFooter={
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px]">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span className="text-emerald-400">{availableModels.length} {isFr ? 'disponible(s)' : 'available'}</span>
            <span className="text-muted-foreground mx-1">·</span>
            <XCircle className="h-3 w-3 text-red-400" />
            <span className="text-red-400">{unavailableCount} {isFr ? 'indisponible(s)' : 'unavailable'}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {isFr ? `${models.length} modèle(s) enregistré(s)` : `${models.length} registered model(s)`}
          </p>
        </div>
      }
      subtitle={subtitle}
      showViewToggle={filter !== 'discovered'}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      toolbar={
        <div className="flex items-center gap-2">
          <button
            onClick={() => void runDiscovery()}
            disabled={discovering}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              'border border-primary/30 text-primary hover:bg-primary/10',
              discovering && 'opacity-50 cursor-not-allowed',
            )}
          >
            <Search className="h-3.5 w-3.5" />
            {isFr ? 'Détecter les modèles' : 'Discover Local'}
          </button>
          <button
            onClick={() => void refresh()}
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', checking && 'animate-spin')} />
          </button>
        </div>
      }
      loading={loading && models.length === 0}
      loadingText={isFr ? 'Détection des modèles...' : 'Detecting models...'}
      error={error && models.length === 0 ? error : null}
      onRetry={() => void refresh()}
    >
      {/* ── Discovered models view ── */}
      {filter === 'discovered' ? (
        <DiscoveredModelGrid models={discovered} onRegister={registerDiscoveredModel} onRemove={removeOllamaModel} isFr={isFr} />
      ) : (
        <>
          {/* ── LLM (Generation) models ── */}
          {renderModelSection(
            llmModels,
            isFr ? 'Modèles de génération (LLM)' : 'Generation Models (LLM)',
            <MessageSquare className="h-4 w-4 text-blue-400" />,
            isFr ? 'Aucun modèle LLM' : 'No LLM models',
          )}

          {/* ── Embedding models ── */}
          {renderModelSection(
            embeddingModels,
            isFr ? 'Modèles d\'embeddings' : 'Embedding Models',
            <Database className="h-4 w-4 text-teal-400" />,
            isFr ? 'Aucun modèle d\'embedding' : 'No embedding models',
          )}

          {displayModels.length === 0 && (
            <div className="flex flex-col items-center py-20">
              <Brain className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {filter === 'available'
                  ? (isFr ? 'Aucun modèle disponible' : 'No available models')
                  : (isFr ? 'Aucun modèle dans cette catégorie' : 'No models in this category')}
              </p>
            </div>
          )}

          {/* Discovered inline when viewing "all" */}
          {filter === 'all' && discovered.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  {isFr ? 'Modèles locaux découverts (non enregistrés)' : 'Discovered Local Models (Unregistered)'}
                </h2>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary">
                  {discovered.length}
                </span>
              </div>
              <DiscoveredModelGrid models={discovered} onRegister={registerDiscoveredModel} onRemove={removeOllamaModel} isFr={isFr} />
            </div>
          )}
        </>
      )}
    </SidebarLayout>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════════

/** Registered model card */
function RegisteredModelCard({ model: m, onDelete, onSetDefault, isFr }: { model: RuntimeModel; onDelete: (id: number) => Promise<void>; onSetDefault: (id: number) => Promise<void>; isFr: boolean }) {
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [settingDefault, setSettingDefault] = useState(false)
  const prov = PROVIDER_CONFIGS[m.provider] || PROVIDER_CONFIGS.other
  const avail = m.availability
  const isAvailable = avail.status === 'available'
  const isChecking = avail.status === 'checking'
  const isUnavailable = avail.status === 'unavailable'

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    try { await onDelete(m.id) } finally { setDeleting(false); setConfirmDelete(false) }
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        !m.isEnabled && 'opacity-50',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground truncate">{m.displayName || m.name}</h3>
            {m.isDefault && (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {isFr ? 'Défaut' : 'Default'}
              </span>
            )}
          </div>
          <code className="text-xs text-muted-foreground font-mono">{m.name}</code>
        </div>
        <div className={cn('shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium', prov.bg, prov.color)}>
          {prov.label}
        </div>
      </div>

      {m.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{m.description}</p>}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
        {m.parameterSize && (
          <div className="flex items-center gap-1.5 text-xs">
            <Cpu className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-muted-foreground">{isFr ? 'Paramètres' : 'Params'}</span>
            <span className="text-foreground font-medium ml-auto">{m.parameterSize}</span>
          </div>
        )}
        {m.contextWindow && (
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-muted-foreground">{isFr ? 'Contexte' : 'Context'}</span>
            <span className="text-foreground font-medium ml-auto">{(m.contextWindow / 1000).toFixed(0)}K</span>
          </div>
        )}
        {m.languages && (
          <div className="flex items-center gap-1.5 text-xs">
            <Globe className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-muted-foreground">{isFr ? 'Langues' : 'Languages'}</span>
            <span className="text-foreground font-medium ml-auto truncate max-w-[80px]">{m.languages}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs">
          <DollarSign className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-muted-foreground">{isFr ? 'Coût' : 'Cost'}</span>
          <span className={cn('font-medium ml-auto', m.isFree ? 'text-emerald-400' : 'text-amber-400')}>
            {m.isFree ? (isFr ? 'Gratuit' : 'Free') : `$${m.costPer1kInput}/1K`}
          </span>
        </div>
      </div>

      {m.useCases && Array.isArray(m.useCases) && m.useCases.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {m.useCases.map((uc, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-muted-foreground">{uc}</span>
          ))}
        </div>
      )}

      {/* Status row */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs">
          {isChecking ? (
            <><Loader2 className="h-3 w-3 animate-spin text-primary" /><span className="text-primary">{isFr ? 'Vérification...' : 'Checking...'}</span></>
          ) : isAvailable ? (
            <>
              <Wifi className="h-3 w-3 text-emerald-500" /><span className="text-emerald-400">{isFr ? 'Disponible' : 'Available'}</span>
              {avail.latencyMs != null && <span className="text-muted-foreground ml-1">({avail.latencyMs}ms)</span>}
            </>
          ) : isUnavailable ? (
            <><WifiOff className="h-3 w-3 text-red-400" /><span className="text-red-400">{isFr ? 'Indisponible' : 'Unavailable'}</span></>
          ) : (
            <><AlertCircle className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">{isFr ? 'Inconnu' : 'Unknown'}</span></>
          )}
        </div>
        <div className="flex items-center gap-2">
          {m.quantization && <span className="text-[10px] text-muted-foreground font-mono">{m.quantization}</span>}
          {!m.isEnabled && <span className="text-[10px] text-red-400">{isFr ? 'Désactivé' : 'Disabled'}</span>}
          {isAvailable && !m.isDefault && (
            <button
              onClick={async () => {
                setSettingDefault(true)
                try { await onSetDefault(m.id) } finally { setSettingDefault(false) }
              }}
              disabled={settingDefault}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                'text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10',
                settingDefault && 'opacity-50 cursor-not-allowed',
              )}
              title={isFr ? 'Définir par défaut' : 'Set as default'}
            >
              {settingDefault ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3" />}
              {isFr ? 'Défaut' : 'Default'}
            </button>
          )}
          {isUnavailable && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                confirmDelete
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-muted-foreground hover:text-red-400 hover:bg-red-500/10',
                deleting && 'opacity-50 cursor-not-allowed',
              )}
              title={confirmDelete ? (isFr ? 'Cliquer pour confirmer' : 'Click to confirm') : (isFr ? 'Supprimer' : 'Delete')}
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              {confirmDelete ? (isFr ? 'Sûr ?' : 'Sure?') : (isFr ? 'Supprimer' : 'Delete')}
            </button>
          )}
        </div>
      </div>

      {avail.error && isUnavailable && (
        <div className="mt-2 px-2.5 py-1.5 rounded-md bg-red-500/5 border border-red-500/10">
          <p className="text-[10px] text-red-400 leading-relaxed">{avail.error}</p>
        </div>
      )}
    </div>
  )
}

/** Model table view */
function ModelTable({ models, onDelete, onSetDefault, isFr }: { models: RuntimeModel[]; onDelete: (id: number) => Promise<void>; onSetDefault: (id: number) => Promise<void>; isFr: boolean }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-card/80 border-b border-border">
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">{isFr ? 'Modèle' : 'Model'}</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Provider</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">{isFr ? 'Paramètres' : 'Params'}</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">{isFr ? 'Contexte' : 'Context'}</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">{isFr ? 'Coût' : 'Cost'}</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">{isFr ? 'Statut' : 'Status'}</th>
            <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">{isFr ? 'Actions' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <ModelTableRow key={m.id} model={m} onDelete={onDelete} onSetDefault={onSetDefault} isFr={isFr} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ModelTableRow({ model: m, onDelete, onSetDefault, isFr }: { model: RuntimeModel; onDelete: (id: number) => Promise<void>; onSetDefault: (id: number) => Promise<void>; isFr: boolean }) {
  const [deleting, setDeleting] = useState(false)
  const [settingDefault, setSettingDefault] = useState(false)
  const prov = PROVIDER_CONFIGS[m.provider] || PROVIDER_CONFIGS.other
  const avail = m.availability
  const isAvailable = avail.status === 'available'
  const isUnavailable = avail.status === 'unavailable'

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(m.id) } finally { setDeleting(false) }
  }

  return (
    <tr className={cn('border-b border-border/50 hover:bg-card/50 transition-colors', !m.isEnabled && 'opacity-50')}>
      <td className="px-4 py-3">
        <div>
          <span className="text-sm font-medium text-foreground">{m.displayName || m.name}</span>
          {m.isDefault && <span className="ml-1.5 px-1 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-400">{isFr ? 'Défaut' : 'Default'}</span>}
        </div>
        <code className="text-[11px] text-muted-foreground font-mono">{m.name}</code>
      </td>
      <td className="px-4 py-3">
        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', prov.bg, prov.color)}>
          {prov.label}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-foreground">{m.parameterSize || '—'}</td>
      <td className="px-4 py-3 text-xs text-foreground">
        {m.contextWindow ? `${(m.contextWindow / 1000).toFixed(0)}K` : '—'}
      </td>
      <td className="px-4 py-3">
        <span className={cn('text-xs font-medium', m.isFree ? 'text-emerald-400' : 'text-amber-400')}>
          {m.isFree ? (isFr ? 'Gratuit' : 'Free') : `$${m.costPer1kInput}/1K`}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {isAvailable ? (
            <><Wifi className="h-3 w-3 text-emerald-500" /><span className="text-xs text-emerald-400">{isFr ? 'Disponible' : 'Available'}</span></>
          ) : isUnavailable ? (
            <><WifiOff className="h-3 w-3 text-red-400" /><span className="text-xs text-red-400">{isFr ? 'Indisponible' : 'Unavailable'}</span></>
          ) : (
            <><AlertCircle className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">{isFr ? 'Inconnu' : 'Unknown'}</span></>
          )}
        </div>
      </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {m.availability.status === 'available' && !m.isDefault && (
              <button
                onClick={async () => {
                  setSettingDefault(true)
                  try { await onSetDefault(m.id) } finally { setSettingDefault(false) }
                }}
                disabled={settingDefault}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                title={isFr ? 'Définir par défaut' : 'Set as default'}
              >
                {settingDefault ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3" />}
                {isFr ? 'Défaut' : 'Default'}
              </button>
            )}
            {isUnavailable && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                title={isFr ? 'Supprimer' : 'Delete'}
              >
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                {isFr ? 'Supprimer' : 'Delete'}
              </button>
            )}
          </div>
        </td>
    </tr>
  )
}

/** Discovered local models */
function DiscoveredModelGrid({
  models,
  onRegister,
  onRemove,
  isFr,
}: {
  models: DiscoveredLocalModel[]
  onRegister: (name: string) => Promise<any>
  onRemove: (name: string) => Promise<void>
  isFr: boolean
}) {
  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-3" />
        <p className="text-sm text-muted-foreground">
          {isFr ? 'Tous les modèles locaux sont enregistrés ✓' : 'All local models are registered ✓'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {models.map((m) => (
        <DiscoveredModelCard key={m.name} model={m} onRegister={onRegister} onRemove={onRemove} isFr={isFr} />
      ))}
    </div>
  )
}

/** Discovered model card with register/remove actions */
function DiscoveredModelCard({
  model: m,
  onRegister,
  onRemove,
  isFr,
}: {
  model: DiscoveredLocalModel
  onRegister: (name: string) => Promise<any>
  onRemove: (name: string) => Promise<void>
  isFr: boolean
}) {
  const [registering, setRegistering] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const handleRegister = async () => {
    setRegistering(true)
    try {
      await onRegister(m.name)
    } finally {
      setRegistering(false)
    }
  }

  const handleRemove = async () => {
    if (!confirmRemove) {
      setConfirmRemove(true)
      setTimeout(() => setConfirmRemove(false), 3000)
      return
    }
    setRemoving(true)
    try {
      await onRemove(m.name)
    } finally {
      setRemoving(false)
      setConfirmRemove(false)
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-card/50 p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground truncate">{m.name}</h3>
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
              {isFr ? 'Découvert' : 'Discovered'}
            </span>
          </div>
          <code className="text-xs text-muted-foreground font-mono">{m.name}</code>
        </div>
        <div className="shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400">Ollama</div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
        {m.parameterSize && (
          <div className="flex items-center gap-1.5 text-xs">
            <Cpu className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-muted-foreground">{isFr ? 'Paramètres' : 'Params'}</span>
            <span className="text-foreground font-medium ml-auto">{m.parameterSize}</span>
          </div>
        )}
        {m.size && (
          <div className="flex items-center gap-1.5 text-xs">
            <HardDrive className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-muted-foreground">{isFr ? 'Taille' : 'Size'}</span>
            <span className="text-foreground font-medium ml-auto">{m.size}</span>
          </div>
        )}
        {m.quantization && (
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-muted-foreground">{isFr ? 'Quantification' : 'Quantization'}</span>
            <span className="text-foreground font-medium ml-auto font-mono">{m.quantization}</span>
          </div>
        )}
        {m.family && (
          <div className="flex items-center gap-1.5 text-xs">
            <Globe className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-muted-foreground">{isFr ? 'Famille' : 'Family'}</span>
            <span className="text-foreground font-medium ml-auto">{m.family}</span>
          </div>
        )}
        {m.modifiedAt && (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-muted-foreground">{isFr ? 'Modifié' : 'Modified'}</span>
            <span className="text-foreground font-medium ml-auto truncate max-w-[100px]">
              {new Date(m.modifiedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs">
          <Wifi className="h-3 w-3 text-emerald-500" /><span className="text-emerald-400">{isFr ? 'Disponible localement' : 'Locally available'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Register button */}
          <button
            onClick={handleRegister}
            disabled={registering}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors',
              'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20',
              registering && 'opacity-50 cursor-not-allowed',
            )}
            title={isFr ? 'Enregistrer dans le CMS' : 'Register to CMS'}
          >
            {registering ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            {isFr ? 'Enregistrer' : 'Register'}
          </button>
          {/* Remove button */}
          <button
            onClick={handleRemove}
            disabled={removing}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors',
              confirmRemove
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-muted-foreground hover:text-red-400 hover:bg-red-500/10',
              removing && 'opacity-50 cursor-not-allowed',
            )}
            title={confirmRemove ? (isFr ? 'Cliquer pour confirmer' : 'Click to confirm') : (isFr ? 'Retirer d\'Ollama' : 'Remove from Ollama')}
          >
            {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            {confirmRemove ? (isFr ? 'Sûr ?' : 'Sure?') : (isFr ? 'Retirer' : 'Remove')}
          </button>
        </div>
      </div>
    </div>
  )
}
