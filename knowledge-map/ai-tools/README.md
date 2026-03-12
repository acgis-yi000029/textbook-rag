# AI Tools 知识体系

## 子主题导航

| 序号 | 主题 | 核心问题 | 前置依赖 |
|------|------|---------|---------| 
| 1 | [MinerU](mineru/) | PDF → Markdown/JSON 转换工具。三种后端（Pipeline/VLM/Hybrid）？三套坐标系怎么用？ | PDF 基础 + Python |
| 2 | [Claude Code Skill 2.0](claude_code_skill/) | 如何编写和管理 Claude Code 的自定义技能？Skill vs Command vs Subagent 的区别是什么？ | Markdown + YAML 基础 |
| 3 | [Antigravity Workflow](antigravity_workflow/) | Antigravity 的 Workflow 是什么？如何用 `/slash-command` 编排多步骤流程？和 Skill 有什么区别？ | Antigravity 基本使用 |

## 建议学习顺序

MinerU → Antigravity Workflow → Claude Code Skill → Claude Code Subagent → Claude Code Hooks

## 说明

此知识库由 `/generate-knowledge-map` 工作流生成，使用 8 维知识体系（Map / Concepts / Math / Tutorial / Code / Pitfalls / History / Bridge）。

每个子主题的入口文件是 `{topic}_map.md`。
