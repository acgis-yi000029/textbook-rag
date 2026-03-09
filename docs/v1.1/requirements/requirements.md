# Textbook RAG v1.1 — 需求文档

> **版本**: 1.1  
> **作者**: Alice (PM)  
> **日期**: 2026-03-08  
> **前置**: v1.0 已完成并通过全部 10 阶段 Review  

---

## 1. 项目概述

### 1.1 背景

v1.0 交付了一个可用的教科书 RAG 系统：双栏 UI（左 PDF / 右 Chat）、FTS5 + ChromaDB 混合检索、Ollama LLM 生成、inline citation 链接跳页。

然而在实际使用中暴露出四个核心问题：

1. **不知道哪里坏了**：检索无命中、citation 无效、context 为空时，用户和开发者看不到根因
2. **无法调参**：top_k / fetch_k / FTS vs vector 权重等关键参数硬编码，无法实验
3. **citation 不可靠**：LLM 生成的 `[N]` 可能指向错误 source，无校验/清洗链路
4. **生成盲调**：没有 retrieval 和 citation 的稳定基础，调 prompt / model 全凭猜测

> **Ref**: Krug, *Don't Make Me Think*, Ch9 — "Usability testing will always produce surprises, because it shows you what real users actually encounter." v1.0 缺乏可观测性，等效于没有 usability testing 的系统。

### 1.2 目标

在 v1.0 基础上新增 **4 个功能模块**，必须按以下顺序交付：

| 序号 | 模块 | 目的 |
|------|------|------|
| 1 | **Trace & Quality** | 可观测性：知道系统哪里坏了 |
| 2 | **Retrieval** | 可控性：控制"找什么证据、送什么证据" |
| 3 | **Citations** | 可验证性：把 citation 变成可点击、可验证的证据链 |
| 4 | **Generation** | 可优化性：在前三层稳定后优化答案质量 |

> **Ref**: Norman, *The Design of Everyday Things*, Ch1 — "Discoverability: Is it possible to even figure out what actions are possible and where and how to perform them?" 四个模块逐层解决 discoverability 问题。

### 1.3 范围

**In Scope (v1.1)**:
- 4 个模块的完整前后端实现
- 向后兼容 v1.0 API（新字段可选，旧客户端不受影响）
- 现有 26 个测试用例全部保持通过
- 各模块新增测试用例

**Out of Scope (v1.1)**:
- 多用户 / 鉴权
- RAG 管道的流式输出 (streaming)
- 多模态（图表 / 公式检索）
- 知识库管理（书籍增删改）

---

## 2. 目标用户

### 2.1 用户画像

延续 v1.0 的三类用户，v1.1 重点服务前两类：

| 角色 | v1.1 新增价值 |
|------|--------------|
| **学生** | citation 可点击跳页 + snippet 高亮，真正"看到证据" |
| **TA / 教师** | Trace 面板快速定位回答质量问题，Retrieval 面板调参优化 |
| **项目评审员** | Quality warnings 直观展示系统健康度 |

### 2.2 用户场景

**场景 1: TA 排查 "为什么回答不对"**
1. 提问后切换到 Trace 模式
2. 看到 FTS 0 hits → 意识到关键词未命中
3. 看到 Quality warning: "NO_FTS_HITS"
4. 切到 Retrieval 面板关闭 FTS，只用 vector → 拿到正确结果

**场景 2: 学生验证答案来源**
1. 看到答案中 `[2]` 的 citation
2. 点击 → PDF 跳到对应页
3. 看到 bbox 高亮的原文段落
4. 确认答案确实来自教科书

**场景 3: 开发者调优 RAG 管道**
1. 打开 Retrieval 面板，调 top_k 到 10，fetch_k 到 30
2. 切换到 hybrid 模式，看 FTS / vector / fused 各多少条
3. 打开 Generation 面板，切换到更大的 model
4. 对比回答质量变化

> **Ref**: Krug, *Don't Make Me Think*, Ch3 — "Don't make me think" 原则：用户不应该思考"这个 citation 到底对不对"，系统应该自动校验并清晰展示。

---

## 3. 功能需求

### 3.1 模块 1: Trace & Quality（可观测性）

**优先级**: P0 — 最先开发  
**依赖**: 无（在现有 API 基础上扩展）

**FR-1.1** 请求参数展示
- 在 Trace 面板中展示: question, top_k, fetch_k, filters, active_book_title

