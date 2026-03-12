import sqlite3
from pathlib import Path

DB = Path(__file__).parent.parent / "data" / "textbook_rag.sqlite3"
conn = sqlite3.connect(str(DB))

total_books = conn.execute("SELECT COUNT(*) FROM books").fetchone()[0]
total_chunks = conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]

ecdev_books = conn.execute("SELECT COUNT(*) FROM books WHERE book_id LIKE 'ed_update%'").fetchone()[0]
re_books = conn.execute("SELECT COUNT(*) FROM books WHERE book_id LIKE 'oreb%'").fetchone()[0]
tb_books = total_books - ecdev_books - re_books

print(f"Total books : {total_books}  (textbook={tb_books}, ecdev={ecdev_books}, real_estate={re_books})")
print(f"Total chunks: {total_chunks:,}")
print(f"Total pages : {conn.execute('SELECT COUNT(*) FROM pages').fetchone()[0]:,}")

# Sample ecdev
print("\nSample ecdev books:")
rows = conn.execute("SELECT book_id, title, chunk_count FROM books WHERE book_id LIKE 'ed_update%' ORDER BY book_id LIMIT 5").fetchall()
for r in rows:
    print(f"  {r[0]:35s} | {r[1]:40s} | {r[2]} chunks")

# Sample real_estate
print("\nSample real_estate books:")
rows = conn.execute("SELECT book_id, title, chunk_count FROM books WHERE book_id LIKE 'oreb%'").fetchall()
for r in rows:
    print(f"  {r[0]:35s} | {r[1]:40s} | {r[2]} chunks")

conn.close()
