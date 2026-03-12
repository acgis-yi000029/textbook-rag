---
topic: retrieval_lab
dimension: code
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📚 Book: [manning_intro_to_ir.pdf](../../textbooks/manning_intro_to_ir.pdf) — Ch.11 (BM25)"
  - "📖 Docs: [rank_bm25](https://github.com/dorianbrown/rank_bm25)"
  - "📖 Docs: [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)"
  - "💻 Source: [retrieval_lab](../../retrieval_lab/) — retrievers/*.py"
expiry: 6m
status: current
---

# Retrieval Lab 代码参考

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf) + 📖 Docs: [rank_bm25](https://github.com/dorianbrown/rank_bm25)

---


## 快速开始

### 最简示例 — 30 秒上手

```bash
# 运行单个查询（默认 ensemble 方法，sutton 教科书）
# Run a single query (default: ensemble method, sutton textbook)
uv run python retrieval_lab/scripts/run_query.py --book sutton "kernel trick"

# 运行 Vector (RAG) 语义检索（需 Ollama 后台运行，下载过向量）
# Run Vector semantic retrieval (requires Ollama)
uv run python retrieval_lab/scripts/run_query.py --book sutton --method vector "how does temporal difference work"

# 运行 Sirchmunk 原文 grep（需 rga）
# Run Sirchmunk grep search (requires rga)
uv run python retrieval_lab/scripts/run_query.py --book sutton --method sirchmunk "TD(lambda)"

# 运行基准评测（对比所有方法，包含新加的 vector/sirchmunk）
# Run benchmark (compare all methods including vector/sirchmunk)
uv run python retrieval_lab/scripts/benchmark.py --book sutton --include-vector --include-sirchmunk
```

> 💻 Source: [retrieval_lab](../../retrieval_lab/) `README.md`

---


## 完整实现示例

### 示例 1: RetrievalResult 数据类（核心数据结构）

```python
# 文件: retrievers/base.py
# File: retrievers/base.py
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class RetrievalResult:
    """检索结果数据容器 / Retrieval result data container"""
    doc_id: str          # 文档唯一 ID / Unique document ID
    score: float         # 检索分数 / Retrieval relevance score
    title: str           # 文档标题 / Document title
    book: str            # 所属教科书 / Source textbook key
    method: str          # 检索方法名 / Retrieval method name
    text: str = ""       # 文档正文片段 / Document text snippet
    page: int | None = None  # 页码 / Page number (optional)
    meta: dict[str, Any] = field(default_factory=dict)  # 额外元数据 / Extra metadata

    def to_dict(self) -> dict[str, Any]:
        """转换为字典（方便 JSON 序列化）/ Convert to dict for JSON serialization"""
        return asdict(self)
```

> 💻 Source: `retrievers/base.py`

### 示例 2: BaseRetriever 抽象基类

```python
# 文件: retrievers/base.py
# File: retrievers/base.py

class BaseRetriever:
    """所有检索器的基类 / Base class for all retrievers
    
    新增检索器只需:
    1. 继承此类 / Inherit from this class
    2. 设置 name 属性 / Set name attribute
    3. 实现 search() 方法 / Implement search() method
    """
    name = "base"

    def search(self, query: str, top_k: int = 10) -> list[RetrievalResult]:
        """执行检索 / Execute retrieval search
        
        Args:
            query: 用户查询字符串 / User query string
            top_k: 返回最多 K 个结果 / Return at most K results
        Returns:
            按相关性降序排列的结果列表 / Results sorted by relevance (descending)
        """
        raise NotImplementedError
```

> 💻 Source: `retrievers/base.py`

### 示例 3: VectorRetriever（语义检索）

```python
# 文件: retrievers/vector_retriever.py
# File: retrievers/vector_retriever.py
import json
import numpy as np
from pathlib import Path
from .base import BaseRetriever, RetrievalResult

class VectorRetriever(BaseRetriever):
    """标准 RAG 语义向量检索：Ollama embed → cosine similarity → top-k"""
    name = "vector"

    def __init__(self, vectors_path: Path, book: str, ollama_base="http://localhost:11434"):
        self.book = book
        self.ollama_base = ollama_base
        self.embed_model = "nomic-embed-text"
        
        with open(vectors_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        self.chunks = data["chunks"]
        embeddings = [c["embedding"] for c in data["chunks"]]
        self.vecs = np.array(embeddings, dtype=np.float32)

    def _get_query_embedding(self, query: str) -> np.ndarray:
        import httpx
        resp = httpx.post(
            f"{self.ollama_base}/api/embed",
            json={"model": self.embed_model, "input": [query]},
            timeout=30,
        )
        return np.array(resp.json()["embeddings"][0], dtype=np.float32)

    @staticmethod
    def _cosine_sim(a: np.ndarray, b: np.ndarray) -> np.ndarray:
        """Batch cosine similarity"""
        a_norm = a / (np.linalg.norm(a) + 1e-10)
        b_norm = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-10)
        return b_norm @ a_norm

    def search(self, query: str, top_k: int = 10) -> list[RetrievalResult]:
        if len(self.chunks) == 0: return []
        
        q_emb = self._get_query_embedding(query)
        sims = self._cosine_sim(q_emb, self.vecs) # 计算相似度计算 (cosine similarity)
        top_idx = np.argsort(sims)[-top_k:][::-1] # Numpy top-k 技巧
        
        return [
            RetrievalResult(
                doc_id=f"{self.book}:vector:{self.chunks[i]['id']}",
                score=float(sims[i]),
                title=self.chunks[i].get("chapter_title", self.book),
                book=self.book, method=self.name,
                text=self.chunks[i].get("text", ""),
                page=self.chunks[i].get("page"),
            ) for i in top_idx
        ]
```

> 💻 Source: `retrievers/vector_retriever.py`

### 示例 4: SirchmunkRetriever（rga 全文搜索）

```python
# 文件: retrievers/sirchmunk_retriever.py
# File: retrievers/sirchmunk_retriever.py
import re, json, subprocess
from .base import BaseRetriever, RetrievalResult

class SirchmunkRetriever(BaseRetriever):
    """基于 ripgrep-all (rga) 的全文 grep 检索"""
    name = "sirchmunk"

    def search(self, query: str, top_k: int = 10) -> list[RetrievalResult]:
        terms = re.findall(r"[a-zA-Z0-9]+", query)
        if not terms: return []
        pattern = "|".join(re.escape(t) for t in terms)  # OR pattern

        # 调用 rga，返回 JSON / Run rga, return JSON
        cmd = ["rga", "--no-config", "--json", "-i", pattern, str(self.source_md)]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, text=True, check=False)
        
        matches = [json.loads(line) for line in res.stdout.strip().splitlines() 
                  if "{" in line and json.loads(line).get("type") == "match"]
        
        results = []
        for idx, match in enumerate(matches):
            text = match.get("data", {}).get("lines", {}).get("text", "").strip()
            # 统计命中词频作为分数 / Score by term match count
            term_hits = sum(1 for t in terms if t.lower() in text.lower())
            score = term_hits / max(len(terms), 1)
            
            results.append(RetrievalResult(
                doc_id=f"{self.book}:sirchmunk:{idx}",
                score=score, title=self.book, book=self.book, method=self.name,
                text=text[:500], meta={"line_number": match["data"].get("line_number")}
            ))
            
        results.sort(key=lambda r: (-r.score, r.meta.get("line_number", 0)))
        return results[:top_k]
```

> 💻 Source: `retrievers/sirchmunk_retriever.py`

### 示例 5: 工厂函数 build_retriever

```python
# 文件: common.py — 加载配置和构建检索器的入口
# File: common.py — Entry point for loading config and building retrievers
from retrieval_lab.retrievers import (BM25Retriever, EnsembleRetriever, 
                                      TOCRetriever, PageIndexRetriever, 
                                      VectorRetriever, SirchmunkRetriever)

def build_retriever(book: str, method: str):
    """检索器工厂函数 / Retriever factory function"""
    # ... 省略配置文件加载路径
    
    if method == "bm25":
        return BM25Retriever(data_dir / "bm25" / f"{book}_bm25.pkl", book)
    if method == "toc":
        return TOCRetriever(data_dir / "toc_index.json", book)
    if method == "ensemble":
        bm25 = BM25Retriever(data_dir / "bm25" / f"{book}_bm25.pkl", book)
        toc = TOCRetriever(data_dir / "toc_index.json", book)
        return EnsembleRetriever([bm25, toc], rrf_k=config.RRF_K)
        
    if method == "pageindex":
        return PageIndexRetriever(data_dir / "pageindex" / f"{book}_structure.json", book)
        
    if method == "vector":
        vectors_path = data_dir / "vectors" / f"{book}_vectors.json"
        return VectorRetriever(vectors_path, book, ollama_base="http://localhost:11434")
        
    if method == "sirchmunk":
        books_dir = data_dir / "sirchmunk" / "books"
        return SirchmunkRetriever(books_dir, book)
        
    raise ValueError(f"Unsupported method: {method}")
```

> 💻 Source: `common.py`

---


## API 速查

### RetrievalResult 字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `doc_id` | `str` | 必填 | 格式: `{book}:{method}:{id}` |
| `score` | `float` | 必填 | 相关性得分，根据 method 算法不同而异 |
| `title` | `str` | 必填 | 章节标题 |
| `book` | `str` | 必填 | 教科书 key |
| `method` | `str` | 必填 | 产生结果的方法名 |
| `text` | `str` | `""` | 文档正文片段 |
| `page` | `int \| None` | `None` | 页码 (TOC/Vector 支持，PageIndex/Sirchmunk 在行号 meta 里) |
| `meta` | `dict` | `{}` | 额外元数据（如 `line_num`） |

### BaseRetriever 方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `search()` | `search(query: str, top_k: int = 10) -> list[RetrievalResult]` | 子类实现检索逻辑，保证返回标准化数据类 |

### 脚本 CLI 参数

| 脚本 | 参数 | 默认值 | 说明 |
|------|------|--------|------|
| `run_query.py` | `query` | 必填 | 查询文本 |
| | `--book` | `barber` | 教科书 key |
| | `--method` | `ensemble` | `bm25 \| toc \| ensemble \| pageindex \| vector \| sirchmunk` |
| | `--top-k` | `5` | 返回结果数 |
| `benchmark.py` | `--book` | `barber` | 教科书 key |
| | `--top-k` | `5` | 评测 top-k |
| | `--include-vector`| `False` | 是否评测 Vector（需要模型下载 + Ollama 后台） |
| | `--include-sirchmunk`| `False` | 是否评测 Sirchmunk（需要 rga 安装） |
| `prepare_book_data.py` | `--book` | `sutton` | 教科书 key |

> 💻 Source: 各脚本 `argparse` 定义

---


## 目录结构模板

### 完整检索实验结构

```
retrieval_lab/
├── README.md                        ← 项目说明
├── common.py                        ← 配置加载 + 工厂函数 (build_retriever)
├── retrievers/                      ← 检索模型库
│   ├── __init__.py                  ← 导出所有检索器类
│   ├── base.py                      ← BaseRetriever + RetrievalResult 定义
│   ├── bm25_retriever.py            ← BM25 词法全文检索 (依赖 pickle)
│   ├── toc_retriever.py             ← TOC 目录匹配 (依赖 json)
│   ├── pageindex_retriever.py       ← 结构树节点匹配 (行号级定位)
│   ├── vector_retriever.py          ← 语义检索 (依赖 Ollama嵌入 + 余弦相似度)
│   ├── sirchmunk_retriever.py       ← grep检索 (依赖 ripgrep-all)
│   └── ensemble.py                  ← 混合 RRF (Reciprocal Rank Fusion)
├── scripts/                         ← 可执行脚本
│   ├── run_query.py                 ← 单次查询 CLI 工具
│   ├── benchmark.py                 ← 批量评测指标 (Recall@K/延迟)
│   ├── prepare_book_data.py         ← 统一的数据清洗准备通道
│   └── setup_sirchmunk_wsl.sh       ← WSL rga 环境搭建
└── data/
    ├── search_data/                 ← 持久化索引与检索数据
    │   ├── bm25/                    ← BM25 pickle 倒排索引
    │   ├── toc_index.json           ← TOC 篇章汇总索引
    │   ├── manifests/               ← JSONL 文档清洗清单
    │   ├── pageindex/               ← 结构化页码树
    │   ├── sirchmunk/               ← Markdown 原文
    │   └── vectors/                 ← Numpy/JSON 向量文件
    └── benchmarks/                  ← 评测题库
        ├── sutton_queries.jsonl     ← 查询集 (query + expected_terms)
        ├── runs/                    ← 原始 JSON 运行结果
        └── reports/                 ← Recall/延迟对比报告
```

### 新增检索器模板

```
retrieval_lab/retrievers/
└── my_retriever.py                  ← 新增文件

# 模板内容:
from .base import BaseRetriever, RetrievalResult

class MyRetriever(BaseRetriever):
    name = "my_method"

    def __init__(self, data_path, book):
        # 1. 加载索引或数据 (如 JSON/SQL/HDF5)
        pass

    def search(self, query, top_k=10):
        # 2. 执行核心算法，将各异检索模型的对象统一转换
        return [RetrievalResult(
            doc_id="my_id", score=1.0, title="Title",
            book=self.book, method=self.name,
        )]
```

> 💻 Source: [retrieval_lab](../../retrieval_lab/) 完整目录树
