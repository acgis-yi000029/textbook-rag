# Step 1: 需求分析

## 阶段信息

- **阶段**: 1/10 - 需求分析
- **Skill**: `dev-product_manager`
- **产出物**: `docs/requirements/requirements.md`

---

## 执行步骤

### 1. 加载 Skill

加载 `dev-product_manager` skill，获取需求分析的专业知识和模板。

### 2. 收集背景信息

与用户对话，收集以下信息：

**必填项**:

- [ ] 项目名称
- [ ] 项目背景/动机
- [ ] 目标用户群体
- [ ] 核心问题/痛点

**可选项**:

- [ ] 竞品分析
- [ ] 预算/时间限制
- [ ] 技术偏好

### 3. 需求分类

将收集的信息整理为：

1. **功能需求** (Functional Requirements)
   - 核心功能
   - 辅助功能
   - 未来扩展

2. **非功能需求** (Non-Functional Requirements)
   - 性能要求
   - 安全要求
   - 可用性要求
   - 可维护性要求

3. **约束条件** (Constraints)
   - 技术约束
   - 业务约束
   - 时间约束

### 4. 生成文档

创建 `docs/requirements/requirements.md`：

```markdown
# {项目名称} - 需求文档

## 1. 项目概述

### 1.1 背景

### 1.2 目标

### 1.3 范围

## 2. 目标用户

### 2.1 用户画像

### 2.2 用户场景

## 3. 功能需求

### 3.1 核心功能

### 3.2 辅助功能

## 4. 非功能需求

### 4.1 性能

### 4.2 安全

### 4.3 可用性

## 5. 约束条件

## 6. 验收标准

## 7. 附录
```

### 5. 用户确认

展示生成的需求文档，请用户确认：

```
[C] 确认 - 需求完整，继续下一阶段
[E] 编辑 - 修改需求
[A] 添加 - 补充更多需求
```

---

## 完成检查

- [ ] `docs/requirements/requirements.md` 已创建
- [ ] 文档包含所有必填部分
- [ ] 用户已确认

## 状态更新

```yaml
phases:
  requirements:
    status: completed
    completed_at: { current_time }
```

## 下一步

→ 进入 `step-02-prd.md`
