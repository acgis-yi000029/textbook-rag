---
topic: antigravity_workflow
dimension: history
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📖 Docs: [Antigravity Official](https://antigravity.google/docs) — Workflows"
  - "📖 Docs: [Antigravity Codelabs](https://atamel.dev) — Rules & Workflows"
  - "💻 Source: 工作区 .agent/ 目录结构分析"
expiry: 6m
status: current
---

# Antigravity Workflow 历史演进

## 时间轴概览

```
2024 H2           2025 H1             2025 H2              2026 Q1
  │                  │                   │                    │
  │  Antigravity     BMAD 框架           Workflow + Skills    知识地图
  │  初期形态         引入多角色          生态成熟              生态扩展
  │  (CLI Agent)     (Agent YAML)        (Phase + Turbo)      (自我迭代)
  ▼                  ▼                   ▼                    ▼
```

---

## Station 1: Antigravity 初期形态

**问题：** AI 编码助手只能对话，无法记忆和自动化

**解决方案：** Antigravity 作为 Agentic Coding IDE，提供文件读写、命令执行、浏览器控制、持久化上下文。

**局限：** 每次对话都需要重新描述工作流。

---

## Station 2: BMAD 框架引入（多角色协作）

**问题：** 复杂项目需要专业分工

**创新：** `.agent/agents/` 目录出现——PM、Dev、Architect 等角色代理定义。同时 `.agent/templates/` 提供标准化文档模板。

**局限：** 有了"谁"和"什么格式"，但缺少"整个流程怎么走"。

> 💻 Source: `.agent/agents/*.agent.yaml` + `.agent/templates/*.md`

---

## Station 3: Workflow + Skills 生态成熟

**问题：** 多步骤流程需要标准化编排

**创新：** `.agent/workflows/` + `.agent/skills/` 双目录生态成型。

核心创新点：Phase 结构、检查点、`// turbo` 自动化、子命令断点恢复、Skill 调用编排。

当前 9 个 Workflow（学习类 4 + 生成类 2 + 工具类 2 + 开发类 1）+ 139 个 Skills。

> 💻 Source: `.agent/workflows/` (9 files) + `.agent/skills/` (139 skills)

---

## Station 4: 知识地图生态（自我迭代）

**问题：** 需要系统化记录和维护知识

**创新：** `generate-knowledge-map` Workflow 标志系统的"自我迭代"能力。8 维知识结构 + 来源引证 + 新鲜度追踪。

> 💻 Source: `.agent/workflows/generate-knowledge-map.md` (36 KB)

---

## 演进脉络总结

```
"每次对话白纸一张"
        │
        ▼  Antigravity Agent (持久上下文)
"能力有了，但没有专业分工"
        │
        ▼  BMAD Agent 角色 (pm/dev/architect)
"有了角色，但流程不标准"
        │
        ▼  Workflow + Skills (编排+能力分离)
"需要系统化记录知识"
        │
        ▼  generate-knowledge-map (自我迭代)
"希望更智能的自动化和编排"
        │
        ▼  下一步: Workflow 组合? 状态持久化? ...
```
