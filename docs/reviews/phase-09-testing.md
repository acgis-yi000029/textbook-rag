# Phase Review: Testing

**Review 类型**: 测试类
**执行时间**: 2026-03-04T11:48:00-05:00
**产出物**: `backend/tests/`, `docs/test-report.md`
**作者**: Frank (QA Engineer)
**审查人**: Charlie (Tech Lead)

---

## 自动检查

- ✅ `uv run pytest tests/ --tb=short -q` → **55 passed in 0.31s**
- ✅ `uv run ruff check tests/` → All checks passed
- ✅ `uv run ruff format --check tests/` → All formatted

## 审查清单

### 测试覆盖率

- ✅ **数据模型** (models.py) — 10 tests, all 7 dataclasses tested
- ✅ **解析器** (parser.py) — 12 tests, filtering/normalization/edge cases
- ✅ **Chunker** (chunker.py) — 10 tests, table/formula preservation, overlap split
- ✅ **SQLite 索引** (sqlite_indexer.py) — 9 tests, CRUD + search + filters
- ✅ **PageIndex 构建** (pageindex_builder.py) — 7 tests, tree structure + roundtrip
- ✅ **RRF 融合** (rrf_fuser.py) — 7 tests, ranking + formula verification
- ⚠️ **外部依赖模块** — ChromaIndexer, Generator, SourceTracer, PageIndexRetriever 需要 live 服务，通过手动测试覆盖

### 测试质量

- ✅ **Arrange-Act-Assert 模式** — 所有测试遵循 AAA 结构
- ✅ **Fixtures 共享** — `conftest.py` 提供 `sample_content_items`, `sample_chunks`, `tmp_data_dir`, `sample_content_list_json`
- ✅ **边界情况** — 空输入、不存在的文件、无效 bbox、空数据库
- ✅ **无外部依赖** — 所有测试可离线运行，无需 Ollama/GPU

### Bug 发现

- ✅ **1 个 HIGH bug 已修复** — chunker overlap split 无限循环 (`chunker.py:157-160`)
  - 原因：`start = end - overlap_chars` 在 `end == len(text)` 时回退但永不推进
  - 修复：先检查 `end >= len(merged)` 再回退 start

### 教科书引用

- ✅ **真实引用** — 测试文件引用 okken 的 _Python Testing with pytest_（Ch2 测试函数, Ch3 fixtures, Ch4 parametrize），经查阅该书内容后确认适用

## 发现的问题

| #   | 严重度 | 描述                                   | 位置                        | 状态                      |
| --- | ------ | -------------------------------------- | --------------------------- | ------------------------- |
| 1   | HIGH   | Chunker overlap split 无限循环         | `chunker.py:157-160`        | ✅ 已修复                 |
| 2   | MEDIUM | 外部依赖模块无自动化测试               | ChromaIndexer, Generator 等 | → 手动测试覆盖            |
| 3   | MEDIUM | 未进行 20-question 评估 (Sprint S3-02) | —                           | → evaluation 阶段单独执行 |

## 结论 (初审)

- 🟢 **通过** — 可以进入下一阶段

55 个单元测试全部通过，发现并修复了 1 个 HIGH 级 bug（chunker 无限循环）。核心模块（解析、分块、索引、融合）有充分测试覆盖。

## 统计 (初审)

- 测试总数: 55
- 通过: 55 | 失败: 0 | 跳过: 0
- Bug 发现: 1 (HIGH, 已修复)
- 执行时间: 0.31s
