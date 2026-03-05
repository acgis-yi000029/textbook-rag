# PageIndex retriever — LLM-guided TOC tree navigation.
# Inspired by VectifyAI/PageIndex: hierarchical reasoning over textbook structure.
# Ref: Jurafsky, SLP3, Ch23 — Information extraction and document navigation

from __future__ import annotations

from loguru import logger
from ollama import Client, ResponseError

from backend.app.indexing.sqlite_indexer import SQLiteIndexer
from backend.app.models import RetrievedChunk


class PageIndexRetriever:
    """Navigate PageIndex TOC trees using LLM reasoning to find relevant sections."""

    def __init__(
        self,
        ollama_host: str,
        model: str,
        sqlite_indexer: SQLiteIndexer,
    ) -> None:
        self._client = Client(host=ollama_host)
        self._model = model
        self._indexer = sqlite_indexer

    def search(
        self,
        query: str,
        trees: dict[str, dict],
        top_k: int = 5,
    ) -> list[RetrievedChunk]:
        """LLM-guided section search through TOC trees.

        Stage 1: Present top-level chapter titles → LLM selects relevant ones.
        Stage 2: Expand selected chapters → retrieve chunks from those page ranges.

        Args:
            query: User question.
            trees: Dict of book_key → PageIndex tree dict.
            top_k: Max chunks to return.

        Returns:
            Chunks from the LLM-selected sections.
        """
        if not trees:
            return []

        # Stage 1: Build a compact summary of all books' top-level chapters
        summary_lines: list[str] = []
        # Map: "BOOK_KEY:CHAPTER_TITLE" → (book_key, page_start, page_end)
        chapter_map: dict[str, tuple[str, int, int]] = {}

        for book_key, tree_data in trees.items():
            book_title = tree_data.get("book_title", book_key)
            for node in tree_data.get("tree", []):
                label = f"{book_title} — {node['title']}"
                summary_lines.append(label)
                chapter_map[label] = (
                    book_key,
                    node.get("page_start", 0),
                    node.get("page_end", 0),
                )

        # Limit summary to avoid exceeding context window
        # Ref: architecture ADR-3 — keep prompt under token budget
        if len(summary_lines) > 200:
            summary_lines = summary_lines[:200]

        summary_text = "\n".join(f"- {line}" for line in summary_lines)

        prompt = (
            f'Given the user question: "{query}"\n\n'
            f"Here are textbook chapter titles:\n{summary_text}\n\n"
            f"List the 3 most relevant chapters (copy exact titles, one per line). "
            f"Only output the titles, nothing else."
        )

        try:
            response = self._client.chat(
                model=self._model,
                messages=[
                    {
                        "role": "system",
                        "content": "You select relevant textbook chapters.",
                    },
                    {"role": "user", "content": prompt},
                ],
            )
            reply = response["message"]["content"].strip()
        except (ResponseError, Exception) as exc:
            logger.warning("PageIndex LLM call failed: {}", exc)
            return []

        # Stage 2: Parse LLM response → find matching chapters → fetch chunks
        selected_chunks: list[RetrievedChunk] = []

        for line in reply.split("\n"):
            line = line.strip().lstrip("- •·0123456789.)")
            line = line.strip()
            if not line:
                continue

            # Fuzzy match against chapter map
            best_match = None
            best_score = 0
            for label in chapter_map:
                # Simple substring overlap score
                score = sum(1 for w in line.lower().split() if w in label.lower())
                if score > best_score:
                    best_score = score
                    best_match = label

            if best_match and best_score >= 2:
                book_key, page_start, page_end = chapter_map[best_match]
                chunks = self._indexer.get_chunks_by_pages(
                    book_key,
                    page_start,
                    min(page_start + 5, page_end),
                )
                for chunk in chunks[:top_k]:
                    selected_chunks.append(
                        RetrievedChunk(chunk=chunk, score=0.5, method="pageindex")
                    )

            if len(selected_chunks) >= top_k:
                break

        return selected_chunks[:top_k]
