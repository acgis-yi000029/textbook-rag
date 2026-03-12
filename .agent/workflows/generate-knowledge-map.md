---
description: 为任意主题生成 8 维知识库文档（Map / Concepts / Math / Tutorial / Code / Pitfalls / History / Bridge）
---

# 🧠 知识地图生成工作流 (Generate Knowledge Map)

为任意主题生成完整的 8 维知识库文档体系。适用于：研究主题、开发系统/模块、学习学科。

> ⚠️ **格式强制规则**: 每个维度文件必须 follow `knowledge-map-format` skill 的模板。

## 🎯 使用方式

```
/generate-knowledge-map <领域> <主题>

示例：
/generate-knowledge-map retrieval bm25
/generate-knowledge-map nlp tokenization
/generate-knowledge-map retrieval bm25 --only=map,pitfalls
/generate-knowledge-map retrieval bm25 --from=phase3
```

## 📋 8 维结构与生成顺序

```
Phase 0   输入探测 + 主题拆分
Phase 1   Map 骨架（核心问题 + 依赖关系）
Phase 2   理解层: ② Concepts → ③ Math → ④ Tutorial
Phase 3   实战层: ⑤ Code → ⑥ Pitfalls
Phase 4   脉络层: ⑦ History → ⑧ Bridge
Phase 5   收尾: 回填 Map + 缺口检查 + 新鲜度
```

### 与 generate-study-material 的区别

| | study-material | knowledge-map |
|---|---|---|
| 目的 | 学课程、备考 | 建个人知识库、指导开发 |
| 输入 | 必须有老师 Slides | 任意: 主题名、文档、代码 |
| 输出 | 15+ 文件 | 8 个文件 |
| 维护 | 学期结束归档 | 长期维护 |

---

## ⚖️ 执行协议

1. **Skill 优先**: 每个维度开始前**必须** follow `knowledge-map-format` skill
2. **来源引证**: follow `learning-source-citation` skill — 每个声明必须标注来源
3. **串行执行**: 按 Phase 顺序
4. **中断恢复**: `--from=<phase>` 继续

---

## Phase 0: 输入探测 🔍

1. **扫描可用素材**:
   - `textbooks/` 教科书 PDF + `data/mineru_output/` MinerU 解析
   - `.github/` 开源项目参考代码
   - `.documents/` 本地官方文档
   - `knowledge-map/` 已有相关主题
   - `search_web` 搜索在线文档（优先下载到 `.documents/`）

2. **主题粒度判断** — 满足任一则拆分:
   - 核心概念 > 15 个
   - 跨越多层次（理论+工具+实践）
   - Tutorial 预估 > 3000 字

3. **来源充分性检查**:

   | 维度 | 最低来源要求 |
   |------|-------------|
   | Concepts | 1 个权威来源 |
   | Math | 必须有教科书/论文 |
   | Tutorial | 1 官方文档 + 1 教科书 |
   | Code | 1 个参考实现 |
   | Pitfalls | 1 个来源 (Issues/SO/经验) |

   来源不足时暂停，给出下载建议，等用户选择:
   - [A] 去下载后继续
   - [B] 先生成，缺口标 `⚠️ 来源不足`
   - [C] 用 `search_web` 在线补齐

4. **向用户确认**: 展示素材报告和生成计划

---

## Phase 1: Map 骨架 🗺️

**Skill**: `knowledge-map-format` (DIM-1)

1. Follow `knowledge-map-format` skill 的 Map 模板
2. 写: 核心问题 + 全景位置 + 依赖地图
3. 文件地图和缺口检查留到 Phase 5 回填

**输出**: `{output_dir}/{topic}/{topic}_map.md`

---

## Phase 2: 理解层 📖

### 2.1 Concepts

**Skill**: `knowledge-map-format` (DIM-2)

1. Follow skill 的 Concepts 模板
2. 每个术语: 一句话白话定义 + 英文标注
3. 至少一组辨析对比表

**输出**: `{topic}_concepts.md`

### 2.2 Math

