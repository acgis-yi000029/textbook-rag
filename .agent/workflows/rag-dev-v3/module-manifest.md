# Textbook-RAG v2 — 模块功能清单

> 每个模块从 **Layout / UI / UX / Func / Noun** 五个维度描述，描述均用 **四字短语**。
> **Noun** 为封闭名词集，约束该模块的文件名、变量名、类名、数据库表名、字段名等命名。
> **Files** 列出该模块涉及的全部文件（跨 Python / Payload / React 三层）。
> 目录结构与命名规则见 [project-structure.md](./project-structure.md)。
> 功能实现状态见 [roadmap.md](./roadmap.md)。

### Noun 使用规则

Noun 是 **种子名词集**（seed nouns），不是穷举名单。规则如下：

| # | 规则 | 示例 |
|---|------|------|
| 1 | **所有标识符必须由种子名词组合而成** | `Book` + `Card` → `BookCard`, `book_card` |
| 2 | **前端用 PascalCase（组件）/ camelCase（变量）** | `ChatSession`, `chatId` |
| 3 | **后端用 snake_case** | `chunk_text`, `embedding_model` |
| 4 | **跨模块名词就近归属，不重复定义** | `Book` 归 `readers`，`question_gen` 引用即可 |
| 5 | **新概念必须先在 Noun 中增加种子词，再使用** | 新增概念需 PR 级变更 |
| 6 | **通用名词不在此管理** | `id`, `name`, `type`, `list`, `item`, `count`, `data` 等通用词无需登记 |

---

## 独立功能模块 (`features/<feature>/`)

> 以下模块有独立的路由页面，不属于 engine 子模块。

## `layout` — 应用骨架

```
Layout
三栏布局
侧栏＋顶栏＋主体

UI
侧栏导航
顶栏标题
用户菜单

UX
折叠展开
路径高亮
一键登出

Func
路由框架
权限守卫
布局容器

Noun
Layout
Sidebar
Header
Nav
Route
Theme
I18n
```

```
layout
└── payload-v2/src/features/layout/
    ├── AppLayout.tsx                       应用骨架容器
    ├── AppSidebar.tsx                      多级路由侧栏导航
    ├── AppHeader.tsx                       顶栏标题
    └── UserMenu.tsx                        用户头像 + 下拉菜单
```

---

## `home` — 首页仪表盘

```
Layout
卡片网格
数据概览

UI
统计卡片
快捷入口
文档列表

UX
一目了然
快速跳转
数据刷新

Func
数据汇总
文档预览
状态总览

Noun
Dashboard
Stat
Book
Overview
QuickLink
```

```
home
├── payload-v2/src/features/home/
│   └── HomePage.tsx                        Hero + Features + CTA 首页
└── payload-v2/src/app/(frontend)/
    └── page.tsx                            / → 首页路由薄壳
```

---

## `auth` — 登录认证

```
Layout
居中表单
全屏背景

UI
邮箱密码
登录按钮
错误提示

UX
即时校验
回车提交
加载反馈

Func
凭证验证
令牌存储
会话管理

Noun
Auth
User
Token
Session
Credential
Login
```

```
auth
├── payload-v2/src/features/auth/
│   └── LoginForm.tsx                       居中登录表单
├── payload-v2/src/features/shared/
│   └── AuthProvider.tsx                    JWT 认证 Context + useAuth
├── payload-v2/src/collections/
│   └── Users.ts                            用户 Collection
├── payload-v2/src/access/
│   ├── isAdmin.ts                          管理员访问策略
│   ├── isEditorOrAdmin.ts                  编辑者访问策略
│   └── isOwnerOrAdmin.ts                   属主访问策略
└── payload-v2/src/app/(frontend)/login/
    └── page.tsx                            /login 路由薄壳
```

---

## `seed` — 数据播种

```
Layout
分类侧栏
操作面板

UI
模块卡片
执行按钮
日志输出

UX
分类导航
一键执行
进度反馈

Func
用户预置
模型预置
提示预置
引擎同步

Noun
Seed
Preset
Sync
Category
Log
Module
```

```
seed
├── payload-v2/src/features/seed/
│   └── SeedPage.tsx                        播种控制面板
├── payload-v2/src/seed/
│   ├── index.ts                            入口 + 执行编排
│   ├── types.ts                            Seed 类型定义
│   ├── users.ts                            预置用户数据
│   ├── llms.ts                             预置 LLM 模型配置
│   ├── prompt-modes.ts                     预置 Prompt 模式
│   └── prompt-templates.ts                 预置 Prompt 模板
├── payload-v2/src/collections/endpoints/
│   ├── index.ts                            barrel export
│   ├── seed.ts                             seed 端点
│   └── sync-engine.ts                      引擎同步端点
└── payload-v2/src/app/(frontend)/seed/
    └── page.tsx                            /seed 路由薄壳
```

