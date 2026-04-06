/**
 * CitationChip — Inline citation chip for AnswerBlock rendering.
 *
 * Displays [N] p.XX inline after each answer block.
 * Click toggles inline content panel (via onChipClick) AND
 * dispatches SELECT_SOURCE to jump PDF to that page.
 *
 * Usage: <CitationChip source={source} index={1} onChipClick={fn} />
 */

"use client";

import { useCallback } from "react";
import { useAppDispatch } from "@/features/shared/AppContext";
import type { SourceInfo } from "@/features/shared/types";

// ============================================================
// Types
// ============================================================
interface CitationChipProps {
  source: SourceInfo;
  /** 1-based citation number */
  index: number;
  /** Whether this chip is the currently active/selected citation */
  isActive?: boolean;
  /** Callback when chip is clicked (for parent to toggle inline panel) */
  onChipClick?: () => void;
}

// ============================================================
// Component
// ============================================================
export default function CitationChip({
  source,
  index,
  isActive = false,
  onChipClick,
}: CitationChipProps) {
  const dispatch = useAppDispatch();

  // ── Click → toggle inline panel + jump to PDF page ────────
  const handleClick = useCallback(() => {
    // Toggle inline content panel
    onChipClick?.();

    // Jump PDF viewer to this source's page
    const raw = source as any;
    dispatch({
      type: "SELECT_SOURCE",
      source: {
        ...source,
        source_id: raw.chunk_id || raw.source_id || "",
        book_id_string:
          typeof raw.book_id === "string"
            ? raw.book_id
            : source.book_id_string,
        snippet: raw.snippet || "",
        citation_label: `[${index}]`,
      },
    });
  }, [dispatch, source, index, onChipClick]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`citation-chip inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
        isActive
          ? "border-blue-400/60 bg-blue-500/10 text-blue-500 shadow-sm shadow-blue-500/10"
          : "border-border/60 bg-card/60 text-muted-foreground hover:border-blue-300/50 hover:bg-accent/50 hover:text-foreground"
      }`}
      aria-label={`${source.book_title || ''} p.${source.page_number} — click to view source`}
    >
      {/* Citation number badge */}
      <span
        className={`inline-flex h-[20px] w-[20px] items-center justify-center rounded-full text-[10px] font-bold leading-none shrink-0 ${
          isActive
            ? "bg-blue-500 text-white"
            : "bg-muted-foreground/15 text-muted-foreground"
        }`}
      >
        {index}
      </span>

      {/* Book title (truncated) */}
      {source.book_title && (
        <span className="max-w-[120px] truncate text-[11px] text-foreground/80">
          {source.book_title}
        </span>
      )}

      {/* Page number */}
      <span className="shrink-0 tabular-nums text-muted-foreground/70 text-[11px]">
        p.{source.page_number}
      </span>
    </button>
  );
}
