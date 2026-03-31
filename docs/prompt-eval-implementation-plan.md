# Prompt & Engine Management + RAG Evaluation — Implementation Plan

> **目标**：让 Prompt 可编辑、可对比、可评估，让查询引擎可配置、可切换、可测评，让 LLM 回答质量可量化。
> **现状**：Prompt 只读展示 + 基础质量警告（`QualityChecker`），无评估指标；引擎策略硬编码在 config 中，无 UI 管理。

---

## 📍 现状分析

### 已有的基础设施

| 组件 | 位置 | 状态 |
|---|---|---|
| Prompt 数据 | `seed/data.ts` → Payload CMS `prompt-modes` | ✅ 7 种模式，通过 seed 写入 |
| Prompt 展示 | `dashboard/prompts/page.tsx` | ✅ 只读展示，不可编辑 |
| Prompt Hook | `features/prompts/usePromptModes.ts` | ✅ 只有 fetch，无 CRUD |
| 质量检查 | `engine/rag/quality.py` | ✅ 基于规则的 warnings（无引用、无检索结果等） |
| Trace 收集 | `engine/rag/trace.py` | ✅ 记录 retrieval/generation/citation 全链路 |
| LLM 生成 | `engine/rag/generation.py` | ✅ 支持 Ollama + Azure OpenAI |
| QueryLogs | `collections/QueryLogs.ts` | ✅ 记录每次查询 |

### 缺失的能力

| 能力 | 缺失情况 |
|---|---|
| Prompt 编辑 | ❌ 只能改 `data.ts` 再 seed |
| Prompt 版本 | ❌ 改了就覆盖，无法回滚 |
| A/B 对比 | ❌ 无法并排对比两种模式的输出 |
| 回答评分 | ❌ 没有 Faithfulness / Relevancy 等指标 |
| 检索评分 | ❌ 没有 Context Precision / Recall |
| 评估仪表盘 | ❌ 无可视化 |
| 引擎管理 | ❌ 策略组合硬编码（`DEFAULT_STRATEGIES`），无 UI 切换 |
| 引擎预设 | ❌ 无法保存 "快速模式" / "精准模式" 等预设 |
| 引擎测评 | ❌ 无法对比不同引擎组合的检索质量 |

---

## 🏗️ 分阶段实施

### Phase 1: Prompt 可编辑 + 版本历史

> **目标**：在 Dashboard 里直接编辑 System Prompt，每次保存自动记录版本。
> **工作量**：~1 天
> **参考**：Open WebUI 的 Prompt Presets 编辑

#### 1.1 新增 Payload Collection — `PromptVersions`