---

## Engine 子模块 (`features/engine/<module>/`)

> 以下模块属于 Engine 控制面板，对应 Python `engine_v2/<module>/`。

## `readers` — 文档阅读 / 解析

```
Layout
文档网格
详情抽屉

UI
文档卡片
封面缩略
状态标签
上传入口

UX
网格浏览
点击详情
PDF 预览
拖拽上传

Func
PDF 读取
MinerU 解析
元数据提取
目录提取
文档上传
文档删除
元数据编辑

Noun
Book
Reader
Pdf
Page
Cover
Author
Toc
Chapter
Upload
Edit
Category
```

```
readers
├── engine_v2/readers/
│   ├── __init__.py                         re-export 公共 API
│   ├── mineru_reader.py                    MinerU PDF 解析器
│   └── cover_extractor.py                  封面图 + 元数据提取
├── engine_v2/api/routes/
│   └── books.py                            书籍 CRUD + 同步端点
├── payload-v2/src/collections/
│   ├── Books.ts                            书籍 Collection
│   └── Chapters.ts                         章节 Collection
├── payload-v2/src/hooks/books/
│   └── afterChange.ts                      书籍变更后触发引擎同步
├── payload-v2/src/features/engine/readers/
│   ├── index.ts                            barrel export
│   ├── types.ts                            LibraryBook · BookCategory 等类型
│   ├── api.ts                              Payload + Engine API 调用
│   ├── useLibraryBooks.ts                  书籍列表 hook (筛选 + 加载)
│   ├── useUpload.ts                        PDF 上传 hook (验证 + 三步上传)
│   └── components/
│       ├── LibraryPage.tsx                 书架页面 (网格 + 表格双视图)
│       ├── BookCard.tsx                    书籍卡片 (封面 + 元数据)
│       ├── BookEditDialog.tsx             元数据编辑表单 (标题/作者/分类)
│       ├── BookPicker.tsx                  选书器 (Chat 入口)
│       ├── BookSelector.tsx                选书下拉 (通用)
│       ├── UploadZone.tsx                 拖拽上传区域
│       └── StatusBadge.tsx                 管线状态徽章
└── payload-v2/src/app/(frontend)/readers/
    ├── page.tsx                            /readers 路由薄壳
    └── [bookId]/
        └── page.tsx                        /readers/:bookId 动态路由
```

---

## `ingestion` — 数据摄取

```
Layout
流程面板
任务列表

UI
管线步骤
进度条形
状态徽章

UX
实时轮询
批量操作
错误重试

Func
管线编排
分块切片
向量入库
增量更新

Noun
Pipeline
Task
Chunk
Vector
Batch
Progress
Status
```

```
ingestion
├── engine_v2/ingestion/
│   ├── __init__.py                         re-export 公共 API
│   ├── pipeline.py                         LlamaIndex IngestionPipeline
│   └── transformations.py                  分块转换器
├── engine_v2/api/routes/
│   └── ingest.py                           触发 pipeline 端点
├── payload-v2/src/collections/
│   ├── IngestTasks.ts                      摄取任务 Collection
│   └── Chunks.ts                           分块 Collection
├── payload-v2/src/features/engine/ingestion/
│   ├── index.ts                            barrel export
│   ├── types.ts                            TaskType · PipelinePreview 等类型
│   ├── api.ts                              Pipeline 触发 + 预览 API
│   └── components/
│       ├── PipelineDashboard.tsx            三栏管线面板 (书本树 + 步骤 + 详情)
│       └── PipelineActions.tsx             批量操作按钮组
└── payload-v2/src/app/(frontend)/engine/ingestion/
    └── page.tsx                            /engine/ingestion 路由薄壳
```

---

## `chat` — RAG 对话

```
Layout
三栏布局
历史侧栏＋对话主体＋问题侧栏

UI
消息气泡
输入面板
历史列表
推荐问题
Prompt 选择

UX
流式输出
上下文切换
溯源引用
Prompt 切换
问题浏览

Func
检索增强
对话管理
来源追溯
全链编排

Noun
Chat
Message
Conversation
History
Source
Context
Input
Stream
Prompt
Suggest
```

