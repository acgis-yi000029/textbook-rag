---
description: Security guidelines for secrets, input validation, and vulnerability prevention
---

# Security Guidelines (安全指南)

## Mandatory Security Checks (强制安全检查)

在**任何提交之前**必须检查：

- [ ] **无硬编码密钥** - 没有 API keys、passwords、tokens
- [ ] **输入验证** - 所有用户输入都经过验证
- [ ] **SQL 注入防护** - 使用参数化查询
- [ ] **XSS 防护** - HTML 输出经过转义
- [ ] **CSRF 保护** - 启用 CSRF 令牌
- [ ] **认证授权** - 验证用户权限
- [ ] **速率限制** - 所有端点都有限流
- [ ] **错误信息** - 不泄露敏感数据

## Secret Management (密钥管理)

### ❌ 永远不要：硬编码密钥

```python
# WRONG - 硬编码
OPENAI_API_KEY = "sk-proj-xxxxx"
DATABASE_URL = "postgresql://user:password@localhost/db"
```

### ✅ 始终使用：环境变量

```python
# CORRECT - 环境变量
import os

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not configured")
```

## Input Validation (输入验证)

### Python (Pydantic)

```python
from pydantic import BaseModel, Field, validator

class UserInput(BaseModel):
    email: str = Field(..., regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    age: int = Field(..., ge=0, le=150)
    username: str = Field(..., min_length=3, max_length=50)
```

## SQL Injection Prevention (SQL 注入防护)

### ❌ 危险：字符串拼接

```python
# WRONG - SQL 注入风险
query = f"SELECT * FROM users WHERE username = '{username}'"
```

### ✅ 安全：参数化查询

```python
# CORRECT - 参数化查询
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
```

## Common Vulnerabilities (常见漏洞)

### 1. 硬编码密钥

```python
# ❌ 危险
API_KEY = "sk-proj-xxxxx"

# ✅ 安全
API_KEY = os.getenv("API_KEY")
```

### 2. SQL 注入

```python
# ❌ 危险
query = f"SELECT * FROM users WHERE id = {user_id}"

# ✅ 安全
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
```

### 3. XSS 攻击

```typescript
// ❌ 危险
element.innerHTML = userInput;

// ✅ 安全
element.textContent = userInput;
```

### 4. 路径遍历

```python
# ❌ 危险
file_path = f"/uploads/{user_filename}"

# ✅ 安全
from pathlib import Path
safe_path = Path("/uploads") / Path(user_filename).name
```

## Security Tools (安全工具)

### Python

```bash
# 依赖扫描
uv run pip-audit

# 代码安全检查
uv run bandit -r app/

# Secret 扫描
uv run detect-secrets scan
```

### TypeScript

```bash
# 依赖扫描
npm audit

# 修复漏洞
npm audit fix
```

## Security Response Protocol (安全响应协议)

如果发现安全问题：

1. **立即停止** - 不要继续开发
2. **评估影响** - 确定问题严重程度
3. **修复问题** - 优先修复 CRITICAL 问题
4. **轮换密钥** - 如果密钥泄露，立即轮换
5. **全面审查** - 检查整个代码库是否有类似问题
6. **记录事件** - 文档化问题和解决方案

---

**记住：安全不是可选的。每一行代码都要考虑安全性。**
