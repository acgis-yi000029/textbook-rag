"""Check payload.db contents — find book-related tables and data."""

import sqlite3
from pathlib import Path

DB = Path(__file__).parent.parent / "data" / "payload.db"
conn = sqlite3.connect(str(DB))
conn.row_factory = sqlite3.Row

tables = [t[0] for t in conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()]
print(f"Tables ({len(tables)}):")
for t in tables:
    count = conn.execute(f'SELECT count(*) FROM "{t}"').fetchone()[0]
    if count > 0:
        print(f"  {t}: {count} rows")

# Check for book-related tables
for t in tables:
    if "book" in t.lower() or "textbook" in t.lower():
        print(f"\n--- {t} (sample) ---")
        rows = conn.execute(f'SELECT * FROM "{t}" LIMIT 3').fetchall()
        for r in rows:
            print(dict(r))

conn.close()
