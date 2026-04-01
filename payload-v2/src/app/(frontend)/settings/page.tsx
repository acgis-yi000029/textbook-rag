'use client'

/**
 * Settings page — user preferences and system configuration.
 * Data management (seed, sync) has been moved to /seed.
 */

import { Settings } from 'lucide-react'

export default function Page() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">设置</h1>
          <p className="text-sm text-muted-foreground">用户偏好 · 系统配置</p>
        </div>
      </div>

      {/* Placeholder */}
      <section className="mt-10 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          更多设置（用户偏好、API 密钥管理）即将上线
        </p>
      </section>
    </div>
  )
}
