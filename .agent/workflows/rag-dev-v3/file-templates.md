# Textbook-RAG v2 — 文件模板

> 本文档提供项目中 **每种文件类型** 的标准模板。
> 新增文件时直接复制对应模板，替换尖括号占位符即可。
> 文件角色与命名规则详见 [`project-structure.md`](./project-structure.md)。

---

## 一、Python 层

### 1.1 `engine_v2/<module>/__init__.py` — 功能模块入口

```python
"""<Module> — <一句话描述>.

Public API:
    <ClassName>   — <用途>
    <function>    — <用途>
"""

from .<impl> import <ClassName>, <function>

__all__ = ["<ClassName>", "<function>"]
```

### 1.2 `engine_v2/<module>/<impl>.py` — 模块实现

```python
"""<impl> — <一句话描述>.

Responsibilities:
    - <职责 1>
    - <职责 2>
"""


from __future__ import annotations

from typing import TYPE_CHECKING

from loguru import logger

if TYPE_CHECKING:
    pass  # type-only imports

from engine_v2.settings import settings

# ============================================================
# Implementation
# ============================================================
class <ClassName>:
    """<ClassName> — <一句话描述>."""

    def __init__(self) -> None:
        logger.info("<ClassName> initialized")

    def <method>(self) -> None:
        """<一句话描述>."""
        logger.debug("<method> called")
        # TODO: implement
        logger.info("<method> completed")
```

### 1.3 `engine_v2/__init__.py` — 根包入口

> 本文件已固定，不可新增。模板仅供参考。

```python
"""engine_v2 — Textbook-RAG v2 引擎包.

Exposes package version for runtime introspection.
"""

__version__ = "0.1.0"
```

### 1.4 `engine_v2/schema.py` — 领域模型

> 本文件已固定，不可新增。模板仅供参考。

```python
"""schema — 领域模型 (Pydantic BaseModel 定义).

Usage:
    from engine_v2.schema import BookMeta, RAGResponse
"""


from __future__ import annotations

from pydantic import BaseModel, Field


# ============================================================
# Domain models
# ============================================================
class <ModelName>(BaseModel):
    """<ModelName> — <一句话描述>."""

    id: str = Field(..., description="<描述>")
    # TODO: define fields
```

### 1.5 `engine_v2/errors.py` — 自定义异常层级

> 本文件已固定，不可新增。模板仅供参考。

```python
"""errors — 自定义异常层级.

All engine exceptions inherit from EngineError.
"""


# ============================================================
# Base
# ============================================================
class EngineError(Exception):
    """Base exception for all engine errors."""


# ============================================================
# Subclasses
# ============================================================
class <Specific>Error(EngineError):
    """<一句话描述>."""
```

### 1.6 `engine_v2/settings.py` — 全局配置单例

> 本文件已固定，不可新增。模板仅供参考。

```python
"""settings — 全局配置单例 (环境变量、模型参数、路径).

Usage:
    from engine_v2.settings import settings
    settings.data_dir
    settings.embedding_model
"""

from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """全局配置 — 自动从 .env 和环境变量加载."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ============================================================
    # Data paths
    # ============================================================
    data_dir: Path = Path("data")
    chroma_persist_dir: Path = Path("data/chroma_persist")
    mineru_output_dir: Path = Path("data/mineru_output")

    # ============================================================
    # Model config
    # ============================================================
    embedding_model: str = "all-MiniLM-L6-v2"
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "qwen3.5:4b"

    # ============================================================
    # Engine API
    # ============================================================
    engine_host: str = "0.0.0.0"
    engine_port: int = 8000
    cors_origins: list[str] = ["http://localhost:3000"]

    # ============================================================
    # Payload CMS
    # ============================================================
    payload_url: str = "http://localhost:3000"

    # ============================================================
    # RAG defaults
    # ============================================================
    top_k: int = 5
    chroma_collection: str = "textbook_chunks"


# ============================================================
# Singleton
# ============================================================
settings = Settings()


# ============================================================
# Init function
# ============================================================
def init_settings() -> None:
    """Initialise LlamaIndex global Settings singleton.

    Call once at startup (in api/app.py lifespan or script entry).
    """
    from llama_index.core.settings import Settings as LlamaSettings

    from engine_v2.embeddings import resolve_embed_model
    from engine_v2.llms.resolver import resolve_llm

    LlamaSettings.embed_model = resolve_embed_model()
    LlamaSettings.llm = resolve_llm()
```

