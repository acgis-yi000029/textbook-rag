# PDF Processing Scripts

Core PDF processing toolkit for academic materials - course slides, papers, lab manuals.

## 🚀 Available Tools

### 1. `pdf_converter.py` - Smart Converter (Recommended)

**Intelligent PDF converter** with selective image extraction.

**Features:**

- ✅ Convert PDF to structured markdown
- ✅ Extract meaningful images only (filters logos, icons)
- ✅ Preserve structure (headings, lists, tables)
- ✅ Create bilingual (English-Chinese) templates
- ✅ Multiple bilingual formats (inline, side-by-side, separate)
- ✅ Smart duplicate detection

**Usage:**

```bash
# Basic conversion
uv run python pdf_converter.py lecture.pdf

# Bilingual template
uv run python pdf_converter.py lecture.pdf --bilingual

# No image extraction (faster)
uv run python pdf_converter.py lecture.pdf --no-images

# Custom output path
uv run python pdf_converter.py lecture.pdf -o notes/lecture1.md
```

**Best for:**

- Course slides with diagrams
- Documents with selective images
- When you want clean, structured markdown

---

### 2. `pdf_to_md_hybrid.py` - Hybrid Converter

**Hybrid approach** - combines text extraction with full page screenshots.

**Features:**

- ✅ Clean text extraction via pdfplumber
- ✅ Full page screenshot for every page (PyMuPDF)
- ✅ Detects and marks garbled formulas
- ✅ Preserves exact visual appearance
- ✅ Best for reviewing original layout

**Usage:**

```bash
# Basic conversion (DPI 200)
uv run python pdf_to_md_hybrid.py lecture.pdf -o notes/lecture.md

# Higher quality (DPI 300)
uv run python pdf_to_md_hybrid.py lecture.pdf -o notes/lecture.md --dpi 300
```

**Best for:**

- Course slides you want to review visually
- Math-heavy content with formulas
- When you need both text and full page images

---

### 3. `pdf_to_image_md.py` - Page Image + OCR

**OCR-based converter** - converts each page to image with text recognition.

**Features:**

- ✅ Each page as high-quality image
- ✅ Pix2Text OCR for text and formula recognition
- ✅ Smart noise filtering (removes headers, axis labels)
- ✅ LaTeX formula support
- ✅ Skips pure diagram pages automatically

**Usage:**

```bash
# Basic conversion (DPI 200)
uv run python pdf_to_image_md.py lecture.pdf -o notes/lecture.md

# Higher quality (DPI 300)
uv run python pdf_to_image_md.py lecture.pdf -o notes/lecture.md --dpi 300

# No OCR (basic text extraction only)
uv run python pdf_to_image_md.py lecture.pdf -o notes/lecture.md --no-ocr
```

**Best for:**

- Complex slide layouts
- Scanned documents
- When OCR is needed for text extraction

---

### 4. `formula_mapper.py` - Formula Mapping Helper

**Utility module** for mapping garbled formula characters to readable text.

Used internally by `pdf_to_md_hybrid.py` to improve formula readability.

---

### 5. `pdf_section_split.py` - TOC Section Splitter

**Automatic PDF splitter** - reads PDF's built-in TOC bookmarks to split by sections.

**Features:**

- ✅ Auto-reads PDF Table of Contents (bookmarks/outline)
- ✅ Splits by chapter sections (e.g., 2.1, 2.2, 2.3...)
- ✅ Auto-computes section boundaries from TOC
- ✅ Generates `toc.json` manifest for downstream processing
- ✅ No manual config needed - fully automatic
- ✅ Stats mode to preview before splitting

**Usage:**

```bash
# Show section statistics (no splitting)
python pdf_section_split.py textbook.pdf --stats

# Split all chapters into sections/chNN/ directories
python pdf_section_split.py textbook.pdf

# Split only chapter 2
python pdf_section_split.py textbook.pdf --chapter 2

# Custom output directory
python pdf_section_split.py textbook.pdf --output my_sections/
```

**Output structure:**

```
sections/
├── toc.json                              # Full TOC with page ranges
├── ch02/
│   ├── sec_2.1_systems_of_linear_equations.pdf
│   ├── sec_2.2_matrices.pdf
│   └── ...
├── ch03/
│   └── ...
```

**Best for:**

- Large textbooks that are too big to process per-chapter
- Reducing token cost by processing 3-5 pages at a time instead of 30-50
- Granular study material generation (one section = one note-taking session)
- Any PDF with built-in TOC bookmarks

**Why use this:**

| Granularity     | Pages per unit | ~Tokens per unit | Token savings |
| --------------- | -------------- | ---------------- | ------------- |
| Whole book      | 400            | ~200k            | baseline      |
| Per chapter     | 30-50          | ~70k-140k        | ~5x           |
| **Per section** | **3-5**        | **~5k-15k**      | **~30x**      |

---

## 📋 Quick Decision Guide

| Use Case                       | Recommended Tool       |
| ------------------------------ | ---------------------- |
| General course notes           | `pdf_converter.py`     |
| Bilingual study materials      | `pdf_converter.py`     |
| Need full page screenshots     | `pdf_to_md_hybrid.py`  |
| Math/physics with formulas     | `pdf_to_md_hybrid.py`  |
| Scanned documents (OCR)        | `pdf_to_image_md.py`   |
| Complex layouts with diagrams  | `pdf_to_image_md.py`   |
| **Split textbook by sections** | `pdf_section_split.py` |
| **Reduce token cost**          | `pdf_section_split.py` |

---

## 🔧 Dependencies

```bash
# Core dependencies (required for all tools)
uv add pdfplumber pymupdf pypdf pillow

# OCR support (required for pdf_to_image_md.py)
uv add pix2text
```

---

## 📚 Additional Capabilities

See `SKILL.md` for comprehensive PDF processing techniques:

- Table extraction with pandas
- Merge/split PDFs
- Fill PDF forms
- Password protection
- Batch processing
- And more...

---

## 💡 Tips

1. **Start with**: `pdf_to_md_hybrid.py` for course slides (best balance)
2. **For selective images**: Use `pdf_converter.py` to reduce file size
3. **For OCR needs**: Use `pdf_to_image_md.py` with higher DPI (300)
4. **Image quality**: Higher DPI gives better quality but larger files
5. **Bilingual notes**: Add `--bilingual` flag to any converter
6. **Large textbooks**: Use `pdf_section_split.py` first to split by TOC, then convert each section individually to save tokens
