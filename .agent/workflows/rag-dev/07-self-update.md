---
description: rag-dev 工作流自更新规则 — 开发过程中自动保持工作流与项目同步
---

# 🔄 工作流自更新规则

## 何时触发自更新

在以下情况下，AI 助手应主动检查并更新 rag-dev 工作流文件：

1. **新增 feature 模块** → 更新 `01-project-structure.md` 的目录树
2. **新增 Engine API 路由** → 更新 `01-project-structure.md` 的 routes 列表
3. **新增 Dashboard 页面** → 更新 `01-project-structure.md` 的 dashboard 子页列表
4. **新增脚本** → 更新 `01-project-structure.md` 的 scripts 列表
5. **修改核心规则/约定** → 更新 `02-core-rules.md`
6. **新增数据目录/文件** → 更新 `01-project-structure.md` 的 data 列表
7. **新增共享组件** → 更新 `02-core-rules.md` 的 UI 组件规范
8. **修改启动/运行方式** → 更新 `04-run-and-debug.md`

## 更新方式

### 自动触发（推荐）

每次开发任务结束、代码提交前，AI 应执行以下检查：

```
检查清单:
□ 是否新增了 features/ 下的子目录？→ 更新 01
□ 是否新增了 engine/api/routes/ 下的文件？→ 更新 01
□ 是否新增了 scripts/ 下的脚本？→ 更新 01
□ 是否新增了 dashboard 子页面？→ 更新 01
□ 是否引入了新的开发规则或约定？→ 更新 02
□ 是否修改了启动命令或环境配置？→ 更新 04
```

### 手动触发

用户可以说：
- "更新 rag-dev 工作流" 或 "/rag-dev update"
- AI 会扫描项目目录，对比工作流文件，自动修正不一致之处

## 更新原则

1. **只更新事实性内容**（目录树、文件列表、路由列表）
2. **不修改设计决策**（核心规则、约定、路线图）
3. **保持格式一致**（与现有 md 文件风格一致）
4. **在 commit message 中注明** — `chore: update rag-dev workflow (auto-sync)`

## 示例：新增 feature 后的自更新

假设新增了 `features/evaluation/` 模块：

```diff
# 01-project-structure.md
 │   │   └── features/
+│   │       ├── evaluation/        # 评估功能
 │   │       ├── chat/              # 聊天功能
```

```diff
# rag-dev.md 主入口不变，只更新子文件
```
