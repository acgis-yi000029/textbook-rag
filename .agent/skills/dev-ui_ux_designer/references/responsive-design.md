# 响应式设计指南

## 断点系统

```css
/* Mobile First — 从小屏幕开始，逐步增强 */

/* 默认: 0px+ (Mobile) */
/* sm:  640px+ (大手机/小平板) */
/* md:  768px+ (平板) */
/* lg:  1024px+ (笔记本) */
/* xl:  1280px+ (桌面) */
/* 2xl: 1536px+ (大屏) */

@media (min-width: 640px) {
  /* sm */
}
@media (min-width: 768px) {
  /* md */
}
@media (min-width: 1024px) {
  /* lg */
}
@media (min-width: 1280px) {
  /* xl */
}
@media (min-width: 1536px) {
  /* 2xl */
}
```

## 容器宽度

```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}
@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}
@media (min-width: 1280px) {
  .container {
    max-width: 1200px;
  }
}
```

## 网格系统

```css
.grid {
  display: grid;
  gap: var(--space-6);
}

/* 自适应网格 (auto-fill) */
.grid-auto {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

/* 手动响应式网格 */
.grid-cols {
  grid-template-columns: 1fr; /* mobile: 1 列 */
}
@media (min-width: 768px) {
  .grid-cols {
    grid-template-columns: repeat(2, 1fr);
  } /* tablet: 2 列 */
}
@media (min-width: 1024px) {
  .grid-cols {
    grid-template-columns: repeat(3, 1fr);
  } /* desktop: 3 列 */
}
```

## 排版响应

```css
/* 响应式字号 — clamp(最小值, 首选值, 最大值) */
h1 {
  font-size: clamp(1.875rem, 4vw, 3rem);
} /* 30px → 48px */
h2 {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
} /* 24px → 36px */
h3 {
  font-size: clamp(1.25rem, 2.5vw, 1.875rem);
} /* 20px → 30px */

/* 正文在窄屏稍小 */
body {
  font-size: var(--text-base); /* 16px */
}
@media (max-width: 640px) {
  body {
    font-size: var(--text-sm);
  } /* 14px */
}
```

## 间距响应

```css
/* Section 间距在移动端减小 */
.section {
  padding: var(--space-12) 0; /* mobile: 48px */
}
@media (min-width: 768px) {
  .section {
    padding: var(--space-16) 0;
  } /* tablet: 64px */
}
@media (min-width: 1024px) {
  .section {
    padding: var(--space-24) 0;
  } /* desktop: 96px */
}
```

## 常见响应式模式

### 1. 堆叠 → 并排

```css
.flex-responsive {
  display: flex;
  flex-direction: column; /* mobile: 垂直堆叠 */
  gap: var(--space-4);
}
@media (min-width: 768px) {
  .flex-responsive {
    flex-direction: row; /* tablet+: 水平排列 */
    align-items: center;
  }
}
```

### 2. 侧边栏布局

```css
.layout {
  display: grid;
  grid-template-columns: 1fr; /* mobile: 无侧边栏 */
}
@media (min-width: 1024px) {
  .layout {
    grid-template-columns: 260px 1fr; /* desktop: 侧边栏 + 主内容 */
    gap: var(--space-8);
  }
}
```

### 3. 表格 → 卡片

```css
/* Desktop: 表格 */
.data-table {
  display: table;
}
.data-table thead {
  display: table-header-group;
}
.data-table tr {
  display: table-row;
}
.data-table td {
  display: table-cell;
}

/* Mobile: 每行变卡片 */
@media (max-width: 768px) {
  .data-table thead {
    display: none;
  }
  .data-table tr {
    display: block;
    margin-bottom: var(--space-4);
    padding: var(--space-4);
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-lg);
  }
  .data-table td {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) 0;
  }
  .data-table td::before {
    content: attr(data-label);
    font-weight: var(--font-medium);
  }
}
```

### 4. 导航响应式

```css
/* Desktop: 横向导航 */
.nav-items {
  display: flex;
  gap: var(--space-6);
}
.nav-toggle {
  display: none;
}

/* Mobile: 汉堡菜单 */
@media (max-width: 768px) {
  .nav-items {
    display: none;
    flex-direction: column;
    position: fixed;
    inset: 0;
    background: hsl(var(--color-surface));
    padding: var(--space-16) var(--space-6);
    z-index: 50;
  }
  .nav-items.open {
    display: flex;
  }
  .nav-toggle {
    display: block;
  }
}
```

## 图片响应式

```html
<!-- 响应式图片 -->
<img
  src="image-800.jpg"
  srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Description"
  loading="lazy"
/>
```

```css
/* 图片容器 (防止布局偏移) */
.image-container {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--radius-lg);
}
.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

## 触控优化 (Mobile)

```css
/* 最小触控区域: 44x44px (Apple HIG) / 48x48px (Material) */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 移动端禁用 hover 效果 */
@media (hover: none) {
  .btn:hover {
    transform: none;
    box-shadow: none;
  }
}
```
