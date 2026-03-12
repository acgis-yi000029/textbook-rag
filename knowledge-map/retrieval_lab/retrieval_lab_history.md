---
topic: retrieval_lab
dimension: history
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📚 Book: [manning_intro_to_ir.pdf](../../textbooks/manning_intro_to_ir.pdf) — Ch.1, Ch.6, Ch.11"
  - "📖 Docs: [RRF Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)"
expiry: 12m
status: current
---

# 检索技术演变史 (Retrieval Evolution)

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.1, 6, 11

---


## 时间轴概览

```
1960s          1970s          1990s          2000s          2010s+         2020s+
  │              │              │              │              │              │
  ▼              ▼              ▼              ▼              ▼              ▼
Boolean ──→  TF-IDF  ──→   BM25   ──→  TOC/结构 ──→  Neural IR  ──→  Hybrid RRF
(全有/全无)  (词频×稀有)  (饱和+惩罚)  (标题匹配)    (向量语义)    (多路融合)
```

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.1

---


## Station 1: 布尔检索与简单 TF（1960s）

**问题：** 最早的信息检索是二元的 — 文档要么匹配、要么不匹配，没有"相关程度"的概念。

布尔检索（Boolean Retrieval）用 AND/OR/NOT 逻辑组合关键词：`(mac AND cheese) OR (pasta AND cheese)`。后来人们发现"词出现几次"也很重要，提出了词频（TF）：在文档里出现 10 次的词肯定比出现 1 次的更能代表主题。

**创新：** 从二元匹配进化到基于词频的排名检索，文档开始有了相关性分数。

**局限：** 无法区分通用词与稀有词 — "的"、"is" 出现上千次，压过了真正体现主题的专有名词（如"贝叶斯"）。同时，把文档复制几遍，TF 分数就翻倍，毫无意义。

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.1 (Boolean Retrieval) & Ch.6 (TF)

---


## Station 2: TF-IDF 模型（1970s）

**问题：** 简单 TF 无法压制"常用废话词"，高频停用词严重干扰检索质量。

**创新：** 引入逆文档频率（IDF）概念：$\text{IDF} = \log(N / n)$。某个词出现的文档越多，它的信息价值越低。TF × IDF 同时考虑了"词在本文中的重要性"和"词在全局的稀有性"。

**局限：**
1. 依然没有长度惩罚 — 长文档只因篇幅大就比短文档多得分，即使核心主旨与查询无关
2. 词频没有饱和 — 出现 100 遍就真的比 10 遍好 10 倍吗？边际效应递减被忽视

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.6 (TF-IDF weighting)

---


## Station 3: BM25 — 概率信息检索基石（1990s）

**问题：** TF-IDF 的两个致命弱点：长文档偏差和词频无上限。

**创新：** Okapi BM25 在 TF-IDF 基础上引入两个关键改进：
1. **词频饱和 ($k_1$)** — 非线性增长控制堆词现象，TF 增长到一定程度后分数趋于平稳
2. **长度归一化 ($b$)** — 对比全库平均文档长度，越长的文档惩罚越重

BM25 成为工业界默认基线，Elasticsearch 至今以 BM25 作为核心排名函数。`retrieval_lab` 中的 `BM25Retriever` 用 `rank_bm25` 包直接实现此算法。

**局限：** 纯词法匹配，"dog" 和 "canine" 被视为完全不同的词，无法理解同义词和语义相似性。

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.11 (Probabilistic IR / Okapi BM25)

---


## Station 4: 结构化匹配 — TOC 与 PageIndex（2000s）

**问题：** 全文 BM25 在正文海量文本中搜索，但如果关键词直接出现在章节标题中，该章节的相关性大概率远超正文中零散提及的段落。

**创新：** 把检索重点从"全文堆砌"转移到"章节大纲骨架"上。利用文档的结构化信息（目录树、标题层级），用标题匹配取代全文匹配，处理"某个概念在哪一章"的问题极其精准高效。

`retrieval_lab` 中的 `TOCRetriever` 和 `PageIndexRetriever` 分别从共享 TOC 索引和独立结构树 JSON 中匹配标题，将人类编辑的高质量大纲作为检索优先源。

**局限：** 只看标题，完全忽略正文内容 — 如果概念只在正文中讨论但从未出现在标题里，就无法被检索到。

> 💻 Source: [retrieval_lab](../../retrieval_lab/) `retrievers/toc_retriever.py` + `retrievers/pageindex_retriever.py`

---


## Station 5: 神经信息检索 — 向量语义时代（2010s+）

**问题：** 词法检索无论怎么优化，都无法跨越"精确词匹配"的天花板。搜 "dog" 永远找不到只写了 "canine" 的文档。

**创新：** Transformer 时代带来了 Embedding（嵌入向量）+ Cosine Similarity（余弦相似度）的标准范式。模型将文本编码为高维向量，语义相近的文本在向量空间中距离相近。这种检索被称为"语义相似度检索"。

`retrieval_lab` 中的 `VectorRetriever` 通过 Ollama 本地 `nomic-embed-text` 模型生成 768 维嵌入向量，再用 NumPy 批量余弦相似度取 top-K。它是 RAG (Retrieval-Augmented Generation) 架构的检索前端。

**局限：** 依赖 GPU/推理服务（延迟高），大规模向量文件加载慢（可达数百 MB），且对精确术语（如 "BM25"）的匹配不如词法方法敏感。

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.6.3 (Vector Space Model 基础)

---


## Station 6: 混合多路融合 — Hybrid Ensemble RRF（2020s+）

**问题：** 没有任何单一检索模型是全能的 — BM25 擅长精确术语，Vector 擅长语义理解，TOC 擅长章节定位。且不同方法的分数尺度完全不同（BM25: 0~50, 余弦: 0~1），无法直接加权平均。

**创新：** Reciprocal Rank Fusion (RRF) 算法在 2009 年发表，核心思想是：忽略原始分数，只用排名位置。排名第 1 贡献 $\frac{1}{K+1}$，排名第 2 贡献 $\frac{1}{K+2}$... 无需训练权重，天然适配异构检索器的融合。

`retrieval_lab` 的 `EnsembleRetriever` 正是这一理念的代码化，用 `rrf_k=60` 融合 BM25 + TOC（可选 PageIndex/Vector/Sirchmunk）。

**局限：** RRF 是无参数的"民主投票"，无法学习不同检索器在不同查询类型上的优劣。更高级的方法是 Neural Reranker — 用 Cross-Encoder 模型对 query-doc 对重新打分。

> 📖 Docs: Cormack et al. (2009). [Reciprocal Rank Fusion outperforms CombANZ and Borda Count](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)

---


## Retrieval Lab 在历史长河里的位置

`retrieval_lab` 将以上六代检索技术浓缩在一个不到千行的代码库中。当你运行 `--method bm25` 然后切换到 `--method vector`，最后跑 `--method ensemble` 时，实际上是在经历信息检索三十年的基建进程。

> 💻 Source: [retrieval_lab](../../retrieval_lab/) 完整代码库
