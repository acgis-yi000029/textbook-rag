"""Split Murphy PML1 & PML2 - handles Parts + Chapters structure."""
import pymupdf
import re
import json
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, str(Path(r"c:\Users\40270\OneDrive\Desktop\workspace\aisd\.agent\skills\dev-pdf_processing\scripts")))
from pdf_section_split import split_section

def find_end_page(raw, i, target_level, total):
    """Find end page by looking for next entry at same or higher level."""
    for j in range(i + 1, len(raw)):
        if raw[j][0] <= target_level:
            return raw[j][2] - 1
    return total

def split_murphy(pdf_file, out_name):
    doc = pymupdf.open(pdf_file)
    total = doc.page_count
    raw = doc.get_toc()

    chapters = {}

    for i, (level, title, page) in enumerate(raw):
        title = title.strip()

        # L1 numbered chapter (e.g., "1 Introduction")
        if level == 1:
            m = re.match(r'^(\d+)\s+(.+)', title)
            if m:
                ch_num = int(m.group(1))
                ch_title = m.group(2).strip()
                end_page = find_end_page(raw, i, level, total)
                chapters[ch_num] = {
                    "title": ch_title,
                    "start_page": page,
                    "end_page": end_page,
                    "sections": []
                }

        # L2 can be: sections under L1 chapter OR chapters under Part
        elif level == 2:
            # Check if it's a chapter (e.g., "2 Probability: Univariate Models")
            m_ch = re.match(r'^(\d+)\s+(.+)', title)
            if m_ch:
                ch_num = int(m_ch.group(1))
                ch_title = m_ch.group(2).strip()
                end_page = find_end_page(raw, i, level, total)
                chapters[ch_num] = {
                    "title": ch_title,
                    "start_page": page,
                    "end_page": end_page,
                    "sections": []
                }
            else:
                # Section: "1.1 What is machine learning?"
                m_sec = re.match(r'^(\d+)\.(\d+)\s+(.+)', title)
                if m_sec:
                    ch_num = int(m_sec.group(1))
                    sec_num = int(m_sec.group(2))
                    sec_title = m_sec.group(3).strip()
                    sec_id = f"{ch_num}.{sec_num}"
                    end_page = find_end_page(raw, i, level, total)

                    if ch_num in chapters:
                        chapters[ch_num]["sections"].append({
                            "id": sec_id,
                            "title": sec_title,
                            "start_page": page,
                            "end_page": end_page
                        })

        # L3: sections under L2 chapters
        elif level == 3:
            m = re.match(r'^(\d+)\.(\d+)\s+(.+)', title)
            if m:
                ch_num = int(m.group(1))
                sec_num = int(m.group(2))
                sec_title = m.group(3).strip()
                sec_id = f"{ch_num}.{sec_num}"
                end_page = find_end_page(raw, i, level, total)

                if ch_num in chapters:
                    chapters[ch_num]["sections"].append({
                        "id": sec_id,
                        "title": sec_title,
                        "start_page": page,
                        "end_page": end_page
                    })

    # Output
    out = Path(out_name)
    out.mkdir(exist_ok=True)
    toc_data = {}
    total_sec = 0

    print(f"\n{'=' * 70}")
    print(f"Splitting: {pdf_file}")
    print(f"Output: {out}")
    print(f"{'=' * 70}")

    for ch_num in sorted(chapters.keys()):
        ch = chapters[ch_num]
        ch_id = f"ch{ch_num:02d}"
        ch_dir = out / ch_id
        ch_dir.mkdir(exist_ok=True)

        print(f"\n{ch_id}: {ch['title'][:50]}")

        ch_pages = 0
        for sec in ch["sections"]:
            pages = max(1, sec["end_page"] - sec["start_page"] + 1)
            ch_pages += pages
            total_sec += 1
            flag = "!" if pages > 15 else "*" if pages > 8 else " "

            print(f"  {sec['id']:<7} {sec['title'][:42]:<42} p{sec['start_page']:>3}-{sec['end_page']:<3} ({pages:>2}p) {flag}")

            safe = re.sub(r"[^\w\s-]", "", sec["title"]).replace(" ", "_").lower()[:35]
            fname = f"sec_{sec['id'].replace('.', '_')}_{safe}.pdf"
            split_section(doc, sec["start_page"], sec["end_page"], ch_dir / fname)

        toc_data[ch_id] = {
            "title": ch["title"],
            "sections": ch["sections"]
        }
        print(f"  {'':7} {'SUBTOTAL':42} {ch_pages:>2}p")

    with open(out / "toc.json", "w", encoding="utf-8") as f:
        json.dump(toc_data, f, indent=2, ensure_ascii=False)

    print(f"\n{'=' * 70}")
    print(f"Total: {len(chapters)} chapters, {total_sec} sections")
    doc.close()

if __name__ == "__main__":
    split_murphy("murphy_pml1.pdf", "murphy_pml1_sections")
    split_murphy("murphy_pml2.pdf", "murphy_pml2_sections")
