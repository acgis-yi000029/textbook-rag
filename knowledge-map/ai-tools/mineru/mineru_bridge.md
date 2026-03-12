---
topic: mineru
dimension: bridge
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — README.md + Acknowledgments"
  - "💻 Source: [PDF-Extract-Kit](https://github.com/opendatalab/PDF-Extract-Kit) — README"
  - "📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — 全文"
  - "💻 Source: [batch_mineru.py](../../scripts/batch_mineru.py)"
  - "💻 Source: [rebuild_db.py](../../scripts/rebuild_db.py)"
expiry: 6m
status: current
---

# MinerU 衔接与扩展

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — v2.7.x
> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md)

---

## ← 上一个概念 / 下一个概念 →

| 方向 | 主题 | 关系 | 链接 |
|------|------|------|------|
| ← 前置 | PDF 格式基础 | MinerU 的输入格式，理解坐标系需要 PDF 点坐标概念 | 通用前置知识 |
| ← 前置 | PyTorch / CUDA 环境 | MinerU 的布局检测和公式识别需要 GPU 推理 | 通用前置知识 |
| → 后续 | RAG 检索管道 | MinerU 输出是 RAG 系统的数据源 | [retrieval_lab](../../../knowledge-map/retrieval_lab/) |
| → 后续 | Citation bbox 高亮 | 前端用 MinerU 的 bbox 坐标定位 PDF 页面位置 | [requirements.md §7.5](../../docs/v1.1/requirements/requirements.md) |
| → 后续 | 数据库构建 | MinerU 输出经 rebuild_db.py 入库 | [rebuild_db.py](../../scripts/rebuild_db.py) |

> 💻 Source: [batch_mineru.py](../../scripts/batch_mineru.py) — 上游：PDF → MinerU
> 💻 Source: [rebuild_db.py](../../scripts/rebuild_db.py) — 下游：MinerU → DB

---

## 上游依赖

