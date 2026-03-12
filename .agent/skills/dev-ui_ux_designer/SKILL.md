---
name: dev-ui_ux_designer
description: UI/UX design skill for creating modern, premium interfaces. Use when (1) designing new pages or components, (2) creating design systems or tokens, (3) choosing colors/typography/spacing, (4) planning user flows or wireframes, (5) improving interaction design or accessibility. Keywords — "design", "UI", "UX", "prototype", "wireframe", "color palette", "layout", "responsive", "accessibility", "设计", "界面", "交互"
---

# UI/UX Designer

创建现代、高端、精致的用户界面和交互体验。

## Core Principles

### 0. MVP-First Scope Control

Every design task in this repository defaults to MVP scope unless the user explicitly asks for broader coverage.

- Start from the smallest usable workflow, not the full future product map.
- Reduce screens, controls, and states until only the core user journey remains.
- Treat every extra panel, workspace, filter, or interaction as out of scope until justified.
- Prefer one strong primary task over multiple half-designed surfaces.
- Defer admin, history, personalization, advanced management, and decorative interactions by default.

Before producing UX deliverables or UI implementation, answer these questions:

1. What is the single primary user task for this version?
2. What is the minimum UI needed to complete that task?
3. Which visible elements are supporting the task, and which are just future-facing expansion?
4. What can be explicitly deferred without breaking the core workflow?

If the scope still feels broad, shrink it again before designing.

### 1. Visual Hierarchy（视觉层级）

每个页面必须有清晰的视觉层级：

```
Primary   → 用户第一眼看到的（标题、CTA 按钮）  → 最大、最亮、最突出
Secondary → 支撑主内容（副标题、描述）            → 中等大小、适度对比
Tertiary  → 辅助信息（元数据、时间戳）            → 最小、最淡
```

### 2. Design-First Approach（设计先行）

在写任何前端代码之前：

1. 确定设计系统（颜色、字体、间距）
2. 规划页面布局和组件结构
3. 定义交互行为和动画
4. **然后**才开始编码

### 4. Minimum Necessary UX

Design should optimize for clarity and task completion first.

- Keep navigation shallow.
- Keep shell regions stable.
- Minimize mode switching.
- Avoid adding separate workspaces if the core task can stay in one place.
- Prefer explicit deferral notes over speculative UI.

### 3. Premium Aesthetics（高端审美）

- ❌ 不用浏览器默认样式
- ❌ 不用纯色（plain red/blue/green）
- ❌ 不用 placeholder 图片
- ✅ 精心调配的颜色系统（HSL 调色）
- ✅ 现代字体（Inter, Outfit, Plus Jakarta Sans）
- ✅ 微动效和过渡动画
- ✅ 适当的阴影、圆角、模糊效果

## Design System Creation（设计系统）

当创建新项目或新页面时，先建立设计系统。

**详细指南**: `references/design-system.md`

### Quick Reference: Token 结构

```css
:root {
  /* Colors - HSL for easy manipulation */
  --color-primary: 220 80% 56%;
  --color-primary-light: 220 80% 70%;
  --color-primary-dark: 220 80% 42%;

  /* Neutrals */
  --color-bg: 220 20% 97%;
  --color-surface: 0 0% 100%;
  --color-text: 220 20% 12%;
  --color-text-secondary: 220 10% 45%;

  /* Spacing - 4px base */
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */

  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-display: "Outfit", var(--font-sans);

  /* Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px hsl(0 0% 0% / 0.05);
  --shadow-md: 0 4px 6px hsl(0 0% 0% / 0.07);
  --shadow-lg: 0 10px 25px hsl(0 0% 0% / 0.1);
}
```

## Component Design Patterns（组件设计模式）

**详细指南**: `references/component-patterns.md`

### Card Pattern

```
┌─────────────────────────────┐
│  [Image/Icon]               │  ← 视觉吸引
│                             │
│  Title                      │  ← 主标题 (font-display, bold)
│  Description text that      │  ← 描述 (text-secondary)
│  wraps to two lines max...  │
│                             │
│  [Tag]  [Tag]    [Action →] │  ← 标签 + 行动按钮
└─────────────────────────────┘
  ↑ padding: var(--space-6)
  ↑ border-radius: var(--radius-lg)
  ↑ shadow: var(--shadow-md)
  ↑ hover: translateY(-2px) + shadow-lg
```

