# Retrieval Lab 知识库

为 [Textbook RAG v1.1](../../docs/v1.1/requirements/requirements.md) 主项目服务的检索算法实验台 `retrieval_lab/` 的 8 维知识库。实验台验证了 BM25、向量检索、RRF 融合等算法，结论直接指导 v1.1 的 4 种检索策略设计（FTS5 BM25 / ChromaDB Vector / PageIndex Tree / Metadata Filter + RRF）。

## 文件列表

| 文件 | 维度 | 定位 |
|------|------|------|
| [retrieval_lab_map.md](retrieval_lab_map.md) | ① Map | 导航总览：核心问题 + 依赖地图 |
| [retrieval_lab_concepts.md](retrieval_lab_concepts.md) | ② Concepts | 术语定义 + 辨析（BM25 vs TOC, Ensemble vs Reranker） |
| [retrieval_lab_math.md](retrieval_lab_math.md) | ③ Math | BM25/IDF/RRF/Recall@K 完整推导 + 手算练习 |
| [retrieval_lab_tutorial.md](retrieval_lab_tutorial.md) | ④ Tutorial | Why-First 教程：痛点 → 原理 → 局限性 |
| [retrieval_lab_code.md](retrieval_lab_code.md) | ⑤ Code | 5 个完整代码示例 + API 速查 + 目录模板 |
| [retrieval_lab_pitfalls.md](retrieval_lab_pitfalls.md) | ⑥ Pitfalls | 10 坑 + 调试清单（代码审查发现） |
| [retrieval_lab_history.md](retrieval_lab_history.md) | ⑦ History | 6 Station 演进（布尔→TF-IDF→BM25→RRF→语义→RAG） |
| [retrieval_lab_bridge.md](retrieval_lab_bridge.md) | ⑧ Bridge | 上下游依赖 + 扩展阅读 |

## 快速入门

1. 先读 `_map.md` 了解全局
2. 查术语去 `_concepts.md`
3. 跑代码去 `_code.md` 的「快速开始」

## 来源

- 💻 `retrieval_lab/` 工作区完整源码
- 📚 Manning, Raghavan & Schütze, 《Introduction to Information Retrieval》 (`manning_intro_to_ir.pdf`)
- 📖 [RRF Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)

---

*生成日期: 2026-03-11*
