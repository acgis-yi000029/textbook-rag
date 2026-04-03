/**
 * shared/books types — unified book type definitions.
 *
 * Single source of truth for book-related types across all modules.
 */

// ============================================================
// Category & status
// ============================================================

export type BookCategory = 'textbook' | 'ecdev' | 'real_estate'
export type BookStatus = 'pending' | 'processing' | 'indexed' | 'error'

// ============================================================
// Base book type (minimum common fields)
// ============================================================

/** Core book identity — shared by all modules. */
export interface BookBase {
  id: number
  book_id: string
  title: string
  authors: string
  category: string
  subcategory: string
  chunk_count: number
}

// ============================================================
// Category config (shared across sidebar consumers)
// ============================================================

export interface CategoryConfig {
  label: string
  labelZh: string
  icon: string
  color: string
}

/** Default category display config. */
export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  textbook:    { label: 'Textbooks',      labelZh: '教材',     icon: 'BookOpen',  color: 'text-blue-400' },
  ecdev:       { label: 'EC Development', labelZh: '经济发展', icon: 'Building2', color: 'text-emerald-400' },
  real_estate: { label: 'Real Estate',    labelZh: '房地产',   icon: 'Home',      color: 'text-amber-400' },
}
