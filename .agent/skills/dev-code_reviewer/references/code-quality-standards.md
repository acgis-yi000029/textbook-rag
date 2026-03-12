---
description: Code quality standards and best practices for Python and TypeScript
---

# Code Quality Standards (代码质量标准)

## Core Principles (核心原则)

### 1. Immutability (不可变性) - CRITICAL

**永远创建新对象，永远不要修改现有对象**

#### ❌ 错误：Mutation (修改)

```python
# WRONG - 修改原对象
def update_user(user: dict, name: str) -> dict:
    user['name'] = name  # 修改了原对象！
    return user

# WRONG - 修改列表
def add_item(items: list, item: str) -> list:
    items.append(item)  # 修改了原列表！
    return items
```

```typescript
// WRONG - 修改对象
function updateUser(user: User, name: string): User {
  user.name = name; // 修改了原对象！
  return user;
}

// WRONG - 修改数组
function addItem(items: string[], item: string): string[] {
  items.push(item); // 修改了原数组！
  return items;
}
```

#### ✅ 正确：Immutability (不可变)

```python
# CORRECT - 创建新对象
def update_user(user: dict, name: str) -> dict:
    return {**user, 'name': name}

# CORRECT - 创建新列表
def add_item(items: list, item: str) -> list:
    return [*items, item]

# CORRECT - 使用 dataclass
from dataclasses import dataclass, replace

@dataclass(frozen=True)  # frozen=True 强制不可变
class User:
    name: str
    age: int

def update_user(user: User, name: str) -> User:
    return replace(user, name=name)
```

```typescript
// CORRECT - 创建新对象
function updateUser(user: User, name: string): User {
  return { ...user, name };
}

// CORRECT - 创建新数组
function addItem(items: string[], item: string): string[] {
  return [...items, item];
}

// CORRECT - 使用 Immer
import { produce } from "immer";

const newState = produce(state, (draft) => {
  draft.user.name = "New Name"; // Immer 处理不可变性
});
```

### 2. File Organization (文件组织)

**多个小文件 > 少数大文件**

#### 文件大小指南

- **理想大小**: 200-400 行
- **最大限制**: 800 行
- **超过 800 行**: 必须拆分

#### 组织原则

```
✅ 按功能/领域组织 (推荐)
app/
├── users/
│   ├── models.py
│   ├── service.py
│   ├── routes.py
│   └── schemas.py
├── markets/
│   ├── models.py
│   ├── service.py
│   └── routes.py

❌ 按类型组织 (不推荐)
app/
├── models/
│   ├── user.py
│   ├── market.py
├── services/
│   ├── user_service.py
│   ├── market_service.py
```

### 3. Function Size (函数大小)

**小函数 > 大函数**

- **理想大小**: 10-20 行
- **最大限制**: 50 行
- **超过 50 行**: 必须拆分

### 4. Nesting Depth (嵌套深度)

**最大嵌套深度: 4 层**

使用 Early Return + 提取函数来减少嵌套。

### 5. Error Handling (错误处理)

**始终处理错误，永远不要忽略异常**

### 6. Naming Conventions (命名规范)

#### Python

- 变量和函数: `snake_case`
- 类: `PascalCase`
- 常量: `UPPER_SNAKE_CASE`
- 私有成员: 前缀 `_`

#### TypeScript

- 变量和函数: `camelCase`
- 类和接口: `PascalCase`
- 常量: `UPPER_SNAKE_CASE`
- 私有成员: 前缀 `#`

### 7. No Magic Numbers (无魔法数字)

使用命名常量替代魔法数字。

### 8. No Console.log (无 console.log)

使用日志库替代 console.log。

## Code Quality Checklist (代码质量检查清单)

在标记工作完成之前：

### 可读性

- [ ] 代码易读且命名良好
- [ ] 函数小于 50 行
- [ ] 文件小于 800 行
- [ ] 嵌套深度不超过 4 层
- [ ] 无魔法数字（使用命名常量）

### 正确性

- [ ] 适当的错误处理
- [ ] 所有边界情况都考虑
- [ ] 输入验证完整
- [ ] 无硬编码值

### 可维护性

- [ ] 无重复代码（DRY 原则）
- [ ] 使用不可变模式
- [ ] 单一职责原则
- [ ] 高内聚低耦合

### 清洁度

- [ ] 无 console.log 语句
- [ ] 无注释掉的代码
- [ ] 无 TODO 注释（或有对应的 issue）
- [ ] 无未使用的导入

## Tools & Automation (工具和自动化)

### Python

```bash
# 代码格式化
uv run ruff format .

# 代码检查
uv run ruff check .

# 类型检查
uv run mypy app/

# 复杂度检查
uv run radon cc app/ -a
```

### TypeScript

```bash
# 代码格式化
npm run format

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

---

**记住：代码是写给人看的，顺便让机器执行。优先考虑可读性和可维护性。**