```
collections/PromptVersions.ts
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `promptModeId` | relationship → prompt-modes | 关联的 Prompt 模式 |
| `version` | number | 版本号（自增） |
| `systemPrompt` | textarea | 该版本的 System Prompt |
| `changeNote` | text | 修改说明 |
| `createdBy` | relationship → users | 谁改的 |
| `createdAt` | date | 时间戳 |

#### 1.2 前端文件新增/修改

| 文件 | 操作 | 说明 |
|---|---|---|
| `features/prompts/usePromptModes.ts` | 修改 | 添加 `updatePrompt()`, `getVersions()` |
| `features/prompts/PromptEditor.tsx` | 新增 | 可编辑的 System Prompt 编辑器 |
| `features/prompts/PromptVersionList.tsx` | 新增 | 版本历史列表，支持回滚 |
| `dashboard/prompts/page.tsx` | 修改 | 集成编辑器和版本历史 |

#### 1.3 Seed Data 更新

`seed/data.ts` 中的 `promptModesData` 不变，仍作为初始数据。用户在 UI 编辑后通过 Payload API 更新，版本记录到 `PromptVersions`。

---

### Phase 2: LLM 回答评估（核心）

> **目标**：每次 RAG 查询自动计算评估指标，存入数据库。
> **工作量**：~2-3 天
> **参考**：RAGAS 框架 + Promptfoo 评分逻辑

#### 2.1 评估指标定义

| 指标 | 衡量什么 | 计算方法 | 分数范围 |
|---|---|---|---|
| **Faithfulness** | 回答是否忠于检索到的 context | LLM-as-Judge：把 answer + context 发给评估 LLM，判断每句话是否有 context 支撑 | 0.0 ~ 1.0 |
| **Answer Relevancy** | 回答是否针对问题 | LLM-as-Judge：从 answer 反向生成问题，计算与原问题的语义相似度 | 0.0 ~ 1.0 |
| **Context Precision** | 检索到的 context 是否精准 | 有效引用数 / 总检索数（已有 `CitationResult` 可算） | 0.0 ~ 1.0 |
| **Context Recall** | 是否检索到了足够信息 | 有 ground-truth 时用，否则用代理指标（回答中引用了多少个 source） | 0.0 ~ 1.0 |
| **Citation Accuracy** | 引用标记是否正确 | valid_citations / (valid + invalid)（已有数据） | 0.0 ~ 1.0 |

#### 2.2 后端新增文件

```
engine/
├── eval/                          # 新增：评估模块
│   ├── __init__.py
│   ├── types.py                   # EvalResult, EvalMetrics 数据类
│   ├── faithfulness.py            # Faithfulness 评分器
│   ├── relevancy.py               # Answer Relevancy 评分器
│   ├── context_metrics.py         # Context Precision / Recall
│   ├── runner.py                  # EvalRunner — 编排所有指标
│   └── prompts.py                 # 评估用的 System Prompts
│
├── api/routes/
│   └── eval.py                    # 新增：评估 API 路由
```

#### 2.3 核心类设计

```python
# engine/eval/types.py

@dataclass
class EvalMetrics:
    """Evaluation scores for a single RAG query."""
    faithfulness: float | None = None      # 0.0 ~ 1.0
    answer_relevancy: float | None = None  # 0.0 ~ 1.0
    context_precision: float | None = None # 0.0 ~ 1.0
    context_recall: float | None = None    # 0.0 ~ 1.0
    citation_accuracy: float | None = None # 0.0 ~ 1.0
    overall_score: float | None = None     # 加权平均
    eval_model: str = ""                   # 用哪个模型做评估
    eval_duration_ms: int = 0              # 评估耗时


@dataclass
class EvalResult:
    """Full evaluation result with detail."""
    metrics: EvalMetrics
    faithfulness_detail: list[dict]  # 每句话的判断
    relevancy_detail: dict           # 反向生成的问题
    warnings: list[str]
```

```python
# engine/eval/runner.py

class EvalRunner:
    """Orchestrates evaluation of a RAG response."""

    async def evaluate(
        self,
        question: str,
        answer: str,
        contexts: list[str],       # 检索到的 chunk 文本
        citations: CitationResult,
        eval_model: str = "gpt-4o-mini",
    ) -> EvalResult:
        """Run all eval metrics in parallel."""
        ...
```

#### 2.4 集成到现有 RAG Pipeline

在 `engine/rag/core.py` 的 `query()` 方法末尾，**异步触发**评估（不阻塞主响应）：

```python
# 在 RAGCore.query() 末尾添加
if config.enable_eval:
    # Fire-and-forget: 后台评估，结果存数据库
    asyncio.create_task(
        self._eval_runner.evaluate(
            question=question,
            answer=citation_result.cleaned_answer,
            contexts=[c.text for c in retrieval.chunks],
            citations=citation_result,
        )
    )
```

#### 2.5 新增 Payload Collection — `EvalResults`

```
collections/EvalResults.ts
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `queryLogId` | relationship → query-logs | 关联的查询 |
| `promptModeSlug` | text | 使用的 prompt 模式 |
| `modelName` | text | 使用的 LLM 模型 |
| `faithfulness` | number | 0.0 ~ 1.0 |
| `answerRelevancy` | number | 0.0 ~ 1.0 |
| `contextPrecision` | number | 0.0 ~ 1.0 |
| `contextRecall` | number | 0.0 ~ 1.0 |
| `citationAccuracy` | number | 0.0 ~ 1.0 |
| `overallScore` | number | 加权平均 |
| `evalModel` | text | 评估用的模型 |
| `detail` | json | 详细评估结果 |
| `evalDurationMs` | number | 评估耗时 |

