---
topic: retrieval_lab
dimension: pitfalls
created: 2026-03-11
last_verified: 2026-03-11
source_versions:
  - "📚 Book: [manning_intro_to_ir.pdf](../../textbooks/manning_intro_to_ir.pdf) — Ch.11 (BM25)"
  - "📖 Docs: [rank_bm25](https://github.com/dorianbrown/rank_bm25)"
  - "🧪 经验: 代码审查发现的潜在问题"
expiry: 6m
status: current
---

# Retrieval Lab 踩坑记录

> ⚠️ **这是知识库中最有价值的维度。** 每次踩坑后请追加条目。

---


## 坑 1: build_retriever 总是初始化所有检索器

**场景：** 只想用 `bm25` 方法，但 `build_retriever("barber", "bm25")` 仍然会初始化 `TOCRetriever`。

**症状：** 如果 `toc_index.json` 不存在或损坏，即使只用 BM25 也会报错。

**根因：** `common.py` 的 `build_retriever()` 在判断 method 之前就初始化了所有检索器。

**解法：**

❌ 错误写法 — 无论 method 选什么都初始化全部

    bm25 = BM25Retriever(data_dir / "bm25" / f"{book}_bm25.pkl", book)
    toc = TOCRetriever(data_dir / "toc_index.json", book)
    if method == "bm25":
        return bm25

✅ 正确写法 — 懒初始化，只创建需要的

    if method == "bm25":
        return BM25Retriever(data_dir / "bm25" / f"{book}_bm25.pkl", book)
    if method == "toc":
        return TOCRetriever(data_dir / "toc_index.json", book)
    if method == "ensemble":
        bm25 = BM25Retriever(data_dir / "bm25" / f"{book}_bm25.pkl", book)
        toc = TOCRetriever(data_dir / "toc_index.json", book)
        return EnsembleRetriever([bm25, toc], rrf_k=config.RRF_K)

**教训：** 工厂函数应该懒初始化，避免不必要的资源加载和错误。

> 💻 Source: `common.py:23-36`

---


## 坑 2: BM25 分词丢失中文和特殊字符

**场景：** 查询包含中文或带连字符的术语（如 "t-SNE"、"self-attention"）。

**症状：** 查询 "t-SNE" 被分词为 `["t", "sne"]`，匹配不到 "t-SNE" 的完整术语。中文查询被完全丢弃，返回空结果。

**根因：** 分词正则 `r"[a-z0-9]+"` 只保留小写字母和数字，会丢弃连字符、中文和所有特殊字符。

**解法：**

❌ 错误写法 — 只匹配 ASCII

    tokens = re.findall(r"[a-z0-9]+", query.lower())

✅ 正确写法 — 同时保留连字符连接的词（当前项目保持极简，暂未复杂化，但生产需注意）

    tokens = re.findall(r"[a-z0-9]+(?:-[a-z0-9]+)*", query.lower())

**教训：** 分词器的正则表达式直接决定检索效果。遇到特殊术语搜不到时，先检查分词结果。

> 💻 Source: `retrievers/bm25_retriever.py:22` + `retrievers/toc_retriever.py:22-23`

---


## 坑 3: Ensemble 的 top_k*2 可能不够

**场景：** 想找一个只在 TOC 中排名靠后（如第 15 名）的章节。

**症状：** 使用 `--top-k 5` 时，Ensemble 对子检索器调用 `search(query, top_k=10)`，但 TOC 中的这个结果排名第 15，被截断了。

**根因：** `EnsembleRetriever.search()` 对每个子检索器只取 `top_k * 2` 个候选。如果相关结果在某个检索器中排名靠后，会被遗漏。

**解法：**

❌ 错误写法 — 固定 2 倍

    results = retriever.search(query, top_k=top_k * 2)

✅ 正确写法 — 可配置倍数或使用更大范围

    results = retriever.search(query, top_k=max(top_k * 3, 20))

**教训：** 融合检索器的候选池大小直接影响召回率。在评测中观察到 Recall 低时，先检查是否候选池太小。

> 💻 Source: `retrievers/ensemble.py:21`

---


## 坑 4: benchmark.py 的 recall_at_k 只做关键词匹配

