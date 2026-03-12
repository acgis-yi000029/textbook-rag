# Step 10: 部署

## 阶段信息

- **阶段**: `deployment` - 部署
- **Skill**: `dev-senior_devops`
- **输入**: `backend/`, `frontend/`, `docs/architecture/system-architecture.md`
- **产出物**: 部署配置、运行服务

---

## 执行步骤

### 1. 加载上下文

读取并分析：

- `docs/architecture/system-architecture.md` - 部署架构
- `docs/review-report.md` - 确认已通过审查
- `render.yaml` - 现有部署配置

### 2. 加载 Skill

加载 `dev-senior_devops` skill，获取 DevOps 专业知识。

### 3. 🎯 模板和脚本查找 (Template-First)

**在创建部署配置之前，先检查现有资源：**

#### 3.1 查找 DevOps 模板

检查 `.agent/templates/devops/` 目录，可用模板：

| 模板文件                       | 用途                 | 变量 |
| ------------------------------ | -------------------- | ---- |
| `Dockerfile.backend.template`  | 后端 Docker 镜像     | -    |
| `Dockerfile.frontend.template` | 前端 Docker 镜像     | -    |
| `docker-compose.yml.template`  | Docker Compose 编排  | -    |
| `github-ci.yml.template`       | GitHub Actions CI/CD | -    |

#### 3.2 使用脚本

| 脚本           | 命令                                                  | 用途                   |
| -------------- | ----------------------------------------------------- | ---------------------- |
| `env_check.py` | `python .agent/scripts/env_check.py --env production` | 检查生产环境变量       |
| `env_check.py` | `python .agent/scripts/env_check.py --fix`            | 生成 .env.example 文件 |

#### 3.3 如果缺少模板

如果需要的部署配置模板不存在（例如 Kubernetes、Terraform）：

1. 在 `.agent/templates/devops/` 中创建新模板
2. 基于新模板生成实际配置文件

### 4. 部署准备

#### 3.1 环境配置

```
环境列表:
├── development  (本地开发)
├── staging      (测试环境)
└── production   (生产环境)
```

#### 3.2 配置文件检查

- [ ] `.env.example` 存在
- [ ] 敏感信息未提交
- [ ] 环境变量文档完整

### 4. Docker 配置

#### 4.1 后端 Dockerfile

```dockerfile
# Dockerfile.backend
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY backend .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 4.2 前端 Dockerfile

```dockerfile
# Dockerfile.frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 4.3 Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - db
      - redis

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 5. CI/CD 配置

#### 5.1 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests
        run: pytest --cov

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker images
        run: docker compose build

      - name: Push to registry
        run: |
          docker tag app:latest ${{ secrets.REGISTRY }}/app:${{ github.sha }}
          docker push ${{ secrets.REGISTRY }}/app:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          # 部署脚本
          echo "Deploying to production..."
```

### 6. 数据库迁移

```bash
# 运行迁移
alembic upgrade head

# 验证迁移
alembic current
```

### 7. 部署检查清单

#### 7.1 部署前

- [ ] 代码审查通过
- [ ] 所有测试通过
- [ ] 环境变量已配置
- [ ] 数据库备份完成
- [ ] 回滚方案准备

#### 7.2 部署中

- [ ] 构建镜像成功
- [ ] 推送镜像成功
- [ ] 数据库迁移成功
- [ ] 服务启动成功

#### 7.3 部署后

- [ ] 健康检查通过
- [ ] 本地手动验证
- [ ] 日志正常
- [ ] 监控指标正常
- [ ] 性能基线正常

### 8. 健康检查

```bash
# API 健康检查
curl -f http://localhost:8000/health || exit 1

# 数据库连接检查
curl -f http://localhost:8000/health/db || exit 1

# Redis 连接检查
curl -f http://localhost:8000/health/redis || exit 1
```

### 9. 监控配置

#### 9.1 日志配置

```python
# logging.conf
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)
```

#### 9.2 指标收集

```python
# metrics.py
from prometheus_client import Counter, Histogram

REQUEST_COUNT = Counter('request_count', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('request_latency_seconds', 'Request latency', ['method', 'endpoint'])
```

### 10. 回滚方案

```bash
# 回滚到上一版本
docker compose down
docker tag app:previous app:latest
docker compose up -d

# 回滚数据库
alembic downgrade -1
```

### 11. 部署文档

生成 `docs/deployment.md`：

````markdown
# 部署文档

## 环境要求

- Docker 24+
- Docker Compose 2+
- PostgreSQL 15+
- Redis 7+

## 快速部署

```bash
# 克隆仓库
git clone <repo>
cd <project>

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动服务
docker compose up -d

# 运行迁移
docker compose exec backend alembic upgrade head

# 检查状态
docker compose ps
```
````

## 环境变量

| 变量         | 说明       | 示例             |
| ------------ | ---------- | ---------------- |
| DATABASE_URL | 数据库连接 | postgresql://... |
| REDIS_URL    | Redis 连接 | redis://...      |
| SECRET_KEY   | 密钥       | xxx              |

## 常用命令

```bash
# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down
```

```

### 12. 部署确认

```

部署状态:
✓ 镜像构建成功
✓ 服务启动成功
✓ 健康检查通过
✓ 本地手动验证通过

[C] 确认 - 部署完成
[R] 回滚 - 回滚到上一版本
[L] 日志 - 查看日志

````

---

## 完成检查

- [ ] Docker 配置完成
- [ ] CI/CD 配置完成
- [ ] 服务成功启动
- [ ] 健康检查通过
- [ ] 监控配置完成
- [ ] 部署文档完成

## 状态更新

```yaml
phases:
  deployment:
    status: completed
    completed_at: {current_time}
    environment: production
    version: {version}
    url: https://app.example.com
````

---

## 🎉 工作流完成

恭喜！完整开发流程已完成：

```
✓ Phase 1:  需求分析
✓ Phase 2:  产品需求文档
✓ Phase 3:  UX 设计
✓ Phase 4:  系统架构
✓ Phase 5:  任务分解
✓ Phase 6:  数据库设计
✓ Phase 7:  后端开发
✓ Phase 8:  前端开发
✓ Phase 9:  测试
✓ Phase 10: 代码审查
✓ Phase 11: 部署

总用时: {total_time}
```

### 产出物清单

```
docs/
├── requirements/           # 需求文档
│   ├── requirements.md
│   └── prd.md
├── design/                # UX 设计
├── architecture/           # 架构文档
│   └── system-architecture.md
├── sprints/               # Sprint 计划
├── plans/                 # US 实施方案
├── codemaps/              # 代码地图
├── test-report.md         # 测试报告
├── review-report.md       # 审查报告
└── deployment.md          # 部署文档

backend/                   # 后端代码
├── app/
└── tests/

frontend/                  # 前端代码
└── src/

render.yaml                # 部署配置
```
