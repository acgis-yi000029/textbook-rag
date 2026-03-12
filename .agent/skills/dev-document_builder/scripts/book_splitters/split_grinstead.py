"""
Split Grinstead & Snell PDF by sections.
拆分 Grinstead & Snell 概率论教材 PDF 为小节文件。

This PDF has NO internal bookmarks, so we extract the TOC from
running page headers (y≈94):
  - Even pages: "CHAPTER N. CHAPTER TITLE"
  - Odd pages:  "N.M. SECTION TITLE"

Usage:
    python split_grinstead.py --stats       # Preview TOC only
    python split_grinstead.py               # Split all sections
    python split_grinstead.py --chapter 5   # Split one chapter
"""
import pymupdf
import re
import json
import argparse
from pathlib import Path
from collections import OrderedDict


PDF_NAME = "grinstead_snell_probability.pdf"
OUTPUT_DIR = "grinstead_sections"


def extract_toc_from_headers(doc):
    """
    从运行页眉中提取目录（适用于无内嵌书签的 PDF）
    Extract TOC from running page headers (for PDFs without bookmarks).
    
    Running headers at y≈94:
      "CHAPTER N. CHAPTER TITLE"  → chapter boundary
      "N.M. SECTION TITLE"       → section boundary
    """
    sections = OrderedDict()   # sec_num -> (title, first_page)
    chapters = OrderedDict()   # ch_num  -> (title, first_page)

    for page_num in range(len(doc)):
        page = doc[page_num]
        blocks = page.get_text("dict")["blocks"]

        for block in blocks:
            if "lines" not in block:
                continue
            for line in block["lines"]:
                y = line["bbox"][1]
                if not (75 <= y <= 110):
                    continue
                text = "".join(s["text"] for s in line["spans"]).strip()
                if not text:
                    continue

                # Section header: "N.M. SECTION TITLE"
                m = re.match(r'^(\d+\.\d+)\.\s+(.+)', text)
                if m:
                    sec_num = m.group(1)
                    sec_title = m.group(2).strip()
                    if sec_num not in sections:
                        sections[sec_num] = (sec_title, page_num + 1)
                    continue

                # Chapter header: "CHAPTER N. CHAPTER TITLE"
                m = re.match(r'^CHAPTER\s+(\d+)\.\s+(.+)', text)
                if m:
                    ch_num = int(m.group(1))
                    ch_title = m.group(2).strip()
                    if ch_num not in chapters:
                        chapters[ch_num] = (ch_title, page_num + 1)

    return chapters, sections


def build_chapter_tree(chapters_raw, sections_raw, total_pages):
    """
    组装为与 pdf_section_split.py 相同的结构
    Build the same chapter-tree structure as pdf_section_split.py uses.
    """
    # Build ordered list of all entries for end-page calculation
    all_entries = []
    for ch_num, (title, page) in chapters_raw.items():
        all_entries.append(('chapter', ch_num, title, page))
    for sec_num, (title, page) in sections_raw.items():
        ch_num = int(sec_num.split('.')[0])
        all_entries.append(('section', sec_num, title, page))

    all_entries.sort(key=lambda e: e[3])

    # Build chapters dict
    chapters = {}
    for ch_num, (title, page) in chapters_raw.items():
        chapters[ch_num] = {
            "title": title.title(),  # Convert "DISCRETE PROBABILITY" → "Discrete Probability"
            "start_page": page,
            "end_page": total_pages,  # will be refined
            "sections": []
        }

    # Assign sections to chapters + calculate end pages
    for i, entry in enumerate(all_entries):
        next_page = all_entries[i + 1][3] if i + 1 < len(all_entries) else total_pages + 1
        end_page = next_page - 1

        if entry[0] == 'chapter':
            ch_num = entry[1]
            chapters[ch_num]["end_page"] = end_page
        elif entry[0] == 'section':
            sec_num = entry[1]
            sec_title = entry[2]
            ch_num = int(sec_num.split('.')[0])
            if ch_num in chapters:
                chapters[ch_num]["sections"].append({
                    "id": sec_num,
                    "title": sec_title.title(),
                    "start_page": entry[3],
                    "end_page": end_page
                })
                # Update chapter end page to cover all its sections
                chapters[ch_num]["end_page"] = max(chapters[ch_num]["end_page"], end_page)

    return chapters


