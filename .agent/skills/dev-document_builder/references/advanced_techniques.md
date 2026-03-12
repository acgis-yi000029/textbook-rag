# Advanced PDF Processing Techniques

## Password Protection

### Encrypt PDF

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("input.pdf")
writer = PdfWriter()

for page in reader.pages:
    writer.add_page(page)

# Add password
writer.encrypt("userpassword", "ownerpassword")

with open("encrypted.pdf", "wb") as output:
    writer.write(output)
```

### Decrypt PDF

```python
from pypdf import PdfReader

try:
    reader = PdfReader("encrypted.pdf")
    if reader.is_encrypted:
        reader.decrypt("password")
        text = reader.pages[0].extract_text()
except Exception as e:
    print(f"Failed to decrypt: {e}")
```

## Add Watermark

```python
from pypdf import PdfReader, PdfWriter

# Create or load watermark
watermark = PdfReader("watermark.pdf").pages[0]

# Apply to all pages
reader = PdfReader("document.pdf")
writer = PdfWriter()

for page in reader.pages:
    page.merge_page(watermark)
    writer.add_page(page)

with open("watermarked.pdf", "wb") as output:
    writer.write(output)
```

## Batch Processing with Error Handling

```python
import glob
import logging
from pypdf import PdfReader, PdfWriter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def batch_merge_pdfs(input_dir):
    """Merge all PDFs in a directory with error handling"""
    pdf_files = glob.glob(f"{input_dir}/*.pdf")
    writer = PdfWriter()

    for pdf_file in pdf_files:
        try:
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                writer.add_page(page)
            logger.info(f"Processed: {pdf_file}")
        except Exception as e:
            logger.error(f"Failed: {pdf_file} - {e}")
            continue

    with open("batch_merged.pdf", "wb") as output:
        writer.write(output)

def batch_extract_text(input_dir, output_dir):
    """Extract text from all PDFs in a directory"""
    pdf_files = glob.glob(f"{input_dir}/*.pdf")

    for pdf_file in pdf_files:
        try:
            reader = PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()

            output_file = f"{output_dir}/{Path(pdf_file).stem}.txt"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(text)
            logger.info(f"Extracted: {pdf_file}")
        except Exception as e:
            logger.error(f"Failed: {pdf_file} - {e}")
```

## Extract Metadata

```python
from pypdf import PdfReader

reader = PdfReader("document.pdf")
meta = reader.metadata

print(f"Title: {meta.title}")
print(f"Author: {meta.author}")
print(f"Subject: {meta.subject}")
print(f"Creator: {meta.creator}")
print(f"Producer: {meta.producer}")
print(f"Creation Date: {meta.creation_date}")
print(f"Modification Date: {meta.modification_date}")
```

## Advanced Table Extraction

### Custom Table Settings

```python
import pdfplumber

with pdfplumber.open("complex_table.pdf") as pdf:
    page = pdf.pages[0]

    # Custom settings for complex layouts
    table_settings = {
        "vertical_strategy": "lines",      # or "text", "lines_strict"
        "horizontal_strategy": "lines",    # or "text", "lines_strict"
        "snap_tolerance": 3,               # Pixel tolerance for line alignment
        "intersection_tolerance": 15,      # Tolerance for line intersections
        "join_tolerance": 3,               # Tolerance for joining lines
        "edge_min_length": 3,              # Minimum line length
    }

    tables = page.extract_tables(table_settings)

    for table in tables:
        for row in table:
            print(row)
```

### Visual Debugging for Tables

```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    page = pdf.pages[0]

    # Create debug image showing detected table structure
    img = page.to_image(resolution=150)
    img.debug_tablefinder()
    img.save("debug_table_detection.png")
```

## Professional Reports with reportlab

### Multi-Page Report with Tables

```python
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter

doc = SimpleDocTemplate("professional_report.pdf", pagesize=letter)
elements = []
styles = getSampleStyleSheet()

# Title
title = Paragraph("Quarterly Sales Report", styles['Title'])
elements.append(title)
elements.append(Spacer(1, 12))

# Introduction
intro = Paragraph("This report summarizes Q1-Q4 performance.", styles['Normal'])
elements.append(intro)
elements.append(Spacer(1, 12))

# Data table
data = [
    ['Product', 'Q1', 'Q2', 'Q3', 'Q4', 'Total'],
    ['Widgets', '120', '135', '142', '158', '555'],
    ['Gadgets', '85', '92', '98', '105', '380'],
    ['Tools', '67', '73', '81', '89', '310'],
    ['Total', '272', '300', '321', '352', '1245']
]

