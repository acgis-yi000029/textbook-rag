"""
PDF Section Splitter - 自动从 PDF 目录拆分小节
Automatically split PDF by sections using built-in TOC bookmarks.

Fallback: If no bookmarks exist, scans running page headers to detect
chapter/section boundaries (common in academic textbooks).
回退策略：若 PDF 无内嵌书签，则扫描页眉来检测章节边界。

Usage:
    python pdf_section_split.py deisenroth_mml.pdf              # 拆分全部
    python pdf_section_split.py deisenroth_mml.pdf --chapter 2   # 只拆第2章
    python pdf_section_split.py deisenroth_mml.pdf --stats       # 仅看统计
"""
import pymupdf
import re
import json
import argparse
from pathlib import Path
from collections import OrderedDict


def read_toc(doc, ch_level=None, skip_exercises=False):
    """
    直接读 PDF 目录书签，构建章节树
    Read PDF TOC bookmarks and build chapter-section tree.

    Auto-detects structure (自动检测结构):
      - Simple:  L1=chapters, L2=sections  (default when no Parts)
      - Nested:  ch_level=2 → L2=chapters, L3=sections  (e.g. MML)
      - Mixed:   L1 has both Parts (Roman numerals) and standalone chapters
                 → Parts skipped, L2 under Parts = chapters (L3 = sections)
                 → Standalone L1 chapters get L2 as sections  (e.g. Sutton & Barto)
    """
    raw = doc.get_toc()  # [(level, title, page), ...]
    total_pages = doc.page_count

    if not raw:
        return {}

    skip_title_prefixes = ["preface", "index", "references", "bibliography",
                           "contents", "summary of notation", "acknowledgments"]

    # --- Auto-detect chapter level ---
    # 自动检测章节层级
    if ch_level is None:
        # Check for Part markers (Roman numeral prefixes like "I   Title")
        has_parts = any(
            level == 1 and re.match(r'^[IVXL]+\s{2,}', title.strip())
            for level, title, _ in raw
        )
        if has_parts:
            return _read_toc_with_parts(raw, total_pages, skip_title_prefixes, skip_exercises)

        # Heuristic: count substantive L1 entries (skip front/back matter)
        # 启发式：统计实质性 L1 条目数量
        l1_count = sum(
            1 for level, title, _ in raw
            if level == 1 and not any(title.lower().strip().startswith(s) for s in skip_title_prefixes)
        )
        # Many L1 entries → L1 = chapters (e.g. Szeliski CV with 18 chapters at L1)
        # Few L1 entries  → L2 = chapters (e.g. MML with L1 as front matter only)
        ch_level = 1 if l1_count > 5 else 2

    # --- Standard mode: ch_level → ch_level+1 ---
    chapters = {}
    current_ch = None
    ch_counter = 0
    sec_level = ch_level + 1

    for i, (level, title, page) in enumerate(raw):
        next_page = raw[i + 1][2] if i + 1 < len(raw) else total_pages + 1
        end_page = next_page - 1

        if level == ch_level:
            if any(title.lower().strip().startswith(s) for s in skip_title_prefixes):
                continue

            ch_counter += 1
            ch_num = ch_counter
            ch_match = re.match(r"^(\d+)\s+(.+)", title)
            if ch_match:
                ch_num = int(ch_match.group(1))
                title = ch_match.group(2)

            current_ch = ch_num
            chapters[ch_num] = {
                "title": title.strip(),
                "start_page": page,
                "end_page": end_page,
                "sections": []
            }

        elif level == sec_level and current_ch:
            if skip_exercises and "Exercise" in title:
                continue

            sec_id = f"{current_ch}.{len(chapters[current_ch]['sections']) + 1}"
            sec_title = title.strip()
            sec_match = re.match(r"^(\d+\.\d+)\s+(.+)", title)
            if sec_match:
                sec_id = sec_match.group(1)
                sec_title = sec_match.group(2)

            chapters[current_ch]["sections"].append({
                "id": sec_id,
                "title": sec_title,
                "start_page": page,
                "end_page": end_page
            })
        elif title.startswith("Exercises") and current_ch:
            chapters[current_ch]["end_page"] = end_page

    return chapters


