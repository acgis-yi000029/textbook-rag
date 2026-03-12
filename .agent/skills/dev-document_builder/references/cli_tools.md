# Command-Line PDF Tools Reference

Complete reference for command-line PDF processing tools.

## Installation

### Linux (Debian/Ubuntu)

```bash
sudo apt-get install poppler-utils qpdf
```

### macOS

```bash
brew install poppler qpdf
```

### Windows

Download from:

- Poppler: https://github.com/oschwartz10612/poppler-windows/releases
- qpdf: https://github.com/qpdf/qpdf/releases

---

## pdftotext - Text Extraction

### Basic Usage

```bash
# Extract all text
pdftotext input.pdf output.txt

# Preserve layout
pdftotext -layout input.pdf output.txt

# Extract specific pages
pdftotext -f 1 -l 5 input.pdf output.txt  # Pages 1-5

# Extract to stdout
pdftotext input.pdf -
```

### Advanced Options

```bash
# Extract with bounding box coordinates (XML format)
pdftotext -bbox-layout document.pdf output.xml

# Set encoding
pdftotext -enc UTF-8 input.pdf output.txt

# Extract raw text (no layout)
pdftotext -raw input.pdf output.txt

# Fixed line length
pdftotext -fixed 80 input.pdf output.txt

# Crop pages (left, top, width, height in pixels)
pdftotext -x 50 -y 50 -W 500 -H 700 input.pdf output.txt
```

### Common Options

| Option          | Description                             |
| --------------- | --------------------------------------- |
| `-f <int>`      | First page to extract                   |
| `-l <int>`      | Last page to extract                    |
| `-layout`       | Maintain original layout                |
| `-raw`          | Keep text in content stream order       |
| `-fixed <int>`  | Fixed line length                       |
| `-enc <string>` | Output encoding (UTF-8, Latin1, etc.)   |
| `-eol <string>` | End-of-line convention (unix, dos, mac) |
| `-nopgbrk`      | Don't insert page breaks                |
| `-bbox-layout`  | Output bounding box info as XML         |

---

## qpdf - PDF Manipulation

### Merge PDFs

```bash
# Merge multiple PDFs
qpdf --empty --pages file1.pdf file2.pdf file3.pdf -- merged.pdf

# Merge specific pages from multiple PDFs
qpdf --empty --pages doc1.pdf 1-3 doc2.pdf 5-7 doc3.pdf 2,4 -- combined.pdf

# Merge with page ranges
qpdf --empty --pages input.pdf 1-10,15-20 -- selected.pdf
```

### Split PDFs

```bash
# Split into individual pages
qpdf input.pdf --split-pages output_%02d.pdf

# Split into groups of N pages
qpdf --split-pages=3 input.pdf output_group_%02d.pdf

# Extract specific pages
qpdf input.pdf --pages . 1-5 -- pages1-5.pdf
qpdf input.pdf --pages . 6-10 -- pages6-10.pdf

# Extract odd/even pages
qpdf input.pdf --pages . 1,3,5,7,9 -- odd_pages.pdf
```

### Rotate Pages

```bash
# Rotate all pages 90 degrees clockwise
qpdf input.pdf output.pdf --rotate=+90

# Rotate specific pages
qpdf input.pdf output.pdf --rotate=+90:1  # Rotate page 1
qpdf input.pdf output.pdf --rotate=+90:1-5  # Rotate pages 1-5
qpdf input.pdf output.pdf --rotate=+180:2,4,6  # Rotate specific pages

# Rotate counterclockwise
qpdf input.pdf output.pdf --rotate=-90
```

### Password and Encryption

```bash
# Remove password
qpdf --password=mypassword --decrypt encrypted.pdf decrypted.pdf

# Add password protection
qpdf --encrypt user_pass owner_pass 256 -- input.pdf encrypted.pdf

# Add password with specific permissions
qpdf --encrypt user_pass owner_pass 256 \
  --print=none \
  --modify=none \
  --extract=n \
  -- input.pdf encrypted.pdf

# Check encryption status
qpdf --show-encryption encrypted.pdf
```

### Optimization

