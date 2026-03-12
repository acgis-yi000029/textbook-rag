---
topic: claude_code_skill
dimension: history
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "Anthropic Claude Code Skills Docs (2026-03 revision)"
  - "Anthropic Claude Code release history (2024-2026)"
  - "Community discussions and blog posts (2025-2026)"
  - "SkillsBench paper (arxiv 2502.09790, Feb 2026)"
expiry: 6m
status: current
---

# Claude Code Skill 2.0 历史演进

## 时间轴概览

```
2023          2024               2025 H1              2025 H2           2026 Q1
  │             │                   │                    │                │
  │   Claude Code                   │                    │                │
  │   首次发布     .claude/commands/  Skills v1          Skills v2.0      SkillsBench
  │   (Terminal    (静态命令模板)      (SKILL.md +         (Subagents +     (基准评估
  │    Coding      (Slash Commands)    Frontmatter +       Hooks +          + Skill
  │    Agent)                          auto-trigger)       Dynamic ctx +    Creator)
  │                                                       Bundled skills +
  │                                                       Skill Creator)
  ▼                ▼                   ▼                    ▼              ▼
```

---

## Station 1: Claude Code 原始形态（2023-2024）

**问题：** 当时要解决什么问题？

开发者需要一个 AI 编码助手，不仅能聊天回答问题，还能**直接读写代码**、**执行终端命令**、**理解整个代码库**。市面上的 AI 助手（如 ChatGPT）只能在对话窗口里给建议，不能直接操作文件。

**创新：** Claude Code 的核心贡献

- **Agentic = 自主执行**：不光建议，还能自己动手改
- **全代码库感知**：能读取整个项目结构，理解文件间依赖
- **终端集成**：直接在命令行中运行，无需切换工具

**关键人物：** Anthropic AI 团队

**局限：** 每次对话都是"白纸一张"

- 没有记忆：每次开对话都要重新解释项目规范
- 没有标准化工作流：同样的部署流程每次都要手动描述
- 没有权限控制：Claude 有完整的工具访问权限，行为不受限制

> 🧪 经验: 早期使用 Claude Code 时，最大痛点是重复描述相同的编码规范和流程

---

## Station 2: CLAUDE.md + Slash Commands（2024）

**问题：** "白纸一张"导致效率低下

**创新：** 两个关键机制的出现

### 2a. CLAUDE.md — 持久化项目记忆

```
./CLAUDE.md                     ← 项目规范、编码约定
~/.claude/CLAUDE.md             ← 个人偏好
```

- 每次对话都自动加载，Claude 始终知道项目的规范
- 可以通过 `/init` 自动生成

