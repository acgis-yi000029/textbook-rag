---
description: textbook-rag Agentic RAG 演进路线图 — 从单轮检索到闭环智能体
---

# 🧠 Agentic RAG 演进路线

> 参考来源：Qwen 团队关于 "From Reasoning Thinking to Agentic Thinking" 的论述
> 核心思路：RAG 本身就是 proto-agentic 系统 — 检索就是行动。现在是"想一次→做一次→结束"，
> 目标是"想→做→评估→再做→答"的闭环。

---

## 当前架构 (v1: 开环 RAG)

```
用户提问 → 检索 (FTS5/向量) → 拼上下文 → LLM 一次性生成 → 答案 + 引用
```

**局限**：
- 检索失败时无重试机制
- 无法处理需要多步检索的复杂问题
- LLM 被动接收检索结果，无法参与检索决策

---

## 演进路线

### Phase 1: 检索自评 + 重试 (闭环) 🔴 高优先

在现有 pipeline 加一个 **self-reflection step**：

```
用户问 → 检索 → LLM 自评:"检索结果能回答吗?"
  ├─ Yes → 生成答案
  └─ No  → 改写 query → 再检索 → 生成答案
```

**实现位置**: `engine/rag/strategies/` 新增 `agentic_strategy.py`

**预期收益**: 显著减少"检索不到就胡说"的问题

**工作量**: 中等 — 核心是多一次 LLM 调用 + query rewrite prompt

### Phase 2: 多步查询分解 🟡 中优先

让 LLM 把复杂问题分解为多个检索步骤：

```
"比较 Ch3 和 Ch7 对 normalization 的讲解"
  → Step 1: 检索 Ch3 关于 normalization 的内容
  → Step 2: 检索 Ch7 关于 normalization 的内容
  → Step 3: 综合比较生成答案
```

**适用场景**:
- 跨章节比较
- "总结这本书关于 X 的所有内容"
- "这个公式在后面哪里用到了？"

### Phase 3: LLM 选择检索策略 🟢 低优先

让 LLM 决定用 FTS5 还是向量搜索还是混合：

| 现在 | Phase 3 |
|------|---------|
| 检索策略固定 | LLM 判断问题类型 → 选策略 |
| chunk 数量固定 | LLM 判断"够不够" → expand |

### Phase 4: Multi-Agent 架构 ⚪ 远期

```
Orchestrator Agent
  ├── Query Analyzer（理解意图、分解问题）
  ├── Retrieval Agent（选策略、执行检索、评估结果）
  ├── Synthesis Agent（生成答案、标注引用）
  └── QA Agent（验证答案是否真的来自检索结果 → 防幻觉）
```

---

## 关键风险: 奖励攻击 / 幻觉

> 文章原文："A model with search might learn to look up answers directly during RL"

RAG 场景的对应风险：
- 模型编造不在检索结果中的内容（幻觉）
- 模型忽略检索结果、依赖自身参数知识
- Citation 指向存在但不相关的 chunk

**防御措施**:
- QA Agent 交叉验证答案与 source chunks
- Citation grounding 检查
- 置信度分数 + 用户反馈闭环

---

## 设计原则

1. **环境质量 = 检索基础设施质量** — chunk 切割策略、索引覆盖率决定 RAG 上限
2. **闭环优于开环** — 任何"搜一次就完"的路径都应考虑加 self-reflection
3. **渐进式改造** — 从 Phase 1 开始，每个 phase 独立可交付、可回滚
4. **可观测性** — Book Explorer (TOC/章节/chunk) 本质上是在提升环境可观测性
