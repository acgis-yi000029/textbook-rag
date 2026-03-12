---
topic: claude_code_skill
dimension: usage
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "Anthropic Claude Code Skills Docs (2026-03 revision)"
  - "Anthropic Claude Code Subagents Docs (2026-03 revision)"
  - "Anthropic Claude Code Hooks Docs (2026-03 revision)"
  - "SkillsBench paper (arxiv 2502.09790, Feb 2026)"
  - "工作区 .agent/skills/ 实例 (139 Skills)"
expiry: 3m
status: current
---

# Claude Code Skill 2.0 实战用法

> **本文定位：** 面向"我想现在就用起来"的读者。每个场景有操作步骤和可直接复制的模板。
> **和 Tutorial 的区别：** Tutorial 解释"为什么这样设计"，本文解释"怎么一步步做"。

---

## 场景 1：用 Skill Creator 交互式创建 Skill

> 适用于：第一次创建 Skill、不想手写 frontmatter 的用户

### 步骤

```
Step 1: 打开 Claude Code 终端

Step 2: 告诉 Claude 你想创建什么 Skill
  > "Create a skill that reviews Python code for security vulnerabilities"

Step 3: 回答 Skill Creator 的引导问题
  • 用途是什么？    → "检查 SQL 注入、路径遍历、硬编码密钥等"
  • 何时触发？      → "当用户说 review、security、audit 时"
  • 需要哪些工具？  → "Read, Grep, Glob（只读）"
  • 谁能触发？      → "Claude 自动 + 用户手动都可以"

Step 4: Claude 自动生成
  └── .claude/skills/security-review/
      ├── SKILL.md
      └── references/
          └── owasp-checklist.md  (可选)

Step 5: 测试
  > "Review this file for security issues: src/auth.py"
  （观察 Claude 是否调用了新创建的 Skill）
```

### 从已有对话提取 Skill

如果你刚刚和 Claude 完成了一个流程（比如部署、迁移），可以直接说：

```
"Create a SKILL.md from the workflow we just used"
```

Claude 会把你们对话中的步骤提取为可复用的 Skill。