**场景：** 用 `expected_terms: ["bayesian inference"]` 评测，结果中有 "Bayesian" 和 "inference" 但分布在不同位置。

**症状：** `recall_at_k` 返回 1.0（命中），但实际上结果可能只是恰好包含这两个常见词，语义上并不相关。

**根因：** `recall_at_k()` 用 `any(term.lower() in " ".join(haystacks) for term in expected_terms)` 做子串匹配。意味着只要任一个 expected_term 出现就算命中。

**解法：**

❌ 错误写法 — 只要有一个词命中就算 1.0

    if any(term.lower() in " ".join(haystacks) for term in expected_terms):
        return 1.0

✅ 正确写法 — 要求所有 expected_terms 都命中（根据预期严格程度调整）

    if all(term.lower() in " ".join(haystacks) for term in expected_terms):
        return 1.0

**教训：** 评测指标的实现细节会直接影响实验结论。用 `any` 还是 `all` 取决于 expected_terms 的设计意图。

> 💻 Source: `scripts/benchmark.py:29-37`

---


## 坑 5: pickle 索引的版本兼容性

**场景：** 用 Python 3.11 构建的 BM25 索引，换到 Python 3.12 后加载。

**症状：** `pickle.load()` 报错 `ModuleNotFoundError` 或反序列化后行为异常。

**根因：** `rank_bm25` 库的类实例被序列化到 pickle 中。如果 `rank_bm25` 版本变更了内部属性名，或 Python 版本的 pickle 协议不兼容，就会出错。

**解法：**

❌ 错误写法 — 直接加载旧索引

    with open(index_path, "rb") as f:
        data = pickle.load(f)

✅ 正确写法 — 加版本检查或考虑 JSON 可读格式

    with open(index_path, "rb") as f:
        data = pickle.load(f)
    if data.get("version") != EXPECTED_VERSION:
        raise RuntimeError(f"Index version mismatch. Please rebuild: {index_path}")

**教训：** pickle 是 Python 特有的二进制格式，不适合长期存储。对于需要跨版本使用的索引，考虑用 JSON + 重新构建对象策略。

> 🧪 经验: Python pickle 兼容性问题

---


## 坑 6: TOC/PageIndex 检索器对空标题的处理

**场景：** TOC/PageIndex 索引中某些章节标题/节点为空字符串。

**症状：** 空标题的 `term_set` 为空集，`overlap` 永远为 0，且子串匹配 `q in ""` 也不会命中。不会报错但会悄悄跳过。

**根因：** `toc_retriever.py` 中 `heading.get("title", "")` 可能返回空字符串。代码逻辑上不会出错（空集交集为空，skip），但空标题的章节永远不会被检索到。

**解法：**

❌ 错误写法 — 不检查空标题

    for idx, heading in enumerate(self.headings):
        title = heading.get("title", "")

✅ 正确写法 — 跳过空标题并记录

    for idx, heading in enumerate(self.headings):
        title = heading.get("title", "").strip()
        if not title:
            continue  # 跳过空标题 / Skip empty titles

**教训：** 数据质量问题会悄悄降低检索覆盖率。在 `prepare_book_data.py` 阶段对数据做清洗和验证。

> 💻 Source: `retrievers/toc_retriever.py:27-28`

---


## 坑 7: Vector 检索计算余弦没做分母防零

**场景：** 某些原因下 Ollama 生成了全 0 向量，或 `self.vecs` 中包含全 0 行。

**症状：** `RuntimeWarning: invalid value encountered in divide`，计算出来的相似度全是 NaN，排序出错崩溃。

**根因：** Numpy 标准化时 `a / np.linalg.norm(a)` 除以 0。

**解法：**

❌ 错误写法 — 没加 epsilon 防溢出

    a_norm = a / np.linalg.norm(a)

✅ 正确写法 — 加上 1e-10

    a_norm = a / (np.linalg.norm(a) + 1e-10)

**教训：** 向量运算永远不能信任外部模型保证不会生成零向量，必须进行平滑（Smooth）或者加 epsilon 处理。

> 💻 Source: `retrievers/vector_retriever.py:88-89`

---


## 坑 8: Sirchmunk subprocess 找不到 rga 阻塞

**场景：** Linux/Windows 环境没有 `rga` 环境变量配置。

