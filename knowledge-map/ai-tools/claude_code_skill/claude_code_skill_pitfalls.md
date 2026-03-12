---
topic: claude_code_skill
dimension: pitfalls
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "Anthropic Claude Code Skills Docs (2026-03 revision)"
  - "Anthropic Claude Code Subagents Docs (2026-03 revision)"
  - "工作区 .agent/skills/ 实例 (139 Skills)"
  - "Anthropic Reddit Community Discussions (2025-2026)"
expiry: 3m
status: current
---

# Claude Code Skill 2.0 踩坑记录

> ⚠️ **这是知识库中最有价值的维度。** 每次踩坑后请追加条目。

---

## 坑 1: Skill 永远不被自动触发

**场景：** 创建了一个 Skill，但 Claude 从不主动使用它，只有手动 `/skill-name` 才会触发。

**症状：** 用户提出的问题明显匹配 Skill 的用途，但 Claude 就是不读取 SKILL.md。

**根因：** `description` 字段写得太模糊或太专业，Claude 无法将用户的自然语言请求与 description 匹配上。

**解法：**

```markdown
# ❌ 错误写法 — 描述太模糊
---
name: code-helper
description: Helps with code
---

# ✅ 正确写法 — 包含触发关键词 + 使用场景
---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"
---
```

**教训：** description 必须包含用户**实际会说的词**。想象用户会怎样提问，把那些关键词写进 description。

**验证方法：** 输入 `What skills are available?` 确认 Skill 出现在列表中。