def split_section(doc, start_page, end_page, output_path):
    """拆分并保存单个小节 / Split and save a single section"""
    new_doc = pymupdf.open()
    new_doc.insert_pdf(doc, from_page=start_page - 1, to_page=end_page - 1)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    new_doc.save(str(output_path))
    size_kb = output_path.stat().st_size / 1024
    new_doc.close()
    return size_kb


def main():
    parser = argparse.ArgumentParser(description="Split Grinstead & Snell PDF by sections")
    parser.add_argument("--chapter", type=int, help="Only split chapter N")
    parser.add_argument("--stats", action="store_true", help="Stats only (no splitting)")
    parser.add_argument("--output", default=OUTPUT_DIR, help=f"Output dir (default: {OUTPUT_DIR})")
    args = parser.parse_args()

    pdf_path = Path(__file__).parent / PDF_NAME
    doc = pymupdf.open(str(pdf_path))
    total_pages = doc.page_count

    print(f"PDF: {pdf_path.name} ({total_pages} pages)")

    # Step 1: Try built-in TOC first
    builtin_toc = doc.get_toc()
    if builtin_toc:
        print(f"Found built-in TOC with {len(builtin_toc)} entries")
        print("(Use pdf_section_split.py for built-in TOC splitting)")
        doc.close()
        return

    # Step 2: Extract from running headers
    print("No built-in TOC → extracting from running page headers...\n")
    chapters_raw, sections_raw = extract_toc_from_headers(doc)
    chapters = build_chapter_tree(chapters_raw, sections_raw, total_pages)

    print(f"TOC: {len(chapters)} chapters, {sum(len(ch['sections']) for ch in chapters.values())} sections\n")

    grand_total_sec = 0
    grand_total_pages = 0

    for ch_num in sorted(chapters.keys()):
        if args.chapter and ch_num != args.chapter:
            continue

        ch = chapters[ch_num]
        print(f"Ch {ch_num}: {ch['title']}")

        ch_pages = 0
        for sec in ch["sections"]:
            pages = sec["end_page"] - sec["start_page"] + 1
            ch_pages += pages
            grand_total_sec += 1

            flag = "!" if pages > 10 else "*" if pages > 5 else " "
            print(f"  {sec['id']:<7} {sec['title']:<50} {pages:>2}p {flag}")

            if not args.stats:
                safe = re.sub(r"[^\w\s-]", "", sec["title"]).replace(" ", "_").lower()
                fname = f"sec_{sec['id']}_{safe}.pdf"
                out = Path(args.output) / f"ch{ch_num:02d}" / fname
                size = split_section(doc, sec["start_page"], sec["end_page"], out)

        grand_total_pages += ch_pages
        print(f"  {'':7} {'SUBTOTAL':50} {ch_pages:>2}p\n")

    print(f"Total: {grand_total_sec} sections, {grand_total_pages} pages")
    if grand_total_sec:
        print(f"Avg: {grand_total_pages/grand_total_sec:.1f} pages/section")

    if not args.stats:
        # Save TOC JSON
        out_dir = Path(args.output)
        out_dir.mkdir(parents=True, exist_ok=True)
        toc_data = {}
        for ch_num in sorted(chapters.keys()):
            if args.chapter and ch_num != args.chapter:
                continue
            ch = chapters[ch_num]
            toc_data[f"ch{ch_num:02d}"] = {
                "title": ch["title"],
                "sections": ch["sections"]
            }
        with open(out_dir / "toc.json", "w", encoding="utf-8") as f:
            json.dump(toc_data, f, indent=2, ensure_ascii=False)
        print(f"\nSaved to: {out_dir.resolve()}")

    doc.close()


if __name__ == "__main__":
    main()
