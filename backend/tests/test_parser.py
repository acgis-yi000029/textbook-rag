# Unit tests for MinerU content_list.json parser.
# Ref: okken, Python Testing with pytest, Ch2 — writing test functions
# Ref: Manning, Intro to IR, Ch2 — document preprocessing validation

from __future__ import annotations

import json
from pathlib import Path

from backend.app.preprocessing.parser import MinerUParser


class TestMinerUParser:
    """Tests for MinerUParser.parse_content_list()."""

    def test_parse_valid_content_list(self, sample_content_list_json: Path) -> None:
        """Valid JSON is parsed correctly, 'discarded' and empty items are filtered."""
        parser = MinerUParser()
        items = parser.parse_content_list(sample_content_list_json)

        # Should have 4 valid items (1 heading, 1 text, 1 table, 1 figure)
        # Empty text item and "discarded" type are filtered out
        assert len(items) == 4

    def test_discarded_items_filtered(self, sample_content_list_json: Path) -> None:
        """Items with type='discarded' are excluded."""
        parser = MinerUParser()
        items = parser.parse_content_list(sample_content_list_json)
        types = [item.type for item in items]
        assert "discarded" not in types

    def test_empty_text_filtered(self, sample_content_list_json: Path) -> None:
        """Items with empty text are excluded."""
        parser = MinerUParser()
        items = parser.parse_content_list(sample_content_list_json)
        for item in items:
            assert item.text.strip() != ""

    def test_image_normalized_to_figure(self, sample_content_list_json: Path) -> None:
        """Image type is normalized to 'figure'."""
        parser = MinerUParser()
        items = parser.parse_content_list(sample_content_list_json)
        types = [item.type for item in items]
        assert "image" not in types
        assert "figure" in types

    def test_text_level_preserved(self, sample_content_list_json: Path) -> None:
        """text_level field is preserved for headings."""
        parser = MinerUParser()
        items = parser.parse_content_list(sample_content_list_json)
        heading = items[0]
        assert heading.text_level == 1

    def test_bbox_validated(self, sample_content_list_json: Path) -> None:
        """Bounding boxes are 4-element float lists."""
        parser = MinerUParser()
        items = parser.parse_content_list(sample_content_list_json)
        for item in items:
            assert len(item.bbox) == 4
            assert all(isinstance(v, float) for v in item.bbox)

    def test_nonexistent_file_returns_empty(self, tmp_path: Path) -> None:
        """Missing file returns empty list without crashing."""
        parser = MinerUParser()
        items = parser.parse_content_list(tmp_path / "nonexistent.json")
        assert items == []

    def test_page_idx_preserved(self, sample_content_list_json: Path) -> None:
        """Page index is correctly parsed from content items."""
        parser = MinerUParser()
        items = parser.parse_content_list(sample_content_list_json)
        # First two items on page 0, last two on page 1
        assert items[0].page_idx == 0
        assert items[1].page_idx == 0
        assert items[2].page_idx == 1

    def test_invalid_bbox_gets_default(self, tmp_path: Path) -> None:
        """Invalid bbox (wrong length) gets default [0,0,0,0]."""
        content = [
            {"type": "text", "text": "Hello", "bbox": [1, 2], "page_idx": 0},
        ]
        path = tmp_path / "bad_bbox.json"
        with open(path, "w") as f:
            json.dump(content, f)

        parser = MinerUParser()
        items = parser.parse_content_list(path)
        assert items[0].bbox == [0, 0, 0, 0]


class TestMinerUParserDiscover:
    """Tests for MinerUParser.discover_books()."""

    def test_discover_empty_dir(self, tmp_path: Path) -> None:
        """Empty directory returns empty dict."""
        parser = MinerUParser()
        books = parser.discover_books(tmp_path)
        assert books == {}

    def test_discover_nonexistent_dir(self, tmp_path: Path) -> None:
        """Nonexistent directory returns empty dict."""
        parser = MinerUParser()
        books = parser.discover_books(tmp_path / "no_such_dir")
        assert books == {}

    def test_discover_valid_structure(self, tmp_path: Path) -> None:
        """Correctly structured book directories are discovered."""
        # Create MinerU-style directory structure
        book_key = "test_book"
        content_dir = tmp_path / book_key / book_key / "auto"
        content_dir.mkdir(parents=True)
        content_list = content_dir / f"{book_key}_content_list.json"
        content_list.write_text("[]")

        parser = MinerUParser()
        books = parser.discover_books(tmp_path)
        assert book_key in books
        assert books[book_key] == content_list