```bash
# Linearize for web (fast web view)
qpdf --linearize input.pdf optimized.pdf

# Compress streams
qpdf --compress-streams=y input.pdf compressed.pdf

# Remove unused objects
qpdf --optimize-level=all input.pdf optimized.pdf

# Recompress images
qpdf --recompress-flate input.pdf recompressed.pdf
```

### Repair and Validation

```bash
# Check PDF structure
qpdf --check input.pdf

# Attempt to repair corrupted PDF
qpdf --fix-qdf damaged.pdf repaired.pdf

# Show PDF structure (for debugging)
qpdf --show-pages input.pdf
qpdf --show-object=1 input.pdf
qpdf --show-xref input.pdf
```

### Common Options

| Option          | Description               |
| --------------- | ------------------------- |
| `--empty`       | Start with empty PDF      |
| `--pages`       | Specify pages to include  |
| `--rotate`      | Rotate pages              |
| `--split-pages` | Split into separate files |
| `--linearize`   | Optimize for web          |
| `--encrypt`     | Add password protection   |
| `--decrypt`     | Remove password           |
| `--check`       | Validate PDF structure    |

---

## pdftoppm - Convert to Images

### Basic Usage

```bash
# Convert all pages to PNG
pdftoppm -png input.pdf output_prefix

# Convert to JPEG
pdftoppm -jpeg input.pdf output_prefix

# Convert to TIFF
pdftoppm -tiff input.pdf output_prefix
```

### Resolution and Quality

```bash
# High resolution (300 DPI)
pdftoppm -png -r 300 input.pdf high_res

# Very high resolution (600 DPI)
pdftoppm -png -r 600 input.pdf very_high_res

# JPEG with quality setting
pdftoppm -jpeg -jpegopt quality=95 -r 200 input.pdf quality_output

# Grayscale output
pdftoppm -gray -png input.pdf grayscale
```

### Page Selection

```bash
# Convert specific pages
pdftoppm -png -f 1 -l 5 input.pdf pages1-5

# Convert single page
pdftoppm -png -f 3 -l 3 -singlefile input.pdf page3

# Convert first page only
pdftoppm -png -f 1 -l 1 -singlefile input.pdf first_page
```

### Size and Cropping

```bash
# Scale to specific width (maintains aspect ratio)
pdftoppm -png -scale-to-x 1920 -scale-to-y -1 input.pdf scaled

# Scale to specific height
pdftoppm -png -scale-to-x -1 -scale-to-y 1080 input.pdf scaled

# Crop pages (x, y, width, height)
pdftoppm -png -x 100 -y 100 -W 500 -H 700 input.pdf cropped
```

### Common Options

| Option                   | Description                          |
| ------------------------ | ------------------------------------ |
| `-png`                   | Output PNG format                    |
| `-jpeg`                  | Output JPEG format                   |
| `-tiff`                  | Output TIFF format                   |
| `-r <int>`               | Resolution in DPI (default: 150)     |
| `-f <int>`               | First page to convert                |
| `-l <int>`               | Last page to convert                 |
| `-singlefile`            | Write single file (not one per page) |
| `-gray`                  | Grayscale output                     |
| `-mono`                  | Monochrome output                    |
| `-jpegopt quality=<int>` | JPEG quality (0-100)                 |

---

## pdfimages - Extract Images

### Basic Usage

```bash
# Extract all images
pdfimages input.pdf output_prefix

# Extract as JPEG
pdfimages -j input.pdf output_prefix

# Extract all formats
pdfimages -all input.pdf output_prefix
```

### Image Formats

```bash
# Extract as PNG
pdfimages -png input.pdf output_prefix

# Extract as TIFF
pdfimages -tiff input.pdf output_prefix

# Extract in original format
pdfimages -all input.pdf output_prefix
```

### Page Selection

```bash
# Extract from specific pages
pdfimages -f 1 -l 5 input.pdf pages1-5

# Extract from single page
pdfimages -f 3 -l 3 input.pdf page3
```

### Information

```bash
# List images without extracting
pdfimages -list input.pdf

# Output shows: page, num, type, width, height, color, comp, bpc, enc, interp, object, ID
```

