"""citation — Citation-aware response synthesizer.

Responsibilities:
    - Build a COMPACT synthesizer with citation-aware prompt templates
    - Instruct LLM to organise answers by semantic paragraphs
    - Each paragraph's citations are grouped at the end (not scattered inline)

Ref: llama_index — get_response_synthesizer, ResponseMode
"""

from __future__ import annotations

from loguru import logger

from llama_index.core.prompts import PromptTemplate
from llama_index.core.response_synthesizers import (
    BaseSynthesizer,
    get_response_synthesizer,
    ResponseMode,
)

# ============================================================
# Citation QA prompt — semantic-paragraph style
# ============================================================
CITATION_QA_TEMPLATE = PromptTemplate(
    "You are a helpful study assistant for textbook content. "
    "Based on the provided source materials, answer the following question.\n\n"
    "## Output format rules\n"
    "1. Organise your answer into **semantic paragraphs** — each paragraph "
    "expresses one complete idea or point.\n"
    "2. Each source is labeled 'Source N:'. When citing, place [N] at the **end** "
    "of the paragraph BEFORE the final period (e.g. '...the result [1].'). "
    "Use the integer Source label (e.g. [1] for Source 1, [2] for Source 2). "
    "Do NOT use textbook section or chapter numbers as citations.\n"
    "3. Separate paragraphs with a blank line (Markdown paragraph break).\n"
    "4. If multiple sources support the same paragraph, list them together: "
    "[1][3][5].\n"
    "5. If the sources do not contain enough information, say so explicitly.\n\n"
    "Sources:\n"
    "-----\n"
    "{context_str}\n"
    "-----\n\n"
    "Question: {query_str}\n\n"
    "Answer (semantic paragraphs, citations at paragraph end):"
)

# ============================================================
# Citation refine prompt
# ============================================================
CITATION_REFINE_TEMPLATE = PromptTemplate(
    "You are refining an existing answer with additional context.\n"
    "Original question: {query_str}\n"
    "Existing answer: {existing_answer}\n"
    "Additional sources:\n"
    "-----\n"
    "{context_msg}\n"
    "-----\n\n"
    "Refine the answer using the new sources. Keep the semantic-paragraph "
    "format: each paragraph expresses one idea, citations [N] grouped at "
    "paragraph end. If the new context is not useful, return the original answer."
)


# ============================================================
# Factory
# ============================================================
def get_citation_synthesizer(
    mode: ResponseMode = ResponseMode.COMPACT,
    streaming: bool = False,
) -> BaseSynthesizer:
    """Build a citation-aware response synthesizer.

    Uses LlamaIndex's get_response_synthesizer() factory with custom
    prompts that instruct the LLM to produce semantic-paragraph answers
    with [N] citation markers grouped at paragraph end.

    Args:
        mode: LlamaIndex response mode (COMPACT, REFINE, TREE_SUMMARIZE, etc.)
        streaming: Whether to enable streaming generation.

    Returns:
        BaseSynthesizer configured for citation-aware generation.
    """
    synthesizer = get_response_synthesizer(
        response_mode=mode,
        streaming=streaming,
        text_qa_template=CITATION_QA_TEMPLATE,
        refine_template=CITATION_REFINE_TEMPLATE,
    )

    logger.info("CitationSynthesizer ready (mode={}, streaming={})", mode, streaming)
    return synthesizer