### 1.7 `engine_v2/api/routes/<resource>.py` — API 路由

```python
"""<resource> routes — <Resource> CRUD endpoints.

Endpoints:
    GET    /api/<resource>          — list all
    GET    /api/<resource>/{id}     — get by id
    POST   /api/<resource>          — create
"""


from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger

from engine_v2.api.deps import <dependency>
from engine_v2.schema import <Schema>

# ============================================================
# Router
# ============================================================
router = APIRouter(prefix="/<resource>", tags=["<resource>"])

# ============================================================
# Endpoints
# ============================================================
@router.get("/")
async def list_<resource>() -> list[<Schema>]:
    """List all <resource>."""
    logger.info("Listing <resource>")
    # TODO: implement
    logger.debug("Listed {} <resource>", len(result))
    ...


@router.get("/{<resource>_id}")
async def get_<resource>(<resource>_id: str) -> <Schema>:
    """Get a single <resource> by ID."""
    logger.info("Fetching <resource> {}", <resource>_id)
    # TODO: implement
    ...
```

### 1.8 `engine_v2/api/middleware/<concern>.py` — 中间件

```python
"""<concern> middleware — <一句话描述>.

Handles: <横切关注点说明>
"""


from __future__ import annotations

from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


# ============================================================
# Middleware
# ============================================================
class <Concern>Middleware(BaseHTTPMiddleware):
    """<Concern> — <一句话描述>."""

    async def dispatch(self, request: Request, call_next) -> Response:

        # ======================================================
        # Before
        # ======================================================
        logger.debug("{} {}", request.method, request.url.path)

        response = await call_next(request)

        # ======================================================
        # After
        # ======================================================
        logger.debug("Response status: {}", response.status_code)
        return response
```

### 1.9 `scripts/<verb>_<noun>.py` — 独立脚本

```python
"""<verb>_<noun> — <一句话描述>.

Usage:
    python -m scripts.<verb>_<noun> [--flag]
"""


from __future__ import annotations

import argparse
import sys

from loguru import logger


# ============================================================
# Main
# ============================================================
def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description="<描述>")
    # parser.add_argument("--flag", ...)
    args = parser.parse_args()

    logger.info("Starting <verb>_<noun> ...")
    # TODO: implement
    logger.info("Done.")


# ============================================================
# Entry point
# ============================================================
if __name__ == "__main__":
    main()
```

---

## 二、Payload CMS 层

### 2.1 `collections/<CollectionName>.ts` — Collection 定义

```typescript
/**
 * <CollectionName> Collection — <一句话描述>.
 *
 * Slug: <collection-slug>
 */

import type { CollectionConfig } from 'payload'

// ============================================================
// Config
// ============================================================
export const <CollectionName>: CollectionConfig = {
  slug: '<collection-slug>',
  labels: {
    singular: '<显示名 (单数)>',
    plural: '<显示名 (复数)>',
  },
  admin: {
    useAsTitle: '<title-field>',
    defaultColumns: ['<field1>', '<field2>', 'updatedAt'],
  },

  // ============================================================
  // Fields
  // ============================================================
  fields: [
    {
      name: '<field1>',
      type: 'text',
      required: true,
    },
    {
      name: '<field2>',
      type: 'text',
    },
  ],
}
```

### 2.2 `collections/endpoints/<endpoint-name>.ts` — 自定义端点

```typescript
/**
 * <endpoint-name> — <一句话描述>.
 *
 * Route: GET /api/<collection>/<endpoint-name>
 */

import type { PayloadHandler } from 'payload'

// ============================================================
// Handler
// ============================================================
export const <endpointName>Handler: PayloadHandler = async (req, res) => {
  try {
    const { payload } = req

    // TODO: implement
    const result = {}

    return res.json(result)
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
```

### 2.3 `collections/endpoints/index.ts` — Barrel Export

```typescript
/**
 * Custom endpoints — barrel export.
 */

export { <endpointName>Handler } from './<endpoint-name>'
```