table = Table(data)
table.setStyle(TableStyle([
    # Header row
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 14),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

    # Data rows
    ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
    ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -1), 12),

    # Total row
    ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),

    # Grid
    ('GRID', (0, 0), (-1, -1), 1, colors.black)
]))

elements.append(table)
elements.append(PageBreak())

# Page 2
elements.append(Paragraph("Analysis", styles['Heading1']))
elements.append(Paragraph("Key findings from the data...", styles['Normal']))

doc.build(elements)
```

## Memory Management for Large PDFs

### Process in Chunks

```python
from pypdf import PdfReader, PdfWriter

def process_large_pdf(pdf_path, chunk_size=10):
    """Process large PDF in chunks to manage memory"""
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)

    for start_idx in range(0, total_pages, chunk_size):
        end_idx = min(start_idx + chunk_size, total_pages)
        writer = PdfWriter()

        for i in range(start_idx, end_idx):
            writer.add_page(reader.pages[i])

        chunk_filename = f"chunk_{start_idx//chunk_size + 1}.pdf"
        with open(chunk_filename, "wb") as output:
            writer.write(output)

        print(f"Created {chunk_filename} (pages {start_idx+1}-{end_idx})")
```

### Stream Processing

```python
def stream_extract_text(pdf_path):
    """Extract text page by page without loading entire PDF"""
    reader = PdfReader(pdf_path)

    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        # Process text immediately
        yield i, text
        # Page is garbage collected after processing

# Usage
for page_num, text in stream_extract_text("large.pdf"):
    print(f"Page {page_num}: {len(text)} characters")
```

## Performance Tips

1. **For large PDFs:** Use command-line tools (`qpdf`, `pdftotext`) - they're faster
2. **For text extraction:** `pdftotext -bbox-layout` is fastest for plain text
3. **For image extraction:** `pdfimages` is much faster than rendering pages
4. **For batch processing:** Process in chunks to manage memory
5. **For scanned PDFs:** Use OCR only when necessary (it's slow)

## Troubleshooting

### Corrupted PDFs

```bash
# Use qpdf to repair
qpdf --check corrupted.pdf
qpdf --replace-input corrupted.pdf
```

### Text Extraction Issues

```python
# Fallback to OCR for scanned PDFs
import pytesseract
from pdf2image import convert_from_path

def extract_text_with_ocr(pdf_path):
    images = convert_from_path(pdf_path)
    text = ""
    for image in images:
        text += pytesseract.image_to_string(image)
    return text
```

### Handling Different Encodings

```python
from pypdf import PdfReader

reader = PdfReader("document.pdf")
for page in reader.pages:
    try:
        text = page.extract_text()
    except UnicodeDecodeError:
        # Try different encoding
        text = page.extract_text(encoding='latin-1')
```

## Advanced Image Extraction

### Filter Images by Size

```python
import fitz  # PyMuPDF

def extract_large_images(pdf_path, min_width=200, min_height=150, min_size_kb=20):
    """Extract only meaningful images (filter out icons/logos)"""
    pdf_document = fitz.open(pdf_path)

    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]
        image_list = page.get_images()

        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = pdf_document.extract_image(xref)

            # Filter by dimensions
            if base_image["width"] < min_width or base_image["height"] < min_height:
                continue

            # Filter by file size
            if len(base_image["image"]) < min_size_kb * 1024:
                continue

            # Save image
            filename = f"page{page_num+1}_img{img_index+1}.{base_image['ext']}"
            with open(filename, "wb") as f:
                f.write(base_image["image"])

            print(f"Extracted: {filename} ({base_image['width']}x{base_image['height']})")
```

## Rotate and Crop Pages

### Rotate Pages

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("input.pdf")
writer = PdfWriter()

for page in reader.pages:
    page.rotate(90)  # Rotate 90 degrees clockwise
    writer.add_page(page)

with open("rotated.pdf", "wb") as output:
    writer.write(output)
```

### Crop Pages

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("input.pdf")
writer = PdfWriter()

page = reader.pages[0]

# Crop page (left, bottom, right, top in points)
page.mediabox.left = 50
page.mediabox.bottom = 50
page.mediabox.right = 550
page.mediabox.top = 750

writer.add_page(page)

with open("cropped.pdf", "wb") as output:
    writer.write(output)
```
