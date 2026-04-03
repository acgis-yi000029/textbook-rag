# Textbook-RAG v2 — 功能路线图

> 对照 [module-manifest.md](./module-manifest.md) 每个功能点，标注实际实现状态。
> 格式沿用 manifest 的 Layout / UI / UX / Func 维度，用 ✅ ❌ 标注。

**图例** — ✅ 已实现 · ❌ 未实现

---

## 独立功能模块 (`features/<feature>/`)

## `layout` — 应用骨架 ✅

```
Layout
✅  三栏布局              AppLayout.tsx (三栏: Sidebar + Header + Body)
✅  侧栏＋顶栏＋主体      AppSidebar + AppHeader + 主内容区

UI
✅  侧栏导航              AppSidebar (15 KB) — 多级路由菜单
✅  顶栏标题              AppHeader — 当前页标题
✅  用户菜单              UserMenu.tsx (6 KB) — 头像 + 下拉菜单

UX
✅  折叠展开              侧栏折叠/展开
✅  路径高亮              当前路由高亮
✅  一键登出              UserMenu 内登出按钮

Func
✅  路由框架              Next.js App Router (frontend) 路由组
✅  权限守卫              AuthProvider + ChatPage 守卫
✅  布局容器              SidebarLayout 共享组件
```

---

## `home` — 首页仪表盘 🚧

```
Layout
✅  卡片网格              Hero + Features (3卡) + How It Works (3步) + CTA
❌  数据概览              没有实时数据统计，只有静态展示

UI
❌  统计卡片              只有静态功能描述卡，无真实数据统计
✅  快捷入口              "开始提问" + "登录" CTA 按钮
❌  书籍列表              首页无书籍列表预览

UX
❌  一目了然              缺少数据聚合（书籍数量 / 对话次数 / 索引状态 等）
✅  快速跳转              跳转到 /chat 和 /login
❌  数据刷新              无数据，无刷新

Func
❌  数据汇总              无后端汇总 API
❌  书籍预览              首页不展示书籍
❌  状态总览              无系统状态组件
```

---

## `auth` — 登录认证 ✅

```
Layout
✅  居中表单              LoginForm 居中卡片
✅  全屏背景              渐变背景 + 装饰元素

UI
✅  邮箱密码              email + password 输入框
✅  登录按钮              登录提交按钮
✅  错误提示              错误消息展示

UX
✅  即时校验              前端表单校验
✅  回车提交              Enter 键提交
✅  加载反馈              登录按钮 loading 状态

Func
✅  凭证验证              Payload 内置 JWT 认证
✅  令牌存储              Cookie / Session 存储
✅  会话管理              AuthProvider + useAuth hook
```

---

## `seed` — 数据播种 🚧

```
Layout
✅  分类侧栏              模块分类侧栏 (user / llm / prompt)
✅  操作面板              每个 seed 模块的控制面板

UI
✅  模块卡片              各 seed 模块卡片
✅  执行按钮              一键 seed 按钮
❌  日志输出              无实时日志流

UX
✅  分类导航              按 seed 类型分类
✅  一键执行              单击执行 seed
❌  进度反馈              无 WebSocket 进度

Func
✅  用户预置              seed/users.ts 预置用户数据
✅  模型预置              seed/llms.ts 预置 LLM 配置
✅  提示预置              seed/prompt-modes.ts + prompt-templates.ts
❌  引擎同步              seed 后无自动同步到 Engine
```

---

## Engine 子模块 (`features/engine/<module>/`)

## `readers` — 文档阅读 / 解析 ✅

```
Layout
✅  书架网格              LibraryPage — 卡片网格 + 表格视图
✅  详情抽屉              BookCard — 封面 + 元数据 + pipeline 状态

UI
✅  书籍卡片              BookCard.tsx — 封面 + 标题 + 作者 + 状态
✅  封面缩略              coverImage.sizes.thumbnail 缩略图
✅  状态标签              StatusBadge — pending / processing / indexed / error

UX
✅  网格浏览              卡片(grid) / 表格(table) 双视图切换
✅  点击详情              点击进入 PDF 预览 / 选中开始对话
✅  PDF 预览              PdfViewer (33 KB) — 完整 PDF 阅读器

Func
✅  PDF 读取              mineru_reader.py — MinerU PDF 解析
✅  MinerU 解析           MinerU Markdown + 图片输出
✅  元数据提取            cover_extractor.py — 封面 + 元数据
✅  目录提取              toc/extractor.py — TOC 提取
```

---

## `ingestion` — 数据摄取 ✅

