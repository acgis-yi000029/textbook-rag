---
topic: mineru
dimension: math
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5"
  - "💻 Source: [rebuild_db.py](../../scripts/rebuild_db.py) — bbox 转换逻辑"
  - "💻 Source: [_verify_coords.py](../../scripts/_verify_coords.py) — 坐标验证"
  - "💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — README.md"
expiry: 6m
status: current
---

# MinerU 数学基础

> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5
> 💻 Source: [rebuild_db.py](../../scripts/rebuild_db.py) — bbox 坐标转换

---

## 符号对照表

| 符号 | 含义（白话） | 英文 | 取值范围 |
|------|-------------|------|---------| 
| $b_x, b_y$ | content_list.json 中的 bbox 坐标 | Normalized bbox coordinate | [0, 1000] |
| $p_x, p_y$ | 转换后的 PDF 点坐标 | PDF point coordinate | [0, page_width] / [0, page_height] |
| $W_{page}$ | PDF 页面宽度（点） | Page width in PDF points | 典型值 ~504-660 |
| $H_{page}$ | PDF 页面高度（点） | Page height in PDF points | 典型值 ~661-843 |
| $S$ | 归一化画布边长 | Normalization canvas size | 固定 = 1000 |
| $r$ | model.json 的缩放比例（模型像素/PDF点） | Model scale ratio | ~2.78（因页面而异） |
| $W_{model}$ | model.json 中的页面宽度（像素） | Model render width | 典型值 ~1834 |
| $H_{model}$ | model.json 中的页面高度（像素） | Model render height | 典型值 ~2064 |

> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5.1

---

## 核心公式

### 公式 1: content_list bbox 归一化坐标 → PDF 点坐标

**直觉：** content_list.json 把所有页面都当成 1000×1000 的画布，要映射回实际的 PDF 尺寸就做一个线性缩放

$$
p_x = \frac{b_x}{S} \times W_{page}, \quad p_y = \frac{b_y}{S} \times H_{page}
$$

> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5.2

**参数解释：**

| 参数 | 含义 | 例子中对应 |
|------|------|-----------| 
| $b_x$ | content_list 中的 x 坐标 | 67 |
| $S$ | 归一化常量 | 1000 |
| $W_{page}$ | PDF 页面实际宽度（from middle.json `page_size`） | 504 |
| $p_x$ | 转换后的 PDF 点 x 坐标 | 33.8 |

**推导过程：**

$$
\text{Step 1: 归一化比例 } = \frac{b_x}{S} = \frac{67}{1000} = 0.067
$$

$$
\text{Step 2: 映射到实际宽度 } p_x = 0.067 \times 504 = 33.768 \approx 33.8
$$

> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5.2
> 💻 Source: [rebuild_db.py](../../scripts/rebuild_db.py) — bbox 转换代码

---

### 公式 2: model.json 模型像素 → PDF 点坐标

**直觉：** model.json 是在更高分辨率下做检测的，只要除以缩放比例就能回到 PDF 坐标

$$
p_x = \frac{m_x}{r}, \quad r = \frac{W_{model}}{W_{page}}
$$

> 💻 Source: [_verify_coords.py](../../scripts/_verify_coords.py) — 缩放比例验证

**参数解释：**

| 参数 | 含义 | 例子中对应 |
|------|------|-----------| 
| $m_x$ | model.json 中的 x 坐标 | layout_dets bbox 值 |
| $r$ | 缩放比例 | 1834 / 660 ≈ 2.78 |
| $p_x$ | 转换后的 PDF 点坐标 | - |

**推导过程：**

$$
\text{Step 1: 求缩放比例 } r = \frac{W_{model}}{W_{page}} = \frac{1834}{660} \approx 2.78
$$

$$
\text{Step 2: 转换坐标 } p_x = \frac{m_x}{2.78}
$$

> 💻 Source: [_coord_analysis.py](../../scripts/_coord_analysis.py) — 坐标对比分析

---

### 公式 3: PDF 点坐标 → 前端百分比定位

**直觉：** 前端 PDF 渲染器需要百分比坐标来定位 bbox overlay，用 PDF 点除以页面尺寸即可

$$
\text{pct}_x = \frac{p_x}{W_{page}} \times 100\%, \quad \text{pct}_y = \frac{p_y}{H_{page}} \times 100\%
$$

> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5.4

**参数解释：**

| 参数 | 含义 | 例子中对应 |
|------|------|-----------| 
| $p_x$ | PDF 点 x 坐标（从公式 1 转换后） | 33.8 |
| $W_{page}$ | PDF 页面宽度 | 504 |
| $\text{pct}_x$ | 前端渲染百分比 | 6.7% |

**推导过程：**

$$
\text{Step 1: } \text{pct}_x = \frac{33.8}{504} \times 100\% = 6.71\%
$$

> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5.4

---

## 公式关系图

```
content_list bbox (1000×1000)
        │
        │ ÷1000 × page_size
        ▼
PDF 点坐标 (72 DPI) ◄──── middle.json para_blocks bbox (无需转换)
        │
        │ ÷page_size × 100%
        ▼                           model.json layout_dets bbox
前端百分比坐标 (0%~100%)                    │
                                          │ ÷ scale_ratio
                                          ▼
                                    PDF 点坐标 (同上)
```

> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5.1

---

## 手算练习

### 练习 1: content_list bbox → PDF 点

**题目：** lubanovic_fastapi_modern_web, page 0, page_size = 504 × 661。content_list bbox = [67, 124, 579, 220]。求 PDF 点坐标。

**解答步骤：**

1. x0 = 67 / 1000 × 504 = 33.768 ≈ 33.8
2. y0 = 124 / 1000 × 661 = 81.964 ≈ 82.0
3. x1 = 579 / 1000 × 504 = 291.816 ≈ 291.8
4. y1 = 220 / 1000 × 661 = 145.420 ≈ 145.4
5. 验证：middle.json 对应 para_blocks bbox = [34.0, 82.0, 292.0, 146.0]
6. 误差 = [0.23, 0.04, 0.18, 0.58] — 均 < 1 像素 ✅

> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5.2 验证示例

### 练习 2: model.json → PDF 点

**题目：** CLRS 第 1 页, page_size = 660 × 743, model page_info = 1834 × 2064。model.json 某个 layout_det bbox x0 = 183.4。求 PDF 点 x0。

**解答步骤：**

1. 缩放比例 r = 1834 / 660 ≈ 2.7788
2. PDF 点 x0 = 183.4 / 2.7788 ≈ 66.0
3. 或验证：r_y = 2064 / 743 ≈ 2.7780（X/Y 比例一致，说明是均匀缩放）

> 💻 Source: [_verify_coords.py](../../scripts/_verify_coords.py) — CLRS 验证数据

---

## 公式速查表

| 名称 | 公式 | 用途 | 前置公式 |
|------|------|------|---------| 
| content_list → PDF点 | $p = b / 1000 \times \text{page\_size}$ | 入库前坐标转换 | 无 |
| model.json → PDF点 | $p = m / r,\; r = W_{model} / W_{page}$ | 调试布局检测 | 无 |
| PDF点 → 前端百分比 | $\text{pct} = p / \text{page\_size} \times 100\%$ | 前端 bbox overlay | 公式 1 |
| 端到端: content_list → 前端 | $\text{pct} = b / 1000 \times 100\%$ | 快捷（但需确认 page_size 一致） | 公式 1 + 3 合并 |

> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5
