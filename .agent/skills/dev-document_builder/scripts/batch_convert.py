#!/usr/bin/env python3
"""
Batch convert DOCX files to Markdown.

Usage:
    python batch_convert.py <input_dir> [output_dir]
    python batch_convert.py ./docs ./markdown
"""

import sys
import subprocess
from pathlib import Path


def batch_convert(input_dir: Path, output_dir: Path = None):
    """
    Convert all DOCX files in directory to Markdown.
    
    Args:
        input_dir: Directory containing DOCX files
        output_dir: Output directory (default: input_dir/markdown)
    """
    if not input_dir.exists():
        print(f"✗ Directory not found: {input_dir}")
        sys.exit(1)
    
    if output_dir is None:
        output_dir = input_dir / 'markdown'
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Find all DOCX files
    docx_files = [f for f in input_dir.glob('*.docx') if not f.name.startswith('~$')]
    
    if not docx_files:
        print(f"✗ No DOCX files found in {input_dir}")
        sys.exit(1)
    
    print(f"Found {len(docx_files)} DOCX files")
    print(f"Output directory: {output_dir}")
    print()
    
    success_count = 0
    failed_count = 0
    
    for docx_file in docx_files:
        md_file = output_dir / f"{docx_file.stem}.md"
        images_dir = output_dir / 'images'
        
        print(f"Converting: {docx_file.name}...", end=' ')
        
        try:
            subprocess.run([
                'pandoc',
                str(docx_file),
                '-o', str(md_file),
                '--wrap=none',
                '--atx-headers',
                '--extract-media', str(images_dir)
            ], check=True, capture_output=True)
            
            # Fix image paths
            content = md_file.read_text(encoding='utf-8')
            content = content.replace('](media/', '](images/')
            md_file.write_text(content, encoding='utf-8')
            
            print("✓")
            success_count += 1
            
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed")
            failed_count += 1
        except Exception as e:
            print(f"✗ Error: {e}")
            failed_count += 1
    
    print()
    print("=" * 60)
    print(f"Conversion complete!")
    print(f"  Success: {success_count}")
    print(f"  Failed: {failed_count}")
    print(f"  Output: {output_dir}")
    print("=" * 60)


def main():
    if len(sys.argv) < 2:
        print("Usage: python batch_convert.py <input_dir> [output_dir]")
        print("Example: python batch_convert.py ./docs ./markdown")
        sys.exit(1)
    
    input_dir = Path(sys.argv[1])
    output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    
    batch_convert(input_dir, output_dir)


if __name__ == '__main__':
    main()
