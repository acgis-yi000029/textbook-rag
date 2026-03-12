---
topic: retrieval_lab
dimension: math
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📚 Book: [manning_intro_to_ir.pdf](../../textbooks/manning_intro_to_ir.pdf) — Ch.6 (TF-IDF), Ch.11 (Probabilistic IR / BM25)"
  - "📚 MinerU: [manning_intro_to_ir.md](../../data/mineru_output/manning_intro_to_ir/manning_intro_to_ir/auto/manning_intro_to_ir.md)"
  - "📖 Docs: [RRF Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) — Eq.1"
  - "💻 Source: [retrieval_lab](../../retrieval_lab/) — retrievers/vector_retriever.py"
expiry: 12m
status: current
---

# Retrieval Lab 数学基础

> 📚 Book: Manning, Raghavan & Schütze, [《Introduction to Information Retrieval》](../../textbooks/manning_intro_to_ir.pdf), Ch.6 & Ch.11
> 📖 Docs: [RRF Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)

---


## 符号对照表

| 符号 | 含义（白话） | 英文 | 取值范围 |
|------|-------------|------|---------|
| $q$ | 用户输入的查询 | Query | 字符串 |
| $d$ | 一个文档（段落） | Document | 语料库中的一条 |
| $t$ | 查询中的一个词 | Term | $q$ 的分词结果 |
| $f(t, d)$ | 词 $t$ 在文档 $d$ 中出现的次数 | Term frequency in doc | $\geq 0$ |
| $|d|$ | 文档 $d$ 的长度（词数） | Document length | $> 0$ |
| $\text{avgdl}$ | 语料库中所有文档的平均长度 | Average document length | $> 0$ |
| $N$ | 语料库中的文档总数 | Total documents | $> 0$ |
| $n(t)$ | 包含词 $t$ 的文档数 | Document frequency | $0 \leq n(t) \leq N$ |
| $k_1$ | BM25 中控制词频饱和的参数 | TF saturation | 通常 1.2~2.0 |
| $b$ | BM25 中控制文档长度惩罚的参数 | Length normalization | 通常 0.75 |
| $\text{IDF}(t)$ | 逆文档频率，衡量词的稀有程度 | Inverse Document Frequency | $\geq 0$ |
| $K$ | RRF 中的常数，控制排名衰减速度 | RRF constant k | 通常 60 |
| $r$ | 文档在某个检索器中的排名位置 | Rank position | $\geq 1$ |
| $\vec{a}, \vec{b}$ | 嵌入向量 | Embedding vectors | $\mathbb{R}^D$ |
| $D$ | 向量维度 | Embedding dimension | 768（nomic-embed-text） |

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.11.3

---


## 核心公式

### 公式 1: BM25 评分函数

**直觉：** 把「这个词有多稀有」×「这个词在这篇文档中出现了多少次（但有上限）」对所有查询词求和

$$
\text{BM25}(q, d) = \sum_{t \in q} \text{IDF}(t) \cdot \frac{f(t, d) \cdot (k_1 + 1)}{f(t, d) + k_1 \cdot \left(1 - b + b \cdot \frac{|d|}{\text{avgdl}}\right)}
$$

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.11.4 (Eq. 11.32)

**参数解释：**

| 参数 | 含义 | 例子中对应 |
|------|------|-----------|
| $k_1$ | 词频饱和速度：越大则高频词分数越高 | `rank_bm25` 默认 1.5 |
| $b$ | 长度惩罚强度：$b=0$ 不惩罚，$b=1$ 完全按比例惩罚 | 默认 0.75 |

**推导过程：**

$$
\text{Step 1: IDF 衡量稀有性} \quad \text{IDF}(t) = \ln\left(\frac{N - n(t) + 0.5}{n(t) + 0.5} + 1\right)
$$

$$
\text{Step 2: 词频饱和} \quad \text{TF\_sat}(t, d) = \frac{f(t, d) \cdot (k_1 + 1)}{f(t, d) + k_1 \cdot K_d}
$$

$$
\text{Step 3: 长度归一化因子} \quad K_d = 1 - b + b \cdot \frac{|d|}{\text{avgdl}}
$$

