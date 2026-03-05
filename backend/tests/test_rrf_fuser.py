# Unit tests for RRF Fuser.
# Ref: okken, Python Testing with pytest, Ch2 — focused test functions
# Ref: Cormack et al. (2009) — RRF formula validation

from __future__ import annotations

from backend.app.models import Chunk, RetrievedChunk
from backend.app.retrieval.rrf_fuser import RRFFuser


def _make_chunk(chunk_id: str, text: str = "dummy") -> Chunk:
    """Helper to create a minimal Chunk for testing."""
    return Chunk(
        chunk_id=chunk_id,
        book_key="test",
        book_title="Test",
        chapter="Ch1",
        section="",
        page_number=0,
        content_type="text",
        text=text,
        bbox=[0, 0, 0, 0],
    )


def _make_retrieved(chunk_id: str, score: float, method: str) -> RetrievedChunk:
    """Helper to create a RetrievedChunk."""
    return RetrievedChunk(
        chunk=_make_chunk(chunk_id),
        score=score,
        method=method,
    )


class TestRRFFuser:
    """Tests for RRFFuser.fuse()."""

    def test_single_method_preserves_order(self) -> None:
        """With one method, RRF ranking preserves original order."""
        fuser = RRFFuser(k=60)
        results = {
            "bm25": [
                _make_retrieved("a", 1.0, "bm25"),
                _make_retrieved("b", 0.5, "bm25"),
                _make_retrieved("c", 0.3, "bm25"),
            ]
        }
        fused = fuser.fuse(results, top_k=3)
        assert [r.chunk.chunk_id for r in fused] == ["a", "b", "c"]

    def test_multi_method_boosts_overlap(self) -> None:
        """Chunk appearing in multiple methods gets higher fused score."""
        fuser = RRFFuser(k=60)
        results = {
            "bm25": [
                _make_retrieved("a", 1.0, "bm25"),
                _make_retrieved("b", 0.5, "bm25"),
            ],
            "semantic": [
                _make_retrieved("b", 0.8, "semantic"),  # "b" in both
                _make_retrieved("c", 0.6, "semantic"),
            ],
        }
        fused = fuser.fuse(results, top_k=3)
        # "b" should rank highest because it appears in both lists
        assert fused[0].chunk.chunk_id == "b"

    def test_deduplication(self) -> None:
        """Duplicate chunk_ids across methods are deduplicated."""
        fuser = RRFFuser(k=60)
        results = {
            "bm25": [_make_retrieved("a", 1.0, "bm25")],
            "semantic": [_make_retrieved("a", 0.9, "semantic")],
        }
        fused = fuser.fuse(results, top_k=10)
        assert len(fused) == 1
        assert fused[0].chunk.chunk_id == "a"

    def test_top_k_limits_output(self) -> None:
        """Output is limited to top_k results."""
        fuser = RRFFuser(k=60)
        results = {
            "bm25": [_make_retrieved(f"c{i}", 1.0, "bm25") for i in range(10)],
        }
        fused = fuser.fuse(results, top_k=3)
        assert len(fused) == 3

    def test_empty_input_returns_empty(self) -> None:
        """Empty results dict produces empty output."""
        fuser = RRFFuser(k=60)
        fused = fuser.fuse({}, top_k=5)
        assert fused == []

    def test_fused_method_label(self) -> None:
        """All fused results have method='rrf_fused'."""
        fuser = RRFFuser(k=60)
        results = {
            "bm25": [_make_retrieved("a", 1.0, "bm25")],
        }
        fused = fuser.fuse(results, top_k=5)
        for r in fused:
            assert r.method == "rrf_fused"

    def test_rrf_score_formula(self) -> None:
        """RRF score matches formula: score = Σ 1/(k + rank + 1)."""
        k = 60
        fuser = RRFFuser(k=k)
        results = {
            "bm25": [_make_retrieved("a", 1.0, "bm25")],  # rank 0
            "semantic": [_make_retrieved("a", 0.9, "semantic")],  # rank 0
        }
        fused = fuser.fuse(results, top_k=1)
        expected_score = 1.0 / (k + 0 + 1) + 1.0 / (k + 0 + 1)
        assert abs(fused[0].score - expected_score) < 1e-9