**FR-1.2** 检索结果分层展示（4 种检索策略）
- 分别展示 4 种检索策略各自的命中结果：
  - **① FTS5 BM25 hits**: 关键词精确匹配结果
  - **② Vector (Semantic) hits**: 语义相似度结果
  - **③ PageIndex Tree hits**: LLM 推理树搜索结果（基于 toc_entries 目录树）
  - **④ Metadata Filter hits**: 结构化筛选结果（按 book/chapter/page/content_type）
- **Fused results**: RRF 融合后的最终排序
- 每条 hit 显示: strategy, rank, chunk_id, book_title, chapter_title, page_number, score, snippet
- 可视化对比：哪些 chunk 只被一种策略命中、哪些被多种策略同时命中

**FR-1.3** 生成链路展示
- 展示 system_prompt, user_prompt（可折叠）
- 展示实际使用的 model 名称
- 展示 citation 清洗结果：原始回答 vs 清洗后回答，有效/无效 citation 列表

**FR-1.4** Quality Warnings
- 后端自动检测并返回 warnings 列表：
  - `NO_FTS_HITS`: FTS 搜索返回 0 条结果
  - `NO_VECTOR_HITS`: vector 搜索返回 0 条结果
  - `NO_PAGEINDEX_HITS`: PageIndex 树搜索返回 0 条结果
  - `NO_METADATA_HITS`: metadata filter 搜索返回 0 条结果
  - `NO_CONTEXT`: fused 结果为空，模型无 context 可用
  - `NO_VALID_CITATIONS`: 清洗后回答中没有有效 citation
  - `CITATIONS_REMOVED`: 有 citation 被清洗移除
- 前端 Trace 面板以 warn / error 色块展示 warnings
- 各策略 0 hits 时在对应区域显示建议（如 "尝试关闭 FTS 改用 Vector" 等）

> **Ref**: Norman, *The Design of Everyday Things*, Ch1 — "Feedback: ...there is full and continuous information about the results of actions." Quality warnings 实现了 Norman 的 feedback 原则。

### 3.2 模块 2: Retrieval（可控性）

**优先级**: P0 — 第二个开发  
**依赖**: Trace & Quality

**FR-2.1** top_k 和 fetch_k 控制
- 前端 Retrieval 面板提供 top_k（1~20）和 fetch_k（top_k~60）滑块
- 后端接受 `fetch_k` 参数（原本硬编码为 `top_k * 3`）

**FR-2.2** 检索策略开关（4 种独立开关）
- 每种检索策略独立可启/禁：
  - **① FTS5 BM25**: 开/关（默认开）
  - **② Vector (Semantic)**: 开/关（默认开）
  - **③ PageIndex Tree**: 开/关（默认开）— 基于 `toc_entries` 表构建目录树，LLM 推理导航
  - **④ Metadata Filter**: 开/关（默认关）— 纯结构化查询，按 book/chapter/page/content_type 匹配
- 前端使用独立 checkbox 而非单选，允许任意组合
- 后端根据启用的策略列表执行，跳过禁用的策略
- 至少保留一种策略启用，全部关闭时提示用户

**FR-2.3** RRF 参数
- 前端提供 RRF k 值输入（默认 60，范围 1~200）
- 后端 `_rrf_fuse()` 接受多个结果列表（2~4 个），使用可配置的 k 值
- 只有 1 种策略启用时跳过 RRF，直接用该策略结果

**FR-2.4** Filters 控制
- 前端提供 content_type 多选（text / table / image / equation）
- chapter_ids filter 已有，UI 中暴露出来
- Metadata Filter 策略（④）专用：精确匹配 page_number 范围

**FR-2.5** PageIndex Tree 配置
- PageIndex 使用 `toc_entries` 表中的目录树结构
- 可配置: 树搜索 LLM model（可与主生成 model 不同）
- 可配置: 最大返回节点数
- Trace 中展示 LLM 的 thinking 和选中的节点路径

> **Ref**: Manning et al., *Introduction to Information Retrieval*, Ch8 — "Evaluation in information retrieval" 强调了 precision/recall 权衡。4 种检索策略的独立开关让用户能精确实验每种方法对检索质量的影响，找到最佳组合。

### 3.3 模块 3: Citations（可验证性）

**优先级**: P1 — 第三个开发  
**依赖**: Retrieval

**FR-3.1** Citation 校验
- 后端在生成后检查每个 `[N]` 是否映射到有效 source
- 返回 `valid_citations` / `invalid_citations` 列表

