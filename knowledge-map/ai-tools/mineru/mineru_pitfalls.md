---
topic: mineru
dimension: pitfalls
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Known Issues"
  - "📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5"
  - "💻 Source: [rebuild_db.py](../../scripts/rebuild_db.py) — bbox 转换修复"
  - "💻 Source: [batch_mineru.py](../../scripts/batch_mineru.py) — 批处理脚本"
  - "🧪 经验: 58 本教科书批处理实践"
expiry: 3m
status: current
---

# MinerU 踩坑记录

> ⚠️ **这是知识库中最有价值的维度。** 每次踩坑后请追加条目。

---

## 坑 1: 三套坐标系混用导致 bbox 高亮错位

**场景：** Citation 点击后 PDF 跳页并 bbox 高亮，但蓝色高亮框覆盖区域与实际内容严重错位

**症状：** 高亮框显示在页面的错误位置，可能超出页面边界或覆盖完全无关的内容

**根因：** `content_list.json` 的 bbox 使用归一化 1000×1000 画布坐标，`rebuild_db.py` 未做转换直接入库。而 `pages` 表的 width/height 是 PDF 点坐标（72 DPI），前端用 `bbox / page_size` 计算百分比时，分子分母坐标系不统一

**解法：**

❌ 错误写法 — 直接存入 content_list 的原始 bbox

    # BAD: Raw content_list bbox stored directly
    # 错误：content_list 原始 bbox 直接入库
    bbox = item.get("bbox", [])
    cursor.execute("INSERT INTO source_locators ... VALUES (?)", (json.dumps(bbox),))

✅ 正确写法 — 入库前转换为 PDF 点坐标

    # GOOD: Convert normalized 1000x1000 to PDF points before storage
    # 正确：入库前将 1000×1000 归一化坐标转换为 PDF 点
    pw, ph = page_sizes.get(page_idx, (0.0, 0.0))
    if pw and ph:
        bbox = [bbox[0]/1000*pw, bbox[1]/1000*ph,
                bbox[2]/1000*pw, bbox[3]/1000*ph]

**教训：** MinerU 有三套坐标系（归一化 1000×1000 / PDF 点 / 模型像素），这不是 bug 而是设计。入库和前端渲染前**必须**检查坐标系是否对齐

> 📖 Docs: [requirements.md](../../docs/v1.1/requirements/requirements.md) — §7.5
> 💻 Source: [rebuild_db.py](../../scripts/rebuild_db.py) — bbox 转换代码

---

## 坑 2: 批处理中断后输出目录残留导致跳过

**场景：** 批量处理 58 本教科书，Ctrl+C 中断或 OOM 崩溃后重新运行

**症状：** 某些书被标为"已完成"跳过，但实际输出不完整（Markdown 为空或 JSON 只有 `[]`）

**根因：** 只检查输出目录是否存在来判断是否完成，但崩溃时目录已创建、文件只写了一半

**解法：**

❌ 错误写法 — 只检查目录是否存在

    # BAD: Only check if directory exists
    def is_processed(name):
        return (OUTPUT_DIR / name).exists()

✅ 正确写法 — 使用 lock 文件 + 输出验证

    # GOOD: Lock file for crash detection + output validation
    # 正确：lock 文件检测崩溃 + 输出内容验证
    def is_processed(name, force=False):
        if force:
            return False, "forced"
        if _is_locked(name):          # Lock file = was interrupted
            _clean_incomplete(name)   # Clean up corrupted output
            return False, "interrupted — will retry"
        is_valid, reason = _validate_output(name)  # Check content
        if is_valid:
            return True, "complete"
        else:
            _clean_incomplete(name)
            return False, f"invalid ({reason})"

**教训：** 长时间批处理必须实现断点续传机制：lock 文件检测崩溃、输出完整性验证、自动清理不完整输出

> 💻 Source: [batch_mineru.py](../../scripts/batch_mineru.py) — checkpoint/resume 逻辑
> 🧪 经验: 58 本书平均 5-15 分钟/本，总计 8+ 小时

---

## 坑 3: 多栏布局阅读顺序交叉

**场景：** 解析双栏学术论文或教科书（如 CLRS 的部分章节）

**症状：** 输出的 Markdown/content_list 中，左栏和右栏的文字交替出现，段落中间突然插入另一栏的内容

**根因：** 极端复杂布局下，布局检测模型（DocLayout-YOLO）的阅读顺序推断出错。尤其是跨栏图片、脚注、侧边栏等元素干扰

**解法：**

❌ 错误做法 — 默认相信 content_list 的顺序总是正确的

    # BAD: Assume reading order is always correct
    for item in content_list:
        chunks.append(item["text"])  # May be interleaved

✅ 正确做法 — 对关键页面用 _layout.pdf 可视化验证

    # GOOD: Verify with layout visualization
    # 正确：用布局可视化验证，检测框上有编号表示阅读顺序
    # 1. 打开 {name}_layout.pdf 可视化文件
    # 2. 检查编号是否符合人类阅读逻辑
    # 3. 不正确时考虑手动拆分或用 VLM/hybrid 后端重试

**教训：** 不要盲信自动阅读顺序。批量处理后应抽检 _layout.pdf，特别是复杂布局的书

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Known Issues
> 🧪 经验: CLRS、DDIA 等双栏教科书偶现此问题

---

## 坑 4: 安装依赖冲突（PyTorch + PaddlePaddle）

**场景：** 在已有 PyTorch 项目的 venv 中安装 MinerU

**症状：** 安装后某些模型加载失败，或 CUDA 版本不匹配导致 GPU 不可用

**根因：** MinerU 同时依赖 PyTorch（布局检测/公式识别）和 PaddlePaddle（OCR），两者的 CUDA 版本要求可能冲突

