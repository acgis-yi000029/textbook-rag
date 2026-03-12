# UI 组件设计模式

## 布局模式

### 1. Hero Section

```
┌─────────────────────────────────────────────┐
│                                             │
│         Headline (display, 4xl-5xl)         │
│    Subheadline (text-secondary, lg-xl)      │
│                                             │
│    [Primary CTA]    [Secondary CTA]         │
│                                             │
│         [Hero Image / Illustration]         │
│                                             │
└─────────────────────────────────────────────┘
```

- 标题用 `font-display`, `font-bold`
- 副标题颜色比标题浅（`text-secondary`）
- CTA 按钮之间间距 `space-4`
- Hero section 上下 padding `space-24`

### 2. Feature Grid

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  🎯 Icon │  │  ⚡ Icon │  │  🔒 Icon │
│  Title   │  │  Title   │  │  Title   │
│  Desc    │  │  Desc    │  │  Desc    │
└──────────┘  └──────────┘  └──────────┘
```

- 桌面 3 列，平板 2 列，手机 1 列
- 图标颜色用 `color-primary`
- 卡片间距 `gap: space-6`

### 3. 数据表格

```
┌──────────┬──────────┬──────────┬──────┐
│ Column A │ Column B │ Column C │  ⋯   │  ← 表头: bg-gray-50, font-medium
├──────────┼──────────┼──────────┼──────┤
│ Data     │ Data     │ Data     │  ⋯   │  ← 行: hover 变色
├──────────┼──────────┼──────────┼──────┤
│ Data     │ Data     │ Data     │  ⋯   │  ← 斑马条纹可选
└──────────┴──────────┴──────────┴──────┘
```

## 交互组件

### Button 变体

```css
/* Primary */
.btn-primary {
  background: hsl(var(--color-primary));
  color: white;
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  box-shadow: var(--shadow-primary);
  transition: all var(--transition-fast);
}
.btn-primary:hover {
  background: hsl(var(--color-primary-hover));
  transform: translateY(-1px);
}

/* Secondary (outlined) */
.btn-secondary {
  background: transparent;
  border: 1px solid hsl(var(--color-border));
  color: hsl(var(--color-text));
}
.btn-secondary:hover {
  background: hsl(var(--color-primary-bg));
  border-color: hsl(var(--color-primary));
  color: hsl(var(--color-primary));
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: hsl(var(--color-text-secondary));
}
.btn-ghost:hover {
  background: hsl(var(--gray-100));
  color: hsl(var(--color-text));
}
```

### Input 组件

```css
.input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid hsl(var(--color-border));
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}
.input:focus {
  outline: none;
  border-color: hsl(var(--color-primary));
  box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.15);
}
.input::placeholder {
  color: hsl(var(--gray-400));
}
```

### Modal / Dialog

```
┌─────────────────────────────────┐
│  ✕                              │  ← 关闭按钮 (右上角)
│                                 │
│  Modal Title (text-xl, bold)    │
│                                 │
│  Content area with details.     │
│  Can be scrollable if needed.   │
│                                 │
│          [Cancel]  [Confirm]    │  ← 按钮组 (右对齐)
└─────────────────────────────────┘
```

设计要点:

- 背景遮罩: `hsl(0 0% 0% / 0.5)` + `backdrop-filter: blur(4px)`
- Modal: `max-width: 32rem`, `border-radius: radius-xl`
- 入场动画: `fadeIn` + `scale(0.95)` → `scale(1)`
- 退场动画: 反向播放

### Toast / Notification

```css
.toast {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### Navigation

#### Top Navigation

```
┌──────────────────────────────────────────────┐
│ [Logo]   Nav1  Nav2  Nav3        [Search] [👤]│
└──────────────────────────────────────────────┘
```

- 高度: 56-64px
- 固定顶部: `position: sticky; top: 0`
- 背景: `backdrop-filter: blur(12px)` + 半透明背景
- 活跃项: 底部 2px 指示器 (color-primary)

#### Sidebar

```
┌────────┬──────────────────────────┐
│ [Logo] │                          │
│        │                          │
│ ■ Home │     Main Content         │
│ □ Users│                          │
│ □ Data │                          │
│        │                          │
│ ──── │                          │
│ ⚙ Set │                          │
└────────┴──────────────────────────┘
```

- 宽度: 240-280px (展开) / 64px (折叠)
- 活跃项: 背景色 `color-primary-bg` + 左侧 3px 指示器

## 响应式组件规则

| 组件       | Desktop      | Tablet       | Mobile       |
| ---------- | ------------ | ------------ | ------------ |
| Navigation | 顶部横向导航 | 汉堡菜单     | 底部 Tab Bar |
| Sidebar    | 展开         | 折叠（图标） | 抽屉式       |
| Grid       | 3-4 列       | 2 列         | 1 列         |
| Table      | 完整         | 横向滚动     | 卡片列表     |
| Modal      | 居中弹窗     | 居中弹窗     | 底部 Sheet   |
