---
topic: antigravity_workflow
dimension: code
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📖 Docs: [Antigravity Official](https://antigravity.google/docs) — Workflows"
  - "📖 Docs: [Antigravity Codelabs](https://atamel.dev) — Rules & Workflows"
  - "💻 Source: 工作区 .agent/workflows/ 实例 (9 workflows)"
expiry: 3m
status: current
---

# Antigravity Workflow 代码参考

> 所有模板均基于工作区中已验证的 Workflow 提炼

---

## 模板 1：最简 Workflow（工具类）

> 💻 Source: 提炼自 `scrape-content.md`

```markdown
---
description: 一句话描述功能
---

1. 第一步

```bash
command-1
```

2. 第二步

```bash
command-2
```

3. 第三步

```bash
command-3
```
```

**文件大小：** ~500 字节
**适用于：** 简单的 3-5 步工具脚本

---

## 模板 2：单一用途 Workflow（探索类）

> 💻 Source: 提炼自 `explore-repo.md`

```markdown
---
description: 探索参考仓库
---

# Explore Repository Workflow

## Available Repositories

| Repository | Description |
| ---------- | ----------- |
| `repo-1`   | 描述 1      |
| `repo-2`   | 描述 2      |

## Steps

1. List repository structure:
   ```
   find_by_name in .github/[repo-name]/
   ```

2. Read README:
   ```
   view_file .github/[repo-name]/README.md
   ```

3. Find key configuration files:
   - Look for specific files
   - Look for specific directories

4. Summarize findings in format:
   ```markdown
   ## 📂 Repository: [name]
   **Purpose:** Brief description
   **Key Files:**
   - `path` - Description
   **💡 Best Practice:** Key takeaway
   ```
```

---

## 模板 3：标准 Phase Workflow（学习类）

> 💻 Source: 提炼自 `complete-lab.md`

```markdown
---
description: Complete course lab from start to submission
---

# 📚 [Workflow 名称]

## 🎯 使用方式

```
/command-name [课程] [编号]

示例:
/command-name ml lab2
```

## 📋 完整流程概览

```
┌──────────────────────────────────────────┐
│ Phase 1: [名称]                            │
│   ↓ [skill 列表]                           │
├──────────────────────────────────────────┤
│ Phase 2: [名称]                            │
│   ↓ [skill 列表]                           │
├──────────────────────────────────────────┤
│ Phase 3: [名称]                            │
│   ↓ [skill 列表]                           │
└──────────────────────────────────────────┘
```

---

## Phase 1: [名称] [emoji]

**Skill**: `skill-name`

### 步骤

1. 步骤描述
2. 步骤描述

### 命令

// turbo

```bash
command
```

### 输出

- `output/file/path` (描述)

### ✅ 验证检查点

- [ ] 检查项 1
- [ ] 检查项 2

---

## Phase 2: ...

(同上结构重复)

---

## 🗂️ 目录结构示例

```
output/
└── course/
    ├── file1.py
    └── file2.ipynb
```

---

## 💡 快捷子命令

| 命令 | 说明 | 从哪个 Phase 开始 |
|------|------|-------------------|
| `/cmd course lab` | 完整流程 | Phase 1 |
| `/cmd course lab --from=code` | 从代码开始 | Phase 3 |
| `/cmd course lab --check` | 只检查 | 最后 Phase |

---

## 📊 支持的课程

| 课程代码 | 课程名称 | 对应 Skill |
|----------|----------|------------|
| `ml` | Machine Learning | `ai_learning-ml` |

---

## 🚨 注意事项

1. 注意事项 1
2. 注意事项 2
```

---

## 模板 4：知识生成 Workflow（含来源引证）

> 💻 Source: 提炼自 `generate-knowledge-map.md`

```markdown
---
description: 生成 [类型] 文档
---

# 🧠 [Workflow 名称]

## 🔗 来源引证规则

> ⚠️ 所有生成内容必须标注来源

| 来源类型 | 格式 | 示例 |
|----------|------|------|
| 官方文档 | `📖 Docs: [名](URL)` | ... |
| 教科书   | `📚 Book: 作者, 《书》` | ... |
| 源码     | `💻 Source: [仓库](URL)` | ... |

## 🔄 新鲜度追踪

每个文件的元数据头（必须有）:

```yaml
---
topic: subject
dimension: tutorial
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "来源 1"
expiry: 6m
status: current
---
```

## 📋 维度结构与生成顺序

Phase 1 → Phase 2 → ... → Phase N

## Phase 0: 输入探测

(自动探测可用素材)

## Phase 1-N: 各维度生成

(按结构生成各个文件)
```

---

## 模板 5：多角色 Workflow（开发类）

> 💻 Source: 提炼自 `bmad-quick-flow/` 目录结构

```markdown
---
description: 快速开发流程（多角色协作）
---

# 🚀 Quick Development Flow

## 角色分配

| 角色 | Agent 文件 | 职责 |
|------|-----------|------|
| PM | pm.agent.yaml | 需求分析 |
| Architect | architect.agent.yaml | 架构设计 |
| Dev | dev.agent.yaml | 代码实现 |

## Phase 1: 需求分析 (PM)

按 pm.agent.yaml 角色执行...

## Phase 2: 架构设计 (Architect)

按 architect.agent.yaml 角色执行...

## Phase 3: 代码实现 (Dev)

按 dev.agent.yaml 角色执行...
```

---

## API / 配置速查

### 所有 Frontmatter 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `description` | string | ✅ | Workflow 的一句话描述 |

> 🧪 经验: 目前 Antigravity Workflow 的 frontmatter 只支持 `description`，远比 Claude Code Skill 简单

### Workflow 查找路径

按优先级：
1. `.agent/workflows/`
2. `.agents/workflows/`
3. `_agent/workflows/`
4. `_agents/workflows/`

### 特殊注解

| 注解 | 位置 | 作用 |
|------|------|------|
| `// turbo` | 步骤上方一行 | 该步骤的 `run_command` 自动执行 |
| `// turbo-all` | 文件中任意位置 | 所有 `run_command` 自动执行 |
