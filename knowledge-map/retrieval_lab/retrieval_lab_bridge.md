---
topic: retrieval_lab
dimension: bridge
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📚 Book: [manning_intro_to_ir.pdf](../../textbooks/manning_intro_to_ir.pdf)"
  - "💻 Source: [retrieval_lab](../../retrieval_lab/)"
expiry: 6m
status: current
---

# Retrieval Lab 衔接与扩展

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf)

---


## ← 上一个概念 / 下一个概念 →

| 方向 | 主题 | 关系 | 链接 |
|------|------|------|------|
| ← 前置 | TF-IDF 基础 | BM25 的数学前置：理解 TF 和 IDF 才能理解 BM25 的改进 | 📚 Manning Ch.6 |
| ← 前置 | 向量空间模型 | Vector 检索器的理论基础：余弦相似度衡量向量距离 | 📚 Manning Ch.6.3 |
| ← 前置 | MinerU PDF 解析 | 数据前置：所有检索索引建立在 MinerU 输出的 Markdown + 结构化 JSON 上 | `data/mineru_output/` |
| **→ 主要** | **Textbook RAG v1.1** | **实验结论直接指导 v1.1 的 4 种检索策略设计** | [requirements](../../docs/v1.1/requirements/requirements.md) |
| → 潜在 | Neural Reranker | 用 Cross-Encoder 对候选集精细重排序，突破 RRF 天花板（v1.1 暂未实现） | — |

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.1-11

---


## 上游依赖

| 来自主题 | 复用的概念 | 在本主题中如何使用 |
|----------|-----------|-------------------|
| MinerU PDF 解析 | PDF → Markdown + 结构化 JSON | 所有检索索引的数据来源：BM25 索引、TOC JSON、PageIndex 结构树、Vector 嵌入源文本 |
| 概率论与统计 | TF-IDF / 对数函数 / 贝叶斯 | BM25 评分中的 IDF 衡量稀有性、词频饱和控制 |
| 向量空间模型 | 余弦相似度 / 向量范数 | VectorRetriever 用 NumPy 批量计算查询与文档的余弦相似度 |
| JSON 树解析 | 嵌套 JSON 遍历 | TOC 从 `toc_index.json` 提取标题、PageIndex 从 `{book}_structure.json` 提取节点 |
| Ollama 推理服务 | 文本嵌入 API (`/api/embed`) | VectorRetriever 通过 Ollama 的 `nomic-embed-text` 模型将查询转换为 768 维向量 |

> 💻 Source: [retrieval_lab](../../retrieval_lab/) `common.py` + `retrievers/*.py`

---


## 下游影响

| 去向主题 | 本主题提供的概念 | 在下游如何被使用 |
|----------|-----------------|-----------------| 
| **Textbook RAG v1.1** | BM25 原理验证 | v1.1 选择 SQLite FTS5 而非 ES/Whoosh 做 BM25，基于实验台的 Recall 评测结论 |
| **Textbook RAG v1.1** | Vector 检索验证 | v1.1 选择 ChromaDB 做语义检索，实验台验证了余弦相似度的效果 |
| **Textbook RAG v1.1** | PageIndex/TOC 标题匹配 | v1.1 的 PageIndex Tree 策略（toc_entries + LLM 推理）源自实验台的结构匹配实验 |
| **Textbook RAG v1.1** | RRF 融合算法 + rrf_k 调参 | v1.1 的 `_rrf_fuse()` 直接复用实验台验证过的 RRF 算法和 k=60 参数 |

> 💻 Source: [retrieval_lab](../../retrieval_lab/) + [v1.1 requirements](../../docs/v1.1/requirements/requirements.md)

---


## 概念演变追踪

| 概念 | 在早期版本中 | 在当前版本中 | 变化 |
|------|------------|------------|------|
| 检索方法 | 仅 BM25 + TOC + Ensemble | 5 独立方法 + 1 融合策略 | 新增 PageIndex/Vector/Sirchmunk |
| 数据结构 | `RetrievalResult` 仅有 doc_id/score/title | 含 text/page/meta 等完整字段 | 支持行号定位和向量元数据 |
| 评测方式 | 简单 Recall@K | Recall@K + P50 延迟 + 可选方法 | `--include-vector` / `--include-sirchmunk` 标志 |
| 工厂函数 | 初始化所有检索器再选择 | 懒初始化，只创建需要的方法 | 避免无关索引文件缺失报错 |

