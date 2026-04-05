/**
 * useSuggestedQuestions — Fetch suggested questions for a book.
 *
 * Usage: const { questions, loading, error, refetch } = useSuggestedQuestions(bookId)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Question } from './types'
import { fetchHighQualityQuestions } from './api'

// ============================================================
// Types
// ============================================================
export interface SuggestedQuestionsState {
  questions: Question[]
  loading: boolean
  error: Error | null
}

// ============================================================
// Hook
// ============================================================
export function useSuggestedQuestions(bookIds: string[], limit = 6) {

  // ==========================================================
  // State
  // ==========================================================
  const [state, setState] = useState<SuggestedQuestionsState>({
    questions: [],
    loading: false,
    error: null,
  })

  // ==========================================================
  // Fetch
  // ==========================================================
  const fetch_ = useCallback(async () => {
    if (bookIds.length === 0) {
      setState({ questions: [], loading: false, error: null })
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    try {
      const questions = await fetchHighQualityQuestions(bookIds, limit)
      setState({ questions, loading: false, error: null })
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      }))
    }
  }, [bookIds.join(','), limit])

  // ==========================================================
  // Auto-fetch on mount / bookIds change
  // ==========================================================
  useEffect(() => {
    fetch_()
  }, [fetch_])

  // ==========================================================
  // Return
  // ==========================================================
  return {
    questions: state.questions,
    loading: state.loading,
    error: state.error,
    refetch: fetch_,
  }
}
