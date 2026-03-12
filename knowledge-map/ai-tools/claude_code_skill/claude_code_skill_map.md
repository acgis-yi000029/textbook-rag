---
topic: claude_code_skill
dimension: map
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "Anthropic Claude Code Skills Docs (2026-03 revision)"
  - "Anthropic Claude Code Subagents Docs (2026-03 revision)"
  - "Anthropic Claude Code Hooks Docs (2026-03 revision)"
  - "Anthropic Claude Code Memory Docs (2026-03 revision)"
  - "SkillsBench paper (arxiv 2502.09790, Feb 2026)"
expiry: 3m
status: current
---

# Claude Code Skill 2.0 知识地图

## 1. 核心问题

本主题回答：

- **Claude Code Skill 是什么？** → 打包好的可复用指令集，教 Claude 如何执行特定任务
- **它解决什么问题？** → 消除重复性指令输入，标准化工作流，控制 AI 行为边界
- **和 CLAUDE.md / Commands / Subagent 有什么区别？** → Skill 是按需加载的任务级指令（不同于 CLAUDE.md 的全局背景），比 Commands 更智能，比 Subagent 更聚焦
- **Skill 2.0 比 1.0 多了什么？** → 调用控制、工具限制、动态注入、上下文隔离、Hooks、Bundled Skills、Skill Creator、SkillsBench

---

## 2. 全景位置

```
Claude Code 扩展体系
├── Memory（记忆层）
│   ├── CLAUDE.md ─── 全局规范（始终加载）
│   ├── Auto Memory ── 自动学习的经验
│   └── .claude/rules/ ── 按路径匹配的规则
│
├── Skills（技能层）◄─── 【你在这里】
│   ├── Bundled Skills ── /simplify, /batch, /debug, /loop, /claude-api
│   ├── Custom Skills ─── SKILL.md (frontmatter + body + supporting files)
│   ├── Skill Creator ── 内置元技能，交互式创建新 Skill
│   └── Slash Commands ── .claude/commands/ (旧版，被 Skills 取代)
│
├── Subagents（代理层）
│   ├── Built-in ──── Explore, Plan, General-purpose
│   └── Custom ───── .claude/agents/*.md
│
├── Hooks（钩子层）
│   ├── Lifecycle ─── PreToolUse, PostToolUse, Stop, etc.
│   └── Security ──── 命令过滤、安全审查
│
└── Plugins（分发层）
    └── Package ──── skills/ + hooks/ + agents/ 打包分发
```

---

## 3. 依赖地图

```
前置知识                          本主题                          后续方向
─────────────                    ────────                        ─────────
Markdown + YAML ────┐
                    │
CLAUDE.md ──────────┤
  (持久化指令)       ├──→ Claude Code Skill 2.0 ──┬──→ Subagent 设计
                    │      │                      │      (自定义代理)
Shell / Bash ───────┤      │                      │
  (命令执行)         │      ├── SKILL.md 编写       ├──→ Plugin 开发
                    │      ├── Frontmatter 配置    │      (技能打包)
                    │      ├── 动态注入 (!)        │
Git ────────────────┘      ├── 工具限制            ├──→ CI/CD 集成
  (版本控制)                ├── Hooks 配置          │      (自动化)
                           ├── Subagent 执行       │
                           ├── Skill Creator       │
                           └── SkillsBench 验证    └──→ Agent Teams
                                                          (多代理协作)
```

---

## 4. 文件地图