```
chat
├── payload-v2/src/features/chat/
│   ├── ChatPage.tsx                        对话页面 (PDF 左 + Chat 中 + 问题右)
│   ├── types.ts                            Message 等类型
│   ├── history/
│   │   ├── index.ts                        barrel export
│   │   ├── ChatHistoryContext.tsx           会话历史 Context
│   │   ├── ChatHistoryPanel.tsx            历史列表侧栏
│   │   └── useChatHistory.ts              会话持久化 hook
│   ├── questions/
│   │   ├── index.ts                        barrel export
│   │   ├── QuestionSidebar.tsx             右侧问题侧栏 (按分类)          ← NEW
│   │   └── QuestionItem.tsx               单个问题卡片 (点击即提问)       ← NEW
│   └── panel/
│       ├── index.ts                        barrel export
│       ├── ChatPanel.tsx                   对话面板 (消息列表 + 输入)
│       ├── ChatHeader.tsx                  对话顶栏 (文档名 + LLM + Prompt)
│       ├── ChatInput.tsx                   输入框 + 发送按钮
│       ├── MessageBubble.tsx               AI / 用户消息气泡
│       ├── PromptSelector.tsx              Prompt 模式选择器               ← NEW (替代 ModeToggle)
│       ├── SourceCard.tsx                  来源引用卡片
│       └── WelcomeScreen.tsx              欢迎页 (选文档前)
└── payload-v2/src/app/(frontend)/chat/
    └── page.tsx                            /chat 路由薄壳
```

---

## `retrievers` — 检索引擎

```
Layout
配置表单
结果预览

UI
参数滑块
策略选择
片段列表

UX
即调即试
对比查看
相关高亮

Func
向量搜索
BM25 检索
混合融合
重排精选

Noun
Retriever
Query
Result
Score
Node
Strategy
TopK
Reranker
```

```
retrievers
├── engine_v2/retrievers/
│   ├── __init__.py                         re-export 公共 API
│   └── hybrid.py                           混合检索 (FTS + Vector + RRF)
├── engine_v2/api/routes/
│   └── retrievers.py                       检索配置端点
├── payload-v2/src/features/engine/retrievers/
│   ├── index.ts                            barrel export
│   ├── types.ts                            BboxEntry 等类型
│   └── components/
│       ├── PdfViewer.tsx                   PDF 阅读器 + 引用高亮
│       └── BboxOverlay.tsx                 MinerU bbox 叠加层
└── payload-v2/src/app/(frontend)/engine/retrievers/
    └── page.tsx                            /engine/retrievers 路由
```

---

## `response_synthesizers` — 回答合成

```
Layout
配置表单
输出预览

UI
模板编辑
参数调节
结果展示

UX
实时预览
模板切换
质量对比

Func
提示拼装
流式生成
来源注入
格式标准

Noun
Synthesizer
Prompt
Template
Response
Citation
Format
Stream
```

```
response_synthesizers
├── engine_v2/response_synthesizers/
│   ├── __init__.py                         re-export 公共 API
│   └── citation.py                         带引用的回答合成
├── payload-v2/src/collections/
│   └── Prompts.ts                          Prompt 模式 Collection
├── payload-v2/src/features/engine/response_synthesizers/
│   ├── index.ts                            barrel export
│   ├── types.ts                            PromptMode · PromptModeUpdatePayload 等类型
│   ├── api.ts                              Prompt 模式 CRUD API (Payload CMS)
│   ├── usePromptModes.ts                   Prompt 模式 hook (只读)
│   └── components/
│       └── PromptEditorPage.tsx            Prompt 编辑 + 实时预览页面
└── payload-v2/src/app/(frontend)/engine/response_synthesizers/
    └── page.tsx                            /engine/response_synthesizers 路由薄壳
```

---

## `llms` — 模型管理

```
Layout
模型列表
配置详情

UI
模型卡片
参数表单
状态指示

UX
一键切换
参数微调
连通测试

Func
多厂适配
参数管理
令牌统计
故障降级

Noun
Llm
Model
Provider
Param
Token
Fallback
Endpoint
```

```
llms
├── engine_v2/llms/
│   ├── __init__.py                         re-export 公共 API
│   └── resolver.py                         多厂 LLM 解析 (Ollama / Azure)
├── engine_v2/api/routes/
│   └── llms.py                             模型列表 + 状态端点
├── payload-v2/src/collections/
│   └── Llms.ts                             LLM 配置 Collection
├── payload-v2/src/features/engine/llms/
│   ├── index.ts                            barrel export
│   ├── types.ts                            ModelConfig 等类型
│   ├── api.ts                              模型 CRUD API
│   ├── useModels.ts                        模型管理 hook
│   └── ModelContext.tsx                    当前模型 Context
└── payload-v2/src/app/(frontend)/engine/llms/
    └── page.tsx                            /engine/llms 路由
```