$$
\text{Step 4: 最终得分} \quad \text{BM25}(q, d) = \sum_{t \in q} \text{IDF}(t) \cdot \text{TF\_sat}(t, d)
$$

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.11.4

---

### 公式 2: IDF（逆文档频率）

**直觉：** 一个词出现在越少的文档中，它就越「有信息量」，IDF 值越高

$$
\text{IDF}(t) = \ln\left(\frac{N - n(t) + 0.5}{n(t) + 0.5} + 1\right)
$$

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.6.2.1 (IDF) + Ch.11.3

**参数解释：**

| 参数 | 含义 | 例子中对应 |
|------|------|-----------|
| $N$ | 文档总数 | 教科书所有段落数 |
| $n(t)$ | 包含词 $t$ 的文档数 | "kernel" 出现在多少段落中 |
| $+0.5$ | Laplace 平滑，防止分母为 0 | — |
| $+1$ | 保证 IDF ≥ 0 | — |

**推导过程：**

$$
\text{Step 1: 经典 IDF（无平滑）} \quad \text{IDF}_{\text{classic}}(t) = \ln\frac{N}{n(t)}
$$

$$
\text{Step 2: 加入平滑} \quad \text{IDF}_{\text{smooth}}(t) = \ln\frac{N - n(t) + 0.5}{n(t) + 0.5}
$$

$$
\text{Step 3: 加 1 保证非负} \quad \text{IDF}(t) = \ln\left(\frac{N - n(t) + 0.5}{n(t) + 0.5} + 1\right)
$$

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.6.2

---

### 公式 3: TOC / PageIndex 检索评分

**直觉：** 查询词和章节标题的词重叠越多分越高，完整子串匹配额外加 2 分

$$
\text{TOC\_score}(q, h) = \frac{|\text{terms}(q) \cap \text{terms}(h)|}{\max(|\text{terms}(q)|, 1)} + 2.0 \cdot \mathbb{1}[q \subseteq h]
$$

> 💻 Source: `retrievers/toc_retriever.py:36-39` + `retrievers/pageindex_retriever.py:57-66`

**参数解释：**

| 参数 | 含义 | 例子中对应 |
|------|------|-----------|
| $\text{terms}(x)$ | $x$ 的分词集合（小写 + 正则 `[a-z0-9]+`） | "kernel trick" → {"kernel", "trick"} |
| $h$ | 一个章节标题 | "The Kernel Trick" |
| $\mathbb{1}[q \subseteq h]$ | 查询是否是标题的子串 | "kernel" in "The Kernel Trick" → 1 |

**推导过程：**

$$
\text{Step 1: 词集合重叠} \quad \text{overlap} = |\text{terms}(q) \cap \text{terms}(h)|
$$

$$
\text{Step 2: 归一化} \quad \text{term\_score} = \frac{\text{overlap}}{\max(|\text{terms}(q)|, 1)}
$$

$$
\text{Step 3: 子串 bonus} \quad \text{substr\_bonus} = \begin{cases} 2.0 & \text{if } q \text{ is substring of } h \\ 0.0 & \text{otherwise} \end{cases}
$$

$$
\text{Step 4: 最终得分} \quad \text{score} = \text{term\_score} + \text{substr\_bonus}
$$

> 💻 Source: `retrievers/toc_retriever.py` + `retrievers/pageindex_retriever.py`

---

### 公式 4: Reciprocal Rank Fusion (RRF)

**直觉：** 不看原始分数，只看排名位置。排名第 1 贡献最大，越靠后贡献越小（倒数衰减）

$$
\text{RRF\_score}(d) = \sum_{r \in \text{retrievers}} \frac{1}{K + \text{rank}_r(d)}
$$

> 📖 Docs: [RRF Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) — Eq.1

**参数解释：**

| 参数 | 含义 | 例子中对应 |
|------|------|-----------|
| $K$ | 常数，控制衰减速度 | `rrf_k=60`（代码默认） |
| $\text{rank}_r(d)$ | 文档 $d$ 在检索器 $r$ 中的排名（从 1 开始） | BM25 排第 3 → $\text{rank}_{bm25}(d) = 3$ |