```
Layout
✅  流程面板              PipelineDashboard (36 KB) — 三栏布局 (书本树 + 步骤导航 + 详情)
✅  任务列表              按分类 → 子分类 → 书本的树形目录

UI
✅  管线步骤              6 阶段可视化 (pdf_parse → chunk_build → store → vector → fts → toc)
✅  进度条形              总进度条 + 单阶段状态图标
✅  状态徽章              done / pending / missing / error 四态徽章

UX
✅  实时轮询              fetchPipelinePreview 按需加载
✅  批量操作              PipelineActions — 批量触发 ingest / reindex / full
✅  错误重试              actionFeedback 错误提示 + 重新触发

Func
✅  管线编排              pipeline.py — LlamaIndex IngestionPipeline
✅  分块切片              transformations.py — 分块转换器
✅  向量入库              ChromaDB 向量存储
✅  增量更新              reindex 模式支持
```

---

## `chat` — RAG 对话 🚧

```
Layout
✅  双栏布局              ChatPage — PDF 左 + 对话右 (可拖拽分隔)
✅  历史侧栏              chat/history/ — 会话历史列表

UI
✅  消息气泡              ChatPanel — AI / 用户气泡
✅  输入面板              底部输入框 + 发送按钮
✅  历史列表              ChatHistoryContext — 会话切换

UX
❌  流式输出              当前为一次性返回，非 SSE/WebSocket 流式
✅  上下文切换            多书切换 tab + 会话恢复 (?session=id)
✅  溯源引用              PdfViewer 文本高亮 + BboxOverlay 可视化

Func
✅  检索增强              query_engine/citation.py — 混合检索 + 来源注入
✅  对话管理              ChatHistoryContext — 新建 / 恢复 / 重置会话
✅  来源追溯              citation_label + page_number + snippet 高亮
❌  全链编排              缺端到端管线配置 UI（参数暴露在 chat 界面）
```

---

## `retrievers` — 检索引擎 🚧

```
Layout
❌  配置表单              无独立配置页面（参数硬编码在后端）
❌  结果预览              无独立检索测试页面

UI
❌  参数滑块              无 top_k / fetch_k 等参数 UI
❌  策略选择              无 FTS/Vector/Hybrid 策略选择器
❌  片段列表              无独立检索结果列表（仅在 TracePanel 中展示）

UX
❌  即调即试              无独立检索调试入口
❌  对比查看              无策略对比功能
✅  相关高亮              PdfViewer + BboxOverlay 命中高亮

Func
✅  向量搜索              hybrid.py — ChromaDB 向量检索
✅  BM25 检索             hybrid.py — FTS 全文检索
✅  混合融合              hybrid.py — RRF 融合策略
❌  重排精选              无 Reranker 实现
```

---

## `response_synthesizers` — 回答合成 🚧

```
Layout
✅  配置表单              SidebarLayout — Prompt 模式列表 + 详情面板
❌  输出预览              无实时生成预览

UI
❌  模板编辑              只能查看 systemPrompt（只读），不能编辑
✅  参数调节              无（只展示现有 Prompt 模式）
✅  结果展示              展示 prompt name / slug / description / systemPrompt

UX
❌  实时预览              无输入→输出实时预览
✅  模板切换              侧栏切换不同 Prompt 模式
❌  质量对比              无 A/B 对比功能

Func
✅  提示拼装              citation.py — 来源注入 + 提示模板
✅  流式生成              后端支持，前端未接入
✅  来源注入              citation.py — 带引用的回答生成
❌  格式标准              无统一输出格式规范 UI
```

---

## `llms` — 模型管理 ✅

```
Layout
✅  模型列表              /engine/llms (29 KB) — 模型列表 + 配置面板
✅  配置详情              每个模型的参数详情

UI
✅  模型卡片              模型卡片 + 状态指示
✅  参数表单              参数配置表单
✅  状态指示              在线/离线状态

UX
✅  一键切换              侧栏切换当前模型
✅  参数微调              useModels.ts (14 KB) 参数管理
✅  连通测试              模型连通性检测

Func
✅  多厂适配              resolver.py — Ollama / Azure OpenAI 适配
✅  参数管理              Llms Collection — 模型参数持久化
❌  令牌统计              无 token 用量统计
❌  故障降级              无自动 fallback 机制
```

---

## `query_engine` — 查询引擎 ❌ 前端占位

```
Layout
❌  调试控制台            只有 "Coming soon" 占位页 (37 行)

UI
❌  查询输入              无
❌  管线流程              无
❌  结果展示              无

UX
❌  端到端试              无
❌  管线可视              无
❌  耗时统计              无

Func
✅  全链调试              后端 api.ts (9 KB) + query.py 已实现
✅  检索合成              citation.py — 检索 + 合成全链路
✅  上下文管              Queries Collection 记录查询
❌  结果封装              前端无结果展示封装
```

