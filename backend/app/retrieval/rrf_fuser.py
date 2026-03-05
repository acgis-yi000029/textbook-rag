# Reciprocal Rank Fusion (RRF) — combines multiple ranked lists into one.
# Ref: Cormack, Clarke, Buettcher (2009) — RRF outperforms individual rankings
# Formula: score(d) = Σ 1 / (k + rank_i(d))

from __future__ import annotations

from backend.app.models import Chunk, RetrievedChunk


class RRFFuser:
    """Fuse results from multiple retrieval methods using Reciprocal Rank Fusion."""

    def __init__(self, k: int = 60) -> None:
        """Initialize the fuser.

        Args:
            k: RRF constant (default 60, standard in literature).
                Higher k gives more weight to lower-ranked results.
        """
        self.k = k

    def fuse(
        self,
        results_per_method: dict[str, list[RetrievedChunk]],
        top_k: int = 5,
    ) -> list[RetrievedChunk]:
        """Combine ranked lists from multiple methods.

        Args:
            results_per_method: Dict mapping method name to its ranked results.
            top_k: Number of top results to return.

        Returns:
            Fused and de-duplicated list of RetrievedChunk, sorted by RRF score.
        """
        # Accumulate RRF scores per chunk_id
        scores: dict[str, float] = {}
        chunk_store: dict[str, Chunk] = {}

        for method, results in results_per_method.items():
            for rank, item in enumerate(results):
                cid = item.chunk.chunk_id
                rrf_score = 1.0 / (self.k + rank + 1)
                scores[cid] = scores.get(cid, 0.0) + rrf_score
                # Keep the chunk object (first seen wins)
                if cid not in chunk_store:
                    chunk_store[cid] = item.chunk

        # Sort by fused score descending
        sorted_ids = sorted(scores, key=lambda cid: scores[cid], reverse=True)

        return [
            RetrievedChunk(
                chunk=chunk_store[cid],
                score=scores[cid],
                method="rrf_fused",
            )
            for cid in sorted_ids[:top_k]
        ]
