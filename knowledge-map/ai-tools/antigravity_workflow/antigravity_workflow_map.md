---
topic: antigravity_workflow
dimension: map
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📖 Docs: [Antigravity Official](https://antigravity.google/docs) — Workflows"
  - "📖 Docs: [Antigravity Codelabs](https://atamel.dev) — Rules & Workflows"
  - "📖 Docs: [Antigravity Help](https://antigravityide.help) — Features"
  - "💻 Source: 工作区 .agent/workflows/ 实例 (9 workflows)"
expiry: 3m
status: current
---

# Antigravity Workflow 知识地图

## 1. 核心问题

本主题回答：

- **Antigravity Workflow 是什么？** → 存放在 `.agent/workflows/` 下的 Markdown 文件，定义多步骤任务编排，由用户用 `/slash-command` 触发
- **它和 Claude Code Skill 有什么区别？** → Workflow 是 Antigravity 专属概念（`.agent/workflows/`），Skill 是 Claude Code 概念（`.claude/skills/`）
- **它和 CLAUDE.md / Command 有什么区别？** → Workflow 是完整的多阶段流程编排（含 Phase、检查点、子命令），远比 Command 或 CLAUDE.md 复杂
- **它如何和 Skills 协作？** → Workflow 是"编排者"，在各 Phase 中调用具体的 Skill 来执行任务
- **它有哪些高级特性？** → `// turbo` 自动执行、`// turbo-all` 全局自动执行、`--from=` 断点恢复、子命令系统

---

## 2. 全景位置

```
Antigravity 扩展体系
├── agents/（代理定义）
│   ├── pm.agent.yaml      ── 产品经理代理
│   ├── dev.agent.yaml      ── 开发者代理
│   ├── analyst.agent.yaml  ── 分析师代理
│   ├── architect.agent.yaml── 架构师代理
│   └── ...                 ── 其他角色代理
│
├── workflows/（工作流）◄─── 【你在这里】
│   ├── 学习类 ──────── complete-lab, complete-assignment, midterm-review
│   ├── 生成类 ──────── generate-knowledge-map, generate-study-material
│   ├── 工具类 ──────── scrape-content, explore-repo
│   └── 开发类 ──────── bmad-quick-flow, full-development, ...
│
├── skills/（技能库）
│   ├── ai_learning-*   ── 课程学习助手（ML/NLP/CV/...）
│   ├── learning-*      ── 学习工具（note_taking, code_generation, ...）
│   ├── dev-*           ── 开发工具（git, code_comment, pdf_processing, ...）
│   └── 其他领域 Skills ── career-*, finance-*, housing-*, ...
│
├── templates/（模板）
│   ├── plan-template.md
│   ├── spec-template.md
│   └── tasks-template.md
│
└── docs/（文档）
    └── PRD 和设计文档
```

---

## 3. 依赖地图

```
前置知识                              本主题                          后续方向
─────────────                        ────────                        ─────────
Markdown + YAML ────┐
  (frontmatter)     │
                    │
Antigravity Agent ──┤
  (系统提示理解)     ├──→ Antigravity Workflow ──┬──→ 自定义 Workflow 编写
                    │      │                     │
Skills 体系 ────────┤      ├── 文件结构           ├──→ Workflow + Skills 集成
  (SKILL.md)        │      ├── Phase 设计         │
                    │      ├── // turbo 注解       ├──→ Agent + Workflow 组合
Shell / Bash ───────┤      ├── 子命令系统         │      (多角色协作)
  (命令执行)         │      ├── 检查点验证         │
                    │      └── Skills 调用         ├──→ 知识库构建系统
Git ────────────────┘                              │      (knowledge-map)
  (版本控制)                                       │
                                                   └──→ CI/CD 自动化
                                                          (turbo-all 模式)
```

---

## 4. 文件地图

| 文件 | 定位 | 何时用 |
|------|------|--------|
| [antigravity_workflow_map.md](antigravity_workflow_map.md) | 🗺️ 导航入口 | 进入本主题时 |
| [antigravity_workflow_concepts.md](antigravity_workflow_concepts.md) | 📖 术语定义 + 辨析 | Workflow vs Skill vs Command 不清时 |
| ~~antigravity_workflow_math.md~~ | ⬜ 不适用 | 本主题无数学内容 |
| [antigravity_workflow_tutorial.md](antigravity_workflow_tutorial.md) | 📚 原理深度讲解 | 理解 Workflow 设计思想和底层机制 |
| [antigravity_workflow_usage.md](antigravity_workflow_usage.md) | 🛠️ 实战用法 | 想立即创建或使用 Workflow |
| [antigravity_workflow_code.md](antigravity_workflow_code.md) | 💻 代码参考 | 编写自己的 Workflow 时参考模板 |
| [antigravity_workflow_pitfalls.md](antigravity_workflow_pitfalls.md) | ⚠️ 踩坑记录 | 调试 Workflow 问题 |
| [antigravity_workflow_history.md](antigravity_workflow_history.md) | 📜 历史演进 | 了解 Workflow 的起源和设计思路 |
| [antigravity_workflow_bridge.md](antigravity_workflow_bridge.md) | 🔗 跨主题衔接 | 了解 Workflow 与 Skills/Agents/Templates 的关系 |

---

## 5. 学习/使用路线

### 第一次学习 🎒

1. **[Concepts](antigravity_workflow_concepts.md)** → 搞清 Workflow 是什么、和 Skill 有什么区别
2. **[Tutorial](antigravity_workflow_tutorial.md)** → 理解 Workflow 的设计思想和文件结构
3. **[Usage — 场景 1-2](antigravity_workflow_usage.md)** → 使用现有 Workflow + 创建你的第一个

### 日常使用参考 🔧

1. **[Usage](antigravity_workflow_usage.md)** → 各场景完整操作流程
2. **[Code](antigravity_workflow_code.md)** → Workflow 编写模板和最佳实践
3. **[Pitfalls](antigravity_workflow_pitfalls.md)** → 常见问题排查

### 深度研究 🔬

1. **[History](antigravity_workflow_history.md)** → 理解设计演进
2. **[Bridge](antigravity_workflow_bridge.md)** → Workflow 在整个 Antigravity 生态中的位置
3. **[Tutorial — Section 2](antigravity_workflow_tutorial.md)** → Workflow 与 Skills 的协作模式

---

## 6. 缺口检查

| 维度 | 状态 |
|------|------|
| 导航地图 | ✅ |
| 概念定义 | ✅（12 个术语 + 3 组辨析） |
| 数学公式 | ⬜ 不适用 |
| 原理教程 | ✅（Why-First + 文件结构 + Phase 设计 + 协作模式） |
| 实战用法 | ✅（6 个场景 + 模板 + 现有 Workflow 清单） |
| 代码参考 | ✅（5 个模板 + 最佳实践 + 完整示例） |
| 踩坑记录 | ✅（8 个常见坑 + 排查清单） |
| 历史演进 | ✅（从 Agent → Workflow + Skills 生态） |
| 跨主题衔接 | ✅（与 Skills/Agents/Templates/Claude Code 的关系） |

---

## 7. 新鲜度状态

| 维度 | 上次验证 | 过期时间 | 状态 |
|------|---------|---------|------|
| Map | 2026-03-11 | 2026-06-11 | ✅ current |
| Concepts | 2026-03-11 | 2026-06-11 | ✅ current |
| Math | — | — | ⬜ 不适用 |
| Tutorial | 2026-03-11 | 2026-06-11 | ✅ current |
| Usage | 2026-03-11 | 2026-06-11 | ✅ current |
| Code | 2026-03-11 | 2026-06-11 | ✅ current |
| Pitfalls | 2026-03-11 | 2026-06-11 | ✅ current |
| History | 2026-03-11 | 2026-09-11 | ✅ current |
| Bridge | 2026-03-11 | 2026-06-11 | ✅ current |

> ⚠️ **本主题属于快速迭代的工具**，默认 expiry 为 3 个月（History 为 6 个月）。
> 当 Antigravity 升级或新增 Workflow 特性时需复查。
