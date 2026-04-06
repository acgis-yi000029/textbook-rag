"""Ingest route — POST /engine/ingest.

Triggers the full ingest pipeline for an uploaded PDF:
  1. Download PDF from Payload Media URL
  2. Parse with MinerU (do_parse → content_list.json + middle.json)
  3. Read with MinerUReader → LlamaIndex Documents
  4. Run IngestionPipeline → ChromaDB vectors
  5. Push chunk metadata to Payload CMS
  6. Update book status

Ref: HF-03 — add PDF download step
     HF-04 — integrate MinerU parsing
"""

from __future__ import annotations

import shutil
import threading

from fastapi import APIRouter
from loguru import logger
from pydantic import BaseModel

from engine_v2.settings import DATA_DIR, MINERU_OUTPUT_DIR

router = APIRouter()

# ── Upload target directory ──
RAW_PDF_UPLOAD_DIR = DATA_DIR / "raw_pdfs" / "uploads"


class IngestRequest(BaseModel):
    book_id: int
    pdf_url: str | None = None  # Payload Media download URL
    file_url: str | None = None  # Legacy — kept for backward compat
    category: str = "textbook"
    task_id: int | None = None
    title: str | None = None


def _resolve_pdf_url(req: IngestRequest) -> str | None:
    """Get the PDF download URL from request (supports both new and legacy field)."""
    return req.pdf_url or req.file_url


def _derive_book_dir_name(req: IngestRequest) -> str:
    """Derive a filesystem-safe book directory name."""
    if req.title:
        # Sanitise title: lowercase, replace spaces/special chars with underscores
        safe = req.title.lower().strip()
        safe = "".join(c if c.isalnum() or c in (" ", "-", "_") else "" for c in safe)
        safe = safe.replace(" ", "_").replace("-", "_")
        # Remove consecutive underscores
        while "__" in safe:
            safe = safe.replace("__", "_")
        return safe.strip("_") or f"book_{req.book_id}"
    return f"book_{req.book_id}"


def _download_pdf(pdf_url: str, dest_path) -> None:
    """Download PDF from Payload Media URL to local filesystem."""
    import httpx

    logger.info("Downloading PDF from {} → {}", pdf_url, dest_path)
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    with httpx.stream("GET", pdf_url, timeout=120.0, follow_redirects=True) as resp:
        resp.raise_for_status()
        with open(dest_path, "wb") as f:
            for chunk in resp.iter_bytes(chunk_size=8192):
                f.write(chunk)

    size_mb = dest_path.stat().st_size / 1024 / 1024
    logger.info("Downloaded {:.1f} MB → {}", size_mb, dest_path.name)


def _run_mineru_parse(pdf_path, book_dir_name: str, category: str) -> None:
    """Run MinerU parsing on a PDF file.

    Uses MinerU Python API (do_parse) to generate:
      - {book_dir_name}_content_list.json
      - {book_dir_name}_middle.json
      - {book_dir_name}_origin.pdf
      - {book_dir_name}.md
      - images/

    Output is placed in: mineru_output/{category}/{book_dir_name}/{book_dir_name}/auto/
    to match the directory structure expected by MinerUReader.

    Ref: .github/references/MinerU/mineru/cli/common.py — do_parse()
    """
    from pathlib import Path

    from mineru.cli.common import do_parse, read_fn

    # MinerU outputs to: output_dir/{pdf_file_name}/{parse_method}/
    # We need: mineru_output/{category}/{book_dir_name}/{book_dir_name}/auto/
    # So set output_dir = mineru_output/{category}/{book_dir_name}
    # and pdf_file_name = book_dir_name
    # and parse_method = "auto"
    output_dir = str(MINERU_OUTPUT_DIR / category / book_dir_name)

    logger.info("Running MinerU parse: {} → {}", pdf_path, output_dir)

    pdf_bytes = read_fn(Path(pdf_path))

    do_parse(
        output_dir=output_dir,
        pdf_file_names=[book_dir_name],
        pdf_bytes_list=[pdf_bytes],
        p_lang_list=["en"],
        backend="pipeline",
        parse_method="auto",
        f_draw_layout_bbox=True,
        f_draw_span_bbox=False,   # Skip span bbox (not needed)
        f_dump_md=True,
        f_dump_middle_json=True,
        f_dump_model_output=False,  # Skip model output (saves disk)
        f_dump_orig_pdf=True,
        f_dump_content_list=True,
    )

    # Verify output exists
    content_list = Path(output_dir) / book_dir_name / "auto" / f"{book_dir_name}_content_list.json"
    if not content_list.exists():
        raise FileNotFoundError(
            f"MinerU parse completed but content_list.json not found at {content_list}"
        )
    logger.info("MinerU parse complete: {}", content_list)


