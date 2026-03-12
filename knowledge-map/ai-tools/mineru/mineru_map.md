---
topic: mineru
dimension: map
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — README.md"
  - "💻 Source: [batch_mineru.py](../../scripts/batch_mineru.py) — 全文"
  - "💻 Source: [rebuild_db.py](../../scripts/rebuild_db.py) — 全文"
  - "📖 Docs: [MinerU Official](https://opendatalab.github.io/MinerU/) — Quick Start"
  - "📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5"
expiry: 3m
status: current
---

# MinerU 知识地图

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — v2.7.x
> 📖 Docs: [MinerU Official](https://opendatalab.github.io/MinerU/)

## 1. 核心问题

- **MinerU 是什么？** → 一个开源的 PDF → Markdown/JSON 转换工具，由 OpenDataLab（上海 AI Lab）开发，专为 LLM 预训练和 RAG 管道设计
- **它和 PyPDF / pdfminer 有什么区别？** → MinerU 不仅提取文字，还能**保留文档结构**（标题/段落/列表），**识别公式**转 LaTeX，**识别表格**转 HTML，**检测布局**确定阅读顺序
- **它输出什么？** → 三种核心输出：Markdown（人类可读）、`content_list.json`（结构化内容 + bbox 坐标）、`middle.json`（中间表示，含页面级元数据）
- **在本项目中扮演什么角色？** → 数据管道的**第一步**：58 本教科书 PDF → MinerU 解析 → 切块 → 入库（FTS5 + ChromaDB），所有检索和 citation 定位都依赖 MinerU 的输出
- **常见的坑是什么？** → 三套坐标系混用导致 bbox 错位（见 `mineru_pitfalls.md`）

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — README.md
> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5

---

## 2. 全景位置

```
文档智能 (Document Intelligence)
├── PDF 解析与提取
│   ├── 纯文本提取 — pdfminer.six / PyPDF / pdfplumber
│   ├── OCR 引擎 — PaddleOCR / Tesseract
│   ├── 布局检测 — DocLayout-YOLO / Detectron2
│   └── 端到端解析 ← 【你在这里: MinerU】
│       ├── 布局检测 + 阅读顺序
│       ├── 公式识别 (UniMERNet) → LaTeX
│       ├── 表格识别 (RapidTable) → HTML
│       ├── OCR (PaddleOCR) → 109 种语言
│       └── 结构化输出 → Markdown + JSON
├── 文档理解 — LayoutLM / DocFormer
└── 文档生成 — LaTeX / Typst
```

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Acknowledgments
> 💻 Source: [PDF-Extract-Kit](https://github.com/opendatalab/PDF-Extract-Kit) — README

---

## 3. 依赖地图

```
前置知识                        本主题                    后续方向
─────────────────────────────────────────────────────────────────
PDF 格式基础                                           RAG 管道集成
  (页面/点坐标/字体)    ──→   MinerU               ──→  (切块 → FTS5/ChromaDB)
                              ┌──────────────┐
PaddleOCR / Tesseract  ──→   │  PDF → MD     │    ──→  Citation bbox 高亮
  (OCR 基础)                  │  PDF → JSON   │         (content_list 坐标)
                              │  布局检测      │
DocLayout-YOLO        ──→    │  公式识别      │    ──→  LLM 预训练数据清洗
  (目标检测基础)              │  表格识别      │
                              └──────────────┘
PyTorch / CUDA        ──→                          ──→  知识库自动化构建
  (GPU 推理环境)
```

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Key Features
> 💻 Source: [batch_mineru.py](../../scripts/batch_mineru.py) — 批处理流程

---

## 4. 文件地图

| 文件 | 定位 | 何时用 |
|------|------|--------|
| [mineru_map.md](mineru_map.md) | ① 导航总览 | 第一次接触、快速定位 |
| [mineru_concepts.md](mineru_concepts.md) | ② 核心概念 | 理解术语 |
| [mineru_math.md](mineru_math.md) | ③ 数学公式 | 坐标系转换推导 |
| [mineru_tutorial.md](mineru_tutorial.md) | ④ 教程 | Why + How 深入理解 |
| [mineru_code.md](mineru_code.md) | ⑤ 代码 | 安装/使用/API |
| [mineru_pitfalls.md](mineru_pitfalls.md) | ⑥ 踩坑 | 避坑 + 调试 |
| [mineru_history.md](mineru_history.md) | ⑦ 历史 | 演进脉络 |
| [mineru_bridge.md](mineru_bridge.md) | ⑧ 衔接 | 关联主题 |

---

## 5. 学习/使用路线

### 第一次学习 🎒

1. 读 [mineru_concepts.md](mineru_concepts.md) — 了解 Pipeline / Hybrid / VLM 三种后端和输出格式
2. 读 [mineru_tutorial.md](mineru_tutorial.md) Section 1-2 — 理解动机和工作原理
3. 读 [mineru_code.md](mineru_code.md) 快速开始 — 安装并跑通第一个 PDF
4. 读 [mineru_pitfalls.md](mineru_pitfalls.md) — 提前了解常见坑

### 日常参考 🔧

1. 查 [mineru_code.md](mineru_code.md) API 速查 — CLI / Python API 参数
2. 查 [mineru_pitfalls.md](mineru_pitfalls.md) — 遇到问题时排查
3. 查 [mineru_math.md](mineru_math.md) — 坐标转换公式速查

### 深度研究 🔬

1. 读 [mineru_tutorial.md](mineru_tutorial.md) Section 2 — 布局检测 + OCR + 公式识别内部原理
2. 读 [mineru_history.md](mineru_history.md) — 理解从 magic-pdf 到 MinerU 2.5 的演进
3. 读 [mineru_bridge.md](mineru_bridge.md) — 与 PDF-Extract-Kit、RAG 系统的关联

---

## 6. 缺口检查

| 维度 | 状态 |
|------|------|
| Map | ✅ 完成 |
| Concepts | ✅ 完成 |
| Math | ✅ 完成 |
| Tutorial | ✅ 完成 |
| Code | ✅ 完成 |
| Pitfalls | ✅ 完成 |
| History | ✅ 完成 |
| Bridge | ✅ 完成 |

---

## 7. 新鲜度状态

| 维度 | 上次验证 | 过期时间 | 状态 |
|------|---------|---------|------|
| Map | 2026-03-11 | 2026-06-11 | ✅ current |
| Concepts | 2026-03-11 | 2026-06-11 | ✅ current |
| Math | 2026-03-11 | 2026-06-11 | ✅ current |
| Tutorial | 2026-03-11 | 2026-06-11 | ✅ current |
| Code | 2026-03-11 | 2026-06-11 | ✅ current |
| Pitfalls | 2026-03-11 | 2026-06-11 | ✅ current |
| History | 2026-03-11 | 2026-06-11 | ✅ current |
| Bridge | 2026-03-11 | 2026-06-11 | ✅ current |
