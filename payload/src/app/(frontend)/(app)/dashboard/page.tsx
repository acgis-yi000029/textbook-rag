'use client'

import { BarChart3, LineChart, ThumbsUp, Brain, FileText } from 'lucide-react'
import Link from 'next/link'

const modules = [
  { title: '使用统计', desc: '查询量、活跃用户、热门书籍', icon: BarChart3, href: '/dashboard/analytics', color: 'text-blue-400' },
  { title: '质量评估', desc: 'RAG 回答质量 6 维度评分', icon: LineChart, href: '/dashboard/evaluation', color: 'text-emerald-400' },
  { title: '反馈管理', desc: '用户 👍👎 汇总、差评分析', icon: ThumbsUp, href: '/dashboard/feedback', color: 'text-amber-400' },
  { title: '模型管理', desc: '查看 / 拉取 / 删除 Ollama 模型', icon: Brain, href: '/dashboard/models', color: 'text-purple-400' },
  { title: 'Prompt 管理', desc: '编辑 / 测试 Prompt 模板', icon: FileText, href: '/dashboard/prompts', color: 'text-rose-400' },
]

/**
 * Dashboard 总览页 — 模块入口卡片
 * 使用语义 Tailwind token，自动适配亮色/暗色主题
 */
export default function Page() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-foreground mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-8">系统管理与监控</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group p-5 rounded-xl border border-border bg-card hover:bg-secondary transition-all"
          >
            <m.icon className={`h-6 w-6 ${m.color} mb-3`} />
            <h3 className="text-sm font-semibold text-foreground group-hover:text-brand-400 transition-colors">
              {m.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-8 text-center">
        即将上线 — 从 Ottawa 迁移中
      </p>
    </div>
  )
}
