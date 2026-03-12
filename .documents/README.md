# 官方文档与论文目录

存放下载到本地的官方文档，以及论文引用链接。用于知识地图引证。

## 目录结构

```
.documents/
├── README.md
├── retrieval/              ← 信息检索
│   ├── papers.md           ← 论文链接集（公开论文直接 URL）
│   └── elasticsearch_bm25_similarity.md
├── nlp/                    ← 自然语言处理
├── ml/                     ← 机器学习
├── rl/                     ← 强化学习
├── tools/                  ← 工具/框架文档
└── {topic}/                ← 按主题扩展
```

## 分类规则

| 分类 | 内容 | 示例 |
|------|------|------|
| `retrieval/` | IR、搜索、RAG | BM25、RRF、DPR |
| `nlp/` | 分词、嵌入、Transformer | Tokenization、BERT |
| `ml/` | 传统 ML、优化 | SVM、Gradient Descent |
| `rl/` | 强化学习 | Q-Learning、PPO |
| `tools/` | 框架/库文档 | LangChain、LlamaIndex |

## 论文引用规则

- **公开论文** → 直接用 URL，不需要下载到本地
- **需要本地存档的文档** → 下载到对应分类目录
- 每个分类目录下可放 `papers.md` 汇总论文链接

### papers.md 格式

```markdown
# {分类} 论文链接

| 简称 | 标题 | 作者 | 年份 | 链接 |
|------|------|------|------|------|
| RRF | Reciprocal Rank Fusion... | Cormack et al. | 2009 | [PDF](https://...) |
```

## 在知识地图中引用

```
> 📖 Docs: [名称](.documents/分类/文件名) — 章节          ← 本地文档
> 📖 Paper: [RRF](https://plg.uwaterloo.ca/~...pdf)      ← 公开论文直接 URL
```

## 来源优先级

1. 📚 教科书 → `textbooks/`
2. 💻 开源项目源码 → `.github/`
3. 📖 官方文档（本地） → `.documents/{分类}/`
4. 📖 公开论文 → 直接 URL
5. 📖 在线文档 → 直接 URL
