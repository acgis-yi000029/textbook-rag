---
topic: mineru
dimension: history
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Changelog"
  - "📖 Docs: [PyPI magic-pdf](https://pypi.org/project/magic-pdf/) — Release History"
  - "💻 Source: [PDF-Extract-Kit](https://github.com/opendatalab/PDF-Extract-Kit) — README"
  - "📖 Paper: [MinerU2.5 arXiv](https://arxiv.org/) — 2025-09"
expiry: 6m
status: current
---

# MinerU 历史演进

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Changelog
> 📖 Docs: [PyPI magic-pdf](https://pypi.org/project/magic-pdf/) — Release History

---

## 时间轴概览

```
2024.07         2024.08-09         2024.10-11        2025.04-05
   │                │                  │                 │
   ▼                ▼                  ▼                 ▼
 magic-pdf      表格识别 +          v0.9-v0.10        v1.3.x
 v0.6 首发      简化安装           持续优化            批量处理 +
 开源发布        TableMaster        bug 修复           PP-OCRv5

2025.09            2025.12            2026.01-02         2026.03
   │                  │                  │                 │
   ▼                  ▼                  ▼                 ▼
 MinerU2.5         v2.7.0             v2.7.1-2.7.6       当前
 arXiv 论文       Hybrid 后端         国产芯片适配       v2.7.6
 两阶段管道       默认切换            跨页表格优化        stable
```

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Changelog

---

## Station 1: InternLM 预训练的副产品（2023-2024 初）

**问题：** 上海 AI Lab 在训练 InternLM 大模型时，需要将海量学术 PDF 转换为训练语料。现有工具（pdfminer、PyMuPDF）无法保留文档结构，数学公式在纯文本提取时变成乱码，严重影响预训练数据质量

**创新：** OpenDataLab 团队开发了 magic-pdf，一个端到端的 PDF 解析工具链：
- 集成布局检测 + OCR + 公式识别 + 表格识别
- 保留文档结构（标题/段落/列表）
- 支持数学公式 → LaTeX 转换
- 按人类阅读顺序输出

**局限：** 初始版本功能单一，只有 Pipeline 后端，每个 PDF 只能串行处理，速度较慢

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Project Introduction
> 📖 Paper: InternLM pre-training 相关文献

---

## Station 2: magic-pdf 开源与生态建设（2024.07 - 2024.11）

**问题：** 内部工具无法惠及社区，且缺乏表格识别、多语言 OCR 等关键能力

**创新：**
- 2024.07.05: magic-pdf v0.6 正式开源发布
- 2024.07: PDF-Extract-Kit 作为底层模型工具箱独立发布（DocLayout-YOLO + UniMERNet + PaddleOCR + RapidTable）
- 2024.08: 新增表格识别功能（TableMaster → RapidTable）
- 2024.09: 本地化部署版 WebUI + 前端界面
- 多次版本迭代修复 bug、优化依赖

**局限：** Pipeline 后端准确率有天花板——每个模块独立运行，缺乏全局理解能力；安装复杂（需分别安装 PyTorch、PaddlePaddle、模型权重）

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Changelog 2024.07-2024.11
> 💻 Source: [PDF-Extract-Kit](https://github.com/opendatalab/PDF-Extract-Kit) — Initial Release

---

## Station 3: MinerU 2.5 与 VLM 后端（2025.04 - 2025.09）

**问题：** Pipeline 后端的多模型串行方式有精度上限，需要从"模块拼接"走向"端到端理解"

**创新：**
- 2025.04-05: v1.3.x 系列大量优化——批量处理（速度大幅提升）、GPU 显存优化、自研 DocLayout-YOLO 布局模型（10× 速度提升）
- 2025.09: MinerU 2.5 论文发表（arXiv）——提出**解耦两阶段解析管道**：
  1. 第一阶段：用缩略图做全局布局分析
  2. 第二阶段：对原始分辨率图片做定向高精度识别
  - 使用 1.2B 参数的视觉语言模型
  - 引入 VLM 后端选项

**局限：** VLM 后端需要 GPU，纯 CPU 用户无法使用；文本型 PDF 被 VLM 重新"OCR"，浪费计算资源

> 📖 Paper: [MinerU2.5](https://arxiv.org/) — arXiv 2025-09
> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Changelog v1.3.x

---

## Station 4: Hybrid 后端与国产化（2025.12 - 2026.03 至今）

**问题：** VLM 准确率高但对文本 PDF 过度依赖模型识别，且需要适配更多硬件平台

**创新：**
- 2025.12 v2.7.0: 三大突破
  - **Hybrid 后端**：VLM + Pipeline 优势结合——文本 PDF 直提嵌入文字（不依赖 VLM 重新识别），扫描 PDF 可指定 OCR 语言，inline 公式可独立关闭
  - **简化安装**：`mineru[all]` 一键安装所有后端依赖，不再需要分别安装
  - **自动引擎选择**：`*-auto-engine` 后缀，自动根据环境选择最优推理框架
  - 默认后端从 Pipeline 切换为 Hybrid
- 2026.01 v2.7.2: 跨页表格合并优化
- 2026.01-02 v2.7.1-2.7.6: 大规模国产芯片适配——昇腾、海光、天数智芯、壁仞、摩尔线程、寒武纪、昆仑芯、太初等 11 个平台

**局限：**
- 仍不支持代码块识别
- 漫画/画册/小学教科书解析效果差
- AGPL 许可限制商业使用（计划未来替换 YOLO 模型）

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Changelog v2.7.0-v2.7.6
> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — TODO, License