### 2.4 `hooks/<collection>/<lifecycle>.ts` — 生命周期钩子

```typescript
/**
 * <lifecycle> hook for <Collection> — <一句话描述>.
 *
 * Trigger: <afterChange | beforeValidate | ...>
 */

import type { CollectionAfterChangeHook } from 'payload'

// ============================================================
// Hook
// ============================================================
export const <lifecycle>: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation === 'create') {
    // TODO: implement
  }

  return doc
}
```

### 2.5 `access/is<Role>.ts` — 访问控制策略

```typescript
/**
 * is<Role> — <一句话描述>.
 *
 * Returns true if the requesting user has the <Role> role.
 */

import type { Access } from 'payload'

// ============================================================
// Access control
// ============================================================
export const is<Role>: Access = ({ req: { user } }) => {
  return user?.role === '<role>'
}
```

### 2.6 `seed/<data-source>.ts` — 预置数据源

```typescript
/**
 * <data-source> seed — <一句话描述>.
 *
 * Populates: <Collection> collection
 */

import type { Payload } from 'payload'
import type { SeedEntry } from './types'

// ============================================================
// Data
// ============================================================
export const <dataSource>Data: SeedEntry[] = [
  {
    // TODO: define seed entries
  },
]

// ============================================================
// Seeder
// ============================================================
export async function seed<DataSource>(payload: Payload): Promise<void> {
  for (const entry of <dataSource>Data) {
    await payload.create({
      collection: '<collection-slug>',
      data: entry,
    })
  }
}
```

---

## 三、React 前端层

### 3.1 `app/(frontend)/<page>/page.tsx` — 路由页面 (薄壳)

```tsx
/**
 * /<page> — <一句话描述>.
 *
 * Thin shell: only imports and renders the feature page component.
 */

import { <Feature>Page } from '@/features/<feature>/<Feature>Page'

// ============================================================
// Page
// ============================================================
export default function Page() {
  return <<Feature>Page />
}
```

### 3.2 `app/(frontend)/<page>/[<paramId>]/page.tsx` — 动态路由页面

```tsx
/**
 * /<page>/[<paramId>] — <一句话描述>.
 *
 * Thin shell: passes route params to the feature page component.
 */

import { <Feature>DetailPage } from '@/features/<feature>/<Feature>DetailPage'

// ============================================================
// Types
// ============================================================
interface PageProps {
  params: Promise<{ <paramId>: string }>
}

// ============================================================
// Page
// ============================================================
export default async function Page({ params }: PageProps) {
  const { <paramId> } = await params
  return <<Feature>DetailPage <paramId>={<paramId>} />
}
```

### 3.3 `features/providers/<Name>Provider.tsx` — 全局 Provider

```tsx
/**
 * <Name>Provider — <一句话描述>.
 *
 * Provides: <Name>Context
 */

'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

// ============================================================
// Context
// ============================================================
interface <Name>ContextValue {
  // TODO: define context shape
}

const <Name>Context = createContext<<Name>ContextValue | null>(null)

// ============================================================
// Hook
// ============================================================
export function use<Name>(): <Name>ContextValue {
  const ctx = useContext(<Name>Context)
  if (!ctx) throw new Error('use<Name> must be used within <Name>Provider')
  return ctx
}

// ============================================================
// Provider
// ============================================================
interface <Name>ProviderProps {
  children: ReactNode
}

export function <Name>Provider({ children }: <Name>ProviderProps) {
  // TODO: implement state

  return (
    <<Name>Context.Provider value={{}}>
      {children}
    </<Name>Context.Provider>
  )
}
```

### 3.4 `features/providers/<Name>Context.tsx` — 独立 Context

```tsx
/**
 * <Name>Context — <一句话描述>.
 *
 * Provides: <Name>Context (read-only context, separated from Provider)
 */

'use client'

import { createContext, useContext } from 'react'

// ============================================================
// Context
// ============================================================
export interface <Name>ContextValue {
  // TODO: define context shape
}

export const <Name>Context = createContext<<Name>ContextValue | null>(null)

// ============================================================
// Hook
// ============================================================
export function use<Name>(): <Name>ContextValue {
  const ctx = useContext(<Name>Context)
  if (!ctx) throw new Error('use<Name> must be used within <Name>Provider')
  return ctx
}
```

