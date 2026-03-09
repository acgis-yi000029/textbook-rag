"""Find rich demo data from HTTP book for hardcoded demo."""
import sqlite3, json

conn = sqlite3.connect("data/textbook_rag.sqlite3")
conn.row_factory = sqlite3.Row

# Get book info
book = dict(conn.execute("SELECT * FROM books WHERE id = 24").fetchone())
print("BOOK:", json.dumps(book, indent=2))

# Get chapters
chapters = conn.execute("SELECT id, chapter_key, title FROM chapters WHERE book_id = 24 ORDER BY id LIMIT 20").fetchall()
print("\nCHAPTERS:")
for ch in chapters:
    print(f"  id={ch['id']} key={ch['chapter_key']} title={ch['title'][:60]}")

# Good chunks about TCP connections (pages 30-33)
target_ids = [
    "gourley_http_definitive_guide_000192",  # header fields
    "gourley_http_definitive_guide_000193",  # message body
    "gourley_http_definitive_guide_000196",  # GET method
    "gourley_http_definitive_guide_000197",  # response message
    "gourley_http_definitive_guide_000201",  # HTTP app layer
    "gourley_http_definitive_guide_000207",  # TCP reliability
    "gourley_http_definitive_guide_000211",  # TCP/IP connection
    "gourley_http_definitive_guide_000221",  # steps a-h
]

print("\n\nDETAILED CHUNKS:")
for cid in target_ids:
    row = conn.execute(
        "SELECT c.id, c.chunk_id, c.book_id, c.chapter_id, c.primary_page_id, c.text, c.chroma_document_id "
        "FROM chunks c WHERE c.chunk_id = ?", (cid,)
    ).fetchone()
    if not row:
        print(f"  NOT FOUND: {cid}")
        continue

    locs = conn.execute(
        "SELECT sl.*, p.page_number FROM source_locators sl JOIN pages p ON p.id = sl.page_id WHERE sl.chunk_id = ?",
        (row['id'],)
    ).fetchall()

    print(f"\n--- {cid} ---")
    print(f"  db_id={row['id']}, chapter_id={row['chapter_id']}, page_id={row['primary_page_id']}")
    print(f"  chroma_doc_id={row['chroma_document_id']}")
    print(f"  text ({len(row['text'])} chars): {row['text'][:300]}")
    for loc in locs:
        print(f"  bbox: page={loc['page_number']} ({loc['x0']:.1f}, {loc['y0']:.1f}, {loc['x1']:.1f}, {loc['y1']:.1f})")

# Also get page dimensions for these pages
print("\n\nPAGE DIMENSIONS:")
pages = conn.execute(
    "SELECT id, page_number, width, height FROM pages WHERE book_id = 24 AND page_number BETWEEN 29 AND 34 ORDER BY page_number"
).fetchall()
for p in pages:
    print(f"  page {p['page_number']}: {p['width']}x{p['height']} (id={p['id']})")

conn.close()
