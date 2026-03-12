---
topic: retrieval_lab
dimension: concepts
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📚 Book: [manning_intro_to_ir.pdf](../../textbooks/manning_intro_to_ir.pdf) — Ch.6, Ch.11"
  - "📚 MinerU: [manning_intro_to_ir.md](../../data/mineru_output/manning_intro_to_ir/manning_intro_to_ir/auto/manning_intro_to_ir.md)"
  - "📖 Docs: [RRF Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)"
  - "📖 Docs: [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)"
  - "💻 Source: [retrieval_lab](../../retrieval_lab/) — retrievers/*.py"
expiry: 6m
status: current
---

# Retrieval Lab 核心概念

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.6 & Ch.11

---


## 术语定义

| 术语 | 定义（白话） | 英文 | 易混淆项 |
|------|-------------|------|----------|
| **BaseRetriever** | 所有检索器的抽象基类，定义 `search()` 接口 | Base Retriever | — |
| **RetrievalResult** | 一条检索结果的数据容器，包含 doc_id/score/title/text/page 等字段 | Retrieval Result | Document |
| **BM25** | 基于词频和文档长度的经典概率检索模型，不需要训练 | Best Matching 25 | TF-IDF |
| **TOC** | 目录检索器，用关键词匹配教科书的章节标题 | Table of Contents Retriever | PageIndex |
| **PageIndex** | 基于文档结构树 JSON（含 node_id + line_num）的章节标题匹配，评分逻辑类似 TOC | Page Index Retriever | TOC |
| **Vector** | 标准 RAG 语义向量检索：用 Ollama nomic-embed-text 嵌入查询，与预构建向量做余弦相似度 | Vector Retriever | BM25 |
| **Sirchmunk** | 基于 ripgrep-all (rga) 在 Markdown 源文件中进行全文 grep 搜索 | Sirchmunk Retriever | BM25 |
| **EnsembleRetriever** | 融合多路检索结果的混合检索器，使用 RRF 算法合并排名 | Ensemble Retriever | Reranker |
| **RRF** | 一种无参数的排名融合算法，只看排名位置不看原始分数 | Reciprocal Rank Fusion | 加权平均 |
| **rrf_k** | RRF 公式中的常数（默认 60），控制高排名与低排名的分数差距 | RRF k constant | top-k |
| **Recall@K** | 在前 K 个结果中找到相关文档的比例 | Recall at K | Precision@K |
| **top_k** | 返回的最多结果数量 | Top K | rrf_k |
| **Benchmark** | 自动化评测脚本，对多种方法跑同一组查询并对比 Recall 和延迟 | Benchmark | — |
| **Manifest** | 数据清单文件（JSONL），记录所有文档的元数据 | Manifest | Index |
| **Cosine Similarity** | 余弦相似度，衡量两个向量方向的相似程度（Vector 方法使用） | Cosine Similarity | 欧氏距离 |
| **Embedding** | 用模型（如 nomic-embed-text）将文本转换为固定维度的稠密向量 | Text Embedding | TF-IDF 向量 |

> 💻 Source: [retrieval_lab](../../retrieval_lab/) `retrievers/base.py` + `retrievers/*.py`

---


## 概念辨析

### BM25 vs TOC

| 维度 | BM25 | TOC |
|------|------|-----|
| **本质** | 基于概率模型的全文检索 | 基于关键词的章节标题匹配 |
| **输入** | 预构建的倒排索引 (pickle) | 预构建的章节标题列表 (JSON) |
| **粒度** | 文档段落级别 | 章节标题级别 |
| **优点** | 能在正文中找到精确术语 | 快速定位章节，结果可读性好 |
| **缺点** | 对标题中不出现的概念难以定位章节 | 只匹配标题，错过正文中的信息 |
| **返回内容** | 段落文本 + 分数 | 标题文本 + 页码 |

> 💻 Source: `retrievers/bm25_retriever.py` vs `retrievers/toc_retriever.py`

### TOC vs PageIndex

| 维度 | TOC | PageIndex |
|------|-----|-----------|
| **本质** | 章节标题匹配（从共享 TOC 索引读取） | 结构树节点匹配（从独立 structure JSON 读取） |
| **数据来源** | `toc_index.json`（全书共用） | `{book}_structure.json`（每书独立） |
| **评分算法** | 词重叠 + 子串 bonus（相同） | 词重叠 + 子串 bonus（相同） |
| **返回定位** | `page` 字段（页码） | `meta.line_num` 字段（行号） |
| **适用场景** | 需要页码定位 | 需要行号定位（MinerU 解析结果） |

> 💻 Source: `retrievers/toc_retriever.py` vs `retrievers/pageindex_retriever.py`

### BM25 vs Vector

| 维度 | BM25 | Vector |
|------|------|--------|
| **本质** | 精确词匹配，基于词频统计 | 语义匹配，基于向量相似度 |
| **能否理解同义词** | ❌ "dog" 和 "canine" 无关 | ✅ 语义相近则向量相近 |
| **计算资源** | 极低（纯 CPU 运算） | 需要 Ollama 本地推理服务 |
| **索引格式** | pickle（BM25Okapi 对象） | JSON（chunks + embeddings，可达数百 MB） |
| **何时优** | 查询包含精确术语（如 "BM25"） | 查询为自然语言描述（如 "如何做时序差分学习"） |

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.6 & Ch.11

### BM25 vs Sirchmunk