### 3.5 `features/providers/Providers.tsx` — 组合根

> 本文件已固定，不可新增。模板仅供参考。

```tsx
/**
 * Providers — 组合根，嵌套所有全局 Provider.
 *
 * Mounted once in app/(frontend)/layout.tsx.
 */

'use client'

import { type ReactNode } from 'react'

// ============================================================
// Component
// ============================================================
interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    // Nest providers inside-out (innermost = closest to children)
    <>{children}</>
  )
}
```

### 3.6 `features/providers/messages.ts` — i18n 翻译字典

> 本文件已固定，不可新增。模板仅供参考。

```typescript
/**
 * messages — i18n 翻译字典.
 *
 * Centralises all UI strings for future localisation.
 */

// ============================================================
// Messages
// ============================================================
export const messages = {
  common: {
    loading: '加载中…',
    error: '出错了',
    retry: '重试',
    save: '保存',
    cancel: '取消',
    confirm: '确认',
  },
  // TODO: add feature-specific message groups
} as const

export type Messages = typeof messages
```

### 3.7 `features/shared/types.ts` — 全局类型定义

> 本文件已固定，不可新增。模板仅供参考。

```typescript
/**
 * types — 全局共享类型定义.
 *
 * Only domain-agnostic, cross-feature types belong here.
 */

// ============================================================
// Common types
// ============================================================

/** Generic loading state tuple. */
export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/** Sidebar navigation item. */
export interface NavItem {
  label: string
  href: string
  icon?: string
}
```

### 3.8 `features/shared/utils.ts` — 纯工具函数

> 本文件已固定，不可新增。模板仅供参考。

```typescript
/**
 * utils — 纯工具函数 (无业务逻辑).
 *
 * Only stateless, side-effect-free helpers belong here.
 */

// ============================================================
// Class names
// ============================================================

/** Merge class names (falsy values are filtered out). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ============================================================
// Formatting
// ============================================================

/** Format a date string to locale display. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN')
}
```

### 3.9 `features/shared/hooks/use<Name>.ts` — 共享 Hook

```typescript
/**
 * use<Name> — <一句话描述>.
 *
 * Usage: const { <value> } = use<Name>(<params>)
 */

'use client'

import { useState, useEffect } from 'react'

// ============================================================
// Types
// ============================================================
interface Use<Name>Options {
  // TODO: define options
}

interface Use<Name>Return {
  data: unknown
  loading: boolean
  error: Error | null
}

// ============================================================
// Hook
// ============================================================
export function use<Name>(options?: Use<Name>Options): Use<Name>Return {

  // ==========================================================
  // State
  // ==========================================================
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // ==========================================================
  // Effects
  // ==========================================================
  useEffect(() => {
    // TODO: implement async logic
    setLoading(true)
    setError(null)
    Promise.resolve()
      .then(() => {
        // TODO: fetch / compute
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false))
  }, [])

  // ==========================================================
  // Return
  // ==========================================================
  return { data, loading, error }
}
```

### 3.10 `features/shared/config/<name>.ts` — 前端配置

```typescript
/**
 * <name> — <一句话描述>.
 *
 * Runtime configuration constants for <concern>.
 */

// ============================================================
// Config
// ============================================================
export const <name>Config = {
  // TODO: define config values
} as const

export type <Name>Config = typeof <name>Config
```

### 3.11 `features/shared/lib/<library>.ts` — 第三方库封装

```typescript
/**
 * <library> — <Library> wrapper / adapter.
 *
 * Isolates external dependency for easy replacement.
 */

import { <something> } from '<library-package>'

// ============================================================
// Wrapper
// ============================================================
// Re-export with project-specific defaults
export const <wrappedName> = <something>({
  // project-specific config
})

// ============================================================
// Re-exports
// ============================================================
export type { <RelevantType> } from '<library-package>'
```

### 3.12 `features/shared/components/<ComponentName>.tsx` — 通用组件

