# Step 5: 数据库设计

## 阶段信息

- **阶段**: 5/10 - 数据库设计
- **Skill**: `dev-senior_data_engineer`
- **输入**: `docs/architecture/system-architecture.md`, `docs/sprints/sprint-plan.md`
- **产出物**: `docs/codemaps/database.md`, migration 文件

---

## 执行步骤

### 1. 加载上下文

读取并分析：

- `docs/architecture/system-architecture.md` - 数据库类型、技术选型
- `docs/sprints/sprint-plan.md` - 数据相关 Story

### 2. 加载 Skill

加载 `dev-senior_data_engineer` skill，获取数据库设计专业知识。

### 3. 实体识别

从需求中识别核心实体：

```
实体列表：
├── User (用户)
├── Role (角色)
├── Permission (权限)
├── Order (订单)
├── OrderItem (订单项)
├── Product (产品)
└── ...
```

### 4. ER 图设计

设计实体关系：

```
┌─────────┐       ┌─────────┐       ┌─────────┐
│  User   │──1:N──│  Order  │──1:N──│OrderItem│
└─────────┘       └─────────┘       └─────────┘
     │                                    │
     │ N:M                                │ N:1
     ▼                                    ▼
┌─────────┐                         ┌─────────┐
│  Role   │                         │ Product │
└─────────┘                         └─────────┘
```

### 5. 表结构设计

为每个实体设计表结构：

```sql
-- users 表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### 6. 命名规范检查

| 规则   | 说明         | 示例                       |
| ------ | ------------ | -------------------------- |
| 表名   | 小写复数     | `users`, `orders`          |
| 字段名 | snake_case   | `created_at`, `user_id`    |
| 主键   | `id`         | `id`                       |
| 外键   | `{table}_id` | `user_id`, `order_id`      |
| 时间戳 | `_at` 后缀   | `created_at`, `deleted_at` |
| 布尔值 | `is_` 前缀   | `is_active`, `is_deleted`  |

### 7. 索引设计

```sql
-- 主键索引（自动）
-- 唯一索引
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- 查询索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 组合索引
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
```

### 8. 生成 Migration

创建 migration 文件：

```
migrations/
├── 001_create_users.sql
├── 002_create_roles.sql
├── 003_create_user_roles.sql
├── 004_create_products.sql
├── 005_create_orders.sql
└── 006_create_order_items.sql
```

**Migration 格式**:

```sql
-- migrations/001_create_users.sql
-- Description: Create users table
-- Author: {author}
-- Date: {date}

-- Up
CREATE TABLE users (
    ...
);

-- Down
DROP TABLE IF EXISTS users;
```

### 9. 检查脚本

运行数据库检查：

```bash
# 命名规范检查
python scripts/check-db-naming.py

# 表结构检查
python scripts/check-db-schema.py

# 索引检查
python scripts/check-db-indexes.py

# 外键检查
python scripts/check-db-foreign-keys.py
```

检查项：

- [ ] 表名命名规范
- [ ] 字段命名规范
- [ ] 必要索引存在
- [ ] 外键关系正确
- [ ] 无冗余字段

### 10. 生成文档

创建 `docs/codemaps/database.md`：

```markdown
# {项目名称} - 数据库设计文档

## 1. 概述

### 1.1 数据库类型

### 1.2 字符集

### 1.3 命名规范

## 2. ER 图

## 3. 表结构

### 3.1 users 表

| 字段  | 类型         | 约束             | 说明 |
| ----- | ------------ | ---------------- | ---- |
| id    | SERIAL       | PK               | 主键 |
| email | VARCHAR(255) | NOT NULL, UNIQUE | 邮箱 |
| ...   | ...          | ...              | ...  |

### 3.2 orders 表

...

## 4. 索引设计

### 4.1 索引列表

### 4.2 索引策略

## 5. 数据字典

### 5.1 枚举值

### 5.2 状态定义

## 6. Migration 记录

| 版本 | 文件             | 描述       | 执行时间 |
| ---- | ---------------- | ---------- | -------- |
| 001  | create_users.sql | 创建用户表 | -        |
| ...  | ...              | ...        | ...      |

## 7. 性能考虑

### 7.1 分区策略

### 7.2 归档策略
```

### 11. 用户确认

```
[C] 确认 - 数据库设计完成，继续下一阶段
[E] 编辑 - 修改表结构
[A] 添加 - 添加新表
[I] 索引 - 调整索引
```

---

## 完成检查

- [ ] `docs/codemaps/database.md` 已创建
- [ ] 所有实体有对应表
- [ ] Migration 文件已生成
- [ ] 命名规范检查通过
- [ ] 索引设计合理
- [ ] 用户已确认

## 状态更新

```yaml
phases:
  database:
    status: completed
    completed_at: { current_time }
    tables_created: { n }
    migrations_generated: { n }
```

## 下一步

→ 进入 `step-06-backend.md`