> 📖 Docs: [Skill not triggering](https://docs.anthropic.com/en/docs/claude-code/skills#skill-not-triggering)

---

## 坑 2: Skill 触发太频繁（误触发）

**场景：** 创建了一个通用性较强的 Skill，结果 Claude 在几乎所有对话中都使用它。

**症状：** 用户做不相关的事情时，Claude 也调用了这个 Skill，导致回答跑偏或浪费 token。

**根因：** description 太宽泛，匹配了过多上下文。

**解法：**

```markdown
# ❌ 错误写法 — 太宽泛
---
name: style-guide
description: Coding conventions and best practices
---

# ✅ 正确写法 — 加限定条件
---
name: style-guide
description: Python coding conventions for this project. Use ONLY when the user asks about code style, formatting, or naming conventions in Python files.
---

# ✅ 或者：禁止自动触发
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
---
```

**教训：** 有副作用的操作（部署、提交、发消息）**必须**设置 `disable-model-invocation: true`。

> 📖 Docs: [Skill triggers too often](https://docs.anthropic.com/en/docs/claude-code/skills#skill-triggers-too-often)

---

## 坑 3: Skill 数量太多导致 Claude 看不到全部

**场景：** 项目中有 50+ 个 Skill，发现有些 Skill 从未被加载。

**症状：** 输入 `What skills are available?` 只列出部分 Skill。

**根因：** Claude Code 有 `SLASH_COMMAND_TOOL_CHAR_BUDGET` 限制，Frontmatter 总字符数超过预算时会裁剪。

**解法：**

```markdown
# ❌ 错误做法 — description 写得很长
---
name: my-skill
description: |
  This is a comprehensive skill that handles many different scenarios
  including but not limited to code review, testing, deployment,
  documentation, and performance optimization. It covers TypeScript,
  JavaScript, Python, Go, and Rust across frontend, backend, and
  infrastructure components...
---

# ✅ 正确做法 — 精简 description
---
name: my-skill
description: Code review for TypeScript/Python. Use when reviewing PRs or checking code quality.
---
```

**教训：** 

1. Description 尽量短（1-2 句话）
2. 建议拆分为多个小型"微技能"（micro-skills）而非一个大技能
3. 用 `/context` 检查上下文占用

> 📖 Docs: [Claude doesn't see all my skills](https://docs.anthropic.com/en/docs/claude-code/skills#claude-doesn%E2%80%99t-see-all-my-skills)
> 🧪 经验: 工作区有 139 个 Skill，但每次会话中只有部分被列出

---

## 坑 4: Supporting File 没被 Claude 读取

**场景：** 在 Skill 目录下放了 `references/guide.md`，但 Claude 始终不读取。

**症状：** Claude 回答缺少 reference 文件中的关键信息。

**根因：** SKILL.md 中没有**明确链接**到 reference 文件。Claude 不会自动扫描 Skill 目录。

**解法：**

```markdown
# ❌ 错误写法 — 只在目录中放了文件，没在 SKILL.md 中引用
# (Claude 不会自动发现它们)

# ✅ 正确写法 — 在 SKILL.md 中明确引用
---
name: api-designer
description: Design REST APIs following our conventions
---

# API Design Guide

## Quick rules
1. Use RESTful naming
2. Return consistent errors

## Additional resources
- For complete API patterns, see [reference.md](reference.md)
- For usage examples, see [examples.md](examples.md)
```

**教训：** SKILL.md 是"导航入口"，必须显式链接到所有 supporting files。建议**避免深层嵌套**引用（一级就好），防止 Claude 只部分读取。

> 📖 Docs: [Add supporting files](https://docs.anthropic.com/en/docs/claude-code/skills#add-supporting-files)
> 🌐 Web: YouTube Claude Code Skills tutorial — "keep references one level deep"

---

## 坑 5: 动态上下文 `!` 命令执行失败但没有提示

**场景：** 在 SKILL.md 中用了 `!gh pr diff`，但 PR 信息没注入。

**症状：** Claude 收到的是空白内容或错误信息混在提示中。

**根因：** 
1. `gh` CLI 未安装或未认证
2. 当前不在 git 仓库中
3. `!` 命令的退出码非 0 但输出仍被注入

**解法：**

```markdown
# ❌ 脆弱写法 — 假设命令一定成功
- PR diff: !`gh pr diff`

# ✅ 健壮写法 — 加入错误处理提示
- PR diff: !`gh pr diff 2>/dev/null || echo "ERROR: No PR found. Run this in a repo with an open PR."`
- PR comments: !`gh pr view --comments 2>/dev/null || echo "No comments available"`

# 在指令部分也加入兜底逻辑
If any of the above context shows ERROR, inform the user what went wrong
and suggest how to fix it instead of proceeding.
```

**教训：** `!` 命令在 Claude 看到内容之前执行。如果命令失败，错误输出会**直接混入提示**，可能导致 Claude 产生困惑。始终为 `!` 命令添加错误处理。

> 📖 Docs: [Inject dynamic context](https://docs.anthropic.com/en/docs/claude-code/skills#inject-dynamic-context)

---

## 坑 6: `context: fork` 子代理访问不到主对话的上下文

**场景：** 用 `context: fork` 运行 Skill，期望子代理能看到主对话中讨论过的文件和代码。

**症状：** 子代理表现得好像从头开始，完全不知道之前讨论的内容。

**根因：** `context: fork` 的设计就是创建**隔离上下文**。子代理不继承主对话历史，只接收 SKILL.md 的内容作为初始提示。

**解法：**

```markdown
# ❌ 错误期望 — 以为子代理能看到之前的对话
---
context: fork
---
Continue the analysis we discussed earlier...

# ✅ 正确做法 — 把必要上下文写进 Skill 指令
---
context: fork
---
## Context
- Main files: !`git diff --name-only HEAD~5`
- Current branch: !`git branch --show-current`

## Task
Analyze the files listed above...

# ✅ 或者：不用 fork，在主对话中执行
# (去掉 context: fork，直接使用)
```

**教训：** fork 的目的是**隔离**，不是**继承**。如果需要对话历史，要么不用 fork，要么用 `!` 注入必要上下文。

> 📖 Docs: [Run skills in a subagent](https://docs.anthropic.com/en/docs/claude-code/skills#run-skills-in-a-subagent)

---

## 坑 7: 后台子代理无法交互

**场景：** 把任务放到后台运行（`Ctrl+B`），但子代理遇到需要确认的步骤时卡住了。

**症状：** 后台任务长时间运行或静默失败。

**根因：** 后台子代理的 `AskUserQuestion` 工具调用会失败。子代理不能向用户提问。

**解法：**

```markdown
# ❌ 错误做法 — 在可能需要用户确认的 Skill 上用后台
---
name: deploy
context: fork
---
Deploy to production. Ask user to confirm before proceeding.

# ✅ 正确做法 — 后台 Skill 必须自给自足
---
name: code-scan
context: fork
---
Scan the codebase for security issues.
DO NOT ask for user confirmation.
Report all findings in a summary file: security-report.md

# ✅ 或者：前置权限审批
# 后台子代理启动前会提示需要哪些权限，
# 批准后子代理自动执行，拒绝的操作自动跳过
```

**教训：** 后台 = 全自动。设计后台 Skill 时，所有决策必须能自主完成。

> 📖 Docs: [Run subagents in foreground or background](https://docs.anthropic.com/en/docs/claude-code/sub-agents#run-subagents-in-foreground-or-background)

---

## 坑 8: `allowed-tools` 限制了 Bash 但仍可执行任意命令

**场景：** 设置了 `allowed-tools: Read, Grep, Bash`，以为这样就安全了。

**症状：** Claude 通过 Bash 执行了不期望的操作（如 `rm -rf`）。

**根因：** `allowed-tools` 中写 `Bash` 意味着允许**所有 Bash 命令**。需要用 pattern 进一步限制。

**解法：**

```yaml
# ❌ 危险写法 — Bash 不加限制
allowed-tools: Read, Grep, Bash

# ✅ 安全写法 — 用 pattern 限制 Bash 命令
allowed-tools: Read, Grep, Bash(gh *), Bash(npm test*)

# ✅ 更安全 — 完全不给 Bash，只用只读工具
allowed-tools: Read, Grep, Glob
```

**教训：** `Bash` ≠ 安全。必须用 `Bash(pattern)` 限制可执行的命令模式。

> 📖 Docs: [Restrict tool access](https://docs.anthropic.com/en/docs/claude-code/skills#restrict-tool-access)

---

## 坑 9: SKILL.md 太长导致 token 浪费

**场景：** 把大量参考文档、API 说明、代码示例全部放在 SKILL.md 中。

**症状：** 每次触发 Skill 消耗大量 token，对话可用空间缩小，且某些信息 Claude 并不需要。

**根因：** SKILL.md body 一旦触发就**全部加载**。不像 supporting files 可以按需读取。

**解法：**

```
# ❌ 错误结构 — 全部放在 SKILL.md
SKILL.md (2000 行，包含所有 API 文档、示例、规范)

# ✅ 正确结构 — 最小化 SKILL.md，大内容放 references
SKILL.md (50 行 — 核心逻辑 + 链接)
├── references/
│   ├── api-docs.md        (1000 行)
│   ├── examples.md        (500 行)
│   └── patterns.md        (500 行)
```

**教训：** SKILL.md 应该是**导航员**角色而非**百科全书**。大内容放 references，Claude 需要时自行读取。

> 📖 Docs: [Add supporting files](https://docs.anthropic.com/en/docs/claude-code/skills#add-supporting-files) — "SKILL.md is the overview and navigation"
> 🌐 Web: "Build small, focused micro-skills that can chain together"

---

## 坑 10: Hooks 脚本路径错误导致静默失败

**场景：** 在 SKILL.md 的 hooks 配置中引用了一个脚本，但脚本路径不对。

**症状：** Hook 不执行，没有明显报错，Skill 正常运行但缺少安全检查。

**根因：** Hook 命令中的路径是**相对于项目根目录**的，不是相对于 SKILL.md。

**解法：**

```yaml
# ❌ 错误路径 — 以为相对于 SKILL.md
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"  # 这里 ./ 是项目根目录！

# ✅ 正确路径 — 用 $CLAUDE_PROJECT_DIR 明确
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/security-check.sh"
```

**教训：** Hook 脚本路径用 `$CLAUDE_PROJECT_DIR` 确保正确。始终用绝对路径或项目根目录变量。

> 📖 Docs: [Reference scripts by path](https://docs.anthropic.com/en/docs/claude-code/hooks#reference-scripts-by-path)

---

## 调试清单

遇到 Claude Code Skill 相关问题时，按以下顺序排查：

1. [ ] **Skill 是否被发现？** → 输入 `What skills are available?` 查看列表
2. [ ] **Skill 是否被加载？** → 输入 `/context` 检查上下文
3. [ ] **Description 是否匹配？** → 检查 description 中的关键词是否覆盖用户常用表达
4. [ ] **Frontmatter 语法正确？** → YAML 缩进、字段名拼写
5. [ ] **文件位置正确？** → `.claude/skills/<name>/SKILL.md`（注意 SKILL.md 大写）
6. [ ] **Supporting files 被引用？** → SKILL.md 中是否有 `[链接文本](reference.md)` 格式的引用
7. [ ] **`!` 命令可执行？** → 手动在终端运行 `!` 中的命令确认输出
8. [ ] **Hook 脚本可执行？** → 检查脚本权限（`chmod +x`）和路径
9. [ ] **工具限制合理？** → `allowed-tools` 是否足够且不过度
10. [ ] **上下文预算够？** → Skill 数量是否超过 `SLASH_COMMAND_TOOL_CHAR_BUDGET` 限制