**FR-3.2** Citation 清洗
- 移除无效 citation（已有 `_sanitize_citations`）
- 清洗结果记录到 trace 中（raw_answer, cleaned_answer）

**FR-3.3** Citation → Source 映射
- 前端点击 citation `[N]` 时，精确映射到 sources[N-1]
- 获取该 source 的所有 source_locators（可能跨页）

**FR-3.4** PDF 跳页 + bbox 高亮
- 点击 citation → PDF 跳到对应 page_number
- BboxOverlay 渲染该 chunk 的 bbox 区域（蓝色高亮）
- 多个 bbox（跨页 chunk）时高亮第一个并提示"还有 N 个位置"

**FR-3.5** 无效 Citation UI 策略
- 无效 citation `[N]` 显示为灰色删除线样式
- hover 时提示 "Citation N is not available in this response"
- 不可点击

> **Ref**: Manning et al., *Introduction to Information Retrieval*, Ch8.6 — Evaluation metrics depend on verifiable provenance. Citation 模块确保每条引用都可追溯到原始 PDF 位置。

### 3.4 模块 4: Generation（可优化性）

**优先级**: P1 — 最后开发  
**依赖**: Citations

**FR-4.1** 模型选择（已有，增强）
- 保持现有 model 下拉选择
- 新增：显示模型参数量 / 上下文窗口（如 Ollama API 提供）

**FR-4.2** Prompt 配置
- 前端 Generation 面板提供 system prompt 模板选择
- 预设模板：default / concise / detailed / academic
- 高级模式：直接编辑 system prompt

**FR-4.3** Citation 输出规则
- 可配置：`citation_style` = inline_numbered (默认) / footnote / none
- 后端根据 style 调整 system prompt 中 citation 指令

**FR-4.4** 回答长度 / 风格
- 可配置：`max_tokens` 范围（目前无限制，交由模型决定）
- 可配置：`temperature`（如 Ollama 支持）

**FR-4.5** Citation 失败补救
- 当清洗后 0 有效 citation 时，自动触发 warning
- 可选策略：`retry_with_explicit_citation_instruction`（在 prompt 末尾追加 citation 强调）

> **Ref**: Krug, *Don't Make Me Think*, Ch10 — "Usability is about people and how they understand and use things." Generation 面板让高级用户能理解和调整 LLM 的行为模式。

---

## 4. 非功能需求

### 4.1 性能

- **NFR-1**: 新增参数不应使单次请求延迟增加超过 10%（PageIndex 策略需 LLM 调用，单独统计）
- **NFR-2**: Trace 面板的 citation cleaning trace 不应引入额外 LLM 调用
- **NFR-3**: 前端面板切换应 < 100ms（纯 UI 操作，无 API 调用）

### 4.2 向后兼容

- **NFR-4**: 所有新增 API 字段必须有默认值，v1.0 客户端不传新参数时行为不变
- **NFR-5**: 现有 26 个测试用例全部通过

### 4.3 安全

- **NFR-6**: Prompt injection 防护 — system prompt 不接受用户直接输入
- **NFR-7**: content_type filter 白名单校验

### 4.4 可用性

- **NFR-8**: Trace / Retrieval / Generation 面板在 Chat 面板内以 tab 或可折叠区域展示，不额外占屏幕空间
- **NFR-9**: 所有新增控件默认值与 v1.0 行为一致（用户不需要配置即可使用）

> **Ref**: Norman, *The Design of Everyday Things*, Ch2 — "Conceptual models: When things are visible, they tend to be easier to control." 面板的 progressive disclosure 平衡了初学者与高级用户需求。

---

## 5. 约束条件

### 5.1 技术约束

- 后端: Python / FastAPI，不引入新框架
- 前端: React / TypeScript / Tailwind，不引入新 UI 库
- 数据库: 不改变现有 schema（新功能复用 `toc_entries` 表作为 PageIndex 树数据源）
- LLM: 继续使用 Ollama，PageIndex 树搜索可配置独立 model

### 5.2 开发约束

- **强制开发顺序**: Trace → Retrieval → Citations → Generation
  - 没 trace，不知道问题在哪
  - 没 retrieval，citation 没证据可挂
  - 没 citations，生成再漂亮也落不到 PDF
  - generation 应该最后调，不然全是盲调
- v1.0 代码只做扩展，不做破坏性重构

### 5.3 时间约束

- 每个模块独立可测试、可 review
- 四个模块在同一个 sprint 内完成