**解法：**

❌ 错误做法 — 在主项目 venv 里直接 pip install

    # BAD: Install in existing project venv
    pip install mineru[all]  # May conflict with existing PyTorch

✅ 正确做法 — 使用独立 venv 或 Docker

    # GOOD: Separate venv for MinerU
    # 正确：为 MinerU 创建独立虚拟环境
    python -m venv .venv-mineru
    .venv-mineru/Scripts/activate    # Windows
    uv pip install -U "mineru[all]"

    # OR: Use Docker (recommended for production)
    # 或：使用 Docker（生产环境推荐）
    docker pull opendatalab/mineru:latest

**教训：** MinerU 最好用独立环境，尤其是在已有 ML 项目中。Docker 是最省心的方案

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — FAQ
> 🧪 经验: 本项目使用独立 .venv 安装

---

## 坑 5: 大 PDF 超时或 OOM

**场景：** 处理 500+ 页的大型教科书（如 CLRS 1300 页）

**症状：** 处理到某一页后进程被 OOM killer 杀死，或超过设定的超时时间

**根因：** 布局检测和公式识别模型对每页做推理，页数多时 GPU 显存持续占用。某些包含大量公式的页面尤其消耗资源

**解法：**

❌ 错误做法 — 不设超时、不控制资源

    # BAD: No timeout, no resource control
    subprocess.run(["mineru", "-p", huge_pdf, "-o", out])

✅ 正确做法 — 设超时 + 分批 + 监控

    # GOOD: Timeout + batch status + crash recovery
    # 正确：超时保护 + 批处理状态 + 崩溃恢复
    result = subprocess.run(
        cmd,
        timeout=3600,          # 60 min max per book
        capture_output=False,  # Stream output for monitoring
    )

**教训：** 大 PDF 处理要有超时保护、状态日志、崩溃恢复机制。考虑用 pipeline 后端（CPU）减少 GPU 压力

> 💻 Source: [batch_mineru.py](../../scripts/batch_mineru.py) — timeout + crash recovery
> 🧪 经验: CLRS (1300页) 在 pipeline 后端约需 30 分钟

---

## 坑 6: 公式识别输出的 LaTeX 无法渲染

**场景：** MinerU 输出的 Markdown 中，部分数学公式显示为乱码或 LaTeX 语法错误

**症状：** 前端渲染时公式显示为红色错误提示（KaTeX/MathJax 报错）

**根因：** UniMERNet 模型的公式识别并非 100% 准确，复杂公式（多行方程组、矩阵、大符号）可能输出不完整的 LaTeX

**解法：**

❌ 错误做法 — 假设所有公式都能正确渲染

    # BAD: Render all formulas directly
    content = md_content  # Some LaTeX may be broken

✅ 正确做法 — 公式渲染加 try-catch + 降级到原始文本

    # GOOD: Graceful degradation for broken formulas
    # 正确：公式渲染失败时降级为原始文本
    # 前端实现：KaTeX 渲染失败时显示原始 LaTeX 字符串作为 fallback

**教训：** 公式识别是 MinerU 最容易出错的环节之一。生产系统中公式渲染必须有 fallback 机制

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Known Issues
> 🧪 经验: 数学教科书（PRML、MML）中 ~5% 公式有渲染问题

---

## 坑 7: 表格跨页合并失败

**场景：** 教科书中横跨两页的大表格

**症状：** 表格被拆成两个独立表格，第二部分没有表头

**根因：** 跨页表格合并是 v2.7.2 才优化的功能，旧版本或某些复杂表格格式仍可能合并失败

**解法：**

❌ 错误做法 — 假设表格总是完整的

    # BAD: Assume each table in content_list is self-contained
    tables = [item for item in content_list if item["type"] == "table"]

✅ 正确做法 — 检查连续页的表格是否需要手动合并

    # GOOD: Check for split tables across pages
    # 正确：检查连续页的表格是否被拆分
    # 升级到 v2.7.2+ 以获得更好的跨页合并
    # 对关键表格数据，人工验证输出

**教训：** 确保使用 v2.7.2+ 以获得跨页表格合并优化。关键数据仍需人工验证

> 💻 Source: [opendatalab/MinerU](https://github.com/opendatalab/MinerU) — Changelog v2.7.2
> 🧪 经验: ISLR、ESL 等统计教科书大表格偶现此问题

---

## 调试清单

1. [ ] **bbox 高亮位置对吗？** → 检查坐标转换：content_list 用的是 1000×1000 归一化，需 ÷1000×page_size
2. [ ] **输出完整吗？** → 检查 content_list.json 是否为空数组、Markdown 是否 > 1KB
3. [ ] **阅读顺序对吗？** → 打开 `_layout.pdf` 检查编号顺序
4. [ ] **公式渲染对吗？** → 用 KaTeX/MathJax 测试 LaTeX 输出，检查有无语法错误
5. [ ] **表格完整吗？** → 检查跨页表格是否被拆分，确认使用 v2.7.2+
6. [ ] **OCR 生效了吗？** → 扫描 PDF 应产生文字输出，否则检查 OCR 配置
7. [ ] **GPU 在用吗？** → 用 `nvidia-smi` 确认 CUDA 被使用，或显式指定 `-b pipeline` 用 CPU
8. [ ] **版本对吗？** → `pip show mineru` 确认版本号，v2.7+ 推荐
9. [ ] **依赖冲突吗？** → 检查 PyTorch 和 PaddlePaddle 的 CUDA 版本是否一致
10. [ ] **空间够吗？** → 模型权重 ~2GB + 每本书输出 ~50-500MB，确保磁盘空间充足

> 🧪 经验: 基于 58 本教科书批处理的实际调试经验
