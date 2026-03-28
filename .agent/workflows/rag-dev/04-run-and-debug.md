---
description: textbook-rag 启动运行与调试技巧
---

# 🚀 启动 / 运行

## 启动 Engine (FastAPI)

```powershell
# cwd: textbook-rag
uv run uvicorn engine.api.app:app --host 0.0.0.0 --port 8000 --reload
```

## 启动 Payload (Next.js)

```powershell
# cwd: textbook-rag/payload
npm run dev
```

## 环境检查

```powershell
# Engine health
Invoke-WebRequest -Uri 'http://localhost:8000/engine/health' -UseBasicParsing | Select-Object StatusCode

# Payload health
Invoke-WebRequest -Uri 'http://localhost:3000/api/books?limit=1' -UseBasicParsing | Select-Object StatusCode
```

## 数据重建

```powershell
# 重建 Engine SQLite (全量)
uv run python scripts/rebuild_db.py

# 重建单本书
uv run python scripts/rebuild_db.py --book ramalho_fluent_python

# 同步到 Payload CMS
uv run python scripts/sync_to_payload.py

# 回填子分类
uv run python scripts/sync_to_payload.py --fix-subcategory

# 重建向量
uv run python scripts/build_vectors.py
```

---

# 🔍 调试技巧

## 前端编译错误

```powershell
# cwd: textbook-rag/payload
npx tsc --noEmit                # 类型检查
npm run build                    # 完整构建
```

## Python 类型检查

```powershell
# cwd: textbook-rag
uv run python -m pyright engine/
```

## 查看 Payload 数据

```powershell
# 列出所有 books
Invoke-WebRequest -Uri 'http://localhost:3000/api/books?limit=100' -UseBasicParsing | ConvertFrom-Json | ConvertTo-Json -Depth 5

# 查看特定 book
Invoke-WebRequest -Uri 'http://localhost:3000/api/books?where[engineBookId][equals]=ramalho_fluent_python' -UseBasicParsing
```

## 查看 Engine SQLite

```powershell
uv run python -c "import sqlite3; conn = sqlite3.connect('data/textbook_rag.sqlite3'); print([r[0] for r in conn.execute('SELECT book_id FROM books').fetchall()])"
```
