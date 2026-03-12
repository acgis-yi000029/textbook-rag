---
topic: antigravity_workflow
dimension: bridge
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📖 Docs: [Antigravity 官方文档](https://antigravity.google/docs) — Workflows"
  - "📖 Docs: [Antigravity Codelab](https://atamel.dev) — 自定义 Rules & Workflows"
  - "工作区 .agent/ 完整结构分析"
expiry: 3m
status: current
---

# Antigravity Workflow 跨主题衔接

## 上游依赖（学这个需要先懂什么）

| 概念 | 关系 | 学习建议 |
|------|------|---------|
| **Markdown + YAML** | Workflow 是 Markdown 文件 + YAML frontmatter | 掌握基本语法即可 |
| **Antigravity Agent** | Agent 解释并执行 Workflow | 了解 Agent 如何读取和执行指令 |
| **Shell / Bash** | `// turbo` 步骤中的命令 | 能写和理解常见命令 |
| **Git** | 很多 Workflow 的最终 Phase 涉及 Git | 基本的 add/commit/push |

## 下游应用（学完这个可以做什么）

| 方向 | 和 Workflow 的关系 |
|------|-------------------|
| **自定义开发流程** | 用 Workflow 编排项目的构建→测试→部署流程 |
| **课程作业自动化** | 用现有的 `complete-lab` / `complete-assignment` |
| **知识库建设** | 用 `generate-knowledge-map` 系统化整理知识 |
| **多角色项目协作** | 结合 Agent YAML + Workflow 实现 PM→Dev→QA 流程 |

---

## 平级对比（类似/易混淆概念）

### Workflow vs Skill

```
Workflow ────编排────→ Skill ────执行────→ 任务完成
   │                    │
   │ .agent/workflows/  │ .agent/skills/
   │ "整个流程怎么走"    │ "某件事怎么做"
   │ 多 Phase + 检查点   │ 单文件指令
   │ 仅用户触发          │ Agent 可自动触发
```

> 📖 Docs: [Antigravity 官方文档](https://antigravity.google/docs) — "workflows are saved prompts that users can trigger on demand"

### Workflow vs Claude Code Skill

```
Antigravity Workflow          Claude Code Skill
  │                             │
  │ .agent/workflows/*.md       │ .claude/skills/*/SKILL.md
  │ frontmatter: description    │ frontmatter: name, allowed-tools, context, hooks...
  │ // turbo 注解               │ disable-model-invocation
  │ Phase + 检查点              │ 无 Phase 概念
  │ 流程编排                    │ 单一能力增强
  │ Antigravity 专属            │ Claude Code 专属
```

> See also: [Claude Code Skill 知识地图](../claude_code_skill/claude_code_skill_map.md)

### Workflow vs Agent

```
Agent = "谁"（角色定义）
Workflow = "做什么"（流程定义）

Agent YAML → 定义 PM / Dev / Architect 角色
Workflow MD → 定义 Phase 1 → Phase 2 → ... 流程

一个 Workflow 可以挑选不同 Agent 来执行不同 Phase
```

### Workflow vs CLAUDE.md / Rules

```
CLAUDE.md / Rules = "始终遵循"（全局规范）
Workflow = "按需触发"（特定流程）

CLAUDE.md → 所有对话都生效的编码规范
Workflow → 用户主动 /slash-command 触发的流程
```

---

## 相关主题导航

### 第一层（直接关联）

| 主题 | 关系 | 链接 |
|------|------|------|
| **Claude Code Skill** | 对比概念——另一套编排系统 | [claude_code_skill_map.md](../claude_code_skill/claude_code_skill_map.md) |
| **Antigravity Skills** | 被 Workflow 调用的执行者 | `.agent/skills/` 目录 |
| **Antigravity Agents** | 执行 Workflow 的角色代理 | `.agent/agents/` 目录 |

### 第二层（间接关联）

| 主题 | 关系 |
|------|------|
| **CI/CD Pipeline** | 设计哲学类似——阶段化流程编排 |
| **Makefile** | 类似的依赖管理和任务编排 |
| **GitHub Actions** | 更自动化但更复杂的流程编排方案 |

### 第三层（背景知识）

| 主题 | 关系 |
|------|------|
| **Agentic Coding** | Workflow 存在的大背景——Agent 驱动的开发范式 |
| **Prompt Engineering** | Workflow 本质上是结构化的 Prompt |
| **IaC (Infrastructure as Code)** | 类似理念——用文本定义行为 |

---

## 前后导航

```
← 上一个主题: Claude Code Skill 2.0
   (另一套扩展体系，对比学习)

→ 下一个主题: Antigravity Agents (角色代理)
   (Workflow 的执行者，更深入理解多角色协作)
```
