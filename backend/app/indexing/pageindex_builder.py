# PageIndex tree builder — hierarchical TOC tree from MinerU headings.
# Inspired by VectifyAI/PageIndex: LLM-guided section navigation.
# Ref: Jurafsky, SLP3, Ch23 — Document structure analysis

from __future__ import annotations

import json
from pathlib import Path

from loguru import logger

from backend.app.models import ContentItem, PageIndexNode


class PageIndexBuilder:
    """Build hierarchical table-of-contents trees from content items."""

    def build_tree(
        self,
        items: list[ContentItem],
        book_key: str,
        book_title: str,
        total_pages: int | None = None,
    ) -> dict:
        """Build a TOC tree from heading items.

        Extracts level-1 and level-2 headings, organizes them hierarchically,
        and computes page ranges for each node.

        Args:
            items: All content items for a book.
            book_key: Book identifier.
            book_title: Human-readable title.
            total_pages: Total pages in PDF (for last node's page_end).

        Returns:
            Serializable dict with book metadata and tree structure.
        """
        if total_pages is None:
            total_pages = max((item.page_idx for item in items), default=0) + 1

        # Extract headings
        headings = [
            item for item in items if item.text_level in (1, 2) and item.text.strip()
        ]

        # Build tree: level-1 nodes are top-level, level-2 are children
        root_nodes: list[PageIndexNode] = []
        current_l1: PageIndexNode | None = None

        for heading in headings:
            node = PageIndexNode(
                title=heading.text.strip(),
                level=heading.text_level,
                page_start=heading.page_idx,
            )

            if heading.text_level == 1:
                current_l1 = node
                root_nodes.append(node)
            elif heading.text_level == 2 and current_l1 is not None:
                current_l1.children.append(node)
            else:
                # Orphan level-2 or level-3 heading: attach as root
                root_nodes.append(node)

        # Compute page_end for each node
        self._compute_page_ends(root_nodes, total_pages)

        tree_dict = {
            "book_key": book_key,
            "book_title": book_title,
            "total_pages": total_pages,
            "tree": [self._node_to_dict(n) for n in root_nodes],
        }

        logger.info(
            "Built PageIndex tree for {}: {} top-level nodes",
            book_key,
            len(root_nodes),
        )
        return tree_dict

    def save_tree(self, tree: dict, output_dir: Path) -> Path:
        """Save a tree to a JSON file.

        Returns:
            Path to the saved JSON file.
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{tree['book_key']}.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(tree, f, indent=2, ensure_ascii=False)
        return output_path

    def load_tree(self, path: Path) -> dict:
        """Load a tree from a JSON file."""
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    def load_all_trees(self, trees_dir: Path) -> dict[str, dict]:
        """Load all trees from a directory.

        Returns:
            Dict mapping book_key to tree dict.
        """
        trees: dict[str, dict] = {}
        if not trees_dir.exists():
            return trees

        for path in sorted(trees_dir.glob("*.json")):
            tree = self.load_tree(path)
            trees[tree["book_key"]] = tree

        logger.info("Loaded {} PageIndex trees", len(trees))
        return trees

    def _compute_page_ends(self, nodes: list[PageIndexNode], max_page: int) -> None:
        """Set page_end for each node based on the next sibling's page_start."""
        for i, node in enumerate(nodes):
            if i + 1 < len(nodes):
                node.page_end = nodes[i + 1].page_start - 1
            else:
                node.page_end = max_page

            if node.children:
                self._compute_page_ends(node.children, node.page_end)

    def _node_to_dict(self, node: PageIndexNode) -> dict:
        """Convert a node to a serializable dict."""
        return {
            "title": node.title,
            "level": node.level,
            "page_start": node.page_start,
            "page_end": node.page_end,
            "children": [self._node_to_dict(c) for c in node.children],
        }
