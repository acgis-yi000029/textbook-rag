/**
 * features/shared/components/DashboardShell.tsx
 * 通用 Dashboard 布局壳 — sidebar 过滤 + 主内容区（卡片/表格双视图）
 *
 * 所有 Dashboard 子页面（Models, Prompts, Queries 等）都可以复用此布局。
 * Reusable layout shell for all dashboard sub-pages.
 *
 * 用法 / Usage:
 *   <DashboardShell
 *     title="模型管理"
 *     icon={<Brain />}
 *     sidebarItems={[...]}
 *     activeFilter="all"
 *     onFilterChange={setFilter}
 *     toolbar={<button>...</button>}
 *     footer="共 5 个模型"
 *     viewMode="cards"
 *     onViewModeChange={setViewMode}
 *   >
 *     {children}
 *   </DashboardShell>
 */
'use client'

import { useState, type ReactNode } from 'react'
import { LayoutGrid, List, Loader2, AlertCircle, RefreshCw, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/features/shared/utils'

// ── Types ────────────────────────────────────────────────────────────────────

export type ViewMode = 'cards' | 'table'

export interface SidebarItem {
  /** 唯一标识 / Unique key */
  key: string
  /** 显示标签 / Display label */
  label: string
  /** 计数 / Count badge */
  count?: number
  /** 缩进展示（子分类）/ Indent (sub-category) */
  indent?: boolean
  /** 高亮展示（如"新发现"）/ Highlight style */
  highlight?: boolean
  /** 自定义图标 / Custom icon (replaces folder icon) */
  icon?: ReactNode
  /** 分隔线显示在此项之前 / Show divider before this item */
  dividerBefore?: boolean
}

export interface DashboardShellProps {
  /** 页面标题 / Page title */
  title: string
  /** 标题旁的图标 / Icon next to title */
  icon: ReactNode
  /** 侧边栏条目 / Sidebar items */
  sidebarItems: SidebarItem[]
  /** 当前选中的过滤器 key / Active filter key */
  activeFilter: string
  /** 过滤器变更回调 / Filter change callback */
  onFilterChange: (key: string) => void

  /** 侧边栏底部额外内容 / Extra content at sidebar footer */
  sidebarFooter?: ReactNode

  /** 工具栏右侧按钮区 / Toolbar right-side actions */
  toolbar?: ReactNode
  /** 主内容区副标题 / Subtitle under main title */
  subtitle?: string

  /** 是否支持视图切换 / Enable view mode toggle */
  showViewToggle?: boolean
  /** 当前视图模式 / Current view mode */
  viewMode?: ViewMode
  /** 视图模式切换回调 / View mode change callback */
  onViewModeChange?: (mode: ViewMode) => void

  /** 加载状态 / Loading state */
  loading?: boolean
  /** 加载文案 / Loading text */
  loadingText?: string
  /** 错误状态 / Error state */
  error?: string | null
  /** 错误重试回调 / Error retry callback */
  onRetry?: () => void

  /** 侧边栏宽度 class / Sidebar width class */
  sidebarWidth?: string

  /** 主内容 / Main content */
  children: ReactNode
}

// ── Component ────────────────────────────────────────────────────────────────

export function DashboardShell({
  title,
  icon,
  sidebarItems,
  activeFilter,
  onFilterChange,
  sidebarFooter,
  toolbar,
  subtitle,
  showViewToggle = false,
  viewMode: controlledViewMode,
  onViewModeChange,
  loading = false,
  loadingText = '加载中...',
  error = null,
  onRetry,
  sidebarWidth = 'w-52',
  children,
}: DashboardShellProps) {
  // 内部 viewMode 状态（如果未受控）/ Internal viewMode state (if uncontrolled)
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('cards')
  const viewMode = controlledViewMode ?? internalViewMode
  const handleViewModeChange = (mode: ViewMode) => {
    onViewModeChange?.(mode)
    setInternalViewMode(mode)
  }

  // ── Full-page loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{loadingText}</p>
        </div>
      </div>
    )
  }

  // ── Full-page error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <AlertCircle className="h-8 w-8 text-destructive mb-3" />
        <p className="text-sm text-destructive mb-3">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4 inline mr-2" />
            重试
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* ════════ Sidebar ════════ */}
      <aside className={cn(sidebarWidth, 'shrink-0 border-r border-border bg-card/50 flex flex-col')}>
        {/* Sidebar header */}
        <div className="px-3 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-xs font-semibold text-foreground">{title}</span>
          </div>
        </div>

        {/* Sidebar items */}
        <nav className="flex-1 overflow-y-auto py-2 px-1.5">
          {sidebarItems.map((item) => {
            const isActive = activeFilter === item.key
            return (
              <div key={item.key}>
                {item.dividerBefore && (
                  <div className="my-2 mx-2 border-t border-border" />
                )}
                <button
                  onClick={() => onFilterChange(item.key)}
                  className={cn(
                    'flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-left transition-colors mb-0.5',
                    item.indent && 'ml-3',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    item.highlight && !isActive && 'text-amber-400',
                  )}
                >
                  {item.icon ?? (
                    isActive
                      ? <FolderOpen className="h-4 w-4 shrink-0" />
                      : <Folder className="h-4 w-4 shrink-0" />
                  )}
                  <span className="text-xs flex-1 truncate">{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                        isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                        item.highlight && !isActive && 'bg-amber-500/20 text-amber-400',
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        {sidebarFooter && (
          <div className="px-3 py-2.5 border-t border-border">
            {sidebarFooter}
          </div>
        )}
      </aside>

      {/* ════════ Main content ════════ */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {sidebarItems.find((i) => i.key === activeFilter)?.label ?? title}
            </h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            {showViewToggle && (
              <div className="flex items-center rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => handleViewModeChange('cards')}
                  className={cn(
                    'p-1.5 transition-colors',
                    viewMode === 'cards'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  )}
                  title="卡片视图"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleViewModeChange('table')}
                  className={cn(
                    'p-1.5 transition-colors',
                    viewMode === 'table'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  )}
                  title="表格视图"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {toolbar}
          </div>
        </div>

        {/* Content area */}
        {children}
      </div>
    </div>
  )
}