def _ingest_pipeline(req: IngestRequest) -> None:
    """Full ingest pipeline: download → parse → vectorise → sync."""
    from engine_v2.ingestion.pipeline import ingest_book, _notify

    book_dir_name = _derive_book_dir_name(req)
    pdf_url = _resolve_pdf_url(req)

    try:
        # ── Step 0: Download PDF ──
        if pdf_url:
            _notify(req.task_id, status="running", progress=2, log="Downloading PDF...")
            pdf_dest = RAW_PDF_UPLOAD_DIR / f"{book_dir_name}.pdf"

            if not pdf_dest.exists():
                _download_pdf(pdf_url, pdf_dest)
            else:
                logger.info("PDF already exists at {}, skipping download", pdf_dest)

            _notify(req.task_id, status="running", progress=5, log="PDF downloaded")
        else:
            pdf_dest = None

        # ── Step 1: MinerU parse ──
        # Check if MinerU output already exists (idempotent)
        auto_dir = MINERU_OUTPUT_DIR / req.category / book_dir_name / book_dir_name / "auto"
        content_list_path = auto_dir / f"{book_dir_name}_content_list.json"

        if not content_list_path.exists():
            if pdf_dest and pdf_dest.exists():
                _notify(req.task_id, status="running", progress=8, log="Parsing PDF with MinerU...")
                _run_mineru_parse(pdf_dest, book_dir_name, req.category)
                _notify(req.task_id, status="running", progress=30, log="MinerU parsing complete")
            else:
                msg = f"No PDF to parse and no MinerU output found for {book_dir_name}"
                logger.error(msg)
                _notify(req.task_id, status="error", error=msg)
                return
        else:
            logger.info("MinerU output already exists for {}, skipping parse", book_dir_name)
            _notify(req.task_id, status="running", progress=30, log="MinerU output found (cached)")

        # ── Step 2-5: Existing ingest pipeline ──
        # (MinerUReader → IngestionPipeline → ChromaDB → Payload)
        ingest_book(
            book_id=req.book_id,
            book_dir_name=book_dir_name,
            category=req.category,
            task_id=req.task_id,
        )

    except Exception as e:
        logger.exception("Ingest pipeline failed for book {}", req.book_id)
        _notify(req.task_id, status="error", error=str(e))

        # Update book status to error
        try:
            import httpx
            from engine_v2.settings import PAYLOAD_URL, PAYLOAD_API_KEY
            headers = {"Content-Type": "application/json"}
            if PAYLOAD_API_KEY:
                headers["Authorization"] = f"Bearer {PAYLOAD_API_KEY}"
            httpx.patch(
                f"{PAYLOAD_URL}/api/books/{req.book_id}",
                json={"status": "error"},
                headers=headers,
                timeout=30.0,
            )
        except Exception:
            pass


@router.post("/ingest")
async def ingest(req: IngestRequest):
    """Trigger book ingestion in a background thread.

    Accepts PDF URL from Payload Media, downloads it, runs MinerU
    parsing, then feeds the output through the LlamaIndex ingestion
    pipeline into ChromaDB.
    """
    book_dir_name = _derive_book_dir_name(req)
    pdf_url = _resolve_pdf_url(req)

    logger.info(
        "Ingest request: book_id={}, dir={}, pdf_url={}, category={}",
        req.book_id, book_dir_name, pdf_url, req.category,
    )

    thread = threading.Thread(
        target=_ingest_pipeline,
        args=(req,),
        daemon=True,
    )
    thread.start()

    return {
        "status": "accepted",
        "book_id": req.book_id,
        "book_dir_name": book_dir_name,
        "pdf_url": pdf_url,
    }
