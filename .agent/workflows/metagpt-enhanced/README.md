# MetaGPT-Enhanced Workflow System

借鉴 MetaGPT 的多角色协作模式，增强开发工作流。

## 核心改进

### 1. 角色系统 (Roles)

每个阶段由特定角色执行，角色有明确的职责和能力。

### 2. 消息传递 (Messages)

阶段间通过结构化消息传递上下文，而不是简单的状态标记。

### 3. 自动继续 (Auto-Continue)

完成一个阶段后自动询问是否继续下一阶段。

### 4. 检查点 (Checkpoints)

每个阶段有明确的验收标准，通过后才能继续。

### 5. 字符串 Phase Key

所有阶段使用字符串 key（如 `backend`、`frontend`），不使用数字编号。

## 文件结构

```
.agent/workflows/metagpt-enhanced/
├── README.md           # 本文件
├── roles.yaml          # 角色定义（8 个角色）
├── messages.yaml       # 消息模板和上下文链
├── checkpoints.yaml    # 检查点定义（验收标准）
└── orchestrator.md     # 编排器指令

.agent/workflows/full-development-steps/
├── state-template.yaml # 状态文件模板
├── step-00-init.md     # 初始化
├── step-01-requirements.md
├── step-02-prd.md
├── step-03-architecture.md
├── step-04-stories.md
├── step-05-database.md
├── step-06-backend.md
├── step-07-frontend.md
├── step-08-testing.md
├── step-09-review.md
└── step-10-deployment.md

.claude/commands/full-dev.md  # Slash command 入口
.agent/workflows/full-dev.md  # Workflow 入口（与 slash command 对齐）
.dev-state.yaml               # 运行时状态文件
```

## Phase Key 顺序

`requirements` → `prd` → `architecture` → `stories` → `database` → `backend` → `frontend` → `testing` → `review` → `deployment`

## 使用方式

```
/full-dev              # 启动/继续工作流
/full-dev auto         # 全自动模式（完成后自动继续）
/full-dev status       # 查看详细状态和消息历史
/full-dev checkpoint   # 运行当前阶段验收检查
/full-dev skip         # 跳过当前阶段
/full-dev goto <key>   # 跳转到指定阶段（使用 phase key）
```