```tsx
/**
 * <ComponentName> — <一句话描述>.
 *
 * Usage: <<ComponentName> prop={value} />
 */

'use client'

import { type ReactNode } from 'react'

// ============================================================
// Types
// ============================================================
interface <ComponentName>Props {
  children?: ReactNode
  // TODO: define props
}

// ============================================================
// Component
// ============================================================
export function <ComponentName>({ children }: <ComponentName>Props) {
  return (
    <div>
      {children}
    </div>
  )
}
```

### 3.13 `features/shared/components/ui/<component-name>.tsx` — 原子 UI 组件

```tsx
/**
 * <component-name> — <一句话描述>.
 *
 * Atomic UI component (shadcn/ui style).
 */

'use client'

import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from '@/features/shared/utils'

// ============================================================
// Types
// ============================================================
interface <ComponentName>Props extends ComponentPropsWithoutRef<'div'> {
  // TODO: define custom props
}

// ============================================================
// Component
// ============================================================
export const <ComponentName> = forwardRef<<HTMLDivElement>, <ComponentName>Props>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('<base-classes>', className)}
        {...props}
      />
    )
  }
)
<ComponentName>.displayName = '<ComponentName>'
```

### 3.14 `features/shared/components/charts/<chart-type>.tsx` — 图表组件

```tsx
/**
 * <chart-type> — <一句话描述>.
 *
 * Usage: <<ChartType> data={data} />
 */

'use client'

// ============================================================
// Types
// ============================================================
interface <ChartType>Props {
  data: unknown[]
  // TODO: define props
}

// ============================================================
// Component
// ============================================================
export function <ChartType>({ data }: <ChartType>Props) {
  return (
    <div className="chart-container">
      {/* TODO: implement chart rendering */}
    </div>
  )
}
```

### 3.15 `features/shared/api/client.ts` — 统一 fetch 封装

> 本文件已固定，不可新增。模板仅供参考。

```typescript
/**
 * client — 统一 fetch 封装 (base URL / 错误处理 / 拦截).
 *
 * Usage:
 *   import { engineClient, payloadClient } from '@/features/shared/api/client'
 *   const data = await engineClient.get<BookList>('/books')
 */

import type { ApiError } from './types'

// ============================================================
// Base URLs
// ============================================================
const ENGINE_BASE = process.env.NEXT_PUBLIC_ENGINE_URL || 'http://localhost:8000'
const PAYLOAD_BASE = '' // same-origin, proxied by Next.js

// ============================================================
// Core request function
// ============================================================
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

// ============================================================
// Client factory
// ============================================================
function createClient(base: string) {
  return {
    get: <T>(path: string) => request<T>(`${base}${path}`),
    post: <T>(path: string, data: unknown) =>
      request<T>(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    put: <T>(path: string, data: unknown) =>
      request<T>(`${base}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    del: <T>(path: string) =>
      request<T>(`${base}${path}`, { method: 'DELETE' }),
  }
}

// ============================================================
// Exports
// ============================================================

/** Engine FastAPI 客户端 (Python 后端). */
export const engineClient = createClient(ENGINE_BASE)

/** Payload CMS 客户端 (same-origin). */
export const payloadClient = createClient(PAYLOAD_BASE)
```

### 3.16 `features/shared/api/types.ts` — API 层类型

> 本文件已固定，不可新增。模板仅供参考。

```typescript
/**
 * API types — 分页、错误响应等通用类型.
 */

// ============================================================
// Pagination
// ============================================================