---

## `evaluation` — 质量评估 🚧

```
Layout
✅  评估面板              TracePanel — 执行追踪面板（嵌入 Chat 中）
❌  指标图表              无独立评估图表页

UI
✅  评分卡片              TraceStat — FTS/Vector/TOC/Context 统计卡
❌  雷达图表              无
❌  对比表格              无

UX
❌  批量评测              无批量评测入口
❌  历史对比              无历史评测对比
❌  导出报告              无

Func
✅  忠实度评              evaluator.py — faithfulness 评估
✅  相关性评              evaluator.py — relevancy 评估
❌  指标计算              前端无指标可视化
❌  报告汇总              无报告导出
```

---

## `question_gen` — 题目生成 🚧

```
Layout
✅  书籍选择              GenerationPanel — useBooks hook 加载 indexed 书籍 + 多选网格
✅  生成入口              GenerationPanel 嵌入 QuestionsPage 顶部（可折叠）

UI
✅  书籍选框              GenerationPanel 内 BookCheckbox 网格 + 全选/取消
✅  生成按钮              GenerationPanel 3-phase 状态机 → GenerationProgress
✅  题目卡片              QuestionCards.tsx — Markdown 渲染 + 评分

UX
✅  选书生成              useQuestionGeneration hook + useBooks hook 在 GenerationPanel 中联动
✅  批量浏览              卡片(grid) / 表格(table) 切换 + 全部/筛选
❌  难度筛选              有 scoreDifficulty 展示，但无独立筛选器

Func
✅  自动出题              generator.py — LLM 自动出题
❌  多类题型              当前只有开放题，无选择题/填空题
❌  知识覆盖              无 chapter 级覆盖率统计
❌  去重校验              无重复检测
```

---

## 纯后端模块 → 需补前端 UI

## `chunking` — 文本分块 ❌ 缺前端

```
Func
✅  语义切分              chapter_extractor.py — 按章节切分
❌  标题层级              无层级可视化
❌  重叠窗口              后端有，前端无调参入口
❌  块级元数据            后端有，前端无展示

需要建
❌  API 路由              engine_v2/api/routes/chunking.py
❌  前端模块              features/engine/chunking/
❌  分块预览 UI           可视化分块结果 + 参数调整
```

---

## `toc` — 目录提取 ❌ 缺前端

```
Func
✅  层级识别              extractor.py — 多级标题识别 (9.3 KB)
✅  页码映射              pdf_page 映射
✅  标题清洗              标题文本规范化
✅  结构序列              层级树结构输出

需要建
❌  API 路由              engine_v2/api/routes/toc.py
❌  前端模块              features/engine/toc/
❌  目录树预览 UI         层级树展示 + 页码跳转
```

---

## `embeddings` — 向量嵌入 ❌ 缺前端

```
Func
✅  模型加载              resolver.py — 模型解析
✅  批量编码              嵌入模型批量调用
❌  维度配置              前端无维度选择
❌  缓存复用              前端无缓存状态展示

需要建
❌  API 路由              engine_v2/api/routes/embeddings.py
❌  前端模块              features/engine/embeddings/
❌  嵌入管理 UI           模型切换 + 维度配置 + 缓存监控
```

---

## `access` — 权限控制 ❌ 缺前端

```
Func
✅  角色鉴权              isAdmin.ts
✅  管理独占              isEditorOrAdmin.ts
✅  编辑可写              isEditorOrAdmin.ts
✅  属主可改              isOwnerOrAdmin.ts

需要建
❌  前端模块              features/access/ 或 settings 页面扩展
❌  权限管理 UI           角色列表 + 权限矩阵可视化
```

---

## 总览

```
完成度
├── ✅  完成 (4)       layout · auth · readers · ingestion
├── 🚧  部分实现 (7)   home · seed · chat · retrievers · response_synthesizers · evaluation · question_gen · llms
├── ❌  占位页 (1)     query_engine (Coming soon)
└── ❌  缺前端 (4)     chunking · toc · embeddings · access
```

---

## 待重构

```
TODO
└── ✅  shared/books 提取
    ├── 完成: 统一 BookBase 类型 + fetchBooks API + useBooks hook + useBookSidebar hook
    ├── 模块: features/shared/books/ (types.ts / api.ts / useBooks.ts / useBookSidebar.ts / index.ts)
    └── 消费方: QuestionsPage / LibraryPage / BookPicker / ChatPage / ChatHeader / ChatInput / WelcomeScreen
```
