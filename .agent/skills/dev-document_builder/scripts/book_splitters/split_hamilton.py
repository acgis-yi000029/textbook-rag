"""Split Hamilton Graph Representation Learning by chapters and sections.

Hamilton 有 9 个 Chapter（PDF 标记 "Chapter N"），结构：
  - Ch1-2: 对应 L1 (Introduction, Background)，小节=L2，子节=L3
  - Ch3-9: 对应 L2 (under Part I/II/III)，小节=L3，子节=L4
  - Conclusion: ch10（短章，无小节）
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

doc = pymupdf.open("hamilton_grl.pdf")
total = doc.page_count
toc = doc.get_toc()

# ── 从 PDF 中找 "Chapter N" 标记确定章号和页码 ──
ch_pages = {}  # ch_num -> page (1-indexed)
for pg in range(total):
    page = doc[pg]
    for block in page.get_text("dict")["blocks"]:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                if span["size"] > 20 and span["text"].strip().startswith("Chapter"):
                    m = re.match(r"Chapter\s+(\d+)", span["text"].strip())
                    if m:
                        ch_pages[int(m.group(1))] = pg + 1

# ── 提取章标题（size ~24.8） ──
ch_titles = {}
for ch_num, pg in ch_pages.items():
    page = doc[pg - 1]
    parts = []
    for block in page.get_text("dict")["blocks"]:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                txt = span["text"].strip()
                if 24 < span["size"] < 26 and txt:
                    parts.append(txt)
    ch_titles[ch_num] = " ".join(parts) if parts else "Chapter %d" % ch_num

# ── 找小节标题（size ~14.3, "N.M" 编号, CMBX12 粗体） ──
# sec id 和 title 可能在同一 line，也可能分两个 line（同一 block）
raw_sections = []
seen_ids = set()
for pg in range(total):
    page = doc[pg]
    for block in page.get_text("dict")["blocks"]:
        if "lines" not in block:
            continue
        lines = block["lines"]
        i_line = 0
        while i_line < len(lines):
            line = lines[i_line]
            spans = line["spans"]
            has_bold = any("CMBX" in s["font"] and 14 < s["size"] < 15 for s in spans)
            if not has_bold:
                i_line += 1
                continue
            txt = "".join(s["text"] for s in spans).strip()

            # Case 1: "N.M Title" 在同一行
            m = re.match(r"^(\d+\.\d+)\s+(.+)", txt)
            if m:
                sid, stitle = m.group(1), m.group(2).strip()
            else:
                # Case 2: "N.M" 单独一行，标题在下一行
                m2 = re.match(r"^(\d+\.\d+)$", txt)
                if m2 and i_line + 1 < len(lines):
                    next_line = lines[i_line + 1]
                    next_txt = "".join(s["text"] for s in next_line["spans"]).strip()
                    sid, stitle = m2.group(1), next_txt
                    i_line += 1  # skip title line
                else:
                    i_line += 1
                    continue

            if sid not in seen_ids:
                seen_ids.add(sid)
                raw_sections.append((pg + 1, sid, stitle))
            i_line += 1

# ── Conclusion 页码 ──
conclusion_page = None
bib_page = None
for entry in toc:
    if entry[1] == "Conclusion":
        conclusion_page = entry[2]
    if entry[1] == "Bibliography":
        bib_page = entry[2]

# ── 构建章节字典 ──
sorted_chs = sorted(ch_pages.keys())
chapters = {}

for i, ch_num in enumerate(sorted_chs):
    start = ch_pages[ch_num]
    title = ch_titles.get(ch_num, "Chapter %d" % ch_num)

    if i + 1 < len(sorted_chs):
        end = ch_pages[sorted_chs[i + 1]] - 1
    elif conclusion_page:
        end = conclusion_page - 1
    else:
        end = total

    ch_secs = []
    for pg, sid, sec_title in raw_sections:
        sec_ch = int(sid.split(".")[0])
        if sec_ch == ch_num:
            ch_secs.append({"id": sid, "title": sec_title, "start_page": pg})

    for j, sec in enumerate(ch_secs):
        if j + 1 < len(ch_secs):
            sec["end_page"] = max(sec["start_page"], ch_secs[j + 1]["start_page"] - 1)
        else:
            sec["end_page"] = end

    chapters[ch_num] = {
        "title": title,
        "start_page": start,
        "end_page": end,
        "sections": ch_secs,
    }

# Conclusion → ch10
if conclusion_page:
    chapters[10] = {
        "title": "Conclusion",
        "start_page": conclusion_page,
        "end_page": (bib_page - 1) if bib_page else total,
        "sections": [],
    }

# ── 输出 ──
out = Path("hamilton_sections")
out.mkdir(exist_ok=True)
toc_data = {}
total_sec = 0

print("Hamilton - Graph Representation Learning")
print("Total pages: %d" % total)
print("=" * 70)

for ch_num in sorted(chapters.keys()):
    ch = chapters[ch_num]
    ch_id = "ch%02d" % ch_num
    ch_dir = out / ch_id
    ch_dir.mkdir(exist_ok=True)

    print("\n%s: %s (p%d-%d)" % (ch_id, ch["title"], ch["start_page"], ch["end_page"]))

    if not ch["sections"]:
        pages = ch["end_page"] - ch["start_page"] + 1
        safe = re.sub(r"[^\w\s-]", "", ch["title"]).replace(" ", "_").lower()[:40]
        fname = "ch%02d_%s.pdf" % (ch_num, safe)
        split_section(doc, ch["start_page"], ch["end_page"], ch_dir / fname)
        print("  (whole) %-50s p%3d-%-3d (%2dp)" % (ch["title"][:50], ch["start_page"], ch["end_page"], pages))
        total_sec += 1
    else:
        ch_pages_n = 0
        for sec in ch["sections"]:
            pages = max(1, sec["end_page"] - sec["start_page"] + 1)
            ch_pages_n += pages
            total_sec += 1
            flag = "!" if pages > 10 else "*" if pages > 5 else " "
            print("  %-7s %-50s p%3d-%-3d (%2dp) %s" % (sec["id"], sec["title"][:50], sec["start_page"], sec["end_page"], pages, flag))
            safe = re.sub(r"[^\w\s-]", "", sec["title"]).replace(" ", "_").lower()[:40]
            fname = "sec_%s_%s.pdf" % (sec["id"].replace(".", "_"), safe)
            split_section(doc, sec["start_page"], sec["end_page"], ch_dir / fname)
        print("  %-7s %-50s %2dp" % ("", "SUBTOTAL", ch_pages_n))

    toc_data[ch_id] = {
        "title": ch["title"],
        "start_page": ch["start_page"],
        "end_page": ch["end_page"],
        "sections": ch["sections"],
    }

with open(out / "toc.json", "w", encoding="utf-8") as f:
    json.dump(toc_data, f, indent=2, ensure_ascii=False)

print(f"\n{'=' * 70}")
print(f"Total: {len(chapters)} chapters, {total_sec} sections/units")
print(f"Saved to: {out.resolve()}")
doc.close()
