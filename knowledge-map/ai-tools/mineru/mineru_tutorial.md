---
topic: mineru
dimension: tutorial
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — README.md + Changelog"
  - "📖 Docs: [MinerU Official](https://opendatalab.github.io/MinerU/) — Quick Start + Usage"
  - "💻 Source: [batch_mineru.py](../../scripts/batch_mineru.py) — 全文"
  - "💻 Source: [rebuild_db.py](../../scripts/rebuild_db.py) — 全文"
  - "📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5"
expiry: 3m
status: current
---

# MinerU 教程

> **前置知识：** PDF 基础概念、命令行操作、Python 基础
> **参考来源：** [MinerU GitHub](https://github.com/opendatalab/MinerU) | [MinerU Docs](https://opendatalab.github.io/MinerU/) | [batch_mineru.py](../../scripts/batch_mineru.py)

---

## Section 0: 前置知识速查

1. **PDF 坐标系**：PDF 使用 72 DPI 的"点"坐标系，页面左上/左下为原点（取决于实现），尺寸以点为单位
2. **Markdown**：轻量标记语言，`#` 标题、`**` 加粗、`|` 表格、`$$` LaTeX 公式
3. **JSON**：JavaScript 对象表示法，MinerU 输出结构化数据的主要格式
4. **OCR**：光学字符识别，将图片中的文字转换为可编辑文本
5. **YOLO**：You Only Look Once，实时目标检测模型，MinerU 用其变体做布局检测
6. **pip / uv**：Python 包管理器，uv 是更快的新一代 pip 替代品

> 📖 Docs: [MinerU Official](https://opendatalab.github.io/MinerU/) — Quick Start

---

## Section 1: 它解决什么问题（Why）

### 没有它会怎样？

- 📄 **PDF 是"打印格式"，不是"数据格式"** — PDF 存储的是渲染指令（在这个位置画这个字），不是语义结构（这是标题、这是段落）
- 🔀 **多栏布局的阅读顺序混乱** — PyPDF/pdfminer 按字符流提取文本，多栏 PDF 会把左右栏的文字交织在一起
- 📐 **公式变乱码** — 嵌入 PDF 的数学公式在纯文本提取时变成无意义的 Unicode 碎片
- 📊 **表格被拆散** — PDF 中的表格实际上是一堆独立的文字块和线条，纯文本提取后结构完全丢失
- 📖 **扫描版无法处理** — 老版教科书是扫描 PDF，里面根本没有可提取的文字

### 它的核心价值

1. **结构化解析**：不仅提取文字，还保留标题层次、段落边界、列表结构
2. **智能阅读顺序**：用布局检测模型（DocLayout-YOLO）理解页面空间分布，输出人类阅读顺序
3. **公式 → LaTeX**：UniMERNet 模型自动将 PDF 中的数学公式转换为 LaTeX 格式
4. **表格 → HTML**：RapidTable 模型将表格提取并转换为结构化 HTML
5. **bbox 坐标定位**：每个内容块附带边界框坐标，可用于 citation 高亮和页面定位
6. **批量处理**：CLI 支持批量处理整个目录的 PDF

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Project Introduction, Key Features

---

## Section 2: 它怎么工作的（How — 底层原理）

### 2.1 生命周期 / 流程图

```
┌────────────────────────────────────────────────────────────────┐
│                     MinerU 解析管道                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ① 输入预处理                                                   │
│  ┌──────────┐                                                  │
│  │  PDF 文件  │──→ 逐页渲染为图片 ──→ 检测 PDF 类型              │
│  └──────────┘     (pypdfium2)       (文本型 vs 扫描型)          │
│                                                                │
│  ② 布局检测 (Layout Detection)                                  │
│  ┌──────────────────────────────────────────────┐              │
│  │  DocLayout-YOLO                               │              │
│  │  ├── 检测区域: title / text / table / image   │              │
│  │  │            equation / header / footer      │              │
│  │  ├── 输出: 检测框 + 分类标签 + 置信度          │              │
│  │  └── 确定阅读顺序 (xy-cut / layoutreader)     │              │
│  └──────────────────────────────────────────────┘              │
│                                                                │
│  ③ 内容识别 (Content Recognition)                               │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐         │
│  │ 文本块         │ │ 公式区域      │ │ 表格区域        │         │
│  │ ├── 文本PDF:   │ │ ├── YOLOv8   │ │ ├── RapidTable │         │
│  │ │   直提嵌入文字│ │ │   公式检测   │ │ │   结构识别    │         │
│  │ └── 扫描PDF:   │ │ └── UniMERNet│ │ └── → HTML     │         │
│  │     PaddleOCR  │ │     → LaTeX  │ │                │         │
│  └──────────────┘ └──────────────┘ └────────────────┘         │
│                                                                │
│  ④ 后处理 (Post-processing)                                     │
│  ├── 清除页眉/页脚/页码/脚注                                     │
│  ├── 合并跨页表格                                                │
│  ├── 排列为阅读顺序                                              │
│  └── 生成输出文件                                                │
│                                                                │
│  ⑤ 输出                                                        │
│  ├── {name}.md         (Markdown 全文)                          │
│  ├── {name}_content_list.json  (结构化内容 + 1000×1000 bbox)    │
│  ├── {name}_middle.json        (中间表示 + PDF 点坐标)           │
│  ├── {name}_model.json         (模型原始输出)                    │
│  ├── {name}_layout.pdf         (布局可视化)                      │
│  └── {name}_span.pdf           (span 可视化)                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — README.md
> 💻 Source: [PDF-Extract-Kit](https://github.com/opendatalab/PDF-Extract-Kit) — 模型组件

### 2.2 三种后端的差异

**Pipeline 后端**（`-b pipeline`）：
- 按上述流程图逐步执行
- 纯 CPU 可运行，适合批量处理
- 每个模块独立，可开关

**VLM 后端**（`-b vlm-auto-engine`）：
- 用 1.2B 参数的视觉语言模型直接"看"页面
- 一次性理解布局 + 内容，不需要分步模型
- 更准确但需 GPU，更慢

**Hybrid 后端**（`-b hybrid-auto-engine`，v2.7+ 默认）：
- VLM 为基础，但文本 PDF 直接提取嵌入文字（不让 VLM 重新"OCR"）
- 支持指定 OCR 语言（扫描 PDF）
- 可单独关闭 inline 公式识别
- 综合准确率最高

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Changelog v2.7.0

### 2.3 三套坐标系

MinerU 对每个 PDF 生成三个 JSON 文件，各自使用**不同的坐标空间**：

| 文件 | 坐标系 | 来源 | 用途 |
|------|--------|------|------|
| `content_list.json` bbox | 归一化 1000×1000 画布 | 后处理归一化 | 入库 + 前端定位 |
| `middle.json` page_size + para_blocks.bbox | PDF 点（72 DPI） | PDF 原生 | 精确验证基准 |
| `model.json` layout_dets | 模型渲染像素（~2.78×） | 检测推理 | 调试布局质量 |

**关键认知**：这不是 bug — 三套坐标系各有明确用途。content_list 归一化是为了跨不同尺寸 PDF 的一致性。

> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5.1

### 2.4 输出格式详解

**Markdown 输出**：
- 保留 `#` 标题层级
- 公式用 `$$..$$` 包裹（LaTeX）
- 表格用 Markdown 表格语法
- 图片提取为独立文件并用 `![](images/xxx.jpg)` 引用

**content_list.json 结构**：
```json
[
  {
    "type": "text",
    "text": "This is a paragraph...",
    "page_idx": 0,
    "bbox": [67, 124, 579, 220]
  },
  {
    "type": "table",
    "text": "<table>...</table>",
    "page_idx": 1,
    "bbox": [50, 300, 950, 700]
  }
]
```

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Output Format
> 📖 Docs: [MinerU Official](https://opendatalab.github.io/MinerU/) — Data Structure

---

## Section 3: 局限性

1. **复杂布局受限**：极端复杂的多栏嵌套布局可能导致阅读顺序错误
2. **竖排文字支持有限**：中文/日文竖排文字的识别效果不佳
3. **目录/列表依赖规则**：通过规则而非模型识别，少见格式可能漏检
4. **代码块未支持**：布局模型尚不支持识别代码块区域
5. **特殊文档类型**：漫画/画册/小学教科书/习题册解析效果差
6. **表格复杂度**：复杂表格（合并单元格等）可能出现行列识别错误
7. **小语种 OCR**：拉丁文变音符号、阿拉伯文易混字符等 OCR 准确率较低
8. **公式渲染**：部分公式在 Markdown 中可能无法正确渲染
9. **AGPL 许可限制**：依赖的 YOLO 使用 AGPL 许可，对商业使用有限制

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Known Issues, License Information

---

## Section 4: 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------| 
| **MinerU** | 结构保留、公式/表格识别、bbox 坐标、多后端 | 需 GPU 加速、模型权重大、AGPL 许可 | 教科书/论文 → RAG 入库 |
| **pdfminer.six** | 纯 Python、轻量、速度快 | 无结构保留、无公式/表格识别、无 OCR | 简单文本 PDF 提取 |
| **PyMuPDF (fitz)** | 速度极快、丰富 API | 无公式/表格识别、结构保留有限 | 高性能文本提取 + PDF 操作 |
| **Unstructured** | 多文件格式支持、LangChain 集成 | 精度不如 MinerU、公式识别弱 | 通用文档管道 |
| **Marker** | 开源、快速、Markdown 输出 | 公式/表格支持弱于 MinerU | 轻量 Markdown 转换 |
| **Adobe Extract API** | 高精度、商业级 | 收费、闭源、需网络 | 企业级付费方案 |
| **Docling (IBM)** | 开源、多格式 | 较新、生态较小 | IBM 生态集成 |

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — README.md
> 🧪 经验: 本项目在 58 本教科书上验证 MinerU 的效果

---

## 参考来源表

| 来源 | 类型 | 使用位置 |
|------|------|---------| 
| [opendatalab/MinerU](https://github.com/opendatalab/MinerU) | 💻 开源项目 | 全文 |
| [MinerU Official Docs](https://opendatalab.github.io/MinerU/) | 📖 官方文档 | Section 0, 1, 2 |
| [PDF-Extract-Kit](https://github.com/opendatalab/PDF-Extract-Kit) | 💻 开源项目 | Section 2 |
| [requirements.md §7.5](../../docs/v1.1/requirements/requirements.md) | 📖 项目文档 | Section 2.3 |
| [batch_mineru.py](../../scripts/batch_mineru.py) | 💻 工作区代码 | Section 2 |
| [rebuild_db.py](../../scripts/rebuild_db.py) | 💻 工作区代码 | Section 2.3 |
