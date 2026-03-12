# Step 2: 产品需求文档 (PRD)

## 阶段信息

- **阶段**: 2/10 - 产品需求文档
- **Skill**: `dev-product_manager`
- **输入**: `docs/requirements/requirements.md`
- **产出物**: `docs/requirements/prd.md`

---

## 执行步骤

### 1. 加载上下文

读取并分析：

- `docs/requirements/requirements.md` - 需求文档

### 2. 加载 Skill

加载 `dev-product_manager` skill，获取产品管理专业知识。

### 3. 用户故事编写

将需求转化为用户故事 (User Stories)：

```
作为 [角色]，
我想要 [功能]，
以便 [价值/目的]。
```

**示例**:

```
US-001: 用户注册
作为新用户，
我想要注册账号，
以便使用系统的功能。

验收标准：
- Given 用户在注册页面
- When 填写邮箱、密码并提交
- Then 创建账号并发送验证邮件
```

### 4. 功能优先级

使用 MoSCoW 方法分类：

| 优先级     | 说明   | 功能     |
| ---------- | ------ | -------- |
| **Must**   | 必须有 | 核心功能 |
| **Should** | 应该有 | 重要功能 |
| **Could**  | 可以有 | 锦上添花 |
| **Won't**  | 暂不做 | 未来考虑 |

### 5. 验收标准

为每个功能定义验收标准 (Acceptance Criteria)：

```gherkin
Feature: 用户登录

  Scenario: 成功登录
    Given 用户已注册账号
    And 用户在登录页面
    When 输入正确的邮箱和密码
    And 点击登录按钮
    Then 跳转到首页
    And 显示欢迎信息

  Scenario: 密码错误
    Given 用户已注册账号
    And 用户在登录页面
    When 输入正确的邮箱但错误的密码
    And 点击登录按钮
    Then 显示错误提示 "密码错误"
    And 保持在登录页面
```

### 6. 生成文档

创建 `docs/requirements/prd.md`：

```markdown
# {项目名称} - 产品需求文档 (PRD)

## 文档信息

- 版本: 1.0
- 作者: {author}
- 日期: {date}
- 状态: Draft / Review / Approved

## 1. 产品概述

### 1.1 产品愿景

### 1.2 目标用户

### 1.3 核心价值

## 2. 用户故事

### 2.1 Epic 列表

### 2.2 用户故事详情

## 3. 功能需求

### 3.1 Must Have (P0)

### 3.2 Should Have (P1)

### 3.3 Could Have (P2)

## 4. 非功能需求

### 4.1 性能需求

### 4.2 安全需求

### 4.3 兼容性需求

## 5. 验收标准

### 5.1 功能验收

### 5.2 非功能验收

## 6. 里程碑

### 6.1 MVP 范围

### 6.2 V1.0 范围

### 6.3 未来规划

## 7. 风险与依赖

### 7.1 风险列表

### 7.2 外部依赖

## 8. 附录

### 8.1 术语表

### 8.2 参考文档
```

### 7. 用户确认

展示 PRD 文档，请用户确认：

```
[C] 确认 - PRD 完整，继续下一阶段
[E] 编辑 - 修改内容
[A] 添加 - 补充用户故事
[P] 优先级 - 调整优先级
```

---

## 完成检查

- [ ] `docs/requirements/prd.md` 已创建
- [ ] 所有核心功能有用户故事
- [ ] 每个用户故事有验收标准
- [ ] 优先级已确定
- [ ] 用户已确认

## 状态更新

```yaml
phases:
  prd:
    status: completed
    completed_at: { current_time }
```

## 下一步

→ 进入 `step-03-architecture.md`
