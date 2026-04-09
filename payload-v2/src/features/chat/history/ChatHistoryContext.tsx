'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useChatHistory } from './useChatHistory'
import { useAuth } from '@/features/shared/AuthProvider'

type ChatHistoryAPI = ReturnType<typeof useChatHistory>

interface ContextValue extends ChatHistoryAPI {
  activeSessionId: string | null
  setActiveSessionId: (id: string | null) => void
}

const ChatHistoryContext = createContext<ContextValue | null>(null)

const SESSION_ID_KEY = 'textbook-rag-active-session'

export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const api = useChatHistory(user?.id ?? null)

  // Restore activeSessionId from sessionStorage on mount
  const [activeSessionId, setActiveSessionIdRaw] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SESSION_ID_KEY) || null
    } catch {
      return null
    }
  })

  // Wrapper that also persists to sessionStorage
  const setActiveSessionId = useCallback((id: string | null) => {
    setActiveSessionIdRaw(id)
    try {
      if (id) {
        sessionStorage.setItem(SESSION_ID_KEY, id)
      } else {
        sessionStorage.removeItem(SESSION_ID_KEY)
      }
    } catch { /* quota exceeded — ignore */ }
  }, [])

  return (
    <ChatHistoryContext.Provider value={{ ...api, activeSessionId, setActiveSessionId }}>
      {children}
    </ChatHistoryContext.Provider>
  )
}

export function useChatHistoryContext() {
  const ctx = useContext(ChatHistoryContext)
  if (!ctx) throw new Error('useChatHistoryContext: missing ChatHistoryProvider')
  return ctx
}