/** Payload CMS 分页响应. */
export interface PaginatedResponse<T> {
  docs: T[]
  totalDocs: number
  totalPages: number
  page: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// ============================================================
// Error
// ============================================================

/** API 错误响应. */
export interface ApiError {
  status: number
  message: string
  errors?: Array<{ field: string; message: string }>
}
```

### 3.17 `features/layout/App<Part>.tsx` — App Shell 组件

```tsx
/**
 * App<Part> — <一句话描述>.
 *
 * Part of the App Shell (layout layer).
 */

'use client'

import { type ReactNode } from 'react'

// ============================================================
// Types
// ============================================================
interface App<Part>Props {
  children?: ReactNode
}

// ============================================================
// Component
// ============================================================
export function App<Part>({ children }: App<Part>Props) {
  return (
    <div className="app-<part>">
      {children}
    </div>
  )
}
```

### 3.18 `features/<feature>/<Feature>Page.tsx` — 功能页面组件

```tsx
/**
 * <Feature>Page — <一句话描述>.
 *
 * Route: /<feature>
 * Layout: uses SidebarLayout / standalone
 */

'use client'

// ============================================================
// Component
// ============================================================
export function <Feature>Page() {
  return (
    <div className="<feature>-page">
      <h1><Feature></h1>
      {/* TODO: implement page content */}
    </div>
  )
}
```

### 3.19 `features/<feature>/types.ts` — 模块类型

```typescript
/**
 * <feature> types — <一句话描述>.
 *
 * Type definitions scoped to the <feature> module.
 */

// ============================================================
// Domain types
// ============================================================

/** <一句话描述>. */
export interface <Entity> {
  id: string
  // TODO: define fields
}
```

### 3.20 `features/engine/<engine-module>/index.ts` — Engine 模块入口

```typescript
/**
 * <engine-module> — barrel export.
 *
 * This is the ONLY public API surface for this module.
 */

// ============================================================
// Exports
// ============================================================
export { <Feature>Page } from './components/<Feature>Page'
export type { <Type> } from './types'
```

### 3.21 `features/engine/<engine-module>/types.ts` — Engine 模块类型

```typescript
/**
 * <engine-module> types — <一句话描述>.
 *
 * Shared type definitions for the <engine-module> module.
 */

// ============================================================
// Domain types
// ============================================================

/** Represents a single <entity>. */
export interface <Entity> {
  id: string
  // TODO: define fields
  createdAt: string
  updatedAt: string
}

// ============================================================
// API types
// ============================================================

/** API response shape for <entity> list. */
export interface <Entity>ListResponse {
  items: <Entity>[]
  total: number
}
```

### 3.22 `features/engine/<engine-module>/api.ts` — Engine API 调用

```typescript
/**
 * <engine-module> API — <一句话描述>.
 *
 * All API calls for the <engine-module> module.
 * Uses shared/api/client for unified fetch.
 */

import { engineClient, payloadClient } from '@/features/shared/api/client'
import type { PaginatedResponse } from '@/features/shared/api/types'
import type { <Entity> } from './types'

// ============================================================
// Payload CMS (same-origin)
// ============================================================

/** Fetch all <entities> from Payload CMS. */
export async function fetch<Entities>(opts?: {
  limit?: number
  page?: number
}): Promise<{ items: <Entity>[]; total: number }> {
  const params = new URLSearchParams()
  params.set('limit', String(opts?.limit ?? 200))
  params.set('sort', '-updatedAt')
  if (opts?.page) params.set('page', String(opts.page))

  const data = await payloadClient.get<PaginatedResponse<<Entity>>>(
    `/api/<resource>?${params}`
  )
  return { items: data.docs, total: data.totalDocs }
}

/** Fetch a single <entity> by Payload ID. */
export async function fetch<Entity>(id: number): Promise<<Entity>> {
  return payloadClient.get<<Entity>>(`/api/<resource>/${id}`)
}

// ============================================================
// Engine FastAPI (cross-origin)
// ============================================================

/** Trigger <action> via Engine backend. */
export async function trigger<Action>(data: unknown): Promise<unknown> {
  return engineClient.post<unknown>('/engine/<resource>/<action>', data)
}
```

### 3.23 `features/engine/<engine-module>/use<Name>.ts` — Engine 自定义 hook

```typescript
/**
 * use<Name> — <一句话描述>.
 *
 * Usage: const { items, loading, error } = use<Name>()
 */

'use client'

import { useState, useEffect } from 'react'
import { fetch<Entities> } from './api'
import type { <Entity> } from './types'

// ============================================================
// Hook
// ============================================================
export function use<Name>() {

  // ==========================================================
  // State
  // ==========================================================
  const [items, setItems] = useState<<Entity>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // ==========================================================
  // Effects
  // ==========================================================
  useEffect(() => {
    fetch<Entities>()
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false))
  }, [])

  // ==========================================================
  // Return
  // ==========================================================
  return { items, loading, error }
}
```

### 3.24 `features/engine/<engine-module>/<Name>Context.tsx` — Engine 模块级 Context

```tsx
/**
 * <Name>Context — <一句话描述>.
 *
 * Module-scoped context for the <engine-module> module.
 */

