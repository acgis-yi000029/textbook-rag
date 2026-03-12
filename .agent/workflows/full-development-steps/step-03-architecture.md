# Step 3: 系统架构设计

## 阶段信息

- **阶段**: 3/10 - 系统架构
- **Skill**: `dev-senior_architect`
- **输入**: `docs/requirements/prd.md`
- **产出物**: `docs/architecture/system-architecture.md`

---

## 执行步骤

### 1. 加载上下文

读取并分析：

- `docs/requirements/requirements.md` - 需求背景
- `docs/requirements/prd.md` - 产品需求文档

### 2. 加载 Skill

加载 `dev-senior_architect` skill，获取架构设计专业知识。

### 3. 技术选型

根据需求确定技术栈：

**后端**:

- [ ] 编程语言 (Python/Node.js/Go/Java...)
- [ ] Web 框架 (FastAPI/Express/Gin/Spring...)
- [ ] ORM (SQLAlchemy/Prisma/GORM...)

**前端**:

- [ ] 框架 (React/Vue/Angular/Svelte...)
- [ ] 状态管理 (Redux/Vuex/Zustand...)
- [ ] UI 库 (Ant Design/MUI/Tailwind...)

**数据库**:

- [ ] 主数据库 (PostgreSQL/MySQL/MongoDB...)
- [ ] 缓存 (Redis/Memcached...)
- [ ] 搜索 (Elasticsearch/Meilisearch...)

**基础设施**:

- [ ] 部署平台 (Docker/K8s/Serverless...)
- [ ] CI/CD (GitHub Actions/GitLab CI...)
- [ ] 监控 (Prometheus/Grafana...)

### 4. 系统设计

#### 4.1 整体架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   API GW    │────▶│   Services  │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┤
                    ▼                          ▼
              ┌──────────┐              ┌──────────┐
              │ Database │              │  Cache   │
              └──────────┘              └──────────┘
```

#### 4.2 目录结构

```
project/
├── docs/               # 文档
├── src/
│   ├── backend/        # 后端代码
│   │   ├── models/     # 数据模型
│   │   ├── routers/    # API 路由
│   │   ├── services/   # 业务逻辑
│   │   ├── schemas/    # 数据验证
│   │   └── utils/      # 工具函数
│   └── frontend/       # 前端代码
│       ├── components/ # 组件
│       ├── pages/      # 页面
│       ├── hooks/      # Hooks
│       └── utils/      # 工具函数
├── tests/              # 测试
├── scripts/            # 脚本
└── deploy/             # 部署配置
```

#### 4.3 API 设计

定义 RESTful API 或 GraphQL schema：

```yaml
# API 示例
/api/v1:
  /users:
    GET: 获取用户列表
    POST: 创建用户
    /{id}:
      GET: 获取用户详情
      PUT: 更新用户
      DELETE: 删除用户
```

### 5. 生成文档

创建 `docs/architecture/system-architecture.md`：

```markdown
# {项目名称} - 系统架构文档

## 1. 架构概述

### 1.1 设计原则

### 1.2 架构图

## 2. 技术选型

### 2.1 后端技术栈

### 2.2 前端技术栈

### 2.3 数据库

### 2.4 基础设施

## 3. 系统组件

### 3.1 组件列表

### 3.2 组件交互

## 4. 数据架构

### 4.1 数据模型概览

### 4.2 数据流

## 5. API 设计

### 5.1 API 规范

### 5.2 API 列表

## 6. 安全架构

### 6.1 认证

### 6.2 授权

### 6.3 数据安全

## 7. 部署架构

### 7.1 环境

### 7.2 部署流程

## 8. 扩展性考虑
```

### 6. 架构评审

展示架构文档，请用户确认：

```
[C] 确认 - 架构合理，继续下一阶段
[E] 编辑 - 修改架构
[D] 讨论 - 需要进一步讨论某个决策
```

---

## 完成检查

- [ ] `docs/architecture/system-architecture.md` 已创建
- [ ] 技术选型已确定
- [ ] API 设计已完成
- [ ] 用户已确认

## 状态更新

```yaml
phases:
  architecture:
    status: completed
    completed_at: { current_time }
```

## 下一步

→ 进入 `step-04-stories.md`
