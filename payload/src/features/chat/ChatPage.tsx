'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { AppProvider } from '@/features/shared/AppContext'
import { useAuth } from '@/features/shared/AuthProvider'
import BookSelector from './BookSelector'
import ChatPanel from './ChatPanel'
import ResizeHandle from './ResizeHandle'

const PdfViewer = dynamic(
  () => import('@/features/chat/PdfViewer'),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-slate-500 text-sm">Loading PDF viewer…</div> }
)

/**
 * ChatPage — 问答页面（聊天 + PDF + 选书）
 * 组装 PDF 双栏 + 拖拽 + Chat
 */
export default function ChatPage() {
  const { user, status } = useAuth()
  const [leftWidth, setLeftWidth] = useState(800)

  useEffect(() => {
    setLeftWidth(Math.round(window.innerWidth * 0.55))
  }, [])

  useEffect(() => {
    if (status === 'loggedOut') {
      window.location.href = '/login'
    }
  }, [status])

  if (status === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-brand-400" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <AppProvider>
      <div className="flex h-full flex-col">
        {/* Compact toolbar — BookSelector only */}
        <header className="flex items-center gap-3 border-b border-border bg-secondary px-4 py-2 shrink-0">
          <div className="w-80">
            <BookSelector />
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          <div className="h-full overflow-hidden" style={{ width: leftWidth }}>
            <PdfViewer />
          </div>
          <ResizeHandle width={leftWidth} onResize={setLeftWidth} min={320} max={1600} />
          <div className="flex-1 h-full overflow-hidden min-w-[320px]">
            <ChatPanel />
          </div>
        </div>
      </div>
    </AppProvider>
  )
}

