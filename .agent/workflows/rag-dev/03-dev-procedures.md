---
description: textbook-rag 开发流程模板 — 新增前端/后端功能、修改数据字段
---

# 📋 开发流程

## 新增前端功能

1. **创建 feature 模块** (如不存在):
   ```
   payload/src/features/{feature_name}/
   ├── index.ts              # barrel export
   ├── types.ts              # 类型定义
   ├── api.ts                # API 调用
   └── {FeatureName}Page.tsx # 主组件
   ```

2. **创建路由页面** (薄壳):
   ```tsx
   // app/(frontend)/(app)/dashboard/{feature}/page.tsx
   'use client'
   import FeaturePage from '@/features/{feature}/FeaturePage'
   export default function Page() {
     return <FeaturePage />
   }
   ```

3. **添加导航** (如需要):
   - `features/layout/AppSidebar.tsx` — 添加 navLink
   - `features/shared/i18n/messages.ts` — 添加 i18n key

4. **更新 barrel export**:
   ```ts
   // features/{feature}/index.ts
   export * from './types'
   export * from './api'
   export { default as FeaturePage } from './FeaturePage'
   ```

## 新增后端 API (Payload 侧)

```
payload/src/app/(frontend)/api/{endpoint}/route.ts
```

```ts
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: Request) {
  const payload = await getPayload({ config })
  // 使用 payload.find / payload.create / payload.update
  const data = await payload.find({ collection: 'books', limit: 10 })
  return NextResponse.json(data)
}
```

## 新增后端 API (Engine 侧)

```python
# engine/api/routes/{feature}.py
from fastapi import APIRouter
router = APIRouter(tags=["{feature}"])

@router.get("/{feature}/endpoint")
def my_endpoint():
    ...
```

注册路由: 在 `engine/api/app.py` 的 `create_app()` 中用 `app.include_router(xxx.router, prefix="/engine")` 注册

## 修改数据字段

1. 修改 Payload collection: `payload/src/collections/Books.ts`
2. 修改 Engine schema: `scripts/rebuild_db.py` (SCHEMA 常量)
3. 修改同步脚本: `scripts/sync_to_payload.py` (detect_category, registry)
4. 修改 Payload sync route: `app/(frontend)/api/sync-engine/route.ts`
5. 运行: `--fix-subcategory` 或 `--fix-pipeline` 回填现有数据
