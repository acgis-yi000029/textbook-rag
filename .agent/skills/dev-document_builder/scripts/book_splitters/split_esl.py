"""Split ESL (Elements of Statistical Learning) by sections.

ESL 没有内嵌 TOC 书签。检测策略：
  - 章标题页：大字体章节号 (size > 20)，标题为同页 size 18-24 文本
  - 小节标题：size ~14.3，格式 "N.M" 独立行 + 下一行标题文本
  - ch01 无小节，整章作为单个文件输出
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

doc = pymupdf.open("hastie_esl.pdf")
total = doc.page_count

# ── 第一步：扫描章标题页（大字体章节号 size > 20）──
ch_starts = {}  # ch_num -> page (1-indexed)

for page_num in range(total):
    page = doc[page_num]
    for block in page.get_text("dict")["blocks"]:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                if span["size"] > 20 and re.match(r"^\d+$", span["text"].strip()):
                    ch_num = int(span["text"].strip())
                    if ch_num not in ch_starts:
                        ch_starts[ch_num] = page_num + 1


def get_chapter_title(page_1indexed):
    """从章标题页提取标题（size 18-24 的非数字文本）"""
    page = doc[page_1indexed - 1]
    parts = []
    for block in page.get_text("dict")["blocks"]:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                sz, txt = span["size"], span["text"].strip()
                if 18 < sz < 24 and txt and not re.match(r"^\d+$", txt):
                    parts.append(txt)
    return " ".join(parts) if parts else f"Chapter {page_1indexed}"


# ── 第二步：扫描小节标题（size ~14, "N.M" + 下一行标题）──
raw_sections = []  # [(page_1indexed, sec_id_str, title)]

for page_num in range(total):
    page = doc[page_num]
    for block in page.get_text("dict")["blocks"]:
        if "lines" not in block:
            continue
        first_line = block["lines"][0]
        max_sz = max(s["size"] for s in first_line["spans"])
        first_text = "".join(s["text"] for s in first_line["spans"]).strip()

        if not (13 < max_sz < 16 and re.match(r"^\d+\.\d+$", first_text)):
            continue

        # 小节号匹配，标题在同 block 下一行
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
out = Path("esl_sections")
out.mkdir(exist_ok=True)
toc_data = {}
total_sec = 0

print("ESL - Elements of Statistical Learning")
print(f"Total pages: {total}")
print("=" * 70)

for ch_num in sorted(chapters.keys()):
    ch = chapters[ch_num]
    ch_id = f"ch{ch_num:02d}"
    ch_dir = out / ch_id
    ch_dir.mkdir(exist_ok=True)

    print(f"\n{ch_id}: {ch['title']}")

    if not ch["sections"]:
        # ch01 无小节，整章输出
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
