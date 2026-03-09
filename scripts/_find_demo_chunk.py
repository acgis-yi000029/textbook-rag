"""Find good demo chunks in the HTTP book with bbox data."""
import sqlite3

conn = sqlite3.connect("data/textbook_rag.sqlite3")
conn.row_factory = sqlite3.Row

# Find chunks about HTTP methods or status codes with bbox
rows = conn.execute(
    """
    SELECT c.id, c.chunk_id, c.book_id, c.chapter_id, c.primary_page_id,
           substr(c.text, 1, 300) as text_preview,
           length(c.text) as text_len,
           sl.x0, sl.y0, sl.x1, sl.y1, sl.page_id,
           p.page_number,
           ch.title as chapter_title
    FROM chunks c
    JOIN source_locators sl ON sl.chunk_id = c.id
    JOIN pages p ON p.id = sl.page_id
    LEFT JOIN chapters ch ON ch.id = c.chapter_id
    WHERE c.book_id = 24 AND c.content_type = 'text'
      AND p.page_number BETWEEN 30 AND 100
      AND length(c.text) BETWEEN 150 AND 600
    ORDER BY p.page_number, c.reading_order
    LIMIT 20
    """,
).fetchall()

for r in rows:
    print("---")
    print(f'chunk_id={r["chunk_id"]}, page={r["page_number"]}')
    print(f'chapter: {r["chapter_title"]}')
    print(f'bbox=({r["x0"]:.1f}, {r["y0"]:.1f}, {r["x1"]:.1f}, {r["y1"]:.1f})')
    print(f'text: {r["text_preview"][:200]}')

conn.close()
