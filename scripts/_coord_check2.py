"""Check if content_list bbox matches model.json layout_dets coordinates."""
import json
import pathlib

book = "cormen_CLRS"
base = pathlib.Path(f"data/mineru_output/{book}/{book}/auto")

mdl = json.loads((base / f"{book}_model.json").read_text(encoding="utf-8"))
mid = json.loads((base / f"{book}_middle.json").read_text(encoding="utf-8"))
cl = json.loads((base / f"{book}_content_list.json").read_text(encoding="utf-8"))

pi = mdl[0]["page_info"]
ps = mid["pdf_info"][0]["page_size"]
mw, mh = pi["width"], pi["height"]

print(f"model page 0: {mw} x {mh}")
print(f"pdf page_size: {ps[0]} x {ps[1]}")
print()

# model layout_dets
dets = mdl[0].get("layout_dets", [])
print(f"model layout_dets ({len(dets)} items):")
for i, d in enumerate(dets[:8]):
    cat = d.get("category_id", "?")
    bb = d.get("bbox", d.get("poly", []))
    if isinstance(bb, list) and len(bb) >= 4:
        print(f"  [{i}] cat={cat} bbox=[{bb[0]:.1f}, {bb[1]:.1f}, {bb[2]:.1f}, {bb[3]:.1f}]"
              f"  /model: x1={bb[2]/mw:.3f} y1={bb[3]/mh:.3f}")

print()

# content_list page 0
p0 = [it for it in cl if it.get("page_idx") == 0]
print(f"content_list page 0 ({len(p0)} items):")
for i, it in enumerate(p0[:8]):
    bb = it.get("bbox", [])
    tp = it.get("type", "?")
    txt = it.get("text", "")[:50]
    if len(bb) >= 4:
        print(f"  [{i}] type={tp} bbox=[{bb[0]:.1f}, {bb[1]:.1f}, {bb[2]:.1f}, {bb[3]:.1f}]"
              f"  /model: x1={bb[2]/mw:.3f} y1={bb[3]/mh:.3f}"
              f"  text={txt!r}")

print()

# middle para_blocks page 0
blocks = mid["pdf_info"][0].get("para_blocks", [])
print(f"middle para_blocks page 0 ({len(blocks)} items):")
for i, b in enumerate(blocks[:8]):
    bb = b.get("bbox", [])
    tp = b.get("type", "?")
    # Get text from lines
    lines = b.get("lines", [])
    txt = ""
    for ln in lines[:1]:
        for sp in ln.get("spans", []):
            txt += sp.get("content", "")[:50]
    if len(bb) >= 4:
        print(f"  [{i}] type={tp} bbox=[{bb[0]:.1f}, {bb[1]:.1f}, {bb[2]:.1f}, {bb[3]:.1f}]"
              f"  /pdf: x1={bb[2]/ps[0]:.3f} y1={bb[3]/ps[1]:.3f}"
              f"  text={txt[:50]!r}")
