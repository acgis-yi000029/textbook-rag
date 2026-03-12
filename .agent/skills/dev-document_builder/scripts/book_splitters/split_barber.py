"""Split Barber BRML by chapters and sections.

BRML 没有内嵌 TOC 书签。检测策略：
  - 章标题页：含 "CHAPTER" 文本(size 14.3) 或大字体章节号(size>20)，标题在 y~207 处
  - 小节标题：size ~14.3，"N.M" 独立 span + 下一行标题文本
  - 28 章，5 个 Part
"""
import pymupdf
import re
import json
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, str(Path(r"c:\Users\40270\OneDrive\Desktop\workspace\aisd\.agent\skills\dev-pdf_processing\scripts")))
from pdf_section_split import split_section

doc = pymupdf.open("barber_brml.pdf")
total = doc.page_count

# ── 第一步：找章标题页 ──
# 方式1: "CHAPTER" label + 大字体数字
# 方式2: ch10+ 只有大字体数字（无 CHAPTER label）
ch_starts = {}  # ch_num -> page (1-indexed)

for page_num in range(total):
    page = doc[page_num]
    has_chapter_label = False
    large_num = None
    for block in page.get_text("dict")["blocks"]:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                txt = span["text"].strip()
                if txt == "CHAPTER":
                    has_chapter_label = True
                if span["size"] > 20 and re.match(r"^\d+$", txt):
                    large_num = int(txt)
    if large_num is not None and large_num not in ch_starts:
        if has_chapter_label or large_num >= 10:
            ch_starts[large_num] = page_num + 1


def get_chapter_title(page_1indexed):
    """从章标题页提取标题（y~195-220, size>12）"""
    page = doc[page_1indexed - 1]
    parts = []
    for block in page.get_text("dict")["blocks"]:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            y = line["bbox"][1]
            max_sz = max(s["size"] for s in line["spans"])
            txt = "".join(s["text"] for s in line["spans"]).strip()
            if 195 < y < 220 and max_sz > 12 and txt and txt != "CHAPTER":
                parts.append(txt)
    return " ".join(parts).rstrip(":") if parts else f"Chapter {page_1indexed}"


# ── 第二步：扫描小节标题 ──
# 格式：block 首行只有 "N.M" (size ~14.3)，下一行是标题文本
raw_sections = []  # [(page_1indexed, sec_id, title)]

for page_num in range(total):
    page = doc[page_num]
    for block in page.get_text("dict")["blocks"]:
        if "lines" not in block:
            continue
        first_line = block["lines"][0]
        spans = first_line["spans"]
        max_sz = max(s["size"] for s in spans)

        if not (13 < max_sz < 16):
            continue

        first_text = spans[0]["text"].strip()
        if not re.match(r"^\d+\.\d+$", first_text):
            continue

        # 标题在同 block 下一行（size > 12）
        title_parts = []
        for line in block["lines"][1:]:
            line_sz = max(s["size"] for s in line["spans"])
            if line_sz > 12:
                title_parts.append("".join(s["text"] for s in line["spans"]).strip())
            else:
                break
        title = " ".join(title_parts) if title_parts else ""
        raw_sections.append((page_num + 1, first_text, title))

# ── 第三步：构建章节字典 ──
chapters = {}
sorted_chs = sorted(ch_starts.keys())

for i, ch_num in enumerate(sorted_chs):
    start = ch_starts[ch_num]
    ch_title = get_chapter_title(start)
    end = ch_starts[sorted_chs[i + 1]] - 1 if i + 1 < len(sorted_chs) else total

    # 收集属于本章的小节
    ch_sections = []
    for pg, sec_id, sec_title in raw_sections:
        sec_ch = int(sec_id.split(".")[0])
        if sec_ch == ch_num:
            ch_sections.append({"id": sec_id, "title": sec_title, "start_page": pg})

    # 计算每个小节的 end_page
    for j, sec in enumerate(ch_sections):
        if j + 1 < len(ch_sections):
            sec["end_page"] = ch_sections[j + 1]["start_page"] - 1
        else:
            sec["end_page"] = end

    chapters[ch_num] = {
        "title": ch_title,
        "start_page": start,
        "end_page": end,
        "sections": ch_sections,
    }

# ── 第四步：输出 ──
out = Path("barber_sections")
out.mkdir(exist_ok=True)
toc_data = {}
total_sec = 0

print("Barber - Bayesian Reasoning and Machine Learning")
print(f"Total pages: {total}")
print("=" * 70)

for ch_num in sorted(chapters.keys()):
    ch = chapters[ch_num]
    ch_id = f"ch{ch_num:02d}"
    ch_dir = out / ch_id
    ch_dir.mkdir(exist_ok=True)

    print(f"\n{ch_id}: {ch['title']}")

    if not ch["sections"]:
        # 无小节，整章输出
        pages = ch["end_page"] - ch["start_page"] + 1
        safe = re.sub(r"[^\w\s-]", "", ch["title"]).replace(" ", "_").lower()[:40]
        fname = f"ch{ch_num:02d}_{safe}.pdf"
        split_section(doc, ch["start_page"], ch["end_page"], ch_dir / fname)
        print(f"  {'(whole)':7} {ch['title']:<45} p{ch['start_page']:>3}-{ch['end_page']:<3} ({pages:>2}p)")
        total_sec += 1
    else:
        ch_pages = 0
        for sec in ch["sections"]:
            pages = max(1, sec["end_page"] - sec["start_page"] + 1)
            ch_pages += pages
            total_sec += 1
            flag = "!" if pages > 10 else "*" if pages > 5 else " "

            print(f"  {sec['id']:<7} {sec['title']:<45} p{sec['start_page']:>3}-{sec['end_page']:<3} ({pages:>2}p) {flag}")

            safe = re.sub(r"[^\w\s-]", "", sec["title"]).replace(" ", "_").lower()[:40]
            fname = f"sec_{sec['id'].replace('.', '_')}_{safe}.pdf"
            split_section(doc, sec["start_page"], sec["end_page"], ch_dir / fname)

        print(f"  {'':7} {'SUBTOTAL':45} {ch_pages:>2}p")

    toc_data[ch_id] = {
        "title": ch["title"],
        "start_page": ch["start_page"],
        "end_page": ch["end_page"],
        "sections": ch["sections"],
    }

with open(out / "toc.json", "w", encoding="utf-8") as f:
    json.dump(toc_data, f, indent=2, ensure_ascii=False)

print(f"\n{'=' * 70}")
print(f"Total: {len(chapters)} chapters, {total_sec} sections")
print(f"Saved to: {out.resolve()}")
doc.close()