> 📖 Docs: [How Claude remembers your project](https://docs.anthropic.com/en/docs/claude-code/memory)

### 2b. Slash Commands — 可复用命令模板

```
.claude/commands/deploy.md      ← 用户用 /deploy 触发
.claude/commands/review.md      ← 用户用 /review 触发
```

- 简单的 Markdown 文件，描述一个工作流
- 用 `/命令名` 触发
- 只有用户能触发，Claude 不会自动使用

**局限：** Commands 只是"更方便的复制粘贴"

- ❌ 没有 Frontmatter → 无法描述触发条件
- ❌ 没有 auto-trigger → Claude 不能主动判断何时使用
- ❌ 没有工具限制 → 无法控制 Claude 的行为边界
- ❌ 没有上下文隔离 → 命令执行污染主对话
- ❌ 没有动态注入 → 无法把 git diff 等运行时信息传入

> 📖 Docs: [Extend Claude with skills — Getting started](https://docs.anthropic.com/en/docs/claude-code/skills#getting-started) — Skills 是 Commands 的演进

---

## Station 3: Skills v1 — 初版（2025 H1）

**问题：** Commands 太简单，无法覆盖复杂的自动化场景

**创新：** Skill 系统的诞生

```
.claude/skills/<name>/SKILL.md    ← 新的标准化格式
```

核心突破：

1. **YAML Frontmatter** — 结构化元数据（name、description）
2. **Auto-trigger** — Claude 根据 description 自动判断何时使用
3. **三层加载** — Frontmatter（常驻）→ Body（按需）→ Files（深入时）
4. **目录结构** — 支持 scripts/、references/、examples/ 子目录
5. **`$ARGUMENTS`** — 参数传递机制

**局限：** 还缺少关键控制能力

- ❌ 没有 `disable-model-invocation` → 有副作用的 Skill 可能被误触
- ❌ 没有 `context: fork` → 无法隔离执行上下文
- ❌ 没有 `allowed-tools` → 无法限制工具访问
- ❌ 没有动态上下文注入 → 无法在加载时获取运行时数据
- ❌ 没有 Hooks → 无法拦截或增强生命周期事件
- ❌ 没有 Bundled Skills → 常见需求需自建

---

## Station 4: Skills 2.0 — 当前版本（2025 H2 - 2026）

**问题：** Skills v1 缺少安全控制和高级自动化能力

**创新：** 全面升级

### 新增核心能力

| 特性 | 解决的问题 |
|------|-----------|
| `disable-model-invocation` | 防止 Claude 自动触发有副作用的操作 |
| `user-invocable: false` | 纯背景知识技能不需要出现在命令列表 |
| `context: fork` | 上下文隔离，避免污染主对话 |
| `allowed-tools` | 精确控制工具白名单（含 Bash pattern） |
| `!` 动态上下文注入 | 加载时执行命令，注入运行时数据 |
| `agent` 字段 | 选择子代理类型（Explore/Plan/自定义） |
| Hooks 集成 | 生命周期事件拦截（PreToolUse、PostToolUse…） |
| `${CLAUDE_SKILL_DIR}` | 引用同目录下的脚本和资源 |
| `argument-hint` | 参数提示（如 `[filename] [format]`） |
| `$ARGUMENTS[N]` / `$N` | 位置参数访问 |

### 新增 Bundled Skills

| 技能 | 功能 |
|------|------|
| `/simplify` | 3 路并行代码审查 + 自动修复 |
| `/batch` | 大规模并行变更（git worktree） |
| `/debug` | Session debug log 分析 |
| `/loop` | 定时轮询任务 |
| `/claude-api` | 按语言加载 API 参考文档 |

### Subagent 系统成熟

- 内置 3 种代理：Explore、Plan、General-purpose
- 支持前台/后台运行
- 支持 `/agents` 命令管理
- 支持代理链（chain subagents）
- 支持代理并行（parallel research）

### Skill Creator — 元技能

- 内置的交互式向导，帮用户创建新 Skill
- 自动生成 SKILL.md + 目录结构
- 支持从已有对话中提取工作流并固化为 Skill
- 包含 description 建议、结构验证、测试引导

### SkillsBench — 首个 Skill 有效性基准（2026 Q1）

- 84 个任务 × 7 个模型 × 5 次试验
- 三层架构：Skills Layer / Agent Harness Layer / Models Layer
- 三种测试条件：无 Skill / 专家编写 Skill / 自生成 Skill
- Docker 容器化 + 确定性程序验证（非 LLM 判定）
- 关键发现：专家 Skill 显著提升性能，自生成 Skill 效果不稳定

> 📖 Docs: [Extend Claude with skills](https://docs.anthropic.com/en/docs/claude-code/skills) — 完整的 Skill 2.0 文档
> 📚 Paper: [SkillsBench](https://arxiv.org/abs/2502.09790) (Feb 2026) | [skillsbench.ai](https://skillsbench.ai)

---

## 当前状态与趋势

### 当前最成熟的能力

1. **Skill + Subagent 组合** — 复杂工作流的标准解法
2. **Bundled Skills** — 开箱即用的高频需求（simplify、batch）
3. **Hooks 系统** — 灵活的生命周期拦截
4. **Plugin 生态** — 可分发的技能包
5. **Skill Creator** — 降低了 Skill 创建门槛
6. **SkillsBench** — 首次量化证明了 Skill 的价值

### 可能的下一步发展

| 方向 | 推测依据 |
|------|----------|
| **Skill 市场 / Registry** | [Agent Skills](https://agentskills.io) 社区已出现，官方可能提供 Skill 分发平台 |
| **Skill 组合 / 编排** | 已有的 `/batch` 和 agent chaining 暗示更复杂的编排能力 |
| **更细粒度的权限** | Bash pattern 限制只是开始，可能出现文件路径限制等 |
| **跨会话 Skill 状态** | Auto memory 已存在，Skill 可能获得持续状态 |
| **团队级 Skill 分析** | 组织管理员可能获得 Skill 使用统计和行为审计 |

> 🧪 经验: 基于官方文档和社区讨论的趋势观察，非官方确认

---

## 演进脉络总结

```
"每次对话白纸一张"
        │
        ▼  解决方案: CLAUDE.md (持久记忆)
"规范有了，但工作流还要手动描述"
        │
        ▼  解决方案: Commands (模板化命令)
"命令太简单，不能自动触发、不能限制权限"
        │
        ▼  解决方案: Skills v1 (SKILL.md + Frontmatter + auto-trigger)
"缺安全控制、缺上下文隔离、缺动态注入"
        │
        ▼  解决方案: Skills 2.0 (全面升级)
"创建 Skill 太麻烦、不确定 Skill 有没有用"
        │
        ▼  解决方案: Skill Creator (交互式创建) + SkillsBench (量化验证)
"希望更强的编排和生态系统"
        │
        ▼  下一步: Skill Registry? Skill State? ...
```