#### 2.6 API 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/eval/run` | 手动触发单次评估 |
| `POST` | `/api/eval/batch` | 批量评估（多个问题 × 多个 prompt 模式） |
| `GET` | `/api/eval/results?queryLogId=X` | 获取某次查询的评估结果 |
| `GET` | `/api/eval/summary?promptMode=X` | 获取某个 prompt 模式的平均分 |

---

### Phase 3: Prompt A/B 对比测试

> **目标**：选 2+ 个 prompt 模式，输入同一个问题，并排对比输出和评分。
> **工作量**：~1-2 天
> **参考**：Promptfoo 的 side-by-side 对比

#### 3.1 前端新增文件

```
features/prompts/
├── usePromptComparison.ts        # A/B 测试 hook
├── PromptComparison.tsx          # 对比面板主组件
├── ComparisonCard.tsx            # 单个模式的输出卡片
└── ComparisonScoreBar.tsx        # 评分对比柱状图

app/(frontend)/(app)/dashboard/prompts/
└── compare/
    └── page.tsx                  # A/B 对比页面
```

#### 3.2 对比流程

```
用户操作:
1. 选择 2-4 个 Prompt 模式
2. 输入一个测试问题（或从 Questions 模块拉已有问题）
3. 点击 "运行对比"

系统执行:
1. 同一个问题，分别用选中的模式调 RAG API
2. 每个结果自动跑评估（Phase 2 的 EvalRunner）
3. 并排显示: 回答内容 + 评估分数 + 用时

输出:
┌─────────────────┬─────────────────┐
│ Default (0.87)  │ Learning (0.92) │
│ ──────────────  │ ──────────────  │
│ 回答内容...      │ 回答内容...      │
│                 │                 │
│ Faith: 0.90     │ Faith: 0.95     │
│ Relev: 0.85     │ Relev: 0.90     │
│ Time:  1.2s     │ Time:  1.8s     │
└─────────────────┴─────────────────┘
```

---

### Phase 4: 评估仪表盘

> **目标**：可视化所有评估数据，发现趋势和问题。
> **工作量**：~1-2 天
> **参考**：RAGAS dashboard + Dify 的观测面板

#### 4.1 前端新增文件

```
features/evaluation/
├── useEvalDashboard.ts           # 仪表盘数据 hook
├── EvalDashboard.tsx             # 仪表盘主组件
├── EvalScoreChart.tsx            # 评分趋势折线图
├── EvalDistribution.tsx          # 分数分布直方图
├── EvalModeComparison.tsx        # 各模式平均分对比
└── types.ts                      # 评估相关类型

app/(frontend)/(app)/dashboard/evaluation/
└── page.tsx                      # 评估仪表盘页面
```

#### 4.2 仪表盘展示内容

| 面板 | 展示什么 |
|---|---|
| **Overall Score 趋势** | 最近 7 天的平均 overall_score 折线图 |
| **各模式对比** | 7 种 prompt 模式的平均各项指标雷达图 |
| **低分警报** | Faithfulness < 0.7 或 Relevancy < 0.6 的查询列表 |
| **模型对比** | 不同 LLM 模型的评估分数对比 |
| **最佳/最差问题** | 分数最高和最低的 5 个问题 |

### Phase 5: 查询引擎管理

> **目标**：在 UI 中管理检索策略组合，支持单引擎 / 混合引擎 / 预设切换，并可对引擎组合做测评。
> **工作量**：~2 天
> **参考**：RAGFlow 引擎配置 + 你现有的 `StrategyRegistry`

#### 5.1 现有基础

后端已有完整的策略架构：

| 组件 | 位置 | 说明 |
|---|---|---|
| 5 个策略 | `engine/rag/strategies/` | FTS5-BM25, Vector, TOC, PageIndex, Sirchmunk |
| 注册中心 | `strategies/registry.py` | `list_all()` 可查询所有策略状态 |
| 策略配置 | `rag/config.py` | `DEFAULT_STRATEGIES`, `QueryConfig.enabled_strategies` |
| RRF 融合 | `rag/fusion.py` | 多策略结果融合 |

