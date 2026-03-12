"""Split Bishop PRML - handles numbered chapters correctly."""
import pymupdf
import re
import json
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, str(Path(r"c:\Users\40270\OneDrive\Desktop\workspace\aisd\.agent\skills\dev-pdf_processing\scripts")))
from pdf_section_split import split_section

doc = pymupdf.open("bishop_prml.pdf")
total = doc.page_count
raw = doc.get_toc()

# Build chapters from L1 entries that start with number
chapters = {}

for i, (level, title, page) in enumerate(raw):
    title = title.strip()
    next_page = raw[i + 1][2] if i + 1 < len(raw) else total + 1
    end_page = next_page - 1

    if level == 1:
        # Only process numbered chapters: "1.Introduction", "2. Probability..."
        m = re.match(r'^(\d+)[\.\s]+(.+)', title)
        if m:
            ch_num = int(m.group(1))
            ch_title = m.group(2).strip()
            chapters[ch_num] = {
                "title": ch_title,
                "start_page": page,
                "end_page": end_page,
                "sections": []
            }

    elif level == 2:
        # Section: "1.1. Example..." -> belongs to chapter 1
        m = re.match(r'^(\d+)\.(\d+)[\.\s]+(.+)', title)
        if m:
            ch_num = int(m.group(1))
            sec_num = int(m.group(2))
            sec_title = m.group(3).strip()
            sec_id = f"{ch_num}.{sec_num}"

            if ch_num in chapters:
                chapters[ch_num]["sections"].append({
                    "id": sec_id,
                    "title": sec_title,
                    "start_page": page,
                    "end_page": end_page
                })
        elif title.startswith("Exercises"):
            # Exercises section - find which chapter it belongs to
            for ch_num in sorted(chapters.keys(), reverse=True):
                if page >= chapters[ch_num]["start_page"]:
                    chapters[ch_num]["sections"].append({
                        "id": f"{ch_num}.ex",
                        "title": "Exercises",
                        "start_page": page,
                        "end_page": end_page
                    })
                    break

# Output
out = Path("bishop_sections")
out.mkdir(exist_ok=True)
toc_data = {}
total_sec = 0

print("Bishop - Pattern Recognition and Machine Learning")
print(f"Total pages: {total}")
print("=" * 70)

for ch_num in sorted(chapters.keys()):
    ch = chapters[ch_num]
    ch_id = f"ch{ch_num:02d}"
    ch_dir = out / ch_id
    ch_dir.mkdir(exist_ok=True)

    print(f"\n{ch_id}: {ch['title']}")

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

    toc_data[ch_id] = {
        "title": ch["title"],
        "start_page": ch["start_page"],
        "end_page": ch["end_page"],
        "sections": ch["sections"]
    }
    print(f"  {'':7} {'SUBTOTAL':45} {ch_pages:>2}p")

with open(out / "toc.json", "w", encoding="utf-8") as f:
    json.dump(toc_data, f, indent=2, ensure_ascii=False)

print(f"\n{'=' * 70}")
print(f"Total: {len(chapters)} chapters, {total_sec} sections")
print(f"Saved to: {out.resolve()}")
doc.close()
