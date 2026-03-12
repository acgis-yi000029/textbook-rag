---
topic: antigravity_workflow
dimension: usage
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📖 Docs: [Antigravity Official](https://antigravity.google/docs) — Workflows"
  - "📖 Docs: [Antigravity Codelabs](https://atamel.dev) — Rules & Workflows"
  - "💻 Source: 工作区 .agent/workflows/ 实例 (9 workflows)"
expiry: 3m
status: current
---

# Antigravity Workflow 实战用法

> **本文定位：** 面向"我想现在就用起来"的读者。包含现有 Workflow 清单和创建新 Workflow 的操作步骤。

---

## 场景 1：使用现有 Workflow

### 当前工作区已有 Workflow 清单

| 命令 | 用途 | 复杂度 | Phase 数 |
|------|------|--------|---------|
| `/complete-lab [课程] [编号]` | 完成课程 Lab（抓取→转换→理解→开发→验证→文档→检查→提交） | ★★★★ | 8 |
| `/complete-assignment [课程] [编号]` | 完成课程 Assignment（含环境搭建、训练、评估） | ★★★★★ | 8 |
| `/complete-assignment-rl [课程] [编号]` | RL 课程专用 Assignment | ★★★★★ | 8 |
| `/complete-lab-rl [课程] [编号]` | RL 课程专用 Lab | ★★★ | 6 |
| `/generate-knowledge-map [领域] [主题]` | 生成 8 维知识库| ★★★★ | 5 |
| `/generate-study-material [课程]` | 生成交互式学习材料 | ★★★★★ | 多 |
| `/midterm-review [课程]` | 期中复习材料 | ★★★★ | 6 |
| `/scrape-content` | 从 Brightspace 下载课程材料 | ★ | 3 步 |
| `/explore-repo` | 探索 .github/ 下的参考仓库 | ★ | 4 步 |

### 使用示例

```
# 完整流程
/complete-lab ml lab2

# 从代码开发阶段开始（跳过抓取和转换）
/complete-lab ml lab2 --from=code

# 只运行提交前检查
/complete-lab ml lab2 --check

# 生成知识地图
/generate-knowledge-map ai-tools antigravity_workflow

# 期中复习
/midterm-review mv --weeks=1-5
```

---

## 场景 2：创建新的简单 Workflow

> 适用于：3-5 步的工具类/快速任务

### 步骤

```
Step 1: 创建 Workflow 文件
  位置: .agent/workflows/my-workflow.md

Step 2: 写 frontmatter
  ---
  description: 一句话描述功能
  ---

Step 3: 写步骤
  1. 步骤描述
  2. 命令...

Step 4: 测试
  > /my-workflow
```

### 模板

```markdown
---
description: 检查所有 Python 文件的代码质量
---

# 🔍 代码质量检查 (Code Quality Check)

## 🎯 使用方式

/code-quality [目录]

## 步骤

1. 运行 linter

// turbo

```bash
uv run ruff check $ARGUMENTS
```

2. 运行类型检查

// turbo

```bash
uv run mypy $ARGUMENTS
```

3. 报告结果

整理以上检查结果，按严重程度排序。
```

---

## 场景 3：创建多 Phase 的复杂 Workflow

> 适用于：学习/开发类，多阶段编排

### 模板结构

```markdown
---
description: [功能描述]
---

# 📋 [Workflow 名称]

## 🎯 使用方式

/workflow-name [参数]

## 📋 完整流程概览

┌─────────────────────────────────────────────┐
│ Phase 1: [阶段名称]                            │
│   ↓ [使用的 Skill]                             │
├─────────────────────────────────────────────┤
│ Phase 2: [阶段名称]                            │
│   ↓ [使用的 Skill]                             │
├─────────────────────────────────────────────┤
│ Phase 3: [阶段名称]                            │
│   ↓ [使用的 Skill]                             │
└─────────────────────────────────────────────┘

---

## Phase 1: [名称] [emoji]

**Skill**: `skill-name`

### 步骤

1. ...
2. ...

### 命令

// turbo (可选)

```bash
具体命令
```

### ✅ 验证检查点

- [ ] 检查项 1
- [ ] 检查项 2

---

## Phase 2: ...

(重复上面的结构)

---

## 💡 快捷子命令

| 命令 | 说明 | 从哪个 Phase 开始 |
|------|------|-------------------|
| `/workflow-name` | 完整流程 | Phase 1 |
| `/workflow-name --from=phase2` | 从 Phase 2 开始 | Phase 2 |

---

## 🚨 注意事项

1. ...
2. ...
```

---

## 场景 4：给 Workflow 添加 // turbo 注解

### 单步自动

```markdown
// turbo
```bash
npm run build
```
```

只有紧跟 `// turbo` 下方的那一个命令会自动执行。

### 全局自动

在文件**任意位置**添加：

```markdown
// turbo-all
```

整个 Workflow 的所有 `run_command` 步骤都会自动执行。

### 注意

- `// turbo` 只影响 `run_command`（Bash 命令），不影响文件编辑
- 有副作用的操作（部署、删除、推送）**不应该**加 `// turbo`
- `// turbo-all` 请谨慎使用——所有命令都会自动执行

---

## 场景 5：在 Workflow 中调用 Skill

### 标准写法

```markdown
## Phase N: [名称]

**Skill**: `learning-code_generation`

### 命令

```
读取 skill: .shared/skills/learning-code_generation/SKILL.md
根据作业要求生成 Python 代码
```
```

### Agent 的实际行为

当 Agent 看到"读取 skill"时，会：

1. 用 `view_file` 读取指定 Skill 的 SKILL.md
2. 按 SKILL.md 中的指令执行任务
3. 使用 Skill 要求的格式和规范

### 多 Skill 组合

```markdown
## Phase 4: 代码开发

**Skills**: `learning-code_generation`, `dev-code_comment`, `learning-notebook_conversion`

### 命令

// turbo

```
读取 skill: .shared/skills/learning-code_generation/SKILL.md
读取 skill: .shared/skills/dev-code_comment/SKILL.md
生成 Python 代码 (courses/ml/code/lab2/lab2_svm.py)
读取 skill: .shared/skills/learning-notebook_conversion/SKILL.md
转换为 Notebook (courses/ml/code/lab2/lab2_svm.ipynb)
```
```

---

## 场景 6：维护现有 Workflow

### 添加新课程支持

在 Workflow 底部的"支持的课程"表中添加：

```markdown
| `new`  | New Course | `ai_learning-new` |
```

### 修改流程步骤

直接编辑对应 Phase 的内容。注意：
- 保持 Phase 编号连续
- 更新流程概览图
- 更新子命令表

### 添加新 Phase

在合适位置插入新 Phase，更新：
1. 流程概览图（ASCII 框图）
2. 子命令表
3. 验证检查点

---

## 速查表

### Workflow 文件位置

```
.agent/workflows/           ← 主目录
.agents/workflows/           ← 也支持
_agent/workflows/            ← 也支持
_agents/workflows/           ← 也支持
```

### 常用操作

| 操作 | 命令 |
|------|------|
| 查看所有 Workflow | `ls .agent/workflows/` |
| 使用 Workflow | `/workflow-name [参数]` |
| 从中间阶段继续 | `/workflow-name [参数] --from=<phase>` |
| 只运行检查 | `/workflow-name [参数] --check` |
| 创建新 Workflow | 在 `.agent/workflows/` 下创建 `.md` 文件 |

### Workflow 命名规范

| 风格 | 示例 | 用途 |
|------|------|------|
| `verb-noun` | `complete-lab`, `generate-knowledge-map` | 动作类 |
| `verb-noun-qualifier` | `complete-assignment-rl` | 特化版 |
| `noun` | `scrape-content` | 工具类 |
