---
topic: retrieval_lab
dimension: tutorial
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📚 Book: [manning_intro_to_ir.pdf](../../textbooks/manning_intro_to_ir.pdf) — Ch.6, Ch.11"
  - "📚 MinerU: [manning_intro_to_ir.md](../../data/mineru_output/manning_intro_to_ir/manning_intro_to_ir/auto/manning_intro_to_ir.md)"
  - "📖 Docs: [rank_bm25](https://github.com/dorianbrown/rank_bm25)"
  - "📖 Docs: [RRF Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)"
  - "📖 Docs: [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)"
  - "💻 Source: [retrieval_lab](../../retrieval_lab/) — retrievers/*.py"
expiry: 6m
status: current
---

# Retrieval Lab 教程

> **前置知识：** Python 基础、命令行基础、了解"信息检索"的概念
> **参考来源：** [retrieval_lab/README.md](../../retrieval_lab/README.md) | [rank_bm25](https://github.com/dorianbrown/rank_bm25) | [Ollama](https://ollama.com/)

---


## Section 0: 前置知识速查

1. **Python 数据类** — `@dataclass` 自动生成 `__init__` 和 `__repr__`
2. **pickle** — Python 对象序列化格式，用于存储 BM25 索引
3. **JSON Lines (JSONL)** — 每行一个 JSON 对象的文件格式
4. **正则表达式** — `re.findall(r"[a-z0-9]+", text)` 提取所有小写字母和数字的连续序列
5. **uv run** — 用 `uv` 包管理器运行 Python 脚本
6. **numpy** — Vector 检索器使用 numpy 进行批量余弦相似度计算
7. **Ollama** — 本地运行 LLM 和 Embedding 模型的工具（Vector 检索器依赖）
8. **ripgrep-all (rga)** — ripgrep 的扩展版，支持搜索 PDF/DOCX/ZIP 等格式（Sirchmunk 依赖）

> 💻 Source: [retrieval_lab](../../retrieval_lab/) 代码中使用的技术栈

---


## Section 1: 它解决什么问题（Why）

### 没有它会怎样？

- 🎯 **主项目 v1.1 需要设计 4 种检索策略**（FTS5 BM25 / ChromaDB Vector / PageIndex Tree / Metadata Filter + RRF 融合），但直接在生产代码上实验太慢、太危险
- 📊 **不同检索方法到底差多少？** 没有量化对比（Recall@K），选型全凭猜测
- 🧩 **BM25 比精确匹配好在哪？语义搜索又比 BM25 好在哪？** 不写代码跑一遍体会不到
- 🔗 **v1.1 的 RRF 融合该怎么配？** 不先在极简环境验证 rrf_k 参数影响，生产代码里就是盲调
- 🏭 **Elasticsearch / Whoosh 是否必要？** 不先用极简实现跑出 Recall 基线，无法判断 v1.1 的 FTS5 + ChromaDB 组合是否够用（结论：完全够用）

### 它的核心价值

1. **为 v1.1 提供决策依据** — 通过实验验证了 FTS5+ChromaDB 组合的检索质量，确认不需要 ES/Whoosh
2. **五种独立检索方法一键对比** — BM25、TOC、PageIndex、Vector、Sirchmunk，覆盖 v1.1 的全部检索策略原型
3. **RRF 融合算法验证** — 在极简环境中调试 `rrf_k` 参数，结论直接用于 v1.1 的 `_rrf_fuse()`
4. **可量化评测** — Recall@K + 延迟，给 v1.1 的检索策略选型提供数据支撑
5. **极简设计** — 每个检索器 <100 行代码，算法原理一眼看懂，是 v1.1 黑盒实现的"透明教科书版"
6. **可扩展** — 新增检索器只需继承 `BaseRetriever` 实现 `search()`，快速验证新想法

> 💻 Source: [retrieval_lab](../../retrieval_lab/) `README.md` + [v1.1 requirements](../../docs/v1.1/requirements/requirements.md)

---


## Section 2: 它怎么工作的（How — 底层原理）

### 2.1 数据流 / 生命周期

```
┌──────────────────────────────────────────────────────────────────┐
│                       Data Preparation                          │
│                                                                  │
│  教科书 PDF ──→ MinerU 解析 ──→ Markdown                        │
│                                  ├──→ BM25 Index (pickle)       │
│                                  ├──→ TOC Index (JSON)          │
│                                  ├──→ Manifest (JSONL)          │
│                                  ├──→ PageIndex structure (JSON)│
│                                  ├──→ Vectors (JSON, via Ollama)│
│                                  └──→ Sirchmunk source (.md)    │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                                   ↓
┌──────────────────────────────────────────────────────────────────┐
│                        Query Pipeline                           │
│                                                                  │
│  用户查询 "kernel trick"                                         │
│      │                                                           │
│      ├── BM25Retriever.search()      → 段落级排名（倒排索引）   │
│      ├── TOCRetriever.search()       → 章节级排名（标题匹配）   │
│      ├── PageIndexRetriever.search() → 节点匹配（结构树）       │
│      ├── VectorRetriever.search()    → 语义排名（余弦相似度）   │
│      ├── SirchmunkRetriever.search() → 行级匹配（rga grep）    │
│      └── EnsembleRetriever.search()  → RRF 融合排名             │
│                                                                  │
│  结果: [{doc_id, score, title, text, page, ...}, ...]           │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                                   ↓
┌──────────────────────────────────────────────────────────────────┐
│                        Evaluation                                │
│                                                                  │
│  benchmark.py: 加载 queries.jsonl                                │
│      → 对每个方法运行所有查询                                     │
│      → 计算 Recall@K + P50 延迟                                  │
│      → 输出 JSON 汇总                                            │
└──────────────────────────────────────────────────────────────────┘
```

> 💻 Source: `scripts/prepare_book_data.py` + `common.py` + `scripts/benchmark.py`

### 2.2 BM25 检索机制（词法检索）

BM25 的核心思想是：**一个词越稀有（IDF 高）且在文档中出现越多（TF 高），该文档跟查询越相关**。

但直接用 TF 有问题 — 一个词出现 100 次不应该比出现 10 次好 10 倍。BM25 通过**词频饱和**解决：TF 增长到一定程度后分数趋于平稳。

同时，长文档天然会包含更多的词，所以 BM25 通过**长度归一化**给长文档一个惩罚。

在代码中：
1. `BM25Retriever.__init__()` — 加载预构建的 BM25 索引（pickle 文件包含 `bm25` 对象 + `docs` 列表）
2. `search()` — 对查询分词 → `bm25.get_scores()` → 按分数降序排列 → 跳过零分 → 取 top_k

> 📚 Book: Manning, Raghavan & Schütze, [《Introduction to Information Retrieval》](../../textbooks/manning_intro_to_ir.pdf), Ch.11.4

### 2.3 TOC 检索机制（目录匹配）

TOC 检索器不做全文匹配，而是匹配**章节标题**：
1. 将查询和标题都分词为小写词集合
2. 计算词集合交集大小 / 查询词数 → 词重叠比例
3. 如果查询是标题的子串，额外加 2.0 分
4. 这种简单方法能很好地回答"某个概念在哪一章"的问题

> 💻 Source: `retrievers/toc_retriever.py`

### 2.4 PageIndex 检索机制（结构树匹配）

PageIndex 与 TOC 使用**相同的评分算法**（词重叠 + 子串 bonus），但数据来源不同：
1. TOC 从共享 `toc_index.json` 读取（按 book 过滤）
2. PageIndex 从独立 `{book}_structure.json` 读取（含 `node_id` 和 `line_num`）
3. PageIndex 返回行号 (`meta.line_num`) 而非页码，用于在 MinerU 解析后的 Markdown 中精确定位

> 💻 Source: `retrievers/pageindex_retriever.py`

### 2.5 Vector 检索机制（语义向量）

Vector 是标准 RAG 语义检索流程：
1. **离线**：对教科书每个 chunk 用 Ollama `nomic-embed-text` 生成 768 维嵌入向量，存入 `{book}_vectors.json`
2. **在线**：对用户查询也做嵌入 → 与所有文档向量计算余弦相似度 → 按相似度降序取 top_k
3. **优势**：能理解同义词（"dog" 和 "canine" 的向量相近）
4. **代价**：需要 Ollama 运行，且嵌入过程较慢（每次查询约 50-200ms）

在代码中：
1. `VectorRetriever.__init__()` — 加载预构建向量 JSON，将 embeddings 转为 numpy 数组
2. `_get_query_embedding()` — 通过 Ollama `/api/embed` 获取查询嵌入
3. `_cosine_sim()` — 批量余弦相似度：先归一化，再做矩阵乘法
4. `search()` — 嵌入查询 → 算相似度 → `np.argsort` → 取 top_k

> 💻 Source: `retrievers/vector_retriever.py`

### 2.6 Sirchmunk 检索机制（ripgrep-all grep）

Sirchmunk 直接在原始 Markdown 文件上做 grep，无需预构建索引：
1. 将查询分词，用 `|` 构建 OR 正则模式
2. 调用 `rga --json` 命令执行搜索
3. 解析 JSON 输出，按匹配行中命中的查询词比例打分
4. 按分数降序 + 行号升序排序

在代码中：
1. `SirchmunkRetriever.__init__()` — 检查源 Markdown 文件是否存在
2. `_run_rga()` — 组装 rga 命令行，调用 subprocess，解析 JSON 输出
3. `search()` — 构建 OR 模式 → 运行 rga → 统计 term_hits → 排序取 top_k

> 💻 Source: `retrievers/sirchmunk_retriever.py`

### 2.7 Ensemble (RRF) 融合机制

不同检索方法的分数**不在同一尺度**（BM25 分数可能是 0~50，TOC 分数是 0~3，余弦相似度是 0~1），不能直接加权平均。

RRF 的解法：**忽略分数，只用排名位置**。排名第 1 贡献 $\frac{1}{K+1}$，排名第 2 贡献 $\frac{1}{K+2}$...

在代码中：
1. 对每个 retriever 调用 `search(query, top_k * 2)`（多取一些候选）
2. 对每个结果按排名计算 RRF 分数：$\frac{1}{60 + \text{rank}}$
3. 按 `doc_id` 汇总分数，最后排序取 top_k

> 📖 Docs: [RRF Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)

---


## Section 3: 局限性

1. **BM25 无语义理解** — "dog" 和 "canine" 被视为完全不同的词
2. **TOC / PageIndex 只匹配标题** — 如果概念在正文中但从未出现在标题中，找不到
3. **Vector 依赖外部服务** — 需要 Ollama 运行，且大 JSON 文件加载慢（可达数百 MB）
4. **Sirchmunk 依赖外部工具** — 需要 rga 二进制文件，Windows 上建议通过 WSL
5. **Recall@K 评测过于简单** — 只检查关键词是否出现，不检查语义相关性
6. **无增量更新** — 添加新书需要重建整个索引
7. **仅支持英文** — 正则 `[a-z0-9]+` 会丢弃中文等非拉丁字符
8. **无 HTTP API** — 只能通过命令行使用，无法集成到 Web 应用
9. **与成熟方案的差距** — 不具备 Elasticsearch 的分布式能力、实时索引、RestAPI；也不具备 Whoosh 的增量更新和多字段检索

---


## Section 4: 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **BM25** | 无需训练、效果不错、速度快 | 无语义理解 | 精确术语搜索 |
| **TOC** | 快速定位章节、结果可读性好 | 只看标题 | "这个概念在哪一章" |
| **PageIndex** | 行号精确定位、独立 structure JSON | 只看标题（同 TOC） | MinerU 解析后的行级定位 |
| **Vector** | 语义理解、同义词搜索 | 需 Ollama、加载慢 | 自然语言查询 |
| **Sirchmunk** | 无需索引、实时搜索原文 | 需 rga、行级粒度 | 精确原文搜索、正则模式 |
| **Ensemble (RRF)** | 融合互补优势、无参数 | 多一层计算 | 默认推荐方法 |
| **Elasticsearch** | 功能完善、分布式、REST API、实时索引 | 重量级，部署复杂（JVM + 集群） | 生产环境、大规模数据 |
| **Whoosh** | 纯 Python、轻量级、增量更新 | API 复杂、封装细节多、社区不活跃 | 中等规模 Python 项目 |

> 📚 关于 Elasticsearch vs Retrieval Lab：Retrieval Lab 的定位是**学习工具**——每个检索器 <100 行，算法原理一眼看懂。如果目标是生产部署、大规模数据，应该用 Elasticsearch 或 OpenSearch。如果只需要纯 Python 中等规模全文检索，Whoosh 是不错的选择（但社区维护已减缓）。

---


## 参考来源表

| 来源 | 类型 | 使用位置 |
|------|------|---------|
| `retrieval_lab/` 源码 | 💻 代码 | 全篇 |
| Manning, Raghavan & Schütze, [《Introduction to Information Retrieval》](../../textbooks/manning_intro_to_ir.pdf) | 📚 教科书 | Section 2.2 BM25 机制 (Ch.11.4) |
| [RRF Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) | 📖 论文 | Section 2.7 RRF 融合 |
| [rank_bm25 GitHub](https://github.com/dorianbrown/rank_bm25) | 📖 文档 | BM25 实现细节 |
| [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md) | 📖 文档 | Section 2.5 Vector 嵌入 |
| [ripgrep-all GitHub](https://github.com/phiresky/ripgrep-all) | 📖 文档 | Section 2.6 Sirchmunk 搜索 |