**症状：** `run_query.py --method sirchmunk` 会引发 `FileNotFoundError: [WinError 2] The system cannot find the file specified`。

**根因：** Sirchmunk 调用了 `subprocess.run(["rga", ...])`，默认要求 PATH 里可以找到 rga。项目中的 `setup_sirchmunk_wsl.sh` 创建的是 WSL 环境的局部 `rga`，并未挂在全局 Windows PATH。

**解法：**

❌ 错误写法 — 假定 rga 全局可见，不处理找不到情况

    result = subprocess.run(["rga", ...])

✅ 正确写法 — 明确异常提示且支持明确传入执行器位置

    try:
        result = subprocess.run([self.rga_bin, ...])
    except FileNotFoundError:
        raise RuntimeError(f"rga binary not found at '{self.rga_bin}'. "
                            "Install ripgrep-all or run setup_sirchmunk_wsl.sh.")

**教训：** 封装 CLI 工具时一定要捕捉 `FileNotFoundError` 并给出业务层面的解决路径提示。

> 💻 Source: `retrievers/sirchmunk_retriever.py:66-79`

---


## 坑 9: sys.path 操纵的脆弱性与包导入

**场景：** 从非项目根目录运行脚本，或脚本被移动到其他位置。

**症状：** `ModuleNotFoundError: No module named 'retrieval_lab'`。

**根因：** `benchmark.py` 用 `sys.path.insert(0, str(LAB_ROOT.parent))` 硬编码了相对父路径。这高度依赖脚本相对工作区的位置。

**解法：**

❌ 错误写法 — 基于当前文件层层 parent

    sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

✅ 正确写法 — 使用 uv run 从正确的统一工作区跑

    # 只要保证在工作区外围或保证 uv 会读取 pyproject 的 PYTHONPATH
    uv run python retrieval_lab/scripts/benchmark.py

**教训：** 避免过深的路径侵入，利用好构建配置工具与执行规范。

> 🧪 经验: Python 模块导入最佳实践

---


## 坑 10: Server Timeout 导致 Vector 评测崩溃

**场景：** `benchmark.py` 循环查询 100 题，Ollama 本地服务器偶尔响应过慢卡住。

**症状：** 跑了 5 分钟突然抛出 `httpx.ReadTimeout` 导致全部基准中断，辛辛苦苦跑了半天丢失数据。

**根因：** `httpx.post("http://localhost:11434/api/embed")` 默认没设合理超时或者没有重试机制。

**解法：**

❌ 错误写法 — 没设置超时阻塞死

    resp = httpx.post(url, json=payload)

✅ 正确写法 — 设置 timeout，必要时捕获做 backoff 重试

    resp = httpx.post(url, json=payload, timeout=30)
    # （当前代码已加入对超时的防御参数 `timeout=30`）

**教训：** 凡是依赖网络或推理服务的检索模块，务必加 timeout 控制！

> 💻 Source: `retrievers/vector_retriever.py:79`

---


## 调试清单

1. [ ] **查询返回空结果？** → 检查分词结果：`re.findall(r"[a-z0-9]+", query.lower())`，确认查询词不是全部被中文丢弃。
2. [ ] **BM25 索引加载失败？** → 确认 pickle 路径正确、Python 版本和 `rank_bm25` 序列化兼容。
3. [ ] **TOC 找不到明明存在的章节？** → 检查 `toc_index.json` 中标题是否为空。
4. [ ] **Ensemble 效果比单个差？** → 检查候选池大小（只查了子结果的 `top_k*2`，名次过后被遗漏）。
5. [ ] **benchmark 报错没有 query.jsonl？** → 去 `prepare_book_data.py` 或者 `data/benchmarks` 核对名称是否一致。
6. [ ] **Vector 返回全 NaN 或超时？** → OLLAMA 是否在后台 `ollama serve` 并拥有 `nomic-embed-text` 模型？
7. [ ] **Sirchmunk `FileNotFoundError` 崩溃？** → 确认 `rga` 安装，或者在 `retriever` 初始化时配置到了对的 PATH 挂载点。
8. [ ] **评测 Recall 突然断崖下降？** → 检查修改 `expected_terms` 的标准是否过窄。