**缺失的是**：没有 UI 管理界面，没有预设保存，策略组合只能通过 API 参数传入。

#### 5.2 新增 Payload Collection — `EnginePresets`

```
collections/EnginePresets.ts
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | text | 预设名（如 "快速模式"、"精准模式"） |
| `slug` | text | URL 标识 |
| `description` | text | 预设描述 |
| `strategies` | json | 启用的策略列表 `["fts5_bm25", "vector"]` |
| `topK` | number | 返回结果数 |
| `fetchK` | number | 检索候选数 |
| `rrfK` | number | RRF 融合参数 |
| `isDefault` | checkbox | 是否默认引擎 |
| `isEnabled` | checkbox | 是否可用 |
| `sortOrder` | number | 排序 |

#### 5.3 Seed Data — `enginePresetsData`

```typescript
// 新增到 seed/data.ts
export const enginePresetsData = [
  {
    name: 'Fast',
    slug: 'fast',
    description: 'FTS5 only — fastest, keyword-based',
    strategies: ['fts5_bm25'],
    topK: 5,
    fetchK: 15,
    rrfK: 60,
    isDefault: false,
    isEnabled: true,
    sortOrder: 1,
  },
  {
    name: 'Balanced',
    slug: 'balanced',
    description: 'FTS5 + Vector + TOC — good balance of speed and quality',
    strategies: ['fts5_bm25', 'vector', 'toc_heading'],
    topK: 5,
    fetchK: 15,
    rrfK: 60,
    isDefault: true,
    isEnabled: true,
    sortOrder: 2,
  },
  {
    name: 'Precise',
    slug: 'precise',
    description: 'All strategies — maximum recall, slower',
    strategies: ['fts5_bm25', 'vector', 'toc_heading', 'pageindex', 'sirchmunk'],
    topK: 8,
    fetchK: 24,
    rrfK: 60,
    isDefault: false,
    isEnabled: true,
    sortOrder: 3,
  },
  {
    name: 'Semantic Only',
    slug: 'semantic-only',
    description: 'Vector search only — best for conceptual questions',
    strategies: ['vector'],
    topK: 5,
    fetchK: 20,
    rrfK: 60,
    isDefault: false,
    isEnabled: true,
    sortOrder: 4,
  },
]
```

#### 5.4 前端文件

```
features/engines/
├── types.ts                      # EnginePreset 类型
├── useEnginePresets.ts            # CRUD hook (fetch/create/update/delete presets)
├── useEngineEval.ts              # 引擎评估 hook (同一问题不同引擎对比)
├── EnginePresetCard.tsx           # 单个预设卡片（显示策略组合）
├── EngineSelector.tsx             # 引擎选择器（用于 Chat 页面）
└── EngineComparison.tsx           # 引擎对比面板

app/(frontend)/(app)/dashboard/engines/
└── page.tsx                      # 引擎管理页面
```

#### 5.5 功能详情

##### 引擎管理页面

| 功能 | 说明 |
|---|---|
| **查看所有预设** | 卡片列表，每个卡片显示策略组合 + 参数 |
| **设置默认引擎** | 一键切换默认（同时只能有一个 isDefault） |
| **创建/编辑预设** | 多选策略 checkbox + 参数调节滑块 |
| **删除预设** | 非默认预设可删除 |
| **实时状态** | 显示每个策略的 `available` 状态（来自 `registry.list_all()`） |

##### Chat 页面引擎选择器

```
┌─ 引擎选择 ────────────────────┐
│ ⚡ Fast         (FTS5)        │
│ ⚖️ Balanced ✓   (FTS5+Vec+TOC)│  ← 当前默认
│ 🎯 Precise      (All 5)      │
│ 🧠 Semantic     (Vector)     │
│ ─────────────────────────── │
│ 🔧 Custom...                 │  ← 临时自定义
└──────────────────────────────┘
```

##### 引擎评估（Phase 2 评估系统的扩展）

同一个问题用不同引擎预设跑，对比：
- Context Precision（检索精度）
- Context Recall（检索召回）
- 检索耗时
- 最终回答的 Faithfulness（间接衡量检索质量对回答的影响）

#### 5.6 后端 API

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/engine-presets` | 获取所有引擎预设 |
| `POST` | `/api/engine-presets` | 创建新预设 |
| `PATCH` | `/api/engine-presets/:id` | 更新预设 |
| `DELETE` | `/api/engine-presets/:id` | 删除预设 |
| `GET` | `/api/strategies` | 获取所有可用策略的实时状态 |
| `POST` | `/api/eval/engine-compare` | 引擎对比评估（Phase 2 扩展） |