'use client'

import { createContext, useContext, type ReactNode } from 'react'

// ============================================================
// Context
// ============================================================
interface <Name>ContextValue {
  // TODO: define context shape
}

const <Name>Context = createContext<<Name>ContextValue | null>(null)

// ============================================================
// Hook
// ============================================================
export function use<Name>(): <Name>ContextValue {
  const ctx = useContext(<Name>Context)
  if (!ctx) throw new Error('use<Name> must be used within <Name>Provider')
  return ctx
}

// ============================================================
// Provider
// ============================================================
interface <Name>ProviderProps {
  children: ReactNode
}

export function <Name>Provider({ children }: <Name>ProviderProps) {
  // TODO: implement state

  return (
    <<Name>Context.Provider value={{}}>
      {children}
    </<Name>Context.Provider>
  )
}
```

### 3.25 `features/engine/<engine-module>/components/<Feature>Page.tsx` — Engine 页面

```tsx
/**
 * <Feature>Page — <一句话描述>.
 *
 * Route: /engine/<module>
 */

'use client'

import { useState, useEffect } from 'react'
import { fetch<Entities> } from '../api'
import type { <Entity> } from '../types'

// ============================================================
// Component
// ============================================================
export function <Feature>Page() {

  // ==========================================================
  // State
  // ==========================================================
  const [items, setItems] = useState<<Entity>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // ==========================================================
  // Effects
  // ==========================================================
  useEffect(() => {
    fetch<Entities>()
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false))
  }, [])

  // ==========================================================
  // Render
  // ==========================================================
  if (loading) return <div>Loading...</div>
  if (error) throw error

  return (
    <div>
      <h1><Feature></h1>
      {/* TODO: render items */}
    </div>
  )
}
```

---

## 四、使用说明

### 占位符替换表

| 占位符                | 含义            | 命名规则                             | 示例                                |
| --------------------- | --------------- | ------------------------------------ | ----------------------------------- |
| `<module>`          | Python 功能模块 | snake_case                           | `chunking`, `embeddings`        |
| `<impl>`            | Python 实现文件 | snake_case                           | `mineru_reader`, `chroma_store` |
| `<resource>`        | API 资源名      | snake_case (与 Collection slug 对齐) | `books`, `chunks`               |
| `<concern>`         | 中间件关注点    | snake_case                           | `error_handler`, `cors`         |
| `<verb>_<noun>`     | 脚本名          | snake_case                           | `sync_books`, `build_index`     |
| `<CollectionName>`  | Collection 名   | PascalCase                           | `Books`, `Chunks`               |
| `<collection-slug>` | Collection slug | kebab-case                           | `books`, `chunks`               |
| `<endpoint-name>`   | 端点名          | kebab-case                           | `sync-status`, `batch-embed`    |
| `<lifecycle>`       | 钩子名          | camelCase                            | `afterChange`, `beforeValidate` |
| `<Role>`            | 角色名          | PascalCase                           | `Admin`, `Editor`               |
| `<page>`            | 路由段          | kebab-case                           | `reader`, `chat`                |
| `<feature>`         | 功能模块        | kebab-case                           | `home`, `auth`, `seed`        |
| `<Feature>`         | 功能组件前缀    | PascalCase                           | `Home`, `Auth`, `Seed`        |
| `<ComponentName>`   | 组件名          | PascalCase                           | `BookCard`, `StatusBadge`       |
| `<component-name>`  | UI 原子组件名   | kebab-case                           | `button`, `dialog`              |
| `<Name>`            | 通用名称        | PascalCase                           | `Theme`, `Sidebar`, `Toast`   |
| `<engine-module>`   | Engine 子模块   | kebab-case                           | `books`, `embeddings`           |

### 文件头注释规则

- **Python**: 模块级 docstring，首行为 `"""<name> — <一句话描述>.`
- **TypeScript**: JSDoc 块注释，首行为 `/** <Name> — <一句话描述>.`
- 所有模板均已包含标准注释格式，直接替换占位符即可
