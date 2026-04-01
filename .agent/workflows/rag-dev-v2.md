---
description: textbook-rag v2 开发工作流 — LlamaIndex-native 架构、Payload CMS (PostgreSQL)、全栈开发。使用 /rag-dev-v2 启动。
---

# Textbook RAG v2 开发工作流

适用于 textbook-rag v2 的日常开发，覆盖 Engine v2 (LlamaIndex + FastAPI)、Payload v2 (Payload 3 + Next.js + PostgreSQL)。

// turbo-all

---

## 🌍 全局规则（所有操作生效）

### Windows PowerShell 规范

- **Python 命令必须加 `uv run` 前缀**，禁止直接 `python`
- **禁止 `cd` 命令**，使用 `cwd` 参数
- **使用 PowerShell 语法**：`dir`/`Get-ChildItem`（不是 `ls`）、`Remove-Item`（不是 `rm`）
- **命令链接用 `;`**，禁止 `&&` 或 `||`

| 操作        | ✅ 用                     | ❌ 禁止            |
| ----------- | ------------------------- | ------------------ |
| 安装包      | `uv add package`          | `pip install`      |
| 运行 Python | `uv run python script.py` | `python script.py` |
| 列文件      | `dir` / `Get-ChildItem`   | `ls`               |
| 删除        | `Remove-Item`             | `rm`               |
| 切目录      | `cwd` 参数                | `cd`               |
| 链接命令    | `;`                       | `&&`               |

### 四层对齐规则（v2 核心约束）

**所有 LlamaIndex 对齐模块必须在四层中保持命名一致：**

| 层 | 描述 | 命名规则 |
|----|------|----------|
| L1 | `llama_index.core.*` | 原始模块名 |
| L2 | `engine_v2/` 子包 | = L1 模块名 |
| L3 | `features/engine/` 子目录 + 路由路径 | = L2 子包名 |
| L4 | i18n key + AppSidebar `titleKey` | `nav` + PascalCase(L2 子包名) |

**L4 显示名规则**: Sidebar 显示名 = LlamaIndex 模块名的可读形式 (英文保持不变，中文也用英文模块名)。

**四层对齐表:**

| # | LlamaIndex Module | engine_v2/ | features/engine/ | Route | i18n Key | 显示名 |
|---|-------------------|------------|------------------|-------|----------|--------|
| 1 | `core.node_parser` | `chunking/` ★ | `chunking/` | `/engine/chunking` | `navChunking` | Chunking |
| 2 | `core.embeddings` | `embeddings/` | `embeddings/` | `/engine/embeddings` | `navEmbeddings` | Embeddings |
| 3 | *(project)* | `toc/` | `toc/` | `/engine/toc` | `navToc` | TOC |
| 4 | `core.readers` | `readers/` | `readers/` | `/readers` | `navReaders` | Readers |
| 5 | `core.ingestion` | `ingestion/` | `ingestion/` | `/engine/ingestion` | `navIngestion` | Ingestion |
| 6 | `core.retrievers` | `retrievers/` | `retrievers/` | `/engine/retrievers` | `navRetrievers` | Retrievers |
| 7 | `core.response_synthesizers` | `response_synthesizers/` | `response_synthesizers/` | `/engine/response_synthesizers` | `navResponseSynthesizers` | Response Synthesizers |
| 8 | `core.query_engine` | `query_engine/` | `query_engine/` | `/engine/query_engine` | `navQueryEngine` | Query Engine |
| 9 | `core.llms` | `llms/` | `llms/` | `/engine/llms` | `navLlms` | LLMs |
| 10 | `core.evaluation` | `evaluation/` | `evaluation/` | `/engine/evaluation` | `navEvaluation` | Evaluation |
| 11 | `core.question_gen` | `question_gen/` | `question_gen/` | `/engine/question_gen` | `navQuestionGen` | Question Gen |

> ★ `chunking` 是 `core.node_parser` 的别名（convention over alignment — 业界通用叫法）。

**非 LlamaIndex 对齐页面 (project-specific):**

| 模块 | Route | 说明 |
|------|-------|------|
| analytics | `/engine/analytics` | 使用统计 (project-specific) |
| feedback | `/engine/feedback` | 反馈管理 (project-specific) |
| chat | `/chat` | 聊天主页面 |
| seed | `/seed` | 数据初始化 |
| settings | `/settings` | 用户设置 |

> **新增模块时**: 必须同时创建 L2 子包 + L3 feature 子目录 + L3 路由页面 + L4 i18n key + L4 AppSidebar entry。缺一不可。

### Engine v2 API 路由映射 (FastAPI → 前端调用)

**router prefix 规则**: 对齐 LlamaIndex 的子模块带 prefix 挂载。前端调用时必须包含 prefix。

| FastAPI Router | prefix | 实际路径示例 | 前端调用 URL |
|----------------|--------|--------------|--------------|
| `health.router` | `/engine` | `GET /engine/health` | `${ENGINE}/engine/health` |
| `books.router` | `/engine` | `GET /engine/books/{id}/toc` | `${ENGINE}/engine/books/{id}/toc` |
| `query.router` | `/engine` | `POST /engine/query` | `${ENGINE}/engine/query` |
| `ingest.router` | `/engine` | `POST /engine/ingest` | `${ENGINE}/engine/ingest` |
| `questions.router` | `/engine` | `POST /engine/questions/generate` | `${ENGINE}/engine/questions/generate` |
| `llms.router` | `/engine` + `/llms` | `GET /engine/llms/models` | `${ENGINE}/engine/llms/models` |
| | | `GET /engine/llms/providers` | `${ENGINE}/engine/llms/providers` |
| `retrievers.router` | `/engine` | `POST /engine/retrievers/search` | `${ENGINE}/engine/retrievers/search` |
| `evaluation.router` | `/engine` | `POST /engine/evaluation/single` | `${ENGINE}/engine/evaluation/single` |

