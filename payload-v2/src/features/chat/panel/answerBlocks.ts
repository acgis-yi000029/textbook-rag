/**
 * answerBlocks — Parse LLM output into semantic AnswerBlocks.
 *
 * Splits continuous text into paragraphs (by \n\n), extracts trailing
 * [N] citation markers from each paragraph, and returns an array of
 * AnswerBlock objects for structured rendering in MessageBubble.
 *
 * Usage: const blocks = parseAnswerBlocks(llmText)
 */

// ============================================================
// Types
// ============================================================

/** A single semantic paragraph with its bound citations. */
export interface AnswerBlock {
  /** Paragraph text with trailing [N] markers removed. */
  text: string;
  /** Citation indices extracted from the paragraph tail. */
  citationIndices: number[];
}

// ============================================================
// Constants
// ============================================================

/**
 * Regex to match one or more trailing [N] or [N.N.N] markers at paragraph end.
 * Supports both integer indices ([1]) and dotted section numbers ([3.2][3.2.2]).
 * Allows optional trailing punctuation (e.g. "[1]." or "[1][2][4].").
 */
const TRAILING_CITATIONS_RE = /(?:\[\d+(?:\.\d+)*\]\s*)+[.,;:]*\s*$/;

/**
 * Regex to extract individual [N] or [N.N.N] from a matched trailer string.
 * The captured group contains the full number (e.g. "3", "3.2", "3.2.2").
 */
const INDIVIDUAL_CITATION_RE = /\[(\d+(?:\.\d+)*)\]/g;

// ============================================================
// Parser
// ============================================================

/**
 * Parse LLM output text into an array of AnswerBlocks.
 *
 * Rules:
 *   1. Split by double newline (\n\n) into raw paragraphs.
 *   2. For each paragraph, extract trailing [N] markers into citationIndices.
 *   3. Consecutive Markdown headings (## / ###) are merged with the
 *      following paragraph so headings are not rendered as standalone blocks.
 *   4. Empty input returns [].
 *   5. If no \n\n split is possible, return a single block (fallback).
 *   6. Dotted citations like [3.2] are mapped to their integer part (3).
 */
export function parseAnswerBlocks(text: string): AnswerBlock[] {
  if (!text || !text.trim()) return [];

  // Split into raw paragraphs by double newline
  const rawParagraphs = text.split(/\n\n+/);

  const merged: string[] = [];
  let pendingHeading = "";

  for (const para of rawParagraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Detect Markdown headings (## or ###)
    if (/^#{2,3}\s+/.test(trimmed)) {
      // Accumulate heading — will be merged with next non-heading paragraph
      pendingHeading += (pendingHeading ? "\n\n" : "") + trimmed;
      continue;
    }

    // Merge any pending heading with this paragraph
    if (pendingHeading) {
      merged.push(`${pendingHeading}\n\n${trimmed}`);
      pendingHeading = "";
    } else {
      merged.push(trimmed);
    }
  }

  // If only headings remain (no body text followed), flush them as a block
  if (pendingHeading) {
    merged.push(pendingHeading);
  }

  // Fallback: if nothing was produced, return the whole text as a single block
  if (merged.length === 0) {
    return [{ text: text.trim(), citationIndices: [] }];
  }

  // Extract citations from each paragraph
  return merged.map((paragraph) => {
    const match = paragraph.match(TRAILING_CITATIONS_RE);
    if (!match) {
      return { text: paragraph, citationIndices: [] };
    }

    // Remove the trailing citation markers from the text
    const cleanText = paragraph.slice(0, match.index).trimEnd();
    const trailer = match[0];

    // Extract individual citation values; dotted → integer part (e.g. "3.2" → 3)
    const indices: number[] = [];
    const seen = new Set<number>();
    let m: RegExpExecArray | null;
    INDIVIDUAL_CITATION_RE.lastIndex = 0;
    while ((m = INDIVIDUAL_CITATION_RE.exec(trailer)) !== null) {
      const intIdx = Number.parseInt(m[1], 10);
      if (!seen.has(intIdx)) {
        seen.add(intIdx);
        indices.push(intIdx);
      }
    }

    return { text: cleanText, citationIndices: indices };
  });
}
