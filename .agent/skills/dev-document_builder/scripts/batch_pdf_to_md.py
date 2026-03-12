"""
Batch convert PDF sections to Markdown.
批量将 PDF 章节转换为 Markdown。

Usage / 用法:
  # 预览：看有多少 PDF 要转（不实际转换）
  python batch_pdf_to_md.py --root courses/self-study --stats

  # 转换所有
  python batch_pdf_to_md.py --root courses/self-study --all

  # 只转某本书
  python batch_pdf_to_md.py --root courses/self-study --book mml_sections
  python batch_pdf_to_md.py --root courses/self-study --book grinstead_sections

  # 只转某本书的某章
  python batch_pdf_to_md.py --root courses/self-study --book mml_sections --chapter ch06

  # 只转单个文件
  python batch_pdf_to_md.py --file "path/to/sec_6.3_xxx.pdf"

  # 跳过已有 .md 的（默认行为，加 --force 覆盖）
  python batch_pdf_to_md.py --root courses/self-study --book mml_sections --force

  # 限制数量（测试用）
  python batch_pdf_to_md.py --root courses/self-study --all --limit 5
"""
import argparse
import sys
from pathlib import Path

try:
    import pymupdf
except ImportError:
    print("❌ pymupdf not installed. Run: uv add pymupdf")
    sys.exit(1)

# Default root directory (can be overridden with --root)
# 默认根目录（可用 --root 覆盖）
DEFAULT_ROOT = Path.cwd()


def find_pdfs(
    root: Path,
    book: str = None,
    chapter: str = None,
    single_file: str = None,
) -> list[Path]:
    """Find PDF files matching filters.
    查找匹配过滤条件的 PDF 文件。
    """
    if single_file:
        p = Path(single_file)
        if p.exists() and p.suffix == ".pdf":
            return [p]
        print(f"❌ File not found or not a PDF: {single_file}")
        return []

    # Search pattern: */_sources/*_sections/ch**/sec_*.pdf
    # 搜索模式：各学科的 _sources 目录下的章节 PDF
    pdfs = []
    for sources_dir in root.rglob("_sources"):
        if not sources_dir.is_dir():
            continue
        for section_dir in sources_dir.iterdir():
            if not section_dir.is_dir() or not section_dir.name.endswith("_sections"):
                continue
            # Filter by book name / 按书名过滤
            if book and section_dir.name != book:
                continue
            for pdf in sorted(section_dir.rglob("*.pdf")):
                # Filter by chapter / 按章节过滤
                if chapter:
                    if chapter not in pdf.parts:
                        continue
                pdfs.append(pdf)
    return pdfs


def convert_pdf_to_md(pdf_path: Path, force: bool = False) -> tuple[bool, str]:
    """Convert a single PDF to Markdown.
    将单个 PDF 转换为 Markdown。

    Returns (success, message).
    """
    md_path = pdf_path.with_suffix(".md")

    # Skip if .md already exists (unless --force)
    # 跳过已有 .md 的（除非 --force）
    if md_path.exists() and not force:
        return False, f"⏭️  Skip (already exists): {pdf_path.name}"

    try:
        doc = pymupdf.open(str(pdf_path))
    except Exception as e:
        return False, f"❌ Error opening: {pdf_path.name} — {e}"

    # Build title from filename
    # 从文件名构建标题
    stem = pdf_path.stem  # e.g., sec_6.3_sum_rule_product_rule_and_bayes_theorem
    # Extract section number and name
    parts = stem.split("_", 2)  # ['sec', '6.3', 'sum_rule_...']
    if len(parts) >= 3:
        sec_num = parts[1]
        sec_name = parts[2].replace("_", " ").title()
        title = f"§{sec_num} — {sec_name}"
    else:
        title = stem.replace("_", " ").title()

    # Find which book this belongs to
    # 找到属于哪本书
    book_name = "Unknown"
    for part in pdf_path.parts:
        if part.endswith("_sections"):
            book_name = part.replace("_sections", "").replace("_", " ").title()
            break

    lines = [f"# {title}\n"]
    lines.append(f"*Source: `{pdf_path.name}` ({book_name})*\n")

    for page_num, page in enumerate(doc, 1):
        lines.append(f"\n---\n\n## Page {page_num}\n")
        text = page.get_text("text")
        if text.strip():
            lines.append(text.strip())

    doc.close()

    md_path.write_text("\n".join(lines), encoding="utf-8")
    size_kb = md_path.stat().st_size / 1024
    return True, f"✅ {pdf_path.name} → .md ({size_kb:.1f} KB)"


