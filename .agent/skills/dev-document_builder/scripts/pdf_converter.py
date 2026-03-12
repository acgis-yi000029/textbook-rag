"""
Unified PDF Converter - 统一PDF转换工具

Convert PDF files to markdown with multiple format options:
- Standard markdown with images and tables
- Bilingual (English-Chinese) templates
- Page-to-image conversion

Usage:
    uv run python pdf_converter.py <pdf_file> [options]

Examples:
    # Basic markdown conversion
    uv run python pdf_converter.py lecture.pdf
    
    # Bilingual format
    uv run python pdf_converter.py lecture.pdf --bilingual
    
    # No image extraction
    uv run python pdf_converter.py lecture.pdf --no-images
    
    # Custom output path
    uv run python pdf_converter.py lecture.pdf -o notes/lecture1.md
"""

import sys
import argparse
import re
from pathlib import Path
from typing import Optional

try:
    import pdfplumber
    import fitz  # PyMuPDF
    from pypdf import PdfReader
except ImportError as e:
    print(f"Error: Missing dependency - {e}")
    print("\nInstall required packages:")
    print("  uv add pdfplumber pymupdf pypdf")
    sys.exit(1)


class PDFConverter:
    """Unified PDF to Markdown converter"""
    
    def __init__(self, pdf_path: Path, extract_images: bool = True, bilingual: bool = False):
        self.pdf_path = pdf_path
        self.extract_images = extract_images
        self.bilingual = bilingual
        
    def extract_images_from_page(self, pdf_document, page_num: int, 
                                 output_dir: Path, min_width: int = 200, 
                                 min_height: int = 150) -> list[dict]:
        """Extract meaningful images from a PDF page"""
        page = pdf_document[page_num - 1]
        image_list = page.get_images()
        extracted_images = []
        
        for img_index, img in enumerate(image_list):
            xref = img[0]
            try:
                base_image = pdf_document.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                image_width = base_image["width"]
                image_height = base_image["height"]
                
                # Filter small images (icons, logos)
                aspect_ratio = image_width / image_height if image_height > 0 else 0
                
                # Skip very wide images (headers, banners)
                if aspect_ratio > 8:
                    continue
                # Skip very tall images (sidebars, decorations)
                if aspect_ratio < 0.15:
                    continue
                # Skip small square-ish images (logos, icons) - stricter for page 1
                if image_width < 400 and image_height < 400 and 0.7 < aspect_ratio < 1.5:
                    continue
                # Skip both dimensions are small
                if image_width < min_width and image_height < min_height:
                    continue
                # Skip tiny files (likely icons/logos)
                if len(image_bytes) < 5000:  # < 5KB
                    continue
                # Skip very narrow/short images (headers, footers, decorations)
                if image_width < 100 or image_height < 100:
                    continue
                
                # Save image
                image_filename = f"page{page_num}_img{img_index + 1}.{image_ext}"
                image_path = output_dir / image_filename
                
                with open(image_path, "wb") as img_file:
                    img_file.write(image_bytes)
                
                extracted_images.append({
                    'filename': image_filename,
                    'width': image_width,
                    'height': image_height
                })
            except Exception as e:
                print(f"  ⚠ Warning: Could not extract image {img_index + 1} from page {page_num}: {e}")
        
        return extracted_images
    
    def convert_to_markdown(self, output_path: Path) -> None:
        """Convert PDF to structured markdown"""
        print(f"📄 Converting: {self.pdf_path.name}")
        
        # Setup image directory
        images_dir = None
        if self.extract_images:
            images_dir = output_path.parent / f"{output_path.stem}_images"
            images_dir.mkdir(parents=True, exist_ok=True)
        
        # Open PDF
        pdf_document = fitz.open(self.pdf_path) if self.extract_images else None
        
        with pdfplumber.open(self.pdf_path) as pdf:
            markdown_content = []
            
            # Header
            markdown_content.append(f"# {self.pdf_path.stem.replace('_', ' ').title()}\n")
            markdown_content.append(f"**Source:** `{self.pdf_path.name}`")
            markdown_content.append(f"**Total Pages:** {len(pdf.pages)}\n")
            markdown_content.append("---\n")
            
            # Process each page
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"  Processing page {page_num}/{len(pdf.pages)}...")
                
                text = page.extract_text()
                
                if not text or not text.strip():
                    markdown_content.append(f"## Page {page_num}\n")
                    markdown_content.append("*[No text content or image-only page]*\n")
                    markdown_content.append("---\n")
                    continue
                
                # Extract page title (first non-empty line or first heading)
                page_title = self._extract_page_title(text)
                
                # Page header with title
                if page_title:
                    markdown_content.append(f"## Page {page_num}: {page_title}\n")
                else:
                    markdown_content.append(f"## Page {page_num}\n")
                
                # Extract images
                if self.extract_images and pdf_document:
                    images = self.extract_images_from_page(pdf_document, page_num, images_dir)
                    if images:
                        markdown_content.append("\n**📷 Images:**\n")
                        for img_info in images:
                            rel_path = f"{images_dir.name}/{img_info['filename']}"
                            markdown_content.append(f"![Page {page_num} Image]({rel_path})")
                        markdown_content.append("")
                
                # Format text content (skip title if already used in header)
                formatted_text = self._format_text_content(text, skip_first_title=bool(page_title))
                markdown_content.append(formatted_text)
                markdown_content.append("")
                
                # Extract tables
                tables_md = self._extract_tables(page, text)
                if tables_md:
                    markdown_content.append(tables_md)
                
                # Add note section
                if self.bilingual:
                    markdown_content.append("**📝 Notes / 笔记:**\n")
                    markdown_content.append("> [Add your notes here / 在此添加笔记]\n")
                    markdown_content.append("**🌐 Translation / 翻译:**\n")
                    markdown_content.append("> [Add Chinese translation here / 在此添加中文翻译]\n")
                else:
                    markdown_content.append("**📝 Notes:**\n")
                    markdown_content.append("> [Add your notes here]\n")
                
                markdown_content.append("---\n")
            
            # Close PyMuPDF
            if pdf_document:
                pdf_document.close()
            
            # Write output
            output_path.parent.mkdir(parents=True, exist_ok=True)
            content = '\n'.join(markdown_content)
            
            # Post-process: fix common formatting issues
            content = self._post_process_markdown(content)
            
            output_path.write_text(content, encoding='utf-8')
            
            print(f"\n✓ Converted: {self.pdf_path.name} → {output_path.name}")
            print(f"  Pages: {len(pdf.pages)}")
            if self.extract_images and images_dir:
                image_count = len(list(images_dir.glob("*")))
                if image_count > 0:
                    print(f"  Images: {image_count} extracted to {images_dir.name}/")
    
    def _post_process_markdown(self, content: str) -> str:
        """Post-process markdown to fix common formatting issues"""
        lines = content.split('\n')
        fixed_lines = []
        
        for line in lines:
            # Remove trailing whitespace
            line = line.rstrip()
            
            # Fix list numbering: 1-, 2-, 3- → 1., 2., 3.
            if re.match(r'^\d+-\s+', line):
                line = re.sub(r'^(\d+)-\s+', r'\1. ', line)
            
            # Fix sub-list markers: o → -
            if re.match(r'^\s+o\s+', line):
                line = re.sub(r'^(\s+)o\s+', r'\1- ', line)
            
            fixed_lines.append(line)
        
        return '\n'.join(fixed_lines)
    
    def _clean_garbled_math(self, text: str) -> str:
        """Detect and clean garbled mathematical formulas
        
        Note: For accurate math formula extraction, consider using:
        - Mathpix (commercial API): Converts images to LaTeX
        - Pix2Text (open source): OCR + formula recognition
        - Manual transcription: Most reliable for complex formulas
        
        Current approach: Replace garbled text with placeholder
        """
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Check for truly garbled characters (not just math symbols)
            # These are the problematic Unicode characters from wrong font encoding
            garbled_chars = len(re.findall(r'[𝒙𝒚𝒛𝒘𝒃𝒄𝒅𝒂𝒏𝒎𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝑥𝑦𝑧𝑤𝑏𝑐𝑑𝑎𝑛𝑚𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑖𝑗𝑘𝑙𝑔𝑡𝑡𝑡𝑙𝑝𝑑ℎ�]', line))
            total_chars = len(line.strip())
            
            # Only replace if there are many garbled characters (>40% of line)
            # AND the line is mostly unreadable
            if total_chars > 0 and garbled_chars / total_chars > 0.4:
                # Check if line has readable English words
                readable_words = len(re.findall(r'\b[a-zA-Z]{3,}\b', line))
                if readable_words < 2:  # Less than 2 readable words
                    cleaned_lines.append("*[Mathematical formula - see image above]*")
                    continue
            
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def _extract_page_title(self, text: str) -> str:
        """Extract the main title from page text"""
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        if not lines:
            return ""
        
        # First line is usually the title
        first_line = lines[0]
        
        # Skip if it's too long (likely paragraph text)
        if len(first_line) > 100:
            return ""
        
        # Skip if it's all lowercase (likely body text)
        if first_line.islower():
            return ""
        
        # Skip common non-title patterns
        skip_patterns = [
            r'^\d+$',  # Just a number
            r'^Page\s+\d+',  # Page number
            r'^[a-z]+@',  # Email
            r'^\d{1,2}/\d{1,2}/',  # Date
        ]
        
        for pattern in skip_patterns:
            if re.match(pattern, first_line):
                return ""
        
        return first_line
    
    def _format_text_content(self, text: str, skip_first_title: bool = False) -> str:
        """Format and structure text content with code block detection"""
        # Clean up garbled math formulas first
        text = self._clean_garbled_math(text)
        
        lines = text.split('\n')
        formatted_lines = []
        prev_line = ""
        title_buffer = []
        code_buffer = []
        code_type = None  # 'python', 'bash', or None
        
        def flush_code_buffer():
            """Flush accumulated code lines as a code block"""
            nonlocal code_buffer, code_type
            if code_buffer:
                lang = code_type or 'bash'
                formatted_lines.append(f"\n```{lang}")
                formatted_lines.extend(code_buffer)
                formatted_lines.append("```\n")
                code_buffer = []
                code_type = None
        
        def is_code_line(line: str) -> tuple[bool, str | None]:
            """Check if line is code and return (is_code, code_type)"""
            # Python interactive prompt
            if re.match(r'^>>>+\s*', line):
                return True, 'python'
            # Command line prompt (bash/shell) - allow no space after >
            if re.match(r'^>\s*[a-z]', line):
                return True, 'bash'
            # Common shell commands without >
            if re.match(r'^(conda|pip|npm|yarn|git|docker|kubectl|uv)\s+', line):
                return True, 'bash'
            # Standalone 'python' command should be bash, not start of python code
            if line.strip() == 'python':
                return True, 'bash'
            # Common code patterns
            if re.match(r'^(import|from|def|class|if|for|while|try|except|with)\s+', line):
                return True, 'python'
            # Assignment or function call
            if re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*\s*[=\(]', line):
                return True, 'python'
            # Indented code (continuation)
            if code_buffer and line.startswith(('    ', '\t')):
                return True, code_type
            # Lines starting with quotes (string continuation)
            if code_buffer and code_type == 'python' and re.match(r'^["\']', line):
                return True, 'python'
            return False, None
        
        first_line_skipped = False
        for line in lines:
            line = line.strip()
            
            # Skip first line if it's used as page title
            if skip_first_title and not first_line_skipped:
                first_line_skipped = True
                continue
            
            if not line:
                # Empty line might be inside code block
                if code_buffer:
                    code_buffer.append('')
                elif title_buffer:
                    combined_title = " ".join(title_buffer)
                    formatted_lines.append(f"\n### {combined_title}\n")
                    title_buffer = []
                continue
            
            # Skip page numbers
            if line.isdigit() or re.match(r'^Page\s+\d+$', line):
                continue
            
            # Skip duplicates
            if line == prev_line:
                continue
            
            # Check if this is a code line
            is_code, detected_type = is_code_line(line)
            
            if is_code:
                # Flush title buffer if any
                if title_buffer:
                    combined_title = " ".join(title_buffer)
                    formatted_lines.append(f"\n### {combined_title}\n")
                    title_buffer = []
                
                # Special case: standalone 'python' command ends bash block, next line starts python block
                if line.strip() == 'python' and code_type == 'bash':
                    code_buffer.append('python')
                    flush_code_buffer()
                    continue
                
                # Clean up code line
                cleaned_line = line
                if re.match(r'^>>>+\s*', line):
                    cleaned_line = re.sub(r'^>>>+\s*', '', line)
                elif re.match(r'^>\s*', line):
                    cleaned_line = re.sub(r'^>\s*', '', line)
                
                # Start or continue code block
                if not code_buffer:
                    code_type = detected_type
                code_buffer.append(cleaned_line)
            else:
                # Not a code line - flush any pending code
                flush_code_buffer()
                
                # Detect titles
                # Common section keywords that should be titles
                common_titles = ['objectives', 'background', 'instructions', 'requirements', 
                                'steps', 'examples', 'notes', 'summary', 'conclusion']
                
                is_potential_title = (
                    len(line) < 50 and 
                    len(line) > 3 and  # At least 4 characters
                    (line.isupper() or 
                     (line.istitle() and len(line.split()) >= 2) or
                     line.lower() in common_titles) and  # Common section titles
                    not line.endswith(('.', ',', ';', ':')) and
                    not re.match(r'^[❑•\-·○]\s+', line) and
                    not line.startswith('❑') and
                    not line.lower() in ['or', 'and', 'but', 'note', 'step']  # Common non-title words
                )
                
                if is_potential_title:
                    title_buffer.append(line)
                else:
                    if title_buffer:
                        combined_title = " ".join(title_buffer)
                        formatted_lines.append(f"\n### {combined_title}\n")
                        title_buffer = []
                    
                    # Format bullets and lists
                    bullet_pattern = r'^[❑•\-·○]\s+'
                    if re.match(bullet_pattern, line):
                        formatted_lines.append(f"- {re.sub(bullet_pattern, '', line)}")
                    elif re.match(r'^\d+[\.\)]\s+', line):
                        formatted_lines.append(line)
                    elif re.match(r'^\d+-\s+', line):  # Fix 1-, 2-, 3- format
                        formatted_lines.append(re.sub(r'^(\d+)-\s+', r'\1. ', line))
                    else:
                        formatted_lines.append(line)
            
            prev_line = line
        
        # Flush any remaining buffers
        flush_code_buffer()
        if title_buffer:
            combined_title = " ".join(title_buffer)
            formatted_lines.append(f"\n### {combined_title}\n")
        
        return '\n'.join(formatted_lines)
    
    def _extract_tables(self, page, page_text: str) -> str:
        """Extract and format tables from page"""
        tables = page.extract_tables()
        if not tables:
            return ""
        
        page_text_normalized = ''.join(page_text.lower().split())
        markdown_tables = []
        
        for table in tables:
            if not table or len(table) < 2:
                continue
            
            # Check for meaningful content
            has_content = any(
                any(cell and str(cell).strip() for cell in row)
                for row in table
            )
            
            if not has_content or len(table[0]) <= 1:
                continue
            
            # Filter out code-related fake tables
            table_text = ' '.join(
                ' '.join(str(cell or '').strip() for cell in row)
                for row in table
            )
            
            # Skip if contains code indicators
            code_indicators = ['>>>', 'import', 'def ', 'class ', 'exit()', 'print(']
            if any(indicator in table_text for indicator in code_indicators):
                continue
            
            # Skip if mostly empty (less than 30% filled cells)
            total_cells = sum(len(row) for row in table)
            filled_cells = sum(
                1 for row in table 
                for cell in row 
                if cell and str(cell).strip()
            )
            if filled_cells / total_cells < 0.3:
                continue
            
            # Skip if too few rows (likely not a real table)
            if len(table) < 3:
                continue
            
            # Check for duplicates with page text
            table_text_normalized = ''.join(
                ''.join(str(cell or '').strip() for cell in row)
                for row in table
            ).lower().replace(' ', '')
            
            if len(table_text_normalized) > 20:
                similarity = sum(1 for char in table_text_normalized if char in page_text_normalized) / len(table_text_normalized)
                if similarity > 0.8:
                    continue
            
            # Format table
            table_md = ["\n**Table:**\n"]
            header = [str(cell or "").strip() for cell in table[0]]
            if any(header):
                table_md.append("| " + " | ".join(header) + " |")
                table_md.append("| " + " | ".join(["---"] * len(header)) + " |")
                for row in table[1:]:
                    cells = [str(cell or "").strip() for cell in row]
                    if any(cells):
                        table_md.append("| " + " | ".join(cells) + " |")
            
            markdown_tables.append('\n'.join(table_md))
        
        return '\n'.join(markdown_tables) if markdown_tables else ""
    
    def convert_to_bilingual_template(self, output_path: Path, format_type: str = "inline") -> None:
        """Convert PDF to bilingual template"""
        print(f"📄 Creating bilingual template: {self.pdf_path.name}")
        
        # Extract pages
        with open(self.pdf_path, 'rb') as file:
            reader = PdfReader(file)
            total_pages = len(reader.pages)
            
            pages = []
            for i, page in enumerate(reader.pages, 1):
                print(f"  Processing page {i}/{total_pages}...")
                text = page.extract_text()
                if text and text.strip():
                    pages.append(text.strip())
                else:
                    pages.append("*[Image-only or empty page]*")
        
        # Generate template
        if format_type == "side-by-side":
            content = self._format_side_by_side(pages)
        elif format_type == "separate":
            content = self._format_separate(pages)
        else:  # inline
            content = self._format_inline(pages)
        
        # Save
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(content, encoding='utf-8')
        
        print(f"\n✓ Bilingual template created: {output_path.name}")
        print(f"  Format: {format_type}")
        print(f"  Pages: {total_pages}")
    
    def _format_inline(self, pages: list[str]) -> str:
        """Inline bilingual format"""
        output = []
        output.append(f"# {self.pdf_path.stem}\n")
        output.append(f"**Source:** `{self.pdf_path.name}`")
        output.append(f"**来源:** `{self.pdf_path.name}`\n")
        output.append("---\n")
        
        for i, page_text in enumerate(pages, 1):
            output.append(f"## Page {i} | 第{i}页\n")
            output.append("### English Version\n")
            output.append(page_text)
            output.append("\n### 中文翻译\n")
            output.append("<!-- TODO: Add Chinese translation here -->")
            output.append("<!-- 待添加: 在此处添加中文翻译 -->\n")
            output.append("---\n")
        
        return "\n".join(output)
    
    def _format_side_by_side(self, pages: list[str]) -> str:
        """Side-by-side table format"""
        output = []
        output.append(f"# {self.pdf_path.stem}\n")
        output.append("| English | 中文 |")
        output.append("|---------|------|")
        
        for i, page_text in enumerate(pages, 1):
            paragraphs = [p.strip() for p in page_text.split('\n\n') if p.strip()]
            output.append(f"| **Page {i}** | **第{i}页** |")
            
            for para in paragraphs:
                para_escaped = para.replace('|', '\\|').replace('\n', ' ')
                output.append(f"| {para_escaped} | *[Translation needed]* |")
            
            output.append("| --- | --- |")
        
        return "\n".join(output)
    
    def _format_separate(self, pages: list[str]) -> str:
        """Separate sections format"""
        output = []
        output.append(f"# {self.pdf_path.stem}\n")
        output.append("## English Version\n")
        
        for i, page_text in enumerate(pages, 1):
            output.append(f"### Page {i}\n")
            output.append(page_text)
            output.append("")
        
        output.append("\n---\n---\n---\n")
        output.append("## 中文版本\n")
        
        for i in range(1, len(pages) + 1):
            output.append(f"### 第{i}页\n")
            output.append("<!-- TODO: Add Chinese translation -->")
            output.append("<!-- 待翻译 -->\n")
        
        return "\n".join(output)


def main():
    parser = argparse.ArgumentParser(
        description="Unified PDF to Markdown Converter",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic conversion
  uv run python pdf_converter.py lecture.pdf
  
  # Bilingual template
  uv run python pdf_converter.py lecture.pdf --bilingual
  
  # No images
  uv run python pdf_converter.py lecture.pdf --no-images
  
  # Custom output
  uv run python pdf_converter.py lecture.pdf -o notes/lecture1.md
  
  # Bilingual with format
  uv run python pdf_converter.py lecture.pdf --bilingual --format separate
        """
    )
    
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("-o", "--output", help="Output markdown file path")
    parser.add_argument("--no-images", action="store_true", help="Skip image extraction")
    parser.add_argument("--bilingual", action="store_true", help="Create bilingual template")
    parser.add_argument(
        "--format",
        choices=["inline", "side-by-side", "separate"],
        default="inline",
        help="Bilingual format (default: inline)"
    )
    
    args = parser.parse_args()
    
    # Validate PDF
    pdf_path = Path(args.pdf_path)
    if not pdf_path.exists():
        print(f"❌ Error: PDF file not found: {pdf_path}")
        sys.exit(1)
    
    # Determine output path
    if args.output:
        output_path = Path(args.output)
    else:
        suffix = "_bilingual" if args.bilingual else "_notes"
        output_path = pdf_path.parent / f"{pdf_path.stem}{suffix}.md"
    
    # Convert
    converter = PDFConverter(
        pdf_path=pdf_path,
        extract_images=not args.no_images,
        bilingual=args.bilingual
    )
    
    try:
        if args.bilingual:
            converter.convert_to_bilingual_template(output_path, args.format)
        else:
            converter.convert_to_markdown(output_path)
        
        print("\n" + "=" * 60)
        print("✓ Conversion complete!")
        print("=" * 60)
        print(f"\nOutput: {output_path}")
        
        if args.bilingual:
            print("\nNext steps:")
            print("1. Open the markdown file")
            print("2. Add Chinese translations in marked sections")
            print("3. Review and adjust formatting")
        
    except Exception as e:
        print(f"\n❌ Error during conversion: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) == 1:
        print("Unified PDF to Markdown Converter")
        print("=" * 60)
        print("\nUsage: uv run python pdf_converter.py <pdf_file> [options]")
        print("\nFor help: uv run python pdf_converter.py --help")
        sys.exit(0)
    
    main()
