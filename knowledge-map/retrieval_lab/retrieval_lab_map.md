---
topic: retrieval_lab
dimension: map
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📚 Book: [manning_intro_to_ir.pdf](../../textbooks/manning_intro_to_ir.pdf) — Ch.1-11"
  - "📚 MinerU: [manning_intro_to_ir.md](../../data/mineru_output/manning_intro_to_ir/manning_intro_to_ir/auto/manning_intro_to_ir.md)"
  - "📖 Docs: [rank_bm25](https://github.com/dorianbrown/rank_bm25)"
  - "📖 Docs: [RRF Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)"
  - "💻 Source: [retrieval_lab](../../retrieval_lab/) — retrievers/*.py"
expiry: 6m
status: current
---

# Retrieval Lab 知识地图

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf)

## 1. 核心问题

- **Retrieval Lab 是什么？** → 为 **Textbook RAG v1.1** 主项目服务的检索算法实验台。用极简代码（每个检索器 <100 行）验证 BM25、向量检索、RRF 融合等算法，实验结论直接指导 v1.1 的 4 种检索策略设计
- **它和主项目 v1.1 是什么关系？** → v1.1 用 SQLite FTS5 + ChromaDB 做生产检索；retrieval_lab 用 rank_bm25 + NumPy 做原理验证和 Recall 评测。实验台验证完毕后，v1.1 选择了最适合的工具落地
- **为什么不直接用 Elasticsearch / Whoosh？** → ES Docker 部署看似"一键"，但它只替换管道中的**搜索索引**这一步（替代 FTS5 + ChromaDB）。MinerU PDF 解析、切块、bbox 坐标映射、FastAPI 后端、React 前端、Ollama LLM 一个都不能少。v1.1 用 FTS5 + ChromaDB 零运维单文件部署，ES 反而额外引入 JVM 运维。数据量 MB 级，ES 的分布式能力完全是 overkill
- **用 ES 还需要 MinerU 吗？** → **必须要。** 无论用什么搜索引擎，PDF → 文本 + 结构化数据的解析都是前置步骤。v1.1 的 citation bbox 高亮（FR-3.4）100% 依赖 MinerU 的 `content_list.json` 坐标数据，ES/Whoosh 不提供 PDF 解析能力
- **5 种检索方法各有什么特点？** → BM25（概率词法）、TOC（标题匹配）、PageIndex（结构树节点匹配）、Vector（Ollama 嵌入 + 余弦相似度）、Sirchmunk（ripgrep-all 全文 grep）
- **Ensemble 怎么融合多路结果？** → 使用 Reciprocal Rank Fusion (RRF)，无需训练权重，仅依赖排序名次。v1.1 的 `_rrf_fuse()` 直接复用此算法
- **如何衡量检索质量？** → `benchmark.py` 用 Recall@K + P50 延迟评测，支持选择性纳入 Vector 和 Sirchmunk

> 💻 Source: [retrieval_lab](../../retrieval_lab/) `README.md` + [v1.1 requirements](../../docs/v1.1/requirements/requirements.md)

---

## 2. 全景位置

```
Textbook RAG 项目
│
├── 主项目 v1.1（生产系统）
│   ├── ① FTS5 BM25           ← SQLite chunk_fts 表
│   ├── ② ChromaDB Vector     ← 本地持久化向量库
│   ├── ③ PageIndex Tree      ← toc_entries + LLM 推理
│   ├── ④ Metadata Filter     ← SQL WHERE 结构化筛选
│   └── RRF Fusion → Ollama LLM → Citation
│
└── retrieval_lab（实验台） 【你在这里】
    ├── BM25Retriever          → 验证 BM25 原理 → 指导 v1.1 ①
    ├── TOCRetriever            → 验证标题匹配 → 指导 v1.1 ③
    ├── PageIndexRetriever      → 验证结构树匹配 → 指导 v1.1 ③
    ├── VectorRetriever         → 验证向量检索 → 指导 v1.1 ②
    ├── SirchmunkRetriever      → grep 对照实验
    ├── EnsembleRetriever (RRF) → 验证融合算法 → 指导 v1.1 RRF
    └── benchmark.py            → Recall@K 评测
```

> 💻 Source: [retrieval_lab](../../retrieval_lab/) + [v1.1 requirements](../../docs/v1.1/requirements/requirements.md)

---

## 3. 依赖地图

