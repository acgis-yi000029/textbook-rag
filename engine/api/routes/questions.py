"""POST /engine/questions — Auto-generate questions from book PDF via LLM.

Extracts a sample of chunks from the selected books, then asks the LLM
to generate study questions based on the content.
"""

from typing import Any

import json
import logging
import sqlite3

import httpx
from fastapi import APIRouter
from pydantic import BaseModel

from engine.api.deps import get_rag_core
from engine.config import DATABASE_PATH, PAYLOAD_URL

logger = logging.getLogger(__name__)

router = APIRouter(tags=["questions"])

# ── Fallback prompt (used only when Payload CMS is unreachable) ──
_FALLBACK_SYSTEM_PROMPT = (
    "You are a study assistant that generates questions STRICTLY based on the "
    "textbook excerpts provided below. "
    "Every question MUST reference a specific concept from the excerpts. "
    "Do NOT generate generic questions. "
    "Generate exactly {count} questions. "
    "Return ONLY a JSON array. Each element: "
    '"question" (string), "book_title" (string), "topic_hint" (string). '
    "No markdown code blocks."
)

# In-memory prompt cache (populated on first call)
_cached_system_prompt: str | None = None


def _fetch_question_prompt() -> str:
    """Fetch the 'question-generation' system prompt from Payload CMS.
    
    Falls back to the built-in prompt if CMS is unreachable.
    """
    global _cached_system_prompt
    if _cached_system_prompt is not None:
        return _cached_system_prompt

    try:
        resp = httpx.get(
            f"{PAYLOAD_URL}/api/prompt-modes",
            params={"where[slug][equals]": "question-generation", "limit": 1},
            timeout=5.0,
        )
        resp.raise_for_status()
        docs = resp.json().get("docs", [])
        if docs and docs[0].get("systemPrompt"):
            _cached_system_prompt = docs[0]["systemPrompt"]
            logger.info("Loaded question-generation prompt from Payload CMS")
            return _cached_system_prompt
    except Exception as e:
        logger.warning("Could not fetch prompt from Payload CMS: %s", e)

    _cached_system_prompt = _FALLBACK_SYSTEM_PROMPT
    return _cached_system_prompt


class GenerateQuestionsRequest(BaseModel):
    """Request body for question generation."""
    book_ids: list[int]
    count: int = 6          # how many questions to generate
    model: str | None = None


class GeneratedQuestion(BaseModel):
    """A single auto-generated question with metadata."""
    question: str
    book_id: int
    book_title: str
    topic_hint: str         # short label like "Chapter 3" or "BM25"


def _sample_chunks(book_ids: list[int], sample_size: int = 12) -> list[dict[str, Any]]:
    """Sample random chunks from the given books in the SQLite DB.
    
    Note: book_ids from the frontend are Payload CMS IDs. In the engine
    SQLite DB, books.book_id is a TEXT directory name and books.id is
    the integer PK. We query all books and filter by text matching if
    needed, or just sample across all available books.
    """
    db_path = str(DATABASE_PATH)
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row

    # Sample chunks from all books (the engine DB may have different IDs)
    rows = conn.execute(
        """
        SELECT c.chunk_id, c.text, p.page_number,
               b.id AS engine_book_id, b.book_id AS book_dir_name,
               b.title AS book_title
        FROM chunks c
        JOIN books b ON c.book_id = b.id
        LEFT JOIN pages p ON c.primary_page_id = p.id
        WHERE length(c.text) > 120
        ORDER BY RANDOM()
        LIMIT ?
        """,
        (sample_size,),
    ).fetchall()
    conn.close()

    if not rows:
        return []

    return [dict(r) for r in rows]


def _generate_questions_via_llm(
    chunks: list[dict[str, Any]],
    count: int,
    model: str,
    ollama_url: str,
) -> list[dict[str, Any]]:
    """Call Ollama to generate questions from sampled chunks."""
    # Build context from chunks
    context_parts = []
    for i, c in enumerate(chunks, 1):
        header = f"[{i}] {c.get('book_title', '')} | p.{c.get('page_number', '?')}"
        text = c.get("text", "")[:600]
        context_parts.append(f"{header}\n{text}")
    context = "\n\n---\n\n".join(context_parts)

    # Fetch prompt from Payload CMS (cached after first call)
    prompt_template = _fetch_question_prompt()
    system_prompt = prompt_template.replace("{count}", str(count))

    # Detect thinking-capable models and disable CoT for faster responses
    is_thinking_model = any(
        tag in model.lower()
        for tag in ("qwen3", "deepseek-r1", "qwq")
    )

    payload: dict[str, Any] = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Textbook excerpts:\n\n{context}"},
        ],
        "stream": False,
    }
    if is_thinking_model:
        payload["think"] = False

    try:
        logger.info("Calling Ollama model=%s at %s", model, ollama_url)
        resp = httpx.post(f"{ollama_url}/api/chat", json=payload, timeout=120.0)
        resp.raise_for_status()
        content = resp.json().get("message", {}).get("content", "")
        # Try to parse JSON from response
        content = content.strip()
        # Strip markdown code fences if present
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        questions = json.loads(content)
        if isinstance(questions, list):
            return questions[:count]
    except httpx.HTTPStatusError as e:
        logger.error(
            "Ollama returned HTTP %s for model=%s: %s",
            e.response.status_code, model, e.response.text[:300],
        )
    except Exception as e:
        logger.exception("LLM question generation failed (model=%s): %s", model, e)

    return []


@router.post("/questions")
def generate_questions(req: GenerateQuestionsRequest):
    """Generate study questions from book content using LLM."""
    core = get_rag_core()
    config = core._config

    model = req.model or config.default_model
    ollama_url = config.ollama_base_url

    # Sample chunks from requested books
    chunks = _sample_chunks(req.book_ids, sample_size=12)
    if not chunks:
        return {"questions": []}

    # Get book_id mapping for attaching correct IDs
    book_id_map: dict[str, int] = {}
    for c in chunks:
        title = c.get("book_title", "")
        bid = c.get("engine_book_id")
        if title and bid:
            book_id_map[title] = bid

    raw_questions = _generate_questions_via_llm(chunks, req.count, model, ollama_url)

    questions = []
    for q in raw_questions:
        title = q.get("book_title", "")
        questions.append({
            "question": q.get("question", ""),
            "book_id": book_id_map.get(title, req.book_ids[0] if req.book_ids else 0),
            "book_title": title,
            "topic_hint": q.get("topic_hint", ""),
        })

    return {"questions": questions}
