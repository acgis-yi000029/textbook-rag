# MinerU content_list.json parser.
# Reads pre-processed MinerU output and converts to structured ContentItem objects.
# Ref: Manning, Intro to IR, Ch2 — Document preprocessing and tokenization

from __future__ import annotations

import json
from pathlib import Path

from loguru import logger

from backend.app.models import ContentItem

# Content types to keep; "discarded" items are filtered out
_VALID_TYPES = {"text", "table", "formula", "figure", "image"}


class MinerUParser:
    """Parse MinerU content_list.json files into ContentItem lists."""

    def parse_content_list(self, path: Path) -> list[ContentItem]:
        """Parse a single content_list.json file.

        Args:
            path: Path to the *_content_list.json file.

        Returns:
            List of ContentItem objects, filtered and validated.
        """
        if not path.exists():
            logger.warning("Content list not found: {}", path)
            return []

        with open(path, encoding="utf-8") as f:
            raw_items: list[dict] = json.load(f)

        items: list[ContentItem] = []
        for entry in raw_items:
            content_type = entry.get("type", "")
            if content_type not in _VALID_TYPES:
                continue

            text = (entry.get("text") or "").strip()
            if not text:
                continue

            bbox = entry.get("bbox", [0, 0, 0, 0])
            if not isinstance(bbox, list) or len(bbox) != 4:
                bbox = [0, 0, 0, 0]

            # Normalize type: "image" → "figure"
            if content_type == "image":
                content_type = "figure"

            items.append(
                ContentItem(
                    type=content_type,
                    text=text,
                    bbox=[float(v) for v in bbox],
                    page_idx=int(entry.get("page_idx", 0)),
                    text_level=entry.get("text_level"),
                )
            )

        logger.info("Parsed {} items from {}", len(items), path.name)
        return items

    def discover_books(self, mineru_output_dir: Path) -> dict[str, Path]:
        """Discover all book directories and their content_list.json paths.

        Args:
            mineru_output_dir: Root of MinerU output (data/mineru_output/).

        Returns:
            Dict mapping book_key to content_list.json path.
        """
        books: dict[str, Path] = {}

        if not mineru_output_dir.exists():
            logger.error("MinerU output dir not found: {}", mineru_output_dir)
            return books

        for book_dir in sorted(mineru_output_dir.iterdir()):
            if not book_dir.is_dir():
                continue
            book_key = book_dir.name

            # MinerU output structure: {book_key}/{book_key}/auto/{book_key}_content_list.json
            content_list = (
                book_dir / book_key / "auto" / f"{book_key}_content_list.json"
            )
            if content_list.exists():
                books[book_key] = content_list

        logger.info("Discovered {} books in {}", len(books), mineru_output_dir)
        return books
