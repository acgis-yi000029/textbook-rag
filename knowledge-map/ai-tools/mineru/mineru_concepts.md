---
topic: mineru
dimension: concepts
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — README.md"
  - "📖 Docs: [MinerU Official](https://opendatalab.github.io/MinerU/) — Quick Start + Usage"
  - "📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5"
  - "💻 Source: [batch_mineru.py](../../scripts/batch_mineru.py) — 全文"
expiry: 3m
status: current
---

# MinerU 核心概念

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — v2.7.x
> 📖 Docs: [MinerU Official](https://opendatalab.github.io/MinerU/)

---

## 术语定义

| 术语 | 定义（白话） | 英文 | 易混淆项 |
|------|-------------|------|----------|
| **Pipeline 后端** | 纯规则+模型组合的解析流程：布局检测 → OCR → 公式识别 → 表格识别，逐步处理 | Pipeline Backend | VLM 后端 |
| **VLM 后端** | 用视觉语言大模型（1.2B 参数）直接理解页面，更准但更慢 | Vision-Language Model Backend | Pipeline 后端 |
| **Hybrid 后端** | v2.7.0 新增，结合 VLM 高准确率 + Pipeline 的文本直提和 OCR 扩展能力 | Hybrid Backend | Pipeline / VLM |
| **布局检测** | 用 DocLayout-YOLO 识别页面上的文本块、标题、图片、表格、公式等区域 | Layout Detection | OCR |
| **阅读顺序** | 模型根据页面元素空间分布确定人类阅读顺序（单栏/多栏/复杂布局） | Reading Order | 页面顺序 |
| **content_list.json** | 按阅读顺序排列的内容列表，每项含 type/text/bbox（归一化 1000×1000 坐标） | Content List | middle.json |
| **middle.json** | 中间表示文件，含 `page_size`（PDF 点坐标）和 `para_blocks`（段落级 bbox） | Middle JSON | content_list.json |
| **model.json** | 模型推理原始输出，含布局检测框坐标（模型像素空间，~2.78× 缩放） | Model JSON | middle.json |
| **归一化坐标** | content_list.json 中 bbox 使用的 1000×1000 画布坐标，与 PDF 实际尺寸无关 | Normalized Coordinates | PDF 点坐标 |
| **PDF 点坐标** | PDF 标准坐标系（72 DPI），middle.json 的 `page_size` 和 `para_blocks.bbox` 使用 | PDF Point Coordinates | 归一化坐标 |
| **span** | MinerU 输出的最小文本单元，对应 PDF 中连续同格式文本段 | Span | Block / Chunk |
| **CategoryType** | model.json 中的元素分类标签：title / plain_text / table / image / equation / abandon 等 | Category Type | content_type |

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — README.md, Key Features
> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5.1

---

## 概念辨析

### Pipeline 后端 vs VLM 后端 vs Hybrid 后端

| 维度 | Pipeline | VLM | Hybrid |
|------|----------|-----|--------|
| **本质** | 多模型串行管道 | 端到端视觉语言模型 | VLM 为基 + Pipeline 能力扩展 |
| **准确率** | 中等 | 高 | 最高（v2.7+ 默认） |
| **速度** | 快（尤其 CPU） | 较慢（需 GPU） | 中等 |
| **文本 PDF** | 直接提取嵌入文本 | 模型重新识别 | 直提文本 + 模型理解 |
| **扫描 PDF** | 需启用 OCR | 自动处理 | 自动处理 + 指定 OCR 语言 |
| **公式处理** | UniMERNet 模型 | VLM 内置 | VLM + 可关闭 inline 公式 |
| **适用场景** | 纯 CPU 环境 / 大批量 | 高精度需求 | 通用推荐（v2.7+默认） |
| **CLI 标志** | `-b pipeline` | `-b vlm-auto-engine` | `-b hybrid-auto-engine` |

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Changelog v2.7.0
> 📖 Docs: [MinerU Official](https://opendatalab.github.io/MinerU/) — Usage

### content_list.json vs middle.json vs model.json

| 维度 | content_list.json | middle.json | model.json |
|------|-------------------|-------------|------------|
| **本质** | 简化的阅读序内容列表 | 中间处理表示 | 原始模型推理输出 |
| **坐标系** | 归一化 1000×1000 画布 | PDF 点（72 DPI） | 模型渲染像素（~2.78×） |
| **粒度** | block 级（段落/表格/图片） | block + span 级 | 检测框级 |
| **包含结构** | 无层次，纯平 list | 含 `page_size`、`para_blocks` 层次 | 含 `layout_dets`、分类标签 |
| **典型用途** | 入库切块 + bbox 定位 | 精确坐标验证 | 布局质量调试 |
| **文件大小** | 最小 | 中等 | 最大 |

> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5.1 三套坐标系
> 💻 Source: [_verify_coords.py](../../scripts/_verify_coords.py) — 坐标验证脚本

### MinerU vs pdfminer.six vs PyPDF

| 维度 | MinerU | pdfminer.six | PyPDF |
|------|--------|-------------|-------|
| **本质** | 端到端文档解析系统 | Python PDF 文本提取库 | PDF 操作库 |
| **结构保留** | ✅ 标题/段落/列表 | ❌ 纯文本流 | ❌ 纯文本/元数据 |
| **公式识别** | ✅ LaTeX 输出 | ❌ | ❌ |
| **表格识别** | ✅ HTML 输出 | ❌ | ❌ |
| **OCR** | ✅ 109 种语言 | ❌ | ❌ |
| **布局检测** | ✅ 模型检测 | ❌ | ❌ |
| **依赖** | PyTorch + 模型权重 | 纯 Python | 纯 Python |
| **速度** | 较慢（模型推理） | 快 | 最快 |

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — README.md
> 📖 Docs: [pdfminer.six](https://github.com/pdfminer/pdfminer.six) — README

---

## 核心属性

### 信息架构

```
┌─────────────────────────────────────────────────────┐
│                    MinerU 系统                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  输入层                                              │
│  ├── PDF 文件（文本型 / 扫描型）                       │
│  └── 图片文件（JPEG/PNG，v2.7+）                      │
│                                                     │
│  解析引擎层                                           │
│  ├── Pipeline 后端                                   │
│  │   ├── DocLayout-YOLO (布局检测)                    │
│  │   ├── PaddleOCR (文字识别)                         │
│  │   ├── UniMERNet (公式识别)                         │
│  │   └── RapidTable (表格识别)                        │
│  ├── VLM 后端                                        │
│  │   └── 1.2B 视觉语言模型                            │
│  └── Hybrid 后端（VLM + Pipeline 扩展，v2.7+ 默认）    │
│                                                     │
│  输出层                                              │
│  ├── Markdown（多模态 / NLP 模式）                     │
│  ├── content_list.json（归一化坐标）                   │
│  ├── middle.json（PDF 点坐标）                        │
│  ├── model.json（模型推理原始输出）                     │
│  ├── _layout.pdf（布局可视化）                         │
│  └── _span.pdf（span 可视化）                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — README.md, Acknowledgments

### 适用场景 ✅

- 教科书 PDF 批量解析 → RAG 系统入库
- 学术论文 PDF → 结构化数据
- LLM 预训练语料清洗（清除页眉/页脚/页码）
- Citation 定位（bbox → PDF 页面高亮）
- 多语言文档 OCR

### 不适用场景 ❌

- 漫画/画册/美术类 PDF
- 小学教科书/习题册（复杂排版）
- 实时/在线 PDF 处理（模型推理较慢）
- 纯文本 PDF 且不需要结构信息（pdfminer 更快）

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Known Issues

---

## 速查表

| 项 | 说明 | 示例 |
|-----|------|------|
| 安装 | pip/uv 安装完整版 | `uv pip install -U "mineru[all]"` |
| CLI 基本用法 | 解析单个 PDF | `mineru -p input.pdf -o output/` |
| Pipeline 后端 | 纯 CPU 可运行 | `mineru -p input.pdf -o output/ -b pipeline` |
| Hybrid 后端 | v2.7+ 默认 | `mineru -p input.pdf -o output/ -b hybrid-auto-engine` |
| 输出目录结构 | {书名}/auto/ 下 | `{name}.md`, `{name}_content_list.json`, `{name}_middle.json` |
| 坐标转换 | 归一化 → PDF 点 | `pdf_x = bbox_x / 1000 × page_width` |
| Docker | 容器化部署 | 参见官方 Docker Deployment Instructions |
| Python API | 编程调用 | 参见 `mineru_code.md` |

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Quick Start
> 📖 Docs: [MinerU Official](https://opendatalab.github.io/MinerU/) — Usage Guide
