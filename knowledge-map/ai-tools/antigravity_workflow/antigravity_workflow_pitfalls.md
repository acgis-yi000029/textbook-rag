---
topic: antigravity_workflow
dimension: pitfalls
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📖 Docs: [Antigravity Official](https://antigravity.google/docs) — Workflows"
  - "📖 Docs: [Antigravity Codelabs](https://atamel.dev) — Rules & Workflows"
  - "💻 Source: 工作区 .agent/workflows/ 实例 (9 workflows)"
expiry: 3m
status: current
---

# Antigravity Workflow 踩坑记录

> ⚠️ **这是知识库中最有价值的维度。** 每次踩坑后请追加条目。

---

## 坑 1: Workflow 没有被触发

**场景：** 创建了一个 Workflow 文件，但输入 `/my-workflow` 后 Agent 不识别。

**症状：** Agent 提示找不到或完全无反应。

**根因：** 文件不在正确的目录下，或文件名不匹配 slash command 名称。

**解法：**

```
# ❌ 错误：放在了 skills 目录
.agent/skills/my-workflow.md

# ❌ 错误：文件名有空格
.agent/workflows/my workflow.md

# ❌ 错误：忘记 .md 后缀
.agent/workflows/my-workflow

# ✅ 正确
.agent/workflows/my-workflow.md
```

**教训：** 文件名就是 slash command 名称。`my-workflow.md` → `/my-workflow`。必须在 `.agent/workflows/`（或 `.agents/workflows/`、`_agent/workflows/`、`_agents/workflows/`）目录下。

> 📖 Docs: [Antigravity Official](https://antigravity.google/docs) — Workflows 位置和命名规范

---

## 坑 2: // turbo 不生效

**场景：** 在 Workflow 步骤上方加了 `// turbo`，但 Agent 还是询问用户确认。

**症状：** 命令没有自动执行，和不加 turbo 的行为一样。

**根因：** `// turbo` 放在了错误的位置，或步骤不涉及 `run_command`。

**解法：**

❌ 错误：turbo 放在了非命令步骤上方

    // turbo
    读取 skill: .shared/skills/xxx/SKILL.md

❌ 错误：turbo 和命令之间隔了文字

    // turbo
    这一步执行构建...
    ```bash
    npm run build
    ```

✅ 正确：turbo 紧跟命令代码块

    // turbo
    ```bash
    npm run build
    ```

**教训：** `// turbo` **只对 `run_command` 有效**——即 bash/shell 代码块。文件编辑、Skill 读取等操作不受影响。turbo 注解必须紧贴命令代码块上方，中间不能有文字。

> 📖 Docs: [Antigravity Official](https://antigravity.google/docs) — turbo 注解规范

---

## 坑 3: Skill 路径硬编码导致找不到 Skill

**场景：** Workflow 中写了 `读取 skill: .shared/skills/learning-xxx/SKILL.md`，但 Agent 报错找不到文件。

**症状：** Agent 执行 Workflow 时无法加载引用的 Skill。

**根因：** Workflow 中硬编码的 Skill 路径过时或不匹配当前目录结构。

**解法：**

❌ 路径不存在

    读取 skill: .shared/skills/learning-xxx/SKILL.md

✅ 更新为实际路径

    读取 skill: .agent/skills/learning-xxx/SKILL.md

验证方法：

```bash
ls .agent/skills/ | grep "learning-xxx"
```

**教训：** 定期检查 Workflow 中引用的 Skill 路径是否仍然有效。Skill 重命名或目录重构后，务必同步更新所有引用该 Skill 的 Workflow。

> 💻 Source: 工作区 `.agent/workflows/complete-lab.md` — Skill 引用模式

---

## 坑 4: --from= 参数无效

**场景：** 用 `/workflow --from=code` 试图从中间 Phase 继续，但 Agent 还是从头开始。

**症状：** 子命令被忽略，全流程从 Phase 1 重新开始。

**根因：** Workflow 的子命令表中没有定义该选项，或 Agent 上下文被截断未看到子命令表。

**解法：**

```markdown
# ✅ 确保 Workflow 底部有明确的子命令定义表
## 💡 快捷子命令

| 命令                                | 说明           | 从哪个 Phase 开始 |
| ----------------------------------- | -------------- | ----------------- |
| `/workflow course lab`              | 完整流程       | Phase 1           |
| `/workflow course lab --from=code`  | 从代码开发开始 | Phase 4           |
| `/workflow course lab --from=doc`   | 从文档生成开始 | Phase 6           |
```

**教训：** 子命令是 Workflow 自定义的**约定**（不是系统内置功能），Agent 需要从文档文本中解析它。必须在 Workflow 底部有明确的对照表。

> 💻 Source: 工作区 `.agent/workflows/complete-lab.md` — 快捷子命令表

---

## 坑 5: Phase 之间数据丢失

**场景：** Phase 3 需要 Phase 2 的输出文件，但找不到。

**症状：** Agent 报告找不到前序 Phase 应产生的文件。

**根因：** 输出目录/文件名不一致、前序 Phase 静默失败、或用 `--from=` 跳过了前置 Phase。

**解法：**

```markdown
# ✅ 在每个 Phase 的检查点中验证输出文件
### ✅ 验证检查点

- [ ] Phase 2 输出文件存在：`courses/ml/labs/Lab2_SVM.md`
- [ ] 文件内容非空
- [ ] 图表目录已创建：`lab2_images/`
```

**教训：** Phase 之间通过文件系统传递数据。使用一致的目录结构和命名约定，并在检查点中**显式验证**前序输出的存在性。

> 🧪 经验: 使用 `--from=` 跳迈 Phase 时，务必确认前置输出已存在

---

## 坑 6: // turbo-all 导致危险操作自动执行

**场景：** Workflow 中加了 `// turbo-all`，结果 `git push` 或 `rm` 命令被自动执行。

**症状：** 有副作用的操作未经确认就执行了。

**根因：** `// turbo-all` 对**所有** `run_command` 步骤生效，不区分安全和危险操作。

**解法：**

❌ 危险做法 — 全局自动执行包含了 `git push`

    // turbo-all
    ... (中间有 git push 命令)

✅ 安全做法 — 逐步标注，只对安全操作加 turbo

    // turbo
    ```bash
    npm run build    ← 安全操作，自动执行
    ```

    # 不加 turbo    ← 有副作用，需确认
    ```bash
    git push
    ```

**教训：** `// turbo-all` 只适合**纯分析/构建类** Workflow。任何包含部署、推送、删除操作的 Workflow，都应逐步使用 `// turbo`，而非 `// turbo-all`。

> 📖 Docs: [Antigravity Official](https://antigravity.google/docs) — turbo-all 安全注意事项

---

## 坑 7: Workflow 太长导致 Agent 遗漏步骤

**场景：** Workflow 文件超过 500 行，Agent 执行时跳过了中间某些 Phase 或检查点。

**症状：** 部分 Phase 被忽略，输出不完整。

**根因：** Agent 上下文窗口有限，超长文件可能被截断。Phase 描述过于冗长时 Agent 抓不到关键信息。

**解法：**

```
# ❌ 错误结构 — 所有细节都放在 Workflow 中
complete-lab.md (800 行 — 包含所有规范、示例、注意事项)

# ✅ 正确结构 — Workflow 只保留编排逻辑，细节放到 Skill 中
complete-lab.md (400 行 — Phase 结构 + Skill 调用 + 检查点)
├── learning-code_generation/SKILL.md  (代码规范细节)
├── learning-code_comment/SKILL.md     (注释规范细节)
└── learning-notebook_conversion/SKILL.md (转换规范细节)
```

**教训：** Workflow 是**编排者**角色，不是**百科全书**。控制在 500 行以内，将具体规范下沉到 Skill 中。使用明确的 Phase 编号和 `---` 分隔线帮助 Agent 划分结构。

> 🧪 经验: 工作区中 `generate-study-material.md` (48 KB) 是最长的 Workflow，执行时偶尔出现 Phase 遗漏

---

## 坑 8: frontmatter description 写得不清楚

**场景：** 多个 Workflow 的 description 太笼统，用户不知道该用哪个。

**症状：** Agent 列出可用 Workflow 时，描述信息无法帮助用户区分。

**根因：** description 缺少关键词和使用场景说明。

**解法：**

```yaml
# ❌ 太笼统
---
description: 完成作业
---

# ✅ 清晰具体，说明适用范围和特点
---
description: Complete course lab/assignment from start to submission - universal workflow for all courses
---

# ✅ 另一个好例子
---
description: 为任意主题生成 8 维知识库文档（Map / Concepts / Math / Tutorial / Code / Pitfalls / History / Bridge）
---
```

**教训：** description 是用户选择 Workflow 的**唯一线索**。应包含：做什么 + 适用范围 + 区分特征。

> 💻 Source: 工作区 `.agent/workflows/` — 对比各 Workflow 的 description 质量

---

## 调试清单

遇到 Workflow 问题时，按以下顺序排查：

1. [ ] **文件位置正确？** → 在 `.agent/workflows/` 目录下？
2. [ ] **文件名匹配？** → 文件名 = slash command 名称？（用连字符，不用空格）
3. [ ] **Frontmatter 完整？** → 有 `---` + `description` + `---`？
4. [ ] **Skill 路径有效？** → `ls .agent/skills/` 验证引用的 Skill 存在
5. [ ] **turbo 位置正确？** → 紧跟 bash 代码块上方？不是在文字段落上方？
6. [ ] **子命令有定义？** → Workflow 底部有明确的子命令对照表？
7. [ ] **Phase 有分隔线？** → 每个 Phase 有编号 + `---` 分割？
8. [ ] **检查点有格式？** → 使用 `- [ ]` 清单格式？
9. [ ] **文件长度合理？** → < 500 行？超长文件考虑拆分？
10. [ ] **副作用操作安全？** → 有部署/推送/删除的步骤没加 turbo？
