# Textbook-RAG v2 — 项目架构

> 本文档定义项目的 **目录结构、文件角色、命名规则**。
> 所有新增开发必须遵循此约束，不允许在规定之外创建目录或文件。

---

## 一、Python

```
engine_v2/                                        # Python 后端根包
├── __init__.py                                   #   包描述 + __version__
├── settings.py                                   #   全局配置单例 (环境变量、模型参数、路径)
├── schema.py                                     #   领域模型 (Pydantic: BookMeta, RAGResponse …)
├── errors.py                                     #   自定义异常层级 (EngineError → 子类)
│
├── <module>/                                     #   功能模块 (可多个，snake_case，对齐 LlamaIndex)
│   ├── __init__.py                               #     模块 docstring + re-export 公共 API
│   └── <impl>.py                                 #     具体实现 (一个或多个，snake_case)
│
└── api/                                          #   FastAPI 接口层 (薄壳，不含业务逻辑)
    ├── __init__.py                               #     包标记
    ├── app.py                                    #     FastAPI 实例 + lifespan + 路由注册
    ├── deps.py                                   #     依赖注入工厂 (Depends)
    ├── middleware/                                #     中间件 (横切关注点)
    │   └── <concern>.py                          #       error_handler / logging / auth / cors
    └── routes/                                   #     路由
        ├── __init__.py                           #       包标记
        └── <resource>.py                         #       每个资源一个文件 (与 Collection slug 对齐)

scripts/                                          # 独立运维/数据脚本
└── <verb>_<noun>.py                              #   snake_case，动词_名词

data/                                             # 运行时数据 (不入 Git)
├── raw_pdfs/                                     #   原始 PDF 文件
├── mineru_output/                                #   MinerU 解析产物 (Markdown + 图片)
├── media/                                        #   媒体资源 (封面图等)
└── chroma_persist/                               #   ChromaDB 向量数据库持久化
```

### 目录约束

#### `engine_v2/`

```
engine_v2/
├── __init__.py                     # 固定
├── settings.py                     # 固定
├── schema.py                       # 固定
├── errors.py                       # 固定 (以上 4 个不可新增)
├── <module>/                       # 功能模块 (可多个)
└── api/                            # 接口层
```

#### `engine_v2/<module>/`

```
<module>/
├── __init__.py                     # 只做 re-export
└── <impl>.py                       # snake_case，一个或多个
```

#### `engine_v2/api/`

```
api/
├── __init__.py                     # 固定
├── app.py                          # 固定
├── deps.py                         # 固定 (以上 3 个不可新增)
├── middleware/                     # 中间件
└── routes/                         # 路由
```

#### `engine_v2/api/middleware/`

```
middleware/
└── <concern>.py                    # snake_case，每个横切关注点一个文件
```

#### `engine_v2/api/routes/`

```
routes/
├── __init__.py                     # 固定
└── <resource>.py                   # snake_case，与 Collection slug 对齐
```

#### `scripts/`

```
scripts/
└── <verb>_<noun>.py                # snake_case，动词_名词
```

#### `data/`

```
data/                               # 运行时数据 (不入 Git)
├── raw_pdfs/                       # 固定
├── mineru_output/                  # 固定
├── media/                          # 固定
└── chroma_persist/                 # 固定 (以上 4 个不可新增)
```

---

## 二、Payload

```
payload-v2/src/                                   # Payload CMS 层
├── payload.config.ts                             #   集中配置 (唯一入口，注册所有 Collection)
│
├── access/                                       #   访问控制策略
│   └── is<Role>.ts                               #     每个策略一个文件，is 前缀 + PascalCase
│
├── collections/                                  #   Collection 定义
│   ├── <CollectionName>.ts                       #     PascalCase，每个 Collection 一个文件
│   └── endpoints/                                #     自定义 REST 端点
│       ├── index.ts                              #       barrel export
│       └── <endpoint-name>.ts                    #       kebab-case
│
├── hooks/                                        #   Payload 生命周期钩子
│   └── <collection>/                             #     按 Collection 分目录 (小写，与 slug 对齐)
│       └── <lifecycle>.ts                        #       afterChange / beforeValidate / …
│
└── seed/                                         #   数据初始化 / 预置
    ├── index.ts                                  #     入口 + 执行编排
    ├── types.ts                                  #     Seed 类型定义
    └── <data-source>.ts                          #     kebab-case，每类预置数据一个文件
```

### 目录约束

#### `payload-v2/src/`（CMS 层）

```
payload-v2/src/
├── payload.config.ts               # 固定 1 个，不可新增
├── access/
├── collections/
├── hooks/
└── seed/
```

#### `access/`

```
access/
└── is<Role>.ts                     # is 前缀 + PascalCase
```

#### `collections/`

```
collections/
├── <CollectionName>.ts             # PascalCase，文件名 = 导出常量名
└── endpoints/
```

#### `collections/endpoints/`

