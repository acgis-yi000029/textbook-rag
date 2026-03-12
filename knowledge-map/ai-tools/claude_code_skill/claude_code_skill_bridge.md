---
topic: claude_code_skill
dimension: bridge
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "Anthropic Claude Code Skills Docs (2026-03 revision)"
  - "Anthropic Claude Code Subagents Docs (2026-03 revision)"
  - "Anthropic Claude Code Hooks Docs (2026-03 revision)"
  - "Anthropic Claude Code Memory Docs (2026-03 revision)"
  - "Anthropic Claude Code Plugins Docs (2026-03 revision)"
expiry: 3m
status: current
---

# Claude Code Skill 2.0 衔接与扩展

## ← 上一个概念 / 下一个概念 →

| 方向 | 主题 | 关系 | 链接 |
|------|------|------|------|
| ← 前置 | **CLAUDE.md（Memory）** | Skill 是 CLAUDE.md 的"任务级版本"：CLAUDE.md 提供全局规范，Skill 提供特定工作流指令。两者互补，不冲突 | [Memory 文档](https://docs.anthropic.com/en/docs/claude-code/memory) |
| ← 前置 | **Slash Commands（旧版）** | Skill 2.0 是 Commands 的直接演进——增加了 auto-trigger、工具限制、上下文隔离等能力 | [Tutorial Section 1 → History](claude_code_skill_history.md) — Station 2 |
| → 后续 | **Subagents（自定义代理）** | Skill 可以**在子代理中运行**（`context: fork`），Subagent 也可以**预加载特定 Skill** | [Subagents 文档](https://docs.anthropic.com/en/docs/claude-code/sub-agents) |
| → 后续 | **Hooks（生命周期钩子）** | Skill 可以在 frontmatter 中定义 Hooks，在工具使用前后执行自定义脚本 | [Hooks 文档](https://docs.anthropic.com/en/docs/claude-code/hooks) |
| → 后续 | **Plugins（插件系统）** | Skill 打包为 Plugin 可以分发给团队和社区 | Skills → Plugins 的路径 |

---

## 上游依赖

| 来自主题 | 复用的概念 | 在 Skill 中如何使用 |
|----------|-----------|-------------------|
| **Markdown + YAML** | YAML Frontmatter 语法 | SKILL.md 的 `---` 块定义名称、描述、配置 |
| **CLAUDE.md** | 持久化指令机制 | Skill 扩展了"持久指令"的概念，从全局规范→任务级工作流 |
| **Shell / Bash** | 命令执行 | `!` 动态上下文注入依赖 Shell 命令；`allowed-tools: Bash(pattern)` 限制可执行命令 |
| **Git** | 版本控制 | `.claude/skills/` 通过 Git 版本控制分享；`/batch` 使用 git worktree 并行 |
| **MCP（Model Context Protocol）** | 外部工具集成 | Subagent 可以加载 MCP servers，扩展工具能力超出内置工具范围 |

---

## 下游影响

| 去向主题 | Skill 提供的概念 | 在下游如何被使用 |
|----------|-----------------|-----------------|
| **Subagent 设计** | SKILL.md 格式和 frontmatter 规范 | Subagent 的 `.claude/agents/*.md` 复用了类似的 YAML frontmatter 结构 |
| **Plugin 开发** | Skills + Hooks + Agents 打包 | Plugin 是 Skills 的分发单元，将 skills/、hooks/、agents/ 打包为可安装组件 |
| **CI/CD 集成** | Skill 作为自动化步骤 | 通过 `claude --agents` CLI 在 CI/CD pipeline 中执行 Skill |
| **团队规范** | 标准化工作流 | 将最佳实践编码为 Skill，新成员入职即获得标准流程 |

---

## 概念演变追踪

| 概念 | 在 Commands（旧版）中 | 在 Skill 2.0 中 | 变化 |
|------|---------------------|-----------------|------|
| **触发方式** | 仅 `/命令名` 手动触发 | 手动 + Claude 自动匹配 description | 从被动→主动 |
| **工作流定义** | 纯 Markdown 文本 | Frontmatter 结构化 + Markdown 指令 | 从非结构化→结构化 |
| **作用域** | 全局（主对话） | 可选 `context: fork`（隔离） | 从无边界→可控隔离 |
| **权限控制** | 无 | `allowed-tools` + `disable-model-invocation` | 从无限制→细粒度 |
| **信息密度管理** | 一次加载全部 | 三层按需加载 | 从浪费→高效 |
| **上下文信息** | 静态文本 | `!` 动态注入运行时数据 | 从静态→动态 |
| **目录结构** | 单文件 | 文件夹（scripts/ + references/） | 从扁平→立体 |

---

## 📚 扩展阅读

### 深入理解（本主题的更深层次）

| 资源 | 类型 | 为什么值得读 | 难度 |
|------|------|-------------|------|
| [Skills 官方文档](https://docs.anthropic.com/en/docs/claude-code/skills) | 📖 文档 | 最权威的 Skill 配置参考 | ⭐ |
| [Subagents 官方文档](https://docs.anthropic.com/en/docs/claude-code/sub-agents) | 📖 文档 | 理解 `context: fork` 的完整机制和 Agent 类型 | ⭐⭐ |
| [Hooks 官方文档](https://docs.anthropic.com/en/docs/claude-code/hooks) | 📖 文档 | 理解全部 15+ Hook 事件和 JSON I/O 格式 | ⭐⭐⭐ |
| [Memory 官方文档](https://docs.anthropic.com/en/docs/claude-code/memory) | 📖 文档 | 理解 CLAUDE.md 与 Skill 的互补关系 | ⭐ |

### 横向对比（同类方案）

| 资源 | 对比点 | 何时读 |
|------|--------|--------|
| **GitHub Copilot Extensions** | 同属 AI 编码助手扩展体系，但架构不同 | 技术选型对比时 |
| **Cursor Rules (.cursorrules)** | Cursor IDE 的指令文件，等价于 CLAUDE.md | 从 Cursor 迁移时 |
| **Windsurf Rules** | Windsurf 的规则文件 | 多工具对比时 |
| [Agent Skills 社区](https://agentskills.io) | 社区贡献的 Skill 集合 | 寻找现成 Skill 时 |

### 上层应用（本主题在更大系统中的位置）

| 资源 | 说明 | 何时读 |
|------|------|--------|
| [Plugins 文档](https://docs.anthropic.com/docs/en/plugins) | Skill 的分发和组织方式 | 需要分享 Skill 给团队时 |
| [Agent Teams](https://docs.anthropic.com/docs/en/agent-teams) | 多代理协作框架 | 构建复杂多代理系统时 |
| [Managed Settings](https://docs.anthropic.com/docs/en/settings#settings-files) | 组织级别的 Skill 和设置管理 | 在企业团队中推广 Skill 时 |
| [CLI Reference](https://docs.anthropic.com/docs/en/cli-reference) | `claude --agents` 等 CLI flag | 在 CI/CD 中集成 Skill 时 |

---

## 跨工具概念映射

### 映射表：其他工具中的等价概念

| Claude Code 概念 | GitHub Copilot 等价 | Cursor 等价 | 通用说明 |
|------------------|--------------------|-----------| ---------|
| `SKILL.md` | Copilot Extension manifest | `.cursorrules` (部分) | AI IDE 的指令定义文件 |
| `CLAUDE.md` | `.github/copilot-instructions.md` | `.cursorrules` | 项目级 AI 指令 |
| `context: fork` | — | — | Claude Code 独有的上下文隔离 |
| `!` 动态注入 | — | — | Claude Code 独有的运行时数据注入 |
| Subagent | GitHub Copilot Agent | — | 独立的 AI 工作单元 |
| Hooks | Pre/Post-commit hooks (Git) | — | 生命周期事件回调 |
| Plugin | GitHub Copilot Extension | Cursor Plugin | 可分发的扩展包 |

---

## 与工作区已有知识库的关联

工作区 `.agent/skills/` 中有 139 个 Skill 实例，可作为进一步学习的活参考：

| 类别 | 数量 | 代表 | 学习点 |
|------|------|------|--------|
| AI 学习助手 | ~12 | `ai_learning-rl`, `ai_learning-nlp` | 领域知识型 Skill 的写法 |
| 开发工具 | ~15 | `dev-code_reviewer`, `dev-git` | 工具集成型 Skill 的最佳实践 |
| 学习流程 | ~25 | `learning-note_taking`, `learning-code_generation` | 多步骤工作流 Skill 的编排 |
| 生活顾问 | ~50 | `housing-rental`, `finance-banking` | 信息查询型 Skill 的模板 |
| 职业发展 | ~10 | `career-resume`, `career-interview` | 垂直领域 Skill 的结构 |