| 维度 | BM25 | Sirchmunk |
|------|------|-----------|
| **本质** | 离线索引 → 内存打分 | 实时 grep（ripgrep-all） |
| **需要预构建索引** | ✅ 必须先构建 pickle | ❌ 直接搜原始 Markdown 文件 |
| **搜索速度** | 极快（已在内存）| 取决于文件大小和 rga 缓存 |
| **结果粒度** | 段落级 | 行级 |
| **外部依赖** | rank_bm25 Python 库 | rga 二进制文件 |

> 💻 Source: `retrievers/bm25_retriever.py` vs `retrievers/sirchmunk_retriever.py`

### Ensemble vs Reranker

| 维度 | Ensemble (RRF) | Reranker |
|------|----------------|----------|
| **本质** | 合并多路排名，不看原始分数 | 用模型对候选集重新打分 |
| **需要训练？** | ❌ 无参数 | ✅ 需要训练或使用预训练模型 |
| **计算成本** | 极低（只做加法） | 高（每对 query-doc 过一次模型） |
| **适用场景** | 融合异构检索器 | 精细化排序 |
| **本项目** | `EnsembleRetriever` | 暂未实现 |

> 📖 Docs: [RRF Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)

### Recall@K vs Precision@K

| 维度 | Recall@K | Precision@K |
|------|----------|-------------|
| **本质** | 在前 K 个结果中找到了多少相关文档 | 前 K 个结果中有多少是相关的 |
| **本项目实现** | ✅ `recall_at_k()` — 只要有一个结果命中 expected_terms 就得分 1.0 | ❌ 未实现 |
| **公式** | $\text{Recall@K} = \frac{|相关 \cap 前K|}{|相关|}$ | $\text{Precision@K} = \frac{|相关 \cap 前K|}{K}$ |

> 💻 Source: `scripts/benchmark.py:recall_at_k()`

---


## 核心属性

### 信息架构

```
┌─────────────────── Retrieval Lab ───────────────────┐
│                                                      │
│  ┌─── retrievers/ ───────────────────────────────┐  │
│  │                                                │  │
│  │  BaseRetriever (抽象基类)                       │  │
│  │    ├── BM25Retriever    (词法 / 倒排索引)      │  │
│  │    ├── TOCRetriever     (目录标题匹配)          │  │
│  │    ├── PageIndexRetriever (结构树节点匹配)      │  │
│  │    ├── VectorRetriever  (语义向量 / Ollama)    │  │
│  │    ├── SirchmunkRetriever (ripgrep-all grep)   │  │
│  │    └── EnsembleRetriever (RRF 融合)            │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─── scripts/ ──────────────────────────────────┐  │
│  │  run_query.py       (单次查询)                  │  │
│  │  benchmark.py       (批量评测)                  │  │
│  │  prepare_book_data.py (数据准备)                │  │
│  │  setup_sirchmunk_wsl.sh (WSL 环境搭建)         │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─── data/ ─────────────────────────────────────┐  │
│  │  search_data/                                   │  │
│  │    ├── bm25/       (BM25 pickle 索引)          │  │
│  │    ├── pageindex/  (结构树 JSON)                │  │
│  │    ├── vectors/    (向量 JSON)                  │  │
│  │    ├── sirchmunk/  (源 Markdown + 缓存)        │  │
│  │    └── toc_index.json                           │  │
│  │  benchmarks/                                    │  │
│  │    ├── {book}_queries.jsonl                     │  │
│  │    ├── runs/  + reports/                        │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  common.py  (配置加载 + 工厂函数)                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

> 💻 Source: [retrieval_lab](../../retrieval_lab/) 完整目录结构

### 适用场景 ✅

- 教科书全文检索实验
- 对比不同检索方法（词法 vs 语义 vs grep）的 Recall/Latency
- 学习 BM25/RRF/余弦相似度等检索算法原理
- 为 RAG Pipeline 提供检索后端
- 评估混合检索（Lexical + Semantic）的效果

### 不适用场景 ❌

- 生产环境大规模检索（无分布式支持）
- 实时在线服务（无 HTTP API）
- 多语言查询（正则 `[a-z0-9]+` 丢弃中文等非拉丁字符）
- 需要 GPU 加速的大规模向量检索（kNN indexing 未实现）

---


## 速查表

| 项 | 说明 | 示例 |
|-----|------|------|
| 运行查询 | `run_query.py` | `uv run python retrieval_lab/scripts/run_query.py --book sutton --method bm25 "kernel trick"` |
| 运行评测 | `benchmark.py` | `uv run python retrieval_lab/scripts/benchmark.py --book sutton` |
| 含 Vector | `benchmark.py --include-vector` | `uv run python retrieval_lab/scripts/benchmark.py --book sutton --include-vector` |
| 含 Sirchmunk | `benchmark.py --include-sirchmunk` | `uv run python retrieval_lab/scripts/benchmark.py --book sutton --include-sirchmunk` |
| 准备数据 | `prepare_book_data.py` | `uv run python retrieval_lab/scripts/prepare_book_data.py --book sutton` |
| 默认方法 | ensemble | 自动融合 bm25 + toc |
| 默认 top_k | 5 | 可通过 `--top-k` 覆盖 |
| RRF 常数 | 60 | `config.RRF_K` |
| Vector 模型 | nomic-embed-text | 通过 Ollama 本地 API 嵌入 |
| 支持方法 | bm25, toc, pageindex, vector, sirchmunk, ensemble | `--method` 参数 |

> 💻 Source: [retrieval_lab](../../retrieval_lab/) `README.md`
