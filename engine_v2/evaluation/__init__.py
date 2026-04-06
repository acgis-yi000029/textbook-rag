"""evaluation — Unified RAG quality evaluation hub.

Public API:
    evaluate_response              — 5-dimensional single-query evaluation
    evaluate_dataset               — batch evaluation via BatchEvalRunner
    assess_question_depth          — question cognitive depth (surface/understanding/synthesis)
    question_dedup                 — semantic similarity deduplication
    build_evaluators               — factory: build evaluator dicts by mode
    QuestionDepthEvaluator         — CorrectnessEvaluator subclass for depth scoring
    evaluate_single_from_query     — evaluate a single existing Queries record
    evaluate_batch_from_queries    — batch-evaluate recent Queries records
    EvalResult                     — 5-dimensional evaluation result dataclass
    DepthResult                    — depth assessment result dataclass
    DedupResult                    — deduplication result dataclass
    QueryRecord                    — fetched Queries record dataclass
    HistoryEvalResult              — history evaluation result dataclass
"""

from engine_v2.evaluation.evaluator import (
    EvalResult,
    DepthResult,
    DedupResult,
    QuestionDepthEvaluator,
    assess_question_depth,
    build_evaluators,
    evaluate_dataset,
    evaluate_response,
    question_dedup,
)
from engine_v2.evaluation.history import (
    HistoryEvalResult,
    QueryRecord,
    evaluate_batch_from_queries,
    evaluate_single_from_query,
)

__all__ = [
    "EvalResult",
    "DepthResult",
    "DedupResult",
    "HistoryEvalResult",
    "QueryRecord",
    "QuestionDepthEvaluator",
    "assess_question_depth",
    "build_evaluators",
    "evaluate_batch_from_queries",
    "evaluate_dataset",
    "evaluate_response",
    "evaluate_single_from_query",
    "question_dedup",
]