> 💻 Source: [retrieval_lab](../../retrieval_lab/) 代码迭代历史

---


## 📚 扩展阅读

### 深入理解

| 资源 | 类型 | 为什么值得读 | 难度 |
|------|------|-------------|------|
| Manning, [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf) Ch.11 | 📚 教科书 | BM25 的完整数学推导和概率检索理论 | ⭐⭐⭐ |
| [RRF Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) | 📖 论文 | RRF 算法原始论文，仅 2 页，清晰易读 | ⭐⭐ |
| [rank_bm25 源码](https://github.com/dorianbrown/rank_bm25) | 💻 开源 | 极简 BM25 Python 实现，<200 行 | ⭐⭐ |
| [Ollama Embedding API](https://github.com/ollama/ollama/blob/main/docs/api.md) | 📖 文档 | 理解向量嵌入的 API 调用方式 | ⭐ |

### 横向对比

| 资源 | 对比点 | 何时读 |
|------|--------|--------|
| [Elasticsearch Guide](https://www.elastic.co/guide) | ES 的 BM25 配置 vs 我们的极简实现 | 考虑生产部署时 |
| [Pinecone Docs](https://docs.pinecone.io/) | 专业向量数据库 vs 我们的 NumPy + JSON | 大规模向量检索需求时 |
| [Whoosh Documentation](https://whoosh.readthedocs.io/) | 纯 Python 全文检索 vs 我们的 rank_bm25 | 需要增量更新和多字段检索时 |
| [ripgrep-all](https://github.com/phiresky/ripgrep-all) | rga 的全格式搜索能力 vs 我们的 Sirchmunk 封装 | 想搜索 PDF/DOCX 等非文本格式时 |

### 上层应用

| 资源 | 说明 | 何时读 |
|------|------|--------|
| LangChain Retrievers | LangChain 的 Retriever 抽象与我们的 BaseRetriever 设计比较 | 构建 RAG 应用时 |
| LlamaIndex | 面向 LLM 的数据框架，内置多种 Retriever 和 Reranker | 想要更完整的 RAG 生态时 |
| Cross-Encoder Reranking | 用 sentence-transformers 的 CrossEncoder 做 query-doc 对打分 | 突破 RRF 精度上限时 |

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf)

---


## 跨工具概念映射

| 本工具概念 | Elasticsearch 等价 | LangChain 等价 | 通用说明 |
|-----------|-------------------|----------------|---------|
| `BaseRetriever` | — | `BaseRetriever` | 检索器抽象基类，统一 `search()` 接口 |
| `BM25Retriever` | ES 默认 `match` 查询 | `BM25Retriever` | BM25 全文检索 |
| `VectorRetriever` | ES `knn` 查询 / Pinecone | `VectorStoreRetriever` | 向量语义检索 |
| `EnsembleRetriever` | ES `multi_match` + RRF | `EnsembleRetriever` | 多路融合检索 |
| `RetrievalResult` | ES `_source` + `_score` | `Document` | 检索结果数据容器 |
| `benchmark.py` | Rally (ES 压测工具) | RAGAS / trulens | 检索质量评测 |
| `rrf_k=60` | ES `rank_constant` 参数 | `c=60` | RRF 常数 |

> 💻 Source: [retrieval_lab](../../retrieval_lab/) + Elasticsearch/LangChain 文档

---


## 与工作区已有知识库的关联

| 类别 | 数量 | 代表 | 学习点 |
|------|------|------|--------|
| 本知识库内 | 8 维度 | retrieval_lab_math.md | BM25/RRF/余弦公式推导 |
| 教科书 | 1 本 | manning_intro_to_ir.pdf | TF-IDF 到 BM25 的完整理论体系 |
| 参考论文 | 1 篇 | RRF Paper | 融合排名的数学依据 |
| 开源项目 | 3 个 | rank_bm25 / Ollama / rga | BM25 库 / 嵌入服务 / 全文搜索工具 |

> 💻 Source: 本知识库生成结构