---

## `query_engine` — 查询引擎

```
Layout
调试控制台

UI
查询输入
管线流程
结果展示

UX
端到端试
管线可视
耗时统计

Func
全链调试
检索合成
上下文管
结果封装

Noun
QueryEngine
Query
Pipeline
Trace
Result
Latency
Debug
```

```
query_engine
├── engine_v2/query_engine/
│   ├── __init__.py                         re-export 公共 API
│   └── citation.py                         带引用的全链查询
├── engine_v2/api/routes/
│   └── query.py                            查询端点
├── payload-v2/src/collections/
│   └── Queries.ts                          查询记录 Collection
├── payload-v2/src/features/engine/query_engine/
│   ├── index.ts                            barrel export
│   ├── types.ts                            QueryTrace 等类型
│   └── api.ts                              查询 + TOC + PDF URL API
└── payload-v2/src/app/(frontend)/engine/query_engine/
    └── page.tsx                            /engine/query_engine 路由 (占位)
```

---

## `evaluation` — 质量评估

```
Layout
评估面板
指标图表

UI
评分卡片
雷达图表
对比表格

UX
批量评测
历史对比
导出报告

Func
忠实度评
相关性评
指标计算
报告汇总

Noun
Evaluation
Metric
Faithfulness
Relevancy
Score
Report
Benchmark
Comparison
```

```
evaluation
├── engine_v2/evaluation/
│   ├── __init__.py                         re-export 公共 API
│   └── evaluator.py                        忠实度 + 相关性评估器
├── engine_v2/api/routes/
│   └── evaluation.py                       评估端点
├── payload-v2/src/collections/
│   └── Evaluations.ts                      评估结果 Collection
├── payload-v2/src/features/engine/evaluation/
│   ├── index.ts                            barrel export
│   ├── types.ts                            EvalResult 等类型
│   ├── api.ts                              评估 API
│   └── components/
│       ├── TracePanel.tsx                  执行追踪面板
│       ├── TraceComponents.tsx             TraceStat · TraceHitList 子组件
│       └── ThinkingProcessPanel.tsx        思维过程展示面板
└── payload-v2/src/app/(frontend)/engine/evaluation/
    └── page.tsx                            /engine/evaluation 路由
```

---

## `question_gen` — 问题引擎

> 不是出题工具，是 chat 的上游供给系统。

```
Layout
书籍选择
题目列表

UI
书籍选框
生成按钮
题目卡片
推荐卡片

UX
选书生成
批量浏览
难度筛选
推荐引导

Func
自动出题
多类题型
知识覆盖
去重校验
问题推荐                按章节生成推荐问题，供 chat WelcomeScreen 消费
质量评估                判断问题深度 (surface / understanding / synthesis)
重复检测                向量相似度匹配历史问题，引导深入

Noun
Question
Book
Generate
Type
Difficulty
Answer
Option
Coverage
Suggest
Quality
Depth
Duplicate
Similar
Recommend
Hint
```

```
question_gen
├── engine_v2/question_gen/
│   ├── __init__.py                         re-export 公共 API
│   ├── generator.py                        LLM 自动出题
│   ├── quality.py                          问题深度评估器                  ← NEW
│   └── dedup.py                            向量相似度去重                  ← NEW
├── engine_v2/api/routes/
│   ├── questions.py                        题目 CRUD + 生成端点
│   └── suggest.py                          推荐问题端点 (GET /engine/questions/suggest)
├── payload-v2/src/collections/
│   └── Questions.ts                        题目 Collection
├── payload-v2/src/features/engine/question_gen/
│   ├── index.ts                            barrel export
│   ├── types.ts                            Question 等类型
│   ├── api.ts                              题目 + 推荐 + 质量 API
│   ├── useQuestionGeneration.ts            生成 + 保存 hook
│   ├── useSuggestedQuestions.ts            推荐问题 hook (供 chat 消费)
│   ├── useBooks.ts                         可选书籍列表 hook
│   └── components/
│       ├── QuestionsPage.tsx               题目库页面 (卡片 + 表格双视图)
│       ├── QuestionCards.tsx               题目卡片 (Markdown + 评分)
│       ├── GenerationProgress.tsx          生成进度展示
│       ├── BookSelector.tsx                书籍多选器 (触发生成)
│       ├── GenerationPanel.tsx             生成面板 (选书+生成+进度)
│       └── SuggestedQuestions.tsx          推荐问题卡片 (供 chat 嵌入)
└── payload-v2/src/app/(frontend)/engine/question_gen/
    └── page.tsx                            /engine/question_gen 路由薄壳
```

