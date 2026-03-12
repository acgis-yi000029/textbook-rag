#!/usr/bin/env python3
"""
PDF Split Tool - 按页码范围或章节拆分 PDF
PDF Split Tool - Split PDF by page ranges or chapters

Usage:
    # 按页码范围拆分 (Split by page range)
    uv run python pdf_split.py input.pdf --pages 1-50 --output ch1.pdf

    # 批量拆分 (Batch split with config)
    uv run python pdf_split.py input.pdf --config chapters.json

    # 列出 PDF 目录/书签 (List TOC/bookmarks)
    uv run python pdf_split.py input.pdf --list-toc

    # 按书签自动拆分 (Auto-split by bookmarks)
    uv run python pdf_split.py input.pdf --by-bookmarks --output-dir ./chapters/

Example config (chapters.json):
{
    "chapters": [
        {"name": "ch01_introduction", "pages": "1-16"},
        {"name": "ch02_linear_algebra", "pages": "17-60"},
        {"name": "ch03_geometry", "pages": "61-90"}
    ]
}
"""

import argparse
import json
from pathlib import Path
from pypdf import PdfReader, PdfWriter


def parse_page_range(page_range: str, total_pages: int) -> list[int]:
    """
    Parse page range string to list of page indices (0-based).
    解析页码范围字符串为页码索引列表（从0开始）

    Examples:
        "1-10" -> [0, 1, 2, ..., 9]
        "1,3,5-7" -> [0, 2, 4, 5, 6]
        "10-" -> [9, 10, ..., total-1]
    """
    pages = []
    for part in page_range.split(','):
        part = part.strip()
        if '-' in part:
            start, end = part.split('-', 1)
            start = int(start) - 1 if start else 0
            end = int(end) if end else total_pages
            pages.extend(range(start, min(end, total_pages)))
        else:
            pages.append(int(part) - 1)
    return sorted(set(p for p in pages if 0 <= p < total_pages))


def split_pdf(input_path: str, pages: list[int], output_path: str) -> None:
    """
    Split PDF by extracting specified pages.
    提取指定页码创建新 PDF
    """
    reader = PdfReader(input_path)
    writer = PdfWriter()

    for page_num in pages:
        writer.add_page(reader.pages[page_num])

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'wb') as f:
        writer.write(f)

    print(f"[OK] Created: {output_path} ({len(pages)} pages)")


def list_toc(input_path: str) -> list[dict]:
    """
    List PDF table of contents / bookmarks.
    列出 PDF 目录/书签
    """
    reader = PdfReader(input_path)

    if not reader.outline:
        print("[WARN] No bookmarks/TOC found in this PDF")
        return []

    def extract_outline(outline, level=0):
        results = []
        for item in outline:
            if isinstance(item, list):
                results.extend(extract_outline(item, level + 1))
            else:
                # Get page number
                try:
                    page_num = reader.get_destination_page_number(item) + 1
                except:
                    page_num = "?"

                title = item.title
                results.append({
                    "level": level,
                    "title": title,
                    "page": page_num
                })
                print(f"{'  ' * level}[p.{page_num}] {title}")
        return results

    print(f"\n[TOC] Table of Contents for: {input_path}\n")
    return extract_outline(reader.outline)


def split_by_bookmarks(input_path: str, output_dir: str) -> None:
    """
    Auto-split PDF by top-level bookmarks.
    按顶级书签自动拆分 PDF
    """
    reader = PdfReader(input_path)
    total_pages = len(reader.pages)

    if not reader.outline:
        print("[WARN] No bookmarks found. Use --pages or --config instead.")
        return

    # Extract top-level bookmarks
    chapters = []
    for item in reader.outline:
        if not isinstance(item, list):
            try:
                page_num = reader.get_destination_page_number(item)
                title = item.title
                # Clean filename
                safe_name = "".join(c if c.isalnum() or c in " _-" else "_" for c in title)
                safe_name = safe_name.strip().replace(" ", "_")[:50]
                chapters.append({
                    "name": safe_name,
                    "start_page": page_num
                })
            except:
                pass

    if not chapters:
        print("[WARN] No usable bookmarks found.")
        return

    # Calculate page ranges
    for i, ch in enumerate(chapters):
        if i + 1 < len(chapters):
            ch["end_page"] = chapters[i + 1]["start_page"]
        else:
            ch["end_page"] = total_pages

    # Split
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    for i, ch in enumerate(chapters, 1):
        pages = list(range(ch["start_page"], ch["end_page"]))
        output_path = output_dir / f"{i:02d}_{ch['name']}.pdf"
        split_pdf(input_path, pages, str(output_path))


def split_by_config(input_path: str, config_path: str) -> None:
    """
    Batch split PDF using config file.
    使用配置文件批量拆分 PDF
    """
    reader = PdfReader(input_path)
    total_pages = len(reader.pages)

    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)

    output_dir = Path(config.get("output_dir", Path(input_path).parent))
    output_dir.mkdir(parents=True, exist_ok=True)

    for ch in config.get("chapters", []):
        name = ch["name"]
        page_range = ch["pages"]
        pages = parse_page_range(page_range, total_pages)
        output_path = output_dir / f"{name}.pdf"
        split_pdf(input_path, pages, str(output_path))


def main():
    parser = argparse.ArgumentParser(
        description="Split PDF by page ranges or chapters / 按页码范围或章节拆分 PDF",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("input", help="Input PDF file / 输入 PDF 文件")
    parser.add_argument("--pages", "-p", help="Page range (e.g., '1-50', '1,3,5-10') / 页码范围")
    parser.add_argument("--output", "-o", help="Output PDF file / 输出 PDF 文件")
    parser.add_argument("--config", "-c", help="Config JSON file for batch split / 批量拆分配置文件")
    parser.add_argument("--list-toc", action="store_true", help="List PDF bookmarks/TOC / 列出书签目录")
    parser.add_argument("--by-bookmarks", action="store_true", help="Auto-split by bookmarks / 按书签自动拆分")
    parser.add_argument("--output-dir", "-d", default="./", help="Output directory / 输出目录")

    args = parser.parse_args()

    if not Path(args.input).exists():
        print(f"[ERROR] File not found: {args.input}")
        return

    if args.list_toc:
        list_toc(args.input)
    elif args.by_bookmarks:
        split_by_bookmarks(args.input, args.output_dir)
    elif args.config:
        split_by_config(args.input, args.config)
    elif args.pages:
        reader = PdfReader(args.input)
        total_pages = len(reader.pages)
        pages = parse_page_range(args.pages, total_pages)

        output = args.output or f"{Path(args.input).stem}_p{args.pages.replace(',', '_')}.pdf"
        split_pdf(args.input, pages, output)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