```
前置知识                   本主题                      直接服务
┌──────────────────┐  ┌────────────────────────┐  ┌──────────────────────────┐
│ Python 基础       │──│                        │──│ Textbook RAG v1.1        │
│ 数据结构          │  │  Retrieval Lab         │  │ (主项目・生产系统)        │
└──────────────────┘  │  (实验台)               │  │                          │
                      │                        │  │ BM25 → FTS5              │
┌──────────────────┐  │  独立检索器:            │  │ Vector → ChromaDB        │
│ 概率论基础        │──│   BM25 (词法)          │──│ PageIndex → toc_entries   │
│ (TF-IDF/BM25)    │  │   TOC  (目录)          │  │ RRF → _rrf_fuse()        │
└──────────────────┘  │   PageIndex (结构)     │  └──────────────────────────┘
                      │   Vector (语义)        │
┌──────────────────┐  │   Sirchmunk (grep)     │  后续方向
│ 教科书 PDF        │──│                        │  ┌──────────────────────────┐
│ (MinerU 解析)     │  │  融合策略:             │──│ Reranker (Neural 重排序)  │
└──────────────────┘  │   Ensemble (RRF)      │  │ 生产级向量库 (Pinecone)   │
                      │                        │  └──────────────────────────┘
┌──────────────────┐  │  评测:                  │
│ Ollama 本地推理   │──│   Recall@K + P50 延迟  │
│ (nomic-embed-text)│  └────────────────────────┘
└──────────────────┘
```

> 💻 Source: [retrieval_lab](../../retrieval_lab/) + [v1.1 requirements](../../docs/v1.1/requirements/requirements.md)

---

## 4. 文件地图

| 文件 | 定位 | 何时用 |
|------|------|--------|
| [retrieval_lab_map.md](retrieval_lab_map.md) | ① 导航 | 首次了解全局 |
| [retrieval_lab_concepts.md](retrieval_lab_concepts.md) | ② 概念 | 查术语定义 |
| [retrieval_lab_math.md](retrieval_lab_math.md) | ③ 公式 | 理解 BM25/RRF/余弦相似度数学 |
| [retrieval_lab_tutorial.md](retrieval_lab_tutorial.md) | ④ 教程 | 第一次使用 |
| [retrieval_lab_code.md](retrieval_lab_code.md) | ⑤ 代码 | 开发参考 |
| [retrieval_lab_pitfalls.md](retrieval_lab_pitfalls.md) | ⑥ 踩坑 | 遇到问题时查 |
| [retrieval_lab_history.md](retrieval_lab_history.md) | ⑦ 历史 | 理解演进脉络 |
| [retrieval_lab_bridge.md](retrieval_lab_bridge.md) | ⑧ 衔接 | 扩展学习 |

> 💻 Source: 本知识库生成结构

---

## 5. 学习/使用路线

### 第一次学习 🎒

1. 读本文件 `retrieval_lab_map.md` — 了解全局
2. 读 `retrieval_lab_concepts.md` — 掌握核心术语（6 种方法 + 评测指标）
3. 读 `retrieval_lab_math.md` — 理解 BM25、RRF、余弦相似度公式
4. 读 `retrieval_lab_tutorial.md` — 跟着教程跑一遍所有方法
5. 读 `retrieval_lab_code.md` — 看完整代码实现

### 日常参考 🔧

1. 查 `retrieval_lab_code.md` → API 速查表
2. 遇到问题查 `retrieval_lab_pitfalls.md`
3. 忘记公式查 `retrieval_lab_math.md` → 公式速查表

### 深度研究 🔬

1. 查 `retrieval_lab_history.md` — 理解检索技术演进
2. 查 `retrieval_lab_bridge.md` — 找到扩展方向
3. 对比 BM25/TF-IDF/BM25+ 等变体
4. 研究 Vector + BM25 混合检索的效果

---

## 6. 缺口检查

| 维度 | 状态 |
|------|------|
| Map | ✅ 已完成（含 5 独立方法 + 1 融合策略） |
| Concepts | ✅ 已完成（含 PageIndex/Vector/Sirchmunk） |
| Math | ✅ 已完成（含余弦相似度公式） |
| Tutorial | ✅ 已完成（含 5 种方法 + 融合） |
| Code | ✅ 已完成（8 示例 + API 速查） |
| Pitfalls | ✅ 已完成（10 坑 + 调试清单） |
| History | ✅ 已完成（6 Station） |
| Bridge | ✅ 已完成 |

---

## 7. 新鲜度状态

| 维度 | 上次验证 | 过期时间 | 状态 |
|------|---------|---------|------|
| Map | 2026-03-11 | 6m | ✅ current |
| Concepts | 2026-03-11 | 6m | ✅ current |
| Math | 2026-03-11 | 12m | ✅ current |
| Tutorial | 2026-03-11 | 6m | ✅ current |
| Code | 2026-03-11 | 6m | ✅ current |
| Pitfalls | 2026-03-11 | 6m | ✅ current |
| History | 2026-03-11 | 12m | ✅ current |
| Bridge | 2026-03-11 | 6m | ✅ current |
