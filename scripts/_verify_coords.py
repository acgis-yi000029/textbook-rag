"""Verify coordinate reference frames across MinerU outputs."""
import json

model_path = "data/mineru_output/lubanovic_fastapi_modern_web/lubanovic_fastapi_modern_web/auto/lubanovic_fastapi_modern_web_model.json"
mid_path = "data/mineru_output/lubanovic_fastapi_modern_web/lubanovic_fastapi_modern_web/auto/lubanovic_fastapi_modern_web_middle.json"
cl_path = "data/mineru_output/lubanovic_fastapi_modern_web/lubanovic_fastapi_modern_web/auto/lubanovic_fastapi_modern_web_content_list.json"

with open(model_path, "r", encoding="utf-8") as f:
    model = json.load(f)
with open(mid_path, "r", encoding="utf-8") as f:
    mid = json.load(f)
with open(cl_path, "r", encoding="utf-8") as f:
    cl = json.load(f)

# === Dimensions from each source ===
ps = mid["pdf_info"][0]["page_size"]   # [504, 661]
mi = model[0]["page_info"]             # {width: 1400, height: 1838}

print("=== Three coordinate systems ===")
print(f"  middle.json page_size (PDF points):   {ps[0]} x {ps[1]}")
print(f"  model.json  page_info (model pixels): {mi['width']} x {mi['height']}")
print(f"  Ratios: x={mi['width']/ps[0]:.4f}  y={mi['height']/ps[1]:.4f}")
print()

# === The content_list.json bbox - which system? ===
# "FastAPI" title on page 0
cl_bbox = [67, 124, 579, 220]
mid_bbox = [34, 82, 292, 146]

print("=== 'FastAPI' title bbox comparison ===")
print(f"  content_list: {cl_bbox}")
print(f"  middle.json:  {mid_bbox}")
print()

# Normalize to [0,1] using different references
print("As fraction of page_size [504, 661]:")
print(f"  cl:   x0={cl_bbox[0]/ps[0]:.4f} y0={cl_bbox[1]/ps[1]:.4f} x1={cl_bbox[2]/ps[0]:.4f} y1={cl_bbox[3]/ps[1]:.4f}")
print(f"  mid:  x0={mid_bbox[0]/ps[0]:.4f} y0={mid_bbox[1]/ps[1]:.4f} x1={mid_bbox[2]/ps[0]:.4f} y1={mid_bbox[3]/ps[1]:.4f}")
print()

print("As fraction of model page_info [1400, 1838]:")
print(f"  cl:   x0={cl_bbox[0]/mi['width']:.4f} y0={cl_bbox[1]/mi['height']:.4f} x1={cl_bbox[2]/mi['width']:.4f} y1={cl_bbox[3]/mi['height']:.4f}")
print(f"  mid:  x0={mid_bbox[0]/mi['width']:.4f} y0={mid_bbox[1]/mi['height']:.4f} x1={mid_bbox[2]/mi['width']:.4f} y1={mid_bbox[3]/mi['height']:.4f}")
print()

# Check if content_list is just page_size * 2
doubled = [ps[0] * 2, ps[1] * 2]
print(f"As fraction of page_size*2 [{doubled[0]}, {doubled[1]}]:")
print(f"  cl:   x0={cl_bbox[0]/doubled[0]:.4f} y0={cl_bbox[1]/doubled[1]:.4f} x1={cl_bbox[2]/doubled[0]:.4f} y1={cl_bbox[3]/doubled[1]:.4f}")
print(f"  mid:  x0={mid_bbox[0]/doubled[0]:.4f} y0={mid_bbox[1]/doubled[1]:.4f} x1={mid_bbox[2]/doubled[0]:.4f} y1={mid_bbox[3]/doubled[1]:.4f}")
print()

# Check: content_list = middle * (model/pagesize)?
# i.e. content_list_x = middle_x * (1400/504) = middle_x * 2.778
scale_x = mi["width"] / ps[0]
scale_y = mi["height"] / ps[1]
print(f"model/pagesize scale: x={scale_x:.4f} y={scale_y:.4f}")
print(f"If cl = mid * model_scale: [{mid_bbox[0]*scale_x:.0f}, {mid_bbox[1]*scale_y:.0f}, {mid_bbox[2]*scale_x:.0f}, {mid_bbox[3]*scale_y:.0f}]")
print(f"Actual cl:              {cl_bbox}")
print()

# Direct ratio content_list / middle
print("Direct ratio cl/mid:")
for i, label in enumerate(["x0", "y0", "x1", "y1"]):
    ratio = cl_bbox[i] / mid_bbox[i] if mid_bbox[i] else 0
    print(f"  {label}: {ratio:.4f}")
print()

# Check multiple pages in model.json
print("=== model.json page_info across pages ===")
for i in range(min(5, len(model))):
    pi = model[i].get("page_info", {})
    ps_i = mid["pdf_info"][i]["page_size"]
    rx = pi.get("width", 0) / ps_i[0] if ps_i[0] else 0
    ry = pi.get("height", 0) / ps_i[1] if ps_i[1] else 0
    print(f"  page {i}: model={pi.get('width')}x{pi.get('height')}  pdf_pts={ps_i[0]}x{ps_i[1]}  ratio=({rx:.3f},{ry:.3f})")

# Check another book
print()
print("=== Checking barber_brml book ===")
model2_path = "data/mineru_output/barber_brml/barber_brml/auto/barber_brml_model.json"
mid2_path = "data/mineru_output/barber_brml/barber_brml/auto/barber_brml_middle.json"
with open(model2_path, "r", encoding="utf-8") as f:
    model2 = json.load(f)
with open(mid2_path, "r", encoding="utf-8") as f:
    mid2 = json.load(f)
pi2 = model2[0].get("page_info", {})
ps2 = mid2["pdf_info"][0]["page_size"]
rx2 = pi2.get("width", 0) / ps2[0] if ps2[0] else 0
ry2 = pi2.get("height", 0) / ps2[1] if ps2[1] else 0
print(f"  model={pi2.get('width')}x{pi2.get('height')}  pdf_pts={ps2[0]}x{ps2[1]}  ratio=({rx2:.3f},{ry2:.3f})")