| 文件 | 定位 | 何时用 |
|------|------|--------|
| [claude_code_skill_map.md](claude_code_skill_map.md) | 🗺️ 导航入口 | 进入本主题时 |
| [claude_code_skill_concepts.md](claude_code_skill_concepts.md) | 📖 术语定义 + 辨析 | 概念不清时（Skill vs Command vs Subagent vs CLAUDE.md） |
| ~~claude_code_skill_math.md~~ | ⬜ 不适用 | 本主题无数学内容 |
| [claude_code_skill_tutorial.md](claude_code_skill_tutorial.md) | 📚 原理深度讲解 | 想深入理解 Skill 工作机制时（含 Skill Creator + SkillsBench） |
| **[claude_code_skill_usage.md](claude_code_skill_usage.md)** | 🛠️ **实战用法** | **想现在就用起来（10 个场景 + 模板库 + 决策树）** |
| [claude_code_skill_code.md](claude_code_skill_code.md) | 💻 代码参考 | 写 Skill 时（含 7 个从简到繁的示例） |
| [claude_code_skill_pitfalls.md](claude_code_skill_pitfalls.md) | ⚠️ 踩坑记录 | 调试 / 避坑时（10 个常见坑 + 调试清单） |
| [claude_code_skill_history.md](claude_code_skill_history.md) | 📜 历史演进 | 想了解从 Commands 演进到 Skills 2.0 + Skill Creator + SkillsBench |
| [claude_code_skill_bridge.md](claude_code_skill_bridge.md) | 🔗 跨主题衔接 | 了解 Skill 与 Subagent/Hook/Plugin 的关系 |

---

## 5. 学习/使用路线

### 第一次学习 🎒

1. **[Tutorial](claude_code_skill_tutorial.md)** → 理解 Skill 的动机和工作原理
2. **[Concepts](claude_code_skill_concepts.md)** → 确认术语、搞清 Skill/Command/Subagent 的区别
3. **[Usage — 场景 1-2](claude_code_skill_usage.md)** → 用 Skill Creator 或手动创建你的第一个 Skill

### 日常开发参考 🔧

1. **[Usage](claude_code_skill_usage.md)** → 找到匹配你场景的完整操作流程 + 模板
2. **[Code](claude_code_skill_code.md)** → 代码级参考和 API 速查
3. **[Pitfalls](claude_code_skill_pitfalls.md)** → 检查常见陷阱
4. **[Concepts - Frontmatter 速查](claude_code_skill_concepts.md)** → 查字段定义

### 深度研究 🔬

1. **[History](claude_code_skill_history.md)** → 理解从 Commands 到 Skills 2.0 的演进逻辑
2. **[Bridge](claude_code_skill_bridge.md)** → 了解 Skill 在整个 Claude Code 生态中的位置
3. **[Tutorial - Section 2](claude_code_skill_tutorial.md)** → 深入三层加载机制和子代理执行模型

---

## 6. 缺口检查

| 维度 | 状态 |
|------|------|
| 导航地图 | ✅ |
| 概念定义 | ✅（17 个术语（含 Skill Creator + SkillsBench）+ 4 组辨析） |
| 数学公式 | ⬜ 不适用 |
| 原理教程 | ✅（Why-First + 底层原理 + Skill Creator + SkillsBench + 方案对比） |
| **实战用法** | **✅（10 个场景 + 模板库 + 决策树 + 速查表）** |
| 代码参考 | ✅（7 个示例 + API 速查 + 目录模板） |
| 踩坑记录 | ✅（初始 10 条，持续更新） |
| 历史演进 | ✅（4 个 Station + Skill Creator + SkillsBench） |
| 跨主题衔接 | ✅（上下游 + 跨工具映射 + 三层扩展阅读） |

---

## 7. 新鲜度状态

| 维度 | 上次验证 | 过期时间 | 状态 |
|------|---------|---------|------|
| Map | 2026-03-11 | 2026-06-11 | ✅ current |
| Concepts | 2026-03-11 | 2026-06-11 | ✅ current |
| Math | — | — | ⬜ 不适用 |
| Tutorial | 2026-03-11 | 2026-06-11 | ✅ current |
| **Usage** | **2026-03-11** | **2026-06-11** | **✅ current** |
| Code | 2026-03-11 | 2026-06-11 | ✅ current |
| Pitfalls | 2026-03-11 | 2026-06-11 | ✅ current |
| History | 2026-03-11 | 2026-09-11 | ✅ current |
| Bridge | 2026-03-11 | 2026-06-11 | ✅ current |

> ⚠️ **本主题属于快速迭代的工具/库**，默认 expiry 为 3 个月（History 为 6 个月）。
> Anthropic 更新 Claude Code 文档时需复查。