> 📖 Docs: [Extend Claude with skills](https://docs.anthropic.com/en/docs/claude-code/skills)
> 🌐 Web: Reddit — "skill-creator" 使用经验

---

## 场景 2：手动创建你的第一个 Skill（30 秒）

> 适用于：想精确控制 Skill 内容的用户

### 步骤

```bash
# Step 1: 创建目录
mkdir -p .claude/skills/explain-code

# Step 2: 创建 SKILL.md
```

### SKILL.md 模板

```markdown
---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when the user asks "how does this work?" or wants to understand code.
---

When explaining code:

1. **Start with a one-line summary** of what this code does
2. **Draw an ASCII diagram** showing the data flow or structure
3. **Walk through step-by-step** what happens when the code runs
4. **Highlight one gotcha** — what's a common mistake with this pattern?

Keep explanations conversational and use analogies from everyday life.
```

### 验证

```
Step 3: 在 Claude Code 中输入
  > "What skills are available?"
  → 确认 "explain-code" 出现在列表中

Step 4: 测试触发
  > "How does this function work?"
  → 确认 Claude 使用了该 Skill 的格式（有图表、有 gotcha）

Step 5: 显式调用
  > /explain-code
  → 确认 slash command 可用
```

> 📖 Docs: [Create your first skill](https://docs.anthropic.com/en/docs/claude-code/skills#create-your-first-skill)

---

## 场景 3：创建有副作用的安全 Skill（部署/提交）

> 适用于：部署、数据库迁移、发布等需要审慎操作的场景

### 关键配置

```yaml
disable-model-invocation: true    # ← 关键：防止 Claude 自动触发
```

### 完整模板

```markdown
---
name: deploy
description: Deploy the application to staging or production
disable-model-invocation: true
argument-hint: [environment]
---

Deploy to $ARGUMENTS:

## Pre-flight checks
1. Run the test suite: `npm test`
2. Check for uncommitted changes: `git status`
3. Verify the target environment is valid ($ARGUMENTS must be "staging" or "production")

## Deploy
4. Build the application: `npm run build`
5. Push to deployment: `npm run deploy -- --env $ARGUMENTS`

## Post-deploy
6. Run smoke test: `curl -s https://$ARGUMENTS.example.com/health`
7. Report deployment status with timing information

If any step fails, STOP immediately and report the error.
```

### 使用

```
> /deploy staging        ✅ 用户手动触发 — 正常工作
> "部署到 staging"       ❌ Claude 不会自动触发 — 符合预期
```

> 📖 Docs: [Control who invokes a skill](https://docs.anthropic.com/en/docs/claude-code/skills#control-who-invokes-a-skill)

---

## 场景 4：只读分析 Skill（工具限制）

> 适用于：代码审查、安全扫描、架构分析等不应修改文件的场景

### 关键配置

```yaml
allowed-tools: Read, Grep, Glob    # ← 只读工具白名单
```

### 完整模板

```markdown
---
name: architecture-scan
description: Analyze project architecture and dependencies. Use when asked about project structure, module coupling, or architectural concerns.
allowed-tools: Read, Grep, Glob
context: fork
---

Analyze the project architecture:

1. **Map the module structure** — identify top-level directories and their responsibilities
2. **Trace dependencies** — find imports between modules, identify coupling points
3. **Check for patterns** — look for MVC, Clean Architecture, or other structural patterns
4. **Identify risks** — circular dependencies, god classes, tightly coupled modules
5. **Generate a report** with ASCII diagrams showing the architecture

Output format:
- ASCII dependency graph
- Risk level (🟢 low / 🟡 medium / 🔴 high) for each finding
- Specific file paths for each issue found

Do NOT modify any files. This is a read-only analysis.
```

### 工作原理

Claude 在子代理中运行（`context: fork`），只能使用 Read/Grep/Glob 三个工具。即使指令中写了 "修改文件"，Claude 也无法执行——工具白名单在 frontmatter 层已经锁死。

> 📖 Docs: [Restrict tool access](https://docs.anthropic.com/en/docs/claude-code/skills#restrict-tool-access)

---

## 场景 5：动态上下文注入（PR 审查）

> 适用于：需要运行时数据（PR diff、git status、环境变量）的 Skill

### 关键语法

```markdown
!`command`    # ← 加载 Skill 时立即执行，输出替换占位符
```

### 完整模板

```markdown
---
name: pr-review
description: Review the current pull request for issues and improvement suggestions
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## Pull Request Context

- **PR title**: !`gh pr view --json title -q '.title' 2>/dev/null || echo "ERROR: No PR found"`
- **PR description**: !`gh pr view --json body -q '.body' 2>/dev/null || echo "No description"`
- **Changed files**: !`gh pr diff --name-only 2>/dev/null || echo "ERROR: Cannot get diff"`
- **Diff**: !`gh pr diff 2>/dev/null || echo "ERROR: Cannot get diff"`

## If any context shows ERROR

Stop and tell the user:
1. Make sure `gh` CLI is installed and authenticated (`gh auth login`)
2. Make sure you're in a git repo with an open PR
3. Try running `gh pr view` manually to debug

## Review Instructions

For each changed file:
1. Check for logic errors
2. Verify error handling
3. Look for security issues
4. Suggest naming improvements
5. Rate severity: 🟢 minor / 🟡 moderate / 🔴 critical

Summarize with:
- Total issues found (by severity)
- Top 3 most important things to fix
- One thing done well (positive feedback)
```

### 注意事项

- `!` 命令在 Claude 看到内容之前执行
- **始终加错误处理**（`2>/dev/null || echo "ERROR: ..."`)
- 确保 `gh` CLI 已安装并认证

> 📖 Docs: [Inject dynamic context](https://docs.anthropic.com/en/docs/claude-code/skills#inject-dynamic-context)

---

## 场景 6：带参数的组件迁移 Skill

> 适用于：需要用户传入参数的模板化工作流

### 关键语法

| 变量 | 含义 | 示例 |
|------|------|------|
| `$ARGUMENTS` | 全部参数 | `/migrate Button React Vue` → `Button React Vue` |
| `$0`, `$1`, `$2` | 各位置参数 | `$0`=Button, `$1`=React, `$2`=Vue |

### 完整模板

```markdown
---
name: migrate-component
description: Migrate a UI component from one framework to another
disable-model-invocation: true
argument-hint: [component-name] [source-framework] [target-framework]
---

# Migrate $0 from $1 to $2

## Phase 1: Understand the source
1. Find the $0 component in the $1 codebase
2. Document all props, state, events, and lifecycle hooks
3. Identify child components and dependencies

## Phase 2: Create the target
4. Create the equivalent $2 component
5. Map each prop/state/event to the $2 equivalent
6. Preserve all existing behavior

## Phase 3: Update imports
7. Find all files that import the old $0 component
8. Update imports to use the new $2 version
9. Update any framework-specific syntax in consuming files

## Phase 4: Verify
10. Run existing tests (if any)
11. Report migration summary: what changed, what needs manual review
```

### 使用

```
> /migrate-component SearchBar React Vue
> /migrate-component DataTable Angular React
```

> 📖 Docs: [Pass arguments to skills](https://docs.anthropic.com/en/docs/claude-code/skills#pass-arguments-to-skills)

---

## 场景 7：带 Hook 的安全操作 Skill

> 适用于：需要在工具使用前后自动执行检查的场景

### 完整模板

```markdown
---
name: safe-deploy
description: Deploy with automatic security validation
disable-model-invocation: true
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/.claude/hooks/check-deploy-safety.sh"
---

Deploy to $ARGUMENTS with automatic security checks.

All Bash commands will be validated by the safety checker before execution.
The checker will block:
- Commands targeting production without explicit approval
- Commands that delete data
- Commands that modify security configurations
```

### 配套脚本

```bash
#!/bin/bash
# .claude/hooks/check-deploy-safety.sh

# 读取 stdin 获取工具调用信息
input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# 检查危险命令
if echo "$command" | grep -qE 'rm -rf|DROP TABLE|DELETE FROM'; then
  echo '{"decision": "block", "reason": "Dangerous command detected"}'
  exit 0
fi

# 放行
echo '{"decision": "allow"}'
```

> 📖 Docs: [Hooks in skills and agents](https://docs.anthropic.com/en/docs/claude-code/hooks#hooks-in-skills-and-agents)

---

## 场景 8：用 SkillsBench 验证 Skill 有效性

> 适用于：需要量化评估自己写的 Skill 是否真正有用

### SkillsBench 是什么

首个专门评估 Skill 对 Agent 性能提升的基准测试框架：
- **84 个任务**，跨 11 个领域（Java 迁移、地球科学、金融、前端、文档处理…）
- **7 个模型**（Opus 4.5/4.6, Sonnet 4.5, Haiku 4.5 等）
- **Docker 容器化** — 每个任务可复现
- **确定性验证** — 程序化断言，非 LLM 判定

### 如何使用

```bash
# Step 1: 访问 SkillsBench
#   https://skillsbench.ai

# Step 2: 查看排行榜
#   https://skillsbench.ai/leaderboard
#   → 对比不同模型在"有 Skill" vs "无 Skill"下的表现

# Step 3: 浏览任务注册表
#   https://skillsbench.ai/tasks
#   → 查看 84 个任务的详情和评估标准

# Step 4: 查看执行轨迹
#   点击排行榜中的模型 → 展开任务 → 查看完整的 agent 执行过程
#   → 学习优秀 Skill 如何被 agent 使用
```

### 关键发现与实用建议

| 发现 | 对你的意义 |
|------|-----------|
| 专家 Skill 显著提升通过率 | **值得花时间写 Skill**，收益是可量化的 |
| 自生成 Skill 效果不稳定 | 不要让 Claude 随便写 Skill，**需要人工审核和迭代** |
| 效果因领域而异 | 技术性强的领域（迁移、算法）Skill 收益更大 |
| 容器化测试可复现 | 可以仿照 SkillsBench 的模式测试自己的 Skill |

### 自测 Skill 有效性的简易方法

```
Step 1: 准备一个测试任务（有明确的成功标准）
Step 2: 不使用 Skill，让 Claude 执行任务，记录结果
Step 3: 使用你的 Skill，让 Claude 执行同样的任务，记录结果
Step 4: 对比：成功率、输出质量、token 消耗、执行时间
Step 5: 根据对比结果迭代 Skill 内容
```

> 📚 Paper: [SkillsBench: Benchmarking How Well Agent Skills Work](https://arxiv.org/abs/2502.09790) (Feb 2026)
> 🌐 Web: [skillsbench.ai](https://skillsbench.ai) — 在线排行榜 + 任务注册表

---

## 场景 9：分享 Skill 给团队

> 适用于：团队协作、标准化工作流

### 方式 A：通过版本控制（推荐）

```bash
# 项目级 Skill — 随代码一起提交
.claude/skills/my-skill/SKILL.md

# 提交到 Git
git add .claude/skills/
git commit -m "Add code review skill"
git push

# 团队成员 pull 后自动获得该 Skill
```

### 方式 B：通过 Plugin 打包

```
my-plugin/
├── skills/
│   └── my-skill/
│       └── SKILL.md
├── hooks/         # 可选
├── agents/        # 可选
└── README.md
```

### 方式 C：用户级全局 Skill

```bash
# 放在 home 目录下，所有项目都可用
~/.claude/skills/my-global-skill/SKILL.md
```

> 📖 Docs: [Share skills](https://docs.anthropic.com/en/docs/claude-code/skills#share-skills)

---

## 场景 10：常用 Skill 模板库

### 模板 A：团队编码规范 Skill

```markdown
---
name: coding-standards
description: Our team's coding standards. Use when writing or reviewing code.
user-invocable: false
---

## Coding Standards

- Use 2-space indentation
- Always add JSDoc for public functions
- Use `async/await` instead of `.then()` chains
- Error messages must be user-friendly (no stack traces in UI)
- Test files go next to source files: `foo.ts` → `foo.test.ts`
```

### 模板 B：日志规范 Skill

```markdown
---
name: log-standards
description: Logging conventions. Use when adding log statements or reviewing logging.
user-invocable: false
---

## Logging Rules

- Use structured logging (JSON format)
- Log levels: ERROR (failures), WARN (recoverable), INFO (state changes), DEBUG (details)
- Always include: timestamp, request_id, user_id (if available)
- Never log: passwords, tokens, PII, full credit card numbers
- Use `logger.child({ requestId })` for scoped logging
```

### 模板 C：Git 提交规范 Skill

```markdown
---
name: commit-message
description: Format commit messages. Use when making git commits.
---

Write commit messages following Conventional Commits:

Format: `type(scope): description`

Types: feat, fix, docs, style, refactor, test, chore, perf, ci
Scope: module or component name (optional)
Description: imperative mood, lowercase, no period at end

Examples:
- `feat(auth): add JWT refresh token support`
- `fix(api): handle null response from payment gateway`
- `refactor(db): extract connection pooling to separate module`

Body (optional): explain WHY, not WHAT. The diff shows WHAT.
```

### 模板 D：可视化输出 Skill

```markdown
---
name: visualize-data
description: Generate visual charts from data. Use when asked to visualize, plot, or chart data.
allowed-tools: Bash(python *)
---

Generate a visualization using Python:

1. Use matplotlib or plotly for charts
2. Save output as HTML (for interactive) or PNG (for static)
3. Use a dark theme with vibrant colors
4. Include proper labels, title, and legend
5. Open the generated file after creation

Script location: ${CLAUDE_SKILL_DIR}/scripts/chart_generator.py
```

---

## 速查表

### Skill 创建决策树

```
你想让 Claude 用什么？
        │
        ├── 编码规范/全局约定
        │   → 用 CLAUDE.md（不是 Skill）
        │
        ├── 简单的一次性任务
        │   → 直接对话（不需要 Skill）
        │
        └── 重复性工作流
            │
            ├── 有副作用（部署/删除/提交）？
            │   → Skill + disable-model-invocation: true
            │
            ├── 需要隔离上下文？
            │   → Skill + context: fork
            │
            ├── 只需要读取分析？
            │   → Skill + allowed-tools: Read, Grep, Glob
            │
            └── 通用知识增强？
                → Skill（默认配置即可）
```

### 常用操作命令

| 操作 | 命令/方法 |
|------|----------|
| 查看所有 Skill | `What skills are available?` |
| 查看上下文占用 | `/context` |
| 手动触发 Skill | `/skill-name [参数]` |
| 创建新 Skill | `"Create a skill that..."` |
| 从对话提取 Skill | `"Create a SKILL.md from what we just did"` |
| 管理子代理 | `/agents` |
| 调试 Skill 触发 | 检查 description 关键词覆盖 |

### Frontmatter 速查 — 常见配置组合

| 场景 | 配置 |
|------|------|
| **最简 Skill** | `name` + `description` |
| **安全操作** | + `disable-model-invocation: true` |
| **只读分析** | + `allowed-tools: Read, Grep, Glob` + `context: fork` |
| **动态数据** | + `!command` 注入 |
| **带参数** | + `argument-hint` + `$ARGUMENTS` |
| **背景知识** | + `user-invocable: false` |
| **带 Hook** | + `hooks: { PreToolUse: [...] }` |
