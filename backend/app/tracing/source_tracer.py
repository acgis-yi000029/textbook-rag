# Source tracer — renders PDF pages with highlighted bounding boxes.
# Ref: Szeliski, Computer Vision, Ch2 — Image processing and overlays

from __future__ import annotations

from pathlib import Path

from loguru import logger

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None  # type: ignore[assignment]

try:
    from PIL import Image, ImageDraw
except ImportError:
    Image = None  # type: ignore[assignment,misc]
    ImageDraw = None  # type: ignore[assignment]


# Highlight colors
_HIGHLIGHT_FILL = (250, 204, 21, 90)  # Yellow, semi-transparent (RGBA)
_HIGHLIGHT_BORDER = (250, 204, 21, 255)  # Yellow, solid


class SourceTracer:
    """Render PDF pages as images with bounding box highlights for source tracing."""

    def __init__(self, textbooks_dir: Path, mineru_output_dir: Path) -> None:
        self._textbooks_dir = textbooks_dir
        self._mineru_dir = mineru_output_dir

    def render_page_with_highlight(
        self,
        book_key: str,
        page_number: int,
        bbox: list[float],
        zoom: float = 1.5,
    ) -> Image.Image | None:
        """Render a PDF page as an image with the source region highlighted.

        Args:
            book_key: Book identifier.
            page_number: 0-indexed page number.
            bbox: [x0, y0, x1, y1] bounding box coordinates from MinerU.
            zoom: Rendering zoom factor (DPI multiplier).

        Returns:
            PIL Image with yellow bbox overlay, or None if PDF not found.
        """
        if fitz is None or Image is None:
            logger.warning("PyMuPDF or Pillow not installed, cannot render PDF")
            return None

        pdf_path = self._find_pdf(book_key)
        if pdf_path is None:
            logger.warning("PDF not found for book: {}", book_key)
            return None

        try:
            doc = fitz.open(str(pdf_path))
            if page_number >= len(doc):
                logger.warning(
                    "Page {} out of range for {} ({} pages)",
                    page_number,
                    book_key,
                    len(doc),
                )
                doc.close()
                return None

            page = doc[page_number]

            # Render page to pixmap
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, alpha=False)

            # Convert to PIL Image
            img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            doc.close()

            # Draw highlight rectangle (scale bbox by zoom)
            if bbox and len(bbox) == 4 and any(v > 0 for v in bbox):
                draw = ImageDraw.Draw(img, "RGBA")
                scaled_bbox = [
                    bbox[0] * zoom,
                    bbox[1] * zoom,
                    bbox[2] * zoom,
                    bbox[3] * zoom,
                ]
                # Semi-transparent yellow fill
                draw.rectangle(scaled_bbox, fill=_HIGHLIGHT_FILL)
                # Solid yellow border (2px width)
                draw.rectangle(scaled_bbox, outline=_HIGHLIGHT_BORDER, width=2)

            return img

        except Exception as exc:
            logger.error(
                "Failed to render page {} of {}: {}", page_number, book_key, exc
            )
            return None

    def _find_pdf(self, book_key: str) -> Path | None:
        """Locate the PDF file for a book.

        Search order:
        1. MinerU output: {mineru_dir}/{book_key}/{book_key}/auto/{book_key}_layout.pdf
        2. Textbooks dir: {textbooks_dir}/**/{book_key}.pdf
        """
        # Try MinerU layout PDF first (has same page numbering as content_list)
        layout_pdf = (
            self._mineru_dir / book_key / book_key / "auto" / f"{book_key}_layout.pdf"
        )
        if layout_pdf.exists():
            return layout_pdf

        # Try textbooks dir
        for pdf in self._textbooks_dir.rglob(f"*{book_key}*.pdf"):
            return pdf

        # Try any PDF in the MinerU book dir
        book_dir = self._mineru_dir / book_key
        if book_dir.exists():
            for pdf in book_dir.rglob("*.pdf"):
                if "_layout" not in pdf.name and "_span" not in pdf.name:
                    return pdf

        return None
