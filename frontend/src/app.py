# Streamlit UI — AI Textbook Q&A System
# Run: streamlit run frontend/src/app.py
# Ref: Krug, Don't Make Me Think, Ch1 — self-evident pages need no explanation;
#      our chat_input and source cards are immediately understandable
# Ref: Krug, Ch3 — visual hierarchy for scanning: badges, section headers, cards
# Ref: Norman, Design of Everyday Things, Ch1 — affordances: buttons/cards look clickable

from __future__ import annotations

import sys
from pathlib import Path

# Add project root for imports
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

import streamlit as st  # noqa: E402

from backend.app.config import Config  # noqa: E402
from backend.app.rag_engine import RAGEngine  # noqa: E402

# ─── Page Configuration ───────────────────────────────────────────
st.set_page_config(
    page_title="AI Textbook Q&A",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── Custom CSS ───────────────────────────────────────────────────
st.markdown(
    """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

html, body, [class*="st-"] {
    font-family: 'Inter', sans-serif;
}

/* Source reference card */
.source-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 8px 0;
    transition: all 0.2s ease;
    cursor: pointer;
}
.source-card:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 6px rgba(99, 102, 241, 0.1);
}

/* Content type badges */
.badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
}
.badge-text { background: #eef2ff; color: #6366f1; }
.badge-table { background: #f5f3ff; color: #8b5cf6; }
.badge-formula { background: #fdf2f8; color: #ec4899; }
.badge-figure { background: #f0fdfa; color: #14b8a6; }

/* Citation inline badges */
.citation {
    background: #eef2ff;
    color: #6366f1;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}

/* Header styling */
.main-title {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 4px;
}
.subtitle {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 24px;
}
</style>
""",
    unsafe_allow_html=True,
)


# ─── Session State Initialization ─────────────────────────────────
def init_session() -> None:
    """Initialize session state variables."""
    if "engine" not in st.session_state:
        st.session_state.engine = None
    if "history" not in st.session_state:
        st.session_state.history = []
    if "selected_source" not in st.session_state:
        st.session_state.selected_source = None


def get_engine() -> RAGEngine | None:
    """Lazy-load the RAG engine."""
    if st.session_state.engine is None:
        try:
            config = Config.load(_PROJECT_ROOT / "backend" / "config.yaml")
            st.session_state.engine = RAGEngine(config)
        except Exception as exc:
            st.error(f"Failed to initialize RAG engine: {exc}")
            return None
    return st.session_state.engine


def get_badge_class(content_type: str) -> str:
    """Get CSS class for content type badge."""
    return {
        "text": "badge-text",
        "table": "badge-table",
        "formula": "badge-formula",
        "figure": "badge-figure",
    }.get(content_type, "badge-text")


# ─── Main Application ────────────────────────────────────────────
def main() -> None:
    """Render the Streamlit UI."""
    init_session()

    # ── Sidebar ──
    with st.sidebar:
        st.markdown("### 📚 AI Textbook Q&A")
        st.markdown("---")

        engine = get_engine()

        # Book filter
        if engine:
            books = engine.get_available_books()
            book_options = {
                b.book_key: f"{b.book_title} ({b.total_chunks})" for b in books
            }
            selected_books = st.multiselect(
                "📖 Filter by Books",
                options=list(book_options.keys()),
                format_func=lambda k: book_options.get(k, k),
                help="Leave empty to search all books",
            )

            # Content type filter
            st.markdown("**Content Types**")
            show_text = st.checkbox("Text", value=True)
            show_table = st.checkbox("Tables", value=True)
            show_formula = st.checkbox("Formulas", value=True)
            show_figure = st.checkbox("Figures", value=True)

            content_types = []
            if show_text:
                content_types.append("text")
            if show_table:
                content_types.append("table")
            if show_formula:
                content_types.append("formula")
            if show_figure:
                content_types.append("figure")

            # Health status
            st.markdown("---")
            health = engine.check_health()
            st.markdown("**System Status**")
            for comp, ok in health.items():
                icon = "✅" if ok else "❌"
                st.markdown(f"{icon} {comp}")
        else:
            selected_books = []
            content_types = ["text", "table", "formula", "figure"]

        # History
        if st.session_state.history:
            st.markdown("---")
            st.markdown("**Query History**")
            for i, entry in enumerate(reversed(st.session_state.history[-10:])):
                q = (
                    entry["question"][:50] + "..."
                    if len(entry["question"]) > 50
                    else entry["question"]
                )
                st.caption(f"▸ {q}")

    # ── Main Content ──
    st.markdown(
        '<div class="main-title">📚 AI Textbook Q&A</div>', unsafe_allow_html=True
    )
    st.markdown(
        '<div class="subtitle">Ask questions about AI, ML, NLP, and more — '
        "grounded in 30+ canonical textbooks with source tracing</div>",
        unsafe_allow_html=True,
    )

    # Question input
    question = st.chat_input("Ask a question about AI/ML textbooks...")

    if question:
        engine = get_engine()
        if engine is None:
            st.error("⚠️ RAG Engine not available. Check system status in sidebar.")
            return

        with st.spinner("🔍 Searching across textbooks..."):
            result = engine.query(
                question=question,
                book_filter=selected_books or None,
                content_type_filter=content_types or None,
            )

        # Store in history
        st.session_state.history.append(
            {
                "question": question,
                "result": result,
            }
        )

    # Display latest result
    if st.session_state.history:
        latest = st.session_state.history[-1]
        result = latest["result"]

        # Question
        st.markdown(f"**🔍 Question:** {latest['question']}")

        # Retrieval stats
        with st.expander("📊 Retrieval Statistics", expanded=False):
            for method, stat in result.retrieval_stats.items():
                st.text(f"  {method}: {stat}")

        # Answer
        st.markdown("---")
        st.markdown("### 💡 Answer")
        st.markdown(result.answer)

        # Source references
        if result.sources:
            st.markdown("---")
            st.markdown("### 📖 Sources")

            cols = st.columns(min(len(result.sources), 3))
            for i, source in enumerate(result.sources):
                with cols[i % 3]:
                    badge_class = get_badge_class(source.chunk.content_type)
                    st.markdown(
                        f'<div class="source-card">'
                        f"<strong>[{source.citation_id}]</strong> "
                        f'<span class="badge {badge_class}">{source.chunk.content_type}</span><br>'
                        f"📖 {source.chunk.book_title}<br>"
                        f"<small>{source.chunk.chapter} · p.{source.chunk.page_number}</small>"
                        f"</div>",
                        unsafe_allow_html=True,
                    )

                    # View source button
                    if st.button(
                        f"🔍 View Source [{source.citation_id}]",
                        key=f"src_{i}",
                    ):
                        st.session_state.selected_source = source

            # PDF viewer
            if st.session_state.selected_source:
                source = st.session_state.selected_source
                st.markdown("---")
                st.markdown(
                    f"### 📄 Source Viewer — {source.chunk.book_title}, "
                    f"p.{source.chunk.page_number}"
                )

                img = engine.render_source(
                    book_key=source.chunk.book_key,
                    page_number=source.chunk.page_number,
                    bbox=source.chunk.bbox,
                )

                if img is not None:
                    st.image(img, use_container_width=True)
                else:
                    st.warning(
                        "PDF not available for viewing. Showing text content instead:"
                    )
                    st.code(source.chunk.text[:2000])

    elif not st.session_state.history:
        # Empty state
        st.markdown("---")
        st.markdown(
            """
            <div style="text-align: center; padding: 60px 0; color: #6b7280;">
                <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
                <div style="font-size: 18px; font-weight: 600;">Ask your first question</div>
                <div style="font-size: 14px; margin-top: 8px;">
                    Try: "What is the Adam optimizer?" or "Explain backpropagation"
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )


if __name__ == "__main__":
    main()
