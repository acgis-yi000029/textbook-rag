---
topic: antigravity_workflow
dimension: concepts
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📖 Docs: [Antigravity Official](https://antigravity.google/docs) — Workflows"
  - "📖 Docs: [Antigravity Codelabs](https://atamel.dev) — Rules & Workflows"
  - "💻 Source: 工作区 .agent/workflows/ 实例 (9 workflows)"
expiry: 3m
status: current
---

# Antigravity Workflow 核心概念

> 📖 Docs: [Antigravity Official](https://antigravity.google/docs) — Workflows

## 术语定义

| 术语 | 定义（白话） | 英文 | 易混淆项 |
|------|-------------|------|----------|
| **Workflow** | 存放在 `.agent/workflows/` 下的 Markdown 文件，定义完整的多步骤任务编排流程 | Workflow | Skill / Command |
| **Slash Command** | 以 `/` 开头的用户触发命令，在 Antigravity 中对应 workflow 文件名 | Slash Command | — |
| **Phase** | Workflow 中的一个执行阶段，按 Phase 0, 1, 2… 编号，有先后依赖 | Phase | Step |
| **// turbo** | 单步自动执行注解——贴在某个步骤上方，让 Agent 对该步骤跳过用户确认自动执行 | turbo annotation | // turbo-all |
| **// turbo-all** | 全局自动执行注解——贴在文件任意位置，所有 `run_command` 步骤都自动执行 | turbo-all annotation | // turbo |
| **Frontmatter** | Workflow 文件顶部用 `---` 包裹的 YAML 块，目前只有 `description` 字段 | YAML Frontmatter | Skill Frontmatter（字段更丰富） |
| **检查点** | Phase 结束时的 `- [ ]` 验证清单，所有项必须通过才能进入下一 Phase | Checkpoint | — |
| **子命令** | `--from=`、`--phase=`、`--only=` 等参数，允许从指定阶段继续或只执行部分 | Sub-command | — |
| **Skill 调用** | Workflow 中 `读取 skill: .shared/skills/xxx/SKILL.md` 的指令，告知 Agent 使用特定 Skill | Skill Invocation | — |
| **Agent** | `.agent/agents/*.agent.yaml` 中定义的角色代理——PM、Dev、Architect 等 | Agent | Workflow / Skill |
| **Template** | `.agent/templates/` 中的模板文件，定义文档结构——计划、任务、规范等 | Template | Workflow |
| **.agent/** | Antigravity 的核心配置目录（等价于 Claude Code 的 `.claude/`），包含 agents、skills、workflows、templates、docs | .agent directory | .claude directory |

> 📖 Docs: [Antigravity Codelabs](https://atamel.dev) — "Workflows are saved prompts that you can trigger on demand"

---

## 概念辨析

### Workflow vs Skill

| 维度 | Workflow（`.agent/workflows/`） | Skill（`.agent/skills/`） |
|------|-------------------------------|--------------------------|
| **本质** | 多步骤流程编排（告诉 Agent **一整个流程怎么走**） | 单一能力定义（告诉 Agent **某件事怎么做**） |
| **触发方式** | 仅用户 `/slash-command` 触发 | Agent 自动检测 + 用户触发 |
| **复杂度** | 多 Phase、有检查点、有子命令 | 单文件指令集 |
| **和 Skill 的关系** | **编排者**——在 Phase 中调用多个 Skill | **被调用者**——被 Workflow 引用执行 |
| **Frontmatter** | 仅 `description` 字段 | 支持 `name`, `description`, `allowed-tools`, `context`, `hooks` 等 |
| **典型文件大小** | 10-50 KB（复杂流程文档） | 1-5 KB（精简指令） |
| **代表例子** | `/complete-lab ml lab2` | `learning-code_generation` |

> 📖 Docs: [Antigravity Official](https://antigravity.google/docs) — Workflow 与 Skill 的关系
> 🧪 经验: Workflow 是"总指挥"，Skill 是"专业人员"。类似于 CI/CD Pipeline 对 Actions/Steps 的关系

### Workflow vs Claude Code Skill

| 维度 | Antigravity Workflow | Claude Code Skill |
|------|---------------------|-------------------|
| **归属** | Antigravity | Claude Code |
| **位置** | `.agent/workflows/*.md` | `.claude/skills/*/SKILL.md` |
| **Frontmatter** | 仅 `description` | 丰富字段（name, allowed-tools, context, hooks…） |
| **自动触发** | ❌ 仅用户手动 | ✅ Agent 可自动检测并触发 |
| **工具限制** | ❌ 无 | ✅ `allowed-tools` 白名单 |
| **上下文隔离** | ❌ 无 | ✅ `context: fork` |
| **// turbo** | ✅ 有 | ❌ 无此概念 |
| **Phase + 检查点** | ✅ 有 | ❌ 无此概念 |
| **设计哲学** | **流程编排**（像 CI/CD Pipeline） | **单一能力增强**（像 Plugin） |

> See also: [Claude Code Skill 概念](../claude_code_skill/claude_code_skill_concepts.md)

### Workflow vs Agent

| 维度 | Workflow | Agent（`.agent/agents/`） |
|------|----------|--------------------------|
| **本质** | 做什么（流程定义） | 谁来做（角色定义） |
| **格式** | `.md`（Markdown） | `.agent.yaml`（YAML） |
| **配置** | Phase + 步骤 + 检查点 | 角色定位 + 能力范围 + 权限 |
| **关系** | Agent 按 Workflow 执行 | Workflow 被 Agent 执行 |
| **代表例子** | `complete-lab.md` | `dev.agent.yaml` |

> 💻 Source: 工作区 `.agent/agents/*.agent.yaml` — PM/Dev/Architect 角色定义

---

## 核心属性

### Workflow 的文件结构

```
┌───────────────────────────────────┐
│ 第 1 层：YAML Frontmatter          │  ← 始终加载
│   description                     │     （Agent 据此匹配 slash command）
├───────────────────────────────────┤
│ 第 2 层：流程概览                   │  ← 匹配后加载全文
│   Phase 结构图 + 子命令表          │     （Agent 理解全流程）
├───────────────────────────────────┤
│ 第 3 层：各 Phase 详细内容          │  ← Agent 逐步执行
│   Skill 调用 + 命令 + 检查点       │     （调用对应 Skill）
└───────────────────────────────────┘
```

> 📖 Docs: [Antigravity Official](https://antigravity.google/docs) — Workflow 文件结构

### Workflow 分类

| 类别 | 代表 | 特点 |
|------|------|------|
| **学习类** | `complete-lab`, `complete-assignment`, `midterm-review` | 多 Phase、调用学习 Skills、有提交检查 |
| **生成类** | `generate-knowledge-map`, `generate-study-material` | 多维输出、来源引证、新鲜度追踪 |
| **工具类** | `scrape-content`, `explore-repo` | 简短、单一功能、快速执行 |
| **开发类** | `bmad-quick-flow`, `full-development` | 多角色协作、Agent 编排、项目级流程 |

> 💻 Source: 工作区 `.agent/workflows/` — 9 个 Workflow 分类分析

---

## Frontmatter 字段速查

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `description` | string | ✅ | Workflow 的一句话描述，也是 Agent 列出可用 Workflow 时的展示文本 |

> 🧪 经验: 目前 Antigravity Workflow 的 frontmatter 只支持 `description`，远比 Claude Code Skill 简单

---

## // turbo 注解速查

| 注解 | 作用范围 | 适用场景 |
|------|---------|----------|
| `// turbo` | 仅紧跟的下一个 `run_command` 步骤 | 安全的构建/测试/转换命令 |
| `// turbo-all` | 文件中任意位置出现即全局生效 | 纯分析/构建类 Workflow |
| 无注解 | 默认行为——需用户确认 | 有副作用的操作（部署/删除/推送） |

> 📖 Docs: [Antigravity Official](https://antigravity.google/docs) — turbo 注解规范
> 🧪 经验: `// turbo` 只影响 `run_command`（Bash 命令），不影响文件编辑

---

## 子命令速查

| 子命令 | 作用 | 示例 |
|--------|------|------|
| `--from=<phase>` | 从指定阶段开始执行 | `/complete-lab ml lab2 --from=code` |
| `--phase=<N>` | 只执行指定阶段 | `/midterm-review mv --phase=5` |
| `--only=<dim1,dim2>` | 只生成指定维度 | `/generate-knowledge-map retrieval bm25 --only=map,pitfalls` |
| `--weeks=<range>` | 限定范围 | `/midterm-review mv --weeks=1-5` |
| `--check` | 只运行检查步骤 | `/complete-lab ml lab2 --check` |

> 🧪 经验: 子命令是 Workflow 中自定义的约定，不是系统内置功能。Agent 需要解析 Workflow 文本来理解