### Common Options

| Option     | Description                     |
| ---------- | ------------------------------- |
| `-j`       | Extract as JPEG                 |
| `-png`     | Extract as PNG                  |
| `-tiff`    | Extract as TIFF                 |
| `-all`     | Extract in original format      |
| `-f <int>` | First page                      |
| `-l <int>` | Last page                       |
| `-list`    | List images without extracting  |
| `-p`       | Include page number in filename |

---

## pdfinfo - PDF Information

```bash
# Show PDF metadata
pdfinfo input.pdf

# Show detailed info
pdfinfo -meta input.pdf

# Show box information
pdfinfo -box input.pdf

# Show structure
pdfinfo -struct input.pdf
```

---

## pdftk (Alternative Tool)

If available, pdftk provides similar functionality:

```bash
# Merge PDFs
pdftk file1.pdf file2.pdf cat output merged.pdf

# Split PDF
pdftk input.pdf burst

# Rotate pages
pdftk input.pdf rotate 1east output rotated.pdf

# Extract pages
pdftk input.pdf cat 1-5 output pages1-5.pdf

# Add password
pdftk input.pdf output encrypted.pdf user_pw mypassword
```

---

## Performance Comparison

| Task              | Fastest Tool | Notes                             |
| ----------------- | ------------ | --------------------------------- |
| Text extraction   | `pdftotext`  | Much faster than Python           |
| Merge PDFs        | `qpdf`       | Faster than pypdf for large files |
| Split PDFs        | `qpdf`       | Very efficient                    |
| Convert to images | `pdftoppm`   | Faster than pdf2image             |
| Extract images    | `pdfimages`  | Preserves original quality        |
| Repair PDF        | `qpdf`       | Best repair capabilities          |

---

## Batch Processing Examples

### Extract text from all PDFs in directory

```bash
for file in *.pdf; do
    pdftotext -layout "$file" "${file%.pdf}.txt"
done
```

### Convert all PDFs to images

```bash
for file in *.pdf; do
    pdftoppm -png -r 300 "$file" "${file%.pdf}"
done
```

### Merge all PDFs in directory

```bash
qpdf --empty --pages *.pdf -- merged_all.pdf
```

### Extract images from all PDFs

```bash
for file in *.pdf; do
    mkdir -p "${file%.pdf}_images"
    pdfimages -all "$file" "${file%.pdf}_images/img"
done
```

---

## Troubleshooting

### pdftotext produces garbled text

- Try `-layout` or `-raw` option
- Check encoding with `-enc UTF-8`
- PDF might be scanned (use OCR instead)

### qpdf fails with "damaged PDF"

- Try `qpdf --check` to see specific errors
- Use `qpdf --fix-qdf` to attempt repair
- May need to recreate PDF from source

### pdftoppm produces blank images

- Check if PDF has actual content (not just scanned)
- Try different resolution with `-r`
- Verify PDF isn't password protected

### pdfimages extracts no images

- Use `-list` to see if images exist
- Try `-all` to extract in original format
- Images might be vector graphics (not extractable)

---

## Integration with Python

### Call from Python

```python
import subprocess

# Extract text
subprocess.run(['pdftotext', '-layout', 'input.pdf', 'output.txt'])

# Merge PDFs
subprocess.run(['qpdf', '--empty', '--pages', 'file1.pdf', 'file2.pdf', '--', 'merged.pdf'])

# Convert to images
subprocess.run(['pdftoppm', '-png', '-r', '300', 'input.pdf', 'output'])

# Extract images
subprocess.run(['pdfimages', '-all', 'input.pdf', 'images/img'])
```

### Check if tools are available

```python
import shutil

def check_pdf_tools():
    tools = {
        'pdftotext': shutil.which('pdftotext'),
        'qpdf': shutil.which('qpdf'),
        'pdftoppm': shutil.which('pdftoppm'),
        'pdfimages': shutil.which('pdfimages')
    }

    for tool, path in tools.items():
        if path:
            print(f"✓ {tool}: {path}")
        else:
            print(f"✗ {tool}: not found")

    return all(tools.values())
```