---

## 6. 验收标准

### 6.1 模块 1: Trace & Quality

- [ ] AC-1.1: Trace 面板展示 question, top_k, fetch_k, filters, model, 启用的策略列表
- [ ] AC-1.2: Trace 面板分别展示 4 种检索策略结果 + fused 结果（含 rank, score, snippet）
- [ ] AC-1.3: Trace 面板展示 system_prompt, user_prompt（可折叠）
- [ ] AC-1.4: Trace 面板展示 citation 清洗结果（raw vs cleaned, valid/invalid list）
- [ ] AC-1.5: 后端返回 quality warnings 列表，前端以色块展示
- [ ] AC-1.6: 4 种策略各自 0 hits / 无 context / 无 citation 场景各有对应 warning
- [ ] AC-1.7: PageIndex 策略的 trace 展示 LLM thinking 和选中节点路径

### 6.2 模块 2: Retrieval

- [ ] AC-2.1: 前端提供 top_k / fetch_k 滑块，后端正确响应
- [ ] AC-2.2: 4 种检索策略可独立开关，任意组合均正确执行
- [ ] AC-2.3: RRF k 值可配置且影响融合结果
- [ ] AC-2.4: content_type filter 可多选且生效
- [ ] AC-2.5: PageIndex 树搜索正确使用 toc_entries 构建目录树
- [ ] AC-2.6: 只启用 1 种策略时跳过 RRF，直接返回该策略结果

### 6.3 模块 3: Citations

- [ ] AC-3.1: citation 清洗结果包含 valid/invalid 列表
- [ ] AC-3.2: 点击有效 citation → PDF 跳页 + bbox 高亮
- [ ] AC-3.3: 无效 citation 显示灰色样式，不可点击
- [ ] AC-3.4: Source Card 展示完整 snippet 和 chapter/page 信息

### 6.4 模块 4: Generation

- [ ] AC-4.1: prompt 模板可切换（default / concise / detailed / academic）
- [ ] AC-4.2: model 选择保持工作
- [ ] AC-4.3: citation 输出风格可配置
- [ ] AC-4.4: citation 失败时产生 warning 且有补救策略可选

### 6.5 通用

- [ ] AC-5.1: v1.0 的 26 个测试用例全部通过
- [ ] AC-5.2: 每个模块新增至少 3 个测试用例
- [ ] AC-5.3: 前端 tsc --noEmit 通过
- [ ] AC-5.4: 后端 ruff check 通过

---

## 7. 附录

### 7.1 教科书引用

| 引用 | 来源 |
|------|------|
| Usability testing surprises | Krug, *Don't Make Me Think*, Ch9 |
| Discoverability | Norman, *The Design of Everyday Things*, Ch1 |
| Don't make me think | Krug, *Don't Make Me Think*, Ch3 |
| Feedback principle | Norman, *The Design of Everyday Things*, Ch1 |
| Evaluation in IR | Manning et al., *Introduction to Information Retrieval*, Ch8 |
| Provenance & evaluation | Manning et al., *Introduction to Information Retrieval*, Ch8.6 |
| Usability & understanding | Krug, *Don't Make Me Think*, Ch10 |
| Conceptual models & visibility | Norman, *The Design of Everyday Things*, Ch2 |

### 7.2 与 v1.0 的关系

v1.1 是 v1.0 的**增量扩展**，不是重写。所有 v1.0 功能保持不变，v1.1 在其基础上新增 4 个功能模块。v1.0 文档保留在 `docs/v1.0/` 目录下。

### 7.3 开发顺序依据

```
Trace & Quality ──→ Retrieval ──→ Citations ──→ Generation
    (知道坏了)      (控制证据)   (验证证据)    (优化答案)
```

这是一个**从可观测到可控制到可验证到可优化**的渐进链路。每一层都依赖前一层的稳定输出。

### 7.4 四种检索策略总览

```
Query
  ├─① FTS5 BM25 ──────── 关键词精确匹配，亚毫秒级
  ├─② ChromaDB Vector ──── 语义相似度，理解同义词
  ├─③ PageIndex Tree ───── LLM 推理导航 toc_entries 目录树
  ├─④ Metadata Filter ──── 结构化精确筛选 (book/chapter/page/type)
  │
  └─ RRF Fusion ─────────→ Top-K Ranked Results → LLM Generation
```

