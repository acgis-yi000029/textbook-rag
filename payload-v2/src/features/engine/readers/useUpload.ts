/**
 * useUpload — PDF upload state management hook.
 *
 * Usage: const { upload, uploading, progress, error, reset } = useUpload({ onSuccess })
 *
 * Manages file validation, multipart upload to Payload CMS Books collection,
 * and triggers the Engine ingest pipeline via the afterChange hook.
 */

'use client'

import { useState, useCallback } from 'react'
import type { BookCategory } from './types'

// ============================================================
// Constants
// ============================================================
const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200 MB
const ACCEPTED_MIME = 'application/pdf'

// ============================================================
// Types
// ============================================================
export interface UploadOptions {
  /** Called after a successful upload with the new book ID. */
  onSuccess?: (bookId: number) => void
  /** Called when an error occurs. */
  onError?: (error: string) => void
}

export interface UploadPayload {
  file: File
  title?: string
  category?: BookCategory
}

interface UploadState {
  uploading: boolean
  progress: number // 0-100
  error: string | null
  fileName: string | null
}

// ============================================================
// Validation
// ============================================================
function validateFile(file: File): string | null {
  if (file.type !== ACCEPTED_MIME) {
    return `Invalid file type: ${file.type}. Only PDF files are accepted.`
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(1)
    return `File too large: ${sizeMb} MB. Maximum is ${MAX_FILE_SIZE / 1024 / 1024} MB.`
  }
  if (file.size === 0) {
    return 'File is empty.'
  }
  return null
}

// ============================================================
// Hook
// ============================================================
export function useUpload(options?: UploadOptions) {

  // ==========================================================
  // State
  // ==========================================================
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    fileName: null,
  })

  // ==========================================================
  // Reset
  // ==========================================================
  const reset = useCallback(() => {
    setState({ uploading: false, progress: 0, error: null, fileName: null })
  }, [])

  // ==========================================================
  // Upload
  // ==========================================================
  const upload = useCallback(async ({ file, title, category }: UploadPayload) => {
    // Validate
    const validationError = validateFile(file)
    if (validationError) {
      setState((s) => ({ ...s, error: validationError }))
      options?.onError?.(validationError)
      return
    }

    setState({ uploading: true, progress: 10, error: null, fileName: file.name })

    try {
      // Derive a book title from filename if not provided
      const bookTitle = title ?? file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')

      // Step 1: Create a Book record in Payload CMS (30%)
      setState((s) => ({ ...s, progress: 30 }))

      const createRes = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bookTitle,
          category: category ?? 'textbook',
          status: 'pending',
        }),
      })

      if (!createRes.ok) {
        const errBody = await createRes.text()
        throw new Error(`Failed to create book record: ${createRes.status} — ${errBody}`)
      }

      const bookDoc = await createRes.json()
      const bookId = bookDoc.doc?.id ?? bookDoc.id

      // Step 2: Upload PDF to Payload Media collection (60%)
      setState((s) => ({ ...s, progress: 60 }))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', bookTitle)

      const mediaRes = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      if (!mediaRes.ok) {
        throw new Error(`Failed to upload media: ${mediaRes.status}`)
      }

      const mediaDoc = await mediaRes.json()
      const mediaId = mediaDoc.doc?.id ?? mediaDoc.id
      const mediaFilename = mediaDoc.doc?.filename ?? mediaDoc.filename

      // Step 3: Link media to book + set filename for afterChange hook (80%)
      setState((s) => ({ ...s, progress: 80 }))

      const linkRes = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverImage: mediaId,
          filename: mediaFilename,
          status: 'pending', // triggers afterChange hook → Engine ingest
        }),
      })

      if (!linkRes.ok) {
        throw new Error(`Failed to link media to book: ${linkRes.status}`)
      }

      // Done (100%)
      setState({ uploading: false, progress: 100, error: null, fileName: file.name })
      options?.onSuccess?.(bookId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setState((s) => ({ ...s, uploading: false, error: message }))
      options?.onError?.(message)
    }
  }, [options])

  return {
    upload,
    uploading: state.uploading,
    progress: state.progress,
    error: state.error,
    fileName: state.fileName,
    reset,
  }
}
