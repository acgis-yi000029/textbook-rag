"""Quick check: bbox coordinate ratio vs page dimensions."""
import sqlite3

db = sqlite3.connect("data/textbook_rag.sqlite3")
db.row_factory = sqlite3.Row

rows = db.execute("""
    SELECT b.book_id, p.width, p.height,
           MAX(sl.x1) as max_x1, MAX(sl.y1) as max_y1
    FROM source_locators sl
    JOIN pages p ON p.id=sl.page_id
    JOIN chunks c ON c.id=sl.chunk_id
    JOIN books b ON b.id=c.book_id
    GROUP BY b.id
    LIMIT 8
""").fetchall()

for r in rows:
    d = dict(r)
    bid = d["book_id"][:35]
    pw, ph = d["width"], d["height"]
    mx, my = d["max_x1"], d["max_y1"]
    rx = mx / pw if pw else 0
    ry = my / ph if ph else 0
    print(f"{bid:35s} page={pw}x{ph}  max_bbox=({mx:.0f},{my:.0f})  ratio=({rx:.2f},{ry:.2f})")
