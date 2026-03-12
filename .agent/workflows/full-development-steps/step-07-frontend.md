# Step 7: 前端开发

## 阶段信息

- **阶段**: `frontend` - 前端开发
- **Skill**: `dev-python_frontend`
- **输入**: Sprint Plan, UX Design, Architecture, Backend Codemap
- **产出物**: `docs/codemaps/frontend.md`, `frontend/src/`

---

## 执行步骤

### 1. 加载上下文

读取并分析：

- `docs/v1.1/design/ux-design.md` - 交互模型和页面规则
- `docs/v1.1/architecture/system-architecture.md` - 前后端边界和状态模型
- `docs/v1.1/sprints/sprint-plan.md` - 前端相关 Story
- `docs/v1.1/codemaps/backend.md` - 后端服务和契约映射
- `docs/plans/US-xxx-plan.md` - 详细的 User Story 实施方案 (优先参考)

### 2. 加载 Skill

加载 `dev-python_frontend` skill，获取本仓库 Python 前端开发专业知识。

### 3. 先产出 Frontend Codemap

在修改任何前端代码之前，先创建或更新 `docs/codemaps/frontend.md`，明确：

- Ask / Library / Indexes / Evaluation 的页面边界
- `frontend/src/app.py`、`app_gradio.py`、`app_nicegui.py` 的职责
- 共享 UI 辅助模块和页面专属模块的划分
- 会话、证据、索引、评估状态的流转
- 与后端服务契约的映射
- Story 到目标文件的实现映射

只有在 codemap 明确之后，才进入实际前端实现。

### 4. 现有实现优先

本仓库前端不是 React/TypeScript 项目，优先检查现有 Python UI 入口：

| 文件 | 框架 | 用途 |
| --- | --- | --- |
| `frontend/src/app.py` | Streamlit | 主前端入口 |
| `frontend/src/app_gradio.py` | Gradio | 备选前端入口 |
| `frontend/src/app_nicegui.py` | NiceGUI | 备选前端入口 |

优先策略：

1. 优先在现有入口上重构和扩展
2. 将共享格式化、状态辅助、渲染辅助抽到 `frontend/src/` 下的 Python 模块
3. 不默认引入 JS/TS 前端脚手架或组件体系

### 5. 任务排序

从 `docs/v1.1/sprints/sprint-plan.md` 获取前端相关 Story，按依赖关系排序：

```
1. Ask 视图壳层与范围摘要
2. Library 视图与书籍浏览
3. Indexes 视图与状态卡片
4. Evaluation 视图与重跑入口
5. 共享状态与渲染辅助
6. 后端服务调用整合
...
```

### 6. 目录结构

目标结构示例：

```
frontend/
└── src/
    ├── app.py
    ├── app_gradio.py
    ├── app_nicegui.py
    ├── ask.py
    ├── library.py
    ├── indexes.py
    ├── evaluation.py
    └── ui_shared.py
```

说明：

- 只有在 codemap 说明需要拆分时，才新增辅助模块
- 保持主入口可运行，不为了“结构整齐”而拆过头

### 7. 开发循环

对于每个 Story：

```
┌─────────────────────────────────────────────┐
│  Story: {story_id} - {story_title}         │
├─────────────────────────────────────────────┤
│  1. 阅读 frontend codemap                  │
│  2. 确认目标文件和状态边界                 │
│  3. 实现视图逻辑和状态流转                 │
│  4. 抽取共享 Python 辅助模块               │
│  5. 运行检查脚本                           │
│  6. 更新 docs/plans/ 中的任务状态          │
│  7. 标记 Story 完成                        │
└─────────────────────────────────────────────┘
```

### 8. 前端实现规范

#### 8.1 结构规范

优先保持这些边界清晰：

- 页面入口负责布局和顶层状态
- 共享辅助模块负责格式化、状态键、复用渲染片段
- 不把后端调用、状态迁移、UI 渲染全部塞进一个长函数

#### 8.2 状态规范

推荐集中管理的状态：

- 当前视图
- 当前 query scope
- 当前 result set
- 当前 active citation/source
- 当前 selected book

如果使用 Streamlit：

- 统一通过 `st.session_state` 管理跨交互状态
- 状态 key 应在 codemap 中列出

#### 8.3 渲染规范

- 优先使用框架原生组件和布局能力
- 只有在必要时才使用 `unsafe_allow_html=True`
- Ask 视图必须保持 evidence-first，不得退化成普通聊天壳

### 9. 质量检查

每完成一个模块，运行检查：

```bash
uv run python -m py_compile frontend/src/app.py
uv run python -m py_compile frontend/src/app_gradio.py
uv run python -m py_compile frontend/src/app_nicegui.py
```

检查项：

- [ ] Python 无语法错误
- [ ] 共享状态 key 明确
- [ ] 视图边界与 codemap 一致
- [ ] 加载、空态、错误态齐全
- [ ] Ask 视图保持 answer plus evidence 模型

### 10. Story 完成确认

```
[✓] Story FE-xxx 完成
    - 修改文件: frontend/src/...
    - 检查结果: 通过
    - 用时: xx 分钟

继续下一个 Story? [Y/n]
```

---

## 完成检查

- [ ] 所有前端 Story 已完成
- [ ] `docs/codemaps/frontend.md` 已创建并与实现一致
- [ ] Python 语法检查通过
- [ ] 页面可正常访问
- [ ] 与后端 API 集成成功

## 状态更新

```yaml
current_phase: testing

phases:
  frontend:
    status: completed
    completed_at: "{current_time}"
    output: "frontend/src/"
```

## 下一步

→ 进入 `step-08-testing.md`
