"""
Build ChromaDB vector store from existing SQLite database using GPU acceleration.

Prerequisites:
    - Run rebuild_db.py --skip-vectors first (or rebuild_db.py has already populated SQLite).
    - PyTorch with CUDA support installed (confirmed: RTX 4060, CUDA 12.8, torch 2.10+cu128).

Features:
    - Reads chunks directly from SQLite (no re-parsing of MinerU output).
    - Uses sentence-transformers on CUDA device for fast GPU embedding.
    - Batches embedding in configurable chunk sizes (default 256 for VRAM balance).
    - Idempotent: nukes and rebuilds ChromaDB from scratch on each run.
    - Progress bar via tqdm.

Usage:
    uv run python scripts/build_vectors.py
    uv run python scripts/build_vectors.py --batch-size 512   # bigger batch (more VRAM)
    uv run python scripts/build_vectors.py --model all-mpnet-base-v2  # higher quality model
    uv run python scripts/build_vectors.py --dry-run          # verify GPU without writing
"""

from __future__ import annotations

import argparse
import shutil
import sqlite3
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "textbook_rag.sqlite3"
CHROMA_DIR = BASE_DIR / "data" / "chroma_persist"

# Default model — same family as the default ChromaDB embedding function
# but run locally on GPU instead of CPU.
# all-MiniLM-L6-v2  : fast, 384-dim, good for retrieval (compatible with existing collection)
# all-mpnet-base-v2 : slower, 768-dim, higher quality
DEFAULT_MODEL = "all-MiniLM-L6-v2"
COLLECTION_NAME = "textbook_chunks"


def check_gpu() -> str:
    """Verify CUDA is available and return device string."""
    import torch  # noqa: PLC0415

    if not torch.cuda.is_available():
        print("  ⚠ CUDA not available — will use CPU (slower)")
        return "cpu"
    gpu_name = torch.cuda.get_device_name(0)
    vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
    print(f"  ✅ GPU: {gpu_name} ({vram_gb:.1f} GB VRAM)")
    return "cuda"


def load_chunks_from_sqlite() -> list[dict]:
    """Load all chunks from the SQLite database."""
    if not DB_PATH.exists():
        raise FileNotFoundError(
            f"SQLite database not found: {DB_PATH}\n"
            "Run `uv run python scripts/rebuild_db.py --skip-vectors` first."
        )

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """
        SELECT
            c.id,
            c.chunk_id,
            c.chroma_document_id,
            c.text,
            c.content_type,
            c.primary_page_id,
            b.book_id,
            COALESCE(p.page_number, 0) AS page_idx,
            ch.chapter_key,
            COALESCE(sl.x0, 0) AS bbox_x0,
            COALESCE(sl.y0, 0) AS bbox_y0,
            COALESCE(sl.x1, 0) AS bbox_x1,
            COALESCE(sl.y1, 0) AS bbox_y1,
            COALESCE(p.width, 0)  AS page_width,
            COALESCE(p.height, 0) AS page_height
        FROM chunks c
        JOIN books b ON b.id = c.book_id
        LEFT JOIN pages p ON p.id = c.primary_page_id
        LEFT JOIN chapters ch ON ch.id = c.chapter_id
        LEFT JOIN source_locators sl ON sl.chunk_id = c.id
        WHERE c.text != ''
        ORDER BY c.id
        """
    ).fetchall()
    conn.close()

    return [dict(r) for r in rows]


def build_chroma_gpu(
    chunks: list[dict],
    model_name: str,
    device: str,
    batch_size: int,
) -> None:
    """Embed chunks on GPU and insert into ChromaDB."""
    try:
        import chromadb  # noqa: PLC0415
        from sentence_transformers import SentenceTransformer  # noqa: PLC0415
    except ImportError as e:
        raise ImportError(f"Missing dependency: {e}. Run `uv add chromadb sentence-transformers`.") from e

    # ── Load embedding model on GPU ──
    print(f"\n🤖 Loading model '{model_name}' on {device}...")
    t0 = time.time()
    model = SentenceTransformer(model_name, device=device)
    print(f"  Model loaded in {time.time() - t0:.1f}s")

    # ── (Re)create ChromaDB collection ──
    print(f"\n🗑  Clearing ChromaDB at {CHROMA_DIR}...")
    if CHROMA_DIR.exists():
        shutil.rmtree(CHROMA_DIR)
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
    print(f"  Collection '{COLLECTION_NAME}' created")

    # ── Embed and insert in batches ──
    total = len(chunks)
    print(f"\n🔮 Embedding {total:,} chunks (batch_size={batch_size}, device={device})...")

    inserted = 0
    t_start = time.time()

    for i in range(0, total, batch_size):
        batch = chunks[i : i + batch_size]
        texts = [c["text"][:8000] for c in batch]  # ChromaDB doc limit

        # GPU embedding — returns numpy array
        embeddings = model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,  # for cosine similarity
        )

        ids = [c["chroma_document_id"] or c["chunk_id"] for c in batch]
        metadatas = []
        for c in batch:
            meta = {
                "book_id": c["book_id"],
                "chunk_id": c["chunk_id"],
                "page_idx": int(c["page_idx"]),
                "content_type": c["content_type"],
                "bbox_x0": float(c.get("bbox_x0", 0)),
                "bbox_y0": float(c.get("bbox_y0", 0)),
                "bbox_x1": float(c.get("bbox_x1", 0)),
                "bbox_y1": float(c.get("bbox_y1", 0)),
                "page_width": float(c.get("page_width", 0)),
                "page_height": float(c.get("page_height", 0)),
            }
            # ChromaDB metadata values must not be None
            if c.get("chapter_key"):
                meta["chapter_key"] = c["chapter_key"]
            metadatas.append(meta)

        collection.add(
            ids=ids,
            embeddings=embeddings.tolist(),
            documents=texts,
            metadatas=metadatas,
        )

        inserted += len(batch)
        elapsed = time.time() - t_start
        rate = inserted / elapsed
        eta = (total - inserted) / rate if rate > 0 else 0
        print(
            f"  [{inserted:>6}/{total}] "
            f"{inserted/total*100:5.1f}% | "
            f"{rate:.0f} chunks/s | "
            f"ETA {eta/60:.1f} min"
        )

    total_elapsed = time.time() - t_start
    print(f"\n✅ ChromaDB built: {collection.count():,} vectors")
    print(f"   Time: {total_elapsed/60:.1f} min  ({total/total_elapsed:.0f} chunks/s avg)")
    print(f"   Path: {CHROMA_DIR}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build ChromaDB vector store with GPU")
    parser.add_argument(
        "--model", default=DEFAULT_MODEL,
        help=f"SentenceTransformer model name (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--batch-size", type=int, default=256,
        help="Embedding batch size (default: 256). Increase for more VRAM usage.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Check GPU and count chunks, but do not write to ChromaDB.",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("Build ChromaDB Vectors (GPU-accelerated)")
    print("=" * 60)

    # Check GPU
    print("\n🖥  Checking GPU...")
    device = check_gpu()

    # Load chunks
    print(f"\n📦 Loading chunks from {DB_PATH.name}...")
    chunks = load_chunks_from_sqlite()
    print(f"  {len(chunks):,} chunks loaded")

    if args.dry_run:
        print("\n--dry-run: stopping here (no ChromaDB writes).")
        return

    # Build
    build_chroma_gpu(
        chunks=chunks,
        model_name=args.model,
        device=device,
        batch_size=args.batch_size,
    )

    print("\n🎉 Done! You can now start the backend server.")
    print("   uv run uvicorn backend.app.main:app --reload")


if __name__ == "__main__":
    main()
