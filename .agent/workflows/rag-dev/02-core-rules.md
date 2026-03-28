---
description: textbook-rag 核心开发规则 — 前端架构、UI 规范、API 分工、i18n、数据一致性
---

# 🔑 核心开发规则

## 1. 前端架构: features/ 模块化

**核心原则: `app/` 目录的 page.tsx 只做薄壳，所有逻辑在 `features/` 下。**

```
✅ 正确做法:
  app/(frontend)/(app)/library/page.tsx     → import LibraryPage from '@/features/library/LibraryPage'
  app/(frontend)/(app)/dashboard/pipeline/page.tsx → import PipelineDashboard from '@/features/pipeline/PipelineDashboard'

❌ 错误做法:
  把 500 行组件直接写在 page.tsx 里
```

## 2. UI 组件规范: 通用布局与模式

为了保持全站 UI 体验一致（如暗黑模式、交互方式），开发新页面时必须：

1. **页面布局**: 使用 `features/shared/components/SidebarLayout.tsx`，它内置了：
   - 通用的响应式带侧边栏布局
   - 自动内置可拖拽边框 (`ResizeHandle`)
   - 树形/列表/卡片等标准化布局属性
2. **面板拖拽**: 需要左右拖拽面板时，复用 `features/shared/ResizeHandle.tsx`。
   - 不要写死灰/蓝的硬编码颜色，该组件已使用 `bg-border` / `bg-primary` 做了主题适配。
3. **样式与类名**: 遵循 TailwindCSS 标准变量（如 `bg-card`, `bg-muted`, `text-muted-foreground` 等），避免 hardcoded 颜色（如 `bg-gray-100`）。

## 3. 后端 API: Payload vs Engine 分工

| 功能类型 | 实现位置 | 原因 |
|---------|---------|------|
| CRUD 操作 (Books/Chunks/Tasks) | Payload REST API (`/api/books`, `/api/pipeline-tasks`) | Payload 自动生成，带认证 |
| 自定义聚合/同步 | Payload Next.js Route (`app/(frontend)/api/`) | 可用 Payload Local API，无需认证 |
| RAG 查询/检索 | Engine FastAPI (`/engine/query`) | 需要 SQLite + ChromaDB 直接访问 |
| PDF 服务/TOC | Engine FastAPI (`/engine/books/`) | 文件系统访问 |
| 数据摄入 Pipeline | Engine FastAPI (`/engine/ingest`) | 重计算任务 |

## 4. i18n: 新增导航/文案必须更新

所有用户可见文字在 `features/shared/i18n/messages.ts` 统一管理:
1. 在 `Messages` interface 添加 key
2. 在 `en` 对象添加英文
3. 在 `zh` 对象添加中文

## 5. 数据一致性: 三层同步

```
Engine SQLite ←sync_to_payload.py→ Payload CMS (PostgreSQL)
     ↑                                    ↓
  rebuild_db.py                    Frontend UI
  (MinerU 输出)
```

修改数据分类/字段时，检查并更新:
- `scripts/rebuild_db.py` (Engine SQLite schema)
- `scripts/sync_to_payload.py` (同步脚本 + registry)
- `payload/src/collections/Books.ts` (CMS schema)
- `app/(frontend)/api/sync-engine/route.ts` (Payload API sync)

## 6. 数据层: 必读 data/README.md

**操作数据相关功能前必须先读 `data/README.md`**，其中记录了：

- 数据库表结构与行数统计
- **Chunk 内容类型分布** (`text`/`equation`/`image`/`table` + `text_level` 标题标记)
- **⚠ 页码约定**: `pages.page_number` 是 0-indexed，`toc_entries.pdf_page` 是 1-indexed
- 数据管道流程 (raw_pdfs → MinerU → SQLite → ChromaDB)
- 所有 rebuild 命令的用法