def _read_toc_with_parts(raw, total_pages, skip_title_prefixes, skip_exercises):
    """
    处理含 Part 分组的 TOC（如 Sutton & Barto RL）
    Handle TOC with Part groupings:
      L1 Part (Roman numeral) → skip (grouping only)
      L1 non-Part (e.g. "Introduction") → standalone chapter, L2 = sections
      L2 under Part → chapter, L3 = sections
    """
    chapters = {}
    current_ch = None
    ch_counter = 0
    in_part = False

    for i, (level, title, page) in enumerate(raw):
        next_page = raw[i + 1][2] if i + 1 < len(raw) else total_pages + 1
        end_page = next_page - 1

        if level == 1:
            if any(title.lower().strip().startswith(s) for s in skip_title_prefixes):
                current_ch = None
                in_part = False
                continue

            # Part marker? (e.g. "I   Tabular Solution Methods")
            if re.match(r'^[IVXL]+\s{2,}', title.strip()):
                in_part = True
                current_ch = None
                continue

            # Standalone L1 chapter (e.g. "Introduction")
            in_part = False
            ch_counter += 1
            ch_num = ch_counter
            ch_match = re.match(r"^(\d+)\s+(.+)", title)
            if ch_match:
                ch_num = int(ch_match.group(1))
                title = ch_match.group(2)

            current_ch = ch_num
            chapters[ch_num] = {
                "title": title.strip(),
                "start_page": page,
                "end_page": end_page,
                "sections": []
            }

        elif level == 2:
            if in_part:
                # L2 under Part → chapter
                if any(title.lower().strip().startswith(s) for s in skip_title_prefixes):
                    continue
                ch_counter += 1
                ch_num = ch_counter
                ch_match = re.match(r"^(\d+)\s+(.+)", title)
                if ch_match:
                    ch_num = int(ch_match.group(1))
                    title = ch_match.group(2)

                current_ch = ch_num
                chapters[ch_num] = {
                    "title": title.strip(),
                    "start_page": page,
                    "end_page": end_page,
                    "sections": []
                }
            elif current_ch:
                # L2 under standalone L1 chapter → section
                if skip_exercises and "Exercise" in title:
                    continue
                sec_id = f"{current_ch}.{len(chapters[current_ch]['sections']) + 1}"
                sec_title = title.strip()
                sec_match = re.match(r"^(\d+\.\d+)\s+(.+)", title)
                if sec_match:
                    sec_id = sec_match.group(1)
                    sec_title = sec_match.group(2)
                chapters[current_ch]["sections"].append({
                    "id": sec_id,
                    "title": sec_title,
                    "start_page": page,
                    "end_page": end_page
                })

        elif level == 3 and current_ch and in_part:
            # L3 under Part's chapter → section
            if skip_exercises and "Exercise" in title:
                continue
            sec_id = f"{current_ch}.{len(chapters[current_ch]['sections']) + 1}"
            sec_title = title.strip()
            sec_match = re.match(r"^(\d+\.\d+)\s+(.+)", title)
            if sec_match:
                sec_id = sec_match.group(1)
                sec_title = sec_match.group(2)
            chapters[current_ch]["sections"].append({
                "id": sec_id,
                "title": sec_title,
                "start_page": page,
                "end_page": end_page
            })

        if title.startswith("Exercises") and current_ch:
            chapters[current_ch]["end_page"] = end_page

    return chapters


