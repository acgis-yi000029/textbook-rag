"""One-off script to compare coordinate systems across MinerU output files."""
import json
import pathlib

book = "cormen_CLRS"
base = pathlib.Path(f"data/mineru_output/{book}/{book}/auto")

# --- middle.json ---
mid = json.loads((base / f"{book}_middle.json").read_text(encoding="utf-8"))
page0 = mid["pdf_info"][0]
ps = page0["page_size"]  # [w, h]
blocks = page0.get("para_blocks", [])

print("=" * 60)
print("middle.json  page 0")
print(f"  page_size (PDF pts): {ps[0]} x {ps[1]}")
print(f"  para_blocks count : {len(blocks)}")
for i, b in enumerate(blocks[:6]):
    bb = b.get("bbox")
    pct_x = bb[2] / ps[0] if bb else None
    pct_y = bb[3] / ps[1] if bb else None
    print(f"  [{i}] bbox={bb}  x1%={pct_x:.2%}  y1%={pct_y:.2%}")

# --- content_list.json ---
cl = json.loads((base / f"{book}_content_list.json").read_text(encoding="utf-8"))
page0_items = [it for it in cl if it.get("page_idx") == 0]

print()
print("content_list.json  page 0")
print(f"  total items on page 0: {len(page0_items)}")
for i, it in enumerate(page0_items[:6]):
    bb = it.get("bbox")
    pct_x = bb[2] / ps[0] if bb else None
    pct_y = bb[3] / ps[1] if bb else None
    print(f"  [{i}] bbox={bb}  x1/pw={pct_x:.2%}  y1/ph={pct_y:.2%}")

# --- model.json ---
mdl_path = base / f"{book}_model.json"
if mdl_path.exists():
    mdl = json.loads(mdl_path.read_text(encoding="utf-8"))
    pi = mdl[0].get("page_info", {})
    mw, mh = pi.get("w", 0), pi.get("h", 0)
    print()
    print("model.json  page 0")
    print(f"  page_info: {mw} x {mh}")
    print(f"  ratio to PDF pts: x={mw/ps[0]:.3f}  y={mh/ps[1]:.3f}")

    # Check if content_list bbox matches model coords
    if page0_items:
        bb = page0_items[0]["bbox"]
        print(f"  content_list[0] bbox x1/model_w = {bb[2]/mw:.2%}")
        print(f"  content_list[0] bbox y1/model_h = {bb[3]/mh:.2%}")

# --- Also check middle.json para_blocks bbox vs model space ---
print()
print("=" * 60)
print("Summary ratios (page 0, block/item 0)")
if blocks:
    mb = blocks[0]["bbox"]
    print(f"  middle  bbox: {mb}")
    print(f"    / page_size: x={mb[2]/ps[0]:.3f}  y={mb[3]/ps[1]:.3f}")
    if mdl_path.exists():
        print(f"    / model_dim: x={mb[2]/mw:.3f}  y={mb[3]/mh:.3f}")
if page0_items:
    cb = page0_items[0]["bbox"]
    print(f"  c_list  bbox: {cb}")
    print(f"    / page_size: x={cb[2]/ps[0]:.3f}  y={cb[3]/ps[1]:.3f}")
    if mdl_path.exists():
        print(f"    / model_dim: x={cb[2]/mw:.3f}  y={cb[3]/mh:.3f}")
