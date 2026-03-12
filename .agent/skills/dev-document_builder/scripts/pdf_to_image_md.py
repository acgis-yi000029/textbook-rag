"""
Convert PDF to Markdown with page images + OCR text

Each page will be:
1. Converted to an image (for visual reference)
2. OCR'd to extract text and formulas
3. Saved as markdown with both image and text

Usage:
    uv run python pdf_to_image_md.py <pdf_file> [-o output.md]
"""

import sys
import argparse
import re
from pathlib import Path

try:
    import fitz  # PyMuPDF
    from PIL import Image
except ImportError as e:
    print(f"Error: {e}")
    print("Install: uv add pymupdf pillow")
    sys.exit(1)

# Optional: Pix2Text for better formula recognition
try:
    from pix2text import Pix2Text
    HAS_PIX2TEXT = True
except ImportError:
    HAS_PIX2TEXT = False
    print("⚠️  Pix2Text not available - will use basic text extraction")
    print("   For better formula recognition: uv add pix2text\n")


class PDFToImageMarkdown:
    """Convert PDF to markdown with page images and OCR text"""
    
    def __init__(self, pdf_path: Path, use_ocr: bool = True):
        self.pdf_path = pdf_path
        self.use_ocr = use_ocr and HAS_PIX2TEXT
        self.p2t = None
        
        if self.use_ocr:
            print("🔧 Initializing Pix2Text for OCR...")
            try:
                self.p2t = Pix2Text.from_config()
                print("✅ OCR ready\n")
            except Exception as e:
                print(f"⚠️  OCR initialization failed: {e}")
                print("   Falling back to basic text extraction\n")
                self.use_ocr = False
    
    def convert(self, output_path: Path, dpi: int = 200):
        """Convert PDF to markdown with images"""
        
        print(f"📄 Converting: {self.pdf_path.name}")
        print(f"   DPI: {dpi}")
        print(f"   OCR: {'Enabled' if self.use_ocr else 'Basic text extraction'}\n")
        
        # Setup directories
        images_dir = output_path.parent / f"{output_path.stem}_pages"
        images_dir.mkdir(parents=True, exist_ok=True)
        
        # Open PDF
        doc = fitz.open(self.pdf_path)
        
        md_lines = []
        
        # Header
        title = self.pdf_path.stem.replace('_', ' ')
        md_lines.append(f"# {title}\n")
        md_lines.append(f"**Source:** `{self.pdf_path.name}`  ")
        md_lines.append(f"**Total Pages:** {len(doc)}  ")
        md_lines.append(f"**Format:** Page Image + OCR Text\n")
        md_lines.append("---\n")
        
        # Process each page
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_number = page_num + 1
            
            print(f"  Processing page {page_number}/{len(doc)}...")
            
            # 1. Convert page to image
            image_filename = f"page_{page_number:03d}.png"
            image_path = images_dir / image_filename
            
            pix = page.get_pixmap(dpi=dpi)
            pix.save(str(image_path))
            
            # 2. Check if page has meaningful text content
            # First do a quick check with basic text extraction
            basic_text = page.get_text("text").strip()
            has_meaningful_text = self._has_meaningful_text(basic_text)
            
            # 3. Extract text only if page has meaningful content
            text = ""
            if has_meaningful_text:
                if self.use_ocr:
                    text = self._ocr_page(image_path)
                else:
                    text = self._clean_ocr_text(basic_text)  # Clean basic text too
            
            # 4. Build markdown for this page
            md_lines.append(f"## Page {page_number}\n")
            
            # Page image
            md_lines.append("### 📷 Page Image\n")
            md_lines.append(f"![Page {page_number}]({images_dir.name}/{image_filename})\n")
            
            # OCR text (only if meaningful)
            if text and text.strip():
                md_lines.append("### 📝 Text Content\n")
                md_lines.append(text.strip())
                md_lines.append("\n")
            
            # Notes section
            md_lines.append("### ✍️ Notes\n")
            md_lines.append("> [Add your notes here]\n")
            md_lines.append("---\n")
        
        # Save page count before closing
        total_pages = len(doc)
        
        doc.close()
        
        # Write output
        content = '\n'.join(md_lines)
        output_path.write_text(content, encoding='utf-8')
        
        print(f"\n✅ Converted: {self.pdf_path.name} → {output_path.name}")
        print(f"   Pages: {total_pages}")
        print(f"   Images: {images_dir}/")
    
    def _has_meaningful_text(self, text: str) -> bool:
        """Check if page has meaningful text content (not just labels/noise)"""
        if not text or not text.strip():
            return False
        
        # Remove common noise
        lines = text.split('\n')
        meaningful_lines = []
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines
            if not line:
                continue
            
            # Skip common noise patterns (case insensitive)
            if re.match(r'^(ALGONQUIN|COLLEGE)$', line, re.IGNORECASE):
                continue
            
            # Skip standalone numbers (page numbers, axis labels)
            if re.match(r'^\d+$', line):
                continue
            
            # Skip lines with only symbols
            if re.match(r'^[●○◆■□▪▫•·®™©\-\–\—\s]+$', line):
                continue
            
            meaningful_lines.append(line)
        
        # If we have less than 3 meaningful lines, consider it image-only
        if len(meaningful_lines) < 3:
            return False
        
        # Check if total meaningful text is substantial (> 50 characters)
        total_text = ' '.join(meaningful_lines)
        if len(total_text) < 50:
            return False
        
        # Check text quality: if too many garbled characters, skip OCR
        # Count ratio of readable English words vs total characters
        words = total_text.split()
        readable_words = sum(1 for word in words if re.match(r'^[a-zA-Z]{3,}$', word))
        
        if len(words) > 0:
            readable_ratio = readable_words / len(words)
            # If less than 40% of words are readable English, consider it low quality
            if readable_ratio < 0.4:
                return False
        
        return True
    
    def _ocr_page(self, image_path: Path) -> str:
        """OCR a page image using Pix2Text"""
        try:
            result = self.p2t.recognize(str(image_path))
            
            # Extract text from result
            if isinstance(result, dict):
                text = result.get('text', '')
                
                # Add formulas if detected
                formulas = result.get('formulas', [])
                if formulas:
                    text += "\n\n[Formulas detected:]\n"
                    for i, formula in enumerate(formulas, 1):
                        latex = formula.get('latex', formula.get('text', ''))
                        text += f"{i}. ${latex}$\n"
                
                # Clean up text and extract title
                text = self._clean_ocr_text(text)
                text = self._format_with_title(text)
                
                return text
            else:
                # If result is not a dict, convert to string and clean
                text = str(result)
                text = self._clean_ocr_text(text)
                text = self._format_with_title(text)
                return text
        
        except Exception as e:
            print(f"    ⚠️  OCR failed: {e}")
            return "[OCR failed]"
    
    def _clean_ocr_text(self, text: str) -> str:
        """Clean up OCR text by removing common noise"""
        # First pass: remove ALGONQUIN and COLLEGE words
        text = re.sub(r'ALGONQUIN', '', text, flags=re.IGNORECASE)
        text = re.sub(r'COLLEGE', '', text, flags=re.IGNORECASE)
        
        lines = text.split('\n')
        cleaned_lines = []
        
        # Common noise patterns to filter out
        noise_patterns = [
            r'^\d+\s*$',  # Standalone page numbers
            r'^©\s*$',    # Copyright symbol alone
            r'^[●○◆■□▪▫•·]+\s*$',  # Bullet points alone
            r'^[®™©]+\s*$',  # Trademark/copyright symbols alone
            r'^[\-\–\—]+\s*$',  # Dashes alone
        ]
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines
            if not line:
                continue
            
            # Remove standalone decorative symbols at start/end
            line = re.sub(r'^[●○◆■□▪▫•·®™©\-\–\—]+\s+', '', line)
            line = re.sub(r'\s+[●○◆■□▪▫•·®™©\-\–\—]+$', '', line)
            
            # Skip if line is only numbers and spaces (likely axis labels)
            # This includes lines like "8 Support" where 8 is a coordinate
            if re.match(r'^[\d\s]+$', line):
                continue
            
            # Skip lines that start with a single digit followed by space (coordinate labels)
            # e.g., "8 Support vectors" -> the 8 is likely from Y-axis
            if re.match(r'^\d\s+', line):
                # Remove the leading digit
                line = re.sub(r'^\d\s+', '', line)
            
            # Skip lines that end with a single digit (coordinate labels)
            # e.g., "marked in circle 6" -> the 6 is likely from X-axis
            if re.match(r'.*\s\d$', line):
                # Remove the trailing digit
                line = re.sub(r'\s\d$', '', line)
            
            # Check if line matches any noise pattern
            is_noise = False
            for pattern in noise_patterns:
                if re.match(pattern, line, re.IGNORECASE):
                    is_noise = True
                    break
            
            # Skip very short lines that are likely noise (but keep formulas)
            if len(line) < 3 and not re.search(r'[\$\(\)\[\]]', line):
                is_noise = True
            
            if not is_noise and line:
                cleaned_lines.append(line)
        
        result = '\n'.join(cleaned_lines)
        
        # Clean up multiple newlines
        result = re.sub(r'\n{3,}', '\n\n', result)
        
        return result.strip()
    
    def _format_with_title(self, text: str) -> str:
        """Extract and format title from text content"""
        if not text or not text.strip():
            return text
        
        lines = text.split('\n')
        if not lines:
            return text
        
        # Try to identify the title (first substantial line)
        title = None
        remaining_lines = []
        found_title = False
        
        for i, line in enumerate(lines):
            line = line.strip()
            
            if not found_title and line:
                # First non-empty line is likely the title
                # Check if it looks like a title (short, capitalized, no ending punctuation)
                if len(line) < 100 and not line.endswith(('.', ',', ';', ':')):
                    title = line
                    found_title = True
                    continue
            
            if found_title:
                remaining_lines.append(line)
        
        # Format output
        if title:
            formatted = f"**{title}**\n\n"
            if remaining_lines:
                formatted += '\n'.join(remaining_lines)
            return formatted.strip()
        
        return text


def main():
    parser = argparse.ArgumentParser(
        description="Convert PDF to Markdown with page images + OCR text"
    )
    parser.add_argument("pdf_file", type=Path, help="PDF file path")
    parser.add_argument("-o", "--output", type=Path, help="Output markdown file")
    parser.add_argument("--dpi", type=int, default=200, help="Image DPI (default: 200, higher = better quality but larger files)")
    parser.add_argument("--no-ocr", action="store_true", help="Disable OCR, use basic text extraction")
    
    args = parser.parse_args()
    
    if not args.pdf_file.exists():
        print(f"Error: File not found: {args.pdf_file}")
        sys.exit(1)
    
    # Default output path
    if not args.output:
        args.output = args.pdf_file.parent / f"{args.pdf_file.stem}_image.md"
    
    # Convert
    converter = PDFToImageMarkdown(args.pdf_file, use_ocr=not args.no_ocr)
    converter.convert(args.output, dpi=args.dpi)
    
    print("\n" + "=" * 60)
    print("✅ Conversion complete!")
    print("=" * 60)
    print(f"\nOutput: {args.output}")
    print(f"Images: {args.output.parent / f'{args.output.stem}_pages'}/")


if __name__ == "__main__":
    main()