### Button Hierarchy

```
Primary   → 填充色 + 白色文字     → 一个页面最多 1-2 个
Secondary → 边框 + 主色文字       → 次要操作
Ghost     → 无边框 + 淡色文字     → 最不重要的操作
Danger    → 红色变体              → 删除/破坏性操作
```

## Interaction Design（交互设计）

**详细指南**: `references/interaction-design.md`

### 核心原则

- **反馈即时** — 每个用户操作都有视觉反馈（hover, active, focus）
- **过渡自然** — 使用 ease-out 缓动，150-300ms 时长
- **引导注意** — 用动画引导用户注意力到重要变化
- **减少认知负担** — 一次只展示必要信息

### 必要的微交互

```css
/* 按钮 hover */
.btn {
  transition: all 0.2s ease-out;
}
.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* 卡片 hover */
.card {
  transition:
    transform 0.2s ease-out,
    box-shadow 0.2s ease-out;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 页面加载 */
.fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
```

## Accessibility（无障碍设计）

**详细指南**: `references/accessibility.md`

### 必须做到

- 颜色对比度 ≥ 4.5:1（正文）/ 3:1（大文字）
- 所有可交互元素可 keyboard focus（有 focus-visible 样式）
- 图片有 alt 文本
- 表单有 label 关联
- ARIA 标签用在自定义组件上

## Responsive Design（响应式设计）

**详细指南**: `references/responsive-design.md`

### 断点系统

```css
/* Mobile First */
/* Default: 0 - 639px (mobile) */
@media (min-width: 640px) {
  /* sm: tablet */
}
@media (min-width: 768px) {
  /* md: small laptop */
}
@media (min-width: 1024px) {
  /* lg: laptop */
}
@media (min-width: 1280px) {
  /* xl: desktop */
}
```

### 布局策略

- **Mobile**: 单列，堆叠布局
- **Tablet**: 2 列网格，侧边栏折叠
- **Desktop**: 多列网格，侧边栏展开

## Workflow: 从零设计一个页面

1. **明确目标** — 这个页面的核心目的是什么？用户要完成什么任务？
2. **收缩范围** — 先写 MVP in-scope / out-of-scope，默认删减需求
3. **信息架构** — 页面需要展示哪些信息？优先级如何？
4. **线框图** — 用 ASCII/简单草图规划布局和组件位置
5. **设计系统** — 确定/复用颜色、字体、间距 Token
6. **组件设计** — 只设计 MVP 所需组件的视觉和交互细节
7. **响应式** — 规划各断点下的布局变化
8. **交互定义** — 只定义核心任务所需的 hover/click/transition 效果
9. **实现** — 基于以上设计开始编码

## MVP Deliverable Rule

For design documents in this repository, always include:

- `MVP-Only Scope`
- explicit deferred items
- a primary user journey
- the minimum shell/layout needed for that journey

Do not let future workspaces or speculative capabilities expand the current design deliverable unless the user asks for them.

## Color Palette 速查

### 专业配色方案

```
深色主题 (Dark Mode):
  bg:       hsl(220, 20%, 8%)
  surface:  hsl(220, 20%, 12%)
  border:   hsl(220, 15%, 20%)
  text:     hsl(220, 10%, 90%)

浅色主题 (Light Mode):
  bg:       hsl(220, 20%, 97%)
  surface:  hsl(0, 0%, 100%)
  border:   hsl(220, 15%, 88%)
  text:     hsl(220, 20%, 12%)

品牌色变体生成（基于 HSL）:
  primary:       hsl(H, 80%, 56%)
  primary-light: hsl(H, 80%, 70%)    ← S 不变, L +14
  primary-dark:  hsl(H, 80%, 42%)    ← S 不变, L -14
  primary-bg:    hsl(H, 80%, 95%)    ← 超淡背景色
```
