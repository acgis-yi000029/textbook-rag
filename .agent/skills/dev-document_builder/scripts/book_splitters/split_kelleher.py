"""Split Kelleher ML Fundamentals - correctly handles book structure."""
import pymupdf
import re
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(r"c:\Users\40270\OneDrive\Desktop\workspace\aisd\.agent\skills\dev-pdf_processing\scripts")))
from pdf_section_split import split_section

doc = pymupdf.open("kelleher_ml_fundamentals.pdf")
total = doc.page_count
raw = doc.get_toc()

def clean_text(t):
    """Remove surrogate chars and clean up text."""
    return "".join(c for c in t if ord(c) < 0xD800 or ord(c) > 0xDFFF).strip()

# Build flat list with correct end pages
toc = []
for i, (level, title, page) in enumerate(raw):
    title = clean_text(title)
    if not title:
        continue
    # Find next entry at same or higher level for end page
    end_page = total
    for j in range(i + 1, len(raw)):
        if raw[j][0] <= level:
            end_page = raw[j][2] - 1
            break
    toc.append((level, title, page, end_page))

# Skip prefixes
skip_prefixes = ["preface", "index", "references", "bibliography",
                 "contents", "notation", "list of", "acknowledgments"]

# Parse chapters (L2) and sections (L3)
chapters = {}

for level, title, start, end in toc:
    if level == 2:
        # Check if it's a numbered chapter (1-14) or appendix (A-D)
        ch_match = re.match(r"^(\d+)\.\s+(.+)", title)
        app_match = re.match(r"^([A-D])\.\s+(.+)", title)

        if ch_match:
            ch_id = f"ch{int(ch_match.group(1)):02d}"
            ch_title = ch_match.group(2)
        elif app_match:
            ch_id = f"app{app_match.group(1)}"
            ch_title = app_match.group(2)
        else:
            # Skip non-chapter L2 entries (Parts, etc.)
            continue

        if any(ch_title.lower().startswith(s) for s in skip_prefixes):
            continue

        chapters[ch_id] = {
            "title": ch_title,
            "start_page": start,
            "end_page": end,
            "sections": []
        }
        current_ch = ch_id

    elif level == 3 and 'current_ch' in dir() and current_ch in chapters:
        # Section level - extract section number
        sec_match = re.match(r"^([\d.]+|[A-D]\.\d+)\s+(.+)", title)
        if sec_match:
            sec_id = sec_match.group(1)
            sec_title = sec_match.group(2)
        else:
            sec_id = f"{len(chapters[current_ch]['sections']) + 1}"
            sec_title = title

        chapters[current_ch]["sections"].append({
            "id": sec_id,
            "title": sec_title,
            "start_page": start,
            "end_page": end
        })

# Split and output
out = Path("kelleher_sections")
out.mkdir(exist_ok=True)
toc_data = {}
total_sec = 0
total_pages = 0

for ch_id in sorted(chapters.keys()):
    ch = chapters[ch_id]
    ch_dir = out / ch_id
    ch_dir.mkdir(exist_ok=True)

    print(f"\n{ch_id.upper()}: {ch['title']}")
    print(f"  Pages {ch['start_page']}-{ch['end_page']}")
    print("-" * 70)

    ch_pages = 0
    for sec in ch["sections"]:
        pages = sec["end_page"] - sec["start_page"] + 1
        ch_pages += pages
        total_sec += 1
        flag = "!" if pages > 20 else "*" if pages > 10 else " "
        print(f"  {sec['id']:<8} {sec['title']:<45} p{sec['start_page']:>3}-{sec['end_page']:<3} ({pages:>2}p) {flag}")

        # Create safe filename
        safe = re.sub(r"[^\w\s-]", "", sec["title"]).replace(" ", "_").lower()[:40]
        fname = f"sec_{sec['id'].replace('.', '_')}_{safe}.pdf"
        outpath = ch_dir / fname
        split_section(doc, sec["start_page"], sec["end_page"], outpath)

    toc_data[ch_id] = {
        "title": ch["title"],
        "start_page": ch["start_page"],
        "end_page": ch["end_page"],
        "sections": ch["sections"]
    }
    total_pages += ch_pages
    print(f"  {'':8} {'SUBTOTAL':45} {ch_pages:>2} pages")

with open(out / "toc.json", "w", encoding="utf-8") as f:
    json.dump(toc_data, f, indent=2, ensure_ascii=False)

print(f"\n{'=' * 70}")
print(f"Total: {len(chapters)} chapters, {total_sec} sections, ~{total_pages} pages")
print(f"Saved to: {out.resolve()}")
doc.close()