> ⚠️ `llms.router` 自带 `prefix="/llms"`，所以最终路径是 `/engine/llms/...`，不是 `/engine/models`。前端 API 文件中的 URL 必须与此表一致。

### 代码质量底线

- 函数 ≤ 50 行，文件 ≤ 800 行，嵌套 ≤ 4 层
- 不可变模式优先（创建新对象，不修改原对象）
- 无 magic number，无 console.log，无硬编码密钥
- Engine v2: docstring 对齐 LlamaIndex 模块（`"""Aligns with llama_index.core.xxx."""`）
- Payload v2: 使用语义 Tailwind token（`bg-card` 不是 `bg-gray-800`）

### 已知坑 (Known Gotchas)

| 坑 | 触发条件 | 解决方案 |
|----|----------|----------|
| BM25 空语料崩溃 | ChromaDB collection 为空时调用 `BM25Retriever.from_defaults()` | `hybrid.py` 已加 `collection.count()` 前置检查，自动降级 vector-only 模式 |
| 前端 404 路由不匹配 | 前端用 `/engine/models` 但后端是 `/engine/llms/models` | 前端 API 文件 URL 必须包含 router prefix (见路由映射表) |
| `NEXT_PUBLIC_ENGINE_URL` 未设置 | Payload v2 前端调用 Engine API | 默认 `http://localhost:8000`，v2 应改为 `http://localhost:8001` |

### 代码溯源（Textbook + Source Code）

**所有生成的代码必须有来源依据。** 来源分两类：

**A. 教科书溯源** — 算法、设计模式、架构决策
1. 加载映射: `.agent/config/textbook-skill-mapping.yaml`
2. 查阅来源: `textbooks/topic_index.json` → `data/mineru_output/{book_key}/...`
3. 引用标注: `# Ref: Author, Book, ChN — concept`

**B. 源码溯源** — LlamaIndex API 用法、Payload CMS 模式、框架惯例
1. 查阅参考仓库: `.github/references/`
   - `llama_index/` — LlamaIndex 官方源码 (核心 API、基类接口)
   - `payload/` — Payload CMS 官方源码 (Collection 模式、hooks)
   - `react/`, `vite/`, `tailwindcss/` 等 — 前端框架参考
2. 引用标注: `# Ref: llama_index.core.retrievers.fusion_retriever — QueryFusionRetriever`
3. 对 engine_v2 模块，优先查阅 LlamaIndex 源码确认 API 签名再编码

**无来源不生成** — 如果教科书和参考源码中均找不到依据，明确告知用户。

---

## 📂 工作流子文件索引

本工作流由多个子文件组成，按需查阅：

| 文件 | 内容 | 何时查阅 |
|------|------|---------|
| [01-project-structure.md](./rag-dev-v2/01-project-structure.md) | v2 项目结构速查 | 了解代码在哪、模块划分 |
| [02-architecture.md](./rag-dev-v2/02-architecture.md) | LlamaIndex 四层对齐架构 | 理解模块命名规范、数据流、i18n 对齐 |
| [03-core-rules.md](./rag-dev-v2/03-core-rules.md) | 核心开发规则 | 开发任何功能前必读 |
| [04-dev-procedures.md](./rag-dev-v2/04-dev-procedures.md) | 开发流程模板 | 新增 Engine/Payload 功能 |
| [05-run-and-debug.md](./rag-dev-v2/05-run-and-debug.md) | 启动运行与调试 | 启动服务、重建数据、调试问题 |
| [06-llamaindex-reference.md](./rag-dev-v2/06-llamaindex-reference.md) | LlamaIndex 参考速查 | 查找 llama_index.core.* API |
| [07-roadmap.md](./rag-dev-v2/07-roadmap.md) | v2 演进路线 | 规划下一步功能 |
| [08-self-update.md](./rag-dev-v2/08-self-update.md) | 工作流自更新规则 | 项目变更后同步工作流 |

---

## 🔑 快速开始

1. **首次开发**: 先阅读 `01-project-structure.md`、`02-architecture.md`、`03-core-rules.md`
2. **新增功能**: 参考 `04-dev-procedures.md` 的模板
3. **启动调试**: 查看 `05-run-and-debug.md`
4. **查 API**: 参考 `06-llamaindex-reference.md`
5. **规划方向**: 参考 `07-roadmap.md`

---

## 🚀 端口速查

| 服务 | 端口 | 命令 |
|------|------|------|
| Engine v2 | **8001** | `uv run python -m uvicorn engine_v2.api.app:app --reload --host 127.0.0.1 --port 8001` |
| Payload v2 | **3001** | `npm run dev -- --port 3001` (cwd: `payload-v2`) |
| PostgreSQL | 5432 | `postgresql://payload:payload@127.0.0.1:5432/payload` |
| Ollama | 11434 | `http://127.0.0.1:11434` |

## 📦 Git 提交规范

```
feat: add pipeline dashboard with book selector
fix: move Ready badge to bottom-right of BookCard
refactor: extract PipelineDashboard to features/pipeline
chore: update rag-dev-v2 workflow (auto-sync)
```

### 提交前检查清单

1. `npx tsc --noEmit` (在 payload-v2/ 目录)
2. `uv run ruff check engine_v2/`
3. 确认 i18n messages 完整 (四层对齐)
4. page.tsx 只是薄壳
5. 新组件已加入 barrel export (features/engine/index.ts)
