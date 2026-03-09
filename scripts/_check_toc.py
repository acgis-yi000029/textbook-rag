"""One-off script to check which books have TOC entries."""
import sqlite3

conn = sqlite3.connect("data/textbook_rag.sqlite3")
conn.row_factory = sqlite3.Row

rows = conn.execute(
    "SELECT b.id, b.book_id, b.title, COUNT(t.id) as toc_count "
    "FROM books b LEFT JOIN toc_entries t ON t.book_id = b.id "
    "GROUP BY b.id ORDER BY toc_count DESC"
).fetchall()

for r in rows:
    tag = "✓" if r["toc_count"] > 0 else "✗"
    print(f'{tag} id={r["id"]:3d} toc={r["toc_count"]:4d}  {r["title"][:55]}')

conn.close()
