---
topic: mineru
dimension: code
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — README.md + Quick Start"
  - "📖 Docs: [MinerU Official](https://opendatalab.github.io/MinerU/) — Usage Guide"
  - "💻 Source: [batch_mineru.py](../../scripts/batch_mineru.py) — 全文"
  - "💻 Source: [rebuild_db.py](../../scripts/rebuild_db.py) — bbox 转换逻辑"
expiry: 3m
status: current
---

# MinerU 代码参考

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — v2.7.x
> 📖 Docs: [MinerU Official](https://opendatalab.github.io/MinerU/) — Usage Guide

## 快速开始

### 最简示例 — 30 秒上手

**安装** (pip or uv):

```bash
# Install with all backends (recommended)
# 安装完整版（推荐）
pip install -U "mineru[all]"

# Or use uv for faster installation
# 或用 uv 加速安装
uv pip install -U "mineru[all]"
```

**解析一个 PDF**:

```bash
# Default: hybrid backend (v2.7+), best quality
# 默认：hybrid 后端，最高质量
mineru -p input.pdf -o output/

# CPU-only: pipeline backend
# 纯 CPU：pipeline 后端
mineru -p input.pdf -o output/ -b pipeline
```

**测试**:

```bash
# Verify output
# 验证输出
ls output/input/auto/
# Expected: input.md, input_content_list.json, input_middle.json, ...
```

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Quick Start

---

## 完整实现示例

### 示例 1: CLI 解析（基础用法）

```bash
# Parse a single PDF with default hybrid backend
# 用默认 hybrid 后端解析单个 PDF
mineru -p textbooks/bishop_prml.pdf -o data/mineru_output/bishop_prml/

# Parse with explicit pipeline backend (CPU-only, for batch processing)
# 指定 pipeline 后端（纯 CPU，适合批量处理）
mineru -p textbooks/bishop_prml.pdf -o data/mineru_output/bishop_prml/ -b pipeline

# Parse with VLM backend (highest accuracy, needs GPU)
# 用 VLM 后端（最高精度，需要 GPU）
mineru -p textbooks/bishop_prml.pdf -o data/mineru_output/bishop_prml/ -b vlm-auto-engine
```

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Using MinerU

### 示例 2: 批量处理脚本（本项目实现）

```python
"""
Batch process all textbook PDFs with MinerU.
批量处理所有教科书 PDF。

Features: checkpoint/resume, crash recovery, output validation.
功能：断点续传、崩溃恢复、输出验证。

Source: scripts/batch_mineru.py (simplified)
"""
import subprocess
import json
import time
from pathlib import Path

# Config / 配置
PROJECT_ROOT = Path(__file__).parent.parent
TEXTBOOKS_DIR = PROJECT_ROOT / "textbooks"
OUTPUT_DIR = PROJECT_ROOT / "data" / "mineru_output"
MINERU_CMD = str(PROJECT_ROOT / ".venv" / "Scripts" / "mineru")

def process_book(pdf_path: Path, short_name: str, backend: str = "pipeline") -> bool:
    """Process a single PDF with MinerU.
    用 MinerU 处理单个 PDF。
    """
    out_dir = OUTPUT_DIR / short_name
    cmd = [
        MINERU_CMD,
        "-p", str(pdf_path),    # Input PDF path / 输入 PDF 路径
        "-o", str(out_dir),     # Output directory / 输出目录
        "-b", backend,          # Backend: pipeline | vlm-auto-engine | hybrid-auto-engine
    ]

    start = time.time()
    result = subprocess.run(cmd, capture_output=False, text=True, timeout=3600)
    elapsed = time.time() - start

    if result.returncode == 0:
        print(f"✓ {short_name} done in {elapsed:.0f}s ({elapsed/60:.1f} min)")
        return True
    else:
        print(f"✗ {short_name} FAILED (exit code {result.returncode})")
        return False

def validate_output(short_name: str) -> tuple[bool, str]:
    """Validate that output is complete and usable.
    验证输出是否完整可用。
    """
    out_dir = OUTPUT_DIR / short_name

    # Check markdown exists and has meaningful size
    # 检查 Markdown 存在且有实际内容
    md_files = list(out_dir.rglob("*.md"))
    if not md_files:
        return False, "no .md files found"

    total_md_size = sum(f.stat().st_size for f in md_files)
    if total_md_size < 1024:  # Minimum 1 KB
        return False, f"markdown too small ({total_md_size} bytes)"

    # Check content_list.json is valid JSON
    # 检查 content_list.json 是合法 JSON
    json_files = list(out_dir.rglob("*_content_list.json"))
    if not json_files:
        return False, "no _content_list.json found"

    for jf in json_files:
        data = json.loads(jf.read_text(encoding="utf-8"))
        if not isinstance(data, list) or len(data) < 1:
            return False, f"{jf.name}: empty content list"

    return True, "ok"
```

> 💻 Source: [batch_mineru.py](../../scripts/batch_mineru.py) — 完整版 371 行

### 示例 3: 读取和使用 content_list.json

```python
"""
Read MinerU output and convert bbox coordinates for database ingestion.
读取 MinerU 输出并转换 bbox 坐标用于入库。

Source: scripts/rebuild_db.py (simplified bbox conversion)
"""
import json
from pathlib import Path

def load_content_list(book_name: str) -> list[dict]:
    """Load content_list.json for a book.
    加载某本书的 content_list.json。
    """
    base = Path(f"data/mineru_output/{book_name}/{book_name}/auto")
    cl_path = base / f"{book_name}_content_list.json"
    return json.loads(cl_path.read_text(encoding="utf-8"))

def load_page_sizes(book_name: str) -> dict[int, tuple[float, float]]:
    """Extract page sizes from middle.json.
    从 middle.json 提取每页的 PDF 点尺寸。
    """
    base = Path(f"data/mineru_output/{book_name}/{book_name}/auto")
    mid_path = base / f"{book_name}_middle.json"
    mid = json.loads(mid_path.read_text(encoding="utf-8"))

    page_sizes = {}
    for page_idx, page_info in enumerate(mid.get("pdf_info", [])):
        ps = page_info.get("page_size", {})
        page_sizes[page_idx] = (ps.get("width", 0), ps.get("height", 0))
    return page_sizes

def convert_bbox_to_pdf_points(
    bbox: list[float],
    page_idx: int,
    page_sizes: dict[int, tuple[float, float]]
) -> list[float]:
    """Convert content_list bbox (1000x1000 normalized) to PDF points.
    将 content_list bbox（1000×1000 归一化）转换为 PDF 点坐标。

    Formula: pdf_coord = bbox_coord / 1000 * page_size
    公式：pdf坐标 = bbox坐标 / 1000 × 页面尺寸
    """
    pw, ph = page_sizes.get(page_idx, (0.0, 0.0))
    if pw and ph:
        return [
            bbox[0] / 1000 * pw,  # x0
            bbox[1] / 1000 * ph,  # y0
            bbox[2] / 1000 * pw,  # x1
            bbox[3] / 1000 * ph,  # y1
        ]
    return bbox  # Fallback: return raw if page size unknown

# Usage example / 使用示例
book = "lubanovic_fastapi_modern_web"
content_list = load_content_list(book)
page_sizes = load_page_sizes(book)

for item in content_list[:3]:
    raw_bbox = item.get("bbox", [])
    page_idx = item.get("page_idx", 0)
    pdf_bbox = convert_bbox_to_pdf_points(raw_bbox, page_idx, page_sizes)
    print(f"Type: {item['type']}, Raw: {raw_bbox}, PDF: {[round(x, 1) for x in pdf_bbox]}")
```

> 💻 Source: [rebuild_db.py](../../scripts/rebuild_db.py) — bbox 转换逻辑
> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5.2

### 示例 4: Python API 调用

```python
"""
Use MinerU's Python API directly (without CLI).
直接使用 MinerU 的 Python API（不通过 CLI）。

Source: MinerU Official Docs — API Usage
"""
from magic_pdf.data.data_reader_writer import FileBasedDataWriter, FileBasedDataReader
from magic_pdf.pipe.UNIPipe import UNIPipe
from magic_pdf.pipe.OCRPipe import OCRPipe
from magic_pdf.pipe.TXTPipe import TXTPipe

def parse_pdf_with_api(pdf_path: str, output_dir: str, method: str = "auto"):
    """Parse PDF using MinerU Python API.
    使用 MinerU Python API 解析 PDF。

    Args:
        pdf_path: Path to input PDF / 输入 PDF 路径
        output_dir: Output directory / 输出目录
        method: "auto" | "ocr" | "txt" — detection mode / 检测模式
    """
    # Read PDF bytes / 读取 PDF 字节
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    # Set up data writer / 设置数据写入器
    writer = FileBasedDataWriter(output_dir)

    # Choose pipe based on method / 根据方法选择管道
    if method == "ocr":
        pipe = OCRPipe(pdf_bytes, [], writer)
    elif method == "txt":
        pipe = TXTPipe(pdf_bytes, [], writer)
    else:
        pipe = UNIPipe(pdf_bytes, [], writer)

    # Execute pipeline / 执行管道
    pipe.pipe_classify()    # Step 1: Classify PDF type / 分类 PDF 类型
    pipe.pipe_analyze()     # Step 2: Layout analysis / 布局分析
    pipe.pipe_parse()       # Step 3: Content extraction / 内容提取

    # Get results / 获取结果
    content_list = pipe.pipe_mk_uni_format(output_dir)
    md_content = pipe.pipe_mk_markdown(output_dir)

    return content_list, md_content
```

> 📖 Docs: [MinerU Official](https://opendatalab.github.io/MinerU/) — API Usage
> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — README.md

---

## API 速查

### CLI 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `-p` / `--path` | str | (必填) | 输入 PDF/图片路径 |
| `-o` / `--output` | str | (必填) | 输出目录 |
| `-b` / `--backend` | str | `hybrid-auto-engine` | 后端选择 |
| `-l` / `--lang` | str | auto | OCR 语言（扫描 PDF 用） |
| `--no-formula` | flag | false | 关闭公式识别 |
| `--no-table` | flag | false | 关闭表格识别 |

> 📖 Docs: [MinerU Official](https://opendatalab.github.io/MinerU/) — CLI Reference

### 后端选项

| 值 | 说明 | 硬件要求 |
|-----|------|---------|
| `pipeline` | 纯管道，支持 CPU | 无 GPU 可运行 |
| `vlm-auto-engine` | VLM 视觉语言模型 | GPU 推荐 |
| `hybrid-auto-engine` | 混合后端（v2.7 默认） | GPU 推荐 |

### 输出文件

| 文件 | 说明 | 用途 |
|------|------|------|
| `{name}.md` | Markdown 全文 | 人类阅读 / LLM 输入 |
| `{name}_content_list.json` | 结构化内容 + bbox | 入库 / 前端定位 |
| `{name}_middle.json` | 中间表示（PDF 点坐标） | 坐标验证 |
| `{name}_model.json` | 模型推理原始输出 | 调试 |
| `{name}_layout.pdf` | 布局检测可视化 | 质量检查 |
| `{name}_span.pdf` | Span 类型可视化 | 质量检查 |
| `images/` | 提取的图片 | Markdown 引用 |

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Output Structure

---

## 目录结构模板

### 简单结构（单本书）

```
data/mineru_output/
└── bishop_prml/
    └── bishop_prml/
        └── auto/
            ├── bishop_prml.md
            ├── bishop_prml_content_list.json
            ├── bishop_prml_middle.json
            ├── bishop_prml_model.json
            ├── bishop_prml_layout.pdf
            ├── bishop_prml_span.pdf
            └── images/
                ├── img_0_0.jpg
                └── ...
```

### 标准结构（本项目）

```
textbook-rag/
├── textbooks/                      ← 原始 PDF
│   ├── bishop_prml.pdf
│   ├── cormen_CLRS.pdf
│   └── ...
├── data/
│   └── mineru_output/              ← MinerU 输出
│       ├── batch_status.json       ← 批处理状态日志
│       ├── bishop_prml/
│       │   └── bishop_prml/auto/
│       ├── cormen_CLRS/
│       │   └── cormen_CLRS/auto/
│       └── ... (58 本教科书)
└── scripts/
    ├── batch_mineru.py             ← 批量处理脚本
    ├── rebuild_db.py               ← 输出 → 数据库
    └── rebuild_topic_index.py      ← 输出 → 主题索引
```

> 💻 Source: [batch_mineru.py](../../scripts/batch_mineru.py) — 目录配置
> 💻 Source: [rebuild_db.py](../../scripts/rebuild_db.py) — 输入路径