| 策略 | 优势 | 劣势 | 适用场景 |
|------|------|------|----------|
| ① FTS5 BM25 | 速度极快，精确词匹配 | 不理解同义词 | 已知关键术语查询 |
| ② Vector | 语义理解 | 计算开销大 | 自然语言问题 |
| ③ PageIndex Tree | 利用文档结构，像人翻书 | 需 LLM 调用 | "第X章讲了什么" 类问题 |
| ④ Metadata Filter | 精确定位 | 需要用户提供结构化条件 | "PRML 第3章的表格" |

数据源：
- ①② → `chunks` 表 + `chunk_fts` / ChromaDB
- ③ → `toc_entries` 表 → 匹配到的章节下的 `chunks`
- ④ → `chunks` 表 + `chapters` / `pages` 表联查

### 7.5 MinerU 坐标系分析与 bbox 定位修复

> **背景**: FR-3.4 要求 citation 点击后 PDF 跳页并 bbox 高亮。调试发现 bbox 覆盖区域与 PDF 内容严重错位。
> **根因**: `content_list.json` 的 bbox 使用归一化 1000×1000 画布坐标，`rebuild_db.py` 未做转换直接入库，而 `pages` 表的 width/height 是 PDF 点坐标，两套坐标混用导致错位。
> **状态**: ✅ 已修复 — `rebuild_db.py` 入库时将 bbox 从 1000×1000 画布转换为 PDF 点坐标。

#### 7.5.1 MinerU 输出的三套坐标系

MinerU 对每本书生成三个核心 JSON 文件，各自使用**不同的坐标空间**：

| 文件 | 坐标系 | 示例尺寸（CLRS 第 1 页） | 说明 |
|------|--------|--------------------------|------|
| `_middle.json` → `page_size` | PDF 点（72 DPI） | 660 × 743 | 标准 PDF 坐标，`para_blocks[].bbox` 也在此空间 |
| `_model.json` → `page_info` | 模型渲染像素 | 1834 × 2064 | ~2.78× 均匀缩放，`layout_dets` 检测框在此空间 |
| `_content_list.json` → `bbox` | **归一化 1000×1000 画布** | X/Y 可达 ~998 | 与 PDF 尺寸无关的归一化坐标 |

#### 7.5.2 content_list 坐标转换公式

`content_list.json` 的 bbox 坐标可通过以下公式精确转换为 PDF 点：

```
pdf_x = bbox_x / 1000 × page_width
pdf_y = bbox_y / 1000 × page_height
```

经三本书（CLRS、FastAPI、DDIA）多页验证，转换后与 `middle.json` 的 `para_blocks[].bbox` 误差 < 1 像素（纯四舍五入差异）。

验证示例（lubanovic_fastapi_modern_web, page 0, page_size=504×661）：

| 数据源 | x0 | y0 | x1 | y1 |
|--------|-----|-----|-----|-----|
| content_list bbox（原始） | 67 | 124 | 579 | 220 |
| content_list → 转换后 | 33.8 | 82.0 | 291.8 | 145.4 |
| middle para_blocks bbox | 34.0 | 82.0 | 292.0 | 146.0 |
| 误差 | 0.23 | 0.04 | 0.18 | 0.58 |

#### 7.5.3 修复内容

**`rebuild_db.py`** 在 bbox 入库前增加坐标转换：

```python
# content_list.json bbox uses a normalised 1000x1000 canvas.
# Convert to PDF-point coordinates so they match pages.width/height.
pw, ph = page_sizes.get(page_idx, (0.0, 0.0))
if pw and ph:
    bbox = [bbox[0]/1000*pw, bbox[1]/1000*ph,
            bbox[2]/1000*pw, bbox[3]/1000*ph]
```

转换后 `source_locators` 与 `pages` 表坐标统一为 PDF 点空间，前端计算 `bbox / page_size` 得到正确的百分比位置。

#### 7.5.4 前端高亮策略

修复后支持两种并行高亮方式：
- **bbox overlay**（主方案）：用转换后的 PDF 点坐标渲染蓝色透明边框，适用于所有内容类型
- **文本层匹配**（后备方案）：在 react-pdf 文本层中搜索 snippet 文本并高亮，作为 bbox 数据缺失时的 fallback

#### 7.5.5 结论

- 不是 MinerU 的 bug — 三套坐标系各有明确用途
- 问题出在 `rebuild_db.py` 未做坐标转换，混用了两个坐标空间
- 转换公式简单（÷1000×page_size），精度误差 < 1px
- 现有 MinerU 输出数据完全足够，无需额外数据
