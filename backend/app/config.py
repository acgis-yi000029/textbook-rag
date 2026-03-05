# Config module — central configuration for the Textbook Q&A system.
# Loads config.yaml and provides typed access to all settings.

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml


@dataclass(frozen=True)
class OllamaConfig:
    """Ollama LLM server settings."""

    host: str = "http://localhost:11434"
    model: str = "qwen2.5:0.5b"
    timeout: int = 30


@dataclass(frozen=True)
class EmbeddingConfig:
    """Sentence-transformer embedding model settings."""

    model: str = "Qwen/Qwen3-Embedding-0.6B"
    dimension: int = 1024


@dataclass(frozen=True)
class RetrievalConfig:
    """Retrieval pipeline settings."""

    top_k: int = 5
    rrf_k: int = 60
    parallel_timeout: int = 10
    methods: dict[str, bool] = field(
        default_factory=lambda: {
            "bm25": True,
            "semantic": True,
            "pageindex": True,
            "metadata": True,
        }
    )


@dataclass(frozen=True)
class ChunkingConfig:
    """Layout-aware chunking parameters."""

    max_tokens: int = 512
    overlap_tokens: int = 50


@dataclass(frozen=True)
class PathsConfig:
    """All filesystem paths, resolved relative to project root."""

    mineru_output: Path = Path("../../data/mineru_output")
    textbooks_dir: Path = Path("../../textbooks")
    sqlite_db: Path = Path("data/textbook_qa.db")
    chroma_db: Path = Path("data/chroma_db")
    pageindex_trees: Path = Path("data/pageindex_trees")


@dataclass(frozen=True)
class Config:
    """Top-level configuration container."""

    ollama: OllamaConfig = field(default_factory=OllamaConfig)
    embedding: EmbeddingConfig = field(default_factory=EmbeddingConfig)
    retrieval: RetrievalConfig = field(default_factory=RetrievalConfig)
    chunking: ChunkingConfig = field(default_factory=ChunkingConfig)
    paths: PathsConfig = field(default_factory=PathsConfig)
    project_root: Path = field(
        default_factory=lambda: Path(__file__).resolve().parent.parent
    )

    @classmethod
    def load(cls, config_path: Path | None = None) -> Config:
        """Load configuration from YAML file.

        Args:
            config_path: Path to config.yaml.  Defaults to backend/config.yaml.

        Returns:
            Populated Config instance with all paths resolved.
        """
        if config_path is None:
            # backend/app/config.py → backend/config.yaml
            config_path = Path(__file__).resolve().parent.parent / "config.yaml"

        raw: dict[str, Any] = {}
        if config_path.exists():
            with open(config_path, encoding="utf-8") as f:
                raw = yaml.safe_load(f) or {}

        project_root = config_path.resolve().parent  # backend/

        ollama_raw = raw.get("ollama", {})
        embedding_raw = raw.get("embedding", {})
        retrieval_raw = raw.get("retrieval", {})
        chunking_raw = raw.get("chunking", {})
        paths_raw = raw.get("paths", {})

        paths = PathsConfig(
            mineru_output=(
                project_root
                / paths_raw.get("mineru_output", "../../data/mineru_output")
            ).resolve(),
            textbooks_dir=(
                project_root / paths_raw.get("textbooks_dir", "../../textbooks")
            ).resolve(),
            sqlite_db=project_root / paths_raw.get("sqlite_db", "data/textbook_qa.db"),
            chroma_db=project_root / paths_raw.get("chroma_db", "data/chroma_db"),
            pageindex_trees=project_root
            / paths_raw.get("pageindex_trees", "data/pageindex_trees"),
        )

        return cls(
            ollama=OllamaConfig(
                host=ollama_raw.get("host", "http://localhost:11434"),
                model=ollama_raw.get("model", "qwen2.5:0.5b"),
                timeout=ollama_raw.get("timeout", 30),
            ),
            embedding=EmbeddingConfig(
                model=embedding_raw.get("model", "Qwen/Qwen3-Embedding-0.6B"),
                dimension=embedding_raw.get("dimension", 1024),
            ),
            retrieval=RetrievalConfig(
                top_k=retrieval_raw.get("top_k", 5),
                rrf_k=retrieval_raw.get("rrf_k", 60),
                parallel_timeout=retrieval_raw.get("parallel_timeout", 10),
                methods=retrieval_raw.get(
                    "methods",
                    {
                        "bm25": True,
                        "semantic": True,
                        "pageindex": True,
                        "metadata": True,
                    },
                ),
            ),
            chunking=ChunkingConfig(
                max_tokens=chunking_raw.get("max_tokens", 512),
                overlap_tokens=chunking_raw.get("overlap_tokens", 50),
            ),
            paths=paths,
            project_root=project_root,
        )