**推导过程：**

$$
\text{Step 1: 单个检索器贡献} \quad \text{score}_r(d) = \frac{1}{K + \text{rank}_r(d)}
$$

$$
\text{Step 2: 多路融合} \quad \text{RRF\_score}(d) = \sum_{r=1}^{R} \text{score}_r(d)
$$

**数值示例（K=60）：**
- 排名第 1：$\frac{1}{60+1} = 0.0164$
- 排名第 2：$\frac{1}{60+2} = 0.0161$
- 排名第 10：$\frac{1}{60+10} = 0.0143$

> 📖 Docs: RRF Paper + 💻 Source: `retrievers/ensemble.py:23`

---

### 公式 5: 余弦相似度 (Cosine Similarity)

**直觉：** 两个向量方向越接近，相似度越高（1=完全一致，0=正交，-1=完全相反）

$$
\text{cos\_sim}(\vec{a}, \vec{b}) = \frac{\vec{a} \cdot \vec{b}}{\|\vec{a}\| \cdot \|\vec{b}\|}
$$

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.6.3

**参数解释：**

| 参数 | 含义 | 例子中对应 |
|------|------|-----------|
| $\vec{a}$ | 查询的嵌入向量 | Ollama `nomic-embed-text` 编码查询 |
| $\vec{b}$ | 文档的嵌入向量 | 预构建 `{book}_vectors.json` 中的 embedding |
| $\|\vec{a}\|$ | 向量 L2 范数 | `np.linalg.norm(a)` |

**推导过程：**

$$
\text{Step 1: 归一化查询向量} \quad \hat{a} = \frac{\vec{a}}{\|\vec{a}\| + \epsilon}
$$

$$
\text{Step 2: 批量归一化文档向量} \quad \hat{b}_i = \frac{\vec{b}_i}{\|\vec{b}_i\| + \epsilon} \quad \forall i
$$

$$
\text{Step 3: 批量内积} \quad \text{sims} = B_{\text{norm}} \cdot \hat{a}
$$

其中 $\epsilon = 10^{-10}$（防止除零）

> 💻 Source: `retrievers/vector_retriever.py:86-91` (`_cosine_sim` 静态方法)

---

### 公式 6: Sirchmunk 评分

**直觉：** 匹配行中查询词命中的比例越高，分数越高

$$
\text{Sirchmunk\_score}(q, \text{line}) = \frac{|\{t \in \text{terms}(q) : t \in \text{line}\}|}{|\text{terms}(q)|}
$$

> 💻 Source: `retrievers/sirchmunk_retriever.py:125-127`

**参数解释：**

| 参数 | 含义 | 例子中对应 |
|------|------|-----------|
| $\text{terms}(q)$ | 查询的分词列表（`[a-zA-Z0-9]+`） | "policy gradient" → ["policy", "gradient"] |
| line | ripgrep-all 匹配到的行文本 | "The policy gradient theorem..." |

---

### 公式 7: Recall@K

**直觉：** 在返回的前 K 个结果中，是否找到了至少一个包含期望关键词的结果

$$
\text{Recall@K}(q) = \begin{cases} 1.0 & \text{若前 K 结果中有命中 expected\_terms 的} \\ 0.0 & \text{否则} \end{cases}
$$

> 💻 Source: `scripts/benchmark.py:recall_at_k()`

**参数解释：**

| 参数 | 含义 | 例子中对应 |
|------|------|-----------|
| $K$ | 查看前 K 个结果 | `--top-k 5` |
| expected_terms | 期望在结果中出现的关键词列表 | `["kernel", "trick"]` |

> 💻 Source: `data/benchmarks/{book}_queries.jsonl`

---


## 公式关系图

```
IDF(t)                   TOC_score(q,h)
  │                          │
  ↓                          ↓
BM25(q,d)          PageIndex_score(q,h)     cos_sim(a,b)     Sirchmunk_score
  │                     │                       │                  │
  └──────┬──────────────┘                       │                  │
         ↓                                      │                  │
    RRF_score(d) ←──────────────────────────────┘──────────────────┘
         │
         ↓
    Recall@K(q)
    (评测指标)
```

