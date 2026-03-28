---
description: textbook-rag 项目开发工作流 — 新增功能、修改组件、调试运行。使用 /rag-dev 启动。
---

# Textbook RAG 开发工作流

适用于 textbook-rag 项目的日常开发操作，覆盖前端(Payload/Next.js)、后端(Engine/FastAPI)、数据(SQLite/ChromaDB)三层。

// turbo-all

---

## 📂 工作流文件索引

本工作流由多个子文件组成，按需查阅：

| 文件 | 内容 | 何时查阅 |
|------|------|---------| 
| [01-project-structure.md](./01-project-structure.md) | 项目结构速查 | 了解代码在哪、模块划分 |
| [02-core-rules.md](./02-core-rules.md) | 核心开发规则 | 开发任何功能前必读 |
| [03-dev-procedures.md](./03-dev-procedures.md) | 开发流程模板 | 新增前端/后端功能、修改数据字段 |
| [04-run-and-debug.md](./04-run-and-debug.md) | 启动运行与调试 | 启动服务、重建数据、调试问题 |
| [05-git-conventions.md](./05-git-conventions.md) | Git 提交规范 | 提交代码前检查 |
| [06-agentic-rag-roadmap.md](./06-agentic-rag-roadmap.md) | Agentic RAG 演进路线 | 规划下一步功能、架构升级 |
| [07-self-update.md](./07-self-update.md) | 工作流自更新规则 | 项目变更后同步工作流 |
| [data/README.md](../../data/README.md) | 数据层文档 | 操作数据/数据库/页码约定 |

---

## 🔑 快速开始

1. **首次开发**: 先阅读 `01-project-structure.md`、`02-core-rules.md` 和 `data/README.md`
2. **新增功能**: 参考 `03-dev-procedures.md` 的模板
3. **启动调试**: 查看 `04-run-and-debug.md`
4. **提交代码**: 按 `05-git-conventions.md` 检查
5. **规划方向**: 参考 `06-agentic-rag-roadmap.md`
