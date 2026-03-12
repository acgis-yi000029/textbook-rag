---
topic: claude_code_skill
dimension: code
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "Anthropic Claude Code Skills Docs (2026-03 revision)"
  - "Anthropic Claude Code Subagents Docs (2026-03 revision)"
  - "工作区 .agent/skills/ 实例 (139 Skills)"
expiry: 3m
status: current
---

# Claude Code Skill 2.0 代码参考

## 快速开始

### 最简 Skill — 30 秒上手

创建目录和文件：

```bash
# 创建 Skill 目录 / Create skill directory
mkdir -p .claude/skills/greet

# 创建 SKILL.md / Create SKILL.md
cat > .claude/skills/greet/SKILL.md << 'EOF'
---
name: greet
description: Greet the user warmly. Use when the user says hello or starts a conversation.
---

When greeting the user:
1. Use their name if available
2. Mention the current project
3. Suggest 3 tasks they might want to work on today
EOF
```

测试：在 Claude Code 中输入 `/greet` 或说 "hello"。

> 📖 Docs: [Create your first skill](https://docs.anthropic.com/en/docs/claude-code/skills#create-your-first-skill)

---

## 完整实现示例

### 示例 1：代码解释器（Model-invocable Skill）

```markdown
# .claude/skills/explain-code/SKILL.md
---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"
---

When explaining code, always include:

1. **Start with an analogy**: Compare the code to something from everyday life
   - 用日常生活的类比开头 / Start with a real-world analogy

2. **Draw a diagram**: Use ASCII art to show the flow, structure, or relationships
   - 画 ASCII 图展示流程 / Draw ASCII diagram for flow

3. **Walk through the code**: Explain step-by-step what happens
   - 逐步讲解代码 / Explain step by step

4. **Highlight a gotcha**: What's a common mistake or misconception?
   - 指出常见误区 / Point out common mistakes

Keep explanations conversational. For complex concepts, use multiple analogies.
```

> 📖 Docs: [Create your first skill](https://docs.anthropic.com/en/docs/claude-code/skills#create-your-first-skill)

### 示例 2：部署流程（User-only Skill）

```markdown
# .claude/skills/deploy/SKILL.md
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
context: fork
---

Deploy $ARGUMENTS to production:

1. Run the test suite: `npm test`
2. Build the application: `npm run build`
3. Push to the deployment target: `npm run deploy -- --env $ARGUMENTS[0]`
4. Verify the deployment succeeded: `curl -s https://api.example.com/health`

Report the deployment status with timing information.
```

**调用方式**：`/deploy staging` 或 `/deploy production`

> 📖 Docs: [Control who invokes a skill](https://docs.anthropic.com/en/docs/claude-code/skills#control-who-invokes-a-skill)

### 示例 3：PR 摘要（动态上下文注入）

```markdown
# .claude/skills/pr-summary/SKILL.md
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## Pull request context

- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

## Your task

Summarize this pull request:
1. What was changed and why
2. Key design decisions
3. Potential risks or concerns
4. Suggested reviewers based on code ownership
```

**工作原理**：`!` 命令在 Claude 看到内容之前执行，输出替换占位符。

> 📖 Docs: [Inject dynamic context](https://docs.anthropic.com/en/docs/claude-code/skills#inject-dynamic-context)

### 示例 4：安全只读审查（工具限制）

```markdown
# .claude/skills/safe-reader/SKILL.md
---
name: safe-reader
description: Read files without making changes. Use when you need safe, read-only analysis.
allowed-tools: Read, Grep, Glob
---

Analyze the requested files or directories:
1. Search for relevant code patterns
2. Identify potential issues
3. Report findings without making any changes

Never suggest or attempt to modify files directly.
```

> 📖 Docs: [Restrict tool access](https://docs.anthropic.com/en/docs/claude-code/skills#restrict-tool-access)

### 示例 5：带可视化输出的 Skill

```markdown
# .claude/skills/codebase-visualizer/SKILL.md
---
name: codebase-visualizer
description: Generate an interactive collapsible tree visualization of your codebase. Use when exploring a new repo, understanding project structure, or identifying large files.
allowed-tools: Bash(python *)
---

# Codebase Visualizer

Generate an interactive HTML tree view that shows your project's file structure.

## Usage

Run the visualization script from your project root:

```bash
python ${CLAUDE_SKILL_DIR}/scripts/visualize.py .
```

This creates `codebase-map.html` in the current directory and opens it.

## What the visualization shows

- **Collapsible directories**: Click folders to expand/collapse
- **File sizes**: Displayed next to each file
- **Colors**: Different colors for different file types
- **Directory totals**: Shows aggregate size of each folder
```

> 📖 Docs: [Generate visual output](https://docs.anthropic.com/en/docs/claude-code/skills#generate-visual-output)

### 示例 6：带 Hooks 的安全操作 Skill

```markdown
# .claude/skills/secure-ops/SKILL.md
---
name: secure-ops
description: Perform operations with security checks
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
---

Perform the requested operation with automatic security validation.
All Bash commands will be checked by the security script before execution.
```

> 📖 Docs: [Hooks in skills and agents](https://docs.anthropic.com/en/docs/claude-code/hooks#hooks-in-skills-and-agents)

### 示例 7：带参数的组件迁移 Skill

```markdown
# .claude/skills/migrate-component/SKILL.md
---
name: migrate-component
description: Migrate a component from one framework to another
argument-hint: [component] [from-framework] [to-framework]
disable-model-invocation: true
---

Migrate the $0 component from $1 to $2.

Steps:
1. Read the current $0 component implementation in $1
2. Understand the component's props, state, and lifecycle
3. Create equivalent implementation in $2
4. Preserve all existing behavior and tests
5. Update imports in consuming files
```

**调用方式**：`/migrate-component SearchBar React Vue`

> 📖 Docs: [Pass arguments to skills](https://docs.anthropic.com/en/docs/claude-code/skills#pass-arguments-to-skills)

---

## API 速查

### Frontmatter 字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | string | 必填 | Skill 名称 = `/命令名` |
| `description` | string | 必填 | 触发描述（Claude 用此判断） |
| `disable-model-invocation` | bool | `false` | `true` = 仅用户可调用 |
| `user-invocable` | bool | `true` | `false` = 仅 Claude 可调用 |
| `allowed-tools` | string | 全部 | 逗号分隔的工具白名单 |
| `argument-hint` | string | — | 参数提示文本 |
| `model` | string | `inherit` | `sonnet`/`opus`/`haiku`/`inherit` |
| `context` | string | — | `fork` = 子代理执行 |
| `agent` | string | — | `Explore`/`Plan`/自定义代理名 |
| `hooks` | object | — | 生命周期钩子配置 |

### 字符串替换

| 变量 | 说明 |
|------|------|
| `$ARGUMENTS` | 全部用户参数 |
| `$ARGUMENTS[N]` / `$N` | 第 N 个参数（0-indexed） |
| `${CLAUDE_SESSION_ID}` | 当前会话 ID |
| `${CLAUDE_SKILL_DIR}` | SKILL.md 所在目录 |

### 内置 Agent 类型

| Agent | 模型 | 工具 | 用途 |
|-------|------|------|------|
| `Explore` | Haiku | 只读工具 | 文件搜索、代码探索 |
| `Plan` | 继承 | 只读工具 | 代码研究、规划 |
| General-purpose | 继承 | 全部工具 | 复杂操作、代码修改 |

### 文件位置

| 位置 | 范围 | 分享方式 |
|------|------|----------|
| `~/.claude/skills/<name>/` | 用户级 | 仅当前用户 |
| `.claude/skills/<name>/` | 项目级 | 版本控制 |
| `<plugin>/skills/<name>/` | 插件级 | Plugin 分发 |

---

## 目录结构模板

### 简单 Skill

```
my-skill/
├── SKILL.md              # 核心指令（必须）
```

### 标准 Skill

```
my-skill/
├── SKILL.md              # 核心指令（必须）
├── references/
│   ├── checklist.md       # 参考文档
│   └── patterns.md        # 模式参考
└── examples/
    └── sample-output.md   # 输出示例
```

### 高级 Skill（带脚本）

```
my-skill/
├── SKILL.md              # 核心指令（必须）
├── references/
│   └── api-docs.md        # API 详细文档
├── examples/
│   └── sample.md          # 示例输出
├── scripts/
│   ├── analyze.py         # 分析脚本
│   └── validate.sh        # 验证脚本
└── templates/
    └── report.md          # 报告模板
```

---

## 与工作区实际 Skill 的对比

工作区 `.agent/skills/` 中有 139 个 Skill，以下是几种典型模式：

### 模式 A：知识顾问型（最常见）

```markdown
# 示例: .agent/skills/ai-skills/SKILL.md
---
name: ai-skills
description: 专业的Claude Skills顾问助手。当用户询问以下问题时使用：
  (1) 技术选型和对比 (2) 使用指南和最佳实践 ...
---

# Claude Skills顾问
## 核心能力
## 工作流程
## 回答原则
```

> 💻 Source: 工作区 `.agent/skills/ai-skills/SKILL.md`

### 模式 B：工具集成型（带脚本）

```markdown
# 示例: .agent/skills/dev-code_reviewer/SKILL.md
---
name: code-reviewer
description: Comprehensive code review skill...
---

# Code Reviewer
## Quick Start
python scripts/pr_analyzer.py [options]
python scripts/code_quality_checker.py [options]

## Reference Documentation
See references/code_review_checklist.md
See references/coding_standards.md
```

> 💻 Source: 工作区 `.agent/skills/dev-code_reviewer/SKILL.md`

### 模式 C：学习辅助型

```markdown
# 示例: .agent/skills/ai_learning-rl/SKILL.md
---
name: rl-assistant
description: Comprehensive RL learning assistant for coursework...
---

# 能力列表
(1) concept explanation (2) code analysis (3) homework guidance...
```

> 💻 Source: 工作区 `.agent/skills/ai_learning-rl/SKILL.md`