**Skill**: `knowledge-map-format` (DIM-3)

1. Follow skill 的 Math 模板
2. 每个公式: 符号表 → 公式 → 直觉解释 → 推导
3. 跳过条件: 主题无数学内容

**输出**: `{topic}_math.md`

### 2.3 Tutorial

**Skill**: `knowledge-map-format` (DIM-4)

1. Follow skill 的 Tutorial 模板
2. **Why-First**: Section 1 先讲动机，Section 2 再讲底层原理
3. 衔接性规则: follow `learning-source-citation` skill
4. 三层止挖: 会用 → 知道为什么 → 看过底层原理（到此为止）

**输出**: `{topic}_tutorial.md`

---

## Phase 3: 实战层 🔧

### 3.1 Code

**Skills**: `knowledge-map-format` (DIM-5), `learning-code-generation`, `dev-code-comment`

1. Follow skill 的 Code 模板
2. 快速开始 → 完整实现 → API 速查
3. 代码必须可直接运行，双语注释

**输出**: `{topic}_code.md`

### 3.2 Pitfalls ⚠️

**Skill**: `knowledge-map-format` (DIM-6)

1. Follow skill 的 Pitfalls 模板
2. 每个坑: 场景 → 症状 → 根因 → ❌/✅ 代码对比 → 教训
3. 末尾加调试清单
4. **活文档**: 每次踩坑后追加

**输出**: `{topic}_pitfalls.md`

---

## Phase 4: 脉络层 🔗

### 4.1 History

**Skill**: `knowledge-map-format` (DIM-7)

1. Follow skill 的 History 模板
2. Station 叙事: 前身 → 创新 → 局限 → 引出下一站
3. 跳过条件: 主题太新/无历史脉络

**输出**: `{topic}_history.md`

### 4.2 Bridge

**Skill**: `knowledge-map-format` (DIM-8)

1. Follow skill 的 Bridge 模板
2. 前后导航 + 上下游依赖 + 概念演变追踪
3. 扩展阅读分三层: 纵深 → 同层 → 全景
4. 双向更新: 如相关主题已存在，更新其 Bridge

**输出**: `{topic}_bridge.md`

---

## Phase 5: 收尾 ✅

1. **回填 Map**: 文件地图 + 缺口检查 + 新鲜度状态
2. **更新 Bridge**: 双向更新相关主题
3. **更新 README**: `knowledge-map/{领域}/README.md`
4. **质量检查**:
   - [ ] 每个声明有来源？
   - [ ] Tutorial Why-First？
   - [ ] Code 30 秒可跑？
   - [ ] Pitfalls 有 ❌/✅ 对比？
   - [ ] 交叉引用链接有效？

---

## 元数据标准

每个文件顶部必须有:

```yaml
---
topic: bm25
dimension: tutorial
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "SQLite FTS5 docs (2025-12)"
  - "rank_bm25 v0.2.2"
expiry: 6m
status: current
---
```

| 主题类型 | expiry |
|---------|--------|
| 快速迭代工具 | 3m |
| 稳定基础设施 | 6m |
| 数学/理论 | 12m |
| 教科书 | never |

---

## 跳过规则

| 维度 | 跳过条件 | Map 标注 |
|------|---------|---------|
| Math | 无数学内容 | ⬜ 不适用 |
| History | 太新/无脉络 | ⬜ 不适用 |
| Bridge | 完全孤立 | ⬜ 简化 |

**永远不能跳过**: Map, Concepts, Tutorial, Code, Pitfalls

---

## 输出结构

```
{output_dir}/{topic}/
├── {topic}_map.md          ← ① 导航
├── {topic}_concepts.md     ← ② 概念
├── {topic}_math.md         ← ③ 公式
├── {topic}_tutorial.md     ← ④ 教程
├── {topic}_code.md         ← ⑤ 代码
├── {topic}_pitfalls.md     ← ⑥ 踩坑
├── {topic}_history.md      ← ⑦ 历史
└── {topic}_bridge.md       ← ⑧ 衔接
```
