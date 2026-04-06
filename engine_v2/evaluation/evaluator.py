"""evaluator — Unified RAG evaluation hub.

Responsibilities:
    - 5-dimensional response evaluation (faithfulness, relevancy, correctness,
      context_relevancy, answer_relevancy)
    - Question cognitive depth assessment (surface / understanding / synthesis)
    - Question deduplication via semantic similarity
    - Factory function to build evaluator sets by mode

Ref: llama_index.core.evaluation — CorrectnessEvaluator, SemanticSimilarityEvaluator,
     ContextRelevancyEvaluator, AnswerRelevancyEvaluator, BatchEvalRunner
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, TYPE_CHECKING

from loguru import logger

from llama_index.core.evaluation import (
    AnswerRelevancyEvaluator,
    BatchEvalRunner,
    ContextRelevancyEvaluator,
    CorrectnessEvaluator,
    FaithfulnessEvaluator,
    RelevancyEvaluator,
    SemanticSimilarityEvaluator,
)
from llama_index.core.prompts import (
    ChatMessage,
    ChatPromptTemplate,
    MessageRole,
)

if TYPE_CHECKING:
    from llama_index.core.query_engine import RetrieverQueryEngine

from engine_v2.query_engine.citation import get_query_engine


# ============================================================
# Constants — Question Depth Evaluation Template
# ============================================================
DEPTH_SYSTEM_TEMPLATE = """
You are an expert evaluator of question quality for a knowledge retrieval system.

You are given a user's question about a topic.

Your job is to assess the **cognitive depth** of the question on a 1–5 scale.

Follow these guidelines for scoring:
- 1: Surface-level recall — asks for a definition or fact verbatim from the text.
- 2: Basic comprehension — asks to explain or paraphrase a concept.
- 3: Application — asks to apply a concept to a new scenario or example.
- 4: Analysis / Synthesis — asks to compare, contrast, or combine multiple concepts.
- 5: Evaluation / Creation — asks to critique, evaluate trade-offs, or propose new ideas.

You must return your response in a line with only the score.
Do not return answers in any other format.
On a separate line provide your reasoning for the score as well.

Example Response:
4.0
This question requires the user to synthesize concepts from multiple sources \
    and analyze their interactions, demonstrating deep understanding.

"""

DEPTH_USER_TEMPLATE = """
## Question
{query}

## Reference Rubric
{reference_answer}

