---
topic: antigravity_workflow
dimension: tutorial
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📖 Docs: [Antigravity Official](https://antigravity.google/docs) — Workflows"
  - "📖 Docs: [Antigravity Codelabs](https://atamel.dev) — Rules & Workflows"
  - "💻 Source: 工作区 .agent/workflows/ 实例 (9 workflows)"
  - "💻 Source: 工作区 .agent/skills/ 实例 (139 Skills)"
expiry: 3m
status: current
---

# Antigravity Workflow 教程

> **前置知识：** Antigravity 基本使用（对话、文件操作）
> **参考来源：** 系统提示中的 Workflow 规范 + 工作区 `.agent/workflows/` 实例分析

---

## Section 1: 它解决什么问题（Why）

### 没有 Workflow 会怎样？

想象你每天要完成课程作业：

1. **从 Brightspace 下载作业** → 手动操作
2. **转换 PDF 到 Markdown** → 告诉 Agent 用什么 Skill
3. **理解需求、添加笔记** → 告诉 Agent 用什么格式
4. **写代码、双语注释** → 告诉 Agent 规范
5. **运行验证** → 手动确认
6. **生成截图、文档** → 告诉 Agent 模板
7. **提交前检查** → 手动清单
8. **Git 提交** → 手动操作

**每次都要重复描述整个流程**，遗漏任何步骤都可能导致作业不完整。

### Workflow 的出现动机

> Workflow = **"把完整流程固化为可复用的 Markdown 文档"**

核心价值：

1. **一句话触发整个流程** — `/complete-lab ml lab2`，Agent 自动按 8 个 Phase 执行
2. **标准化输出** — 每次作业的目录结构、文件命名、注释风格完全一致
3. **编排 Skills** — 在正确的时机调用正确的 Skill
4. **断点恢复** — 用 `--from=code` 从代码阶段继续
5. **自动化加速** — `// turbo` 标注的步骤跳过确认

> 🧪 经验: 系统提示中的原始定义——"Workflows are well-defined steps on how to achieve a particular thing"

---

## Section 2: 它怎么工作的（How — 底层原理）

### 2.1 Workflow 的生命周期

```
用户输入：/complete-lab ml lab2
        │
        ▼
┌─── 第 1 步：匹配 Workflow ─────────────────────────┐
│                                                      │
│  Agent 在以下目录中查找匹配的 .md 文件：             │
│  • .agent/workflows/complete-lab.md                  │
│  • .agents/workflows/complete-lab.md                 │
│  • _agent/workflows/complete-lab.md                  │
│  • _agents/workflows/complete-lab.md                 │
│                                                      │
│  匹配规则：文件名 = slash-command 名称               │
│  → /complete-lab  →  complete-lab.md                 │
└──────────────────────────────────────────────────────┘
        │
        ▼
┌─── 第 2 步：读取 Workflow 内容 ───────────────────────┐
│                                                        │
│  Agent 使用 view_file 读取完整的 Workflow .md 文件     │
│  → 解析 frontmatter（description）                     │
│  → 解析 Phase 结构和步骤                               │
│  → 识别 // turbo 注解                                  │
│  → 解析子命令参数（--from=code 等）                    │
│                                                        │
│  如果有 --from 参数：                                  │
│  → 跳过已完成的 Phase，从指定阶段开始                  │
└────────────────────────────────────────────────────────┘
        │
        ▼
┌─── 第 3 步：逐 Phase 执行 ────────────────────────────┐
│                                                        │
│  对每个 Phase：                                        │
│                                                        │
│  1. 读取该 Phase 引用的 Skill：                        │
│     "读取 skill: .shared/skills/xxx/SKILL.md"          │
│     → Agent 使用 view_file 读取 SKILL.md               │
│     → 按 Skill 指令执行具体任务                        │
│                                                        │
│  2. 执行命令：                                         │
│     // turbo 标注的 → SafeToAutoRun: true              │
│     无标注的 → 需用户确认 → SafeToAutoRun: false       │
│                                                        │
│  3. 检查点验证：                                       │
│     Agent 检查 ✅ 验证检查点的各项是否满足              │
│     → 全部通过 → 进入下一 Phase                        │
│     → 有失败项 → 提示用户处理                          │
└────────────────────────────────────────────────────────┘
        │
        ▼
┌─── 第 4 步：流程完成 ─────────────────────────────────┐
│                                                        │
│  所有 Phase 执行完毕                                   │
│  Agent 汇报完成状态和输出文件清单                      │
└────────────────────────────────────────────────────────┘
```

> 🧪 经验: Workflow 文件本身只是"指导文档"，Agent 逐步解读并执行，不是像代码一样被"运行"

### 2.2 Workflow 与 Skill 的协作模式

```
┌── Workflow: /complete-lab ────────────────────────────┐
│                                                       │
│  Phase 1: 抓取材料                                    │
│  ┌────────────────────────────────┐                   │
│  │ Skill: brightspace_scraper     │ ← 调用特定 Skill  │
│  │  → 登录 + 下载 + 保存          │                   │
│  └────────────────────────────────┘                   │
│                                                       │
│  Phase 2: 格式转换                                    │
│  ┌──────────────────────┐ ┌───────────────────────┐   │
│  │ Skill: pdf_processing │ │ Skill: docx_to_md     │   │
│  └──────────────────────┘ └───────────────────────┘   │
│                                                       │
│  Phase 4: 代码开发                                    │
│  ┌──────────────────────┐ ┌───────────────────────┐   │
│  │ Skill: code_generation│ │ Skill: code_comment   │   │
│  └──────────────────────┘ └───────────────────────┘   │
│  ┌──────────────────────┐                             │
│  │ Skill: notebook_conv  │                             │
│  └──────────────────────┘                             │
│                                                       │
│  Phase 6: 文档生成                                    │
│  ┌──────────────────────┐ ┌───────────────────────┐   │
│  │ Skill: code_screenshot│ │ Skill: assignment_doc  │   │
│  └──────────────────────┘ └───────────────────────┘   │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**设计哲学：Workflow 是编排者，Skill 是执行者**

- Workflow 决定**顺序**（先转换再写码）
- Skill 决定**方法**（怎么转换、怎么写码）
- 分离关注点：修改代码规范只需改 Skill，修改流程只需改 Workflow

### 2.3 // turbo 注解的工作原理

系统提示中明确了 turbo 的行为：

```markdown
# 来自系统提示的原文：

"If a workflow step has a '// turbo' annotation above it,
 you can auto-run the workflow step if it involves the run_command tool,
 by setting 'SafeToAutoRun' to true."

"If a workflow has a '// turbo-all' annotation anywhere,
 you MUST auto-run EVERY step that involves the run_command tool."
```

**关键限制：** `// turbo` 只适用于 `run_command` 工具。文件创建、编辑等操作不受其影响。

```
// turbo 的判定流程：

当前步骤是否涉及 run_command?
├── 否 → 正常流程（不受 turbo 影响）
└── 是 → 检查 turbo 状态
    ├── // turbo-all 存在？ → SafeToAutoRun: true
    ├── 上方有 // turbo？   → SafeToAutoRun: true（仅此步骤）
    └── 默认              → SafeToAutoRun: false（需用户确认）
```

### 2.4 子命令的解析逻辑

子命令是 Workflow 自定义的约定，Agent 解析文本中的使用说明来理解：

```markdown
# Workflow 中的子命令定义示例：

## 💡 快捷子命令

| 命令                                | 说明           | 从哪个 Phase 开始 |
| ----------------------------------- | -------------- | ----------------- |
| `/complete-lab ml lab2`             | 完整流程       | Phase 1           |
| `/complete-lab ml lab2 --from=code` | 从代码开发开始 | Phase 4           |
| `/complete-lab ml lab2 --from=doc`  | 从文档生成开始 | Phase 6           |
```

Agent 看到 `--from=code` 时，跳过 Phase 1-3，直接从 Phase 4 开始。

---

## Section 3: 它的局限是什么（Limitation）

### 3.1 纯文本编排——无运行时保证

- Workflow 是 Markdown 文本，不是可执行代码
- Agent "理解"流程的方式是阅读文本，**可能遗漏或误解步骤**
- 检查点是建议性的（Agent 不会自动验证，需人工确认或 Agent 主动检查）

### 3.2 没有状态持久化

- 中断后无法自动恢复——需要用户手动用 `--from=` 参数
- 没有"已完成 Phase 1-3"的持久化记录
- 多 Phase 之间的数据传递靠文件系统（输出文件）

### 3.3 frontmatter 功能有限

- Workflow 的 frontmatter 仅支持 `description` 字段
- 不支持 `allowed-tools`、`context: fork`、`hooks` 等 Claude Code Skill 的高级特性
- 不支持自动触发（Agent 不会根据上下文自动使用 Workflow）

### 3.4 Skill 耦合

- Workflow 中硬编码了 Skill 路径（`读取 skill: .shared/skills/xxx/SKILL.md`）
- Skill 重命名或移动会导致 Workflow 失效
- 不同用户的 Skill 目录结构可能不同

---

## Section 4: 和其他方案的对比

### 流程编排方式对比

| 方案 | 持久性 | 粒度 | 自动化 | 适用场景 |
|------|--------|------|--------|----------|
| **直接对话** | ❌ 一次性 | 最灵活 | ❌ 手动 | 临时任务 |
| **CLAUDE.md** | ✅ 持久 | 项目级 | ✅ 始终 | 编码规范 |
| **Skill** | ✅ 持久 | 单一能力 | ✅/手动 | 特定任务 |
| **Workflow** | ✅ 持久 | 完整流程 | 部分(`turbo`) | 多步骤编排 |
| **Agent + Workflow** | ✅ 持久 | 角色+流程 | 部分 | 复杂项目协作 |

### Antigravity Workflow vs 其他流程编排方案

| 方案 | 格式 | 优势 | 劣势 |
|------|------|------|------|
| **Antigravity Workflow** | Markdown | 人类可读、易编写、和 Skills 深度集成 | 无运行时保证、无状态持久化 |
| **GitHub Actions** | YAML | 真正的自动化、有状态管理 | 需要代码仓库、配置复杂 |
| **Makefile** | Make 语法 | 依赖管理精确 | 不适合交互式 Agent 场景 |
| **Shell 脚本** | Bash | 可直接执行 | 难以编排 Agent 行为 |

---

## 参考来源

| 章节 | 来源 | 内容 |
|------|------|------|
| Section 1 | 🧪 经验: 系统提示中的 Workflow 定义 | "well-defined steps" |
| Section 2.1 | 🧪 经验: 系统提示中的 Workflow 匹配规则 | 文件名 = slash-command |
| Section 2.2 | 💻 Source: `.agent/workflows/complete-lab.md` | Skill 调用模式分析 |
| Section 2.3 | 🧪 经验: 系统提示中的 turbo 规范 | "SafeToAutoRun: true" |
| Section 2.4 | 💻 Source: `.agent/workflows/` 所有 Workflow | 子命令约定 |
| Section 3-4 | 🧪 经验: 使用实践总结 | 局限性和方案对比 |
