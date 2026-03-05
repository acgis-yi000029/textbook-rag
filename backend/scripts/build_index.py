# Build index pipeline — processes all books and builds all indexes.
# Run: uv run python -m backend.scripts.build_index
# Ref: Google SWE, Ch12 — batch processing with progress tracking

from __future__ import annotations

import sys
import time
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from loguru import logger

from backend.app.config import Config
from backend.app.indexing.chroma_indexer import ChromaIndexer
from backend.app.indexing.pageindex_builder import PageIndexBuilder
from backend.app.indexing.sqlite_indexer import SQLiteIndexer
from backend.app.preprocessing.chunker import BOOK_TITLES, LayoutAwareChunker
from backend.app.preprocessing.parser import MinerUParser


def main() -> None:
    """Run the full indexing pipeline."""
    config = Config.load()
    logger.info("Starting index build pipeline")
    logger.info("MinerU output: {}", config.paths.mineru_output)
    logger.info("SQLite DB: {}", config.paths.sqlite_db)
    logger.info("ChromaDB: {}", config.paths.chroma_db)
    logger.info("PageIndex trees: {}", config.paths.pageindex_trees)

    # Initialize components
    parser = MinerUParser()
    chunker = LayoutAwareChunker(
        max_tokens=config.chunking.max_tokens,
        overlap_tokens=config.chunking.overlap_tokens,
    )
    sqlite_indexer = SQLiteIndexer(config.paths.sqlite_db)
    chroma_indexer = ChromaIndexer(
        config.paths.chroma_db,
        model_name=config.embedding.model,
    )
    pageindex_builder = PageIndexBuilder()

    # Discover books
    books = parser.discover_books(config.paths.mineru_output)
    total = len(books)
    logger.info("Found {} books to process", total)

    if total == 0:
        logger.error("No books found! Check mineru_output path.")
        return

    # Process each book
    total_chunks = 0
    failed: list[str] = []
    start_time = time.time()

    for idx, (book_key, content_list_path) in enumerate(books.items(), 1):
        logger.info("Processing {}/{}: {}", idx, total, book_key)
        book_title = BOOK_TITLES.get(book_key, book_key.replace("_", " ").title())

        try:
            # Parse
            items = parser.parse_content_list(content_list_path)
            if not items:
                logger.warning("No items parsed for {}, skipping", book_key)
                failed.append(book_key)
                continue

            # Chunk
            chunks = chunker.chunk(items, book_key)
            logger.info("  → {} items → {} chunks", len(items), len(chunks))

            # SQLite index
            sqlite_count = sqlite_indexer.index_chunks(chunks, book_key, book_title)

            # ChromaDB index
            chroma_count = chroma_indexer.index_chunks(chunks)

            # PageIndex tree
            tree = pageindex_builder.build_tree(items, book_key, book_title)
            pageindex_builder.save_tree(tree, config.paths.pageindex_trees)

            total_chunks += len(chunks)
            logger.info(
                "  ✅ SQLite: {}, ChromaDB: {}, PageIndex: {} nodes",
                sqlite_count, chroma_count, len(tree.get("tree", [])),
            )

        except Exception as exc:
            logger.error("  ❌ Failed to process {}: {}", book_key, exc)
            failed.append(book_key)
            continue

    elapsed = time.time() - start_time
    logger.info("=" * 60)
    logger.info("Index build complete in {:.1f}s", elapsed)
    logger.info("Total chunks: {}", total_chunks)
    logger.info("SQLite chunks: {}", sqlite_indexer.total_chunks())
    logger.info("ChromaDB chunks: {}", chroma_indexer.count())
    logger.info("Successes: {}/{}", total - len(failed), total)

    if failed:
        logger.warning("Failed books: {}", ", ".join(failed))

    sqlite_indexer.close()


if __name__ == "__main__":
    main()