---


## 手算练习

### 练习 1: BM25 单词分数

**题目：** 语料库有 N=100 篇文档，词 "kernel" 出现在 n=10 篇中。文档 d 长度 |d|=200 词，平均文档长度 avgdl=150，"kernel" 在 d 中出现 f=3 次。$k_1=1.5, b=0.75$。求 BM25 中 "kernel" 对 d 的贡献分数。

**解答步骤：**

1. IDF = ln((100 - 10 + 0.5) / (10 + 0.5) + 1) = ln(90.5/10.5 + 1) = ln(9.619) = 2.264
2. K_d = 1 - 0.75 + 0.75 × (200/150) = 0.25 + 1.0 = 1.25
3. TF_sat = (3 × 2.5) / (3 + 1.5 × 1.25) = 7.5 / 4.875 = 1.538
4. BM25_term = 2.264 × 1.538 = **3.482**

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.11 练习

### 练习 2: RRF 融合

**题目：** 文档 A 在 BM25 中排第 2，在 TOC 中排第 5。文档 B 在 BM25 中排第 7，在 TOC 中排第 1。K=60。哪个文档 RRF 分数更高？

**解答步骤：**

1. RRF(A) = 1/(60+2) + 1/(60+5) = 0.01613 + 0.01538 = **0.03151**
2. RRF(B) = 1/(60+7) + 1/(60+1) = 0.01493 + 0.01639 = **0.03132**
3. 结果：A 分数 (0.03151) > B 分数 (0.03132)，**文档 A 排名更高**
4. 观察：虽然 B 在 TOC 中排第 1，但 A 在两个方法中都比较靠前，RRF 奖励"各方法都认可"的文档

> 📖 Docs: RRF Paper — Eq.1

### 练习 3: 余弦相似度

**题目：** 查询向量 $\vec{a} = [1, 2, 0]$，文档向量 $\vec{b} = [2, 1, 0]$。求余弦相似度。

**解答步骤：**

1. $\vec{a} \cdot \vec{b} = 1 \times 2 + 2 \times 1 + 0 \times 0 = 4$
2. $\|\vec{a}\| = \sqrt{1^2 + 2^2 + 0^2} = \sqrt{5} = 2.236$
3. $\|\vec{b}\| = \sqrt{2^2 + 1^2 + 0^2} = \sqrt{5} = 2.236$
4. $\cos(\vec{a}, \vec{b}) = \frac{4}{2.236 \times 2.236} = \frac{4}{5} = \textbf{0.8}$
5. 观察：两个向量方向接近但不完全一致，0.8 表示高度相似

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.6.3

---


## 公式速查表

| 名称 | 公式 | 用途 | 前置公式 |
|------|------|------|---------|
| IDF | $\ln\left(\frac{N-n(t)+0.5}{n(t)+0.5}+1\right)$ | 衡量词的稀有程度 | — |
| BM25 | $\sum_{t} \text{IDF}(t) \cdot \frac{f(t,d)(k_1+1)}{f(t,d)+k_1 K_d}$ | 全文检索评分 | IDF |
| TOC/PageIndex | $\frac{|\text{terms}(q) \cap \text{terms}(h)|}{\max(|\text{terms}(q)|,1)} + 2 \cdot \mathbb{1}[q \subseteq h]$ | 标题匹配评分 | — |
| RRF | $\sum_r \frac{1}{K+\text{rank}_r(d)}$ | 多路融合排名 | — |
| Cosine Sim | $\frac{\vec{a} \cdot \vec{b}}{\|\vec{a}\| \cdot \|\vec{b}\|}$ | 向量语义检索 | — |
| Sirchmunk | $\frac{\text{term\_hits}}{|\text{terms}(q)|}$ | grep 行级评分 | — |
| Recall@K | $\mathbb{1}[\exists \text{hit in top-K}]$ | 评测指标 | — |

> 📚 Book: Manning et al., [《Introduction to IR》](../../textbooks/manning_intro_to_ir.pdf), Ch.6 & Ch.11 + 📖 Docs: RRF Paper
