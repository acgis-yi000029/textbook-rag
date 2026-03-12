"""Split Goodfellow Deep Learning book by SECTIONS using font-size detection.
花书没有内嵌书签也没有运行页眉，需要通过字体大小检测章节标题：
  - Chapter title: sz~24.4 "Chapter N" + sz~29.3 "Title"
  - Section title: sz~16.9 "N.M" + "Section Title"
"""
import pymupdf
import re
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(r"c:\Users\40270\OneDrive\Desktop\workspace\aisd\.agent\skills\dev-pdf_processing\scripts")))
from pdf_section_split import split_section

doc = pymupdf.open("goodfellow_deep_learning.pdf")
total = doc.page_count

# Pass 1: Collect all chapter & section headings
entries = []  # (type, num, title, page)

for pn in range(len(doc)):
    page = doc[pn]
    large = []
    for b in page.get_text("dict")["blocks"]:
        if "lines" not in b:
            continue
        for l in b["lines"]:
            sz = max(s["size"] for s in l["spans"])
            if sz > 14:
                t = "".join(s["text"] for s in l["spans"]).strip()
                y = l["bbox"][1]
                if t:
                    large.append((y, sz, t))
    large.sort()

    for i, (y, sz, t) in enumerate(large):
        # Chapter: "Chapter N" (sz~24.4) followed by title (sz~29.3)
        m = re.match(r"^Chapter\s+(\d+)$", t)
        if m and sz > 22:
            ch_num = int(m.group(1))
            title_parts = []
            for j in range(i + 1, min(i + 4, len(large))):
                if large[j][1] > 25:
                    title_parts.append(large[j][2])
            title = " ".join(title_parts)
            entries.append(("chapter", ch_num, title, pn + 1))
            continue

        # Section: "N.M" + "Title" (sz~16.9, both on same y)
        if 15 < sz < 20:
            m = re.match(r"^(\d+\.\d+)$", t)
            if m:
                sec_num = m.group(1)
                # Find matching title at same y
                title_parts = []
                for j in range(i + 1, min(i + 3, len(large))):
                    if abs(large[j][0] - y) < 5 and 15 < large[j][1] < 20:
                        title_parts.append(large[j][2])
                title = " ".join(title_parts)
                entries.append(("section", sec_num, title, pn + 1))

# Sort by page
entries.sort(key=lambda e: (e[3], 0 if e[0] == "chapter" else 1))

# Build chapter tree with sections
chapters = {}
current_ch = None

for i, (etype, num, title, page) in enumerate(entries):
    # Calculate end page
    next_page = entries[i + 1][3] if i + 1 < len(entries) else total + 1
    end_page = next_page - 1

    if etype == "chapter":
        current_ch = num
        chapters[num] = {
            "title": title,
            "start_page": page,
            "end_page": end_page,
            "sections": []
        }
    elif etype == "section" and current_ch:
        chapters[current_ch]["sections"].append({
            "id": num,
            "title": title,
            "start_page": page,
            "end_page": end_page
        })
        chapters[current_ch]["end_page"] = max(chapters[current_ch]["end_page"], end_page)

# Print stats and split
out = Path("goodfellow_sections")
toc_data = {}
total_sec = 0

for ch_num in sorted(chapters.keys()):
    ch = chapters[ch_num]
    print(f"Ch {ch_num}: {ch['title']}")
    ch_pages = 0
    for sec in ch["sections"]:
        pages = sec["end_page"] - sec["start_page"] + 1
        ch_pages += pages
        total_sec += 1
        flag = "!" if pages > 10 else "*" if pages > 5 else " "
        print(f"  {sec['id']:<7} {sec['title']:<50} {pages:>2}p {flag}")

        safe = re.sub(r"[^\w\s-]", "", sec["title"]).replace(" ", "_").lower()
        fname = f"sec_{sec['id']}_{safe}.pdf"
        outpath = out / f"ch{ch_num:02d}" / fname
        split_section(doc, sec["start_page"], sec["end_page"], outpath)

    toc_data[f"ch{ch_num:02d}"] = {
        "title": ch["title"],
        "sections": ch["sections"]
    }
    print(f"  {'':7} {'SUBTOTAL':50} {ch_pages:>2}p\n")

out.mkdir(exist_ok=True)
with open(out / "toc.json", "w", encoding="utf-8") as f:
    json.dump(toc_data, f, indent=2, ensure_ascii=False)

print(f"Total: {total_sec} sections")
print(f"Saved to: {out.resolve()}")
doc.close()