---

## 📅 实施优先级

| 阶段 | 内容 | 工作量 | 前置依赖 | 价值 |
|---|---|---|---|---|
| **Phase 1** | Prompt 可编辑 + 版本 | ~1 天 | 无 | 🟠 减少改 prompt 的摩擦 |
| **Phase 2** | LLM 回答评估 | ~2-3 天 | 无 | 🔴 核心价值 — 量化质量 |
| **Phase 3** | A/B 对比 | ~1-2 天 | Phase 2 | 🟠 快速找最佳 prompt |
| **Phase 4** | 评估仪表盘 | ~1-2 天 | Phase 2 | 🟡 可视化洞察 |
| **Phase 5** | 查询引擎管理 | ~2 天 | 无（评估部分依赖 Phase 2）| 🔴 用户可控的检索体验 |

> **建议路径：Phase 2 → Phase 5 → Phase 1 → Phase 3 → Phase 4**
>
> Phase 2（评估指标）是地基，没有它后面的对比和仪表盘都没数据。
> Phase 5（引擎管理）独立性强，UI 部分可以和 Phase 2 并行，评估部分等 Phase 2 完成后接入。
> Phase 1（编辑）虽然简单但不紧急，可以和 Phase 2 并行。

---

## 🔗 参考项目提取计划

| 参考项目 | 提取什么 | 用在哪个 Phase |
|---|---|---|
| **RAGAS** (`ragas/src/ragas/metrics/`) | Faithfulness / Relevancy 的 prompt 模板和计算逻辑 | Phase 2 |
| **Promptfoo** (`promptfoo/src/evaluator/`) | 评估运行器架构、side-by-side 对比逻辑 | Phase 2, 3 |
| **Open WebUI** (`open-webui/src/lib/components/chat/`) | Prompt 编辑器 UI 组件 | Phase 1 |
| **Dify** (`dify/web/app/components/app/log/`) | 评估日志面板 UI 设计 | Phase 4 |
| **RAGFlow** (`ragflow/rag/`) | 引擎配置管理、策略切换 UI | Phase 5 |

---

## 📐 Seed Data 扩展

Phase 2 需要在 `seed/data.ts` 中新增评估相关的 prompt：

```typescript
// 新增到 seed/data.ts
export const evalPromptsData = [
  {
    name: 'faithfulness-judge',
    slug: 'faithfulness-judge',
    description: 'Evaluates if the answer is faithful to the provided context',
    systemPrompt: 'You are an impartial judge...',  // 从 RAGAS 提取
    isInternal: true,
  },
  {
    name: 'relevancy-judge',
    slug: 'relevancy-judge',
    description: 'Evaluates if the answer is relevant to the question',
    systemPrompt: 'You are a relevancy evaluator...',  // 从 RAGAS 提取
    isInternal: true,
  },
]
```

---

## ⚠️ 注意事项

1. **评估成本**：每次评估需要额外调一次 LLM（评估模型），建议用 `gpt-4o-mini`（便宜）做评估
2. **异步执行**：评估不能阻塞用户的 chat 响应，必须后台异步进行
3. **评估模型 ≠ 回答模型**：回答用任意模型，评估统一用同一个模型确保一致性
4. **冷启动**：初期没有评估数据时，仪表盘会很空，需要批量跑一次历史数据
