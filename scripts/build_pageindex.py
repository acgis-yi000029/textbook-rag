"""build_pageindex.py — Generate PageIndex tree structures for all PDFs.

Uses the VectifyAI/PageIndex library with a local Ollama model to build
hierarchical tree-structure indexes for each PDF in data/raw_pdfs/.

Output: data/pageindex/<category>/<book_name>_structure.json

Usage:
    uv run python scripts/build_pageindex.py
    uv run python scripts/build_pageindex.py --model qwen3.5:9b
    uv run python scripts/build_pageindex.py --pdf data/raw_pdfs/ecdev/some_book.pdf
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Path setup: add the PageIndex reference library to sys.path
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
PAGEINDEX_LIB = PROJECT_ROOT / ".github" / "references" / "PageIndex"

if str(PAGEINDEX_LIB) not in sys.path:
    sys.path.insert(0, str(PAGEINDEX_LIB))

# Patch environment BEFORE importing pageindex — point openai at Ollama
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1")
os.environ["CHATGPT_API_KEY"] = "ollama"  # Ollama doesn't need a real key

# Monkey-patch the openai client creation in pageindex.utils to use Ollama
import openai as _openai

_orig_openai_init = _openai.OpenAI.__init__


def _patched_openai_init(self, *args, **kwargs):
    kwargs["api_key"] = "ollama"
    kwargs["base_url"] = OLLAMA_BASE_URL
    _orig_openai_init(self, *args, **kwargs)


_openai.OpenAI.__init__ = _patched_openai_init

# Same for AsyncOpenAI
_orig_async_init = _openai.AsyncOpenAI.__init__


def _patched_async_init(self, *args, **kwargs):
    kwargs["api_key"] = "ollama"
    kwargs["base_url"] = OLLAMA_BASE_URL
    _orig_async_init(self, *args, **kwargs)


_openai.AsyncOpenAI.__init__ = _patched_async_init

# Now import pageindex
from pageindex import page_index_main  # noqa: E402
from pageindex.utils import ConfigLoader  # noqa: E402
from types import SimpleNamespace  # noqa: E402

# ---------------------------------------------------------------------------
# Project paths
# ---------------------------------------------------------------------------
RAW_PDFS_DIR = PROJECT_ROOT / "data" / "raw_pdfs"
OUTPUT_DIR = PROJECT_ROOT / "data" / "pageindex"

SOURCE_CATEGORIES = ["ecdev", "real_estate", "textbooks"]


def find_all_pdfs() -> list[tuple[str, Path]]:
    """Return [(category, pdf_path), ...] for all PDFs in raw_pdfs/."""
    results = []
    for category in SOURCE_CATEGORIES:
        cat_dir = RAW_PDFS_DIR / category
        if not cat_dir.exists():
            continue
        for pdf in sorted(cat_dir.rglob("*.pdf")):
            results.append((category, pdf))
    return results


def build_pageindex_for_pdf(
    pdf_path: Path,
    category: str,
    model: str,
    force: bool = False,
) -> Path | None:
    """Generate PageIndex tree structure for a single PDF.

    Returns the output JSON path, or None if skipped/failed.
    """
    book_name = pdf_path.stem
    out_dir = OUTPUT_DIR / category
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{book_name}_structure.json"

    if out_file.exists() and not force:
        print(f"  [SKIP] {book_name} — already exists ({out_file.name})")
        return out_file

    print(f"  [BUILD] {book_name} ({pdf_path.name})")
    print(f"          Model: {model}")

    # Configure PageIndex options for local model
    config_loader = ConfigLoader()
    opt = config_loader.load({
        "model": model,
        "toc_check_page_num": 15,        # fewer pages to check (faster)
        "max_page_num_each_node": 8,      # smaller nodes for local models
        "max_token_num_each_node": 10000,  # lower token limit for 4B/9B models
        "if_add_node_id": "yes",
        "if_add_node_summary": "yes",
        "if_add_doc_description": "no",
        "if_add_node_text": "no",
    })

    t0 = time.time()
    try:
        result = page_index_main(str(pdf_path), opt)
        elapsed = time.time() - t0

        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        # Count nodes
        def count_nodes(tree):
            c = 0
            if isinstance(tree, dict):
                c = 1
                for n in tree.get("nodes", []):
                    c += count_nodes(n)
            elif isinstance(tree, list):
                for item in tree:
                    c += count_nodes(item)
            return c

        structure = result.get("structure", result)
        n = count_nodes(structure)
        print(f"          Done: {n} nodes, {elapsed:.1f}s → {out_file.name}")
        return out_file

    except Exception as e:
        elapsed = time.time() - t0
        print(f"          FAILED after {elapsed:.1f}s: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(
        description="Build PageIndex tree structures for PDFs using local Ollama model"
    )
    parser.add_argument(
        "--model", default="qwen3.5:4b",
        help="Ollama model name (default: qwen3.5:4b)"
    )
    parser.add_argument(
        "--pdf", type=str, default=None,
        help="Process a single PDF file path instead of all"
    )
    parser.add_argument(
        "--category", type=str, default=None,
        help="Process only PDFs from this category (ecdev, real_estate, textbooks)"
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Re-generate even if output already exists"
    )
    parser.add_argument(
        "--ollama-url", default=None,
        help="Ollama base URL (default: http://127.0.0.1:11434/v1)"
    )
    args = parser.parse_args()

    # Update Ollama URL if specified
    if args.ollama_url:
        global OLLAMA_BASE_URL
        OLLAMA_BASE_URL = args.ollama_url

    print("=" * 60)
    print("PageIndex Tree Builder (Local Ollama)")
    print("=" * 60)
    print(f"  Model:  {args.model}")
    print(f"  Ollama: {OLLAMA_BASE_URL}")
    print(f"  Output: {OUTPUT_DIR}")
    print()

    # Determine PDFs to process
    if args.pdf:
        pdf_path = Path(args.pdf).resolve()
        if not pdf_path.exists():
            print(f"ERROR: PDF not found: {pdf_path}")
            sys.exit(1)
        # Guess category from path
        category = "unknown"
        for cat in SOURCE_CATEGORIES:
            if cat in str(pdf_path):
                category = cat
                break
        pdfs = [(category, pdf_path)]
    else:
        pdfs = find_all_pdfs()
        if args.category:
            pdfs = [(c, p) for c, p in pdfs if c == args.category]

    if not pdfs:
        print("No PDFs found to process.")
        sys.exit(0)

    print(f"Found {len(pdfs)} PDF(s) to process:\n")

    success = 0
    failed = 0
    skipped = 0

    for i, (category, pdf_path) in enumerate(pdfs, 1):
        print(f"[{i}/{len(pdfs)}] {category}/{pdf_path.name}")
        result = build_pageindex_for_pdf(pdf_path, category, args.model, args.force)
        if result is None:
            failed += 1
        elif result.exists() and not args.force:
            skipped += 1
        else:
            success += 1
        print()

    print("=" * 60)
    print(f"Results: {success} built, {skipped} skipped, {failed} failed")
    print(f"Output:  {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
