---
description: textbook-rag 项目结构速查
---

# 🏗️ 项目结构速查

```
textbook-rag/
├── payload/              # 前端 + CMS (Payload + Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (frontend)/
│   │   │   │   ├── (app)/        # 用户页面
│   │   │   │   │   ├── library/page.tsx
│   │   │   │   │   ├── chat/page.tsx
│   │   │   │   │   └── dashboard/
│   │   │   │   │       ├── page.tsx           # Dashboard 首页
│   │   │   │   │       ├── pipeline/page.tsx
│   │   │   │   │       ├── models/page.tsx
│   │   │   │   │       ├── prompts/page.tsx
│   │   │   │   │       ├── queries/page.tsx
│   │   │   │   │       ├── questions/page.tsx
│   │   │   │   │       ├── analytics/page.tsx
│   │   │   │   │       ├── evaluation/page.tsx
│   │   │   │   │       └── feedback/page.tsx
│   │   │   │   ├── api/           # 自定义 Next.js API routes
│   │   │   │   └── layout.tsx
│   │   │   └── (payload)/         # Payload Admin 自动生成
│   │   ├── collections/           # Payload CMS collections (Books, Chunks, etc.)
│   │   └── features/              # ⭐ 核心前端代码，按功能模块组织
│   │       ├── auth/              # 认证
│   │       ├── chat/              # 聊天功能
│   │       ├── home/              # 首页
│   │       ├── library/           # 资料库（BookCard, StatusBadge 等）
│   │       ├── pipeline/          # 流水线操作
│   │       ├── models/            # 模型管理
│   │       ├── shared/            # 公共组件 (SidebarLayout, ResizeHandle, i18n, utils)
│   │       └── layout/            # 布局 (AppSidebar, AppLayout)
│   └── package.json
├── engine/                # 后端引擎 (FastAPI)
│   ├── adapters/          # 外部适配器
│   ├── api/routes/        # API 路由 (books, query, ingest, sync, chunks,
│   │                      #   pipeline_preview, reindex, questions, health)
│   ├── rag/               # RAG 核心
│   │   ├── strategies/    # 检索策略 (fts5_strategy 等)
│   │   ├── providers/     # LLM Provider 适配
│   │   ├── core.py        # 核心流程
│   │   ├── retrieval.py   # 检索
│   │   ├── generation.py  # 生成
│   │   ├── citation.py    # 引用
│   │   ├── fusion.py      # 融合
│   │   └── config.py      # RAG 配置
│   ├── ingest/            # 数据摄入 (pipeline, chunk_builder)
│   ├── index/             # 索引 (vector_builder, fts5_builder)
│   └── config.py          # 全局配置
├── scripts/               # 独立脚本
│   ├── rebuild_db.py      # 重建 Engine SQLite
│   ├── sync_to_payload.py # 同步到 Payload CMS
│   ├── build_vectors.py   # 重建向量索引
│   ├── init_books.py      # 初始化书籍
│   ├── rebuild_toc.py     # 重建目录
│   ├── rebuild_topic_index.py  # 重建主题索引
│   ├── build_pageindex.py # 构建页码索引
│   ├── batch_mineru.py    # 批量 MinerU 解析
│   └── ...                # 其他工具脚本
├── data/                  # 数据存储
│   ├── raw_pdfs/          # 原始 PDF (textbooks/, ecdev/, real_estate/)
│   ├── mineru_output/     # MinerU 解析输出
│   ├── chroma_persist/    # ChromaDB 向量持久化
│   ├── textbook_rag.sqlite3  # Engine SQLite 数据库
│   ├── payload.db         # Payload SQLite (本地开发)
│   └── topic_index.json   # 主题索引
└── .env                   # 环境变量
```
