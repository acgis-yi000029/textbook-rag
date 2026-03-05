# Layout-aware chunker — splits content items into retrieval-ready chunks.
# Keeps tables and formulas intact; merges text runs up to token limit.
# Ref: Manning, Intro to IR, Ch2 — Text segmentation and chunking strategies

from __future__ import annotations

from backend.app.models import Chunk, ContentItem


def _estimate_tokens(text: str) -> int:
    """Rough token estimate: ~4 chars per token for English text."""
    return max(1, len(text) // 4)


# Mapping from book_key to human-readable title.
# Ref: Google SWE, Ch9 — maintain a single source of truth for metadata
BOOK_TITLES: dict[str, str] = {
    "goodfellow_deep_learning": "Deep Learning",
    "bishop_prml": "Pattern Recognition and Machine Learning",
    "james_ISLR": "An Introduction to Statistical Learning",
    "hastie_esl": "The Elements of Statistical Learning",
    "cormen_CLRS": "Introduction to Algorithms",
    "jurafsky_slp3": "Speech and Language Processing",
    "manning_intro_to_ir": "Introduction to Information Retrieval",
    "ramalho_fluent_python": "Fluent Python",
    "beazley_python_cookbook": "Python Cookbook",
    "flanagan_js_definitive_guide": "JavaScript: The Definitive Guide",
    "martin_clean_code": "Clean Code",
    "martin_clean_architecture": "Clean Architecture",
    "kleppmann_ddia": "Designing Data-Intensive Applications",
    "fowler_refactoring": "Refactoring",
    "hunt_pragmatic_programmer": "The Pragmatic Programmer",
    "google_swe": "Software Engineering at Google",
    "google_sre": "Site Reliability Engineering",
    "chacon_pro_git": "Pro Git",
    "nygard_release_it": "Release It!",
    "sutton_barto_rl_intro": "Reinforcement Learning: An Introduction",
    "szeliski_cv": "Computer Vision: Algorithms and Applications",
    "deisenroth_mml": "Mathematics for Machine Learning",
    "boyd_convex_optimization": "Convex Optimization",
    "mackay_information_theory": "Information Theory, Inference, and Learning Algorithms",
    "murphy_pml1": "Probabilistic Machine Learning: An Introduction",
    "murphy_pml2": "Probabilistic Machine Learning: Advanced Topics",
    "eisenstein_nlp": "Introduction to Natural Language Processing",
    "okken_python_testing_pytest": "Python Testing with pytest",
    "gof_design_patterns": "Design Patterns",
    "krug_dont_make_me_think": "Don't Make Me Think",
    "norman_design_everyday_things": "The Design of Everyday Things",
    "percival_cosmic_python": "Architecture Patterns with Python",
    "fontaine_art_of_postgresql": "The Art of PostgreSQL",
    "downey_think_python_2e": "Think Python",
    "downey_how_to_think_like_cs": "How to Think Like a Computer Scientist",
    "downey_think_stats_2e": "Think Stats",
    "haverbeke_eloquent_javascript": "Eloquent JavaScript",
    "basarat_typescript_deep_dive": "TypeScript Deep Dive",
    "simpson_ydkjs_up_going": "YDKJS: Up & Going",
    "simpson_ydkjs_scope_closures": "YDKJS: Scope & Closures",
    "simpson_ydkjs_this_object_prototypes": "YDKJS: this & Object Prototypes",
    "simpson_ydkjs_types_grammar": "YDKJS: Types & Grammar",
    "simpson_ydkjs_async_performance": "YDKJS: Async & Performance",
    "simpson_ydkjs_es6_beyond": "YDKJS: ES6 & Beyond",
    "barber_brml": "Bayesian Reasoning and Machine Learning",
    "grinstead_snell_probability": "Introduction to Probability",
    "hamilton_grl": "Graph Representation Learning",
    "kelleher_ml_fundamentals": "Fundamentals of Machine Learning",
    "shalev-shwartz_uml": "Understanding Machine Learning",
    "ejsmont_web_scalability": "Web Scalability for Startup Engineers",
}


class LayoutAwareChunker:
    """Split ContentItems into Chunks preserving document structure."""

    def __init__(self, max_tokens: int = 512, overlap_tokens: int = 50) -> None:
        self.max_tokens = max_tokens
        self.overlap_tokens = overlap_tokens

    def chunk(
        self,
        items: list[ContentItem],
        book_key: str,
    ) -> list[Chunk]:
        """Convert content items into retrieval-ready chunks.

        Tables and formulas are never split — each becomes a single chunk.
        Consecutive text items are merged up to max_tokens with overlap.

        Args:
            items: Parsed content items from MinerU, sorted by page_idx.
            book_key: Identifier for the source book.

        Returns:
            List of Chunk objects with full metadata.
        """
        book_title = BOOK_TITLES.get(book_key, book_key.replace("_", " ").title())
        chunks: list[Chunk] = []
        chunk_idx = 0

        # Track current chapter/section from headings
        current_chapter = ""
        current_section = ""

        # Buffer for merging consecutive text items
        text_buffer: list[str] = []
        buffer_bbox: list[float] = [0, 0, 0, 0]
        buffer_page: int = 0

        def _flush_text_buffer() -> None:
            """Emit accumulated text as one or more chunks."""
            nonlocal chunk_idx
            if not text_buffer:
                return

            merged = " ".join(text_buffer)
            tokens = _estimate_tokens(merged)

            if tokens <= self.max_tokens:
                # Fits in one chunk
                chunks.append(
                    Chunk(
                        chunk_id=f"{book_key}_p{buffer_page}_{chunk_idx}",
                        book_key=book_key,
                        book_title=book_title,
                        chapter=current_chapter,
                        section=current_section,
                        page_number=buffer_page,
                        content_type="text",
                        text=merged,
                        bbox=list(buffer_bbox),
                        token_count=tokens,
                    )
                )
                chunk_idx += 1
            else:
                # Split into overlapping sub-chunks by character position
                # Ref: Manning, Intro to IR, Ch2 — overlapping window strategy
                chars_per_chunk = self.max_tokens * 4
                overlap_chars = self.overlap_tokens * 4
                start = 0
                while start < len(merged):
                    end = min(start + chars_per_chunk, len(merged))
                    segment = merged[start:end]
                    chunks.append(
                        Chunk(
                            chunk_id=f"{book_key}_p{buffer_page}_{chunk_idx}",
                            book_key=book_key,
                            book_title=book_title,
                            chapter=current_chapter,
                            section=current_section,
                            page_number=buffer_page,
                            content_type="text",
                            text=segment,
                            bbox=list(buffer_bbox),
                            token_count=_estimate_tokens(segment),
                        )
                    )
                    chunk_idx += 1
                    # If we've reached the end, stop
                    if end >= len(merged):
                        break
                    start = end - overlap_chars

            text_buffer.clear()

        for item in items:
            # Update chapter/section tracking from headings
            if item.text_level == 1:
                _flush_text_buffer()
                current_chapter = item.text.strip()
                current_section = ""
            elif item.text_level == 2:
                _flush_text_buffer()
                current_section = item.text.strip()

            # Tables and formulas: always emit as standalone chunk
            if item.type in ("table", "formula", "figure"):
                _flush_text_buffer()
                chunks.append(
                    Chunk(
                        chunk_id=f"{book_key}_p{item.page_idx}_{chunk_idx}",
                        book_key=book_key,
                        book_title=book_title,
                        chapter=current_chapter,
                        section=current_section,
                        page_number=item.page_idx,
                        content_type=item.type,
                        text=item.text,
                        bbox=list(item.bbox),
                        text_level=item.text_level,
                        token_count=_estimate_tokens(item.text),
                    )
                )
                chunk_idx += 1
                continue

            # Text items: accumulate in buffer
            candidate_tokens = _estimate_tokens(" ".join(text_buffer + [item.text]))
            if candidate_tokens > self.max_tokens and text_buffer:
                _flush_text_buffer()

            if not text_buffer:
                buffer_page = item.page_idx
                buffer_bbox = list(item.bbox)

            text_buffer.append(item.text)
            # Expand bbox to cover all buffered items
            buffer_bbox[0] = min(buffer_bbox[0], item.bbox[0])
            buffer_bbox[1] = min(buffer_bbox[1], item.bbox[1])
            buffer_bbox[2] = max(buffer_bbox[2], item.bbox[2])
            buffer_bbox[3] = max(buffer_bbox[3], item.bbox[3])

        _flush_text_buffer()
        return chunks
