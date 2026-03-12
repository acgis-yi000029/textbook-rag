"""Split Shalev-Shwartz UML by sections (parsed from TOC pages)."""
import pymupdf
import re
import json
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, str(Path(r"c:\Users\40270\OneDrive\Desktop\workspace\aisd\.agent\skills\dev-pdf_processing\scripts")))
from pdf_section_split import split_section

doc = pymupdf.open("shalev-shwartz_uml.pdf")
total = doc.page_count

# Parse TOC pages (9-17) - format is: sec_id, title, page on separate lines
toc_text = ""
for page_num in range(9, 18):
    page = doc[page_num - 1]
    toc_text += page.get_text() + "\n"

lines = [l.strip() for l in toc_text.split('\n') if l.strip()]

# Parse sections: look for pattern sec_id -> title -> page
sections = []
chapters = {}
current_part = None

i = 0
while i < len(lines) - 2:
    line = lines[i]

    # Skip Part headers and misc
    if line.startswith("Part "):
        current_part = line
        i += 1
        continue
    if line in ["Contents", "Preface", "Foundations", "Index", "Notes", "References"]:
        i += 1
        continue
    if line.startswith("page "):
        i += 1
        continue

    # Check for chapter: single digit
    if re.match(r'^\d+$', line) and not '.' in line:
        ch_num = int(line)
        if i + 2 < len(lines):
            ch_title = lines[i + 1]
            ch_page = lines[i + 2]
            if re.match(r'^\d+$', ch_page):
                chapters[ch_num] = {
                    "title": ch_title,
                    "start_page": int(ch_page),
                    "part": current_part,
                    "sections": []
                }
                i += 3
                continue
        i += 1
        continue

    # Check for section: X.Y or X.Y.Z format
    sec_match = re.match(r'^(\d+)\.(\d+)(\.(\d+))?$', line)
    if sec_match:
        ch_num = int(sec_match.group(1))
        if i + 2 < len(lines):
            title = lines[i + 1]
            page_str = lines[i + 2]
            if re.match(r'^\d+$', page_str):
                sec_id = line  # e.g., "4.3" or "5.1.1"
                sections.append({
                    "ch_num": ch_num,
                    "sec_id": sec_id,
                    "title": title,
                    "start_page": int(page_str),
                    "is_subsection": sec_match.group(3) is not None
                })
                i += 3
                continue
        i += 1
        continue

    i += 1

# Filter: only keep main sections (X.Y), skip subsections (X.Y.Z)
main_sections = [s for s in sections if not s["is_subsection"]]

# Calculate end pages
for i, sec in enumerate(main_sections):
    if i + 1 < len(main_sections):
        sec["end_page"] = main_sections[i + 1]["start_page"] - 1
    else:
        sec["end_page"] = total

# Group sections by chapter
for sec in main_sections:
    ch_num = sec["ch_num"]
    if ch_num in chapters:
        chapters[ch_num]["sections"].append(sec)

# Calculate chapter end pages
ch_nums = sorted(chapters.keys())
for i, ch_num in enumerate(ch_nums):
    if i + 1 < len(ch_nums):
        chapters[ch_num]["end_page"] = chapters[ch_nums[i + 1]]["start_page"] - 1
    else:
        chapters[ch_num]["end_page"] = total

# Skip appendices and back matter
skip_chapters = []
for ch_num, ch in chapters.items():
    title_lower = ch["title"].lower()
    if any(s in title_lower for s in ["appendix", "technical lemma", "measure concentration", "linear algebra", "notes", "references", "index"]):
        skip_chapters.append(ch_num)

for ch_num in skip_chapters:
    del chapters[ch_num]

# Output
out = Path("shalev_sections")
out.mkdir(exist_ok=True)
toc_data = {}
total_sec = 0
total_pages = 0

print("Shalev-Shwartz: Understanding Machine Learning")
print(f"Total PDF pages: {total}")
print("=" * 80)

current_part_name = None
for ch_num in sorted(chapters.keys()):
    ch = chapters[ch_num]

    # Part header
    if ch.get("part") != current_part_name:
        current_part_name = ch.get("part")
        if current_part_name:
            print(f"\n{current_part_name}")
            print("-" * 80)

    ch_id = f"ch{ch_num:02d}"
    ch_dir = out / ch_id
    ch_dir.mkdir(exist_ok=True)

    ch_page_range = f"p{ch['start_page']}-{ch['end_page']}"
    print(f"\n  {ch_id.upper()}: {ch['title']} ({ch_page_range})")

    ch_pages = 0
    for sec in ch["sections"]:
        pages = sec["end_page"] - sec["start_page"] + 1
        ch_pages += pages
        total_sec += 1
        flag = "!" if pages > 15 else "*" if pages > 8 else " "

        print(f"    {sec['sec_id']:<7} {sec['title']:<42} p{sec['start_page']:>3}-{sec['end_page']:<3} ({pages:>2}p) {flag}")

        # Create file
        safe = re.sub(r"[^\w\s-]", "", sec["title"]).replace(" ", "_").lower()[:35]
        fname = f"sec_{sec['sec_id'].replace('.', '_')}_{safe}.pdf"
        outpath = ch_dir / fname
        split_section(doc, sec["start_page"], sec["end_page"], outpath)

    total_pages += ch_pages
    toc_data[ch_id] = {
        "title": ch["title"],
        "part": ch.get("part"),
        "start_page": ch["start_page"],
        "end_page": ch["end_page"],
        "sections": [{
            "id": s["sec_id"],
            "title": s["title"],
            "start_page": s["start_page"],
            "end_page": s["end_page"]
        } for s in ch["sections"]]
    }
    print(f"    {'':7} {'SUBTOTAL':42} {ch_pages:>2} pages")

# Save TOC
with open(out / "toc.json", "w", encoding="utf-8") as f:
    json.dump(toc_data, f, indent=2, ensure_ascii=False)

print(f"\n{'=' * 80}")
print(f"Total: {len(chapters)} chapters, {total_sec} sections, {total_pages} pages")
print(f"Saved to: {out.resolve()}")
doc.close()
