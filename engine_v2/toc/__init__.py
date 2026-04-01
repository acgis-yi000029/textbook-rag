"""toc — Table of Contents extraction and structuring.

Project-specific module (no LlamaIndex equivalent).
Extracts TOC using PDF bookmarks (primary) with MinerU fallback.
Used by api/routes/books.py and readers/ for document structure.
"""

from engine_v2.toc.extractor import (
    extract_toc,
    extract_toc_from_content_list,
    extract_toc_from_pdf,
    find_pdf_for_book,
    load_content_list,
)

__all__ = [
    "extract_toc",
    "extract_toc_from_content_list",
    "extract_toc_from_pdf",
    "find_pdf_for_book",
    "load_content_list",
]