def read_toc_from_headers(doc, header_y_range=(75, 110)):
    """
    从运行页眉中提取目录（适用于无内嵌书签的 PDF）
    Fallback: extract TOC from running page headers.

    Supported header formats (多种学术教材页眉格式):
      Style A (Grinstead):  "CHAPTER N. TITLE" / "N.M. SECTION TITLE"
      Style B (MacKay):     "N — Title"         / "N.M: Section Title"

    Args:
        doc: pymupdf Document
        header_y_range: (min_y, max_y) to look for running headers
    """
    y_min, y_max = header_y_range
    sections_raw = OrderedDict()  # sec_num -> (title, first_page)
    chapters_raw = OrderedDict()  # ch_num  -> (title, first_page)

    # Regex patterns for different textbook styles
    # 多种教材页眉格式的正则表达式
    section_patterns = [
        re.compile(r'^(\d+\.\d+)\.\s+(.+)'),   # "N.M. TITLE"  (Grinstead style)
        re.compile(r'^(\d+\.\d+):\s+(.+)'),     # "N.M: Title"  (MacKay style)
    ]
    chapter_patterns = [
        re.compile(r'^CHAPTER\s+(\d+)\.\s+(.+)'),              # "CHAPTER N. TITLE"
        re.compile(r'^(\d+)\s*\u2014\s+(.+)'),                  # "N — Title" (em dash U+2014)
        re.compile(r'^(\d+)\s*\u2013\s+(.+)'),                  # "N – Title" (en dash U+2013)
    ]

    for page_num in range(len(doc)):
        page = doc[page_num]
        blocks = page.get_text("dict")["blocks"]

        for block in blocks:
            if "lines" not in block:
                continue
            for line in block["lines"]:
                y = line["bbox"][1]
                if not (y_min <= y <= y_max):
                    continue
                text = "".join(s["text"] for s in line["spans"]).strip()
                if not text:
                    continue

                # Try section patterns first (more specific)
                for pat in section_patterns:
                    m = pat.match(text)
                    if m and m.group(1) not in sections_raw:
                        sections_raw[m.group(1)] = (m.group(2).strip(), page_num + 1)
                        break
                else:
                    # Try chapter patterns
                    for pat in chapter_patterns:
                        m = pat.match(text)
                        if m and int(m.group(1)) not in chapters_raw:
                            chapters_raw[int(m.group(1))] = (m.group(2).strip(), page_num + 1)
                            break

    if not chapters_raw:
        return {}

    # Assemble into standard chapter tree structure
    # 组装为与 read_toc() 相同的章节树结构
    total_pages = doc.page_count

    # Build ordered list for end-page calculation
    all_entries = []
    for ch_num, (title, page) in chapters_raw.items():
        all_entries.append(('chapter', ch_num, title, page))
    for sec_num, (title, page) in sections_raw.items():
        all_entries.append(('section', sec_num, title, page))
    all_entries.sort(key=lambda e: e[3])

    chapters = {}
    for ch_num, (title, page) in chapters_raw.items():
        chapters[ch_num] = {
            "title": title.title(),
            "start_page": page,
            "end_page": total_pages,
            "sections": []
        }

    for i, entry in enumerate(all_entries):
        next_page = all_entries[i + 1][3] if i + 1 < len(all_entries) else total_pages + 1
        end_page = next_page - 1

        if entry[0] == 'chapter':
            chapters[entry[1]]["end_page"] = end_page
        elif entry[0] == 'section':
            sec_num = entry[1]
            ch_num = int(sec_num.split('.')[0])
            if ch_num in chapters:
                chapters[ch_num]["sections"].append({
                    "id": sec_num,
                    "title": entry[2].title(),
                    "start_page": entry[3],
                    "end_page": end_page
                })
                chapters[ch_num]["end_page"] = max(
                    chapters[ch_num]["end_page"], end_page
                )

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
    parser = argparse.ArgumentParser(description="Split PDF by TOC sections")
    parser.add_argument("pdf", help="Source PDF")
    parser.add_argument("--chapter", type=int, help="Only chapter N")
    parser.add_argument("--stats", action="store_true", help="Stats only")
    parser.add_argument("--output", default="sections", help="Output dir")
    parser.add_argument("--ch-level", type=int, default=None, help="TOC level for chapters (default: auto-detect)")
    args = parser.parse_args()

    doc = pymupdf.open(args.pdf)
    chapters = read_toc(doc, ch_level=args.ch_level)

    print(f"PDF: {args.pdf} ({doc.page_count} pages)")

    if len(chapters) == 0:
        # Fallback: 扫描运行页眉 / Scan running page headers
        print("No built-in TOC → scanning running page headers...")
        chapters = read_toc_from_headers(doc)

    print(f"TOC: {len(chapters)} chapters found\n")

    if len(chapters) == 0:
        print("❌ NO TOC FOUND!")
        print("This PDF has neither internal bookmarks nor detectable running headers.")
        print("Consider manual splitting or adding bookmarks first.")
        return

    grand_total_sec = 0
    grand_total_pages = 0

    for ch_num in sorted(chapters.keys()):
        if args.chapter and ch_num != args.chapter:
            continue

        ch = chapters[ch_num]
        print(f"Ch {ch['title']}")

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
        # 保存 TOC JSON / Save TOC as JSON
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