```
endpoints/
├── index.ts                        # 固定
└── <endpoint-name>.ts              # kebab-case
```

#### `hooks/`

```
hooks/
└── <collection>/                   # 与 Collection slug 对齐，小写
```

#### `hooks/<collection>/`

```
<collection>/
└── <lifecycle>.ts                  # camelCase: afterChange / beforeValidate …
```

#### `seed/`

```
seed/
├── index.ts                        # 固定
├── types.ts                        # 固定
└── <data-source>.ts                # kebab-case，每类预置数据一个文件
```

---

## 三、React

```
payload-v2/src/                                   # React 前端层
│
├── app/                                          #   Next.js App Router (路由层)
│   ├── layout.tsx                                #     根 Layout (html / body)
│   ├── globals.css                               #     根全局样式
│   └── (frontend)/                               #     自定义前端路由组
│       ├── layout.tsx                            #       前端 Layout (挂载 Providers + AppLayout)
│       ├── globals.css                           #       前端样式 (CSS 变量 / Tailwind 层)
│       ├── page.tsx                              #       / → 首页
│       ├── <page>/                               #       一级路由 (kebab-case)
│       │   └── page.tsx                          #         薄壳：只 import Feature 组件并渲染
│       ├── <page>/[<paramId>]/                   #       动态路由
│       │   └── page.tsx                          #         动态页面薄壳
│       └── <section>/                            #       分区路由 (如 engine/)
│           ├── page.tsx                          #         分区首页
│           └── <sub-page>/                       #         子路由 (kebab-case)
│               └── page.tsx                      #           子页面薄壳
│
└── features/                                     #   ★ 业务功能模块
    │
    ├── providers/                                #   全局 Provider + Context (集中管理)
    │   ├── <Name>Provider.tsx                    #     Provider 组件 (PascalCase + Provider 后缀)
    │   ├── <Name>Context.tsx                     #     Context 组件 (PascalCase + Context 后缀)
    │   ├── Providers.tsx                         #     ★ 组合根：嵌套所有 Provider
    │   └── messages.ts                           #     i18n 翻译字典
    │
    ├── shared/                                   #   全局共享工具层 (无业务逻辑)
    │   ├── types.ts                              #     全局类型定义
    │   ├── utils.ts                              #     纯工具函数
    │   ├── api/                                  #     API 客户端抽象
    │   │   ├── client.ts                         #       统一 fetch 封装 (base URL / 错误处理 / 拦截)
    │   │   └── types.ts                          #       API 层类型 (分页、错误响应)
    │   ├── hooks/                                #     共享 React Hooks
    │   │   └── use<Name>.ts                      #       use 前缀 + PascalCase
    │   ├── config/                               #     前端配置
    │   │   └── <name>.ts                         #       kebab-case
    │   ├── lib/                                  #     第三方库封装 (隔离外部依赖)
    │   │   └── <library>.ts                      #       kebab-case，每个库一个文件
    │   └── components/                           #     全局 UI 组件库
    │       ├── <ComponentName>.tsx               #       业务通用组件 (PascalCase)
    │       ├── charts/                           #       图表组件
    │       │   ├── index.ts                      #         barrel export
    │       │   └── <chart-type>.tsx              #         kebab-case
    │       └── ui/                               #       原子 UI 组件 (shadcn/ui 风格)
    │           ├── index.ts                      #         barrel export
    │           └── <component-name>.tsx          #         kebab-case
    │
    ├── layout/                                   #   App Shell (应用骨架)
    │   ├── App<Part>.tsx                         #     AppLayout / AppSidebar / AppHeader
    │   └── <Name>.tsx                            #     其他布局组件 (PascalCase)
    │
    ├── <feature>/                                #   独立功能模块 (如 auth / home / chat / seed)
    │   ├── <Feature>Page.tsx                     #     页面级组件 (PascalCase + Page 后缀)
    │   ├── types.ts                              #     模块类型 [可选]
    │   └── <sub-module>/                         #     子模块 [可选]
    │       ├── index.ts                          #       barrel export
    │       ├── <Component>.tsx                   #       UI 组件 (PascalCase)
    │       ├── <Name>Context.tsx                 #       模块级 Context [可选]
    │       └── use<Name>.ts                      #       自定义 hook [可选]
    │
    └── engine/                                   #   ★ Engine 控制面板
        ├── index.ts                              #     barrel export
        └── <engine-module>/                      #     每个 engine 子模块一个目录
            ├── index.ts                          #       [必须] barrel export (唯一公共出口)
            ├── types.ts                          #       [必须] 模块类型定义
            ├── api.ts                            #       [按需] Engine API 调用 (基于 shared/api/client)
            ├── use<Name>.ts                      #       [按需] 自定义 hook
            ├── <Name>Context.tsx                 #       [按需] 模块级 Context
            └── components/                       #       [按需] UI 组件目录
                ├── <Feature>Page.tsx             #         页面组件 (Page 后缀)
                ├── <Feature>Panel.tsx            #         面板组件 (Panel 后缀)
                ├── <Item>Card.tsx                #         卡片组件 (Card 后缀)
                └── <Descriptive>Name.tsx         #         其他组件 (PascalCase)
```

