# MetaGPT-Enhanced Orchestrator

这是增强版工作流的核心编排器。借鉴 MetaGPT 的多角色协作模式。

## 执行模式

### 标准模式

每完成一个阶段，询问用户是否继续。

### 自动模式 (`/full-dev auto`)

通过验收检查后自动继续下一阶段，直到遇到需要人工确认的阶段。

## 阶段定义

所有阶段使用 **字符串 key**，不使用数字编号。

**Phase key 顺序**: `requirements` → `prd` → `architecture` → `stories` → `database` → `backend` → `frontend` → `testing` → `review` → `deployment`

## 编排流程

### 1. 初始化

```
读取 .dev-state.yaml          → 当前阶段 (current_phase key)
读取 roles.yaml               → 当前阶段角色
读取 messages.yaml             → 上下文模板
读取 checkpoints.yaml          → 验收标准
```

### 2. 角色激活

根据当前阶段，激活对应角色：

```yaml
当前阶段: backend
激活角色: David (Senior Backend Engineer)
角色目标: Implement robust backend services
角色约束: Follow TDD; Write clean, documented code
```

**角色 Prompt 模板**:

```
You are {role.name}, a {role.profile}.
Your goal is: {role.goal}
Constraints: {role.constraints}

## Context from Previous Phases
{context_from_previous_phases}

## Sprint Plan Reference
Read docs/sprints/Sprint_Plan_North_Link.md
Read docs/plans/US-xxx-plan.md for implementation details

## Your Task
{current_task}

## Expected Outputs
{expected_outputs}

## Acceptance Criteria
{checkpoints}
```

### 3. 上下文注入

从之前阶段收集相关上下文：

```
获取已完成阶段列表
对于每个已完成阶段:
    读取该阶段的输出文件路径 (从 .dev-state.yaml)
    读取文件内容作为上下文
```

**项目实际路径映射**:
| Phase Key | 输出路径 |
|-----------|---------|
| requirements | `docs/requirements/master_prd.md` |
| prd | `docs/requirements/master_prd.md` |
| architecture | `docs/architecture/system-architecture.md` |
| stories | `docs/sprints/Sprint_Plan_North_Link.md` |
| database | `docs/codemaps/database.md` |
| backend | `backend/app/` |
| frontend | `frontend/src/` |
| testing | `backend/tests/`, `docs/test-report.md` |
| review | `docs/review-report.md` |

### 4. 执行阶段

```
1. 显示角色信息和上下文
2. 读取对应的 step 文件指令 (.agent/workflows/full-development-steps/)
3. 🎯 Template-First: 查找模板和脚本
   - 检查 .agent/templates/ 中是否有匹配的模板
   - 检查 .agent/scripts/ 中是否有可用脚本
   - 新功能模块: 运行 scaffold.py feature --name <name>
   - 如果缺少模板: 先创建模板，再生成代码
4. 基于模板 + step 文件指令执行任务
5. 生成输出消息
6. 运行验收检查
```

### 5. 验收检查

```
读取 checkpoints.yaml 中对应阶段的验收条件
运行所有 validations:
  - file_exists: 检查文件是否存在
  - file_not_empty: 检查文件是否非空
  - command_success: 运行命令检查是否成功
  - no_critical_issues: 检查是否无严重问题
汇总结果并显示
```

**实际使用的检查命令**:
| Phase | 命令 |
|-------|------|
| backend | `cd backend && uv run ruff check app/` |
| backend | `cd backend && uv run pytest --tb=short -q` |
| frontend | `cd frontend && npx tsc --noEmit` |
| frontend | `cd frontend && npm run lint` |

### 6. 消息传递

完成阶段后，生成传递给下一阶段的消息：

```markdown
## Backend Implementation Complete

**From**: David (Backend Engineer)
**To**: Eve (Frontend Engineer) / Frank (QA Engineer)

### Summary

Implemented Sprint 4-5 backend features.

### Implemented Features

- GET /api/research/query - Natural language query endpoint
- POST /api/evaluation/run - LLM evaluation endpoint
- GET /api/dashboard/stats - Dashboard statistics

### Test Coverage

- Unit tests: backend/tests/
- Run: cd backend && uv run pytest

### Next Steps

Please continue with frontend tasks / run comprehensive tests.
```

### 7. 状态更新

```yaml
# .dev-state.yaml 更新
phases:
  backend:
    status: completed
    completed_at: "2026-02-11T15:30:00"
    output: "backend/app/"

current_phase: frontend # 使用 string key，不用数字
```

### 8. 继续或暂停

```
如果 auto_continue == true 且 所有检查通过:
    自动进入下一阶段
否则:
    显示检查结果
    询问: "Continue to next phase? (yes/no)"
```

## 状态显示格式

```
╔═══════════════════════════════════════════════════════════════╗
║                    Development Progress                      ║
╠═══════════════════════════════════════════════════════════════╣
║  Phase Key     │ Name         │ Status      │ Role           ║
╠════════════════╪══════════════╪═════════════╪════════════════╣
║  requirements  │ 需求分析     │ ✅ Complete │ Alice (PM)     ║
║  prd           │ 产品需求文档 │ ✅ Complete │ Alice (PM)     ║
║  architecture  │ 系统架构     │ ✅ Complete │ Bob (Arch)     ║
║  stories       │ 任务分解     │ ✅ Complete │ Charlie (Lead) ║
║  database      │ 数据库设计   │ ✅ Complete │ Bob (Arch)     ║
║  backend       │ 后端开发     │ 🔄 Active  │ David (BE)     ║
║  frontend      │ 前端开发     │ 🔄 Active  │ Eve (FE)       ║
║  testing       │ 测试         │ ⏳ Pending  │ Frank (QA)     ║
║  review        │ 代码审查     │ ⏳ Pending  │ Grace (Rev)    ║
║  deployment    │ 部署         │ ⏳ Pending  │ Henry (DevOps) ║
╚═══════════════════════════════════════════════════════════════╝

Current Role: David (Backend Engineer)
Goal: Implement robust backend services

Latest Message:
  From: Charlie (Tech Lead) → David (Backend)
  "Sprint Plan complete. Begin implementation."
```

## 命令参考

| 命令                   | 描述                       |
| ---------------------- | -------------------------- |
| `/full-dev`            | 启动/继续工作流            |
| `/full-dev auto`       | 自动模式                   |
| `/full-dev status`     | 显示详细状态               |
| `/full-dev context`    | 显示当前上下文             |
| `/full-dev messages`   | 显示消息历史               |
| `/full-dev checkpoint` | 运行当前阶段检查           |
| `/full-dev skip`       | 跳过当前阶段               |
| `/full-dev goto <key>` | 跳转到指定阶段 (phase key) |
