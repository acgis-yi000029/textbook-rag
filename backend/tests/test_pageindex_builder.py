# Unit tests for PageIndex tree builder.
# Ref: okken, Python Testing with pytest, Ch3 — fixture-based test isolation
# Ref: Jurafsky, SLP3, Ch23 — document structure analysis

from __future__ import annotations

from pathlib import Path

from backend.app.indexing.pageindex_builder import PageIndexBuilder
from backend.app.models import ContentItem


class TestPageIndexBuilder:
    """Tests for PageIndexBuilder."""

    def test_build_tree_basic(self, sample_content_items: list[ContentItem]) -> None:
        """Build tree produces valid structure with book metadata."""
        builder = PageIndexBuilder()
        tree = builder.build_tree(sample_content_items, "test_book", "Test Book")
        assert tree["book_key"] == "test_book"
        assert tree["book_title"] == "Test Book"
        assert isinstance(tree["tree"], list)
        assert len(tree["tree"]) > 0

    def test_heading_hierarchy(self, sample_content_items: list[ContentItem]) -> None:
        """Level-1 headings are top-level; level-2 are children."""
        builder = PageIndexBuilder()
        tree = builder.build_tree(sample_content_items, "test_book", "Test Book")

        # First node should be the chapter heading (level 1)
        root = tree["tree"][0]
        assert root["level"] == 1
        assert "Introduction to Machine Learning" in root["title"]
        # Level-2 heading should be a child
        assert len(root["children"]) > 0
        child = root["children"][0]
        assert child["level"] == 2
        assert "Supervised Learning" in child["title"]

    def test_page_ranges_computed(
        self, sample_content_items: list[ContentItem]
    ) -> None:
        """Each node has page_start and page_end."""
        builder = PageIndexBuilder()
        tree = builder.build_tree(
            sample_content_items, "test_book", "Test Book", total_pages=10
        )
        for node in tree["tree"]:
            assert "page_start" in node
            assert "page_end" in node
            assert node["page_start"] <= node["page_end"]

    def test_save_and_load_roundtrip(
        self, sample_content_items: list[ContentItem], tmp_path: Path
    ) -> None:
        """Save then load produces identical tree data."""
        builder = PageIndexBuilder()
        tree = builder.build_tree(sample_content_items, "test_book", "Test Book")
        saved_path = builder.save_tree(tree, tmp_path)
        loaded = builder.load_tree(saved_path)
        assert loaded["book_key"] == tree["book_key"]
        assert len(loaded["tree"]) == len(tree["tree"])

    def test_load_all_trees(
        self, sample_content_items: list[ContentItem], tmp_path: Path
    ) -> None:
        """load_all_trees() discovers and loads all JSON files."""
        builder = PageIndexBuilder()
        tree1 = builder.build_tree(sample_content_items, "book_a", "Book A")
        tree2 = builder.build_tree(sample_content_items, "book_b", "Book B")
        builder.save_tree(tree1, tmp_path)
        builder.save_tree(tree2, tmp_path)

        trees = builder.load_all_trees(tmp_path)
        assert len(trees) == 2
        assert "book_a" in trees
        assert "book_b" in trees

    def test_empty_items_produces_empty_tree(self) -> None:
        """No headings produces a tree with 0 nodes."""
        builder = PageIndexBuilder()
        items = [
            ContentItem(type="text", text="just text", bbox=[0, 0, 0, 0], page_idx=0),
        ]
        tree = builder.build_tree(items, "test", "Test")
        assert tree["tree"] == []

    def test_load_all_nonexistent_dir(self, tmp_path: Path) -> None:
        """Nonexistent directory returns empty dict."""
        builder = PageIndexBuilder()
        trees = builder.load_all_trees(tmp_path / "nope")
        assert trees == {}
