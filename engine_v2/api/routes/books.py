"""Books route — GET /engine/books, PDF serving, TOC.

Scans the MinerU output directory to discover processed books,
serves PDFs from both MinerU auto/ and raw_pdfs/ directories,
and extracts TOC from content_list.json headings.

Unlike Engine v1 (which read from SQLite), Engine v2 derives
everything from the filesystem.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from engine_v2.settings import DATA_DIR, MINERU_OUTPUT_DIR
from engine_v2.toc import extract_toc as _toc_extract, load_content_list as _toc_load, find_pdf_for_book as _toc_find_pdf

logger = logging.getLogger(__name__)

router = APIRouter(tags=["books"])

# Category directories under mineru_output/
CATEGORIES = ["textbooks", "ecdev", "real_estate"]

# Raw PDF source directories (fallback for origin variant)
RAW_PDF_DIRS = [
    DATA_DIR / "raw_pdfs" / "textbooks",
    DATA_DIR / "raw_pdfs" / "ecdev",
    DATA_DIR / "raw_pdfs" / "real_estate",
    DATA_DIR / "raw_pdfs" / "uploads",
]


# ── Internal helpers ─────────────────────────────────────────────────────────


def _count_content_items(content_list_path: Path) -> int:
    """Count items in content_list.json (proxy for chunk_count)."""
    try:
        with open(content_list_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return len(data) if isinstance(data, list) else 0
    except (json.JSONDecodeError, FileNotFoundError, OSError):
        return 0


def _count_pages(middle_json_path: Path) -> int:
    """Count pages from middle.json."""
    try:
        with open(middle_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        pages = data.get("pdf_info", data) if isinstance(data, dict) else data
        return len(pages) if isinstance(pages, list) else 0
    except (json.JSONDecodeError, FileNotFoundError, OSError):
        return 0


def _humanize_title(book_id: str) -> str:
    """Convert book_id like 'bishop_prml' → 'Bishop Prml'."""
    return book_id.replace("_", " ").title()


def _find_book_dir(book_id: str) -> Path | None:
    """Locate the MinerU book directory across all categories."""
    for category in CATEGORIES:
        book_dir = MINERU_OUTPUT_DIR / category / book_id
        if book_dir.is_dir():
            return book_dir
    return None


def _get_auto_dir(book_id: str) -> Path | None:
    """Get the MinerU auto/ output directory for a book."""
    book_dir = _find_book_dir(book_id)
    if not book_dir:
        return None
    auto_dir = book_dir / book_id / "auto"
    return auto_dir if auto_dir.is_dir() else None


def _find_origin_pdf(book_id: str) -> Path | None:
    """Find origin (source) PDF.

    Priority:
      1. MinerU auto/{book_id}_origin.pdf
      2. raw_pdfs/{category}/{book_id}.pdf
    """
    auto_dir = _get_auto_dir(book_id)
    if auto_dir:
        origin_pdf = auto_dir / f"{book_id}_origin.pdf"
        if origin_pdf.exists():
            return origin_pdf

    # Fallback: scan raw_pdfs directories
    for d in RAW_PDF_DIRS:
        p = d / f"{book_id}.pdf"
        if p.exists():
            return p

    return None


def _find_layout_pdf(book_id: str) -> Path | None:
    """Find MinerU layout-analysed PDF.

    Falls back to origin PDF if layout variant is not available.
    """
    auto_dir = _get_auto_dir(book_id)
    if auto_dir:
        layout_pdf = auto_dir / f"{book_id}_layout.pdf"
        if layout_pdf.exists():
            return layout_pdf

    # Fallback to origin
    return _find_origin_pdf(book_id)


def _load_content_list(book_id: str) -> list[dict]:
    """Load content_list.json for a book (delegates to toc/)."""
    auto_dir = _get_auto_dir(book_id)
    if not auto_dir:
        return []
    return _toc_load(auto_dir, book_id)


def _extract_toc(book_id: str, content_list: list[dict]) -> list[dict]:
    """Extract TOC entries — PDF bookmarks first, MinerU fallback."""
    pdf_path = _toc_find_pdf(book_id, MINERU_OUTPUT_DIR, RAW_PDF_DIRS)
    return _toc_extract(content_list, pdf_path=pdf_path)


def _discover_books() -> list[dict]:
    """Scan mineru_output/ for all processed books."""
    books: list[dict] = []

    for category in CATEGORIES:
        category_dir = MINERU_OUTPUT_DIR / category
        if not category_dir.is_dir():
            continue

        for book_dir in sorted(category_dir.iterdir()):
            if not book_dir.is_dir():
                continue

            book_id = book_dir.name
            auto_dir = book_dir / book_id / "auto"

            content_list_path = auto_dir / f"{book_id}_content_list.json"
            if not content_list_path.exists():
                logger.debug("Skipping %s: no content_list.json", book_id)
                continue

            middle_json_path = auto_dir / f"{book_id}_middle.json"

            books.append({
                "book_id": book_id,
                "title": _humanize_title(book_id),
                "category": category,
                "page_count": _count_pages(middle_json_path),
                "chunk_count": _count_content_items(content_list_path),
            })

    return books


# ── Route handlers ───────────────────────────────────────────────────────────


@router.get("/books")
async def list_books():
    """List all processed books discovered from the filesystem.

    Scans data/mineru_output/{category}/{book_dir}/ for content_list.json
    to determine which books have been parsed by MinerU.
    """
    return _discover_books()


@router.get("/books/{book_id}/pdf")
async def get_pdf(book_id: str, variant: str = "origin"):
    """Serve PDF file for a book.

    variant=origin  → source PDF (MinerU *_origin.pdf or raw_pdfs/)
    variant=layout  → MinerU layout-analysed PDF (*_layout.pdf)
    """
    if variant == "layout":
        pdf_path = _find_layout_pdf(book_id)
    else:
        pdf_path = _find_origin_pdf(book_id)

    if not pdf_path:
        raise HTTPException(
            404, f"PDF not found for book: {book_id} (variant={variant})"
        )

    return FileResponse(
        str(pdf_path),
        media_type="application/pdf",
        filename=f"{book_id}.pdf",
    )


@router.get("/books/{book_id}/toc")
async def get_toc(book_id: str):
    """Get table of contents for a book.

    Extracts TOC from MinerU content_list.json heading items
    (text_level 1-3). Returns list of { id, level, number, title, pdf_page }.
    """
    content_list = _load_content_list(book_id)
    if not content_list:
        raise HTTPException(
            404, f"No content data found for book: {book_id}"
        )

    toc = _extract_toc(book_id, content_list)
    if not toc:
        # Even if content_list exists, there may be no headings.
        # Return empty list instead of 404 (the book exists, just no TOC).
        return []

    return toc


@router.get("/books/{book_id}/cover")
async def get_cover(book_id: str):
    """Get book cover image (rendered from PDF page 1).

    Returns a PNG image of the first page of the book's source PDF,
    suitable for use as a cover thumbnail.
    """
    from fastapi.responses import Response as FastAPIResponse

    from engine_v2.readers.cover_extractor import extract_cover_for_book

    png_bytes = extract_cover_for_book(book_id, MINERU_OUTPUT_DIR)
    if not png_bytes:
        raise HTTPException(
            404, f"Could not extract cover for book: {book_id}"
        )

    return FastAPIResponse(
        content=png_bytes,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},
    )
