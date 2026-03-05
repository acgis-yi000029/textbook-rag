# Shared test fixtures for backend unit tests.
# Ref: okken, Python Testing with pytest, Ch3 — fixtures for setup and teardown

from __future__ import annotations

import json
from pathlib import Path

import pytest

from backend.app.models import Chunk, ContentItem


# ─── Fixture: Sample ContentItems ─────────────────────────────────
@pytest.fixture
def sample_content_items() -> list[ContentItem]:
    """Create sample ContentItems simulating MinerU output."""
    return [
        ContentItem(
            type="text",
            text="Chapter 1: Introduction to Machine Learning",
            bbox=[72.0, 100.0, 540.0, 120.0],
            page_idx=0,
            text_level=1,
        ),
        ContentItem(
            type="text",
            text="Machine learning is a branch of artificial intelligence that focuses on "
            "building systems that learn from data. Unlike traditional programming where "
            "rules are explicitly coded, ML systems discover patterns automatically.",
            bbox=[72.0, 140.0, 540.0, 200.0],
            page_idx=0,
        ),
        ContentItem(
            type="text",
            text="1.1 Supervised Learning",
            bbox=[72.0, 220.0, 540.0, 240.0],
            page_idx=1,
            text_level=2,
        ),
        ContentItem(
            type="text",
            text="In supervised learning, the algorithm is trained on labeled data. "
            "Each training example consists of an input vector and a desired output value. "
            "The goal is to learn a mapping from inputs to outputs.",
            bbox=[72.0, 260.0, 540.0, 320.0],
            page_idx=1,
        ),
        ContentItem(
            type="table",
            text="| Algorithm | Type | Use Case |\n|---|---|---|\n"
            "| Linear Regression | Regression | Price prediction |\n"
            "| SVM | Classification | Image recognition |",
            bbox=[72.0, 340.0, 540.0, 440.0],
            page_idx=2,
        ),
        ContentItem(
            type="formula",
            text="y = w^T x + b",
            bbox=[200.0, 460.0, 400.0, 490.0],
            page_idx=2,
        ),
    ]


# ─── Fixture: Sample Chunks ──────────────────────────────────────
@pytest.fixture
def sample_chunks() -> list[Chunk]:
    """Pre-built chunks for testing indexers and retrievers."""
    return [
        Chunk(
            chunk_id="test_book_p0_0",
            book_key="test_book",
            book_title="Test ML Book",
            chapter="Chapter 1: Introduction to Machine Learning",
            section="",
            page_number=0,
            content_type="text",
            text="Machine learning is a branch of artificial intelligence that focuses on "
            "building systems that learn from data.",
            bbox=[72.0, 140.0, 540.0, 200.0],
            token_count=25,
        ),
        Chunk(
            chunk_id="test_book_p1_1",
            book_key="test_book",
            book_title="Test ML Book",
            chapter="Chapter 1: Introduction to Machine Learning",
            section="1.1 Supervised Learning",
            page_number=1,
            content_type="text",
            text="In supervised learning, the algorithm is trained on labeled data. "
            "Each training example consists of an input vector and a desired output value.",
            bbox=[72.0, 260.0, 540.0, 320.0],
            token_count=30,
        ),
        Chunk(
            chunk_id="test_book_p2_2",
            book_key="test_book",
            book_title="Test ML Book",
            chapter="Chapter 1: Introduction to Machine Learning",
            section="1.1 Supervised Learning",
            page_number=2,
            content_type="table",
            text="| Algorithm | Type | Use Case |\n|---|---|---|\n"
            "| Linear Regression | Regression | Price prediction |\n"
            "| SVM | Classification | Image recognition |",
            bbox=[72.0, 340.0, 540.0, 440.0],
            token_count=20,
        ),
        Chunk(
            chunk_id="test_book_p2_3",
            book_key="test_book",
            book_title="Test ML Book",
            chapter="Chapter 1: Introduction to Machine Learning",
            section="1.1 Supervised Learning",
            page_number=2,
            content_type="formula",
            text="y = w^T x + b",
            bbox=[200.0, 460.0, 400.0, 490.0],
            token_count=5,
        ),
    ]


# ─── Fixture: Temporary directory ────────────────────────────────
@pytest.fixture
def tmp_data_dir(tmp_path: Path) -> Path:
    """Create a temporary data directory structure for tests."""
    (tmp_path / "chroma_db").mkdir()
    (tmp_path / "pageindex_trees").mkdir()
    return tmp_path


# ─── Fixture: Sample content_list.json ───────────────────────────
@pytest.fixture
def sample_content_list_json(tmp_path: Path) -> Path:
    """Create a sample content_list.json file for parser tests."""
    items = [
        {
            "type": "text",
            "text": "Chapter 1: Introduction",
            "bbox": [72.0, 100.0, 540.0, 120.0],
            "page_idx": 0,
            "text_level": 1,
        },
        {
            "type": "text",
            "text": "This is the introduction text.",
            "bbox": [72.0, 140.0, 540.0, 200.0],
            "page_idx": 0,
        },
        {"type": "discarded", "text": "page header garbage", "page_idx": 0},
        {
            "type": "text",
            "text": "",
            "bbox": [0, 0, 0, 0],
            "page_idx": 0,
        },
        {
            "type": "table",
            "text": "| A | B |\n|---|---|\n| 1 | 2 |",
            "bbox": [72.0, 300.0, 540.0, 400.0],
            "page_idx": 1,
        },
        {
            "type": "image",
            "text": "Figure 1: Architecture diagram",
            "bbox": [72.0, 420.0, 540.0, 600.0],
            "page_idx": 1,
        },
    ]
    content_list_path = tmp_path / "test_content_list.json"
    with open(content_list_path, "w", encoding="utf-8") as f:
        json.dump(items, f)
    return content_list_path