### 目录约束

#### `app/`

```
app/
├── layout.tsx                      # 固定
├── globals.css                     # 固定 (以上 2 个不可新增)
└── (frontend)/
```

#### `app/(frontend)/`

```
(frontend)/
├── layout.tsx                      # 固定
├── globals.css                     # 固定
├── page.tsx                        # 固定 (以上 3 个不可新增)
├── <page>/                         # 一级路由 (kebab-case)
└── <section>/                      # 分区路由 (kebab-case)
```

#### `app/(frontend)/<page>/`

```
<page>/
├── page.tsx                        # 必须只包含这 1 个
└── [<paramId>]/                    # 动态路由 (可选)
    └── page.tsx
```

#### `app/(frontend)/<section>/<sub>/`

```
<sub>/
└── page.tsx                        # 必须只包含这 1 个
```

#### `features/providers/`

```
providers/
├── <Name>Provider.tsx              # PascalCase + Provider 后缀
├── <Name>Context.tsx               # PascalCase + Context 后缀
├── Providers.tsx                   # 组合根 (固定)
└── messages.ts                     # i18n 翻译字典 (固定)
```

#### `features/shared/`

```
shared/
├── types.ts                        # 固定
├── utils.ts                        # 固定 (以上 2 个不可新增)
├── api/
├── hooks/
├── config/
├── lib/
└── components/
```

#### `features/shared/api/`

```
api/
├── client.ts                       # 固定
└── types.ts                        # 固定 (以上 2 个不可新增)
```

#### `features/shared/hooks/`

```
hooks/
└── use<Name>.ts                    # use 前缀 + PascalCase
```

#### `features/shared/config/`

```
config/
└── <name>.ts                       # kebab-case
```

#### `features/shared/lib/`

```
lib/
└── <library>.ts                    # kebab-case，每个第三方库一个文件
```

#### `features/shared/components/`

```
components/
├── <ComponentName>.tsx             # PascalCase
├── charts/
└── ui/
```

#### `features/shared/components/charts/`

```
charts/
├── index.ts                        # 固定
└── <chart-type>.tsx                # kebab-case
```

#### `features/shared/components/ui/`

```
ui/
├── index.ts                        # 固定
└── <component-name>.tsx            # kebab-case
```

#### `features/layout/`

```
layout/
├── App<Part>.tsx                   # AppLayout / AppSidebar / AppHeader
└── <Name>.tsx                      # PascalCase
```

#### `features/<feature>/`

```
<feature>/
├── <Feature>Page.tsx               # PascalCase + Page 后缀
├── types.ts                        # 固定 [可选]
└── <sub-module>/                   # 子模块 [可选]
```

#### `features/<feature>/<sub>/`

```
<sub>/
├── index.ts                        # barrel export
├── <Component>.tsx                 # PascalCase
├── <Name>Context.tsx               # 模块级 Context [可选]
└── use<Name>.ts                    # 自定义 hook [可选]
```

#### `features/engine/`

```
engine/
├── index.ts                        # 必须只包含这 1 个
└── <engine-module>/                # 每个子模块一个目录
```

#### `features/engine/<module>/`

```
<module>/
├── index.ts                        # [必须] barrel export
├── types.ts                        # [必须] 模块类型定义
├── api.ts                          # [按需] Engine API 调用
├── use<Name>.ts                    # [按需] 自定义 hook
├── <Name>Context.tsx               # [按需] 模块级 Context
└── components/                     # [按需] UI 组件目录
```

#### `features/engine/<module>/components/`

```
components/
├── <Name>Page.tsx                  # Page 后缀
├── <Name>Panel.tsx                 # Panel 后缀
├── <Item>Card.tsx                  # Card 后缀
└── <Descriptive>Name.tsx           # PascalCase + 语义后缀
```

---

## 跨层对齐规则

| Engine 模块 (Python) | API 路由 | Collection (Payload) | Feature (React) | URL 路径 |
|----------------------|----------|---------------------|----------------|----------|
| `<module>/` | `/api/<resource>` | `<Resource>.ts` | `engine/<module>/` | `/engine/<module>` |

> 四层同名：Python 模块名 = API 资源名 = Feature 目录名 = URL 段名

### 依赖方向 (不可违反)

```
feature → shared       ✅  允许
feature → providers    ✅  允许
shared  → feature      ❌  禁止
feature → feature      ❌  禁止 (通过 shared 或 providers 中转)
layout  → shared       ✅  允许
layout  → providers    ✅  允许
engine/<A> → engine/<B>  ❌  禁止 (子模块间不互相依赖)
```
