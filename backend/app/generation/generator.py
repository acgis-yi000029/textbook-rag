# Answer generator — produces grounded answers using Ollama LLM.
# Ref: Goodfellow et al., Deep Learning, Ch12.4 — NLP sequence generation
# Ref: Jurafsky, SLP3, Ch14 — Question answering with retrieval

from __future__ import annotations

from loguru import logger
from ollama import Client, ResponseError

from backend.app.models import Chunk, QueryResult, SourceReference

_SYSTEM_PROMPT = """You are an educational AI assistant that answers questions using only the provided textbook excerpts.

Rules:
1. Answer ONLY based on the provided context. Do not use knowledge outside these excerpts.
2. Cite your sources using [1], [2], etc. matching the numbered excerpts.
3. If the context does not contain relevant information, say: "I could not find relevant information in the textbooks for this question."
4. Be concise but thorough. Explain concepts clearly for a student audience.
5. If a formula or table is referenced, describe it accurately."""

_CONTEXT_TEMPLATE = """[{idx}] {book_title}, {chapter} (p.{page})
Content type: {content_type}
---
{text}
---"""

# Rough limit: leave room for system prompt + answer
_MAX_CONTEXT_CHARS = 6000


class AnswerGenerator:
    """Generate grounded answers from retrieved context using Ollama."""

    def __init__(self, host: str, model: str, timeout: int = 30) -> None:
        self._client = Client(host=host)
        self._model = model
        self._timeout = timeout

    def generate(self, question: str, chunks: list[Chunk]) -> QueryResult:
        """Generate an answer grounded in the provided chunks.

        Args:
            question: User's natural language question.
            chunks: Top-K retrieved chunks to use as context.

        Returns:
            QueryResult with answer text and source references.
        """
        if not chunks:
            return QueryResult(
                answer="I could not find relevant information in the textbooks for this question.",
                sources=[],
            )

        # Build context string with dynamic truncation
        # Ref: architecture ADR — context window management
        context_parts: list[str] = []
        used_chunks: list[Chunk] = []
        total_chars = 0

        for idx, chunk in enumerate(chunks):
            part = _CONTEXT_TEMPLATE.format(
                idx=idx + 1,
                book_title=chunk.book_title,
                chapter=chunk.chapter or "Unknown",
                page=chunk.page_number,
                content_type=chunk.content_type,
                text=chunk.text[:1500],  # Truncate individual chunks
            )
            if total_chars + len(part) > _MAX_CONTEXT_CHARS:
                break
            context_parts.append(part)
            used_chunks.append(chunk)
            total_chars += len(part)

        context = "\n\n".join(context_parts)

        user_message = (
            f"Context excerpts from textbooks:\n\n{context}\n\n"
            f"Question: {question}\n\n"
            f"Answer the question using only the above excerpts. Cite sources as [1], [2], etc."
        )

        try:
            response = self._client.chat(
                model=self._model,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
            )
            answer = response["message"]["content"].strip()
        except ResponseError as exc:
            logger.error("Ollama generation failed: {}", exc)
            return QueryResult(
                answer=f"Error: Could not generate answer. Is Ollama running? ({exc})",
                sources=[],
            )
        except Exception as exc:
            logger.error("Unexpected generation error: {}", exc)
            return QueryResult(
                answer=f"Error: {exc}",
                sources=[],
            )

        sources = [
            SourceReference(
                citation_id=i + 1,
                chunk=chunk,
                relevance_score=1.0 / (i + 1),
            )
            for i, chunk in enumerate(used_chunks)
        ]

        return QueryResult(answer=answer, sources=sources)

    def check_health(self) -> bool:
        """Check if Ollama is running and the model is available."""
        try:
            self._client.list()
            return True
        except Exception:
            return False
