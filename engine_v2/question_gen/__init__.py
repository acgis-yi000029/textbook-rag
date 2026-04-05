"""question_gen — LLM-based question generation from textbook chunks.

Public API:
    QuestionGenerator         — LLM-driven question generation from chunks
    fetch_suggested_questions — Fetch high-quality questions from Payload CMS
    SuggestedQuestion         — Suggested question data type
"""

from engine_v2.question_gen.generator import QuestionGenerator
from engine_v2.question_gen.suggest import SuggestedQuestion, fetch_suggested_questions

__all__ = ["QuestionGenerator", "SuggestedQuestion", "fetch_suggested_questions"]
