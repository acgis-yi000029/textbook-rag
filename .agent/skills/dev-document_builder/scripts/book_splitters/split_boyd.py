"""Split Boyd Convex Optimization by chapters and sections.

Boyd 有完整内嵌 TOC。结构：
  - L1: 大分区 (Preface, Introduction, Part I/II/III, Appendices)
  - L2: 章 (Convex sets, Convex functions, ...) 或 Introduction 的子节
  - L3: 小节
  
映射策略：
  - Introduction (L1) → ch01, 其下 L2 作为 sections
  - Part I/II/III 下的 L2 → ch02-ch11, 其下 L3 作为 sections
  - Appendices 下的 L2 → appendix_a/b/c
"""
import pymupdf
import re
import json
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, str(Path(r"c:\Users\40270\OneDrive\Desktop\workspace\aisd\.agent\skills\dev-pdf_processing\scripts")))
from pdf_section_split import split_section

doc = pymupdf.open("boyd_convex_optimization.pdf")
total = doc.page_count
raw = doc.get_toc()

# ── 构建章节结构 ──
chapters = {}  # ch_id -> {title, start_page, end_page, sections}
ch_counter = 0
appendix_labels = iter("abcdefgh")

i = 0
while i < len(raw):
    level, title, page = raw[i]

    if level == 1 and title == "Preface":
        i += 1
        continue

    if level == 1 and title == "Introduction":
        # Introduction 本身是 ch01，下面的 L2 是 sections
        ch_counter += 1
        ch_id = f"ch{ch_counter:02d}"
        sections = []
        j = i + 1
        while j < len(raw) and raw[j][0] >= 2:
            if raw[j][0] == 2:
                sec_title = raw[j][1]
                sec_page = raw[j][2]
                # end_page: next L2 or next L1
                end_page = total
                for k in range(j + 1, len(raw)):
                    if raw[k][0] <= 2:
                        end_page = raw[k][2] - 1
                        break
                sections.append({
                    "id": f"1.{len(sections)+1}",
                    "title": sec_title,
                    "start_page": sec_page,
                    "end_page": end_page,
                })
            j += 1

        # Intro 整章的 end_page
        ch_end = total
        for k in range(i + 1, len(raw)):
            if raw[k][0] == 1:
                ch_end = raw[k][2] - 1
                break

        chapters[ch_id] = {
            "title": title,
            "start_page": page,
            "end_page": ch_end,
            "sections": sections,
        }
        i = j
        continue

    if level == 1 and title.startswith(("I ", "II ", "III ")):
        # Part 分区 — 跳过，处理其下的 L2 章
        i += 1
        continue

    if level == 1 and title == "Appendices":
        # 处理附录
        j = i + 1
        while j < len(raw):
            if raw[j][0] == 1:
                break
            if raw[j][0] == 2:
                app_title = raw[j][1]
                app_page = raw[j][2]
                # Skip non-content entries
                if app_title in ("References", "Notation"):
                    j += 1
                    continue

                app_label = next(appendix_labels)
                app_id = f"app_{app_label}"

                # Collect L3 sections
                sections = []
                m = j + 1
                while m < len(raw) and raw[m][0] >= 3:
                    if raw[m][0] == 3:
                        sec_title = raw[m][1]
                        sec_page = raw[m][2]
                        end_page = total
                        for k in range(m + 1, len(raw)):
                            if raw[k][0] <= 3:
                                end_page = raw[k][2] - 1
                                break
                        sections.append({
                            "id": f"{app_label}.{len(sections)+1}",
                            "title": sec_title,
                            "start_page": sec_page,
                            "end_page": end_page,
                        })
                    m += 1

                app_end = total
                for k in range(j + 1, len(raw)):
                    if raw[k][0] <= 2:
                        app_end = raw[k][2] - 1
                        break

                chapters[app_id] = {
                    "title": f"Appendix: {app_title}",
                    "start_page": app_page,
                    "end_page": app_end,
                    "sections": sections,
                }
            j += 1
        i = j
        continue

    if level == 2:
        # 正式的章（Part I/II/III 下的）
        ch_title = title
        ch_page = page

        # Skip non-chapter L2 entries
        if ch_title in ("References", "Notation"):
            i += 1
            continue

        ch_counter += 1
        ch_id = f"ch{ch_counter:02d}"

        # Collect L3 sections
        sections = []
        j = i + 1
        while j < len(raw) and raw[j][0] >= 3:
            if raw[j][0] == 3:
                sec_title = raw[j][1]
                sec_page = raw[j][2]
                end_page = total
                for k in range(j + 1, len(raw)):
                    if raw[k][0] <= 3:
                        end_page = raw[k][2] - 1
                        break
                sections.append({
                    "id": f"{ch_counter}.{len(sections)+1}",
                    "title": sec_title,
                    "start_page": sec_page,
                    "end_page": end_page,
                })
            j += 1

        # Chapter end_page
        ch_end = total
        for k in range(i + 1, len(raw)):
            if raw[k][0] <= 2:
                ch_end = raw[k][2] - 1
                break

        chapters[ch_id] = {
            "title": ch_title,
            "start_page": ch_page,
            "end_page": ch_end,
            "sections": sections,
        }
        i = j
        continue

    i += 1

# ── 输出 ──
out = Path("boyd_sections")
out.mkdir(exist_ok=True)
toc_data = {}
total_sec = 0

print("Boyd - Convex Optimization")
print(f"Total pages: {total}")
print("=" * 70)

for ch_id in sorted(chapters.keys()):
    ch = chapters[ch_id]
    ch_dir = out / ch_id
    ch_dir.mkdir(exist_ok=True)

    print(f"\n{ch_id}: {ch['title']}")

    if not ch["sections"]:
        pages = ch["end_page"] - ch["start_page"] + 1
        safe = re.sub(r"[^\w\s-]", "", ch["title"]).replace(" ", "_").lower()[:40]
        fname = f"{ch_id}_{safe}.pdf"
        split_section(doc, ch["start_page"], ch["end_page"], ch_dir / fname)
        print(f"  {'(whole)':7} {ch['title']:<45} p{ch['start_page']:>3}-{ch['end_page']:<3} ({pages:>2}p)")
        total_sec += 1
    else:
        ch_pages = 0
        for sec in ch["sections"]:
            pages = max(1, sec["end_page"] - sec["start_page"] + 1)
            ch_pages += pages
            total_sec += 1
            flag = "!" if pages > 10 else "*" if pages > 5 else " "

            print(f"  {sec['id']:<7} {sec['title']:<45} p{sec['start_page']:>3}-{sec['end_page']:<3} ({pages:>2}p) {flag}")

            safe = re.sub(r"[^\w\s-]", "", sec["title"]).replace(" ", "_").lower()[:40]
            fname = f"sec_{sec['id'].replace('.', '_')}_{safe}.pdf"
            split_section(doc, sec["start_page"], sec["end_page"], ch_dir / fname)

        print(f"  {'':7} {'SUBTOTAL':45} {ch_pages:>2}p")

    toc_data[ch_id] = {
        "title": ch["title"],
        "start_page": ch["start_page"],
        "end_page": ch["end_page"],
        "sections": ch["sections"],
    }

with open(out / "toc.json", "w", encoding="utf-8") as f:
    json.dump(toc_data, f, indent=2, ensure_ascii=False)

print(f"\n{'=' * 70}")
print(f"Total: {len(chapters)} chapters/appendices, {total_sec} sections")
print(f"Saved to: {out.resolve()}")
doc.close()
