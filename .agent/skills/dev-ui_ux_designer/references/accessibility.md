# 无障碍设计指南 (Accessibility / a11y)

## WCAG 2.1 必须达标项

### Level A（最低要求）

- [ ] 所有非文本内容有替代文字（img alt）
- [ ] 视频有字幕
- [ ] 信息不单纯依赖颜色传达（用图标/文字辅助）
- [ ] 所有功能可通过键盘操作
- [ ] 无键盘陷阱（focus 不会被困住）
- [ ] 页面有描述性 `<title>`
- [ ] 链接文字有意义（不用 "点击这里"）

### Level AA（推荐标准）

- [ ] **颜色对比度**: 正文 ≥ 4.5:1，大文字 ≥ 3:1
- [ ] **文字可缩放**: 200% 缩放不丢失内容
- [ ] **Focus 可见**: 所有可交互元素有 focus-visible 样式
- [ ] **一致导航**: 页面间导航位置一致
- [ ] **错误提示**: 表单错误有清晰说明和修复建议

## 键盘导航

### Focus 样式

```css
/* 移除默认 outline，用自定义 focus-visible */
:focus {
  outline: none;
}

:focus-visible {
  outline: 2px solid hsl(var(--color-primary));
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* 暗色背景上 */
.dark :focus-visible {
  outline-color: hsl(var(--color-primary-light));
}
```

### Tab 顺序

- 自然的 DOM 顺序 = Tab 顺序
- 避免使用 `tabindex > 0`（打乱自然顺序）
- Modal 打开时 trap focus 在 Modal 内部
- 关闭 Modal 后 focus 回到触发元素

### 快捷键

| 键          | 行为                 |
| ----------- | -------------------- |
| Tab         | 移到下一个可交互元素 |
| Shift+Tab   | 移到上一个           |
| Enter/Space | 激活按钮/链接        |
| Escape      | 关闭 Modal/Dropdown  |
| ↑↓          | 在列表/菜单中移动    |

## ARIA 使用指南

### 何时用 ARIA

```
原生 HTML > ARIA

<!-- ✅ 优先用原生 HTML -->
<button>Submit</button>
<nav>...</nav>
<dialog>...</dialog>

<!-- ❌ 不要用 ARIA 替代原生 -->
<div role="button">Submit</div>
<div role="navigation">...</div>
```

### 常用 ARIA

```html
<!-- 标签 -->
<button aria-label="Close dialog">✕</button>

<!-- 描述 -->
<input aria-describedby="help-text" />
<p id="help-text">Password must be 8+ characters</p>

<!-- 状态 -->
<button aria-expanded="false">Menu</button>
<div aria-hidden="true">Decorative element</div>

<!-- Live regions (动态更新) -->
<div aria-live="polite">2 results found</div>
<div aria-live="assertive">Error: Invalid email</div>

<!-- 角色 -->
<div role="alert">Something went wrong</div>
<div role="status">Saved successfully</div>
```

## 颜色对比度

### 检查工具

```bash
# 在线工具
# https://webaim.org/resources/contrastchecker/

# 快速计算 (近似)
# 前景 L / 背景 L 的比值 ≥ 4.5
```

### 安全的颜色搭配

| 背景         | 文字         | 对比度 | 合规      |
| ------------ | ------------ | ------ | --------- |
| 白色 #FFF    | 深灰 #333    | 12.6:1 | ✅ AAA    |
| 白色 #FFF    | 中灰 #767676 | 4.5:1  | ✅ AA     |
| 白色 #FFF    | 浅灰 #999    | 2.8:1  | ❌ 不合规 |
| 深色 #1a1a2e | 浅色 #e0e0e0 | 11.5:1 | ✅ AAA    |

### 不依赖颜色

```
❌ 只用红色/绿色区分状态
✅ 颜色 + 图标 + 文字

例: 错误状态 = 红色边框 + ⚠️ 图标 + "Please enter a valid email"
```

## 表单无障碍

```html
<!-- ✅ 正确：显式 label 关联 -->
<label for="email">Email</label>
<input id="email" type="email" required aria-required="true" />

<!-- ✅ 正确：错误状态 -->
<input id="email" aria-invalid="true" aria-describedby="email-error" />
<p id="email-error" role="alert">Please enter a valid email</p>

<!-- ✅ 正确：必填标记 -->
<label for="name">
  Name <span aria-hidden="true">*</span>
  <span class="sr-only">(required)</span>
</label>
```

## Screen Reader Only 工具类

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
