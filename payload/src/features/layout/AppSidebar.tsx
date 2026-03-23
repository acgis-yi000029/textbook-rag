'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Library,
  BarChart3,
  LineChart,
  ThumbsUp,
  Brain,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/features/shared/i18n'
import { cn } from '@/features/shared/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/features/shared/components/ui/tooltip'


/* ── Nav item types ── */
interface NavItem {
  titleKey: keyof ReturnType<typeof useI18n>['t']
  href?: string
  icon: React.ElementType
  action?: string
  adminOnly?: boolean
}

interface NavGroup {
  titleKey: keyof ReturnType<typeof useI18n>['t']
  items: NavItem[]
}

/* ── Navigation data ── */
/* 顺序按使用频率：问答 → 资料库 → 仪表盘 → 管理工具 */
const navGroups: NavGroup[] = [
  {
    titleKey: 'navGroupChat',
    items: [
      { titleKey: 'navNewChat', icon: Plus, href: '/chat', action: 'newChat' },
    ],
  },
  {
    titleKey: 'navGroupResources',
    items: [
      { titleKey: 'navLibrary', icon: Library, href: '/library' },
    ],
  },
  {
    titleKey: 'navGroupAdmin',
    items: [
      { titleKey: 'navAnalytics', icon: BarChart3, href: '/dashboard/analytics', adminOnly: true },
      { titleKey: 'navModels', icon: Brain, href: '/dashboard/models', adminOnly: true },
      { titleKey: 'navPrompts', icon: FileText, href: '/dashboard/prompts', adminOnly: true },
      { titleKey: 'navEvaluation', icon: LineChart, href: '/dashboard/evaluation', adminOnly: true },
      { titleKey: 'navFeedback', icon: ThumbsUp, href: '/dashboard/feedback', adminOnly: true },
    ],
  },
]

/**
 * AppSidebar — 左侧导航栏
 *
 * 使用纯 CSS 变量 + Tailwind dark: 前缀控制主题颜色
 * 不依赖 useTheme() / isDark — 防止刷新时 hydration 不匹配
 *
 * CSS 变量来自 globals.css 中的 :root / .dark 选择器
 */
export default function AppSidebar() {
  const pathname = usePathname()
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(false)

  // TODO: check user role from Payload
  const isAdmin = true

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === '/chat') return pathname === '/chat'
    return pathname.startsWith(href)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col shrink-0 transition-all duration-200',
          'bg-sidebar border-r border-sidebar-border',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-sidebar-border">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004890" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
          </svg>
          {!collapsed && (
            <span className="font-bold text-sm tracking-tight text-sidebar-foreground">
              {t.appName}
              <span className="text-[10px] font-mono ml-1 text-muted-foreground">{t.appVersion}</span>
            </span>
          )}
        </div>

        {/* Nav groups */}
        <div className="flex-1 overflow-y-auto py-3">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.adminOnly || isAdmin
            )
            if (visibleItems.length === 0) return null

            return (
              <div key={group.titleKey} className="mb-4">
                {!collapsed && (
                  <h4 className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t[group.titleKey]}
                  </h4>
                )}
                {collapsed && (
                  <div className="mx-auto my-2 h-px w-8 bg-sidebar-border" />
                )}

                <nav className="flex flex-col gap-0.5 px-2">
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    const linkContent = (
                      <Link
                        href={item.href || '/chat'}
                        className={cn(
                          'flex items-center gap-3 h-9 rounded-lg text-sm font-medium transition-colors',
                          collapsed ? 'justify-center px-0' : 'px-3',
                          active
                            ? 'bg-sidebar-accent text-sidebar-primary'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        )}
                      >
                        <Icon size={18} />
                        {!collapsed && <span>{String(t[item.titleKey])}</span>}
                      </Link>
                    )

                    if (collapsed) {
                      return (
                        <Tooltip key={item.titleKey}>
                          <TooltipTrigger asChild>
                            {linkContent}
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8}>
                            {String(t[item.titleKey])}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return <div key={item.titleKey}>{linkContent}</div>
                  })}
                </nav>
              </div>
            )
          })}
        </div>

        {/* Bottom section */}
        <div className="p-2 space-y-0.5 border-t border-sidebar-border">
          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 h-9 rounded-lg text-sm font-medium transition-colors',
              'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed ? 'justify-center px-0' : 'px-3'
            )}
          >
            <Settings size={18} />
            {!collapsed && <span>{t.settings}</span>}
          </Link>

          {/* Collapse toggle — same style as nav items */}
          <button
            className={cn(
              'flex items-center gap-3 h-9 w-full rounded-lg text-sm font-medium transition-colors',
              'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed ? 'justify-center px-0' : 'px-3'
            )}
            onClick={() => setCollapsed((prev) => !prev)}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>{t.collapse}</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
