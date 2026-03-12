---
topic: claude_code_skill
dimension: tutorial
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "Anthropic Claude Code Skills Docs (2026-03 revision)"
  - "Anthropic Claude Code Subagents Docs (2026-03 revision)"
  - "Anthropic Claude Code Hooks Docs (2026-03 revision)"
  - "Anthropic Claude Code Memory Docs (2026-03 revision)"
  - "SkillsBench paper (arxiv 2502.09790, Feb 2026)"
  - "skillsbench.ai (2026-03 revision)"
expiry: 3m
status: current
---

# Claude Code Skill 2.0 教程

> **前置知识：** Claude Code 基本使用（安装、对话、文件操作）
> **参考来源：** [Skills Docs](https://docs.anthropic.com/en/docs/claude-code/skills) | [Subagents Docs](https://docs.anthropic.com/en/docs/claude-code/sub-agents) | [Hooks Docs](https://docs.anthropic.com/en/docs/claude-code/hooks) | [Memory Docs](https://docs.anthropic.com/en/docs/claude-code/memory)

---

## Section 0: 前置知识速查

在学习 Skill 之前，你需要了解：

1. **Claude Code** 是 Anthropic 出品的 Agentic 编码工具，能读代码、编辑文件、执行命令
2. **CLAUDE.md** 是项目级持久化指令文件（→ 详见 [Memory 文档](https://docs.anthropic.com/en/docs/claude-code/memory)）
3. **Markdown + YAML** 基本语法（Frontmatter 用 `---` 包裹的 YAML 块）

> 📖 Docs: [Claude Code overview](https://docs.anthropic.com/en/docs/claude-code/overview)

---

## Section 1: 它解决什么问题（Why）

### 没有 Skill 会怎样？

想象你每天都需要 Claude 帮你做这些事：

1. **代码审查**：每次都要告诉 Claude "审查代码时注意安全性、命名规范、测试覆盖……"
2. **部署流程**：每次部署都要重复 "先跑测试 → build → push → 验证"
3. **代码解释**：每次都说 "用类比开头，画 ASCII 图，突出易踩的坑……"

**痛点是显而易见的：**

- 📝 **重复劳动**：同样的指令反复输入，浪费时间
- 🎯 **质量不稳定**：有时说得详细效果好，赶时间时说得简略效果差
- 🔐 **安全隐患**：忘记限制工具权限，Claude 可能在不该部署的时候自动部署
- 🧠 **上下文浪费**：长对话中堆积太多无关的"怎么做 X"指令

### Skill 的出现动机

> Skill = **"打包好的可复用指令"**

它的核心价值：

1. **写一次，用无限次** — 把最佳实践固化为 SKILL.md 文件
2. **智能触发** — Claude 根据 description 自动判断何时使用
3. **权限控制** — 精确控制谁能触发、能用哪些工具
4. **上下文隔离** — 用 `context: fork` 让 Skill 在子代理中运行，不污染主对话
5. **团队共享** — 通过版本控制分享给整个团队

> 📖 Docs: [Extend Claude with skills](https://docs.anthropic.com/en/docs/claude-code/skills) — 开篇介绍

---

## Section 2: 它怎么工作的（How — 底层原理）

### 2.1 Skill 的生命周期

```
用户开启 Claude Code 会话
        │
        ▼
┌─── 第 1 步：扫描 Skills ────────────────────────┐
│                                                   │
│  Claude 扫描以下位置的 SKILL.md 文件：            │
│  • ~/.claude/skills/         （用户级）           │
│  • .claude/skills/           （项目级）           │
│  • <plugin>/skills/          （插件级）           │
│  • 嵌套子目录中的 .claude/skills/                 │
│                                                   │
│  只读取 Frontmatter（name + description）         │
│  → 所有 Skill 的"门牌号"加载到系统提示            │
└───────────────────────────────────────────────────┘
        │
        ▼
┌─── 第 2 步：匹配触发 ──────────────────────────────┐
│                                                     │
│  用户发送消息或使用 /slash-command                   │
│                                                     │
│  匹配方式（二选一）：                                │
│  A) 用户显式调用 → /skill-name [参数]               │
│  B) Claude 自动判断 → description 匹配上下文        │
│                                                     │
│  触发控制：                                          │
│  • disable-model-invocation: true → 仅 A            │
│  • user-invocable: false → 仅 B                     │
└─────────────────────────────────────────────────────┘
        │
        ▼
┌─── 第 3 步：加载 SKILL.md Body ─────────────────────┐
│                                                      │
│  Claude 读取 SKILL.md 的完整 Markdown 内容           │
│                                                      │
│  如果有动态上下文注入（!`command`）：                 │
│  → 立即执行命令，输出替换占位符                      │
│  → Claude 收到的是已渲染的完整提示                   │
│                                                      │
│  如果有 $ARGUMENTS：                                 │
│  → 用户参数替换到指令中                              │
└──────────────────────────────────────────────────────┘
        │
        ▼
┌─── 第 4 步：执行 ────────────────────────────────────┐
│                                                      │
│  根据 context 字段决定执行环境：                      │
│                                                      │
│  context: 无（默认）                                 │
│  → 在主对话上下文中执行                              │
│  → 共享历史和工具                                    │
│                                                      │
│  context: fork                                       │
│  → 创建新的子代理上下文                              │
│  → 根据 agent 字段选择 Explore/Plan/自定义           │
│  → allowed-tools 限制可用工具                        │
│  → 执行完毕，结果摘要返回主对话                      │
│                                                      │
│  执行过程中：                                        │
│  → Hooks（如 PreToolUse、PostToolUse）按配置触发     │
│  → allowed-tools 白名单严格限制工具访问              │
└──────────────────────────────────────────────────────┘
```

> 📖 Docs: [Types of skill content](https://docs.anthropic.com/en/docs/claude-code/skills#types-of-skill-content) + [Inject dynamic context](https://docs.anthropic.com/en/docs/claude-code/skills#inject-dynamic-context)

### 2.2 三层信息加载机制（Token 高效策略）

Claude Code Skill 的设计核心是**最小化 token 消耗**：

```
开销最低 ──────────────────────────────── 开销最高
   │                                          │
   ▼                                          ▼

Layer 1          Layer 2             Layer 3
Frontmatter      SKILL.md Body       Supporting Files
(name + desc)    (完整指令)          (references/, scripts/)
                                     
始终加载          按需加载            按需加载
~50 tokens       ~500 tokens         ~2000+ tokens
```

**为什么这样设计？** Claude 的上下文窗口是共享资源。如果 100 个 Skill 的完整内容都加载，会严重挤压用户对话和代码的空间。三层架构确保：

- **Layer 1**：所有 Skill 的"索引"常驻，让 Claude 知道有哪些能力
- **Layer 2**：仅在匹配到时加载，节省 99% 的不相关 Skill token
- **Layer 3**：Claude 自行决定是否需要深入参考

> 📖 Docs: [Add supporting files](https://docs.anthropic.com/en/docs/claude-code/skills#add-supporting-files) — "SKILL.md links to supporting files"

### 2.3 动态上下文注入（! 语法）

这是 Skill 2.0 最强大的高级特性之一：

```markdown
# 在 SKILL.md 中写：
- PR diff: !`gh pr diff`
- Changed files: !`gh pr diff --name-only`

# Claude 实际收到的是：
- PR diff: [实际的 diff 输出]
- Changed files: [实际的文件列表]
```

**执行时机**：在 Claude 看到 SKILL 内容之前，所有 `!` 命令已经执行完毕并替换。Claude 收到的是一个完整的、包含实际数据的提示。

**使用场景**：
- 注入 PR 信息（diff、comments）
- 注入系统状态（git status、环境变量）
- 注入构建结果（test output、lint results）

> 📖 Docs: [Inject dynamic context](https://docs.anthropic.com/en/docs/claude-code/skills#inject-dynamic-context) — "Each !command executes immediately"

### 2.4 Subagent 执行模型

当 Skill 使用 `context: fork` 时：

```
┌── 主对话 ──────────────────────────────────┐
│                                             │
│  用户: "审查我最近的代码改动"                │
│                                             │
│  Claude: 检测到 code-reviewer Skill         │
│          → context: fork → 创建子代理        │
│                                             │
│  ┌── Subagent ─────────────────────────┐    │
│  │  新的独立上下文                      │    │
│  │  tool: Read, Grep, Glob (受限)      │    │
│  │  model: inherit (继承主对话模型)    │    │
│  │                                     │    │
│  │  1. 执行 git diff                   │    │
│  │  2. 分析代码变更                    │    │
│  │  3. 生成审查报告                    │    │
│  │                                     │    │
│  │  → 返回摘要                         │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Claude: "审查完毕，发现 3 个问题……"        │
│          （主对话上下文未被审查过程污染）     │
└─────────────────────────────────────────────┘
```

**前台 vs 后台子代理**：

| 模式 | 行为 | 适用场景 |
|------|------|----------|
| **前台**（默认） | 阻塞主对话直到完成，可交互 | 需要确认的操作 |
| **后台**（`Ctrl+B` 或明确要求） | 并发运行，自动处理权限 | 大批量分析、测试运行 |

> 📖 Docs: [Run skills in a subagent](https://docs.anthropic.com/en/docs/claude-code/skills#run-skills-in-a-subagent)

### 2.5 内置的 Bundled Skills

Claude Code 2.0 自带 5 个内置技能：

| 技能 | 功能 | 关键特性 |
|------|------|----------|
| `/simplify` | 代码审查 + 自动修复 | 并行启动 3 个审查代理（代码复用、质量、效率） |
| `/batch <指令>` | 大规模并行变更 | 分解为 5-30 个独立单元，每个在 git worktree 中执行 |
| `/debug [描述]` | 调试当前会话 | 读取 session debug log 分析问题 |
| `/loop [间隔] <提示>` | 周期性任务 | 定时轮询部署状态、监控 PR 等 |
| `/claude-api` | 加载 API 参考文档 | 自动检测项目语言，加载对应 SDK 文档 |

> 📖 Docs: [Bundled skills](https://docs.anthropic.com/en/docs/claude-code/skills#bundled-skills)

### 2.6 Skill Creator——交互式技能创建向导

Skill Creator 是 Claude 内置的「元技能」（meta-skill），它的作用是**帮你创建其他 Skill**。

#### 它解决什么问题？

手动创建 Skill 需要：
1. 记住正确的目录结构（`.claude/skills/<name>/SKILL.md`）
2. 写好 YAML frontmatter（字段名、格式、可选项）
3. 设计好的 description（影响触发准确性）
4. 组织 supporting files

Skill Creator 把这个过程自动化了。

#### 工作流程

```
用户: "帮我创建一个用于代码审查的 Skill"
        │
        ▼
Skill Creator 启动交互式向导：
  1. “这个 Skill 的用途是什么？”  → 确定核心功能
  2. “什么时候应该触发？”      → 生成 description
  3. “需要哪些工具？”          → 配置 allowed-tools
  4. “谁能触发？”              → 设置 invocation control
        │
        ▼
自动生成：
  └── .claude/skills/code-reviewer/
      ├── SKILL.md          ← 包含 frontmatter + 指令
      ├── references/       ← 参考文档（如需要）
      └── scripts/          ← 辅助脚本（如需要）
```

#### 使用方式

**方式 A：直接请求 Claude 创建**

```
“Create a SKILL.md for code review that checks security, naming, and test coverage”
```

Claude 会调用 skill-creator 能力，生成完整的 Skill 目录。

**方式 B：从已有对话中提取**

```
“Create a SKILL.md from the workflow we just used”
```

如果你刚刚和 Claude 完成了一个复杂任务，可以让它把这个工作流固化为 Skill。

#### Skill Creator 的核心能力

| 能力 | 说明 |
|------|------|
| 交互式架构向导 | 通过问答确定 Skill 的结构和配置 |
| 模板自动生成 | 生成符合规范的 SKILL.md + frontmatter |
| 触发词建议 | 为 description 推荐有效的关键词 |
| 结构验证 | 检查生成的 Skill 是否符合规范 |
| 测试引导 | 帮助验证新创建的 Skill 是否正常工作 |

> 🌐 Web: [Anthropic Skills Documentation](https://docs.anthropic.com/en/docs/claude-code/skills) — “skill-creator”
> 🌐 Web: Reddit/YouTube Claude Code 社区讨论 — Skill Creator 使用经验

### 2.7 SkillsBench——Skill 有效性基准测试

SkillsBench 是首个专门评估 **Agent Skill 有效性**的基准测试框架。

#### 为什么需要它？

SWE-bench 等现有基准测试测的是“模型能不能写代码”，但没人测过“**给模型一个 Skill，它能不能用得更好？**”

SkillsBench 回答的核心问题：
- Skill 到底能提升多少性能？
- 哪些领域的 Skill 最有效？
- 自己写的 Skill vs 专家写的 Skill 效果差多少？

#### 架构设计（三层抽象）

```
┌──────────────────────────────────────────┐
│  Skills Layer                              │
│  领域专用能力（如操作系统上的“应用”）      │
├──────────────────────────────────────────┤
│  Agent Harness Layer                       │
│  执行环境（如“操作系统”——Claude Code）     │
├──────────────────────────────────────────┤
│  Models Layer                              │
│  基础模型（如“CPU”——Opus / Sonnet / Haiku） │
└──────────────────────────────────────────┘
```

#### 核心数据

| 指标 | 值 |
|------|-----|
| 任务数 | 84 个（跨 11 个领域） |
| 测试模型 | 7 个（含 Opus 4.5/4.6, Sonnet 4.5, Haiku 4.5 等） |
| 每任务试次 | 5 次（取通过率） |
| 测试条件 | 3 种：无 Skill / 专家编写 Skill / 自生成 Skill |
| 容器化 | 每个任务在 Docker 容器中运行（可复现、隔离） |
| 验证方式 | 确定性测试（程序化断言，非 LLM 判定） |

#### 关键发现

- **专家编写的 Skill 显著提升通过率**，但效果因领域而异
- 自生成 Skill（模型自己写的）效果不稳定，说明 **Skill 质量很重要**
- 这为“Skill 值不值得写”提供了定量答案

#### 任务示例

| 任务 | 领域 | Skill 内容 |
|------|------|----------|
| Spring Boot 2→3 迁移 | Java 开发 | Jakarta 命名空间迁移 + Security 6 配置 |
| 地震相位关联 | 地球科学 | 地震波达时间分析算法 |
| 能源市场定价 | 金融/能源 | 电力市场拍卖算法 |
| D3.js 数据可视化 | 前端 | 数据到 D3 图表的转换规则 |
| PDF 表格填写 | 文档处理 | 法律表单字段映射 |

> 📚 Paper: [SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks](https://arxiv.org/abs/2502.09790) (Feb 2026)
> 🌐 Web: [skillsbench.ai](https://skillsbench.ai) — 在线排行榜 + 任务注册表 + 执行轨迹查看

---

## Section 3: 它的局限是什么（Limitation）

### 3.1 上下文窗口有限

- 所有 Skill 的 Frontmatter 始终占用上下文。**Skill 数量太多**时会挤压可用空间
- 可通过 `SLASH_COMMAND_TOOL_CHAR_BUDGET` 调整预算，但本质限制无法消除
- 可以用 `/context` 命令查看当前上下文占用情况

> 📖 Docs: [Claude doesn't see all my skills](https://docs.anthropic.com/en/docs/claude-code/skills#claude-doesn%E2%80%99t-see-all-my-skills)

### 3.2 触发不精准

- Description 写得太宽泛 → Skill 频繁误触发
- Description 写得太窄 → Skill 从不被自动触发
- 需要反复迭代 description 来找到平衡点

> 📖 Docs: [Troubleshooting](https://docs.anthropic.com/en/docs/claude-code/skills#troubleshooting)

### 3.3 子代理的开销

- `context: fork` 创建新上下文需要额外时间
- 子代理需要重新收集上下文（不共享主对话历史）
- 后台子代理无法向用户提问（AskUserQuestion tool call 会失败）

> 📖 Docs: [Choose between subagents and main conversation](https://docs.anthropic.com/en/docs/claude-code/sub-agents#choose-between-subagents-and-main-conversation)

### 3.4 安全边界

- Skill 中的 Hook 脚本直接执行系统命令，需要信任来源
- Plugin 提供的 Skill 在加载前应审查权限
- `allowed-tools` 是白名单但不是沙箱（Bash 仍可执行任意命令，需配合 pattern 限制）

> 📖 Docs: [Security considerations](https://docs.anthropic.com/en/docs/claude-code/hooks#security-considerations)

---

## Section 4: 和其他方案的对比

### 指令传递方式对比

| 方案 | 持久性 | 粒度 | 触发方式 | Token 开销 | 适用场景 |
|------|--------|------|----------|------------|----------|
| **直接对话** | ❌ 一次性 | 最灵活 | 手动 | 中 | 临时任务 |
| **CLAUDE.md** | ✅ 持久 | 项目级 | 始终加载 | 高（常驻） | 编码规范、项目约定 |
| **Skill** | ✅ 持久 | 任务级 | 智能 + 手动 | 低（按需） | 工作流、自动化 |
| **Subagent** | ✅ 持久 | 角色级 | 自动委派 | 中（fork） | 专业分工 |
| **Hook** | ✅ 持久 | 事件级 | 自动触发 | 极低 | 生命周期拦截 |

### Skill 2.0 vs 1.0 的进步

| 特性 | Skill 1.0（旧 commands） | Skill 2.0 |
|------|--------------------------|-----------|
| 文件格式 | `.claude/commands/*.md` | `.claude/skills/*/SKILL.md` |
| 触发方式 | 仅用户 `/command` | 用户 + Claude 自动 |
| 调用控制 | 无 | `disable-model-invocation` / `user-invocable` |
| 工具限制 | 无 | `allowed-tools` 白名单 |
| 动态上下文 | 无 | `!` 命令注入 |
| 子代理执行 | 无 | `context: fork` |
| Hooks | 无 | 完整生命周期事件 |
| 参数传递 | 有限 | `$ARGUMENTS[N]` / `$N` |
| 目录结构 | 单文件 | 文件夹（scripts/ + references/） |

---

## 参考来源

| 章节 | 来源 | 内容 |
|------|------|------|
| Section 0 | 📖 Docs: [Claude Code overview](https://docs.anthropic.com/en/docs/claude-code/overview) | Claude Code 基本介绍 |
| Section 1 | 📖 Docs: [Extend Claude with skills](https://docs.anthropic.com/en/docs/claude-code/skills) | Skill 的设计动机和核心价值 |
| Section 2.1-2.2 | 📖 Docs: [Types of skill content](https://docs.anthropic.com/en/docs/claude-code/skills#types-of-skill-content) | 三层信息架构 |
| Section 2.3 | 📖 Docs: [Inject dynamic context](https://docs.anthropic.com/en/docs/claude-code/skills#inject-dynamic-context) | 动态上下文注入 |
| Section 2.4 | 📖 Docs: [Run skills in a subagent](https://docs.anthropic.com/en/docs/claude-code/skills#run-skills-in-a-subagent) + [Create custom subagents](https://docs.anthropic.com/en/docs/claude-code/sub-agents) | Subagent 执行模型 |
| Section 2.5 | 📖 Docs: [Bundled skills](https://docs.anthropic.com/en/docs/claude-code/skills#bundled-skills) | 内置技能 |
| Section 2.6 | 🌐 Web: [Anthropic Skills Docs](https://docs.anthropic.com/en/docs/claude-code/skills) + Reddit/YouTube 社区 | Skill Creator 交互式创建 |
| Section 2.7 | 📚 Paper: [SkillsBench](https://arxiv.org/abs/2502.09790) + [skillsbench.ai](https://skillsbench.ai) | Skill 有效性基准测试 |
| Section 3 | 📖 Docs: [Troubleshooting](https://docs.anthropic.com/en/docs/claude-code/skills#troubleshooting) + [Security](https://docs.anthropic.com/en/docs/claude-code/hooks#security-considerations) | 局限性和安全 |
| Section 4 | 📖 Docs: 综合对比 — Skills, Memory, Subagents, Hooks | 方案对比 |