def show_stats(pdfs: list[Path]):
    """Show statistics without converting.
    显示统计信息（不转换）。
    """
    # Count by book
    # 按书统计
    by_book: dict[str, list[Path]] = {}
    for p in pdfs:
        for part in p.parts:
            if part.endswith("_sections"):
                by_book.setdefault(part, []).append(p)
                break

    # Count already converted
    # 统计已转换的
    total_done = sum(1 for p in pdfs if p.with_suffix(".md").exists())

    print(f"\n📊 PDF Statistics / PDF 统计")
    print(f"{'─' * 60}")
    print(f"  Total PDFs:     {len(pdfs)}")
    print(f"  Already .md:    {total_done}")
    print(f"  Remaining:      {len(pdfs) - total_done}")
    total_mb = sum(p.stat().st_size for p in pdfs) / (1024 * 1024)
    print(f"  Total size:     {total_mb:.1f} MB")
    print(f"\n  By book / 按书:")
    for book, book_pdfs in sorted(by_book.items(), key=lambda x: -len(x[1])):
        done = sum(1 for p in book_pdfs if p.with_suffix(".md").exists())
        print(f"    {book:<30s}  {len(book_pdfs):>4d} PDFs  ({done} done)")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Batch convert PDF sections to Markdown / 批量转换 PDF 章节为 Markdown"
    )
    parser.add_argument("--root", type=str, help="Root directory to search for PDFs / PDF 搜索根目录")
    parser.add_argument("--stats", action="store_true", help="Show stats only, don't convert / 只显示统计")
    parser.add_argument("--all", action="store_true", help="Convert ALL PDFs / 转换所有 PDF")
    parser.add_argument("--book", type=str, help="Only this book (e.g., mml_sections) / 只转某本书")
    parser.add_argument("--chapter", type=str, help="Only this chapter (e.g., ch06) / 只转某章")
    parser.add_argument("--file", type=str, help="Convert single file / 转换单个文件")
    parser.add_argument("--force", action="store_true", help="Overwrite existing .md / 覆盖已有 .md")
    parser.add_argument("--limit", type=int, default=0, help="Max files to convert (0=unlimited) / 最多转换几个")

    args = parser.parse_args()

    # Determine root directory
    # 确定根目录
    root = Path(args.root).resolve() if args.root else DEFAULT_ROOT

    # Validate: at least one action
    # 验证：至少指定一个操作
    if not any([args.stats, args.all, args.book, args.file]):
        parser.print_help()
        print("\n💡 Try: python batch_pdf_to_md.py --root courses/self-study --stats")
        return

    # Find PDFs
    # 查找 PDF
    pdfs = find_pdfs(
        root,
        book=args.book,
        chapter=args.chapter,
        single_file=args.file,
    )

    if not pdfs:
        print("❌ No PDFs found with the given filters.")
        return

    # Stats mode
    # 统计模式
    if args.stats:
        show_stats(pdfs)
        return

    # Convert
    # 转换
    converted = 0
    skipped = 0
    errors = 0
    limit = args.limit if args.limit > 0 else len(pdfs)

    print(f"\n🔄 Converting {min(len(pdfs), limit)} PDFs...\n")

    for i, pdf in enumerate(pdfs):
        if converted >= limit:
            print(f"\n⏸️  Reached limit ({limit}). Use --limit to change.")
            break

        success, msg = convert_pdf_to_md(pdf, force=args.force)
        print(f"  [{i+1}/{len(pdfs)}] {msg}")

        if success:
            converted += 1
        elif "Skip" in msg:
            skipped += 1
        else:
            errors += 1

    print(f"\n{'─' * 60}")
    print(f"  ✅ Converted: {converted}")
    print(f"  ⏭️  Skipped:   {skipped}")
    print(f"  ❌ Errors:    {errors}")
    print()


if __name__ == "__main__":
    main()
