---
topic: claude_code_skill
dimension: concepts
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "Anthropic Claude Code Skills Docs (2026-03 revision)"
  - "Anthropic Claude Code Subagents Docs (2026-03 revision)"
  - "Anthropic Claude Code Hooks Docs (2026-03 revision)"
  - "Anthropic Claude Code Memory Docs (2026-03 revision)"
  - "SkillsBench (arxiv 2502, skillsbench.ai)"
expiry: 3m
status: current
---

# Claude Code Skill 2.0 核心概念

> 📖 Docs: [Extend Claude with skills](https://docs.anthropic.com/en/docs/claude-code/skills)

## 术语定义

| 术语 | 定义（白话） | 英文 | 易混淆项 |
|------|-------------|------|----------|
| **Skill** | 一组打包的指令，教 Claude 如何执行特定任务或工作流，免去每次重复描述的麻烦 | Skill | Command / Agent / Plugin |
| **SKILL.md** | Skill 的核心文件，包含 YAML 元数据（frontmatter）和 Markdown 指令体 | SKILL.md | CLAUDE.md |
| **Frontmatter** | SKILL.md 顶部的 YAML 块（`---` 包裹），定义名称、描述、触发规则等元数据 | YAML Frontmatter | Markdown body |
| **Bundled Skill** | Claude Code 自带的内置技能，如 `/simplify`、`/batch`、`/debug`、`/loop`、`/claude-api` | Bundled Skill | Custom Skill |
| **Custom Skill** | 用户自己创建的技能，放在 `.claude/skills/` 或 `~/.claude/skills/` 下 | Custom Skill | Bundled Skill |
| **Slash Command** | 以 `/` 开头的用户直接调用命令，用于触发 Skill | Slash Command | — |
| **Subagent** | 在独立上下文中运行的 AI 子代理，有自己的工具和权限限制 | Subagent | Skill / Main conversation |
| **Hook** | 生命周期事件回调，在特定时机（如工具使用前后）执行自定义脚本或命令 | Hook | Skill |
| **Context: fork** | Skill 在独立上下文（子代理）中运行，不污染主对话 | Context Fork | — |
| **Dynamic Context** | 用 `!` 前缀注入的动态内容，Skill 加载时立即执行命令并替换为输出 | Dynamic Context Injection | Static context |
| **Plugin** | 可分发的技能包，包含 skills、hooks、agents 等组件 | Plugin | Skill |
| **CLAUDE.md** | 项目级持久化指令文件，存放编码规范、项目约定等 | CLAUDE.md | SKILL.md |
| **Agent (Built-in)** | Claude Code 内置的三种子代理类型：Explore（快速搜索）、Plan（只读研究）、General-purpose（全功能） | Built-in Agent | Custom Agent |
| **Allowed Tools** | Frontmatter 字段，限制 Skill 可使用的工具集合 | allowed-tools | — |
| **$ARGUMENTS** | 字符串替换变量，接收用户在 Slash Command 后传入的参数 | String Substitution | — |
| **Skill Creator** | Claude 内置的“元技能”，通过交互式向导帮你创建新 Skill，自动生成 SKILL.md 文件和目录结构 | skill-creator | 手动创建 |
| **SkillsBench** | 首个评估 Agent Skill 有效性的基准测试，84 个任务 × 7 个模型，测量技能对代理性能的提升程度 | SkillsBench | SWE-bench（测代码能力，非 Skill 有效性） |

> 📖 Docs: [Extend Claude with skills — Frontmatter reference](https://docs.anthropic.com/en/docs/claude-code/skills#frontmatter-reference)

---

## 概念辨析

### Skill vs Command

| 维度 | Skill（SKILL.md） | Command（commands/*.md） |
|------|-------------------|------------------------|
| **位置** | `.claude/skills/<name>/SKILL.md` | `.claude/commands/<name>.md` |
| **触发方式** | Claude 自动检测 + 用户 `/name` | 仅用户 `/name` |
| **能力** | 支持 frontmatter、hooks、subagent、工具限制 | 简单指令模板 |
| **文件结构** | 可包含 scripts/、examples/、references/ | 单文件 |
| **推荐使用** | 复杂工作流 + 需要控制的场景 | 简单快速命令 |

> 📖 Docs: [Extend Claude with skills](https://docs.anthropic.com/en/docs/claude-code/skills) — "Skills are the evolution of commands"

### Skill vs Subagent

| 维度 | Skill | Subagent |
|------|-------|----------|
| **本质** | 一组指令（告诉 Claude **怎么做**） | 一个独立的 AI 实体（**谁来做**） |
| **上下文** | 默认在主对话中执行（除非 `context: fork`） | 始终在独立上下文中执行 |
| **配置位置** | `.claude/skills/<name>/SKILL.md` | `.claude/agents/<name>.md` |
| **模型选择** | 通过 `model` frontmatter 字段可选 | 通过 `model` frontmatter 字段可选 |
| **工具控制** | `allowed-tools` 白名单 | `tools` + `disallowedTools` |
| **典型用途** | 代码风格检查、部署流程、解释代码 | 代码审查、调试、大规模研究 |

> 📖 Docs: [Create custom subagents](https://docs.anthropic.com/en/docs/claude-code/sub-agents) — "Choose between subagents and main conversation"

### Skill vs CLAUDE.md

| 维度 | Skill（SKILL.md） | CLAUDE.md |
|------|-------------------|-----------|
| **加载时机** | Claude 判断相关时才加载（lazy loading） | **每次对话都加载**（always loaded） |
| **用途** | 特定任务的工作流指令 | 项目级全局规范和约定 |
| **上下文开销** | 仅在需要时消耗 token | 始终占用系统提示空间 |
| **可调用性** | 可被用户 `/name` 或 Claude 自动触发 | 不可调用，纯背景信息 |
| **推荐内容** | "如何部署"、"如何审查代码" | "用 2 空格缩进"、"测试前先 lint" |

> 📖 Docs: [How Claude remembers your project](https://docs.anthropic.com/en/docs/claude-code/memory) — "CLAUDE.md vs auto memory"

### Model Invocation Control（调用控制）

| 设置 | 含义 | 适用场景 |
|------|------|----------|
| **默认**（两者都不设） | 用户和 Claude 都能触发 | 通用知识技能 |
| `disable-model-invocation: true` | **仅用户可触发** | 部署、提交等有副作用的操作 |
| `user-invocable: false` | **仅 Claude 自动触发** | 背景知识（如遗留系统说明） |

> 📖 Docs: [Control who invokes a skill](https://docs.anthropic.com/en/docs/claude-code/skills#control-who-invokes-a-skill)

---

## 核心属性

### Skill 的三层信息架构

```
┌───────────────────────────────────┐
│ 第 1 层：YAML Frontmatter          │  ← 始终加载到系统提示
│   name + description              │     （Claude 据此判断是否读取全文）
├───────────────────────────────────┤
│ 第 2 层：SKILL.md Body             │  ← 仅当 Claude 判断相关时加载
│   详细指令、步骤、规则            │     （主要工作指令）
├───────────────────────────────────┤
│ 第 3 层：Supporting Files          │  ← 仅当 Claude 需要时读取
│   references/、examples/、scripts/│     （减少 token 消耗）
└───────────────────────────────────┘
```

> 📖 Docs: [Types of skill content](https://docs.anthropic.com/en/docs/claude-code/skills#types-of-skill-content)

### Skill 适用场景 ✅

- 团队有重复性工作流（部署、审查、迁移）需要标准化
- 需要限制 Claude 的工具访问权限（只读审查）
- 需要注入动态上下文（PR diff、git status）
- 希望代码风格/规范自动遵循而无需每次提醒
- 需要在独立上下文中执行避免污染主对话

### Skill 不适用场景 ❌

- 简单的一次性提问（直接对话即可）
- 需要全局生效的编码规范（用 CLAUDE.md）
- 需要跨多个步骤频繁交互的迭代工作（用主对话）
- 对延迟敏感的场景（Subagent 需要额外时间建立上下文）

---

## Frontmatter 字段速查

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | Skill 名称，也是 `/` 命令名 |
| `description` | string | ✅ | 触发条件描述，Claude 据此判断何时加载 |
| `disable-model-invocation` | bool | ❌ | `true` = 仅用户可触发 |
| `user-invocable` | bool | ❌ | `false` = 仅 Claude 可触发 |
| `allowed-tools` | list | ❌ | 工具白名单（如 `Read, Grep, Glob`） |
| `argument-hint` | string | ❌ | 参数提示（如 `[filename] [format]`） |
| `model` | string | ❌ | 使用的模型（`sonnet`, `opus`, `haiku`, `inherit`） |
| `context` | string | ❌ | `fork` = 在子代理中运行 |
| `agent` | string | ❌ | 子代理类型（`Explore`, `Plan`, 自定义） |
| `hooks` | object | ❌ | 生命周期钩子配置 |

> 📖 Docs: [Frontmatter reference](https://docs.anthropic.com/en/docs/claude-code/skills#frontmatter-reference)

---

## 字符串替换变量

| 变量 | 含义 | 示例 |
|------|------|------|
| `$ARGUMENTS` | 用户传入的全部参数 | `/fix-issue 123` → `$ARGUMENTS` = `123` |
| `$ARGUMENTS[N]` 或 `$N` | 第 N 个参数（0-indexed） | `/migrate-component SearchBar React Vue` → `$0` = `SearchBar` |
| `${CLAUDE_SESSION_ID}` | 当前会话 ID | 用于日志文件命名 |
| `${CLAUDE_SKILL_DIR}` | SKILL.md 所在目录的路径 | 用于引用同目录下的脚本 |

> 📖 Docs: [Available string substitutions](https://docs.anthropic.com/en/docs/claude-code/skills#available-string-substitutions)