| 来自主题 | 复用的概念 | 在本主题中如何使用 |
|----------|-----------|-------------------| 
| PDF 格式标准 | 页面坐标系（72 DPI 点） | middle.json 的 `page_size` 使用 PDF 点坐标 |
| PDF 格式标准 | 嵌入文字 vs 扫描图片 | MinerU 自动检测 PDF 类型，决定是否启用 OCR |
| YOLO 目标检测 | 锚框检测 + NMS | DocLayout-YOLO 用于布局检测，输出检测框 + 分类标签 |
| Transformer VLM | 视觉语言理解 | VLM/Hybrid 后端使用 1.2B 参数模型直接理解页面 |
| PaddleOCR | 文字检测 + 识别 | OCR 模块处理扫描 PDF 的文字识别，支持 109 种语言 |
| UniMERNet | 数学公式识别 | 将 PDF 中的数学公式区域转换为 LaTeX 格式 |
| RapidTable | 表格结构识别 | 将 PDF 中的表格区域转换为 HTML 格式 |

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Acknowledgments
> 💻 Source: [PDF-Extract-Kit](https://github.com/opendatalab/PDF-Extract-Kit) — Core Components

---

## 下游影响

| 去向主题 | 本主题提供的概念 | 在下游如何被使用 |
|----------|-----------------|-----------------| 
| RAG 检索管道 | Markdown 结构化文本 | 切块后存入 FTS5（全文搜索）和 ChromaDB（向量搜索） |
| RAG 检索管道 | content_list.json 内容分类 | `type` 字段（text/table/image/equation）用于 content_type 过滤 |
| Citation 定位 | content_list bbox 坐标 | 转换为 PDF 点坐标后，前端渲染 bbox overlay 高亮 |
| 主题索引 | content_list 标题层次 | rebuild_topic_index.py 从内容提取章节结构，构建 toc_entries |
| PageIndex 检索 | 章节标题树 | toc_entries 表构建目录树，LLM 推理导航查找相关章节 |
| Metadata 过滤 | page_idx + content type | pages、chapters 表联查实现按页码/章节/类型的精确筛选 |

> 💻 Source: [rebuild_db.py](../../scripts/rebuild_db.py) — MinerU → DB 数据流
> 💻 Source: [rebuild_topic_index.py](../../scripts/rebuild_topic_index.py) — 主题索引构建
> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.4 四种检索策略

---

## 概念演变追踪

| 概念 | 在旧版中 | 在新版中 | 变化 |
|------|---------|---------|------|
| 默认后端 | Pipeline (< v2.7) | Hybrid (≥ v2.7.0) | 精度提升，新用户开箱即用 |
| 安装方式 | 需分别安装 PyTorch, PaddlePaddle, 模型权重 | `mineru[all]` 一键安装 | 大幅简化 |
| 引擎选择 | 手动指定推理框架 | `*-auto-engine` 自动选择 | 降低使用门槛 |
| 布局检测模型 | Detectron2 (LayoutLMv3) | DocLayout-YOLO | 10× 速度提升 |
| 表格合并 | 不支持跨页合并 | v2.7.2 支持跨页表格合并 | 长表格完整性提升 |
| OCR 模型 | PPOCRv4 | PPOCRv5 (ch_server/ch_lite) | 手写体识别提升 |
| 公式识别 | 固定分隔符 | v1.3+ 自定义公式分隔符 | 灵活性提升 |

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Changelog

---

## 📚 扩展阅读

### 深入理解

| 资源 | 类型 | 为什么值得读 | 难度 |
|------|------|-------------|------|
| [MinerU2.5 论文](https://arxiv.org/) | 论文 | 理解解耦两阶段管道设计 | ⭐⭐⭐ |
| [PDF-Extract-Kit](https://github.com/opendatalab/PDF-Extract-Kit) | 开源项目 | 理解底层模型组件 | ⭐⭐⭐ |
| [DocLayout-YOLO](https://github.com/opendatalab/DocLayout-YOLO) | 开源项目 | 布局检测模型细节 | ⭐⭐⭐⭐ |
| [UniMERNet](https://github.com/opendatalab/UniMERNet) | 开源项目 | 公式识别模型细节 | ⭐⭐⭐⭐ |

### 横向对比

| 资源 | 对比点 | 何时读 |
|------|--------|--------|
| [Marker](https://github.com/VikParuchuri/marker) | 轻量替代品，速度更快但功能更少 | 考虑更轻量方案时 |
| [Unstructured](https://github.com/Unstructured-IO/unstructured) | 多格式支持，LangChain 集成 | 需要处理非 PDF 格式时 |
| [Docling (IBM)](https://github.com/DS4SD/docling) | 多格式，IBM 生态 | 评估替代方案时 |
| [pdfminer.six](https://github.com/pdfminer/pdfminer.six) | 纯文本提取，速度最快 | 只需文字不需结构时 |

### 上层应用

| 资源 | 说明 | 何时读 |
|------|------|--------|
| [LangChain](https://github.com/langchain-ai/langchain) | RAG 框架集成 | 构建 RAG 管道时 |
| [LlamaIndex](https://github.com/run-llama/llama_index) | 数据索引框架 | 构建知识库时 |
| retrieval_lab 知识地图 | 本项目的检索实验平台 | 理解 MinerU 输出如何被使用 |

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Acknowledgments

---

## 与工作区已有知识库的关联

| 类别 | 数量 | 代表 | 学习点 |
|------|------|------|--------|
| 检索方法 | 1 个 KM | [retrieval_lab](../../../knowledge-map/retrieval_lab/) | MinerU 是所有检索方法的数据源前置步骤 |
| AI 工具 | 当前 KM | mineru (本文件) | PDF 解析工具的核心参考 |
| v1.1 文档 | 1 个 | [requirements.md](../../docs/v1.1/requirements/requirements.md) | §7.5 详细记录了坐标系问题和修复 |
| 工具脚本 | 3 个 | batch_mineru.py, rebuild_db.py, rebuild_topic_index.py | MinerU 输出的消费者 |

> 💻 Source: 工作区文件结构
