#!/usr/bin/env python3
"""
Convert DOCX to Markdown with image extraction.

Usage:
    python convert_docx.py input.docx output.md
    python convert_docx.py input.docx  # Auto-generate output name
"""

import sys
import subprocess
from pathlib import Path


def convert_docx_to_md(docx_path: Path, md_path: Path = None, extract_images: bool = True):
    """
    Convert DOCX to Markdown using pandoc.
    
    Args:
        docx_path: Path to input DOCX file
        md_path: Path to output MD file (optional)
        extract_images: Whether to extract images
    """
    if not docx_path.exists():
        print(f"✗ File not found: {docx_path}")
        sys.exit(1)
    
    # Auto-generate output path if not provided
    if md_path is None:
        md_path = docx_path.with_suffix('.md')
    
    md_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Build pandoc command
    cmd = [
        'pandoc',
        str(docx_path),
        '-o', str(md_path),
        '--wrap=none',
        '--atx-headers'
    ]
    
    if extract_images:
        images_dir = md_path.parent / 'images'
        cmd.extend(['--extract-media', str(images_dir)])
    
    print(f"Converting: {docx_path.name}")
    print(f"Output: {md_path}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        
        if extract_images:
            # Fix image paths
            content = md_path.read_text(encoding='utf-8')
            content = content.replace('](media/', '](images/')
            md_path.write_text(content, encoding='utf-8')
        
        print(f"✓ Conversion successful!")
        print(f"  Output: {md_path}")
        
        if extract_images and (md_path.parent / 'images').exists():
            image_count = len(list((md_path.parent / 'images').glob('*')))
            print(f"  Images extracted: {image_count}")
        
    except subprocess.CalledProcessError as e:
        print(f"✗ Conversion failed: {e}")
        if e.stderr:
            print(f"  Error: {e.stderr}")
        sys.exit(1)
    except FileNotFoundError:
        print("✗ Pandoc not found. Please install pandoc:")
        print("  Windows: choco install pandoc")
        print("  Mac: brew install pandoc")
        print("  Linux: sudo apt-get install pandoc")
        sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print("Usage: python convert_docx.py <input.docx> [output.md]")
        print("Example: python convert_docx.py Lab1_John.docx")
        sys.exit(1)
    
    docx_path = Path(sys.argv[1])
    md_path = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    
    convert_docx_to_md(docx_path, md_path)


if __name__ == '__main__':
    main()
