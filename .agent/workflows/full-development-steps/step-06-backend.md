# Step 6: 后端开发

## 阶段信息

- **阶段**: `backend` - 后端开发
- **Skill**: `dev-senior_backend`
- **输入**: Sprint Plan, US Plans, `docs/codemaps/database.md`
- **产出物**: `docs/codemaps/backend.md`, `backend/app/`

---

## 执行步骤

### 1. 加载上下文

读取并分析：

- `docs/architecture/system-architecture.md` - 技术选型、目录结构
- `docs/codemaps/database.md` - 数据库设计
- `docs/sprints/sprint-plan.md` - Sprint 任务列表
- `docs/plans/US-xxx-plan.md` - 详细的 User Story 实施方案 (优先参考)

### 1.1 先产出 Backend Codemap

在修改任何后端代码之前，先创建或更新 `docs/codemaps/backend.md`，明确：

- Story 到模块的映射
- `backend/app/` 内的目标目录和文件边界
- 现有文件与新增文件的职责拆分
- 关键数据流和服务调用关系
- 哪些模块先重构、哪些模块直接扩展

只有在 codemap 明确之后，才进入实际编码。

### 2. 加载 Skill

加载 `dev-senior_backend` skill，获取后端开发专业知识。

### 3. 🎯 模板和脚本查找 (Template-First)

**在写任何代码之前，并且在 backend codemap 已完成之后，先执行以下步骤：**

#### 3.1 查找现有模板

检查 `.agent/templates/backend/` 目录，可用模板：

| 模板文件                 | 用途              | 变量                                  |
| ------------------------ | ----------------- | ------------------------------------- |
| `routes.py.template`     | FastAPI CRUD 路由 | `{{feature_name}}`, `{{FeatureName}}` |
| `service.py.template`    | 服务层业务逻辑    | `{{feature_name}}`, `{{FeatureName}}` |
| `schemas.py.template`    | Pydantic 模型     | `{{feature_name}}`, `{{FeatureName}}` |
| `models.py.template`     | SQLAlchemy Model  | `{{feature_name}}`, `{{FeatureName}}` |
| `middleware.py.template` | 中间件            | `{{feature_name}}`                    |
| `streaming.py.template`  | SSE 流式响应      | `{{feature_name}}`                    |
| `prompts.py.template`    | LLM Prompt 管理   | `{{feature_name}}`                    |
| `cache.py.template`      | 缓存封装          | `{{feature_name}}`                    |
| `azure/*.template`       | Azure 服务        | `{{feature_name}}`                    |

#### 3.2 使用脚手架生成新模块

对于每个新的功能模块，优先使用脚手架：

```bash
# 自动生成 routes.py, service.py, schemas.py, __init__.py, + 测试
python .agent/scripts/scaffold.py feature --name <feature_name> --type backend
```

这将生成：

- `backend/app/<feature_name>/routes.py` - 基于模板的 CRUD 路由
- `backend/app/<feature_name>/service.py` - 服务层骨架
- `backend/app/<feature_name>/schemas.py` - Pydantic 模型
- `backend/app/<feature_name>/__init__.py`
- `backend/tests/<feature_name>/test_routes.py` - 测试骨架

#### 3.3 如果缺少模板

如果当前任务需要的模板类型不存在（例如 WebSocket handler、Background worker 等）：

1. 在 `.agent/templates/backend/` 中创建新模板文件
2. 使用 `{{feature_name}}` 和 `{{FeatureName}}` 变量
3. 基于新模板生成实际代码

### 4. 任务排序

```
1. [BE-001] 数据库 Model 层
2. [BE-002] 基础 CRUD Service
3. [BE-003] API Router
4. [BE-004] 认证授权
5. [BE-005] 业务逻辑
...
```

### 4. 开发循环

对于每个 Story：

```
┌─────────────────────────────────────────────┐
│  Story: {story_id} - {story_title}          │
├─────────────────────────────────────────────┤
│  1. 阅读 docs/plans/US-{id}-plan.md         │
│  2. 分析技术规格和变更清单                  │
│  3. 创建/修改相关文件                       │
│  4. 编写代码                                │
│  5. 运行检查脚本                            │
│  6. 更新 docs/plans/ 中的任务状态           │
│  7. 标记 Story 完成                        │
└─────────────────────────────────────────────┘
```

### 5. 代码规范

#### 5.1 Model 层

```python
# models/user.py
from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    # ...
```

#### 5.2 Schema 层

```python
# schemas/user.py
from pydantic import BaseModel

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True
```

#### 5.3 Service 层

```python
# services/user_service.py
from sqlalchemy.orm import Session
from models.user import User
from schemas.user import UserCreate

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user: UserCreate) -> User:
        # 业务逻辑
        pass

    def get_by_id(self, user_id: int) -> User:
        # 业务逻辑
        pass
```

#### 5.4 Router 层

```python
# routers/user_router.py
from fastapi import APIRouter, Depends
from services.user_service import UserService
from schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, service: UserService = Depends()):
    return service.create(user)
```

### 6. 质量检查

每完成一个模块，运行检查：

```bash
# Ruff 代码检查
cd backend && uv run ruff check app/

# Python 语法检查
cd backend && uv run python -m py_compile app/main.py

# 运行测试
cd backend && uv run pytest --tb=short -q
```

检查项：

- [ ] 命名规范
- [ ] 类型注解
- [ ] 文档字符串
- [ ] 错误处理
- [ ] 安全检查

### 7. Story 完成确认

每个 Story 完成后：

```
[✓] Story BE-001 完成
    - 创建文件: models/user.py
    - 检查结果: 通过
    - 用时: 15 分钟

继续下一个 Story? [Y/n]
```

---

## 完成检查

- [ ] 所有后端 Story 已完成
- [ ] `docs/codemaps/backend.md` 已创建并与实现一致
- [ ] 所有检查脚本通过
- [ ] API 可正常调用
- [ ] 单元测试通过

## 状态更新

```yaml
current_phase: frontend # 或 testing（如果前端并行已完成）

phases:
  backend:
    status: completed
    completed_at: "{current_time}"
    output: "backend/app/"
```

## 下一步

→ 进入 `step-07-frontend.md`（或并行执行）
