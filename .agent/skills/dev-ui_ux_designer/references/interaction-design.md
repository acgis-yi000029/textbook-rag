# 交互设计指南

## 动画时长标准

| 类型     | 时长      | 缓动         | 用途               |
| -------- | --------- | ------------ | ------------------ |
| 即时反馈 | 100-150ms | ease-out     | hover, active 状态 |
| 简单过渡 | 200-250ms | ease-out     | 颜色变化、透明度   |
| 中等动画 | 300-400ms | ease-out     | 展开/折叠、滑入    |
| 复杂动画 | 400-600ms | cubic-bezier | 页面切换、弹性效果 |
| 装饰动画 | 600ms+    | custom       | 加载、入场动画序列 |

**原则**: 用户直接触发的操作 → 越快越好；系统反馈 → 适度延迟让用户感知到变化。

## 必备微交互

### 1. 按钮反馈

```css
.btn {
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out;
}
.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
.btn:active {
  transform: translateY(0) scale(0.98);
  box-shadow: var(--shadow-sm);
}
```

### 2. 输入框焦点

```css
.input {
  transition:
    border-color 200ms,
    box-shadow 200ms;
}
.input:focus {
  border-color: hsl(var(--color-primary));
  box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.12);
}
```

### 3. 列表项入场

```css
.list-item {
  animation: fadeSlideIn 300ms ease-out both;
}
.list-item:nth-child(1) {
  animation-delay: 0ms;
}
.list-item:nth-child(2) {
  animation-delay: 50ms;
}
.list-item:nth-child(3) {
  animation-delay: 100ms;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 4. 页面切换

```css
.page-enter {
  animation: pageIn 300ms ease-out;
}
@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateX(16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### 5. 加载状态

```css
/* Skeleton loading */
.skeleton {
  background: linear-gradient(
    90deg,
    hsl(var(--gray-200)) 25%,
    hsl(var(--gray-100)) 50%,
    hsl(var(--gray-200)) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid hsl(var(--gray-200));
  border-top-color: hsl(var(--color-primary));
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

## 状态设计

每个可交互元素必须有以下状态的视觉区分：

| 状态           | 视觉变化                        |
| -------------- | ------------------------------- |
| Default        | 基准样式                        |
| Hover          | 颜色加深/提升/阴影（仅桌面）    |
| Focus          | 聚焦环 (outline/ring)           |
| Active/Pressed | 轻微缩小 + 阴影内收             |
| Disabled       | 透明度 0.5，cursor: not-allowed |
| Loading        | 内容替换为 spinner/skeleton     |
| Error          | 红色边框 + 错误消息             |
| Success        | 绿色指示 + 成功消息             |
| Empty          | 友好的空状态插图 + 引导操作     |

## 过渡效果规范

### 展开/折叠 (Accordion)

```css
.accordion-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms ease-out;
}
.accordion-content.open {
  grid-template-rows: 1fr;
}
.accordion-content > div {
  overflow: hidden;
}
```

### Tooltip

```css
.tooltip {
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 150ms,
    transform 150ms;
  pointer-events: none;
}
.trigger:hover .tooltip {
  opacity: 1;
  transform: translateY(0);
}
```

## 禁忌

- ❌ 不用 `transition: all` — 明确指定属性
- ❌ 动画时长不超过 600ms — 用户会失去耐心
- ❌ 不在移动端使用 hover 效果
- ❌ 不用闪烁/跳动的动画 — 可能触发光敏性癫痫
- ❌ 不在 `prefers-reduced-motion` 时播放动画
