# Design System 创建指南

## 完整 Design Token 体系

### 1. 颜色系统

使用 HSL 而非 HEX，方便程序化调整明度和饱和度。

#### 语义化颜色

```css
:root {
  /* Brand */
  --color-primary: 220 80% 56%;
  --color-primary-hover: 220 80% 48%;
  --color-primary-active: 220 80% 42%;
  --color-primary-bg: 220 80% 95%;

  /* Semantic */
  --color-success: 142 70% 45%;
  --color-warning: 38 92% 50%;
  --color-error: 0 72% 51%;
  --color-info: 199 89% 48%;

  /* Neutrals (10 级灰度) */
  --gray-50: 220 20% 98%;
  --gray-100: 220 18% 96%;
  --gray-200: 220 15% 91%;
  --gray-300: 220 12% 83%;
  --gray-400: 220 10% 64%;
  --gray-500: 220 8% 46%;
  --gray-600: 220 10% 34%;
  --gray-700: 220 14% 24%;
  --gray-800: 220 18% 16%;
  --gray-900: 220 20% 10%;
}
```

#### Dark Mode 切换

```css
[data-theme="dark"] {
  --color-bg: var(--gray-900);
  --color-surface: var(--gray-800);
  --color-text: var(--gray-100);
  --color-text-secondary: var(--gray-400);
  --color-border: var(--gray-700);
}

[data-theme="light"] {
  --color-bg: var(--gray-50);
  --color-surface: 0 0% 100%;
  --color-text: var(--gray-900);
  --color-text-secondary: var(--gray-500);
  --color-border: var(--gray-200);
}
```

### 2. 字体系统

```css
:root {
  /* Font Families */
  --font-sans: "Inter", "Noto Sans SC", system-ui, -apple-system, sans-serif;
  --font-display: "Outfit", var(--font-sans);
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* Font Sizes (modular scale 1.25) */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem; /* 36px */
  --text-5xl: 3rem; /* 48px */

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

#### 排版层级

| 用途        | 字体    | 大小    | 粗细     | 行高    |
| ----------- | ------- | ------- | -------- | ------- |
| 页面标题 H1 | display | 3xl-5xl | bold     | tight   |
| 章节标题 H2 | display | 2xl-3xl | semibold | tight   |
| 小标题 H3   | sans    | xl-2xl  | semibold | tight   |
| 正文        | sans    | base    | normal   | normal  |
| 辅助文字    | sans    | sm      | normal   | normal  |
| 按钮        | sans    | sm-base | medium   | tight   |
| 代码        | mono    | sm      | normal   | relaxed |

### 3. 间距系统

基于 4px 基准的间距系统（4, 8, 12, 16, 24, 32, 48, 64, 96）

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem; /* 4px  - 内联元素间距 */
  --space-2: 0.5rem; /* 8px  - 紧凑间距 */
  --space-3: 0.75rem; /* 12px - 小间距 */
  --space-4: 1rem; /* 16px - 标准间距 */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px - 组件内部 padding */
  --space-8: 2rem; /* 32px - 组件之间 */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px - 大区块之间 */
  --space-16: 4rem; /* 64px - section 之间 */
  --space-24: 6rem; /* 96px - 页面级间距 */
}
```

#### 间距使用指南

| 场景              | 间距    | Token               |
| ----------------- | ------- | ------------------- |
| 输入框内 padding  | 8-12px  | space-2 / space-3   |
| 按钮内 padding    | 8-16px  | space-2 / space-4   |
| 卡片内 padding    | 16-24px | space-4 / space-6   |
| 列表项间距        | 8-12px  | space-2 / space-3   |
| 表单字段间距      | 16-24px | space-4 / space-6   |
| 页面 section 间距 | 48-96px | space-12 / space-24 |

### 4. 阴影系统

```css
:root {
  --shadow-xs: 0 1px 2px hsl(0 0% 0% / 0.04);
  --shadow-sm: 0 1px 3px hsl(0 0% 0% / 0.06), 0 1px 2px hsl(0 0% 0% / 0.04);
  --shadow-md: 0 4px 6px hsl(0 0% 0% / 0.06), 0 2px 4px hsl(0 0% 0% / 0.04);
  --shadow-lg: 0 10px 15px hsl(0 0% 0% / 0.08), 0 4px 6px hsl(0 0% 0% / 0.04);
  --shadow-xl: 0 20px 25px hsl(0 0% 0% / 0.1), 0 8px 10px hsl(0 0% 0% / 0.04);
  --shadow-2xl: 0 25px 50px hsl(0 0% 0% / 0.15);

  /* Colored shadow (for elevated primary buttons) */
  --shadow-primary: 0 4px 14px hsl(var(--color-primary) / 0.35);
}
```

### 5. 边框圆角

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem; /* 4px  - 小元素 (badge, tag) */
  --radius-md: 0.375rem; /* 6px  - 输入框, 按钮 */
  --radius-lg: 0.5rem; /* 8px  - 卡片 */
  --radius-xl: 0.75rem; /* 12px - 大卡片, modal */
  --radius-2xl: 1rem; /* 16px */
  --radius-full: 9999px; /* 圆形 */
}
```

### 6. 过渡动画

```css
:root {
  --transition-fast: 150ms ease-out;
  --transition-base: 200ms ease-out;
  --transition-slow: 300ms ease-out;
  --transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## 如何使用

在 CSS 中引用 Token：

```css
.card {
  background: hsl(var(--color-surface));
  border: 1px solid hsl(var(--color-border));
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```