---

## 纯后端模块 (`engine_v2/<module>/`，无前端 UI)

> 以下模块仅有 Python 实现，无对应的 React 前端页面。

## `chunking` — 文本分块

```
Func
语义切分
标题层级
重叠窗口
块级元数据

Noun
Chunk
Node
Split
Overlap
Heading
Meta
```

```
chunking
└── engine_v2/chunking/
    ├── __init__.py                         re-export 公共 API
    └── chapter_extractor.py                按章节语义切分
```

---

## `toc` — 目录提取

```
Func
层级识别
页码映射
标题清洗
结构序列

Noun
Toc
Entry
Level
Title
Page
Tree
```

```
toc
└── engine_v2/toc/
    ├── __init__.py                         re-export 公共 API
    └── extractor.py                        多级 TOC 提取 + 页码映射
```

---

## `embeddings` — 向量嵌入

```
Func
模型加载
批量编码
维度配置
缓存复用

Noun
Embedding
Model
Vector
Batch
Cache
Dimension
```

```
embeddings
└── engine_v2/embeddings/
    ├── __init__.py                         re-export 公共 API
    └── resolver.py                         嵌入模型解析 + 加载
```

---

## `access` — 权限控制

```
Func
角色鉴权
管理独占
编辑可写
属主可改

Noun
Access
Role
Policy
Permission
Guard
```

```
access
└── payload-v2/src/access/
    ├── isAdmin.ts                          管理员访问策略
    ├── isEditorOrAdmin.ts                  编辑者访问策略
    └── isOwnerOrAdmin.ts                   属主访问策略
```

---

## 跨模块公共模块 (`features/shared/`)

> 以下模块无独立路由，为其他模块提供公共能力。

## `pdf` — PDF 阅读器

> 从 retrievers/components/ 提取，供 chat、readers 共用。

```
Layout
阅读面板
叠加高亮

UI
页面渲染
页码导航
目录侧栏
缩放控制

UX
滚动翻页
引用跳转
高亮标注
拖拽缩放

Func
PDF 渲染
Bbox 叠加
文本匹配
页面跳转

Noun
Pdf
Viewer
Page
Bbox
Overlay
Zoom
Toc
Highlight
```

```
pdf
└── payload-v2/src/features/shared/pdf/
    ├── index.ts                            barrel export
    ├── PdfViewer.tsx                       PDF 阅读器 (33 KB)             ← 从 retrievers/components/ 迁入
    └── BboxOverlay.tsx                     MinerU bbox 高亮叠加层          ← 从 retrievers/components/ 迁入
```

---

## `shared` — 公共基础设施

> 跨模块共享的 Context、Provider、Hook、组件、类型、工具。

```
Func
全局状态
认证守卫
国际化支
主题切换
文档共享
打字动效

Noun
App
Auth
User
Provider
I18n
Locale
Theme
Book
Sidebar
Layout
Config
```

```
shared
└── payload-v2/src/features/shared/
    ├── AppContext.tsx                       全局状态 Context + Reducer
    ├── AuthProvider.tsx                     JWT 认证 Context + useAuth
    ├── Providers.tsx                        顶层 Provider 组合
    ├── ResizeHandle.tsx                     可拖拽分隔条
    ├── types.ts                            SourceInfo 等共享类型
    ├── utils.ts                            cn() 等工具函数
    ├── books/\n    │   ├── types.ts                        BookBase 类型\n    │   ├── api.ts                          fetchBooks API\n    │   ├── useBooks.ts                     书籍列表 hook\n    │   ├── useBookSidebar.ts              分类侧栏 hook\n    │   └── index.ts                        barrel export
    ├── components/
    │   ├── SidebarLayout.tsx               通用侧栏布局 (12 KB)
    │   ├── ComingSoon.tsx                  占位页组件
    │   ├── DashboardShell.tsx              仪表盘壳
    │   ├── LanguageToggle.tsx              语言切换
    │   ├── ThemeToggle.tsx                 主题切换
    │   ├── charts/                         图表组件
    │   └── ui/                             基础 UI 原子组件
    ├── hooks/
    │   └── useSmoothText.ts               打字机效果 hook
    ├── i18n/
    │   ├── I18nProvider.tsx                国际化 Context
    │   ├── messages.ts                     中英文消息
    │   └── index.ts                        barrel export
    ├── theme/                              主题配置
    └── config/                             全局配置
```