## Assessment Criteria
{generated_answer}
"""

DEPTH_EVAL_TEMPLATE = ChatPromptTemplate(
    message_templates=[
        ChatMessage(role=MessageRole.SYSTEM, content=DEPTH_SYSTEM_TEMPLATE),
        ChatMessage(role=MessageRole.USER, content=DEPTH_USER_TEMPLATE),
    ]
)

# Depth label thresholds: score ≥ threshold → label
DEPTH_THRESHOLDS = {
    "synthesis": 4.0,
    "understanding": 2.5,
    # < 2.5 → "surface"
}

# Deduplication similarity threshold
DEDUP_SIMILARITY_THRESHOLD = 0.85


# ============================================================
# Data classes
# ============================================================
@dataclass
class EvalResult:
    """Structured evaluation result for one query (5-dimensional)."""

    query: str
    answer: str
    faithfulness: float | None = None
    relevancy: float | None = None
    correctness: float | None = None
    context_relevancy: float | None = None
    answer_relevancy: float | None = None
    feedback: dict[str, str] = field(default_factory=dict)


@dataclass
class DepthResult:
    """Question cognitive depth assessment result."""

    question: str
    depth: str  # "surface" | "understanding" | "synthesis"
    score: float  # 1.0–5.0
    reasoning: str


@dataclass
class DedupResult:
    """Question deduplication result."""

    is_duplicate: bool
    most_similar: str | None  # Most similar existing question text
    similarity_score: float
    suggestion: str  # Suggested direction if duplicate


# ============================================================
# QuestionDepthEvaluator — inherits CorrectnessEvaluator
# ============================================================
# Ref: llama_index.core.evaluation.correctness — CorrectnessEvaluator
class QuestionDepthEvaluator(CorrectnessEvaluator):
    """Evaluate question cognitive depth (1–5 scale).

    Inherits CorrectnessEvaluator with a custom eval_template
    that scores question depth instead of answer correctness.

    Business-layer threshold mapping:
        ≥ 4.0 → synthesis
        ≥ 2.5 → understanding
        < 2.5 → surface
    """

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(
            eval_template=DEPTH_EVAL_TEMPLATE,
            score_threshold=2.5,  # passing = understanding or above
            **kwargs,
        )
        logger.debug("QuestionDepthEvaluator initialized")


# ============================================================
# Factory — build evaluator sets by mode
# ============================================================
def build_evaluators(mode: str = "response") -> dict[str, Any]:
    """Build evaluator dict by usage mode.

    Args:
        mode: "response" → 5-dimensional response evaluation;
              "question" → question depth evaluator.

    Returns:
        Dict[str, BaseEvaluator] suitable for BatchEvalRunner.
    """
    if mode == "response":
        return {
            "faithfulness": FaithfulnessEvaluator(),
            "relevancy": RelevancyEvaluator(),
            "correctness": CorrectnessEvaluator(),
            "context_relevancy": ContextRelevancyEvaluator(),
            "answer_relevancy": AnswerRelevancyEvaluator(),
        }
    if mode == "question":
        return {
            "depth": QuestionDepthEvaluator(),
        }
    msg = f"Unknown evaluator mode: {mode!r}. Use 'response' or 'question'."
    raise ValueError(msg)


# ============================================================
# 5-dimensional response evaluation
# ============================================================
async def evaluate_response(
    query: str,
    engine: RetrieverQueryEngine | None = None,
) -> EvalResult:
    """Evaluate a single query through the full RAG pipeline (5-dimensional).

    Runs the query, then evaluates the response with:
        - FaithfulnessEvaluator  (is answer grounded in context?)
        - RelevancyEvaluator     (is context relevant to query?)
        - ContextRelevancyEvaluator  (context quality score)
        - AnswerRelevancyEvaluator   (answer-to-query relevance score)

    Args:
        query: The question to evaluate.
        engine: Optional pre-built query engine.

    Returns:
        EvalResult with 5-dimensional scores and feedback.
    """
    if engine is None:
        engine = get_query_engine()

    response = engine.query(query)

    # Build evaluators
    faithfulness_eval = FaithfulnessEvaluator()
    relevancy_eval = RelevancyEvaluator()
    ctx_relevancy_eval = ContextRelevancyEvaluator()
    ans_relevancy_eval = AnswerRelevancyEvaluator()

    # Extract context strings for context-based evaluators
    contexts = [n.node.get_content() for n in response.source_nodes]

    # Run all evaluations
    faith_result = await faithfulness_eval.aevaluate_response(
        query=query, response=response
    )
    relev_result = await relevancy_eval.aevaluate_response(
        query=query, response=response
    )
    ctx_result = await ctx_relevancy_eval.aevaluate(
        query=query, contexts=contexts
    )
    ans_result = await ans_relevancy_eval.aevaluate(
        query=query, response=str(response)
    )

    result = EvalResult(
        query=query,
        answer=str(response),
        faithfulness=faith_result.score,
        relevancy=relev_result.score,
        context_relevancy=ctx_result.score,
        answer_relevancy=ans_result.score,
        feedback={
            "faithfulness": faith_result.feedback or "",
            "relevancy": relev_result.feedback or "",
            "context_relevancy": ctx_result.feedback or "",
            "answer_relevancy": ans_result.feedback or "",
        },
    )
    logger.info(
        "Evaluated query — faith={}, relev={}, ctx_relev={}, ans_relev={}",
        result.faithfulness,
        result.relevancy,
        result.context_relevancy,
        result.answer_relevancy,
    )
    return result


# ============================================================
# Batch evaluation (5-dimensional)
# ============================================================
async def evaluate_dataset(
    queries: list[str],
    reference_answers: list[str] | None = None,
    engine: RetrieverQueryEngine | None = None,
) -> list[EvalResult]:
    """Batch-evaluate multiple queries using LlamaIndex BatchEvalRunner.

    Args:
        queries: List of questions to evaluate.
        reference_answers: Optional ground-truth answers (enables CorrectnessEvaluator).
        engine: Optional pre-built query engine.

    Returns:
        List of EvalResult, one per query.
    """
    if engine is None:
        engine = get_query_engine()

    evaluators = build_evaluators(mode="response")
    if not reference_answers:
        # Remove correctness — requires reference answers
        evaluators.pop("correctness", None)

    runner = BatchEvalRunner(evaluators=evaluators, show_progress=True)
    eval_results = await runner.aevaluate_queries(
        query_engine=engine,
        queries=queries,
    )

    results: list[EvalResult] = []
    for i, q in enumerate(queries):
        scores: dict[str, float | None] = {}
        feedback: dict[str, str] = {}

        for key in ("faithfulness", "relevancy", "correctness",
                     "context_relevancy", "answer_relevancy"):
            if key in eval_results and i < len(eval_results[key]):
                r = eval_results[key][i]
                scores[key] = r.score
                feedback[key] = r.feedback or ""
            else:
                scores[key] = None

        results.append(EvalResult(
            query=q,
            answer="",  # filled internally by batch runner
            faithfulness=scores["faithfulness"],
            relevancy=scores["relevancy"],
            correctness=scores["correctness"],
            context_relevancy=scores["context_relevancy"],
            answer_relevancy=scores["answer_relevancy"],
            feedback=feedback,
        ))

    logger.info("Batch-evaluated {} queries (5-dimensional)", len(results))
    return results


# ============================================================
# Question depth assessment
# ============================================================
def _score_to_depth_label(score: float) -> str:
    """Map numeric depth score to categorical label."""
    if score >= DEPTH_THRESHOLDS["synthesis"]:
        return "synthesis"
    if score >= DEPTH_THRESHOLDS["understanding"]:
        return "understanding"
    return "surface"


async def assess_question_depth(
    question: str,
    llm: Any = None,
) -> DepthResult:
    """Assess cognitive depth of a question.

    Uses QuestionDepthEvaluator (inherits CorrectnessEvaluator with
    custom eval_template) to score 1–5, then maps to depth label.

    Args:
        question: The question text.
        llm: Optional LLM instance override. Uses Settings.llm if None.

    Returns:
        DepthResult with depth label, numeric score, and reasoning.
    """
    eval_kwargs = {"llm": llm} if llm else {}
    evaluator = QuestionDepthEvaluator(**eval_kwargs)

    # CorrectnessEvaluator.aevaluate(query, response, reference)
    # We pass the question as both query and response (the thing being judged).
    # Reference provides the rubric context for the LLM.
    result = await evaluator.aevaluate(
        query=question,
        response=question,
        reference=(
            "A high-depth question requires synthesis across multiple concepts, "
            "critical evaluation, or creative application. "
            "A low-depth question merely asks for definitions or factual recall."
        ),
    )

    score = result.score or 1.0
    depth = _score_to_depth_label(score)

    logger.info(
        "Question depth: {} (score={}) — {}",
        depth, score, question[:80],
    )
    return DepthResult(
        question=question,
        depth=depth,
        score=score,
        reasoning=result.feedback or "",
    )


# ============================================================
# Question deduplication — SemanticSimilarityEvaluator
# ============================================================
# Ref: llama_index.core.evaluation.semantic_similarity — SemanticSimilarityEvaluator
async def question_dedup(
    question: str,
    history_questions: list[str],
    threshold: float = DEDUP_SIMILARITY_THRESHOLD,
) -> DedupResult:
    """Detect if a question duplicates any in the history set.

    Uses LlamaIndex SemanticSimilarityEvaluator (internally uses
    Settings.embed_model for vectorization + cosine similarity).

    Args:
        question: The new question to check.
        history_questions: List of previously asked question texts.
        threshold: Similarity threshold for flagging as duplicate.

    Returns:
        DedupResult with duplicate flag, most similar match, and suggestion.
    """
    if not history_questions:
        return DedupResult(
            is_duplicate=False,
            most_similar=None,
            similarity_score=0.0,
            suggestion="",
        )

    sim_eval = SemanticSimilarityEvaluator(
        similarity_threshold=threshold,
    )

    best_score = 0.0
    best_match: str | None = None

    for hist_q in history_questions:
        result = await sim_eval.aevaluate(
            response=question,
            reference=hist_q,
        )
        score = result.score or 0.0
        if score > best_score:
            best_score = score
            best_match = hist_q

    is_dup = best_score >= threshold

    suggestion = ""
    if is_dup and best_match:
        suggestion = (
            f"This question is very similar to: \"{best_match[:120]}\" "
            f"(similarity: {best_score:.2f}). "
            "Consider asking a deeper follow-up, e.g. comparing concepts, "
            "applying to a different scenario, or evaluating trade-offs."
        )

    logger.info(
        "Dedup check — is_dup={}, best_score={:.3f}, question={}",
        is_dup, best_score, question[:80],
    )
    return DedupResult(
        is_duplicate=is_dup,
        most_similar=best_match,
        similarity_score=best_score,
        suggestion=suggestion,
    )
