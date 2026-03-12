---
description: Comprehensive code review for security, quality, and best practices
---

# Code Review

对未提交的变更进行全面的安全和质量审查。

## 审查流程

1. **获取变更文件**: `git diff --name-only HEAD`

2. **按优先级检查每个文件**

3. **生成报告**：
   - 严重程度: CRITICAL, HIGH, MEDIUM, LOW
   - 文件位置和行号
   - 问题描述
   - 建议修复方案

4. **如果发现 CRITICAL 或 HIGH 问题，阻止提交**

## 安全检查 (CRITICAL)

- [ ] **硬编码凭证** - API keys、passwords、tokens
- [ ] **SQL 注入** - 查询中的字符串拼接
- [ ] **XSS 漏洞** - 未转义的用户输入
- [ ] **缺少输入验证**
- [ ] **不安全的依赖** - 过时、有漏洞的包
- [ ] **路径遍历** - 用户控制的文件路径
- [ ] **CSRF 漏洞**
- [ ] **认证绕过**

## 代码质量 (HIGH)

- [ ] **大函数** - 超过 50 行
- [ ] **大文件** - 超过 800 行
- [ ] **深嵌套** - 超过 4 层
- [ ] **缺少错误处理** - 空的 try/catch
- [ ] **console.log** - 生产代码中的调试语句
- [ ] **TODO/FIXME** - 没有对应 issue 的注释
- [ ] **缺少 JSDoc** - 公共 API 没有文档

## 性能 (MEDIUM)

- [ ] **低效算法** - O(n²) 可以优化为 O(n log n)
- [ ] **不必要的重渲染** - React 组件
- [ ] **缺少缓存**
- [ ] **N+1 查询**
- [ ] **大包体积**

## 最佳实践 (MEDIUM)

- [ ] **Mutation 模式** - 应使用不可变模式
- [ ] **代码中的 Emoji** - 不建议
- [ ] **新代码缺少测试**
- [ ] **可访问性问题** - 缺少 ARIA 标签
- [ ] **变量命名不清晰** - x, tmp, data
- [ ] **魔法数字** - 没有命名常量

## 审查输出格式

```
[CRITICAL] 硬编码 API 密钥
文件: src/api/client.ts:42
问题: API 密钥暴露在源代码中
修复: 移到环境变量

const apiKey = "sk-abc123";  // ❌ 错误
const apiKey = process.env.API_KEY;  // ✅ 正确
```

## 审批标准

- ✅ **批准**: 无 CRITICAL 或 HIGH 问题
- ⚠️ **警告**: 仅有 MEDIUM 问题（可谨慎合并）
- ❌ **阻止**: 发现 CRITICAL 或 HIGH 问题

## 审查命令

```bash
# Python
uv run ruff check .
uv run mypy app/
uv run bandit -r app/

# TypeScript
npm run lint
npm run type-check
```

---

**永远不要批准包含安全漏洞的代码！**
