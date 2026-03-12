---
name: knowledge-map-format
description: 知识地图文件格式模板。Use when (1) generating knowledge map files via /generate-knowledge-map, (2) reviewing knowledge map formatting, (3) user says "格式不对" or "format template" for knowledge map files. Enforces consistent structure across all 8 dimensions.
---

# Knowledge Map Format Templates

> 本 Skill 定义 `/generate-knowledge-map` 生成的**每个维度文件的固定结构**。
> 模板从已验证的 `claude_code_skill` 系列文件提取，每个章节编号固定。

---

## 通用规则（所有维度必须遵守）

### R1. Frontmatter 格式

```yaml
---
topic: {topic_name}
dimension: {dimension}  # map | concepts | math | tutorial | usage | code | pitfalls | history | bridge
created: {YYYY-MM-DD}
last_verified: {YYYY-MM-DD}
source_versions:
  - "📚 Book: [文件名.pdf](../../textbooks/文件名.pdf) — Ch.X"          # 教科书（必须链接到实际文件）
  - "📚 MinerU: [文件名.md](../../data/mineru_output/.../文件名.md)"     # MinerU 解析输出
  - "📖 Docs: [名称](../../.documents/分类/文件) — 章节"                 # 官方文档（优先下载到 .documents/）
  - "📖 Paper: [简称](URL)"                                              # 公开论文直接 URL（见 .documents/分类/papers.md）
  - "💻 Source: [仓库名](../../.github/仓库名/) — 文件:行号"             # 开源项目参考代码
  - "🧪 经验: 简短说明"                                                  # 实践经验（仅用于 Pitfalls）
expiry: 3m   # 3m | 6m | 12m | never
status: current  # current | needs_review | outdated
---
```

### R2. 来源引证

每个 `##` 章节结尾必须有 `>` 引用块。格式严格为：

```
> 📚 Book: 作者, [《书名》](../../textbooks/文件名.pdf), Ch.X
> 📖 Docs: [名称](../../.documents/分类/文件) — 章节
> 📖 Paper: [简称](URL)
> 💻 Source: [仓库名](../../.github/仓库名/) `文件:行号`
> 🧪 经验: 简短说明
```

### R3. 代码块禁止嵌套

❌ **绝对禁止** ` ```markdown ` 中嵌套 ` ```bash ` — 会导致渲染崩坏。

替代方案：用 **4 空格缩进** 表示内层代码：

    // turbo
    ```bash
    npm run build
    ```

### R4. ❌/✅ 对比格式

不用代码块包裹，直接用 ❌/✅ + 4 空格缩进：

```
❌ 错误写法 — 原因说明

    错误的代码或配置

✅ 正确写法 — 原因说明

    正确的代码或配置
```

### R5. 分隔线

- `##` 章节之间用 `---` 分隔
- `###` 小节之间**不用** `---`

### R6. 标题后引证

每个文件 `# 标题` 下紧跟一行全局引证：

```
# {Topic} {维度名}

> 📚 Book: 作者, [《书名》](../../textbooks/文件.pdf), Ch.X
```

### R7. 素材目录规范

**工作区素材结构（固定）：**

| 来源类型 | 目录 | 说明 |
|---------|------|------|
| 📚 教科书 PDF | `textbooks/` | 原始 PDF，引用时必须链接到此目录 |
| 📚 MinerU 解析 | `data/mineru_output/{book}/` | 教科书的 MinerU 输出（.md + .json） |
| 💻 开源项目 | `.github/` | 参考代码仓库 |
| 📖 官方文档 | `.documents/` | 下载到本地的官方文档 |

**禁止事项：**

- ❌ 绝不引用自己生成的代码作为权威来源（知识地图记录的是主题知识，不是代码实现）
- ❌ 绝不用“工作区源码”作为理论概念的引证来源
- ✅ 教科书引用必须链接到 `textbooks/` 下的实际 PDF 文件
- ✅ 开源项目引用必须链接到 `.github/` 下的实际仓库
- ✅ 官方文档优先下载到 `.documents/` 再引用
- ✅ `🧪 经验` 仅用于 Pitfalls 维度中的实践经验

---

## 维度模板

### DIM-1: Map（导航地图）

固定章节编号：

```
# {Topic} 知识地图

> 📖 Docs: [来源](URL)

## 1. 核心问题
（3-5 个问题，用 - **问题？** → 一句话回答 格式）

---

## 2. 全景位置
（ASCII 树状图，标注【你在这里】）

---

## 3. 依赖地图
（ASCII 图：前置知识 → 本主题 → 后续方向）

---

## 4. 文件地图
| 文件 | 定位 | 何时用 |
|------|------|--------|
（列出所有维度文件，不存在的用 ~~删除线~~ 标注）

---

## 5. 学习/使用路线

### 第一次学习 🎒
（编号步骤，每步链接一个文件）

### 日常参考 🔧
（编号步骤）

### 深度研究 🔬
（编号步骤）

---

## 6. 缺口检查
| 维度 | 状态 |
|------|------|

---

## 7. 新鲜度状态
| 维度 | 上次验证 | 过期时间 | 状态 |
|------|---------|---------|------|
```

> 📖 参考: `claude_code_skill_map.md` — 7 个固定章节

---

### DIM-2 through DIM-9

All remaining dimensions have **complete fixed templates** with mandatory chapter structures:

| DIM | 名称 | 固定章节 |
|-----|------|---------|
| 2 | Concepts | 术语表 → 辨析 → 属性 → 速查 |
| 3 | **Math** | **符号表 → 公式(直觉+推导) → 关系图 → 手算练习 → 速查** |
| 4 | Tutorial | Section 0-4 + 参考来源表 |
| 5 | Usage | 场景 N + 速查表 |
| 6 | Code | 快速开始 → 完整实现 → API 速查 → 目录模板 |
| 7 | Pitfalls | 坑(场景/症状/根因/解法/教训) + 调试清单 |
| 8 | History | 时间轴 + Station(问题/创新/局限) |
| 9 | Bridge | 前后导航 → 上下游 → 概念演变 → 扩展阅读 |

> 📖 See [references/dimension_templates.md](references/dimension_templates.md) for complete templates of all dimensions.
