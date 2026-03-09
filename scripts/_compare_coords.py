"""Compare bbox coordinate systems: middle.json vs content_list.json."""
import json

mid_path = "data/mineru_output/lubanovic_fastapi_modern_web/lubanovic_fastapi_modern_web/auto/lubanovic_fastapi_modern_web_middle.json"
cl_path = "data/mineru_output/lubanovic_fastapi_modern_web/lubanovic_fastapi_modern_web/auto/lubanovic_fastapi_modern_web_content_list.json"

with open(mid_path, "r", encoding="utf-8") as f:
    mid = json.load(f)
with open(cl_path, "r", encoding="utf-8") as f:
    cl = json.load(f)

p0 = mid["pdf_info"][0]
ps = p0["page_size"]

print(f"page_size = {ps}")
print(f"page_size * 2 = [{ps[0]*2}, {ps[1]*2}]")
print()

# Manual pair matching: middle.json para_blocks vs content_list.json items on page 0
pairs = [
    ([34, 82, 292, 146], [67, 124, 579, 220], "FastAPI (title)"),
    ([33, 155, 352, 182], [65, 234, 698, 275], "Modern Python... (text)"),
    ([25, 216, 434, 590], [49, 326, 861, 892], "image"),
    ([328, 606, 469, 629], [650, 916, 930, 951], "Bill Lubanovic"),
]

print("middle.json vs content_list.json ratios:")
print("-" * 95)
for m, c, label in pairs:
    rx0 = c[0] / m[0] if m[0] else 0
    ry0 = c[1] / m[1] if m[1] else 0
    rx1 = c[2] / m[2] if m[2] else 0
    ry1 = c[3] / m[3] if m[3] else 0
    print(f"  {label:25s}  mid={m}  cl={c}")
    print(f"  {'':25s}  x0_ratio={rx0:.3f}  y0_ratio={ry0:.3f}  x1_ratio={rx1:.3f}  y1_ratio={ry1:.3f}")
    print()

# Now check page 1
print("=" * 60)
print("Page 1 comparison:")
p1 = mid["pdf_info"][1]
ps1 = p1["page_size"]
print(f"page_size = {ps1}")

# Get para_blocks for page 1
print("\nmiddle.json para_blocks (page 1):")
for b in p1.get("para_blocks", []):
    lines = b.get("lines", [])
    txt = ""
    for l in lines:
        for s in l.get("spans", []):
            txt += s.get("content", "")
        if len(txt) > 40:
            break
    print(f"  bbox={b['bbox']}  type={b.get('type','?')}  text={txt[:50]}")

print("\ncontent_list.json items (page 1):")
for item in cl:
    if item.get("page_idx") == 1:
        print(f"  bbox={item.get('bbox')}  type={item.get('type','?')}  text={str(item.get('text',''))[:50]}")
    elif item.get("page_idx", 0) > 1:
        break

# Check _model.json for rendering info
print("\n" + "=" * 60)
print("Checking _model.json structure:")
model_path = "data/mineru_output/lubanovic_fastapi_modern_web/lubanovic_fastapi_modern_web/auto/lubanovic_fastapi_modern_web_model.json"
with open(model_path, "r", encoding="utf-8") as f:
    model = json.load(f)
if isinstance(model, list):
    p0m = model[0]
    print(f"model.json page 0 keys: {list(p0m.keys())}")
    print(f"page_info: {p0m.get('page_info')}")
    # Check first layout_det entry
    dets = p0m.get("layout_dets", [])
    if dets:
        print(f"layout_dets[0]: {dets[0]}")
        print(f"Total layout_dets on page 0: {len(dets)}")
elif isinstance(model, dict):
    print(f"model.json top keys: {list(model.keys())[:10]}")
