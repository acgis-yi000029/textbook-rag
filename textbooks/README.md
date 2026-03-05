# Textbook Knowledge Base

51 本教科书的 MinerU 转换输出，覆盖 AI/ML、数学、NLP、CV、RL、Python、JavaScript/TypeScript、软件工程、DevOps、UX 设计。

## 概览

| 领域                   | 数量   | 代表书籍                                       |
| ---------------------- | ------ | ---------------------------------------------- |
| Machine Learning       | 9      | Deep Learning, PRML, ESL, PML 1&2              |
| Mathematics            | 5      | MML, Convex Optimization, Probability          |
| NLP                    | 2      | Jurafsky SLP3, Eisenstein NLP                  |
| Computer Vision        | 1      | Szeliski CV                                    |
| Reinforcement Learning | 1      | Sutton & Barto                                 |
| Graph Learning         | 1      | Hamilton GRL                                   |
| Python                 | 6      | Fluent Python, Cookbook, pytest, Cosmic Python |
| JavaScript             | 8      | JS Definitive Guide, Eloquent JS, YDKJS ×6     |
| TypeScript             | 1      | TypeScript Deep Dive                           |
| Algorithms             | 1      | CLRS                                           |
| Software Engineering   | 9      | Clean Code/Arch, DDIA, GoF, Refactoring        |
| DevOps                 | 3      | Pro Git, SRE, Release It!                      |
| UX/Design              | 2      | Don't Make Me Think, Design of Everyday Things |
| **总计**               | **51** |                                                |

## 目录结构

```
data/mineru_output/
├── {book_key}/
│   └── {book_key}/
│       └── auto/
│           ├── {book_key}.md                  # 完整 Markdown 内容（主要使用）
│           ├── {book_key}_content_list.json    # 结构化内容列表
│           ├── {book_key}_origin.pdf           # 原始 PDF
│           ├── {book_key}_layout.pdf           # 版面分析
│           ├── {book_key}_middle.json          # 中间处理结果
│           ├── {book_key}_model.json           # 模型输出
│           ├── {book_key}_span.pdf             # Span 标注
│           └── images/                         # 提取的图片
├── batch_status.json                           # 转换状态记录
└── ... (51 个书籍目录)

textbooks/
├── README.md                                   # 本文件
└── topic_index.json                            # 主题 → 章节快速索引

.agent/config/
└── textbook-skill-mapping.yaml                 # Skill ↔ 教科书映射
```

## 访问方式

### 1. 直接读取 Markdown

```
data/mineru_output/{book_key}/{book_key}/auto/{book_key}.md
```

### 2. 通过 Skill 映射查找

```yaml
# .agent/config/textbook-skill-mapping.yaml
skill_mappings:
  dev-senior_backend:
    primary:
      - ramalho_fluent_python
      - percival_cosmic_python
      - fontaine_art_of_postgresql
```

### 3. 通过主题索引查找

```python
import json
with open('textbooks/topic_index.json') as f:
    idx = json.load(f)

# 查找某主题的所有书籍章节
for ref in idx['topics']['neural_networks']['references']:
    print(f"{ref['book']}/{ref['chapter']}: {ref['title']}")
```

### 4. 代码中引用标注

```python
# Ref: Goodfellow et al., Deep Learning, Ch8.5 — Adam optimizer
# Ref: Ramalho, Fluent Python, Ch17 — Generator-based pipeline
```

## 完整书目

### Python

| Key                           | 书名                              | 作者               |
| ----------------------------- | --------------------------------- | ------------------ |
| `ramalho_fluent_python`       | Fluent Python (2nd ed)            | Luciano Ramalho    |
| `beazley_python_cookbook`     | Python Cookbook (3rd ed)          | David Beazley      |
| `downey_think_python_2e`      | Think Python (2nd ed)             | Allen Downey       |
| `downey_how_to_think_like_cs` | How to Think Like a CS            | Allen Downey       |
| `okken_python_testing_pytest` | Python Testing with pytest        | Brian Okken        |
| `percival_cosmic_python`      | Architecture Patterns with Python | Percival & Gregory |

### JavaScript / TypeScript

| Key                                    | 书名                                   | 作者             |
| -------------------------------------- | -------------------------------------- | ---------------- |
| `flanagan_js_definitive_guide`         | JavaScript: The Definitive Guide (7th) | David Flanagan   |
| `haverbeke_eloquent_javascript`        | Eloquent JavaScript (3rd)              | Marijn Haverbeke |
| `simpson_ydkjs_up_going`               | YDKJS: Up & Going                      | Kyle Simpson     |
| `simpson_ydkjs_scope_closures`         | YDKJS: Scope & Closures                | Kyle Simpson     |
| `simpson_ydkjs_this_object_prototypes` | YDKJS: this & Object Prototypes        | Kyle Simpson     |
| `simpson_ydkjs_types_grammar`          | YDKJS: Types & Grammar                 | Kyle Simpson     |
| `simpson_ydkjs_async_performance`      | YDKJS: Async & Performance             | Kyle Simpson     |
| `simpson_ydkjs_es6_beyond`             | YDKJS: ES6 & Beyond                    | Kyle Simpson     |
| `basarat_typescript_deep_dive`         | TypeScript Deep Dive                   | Basarat Ali Syed |

### Algorithms

| Key           | 书名                              | 作者          |
| ------------- | --------------------------------- | ------------- |
| `cormen_CLRS` | Introduction to Algorithms (CLRS) | Cormen et al. |

### Machine Learning

| Key                        | 书名                              | 作者                          |
| -------------------------- | --------------------------------- | ----------------------------- |
| `goodfellow_deep_learning` | Deep Learning                     | Goodfellow, Bengio, Courville |
| `bishop_prml`              | Pattern Recognition and ML        | Christopher Bishop            |
| `hastie_esl`               | Elements of Statistical Learning  | Hastie et al.                 |
| `james_ISLR`               | Intro to Statistical Learning     | James et al.                  |
| `kelleher_ml_fundamentals` | Fundamentals of ML                | John Kelleher                 |
| `murphy_pml1`              | Probabilistic ML: An Introduction | Kevin Murphy                  |
| `murphy_pml2`              | Probabilistic ML: Advanced Topics | Kevin Murphy                  |
| `barber_brml`              | Bayesian Reasoning and ML         | David Barber                  |
| `shalev-shwartz_uml`       | Understanding Machine Learning    | Shalev-Shwartz & Ben-David    |

### Mathematics

| Key                           | 书名                                        | 作者                |
| ----------------------------- | ------------------------------------------- | ------------------- |
| `deisenroth_mml`              | Mathematics for Machine Learning            | Deisenroth et al.   |
| `boyd_convex_optimization`    | Convex Optimization                         | Boyd & Vandenberghe |
| `grinstead_snell_probability` | Introduction to Probability                 | Grinstead & Snell   |
| `downey_think_stats_2e`       | Think Stats (2nd ed)                        | Allen Downey        |
| `mackay_information_theory`   | Information Theory, Inference, and Learning | David MacKay        |

### NLP / IR

| Key                   | 书名                                 | 作者              |
| --------------------- | ------------------------------------ | ----------------- |
| `jurafsky_slp3`       | Speech and Language Processing (3rd) | Jurafsky & Martin |
| `eisenstein_nlp`      | Intro to Natural Language Processing | Jacob Eisenstein  |
| `manning_intro_to_ir` | Intro to Information Retrieval       | Manning et al.    |

### Computer Vision

| Key           | 书名                                       | 作者             |
| ------------- | ------------------------------------------ | ---------------- |
| `szeliski_cv` | Computer Vision: Algorithms & Applications | Richard Szeliski |

### Reinforcement Learning

| Key                     | 书名                         | 作者           |
| ----------------------- | ---------------------------- | -------------- |
| `sutton_barto_rl_intro` | RL: An Introduction (2nd ed) | Sutton & Barto |

### Graph Learning

| Key            | 书名                          | 作者             |
| -------------- | ----------------------------- | ---------------- |
| `hamilton_grl` | Graph Representation Learning | William Hamilton |

### Software Engineering

| Key                          | 书名                                  | 作者             |
| ---------------------------- | ------------------------------------- | ---------------- |
| `martin_clean_code`          | Clean Code                            | Robert C. Martin |
| `martin_clean_architecture`  | Clean Architecture                    | Robert C. Martin |
| `gof_design_patterns`        | Design Patterns (GoF)                 | Gamma et al.     |
| `kleppmann_ddia`             | Designing Data-Intensive Applications | Martin Kleppmann |
| `hunt_pragmatic_programmer`  | The Pragmatic Programmer (20th)       | Thomas & Hunt    |
| `fowler_refactoring`         | Refactoring (2nd ed)                  | Martin Fowler    |
| `ejsmont_web_scalability`    | Web Scalability for Startup Engineers | Artur Ejsmont    |
| `fontaine_art_of_postgresql` | The Art of PostgreSQL                 | Dimitri Fontaine |
| `google_swe`                 | Software Engineering at Google        | Winters et al.   |

### DevOps

| Key                 | 书名                         | 作者            |
| ------------------- | ---------------------------- | --------------- |
| `chacon_pro_git`    | Pro Git (2nd ed)             | Chacon & Straub |
| `google_sre`        | Site Reliability Engineering | Google          |
| `nygard_release_it` | Release It! (2nd ed)         | Michael Nygard  |

### UX / Design

| Key                             | 书名                          | 作者       |
| ------------------------------- | ----------------------------- | ---------- |
| `krug_dont_make_me_think`       | Don't Make Me Think           | Steve Krug |
| `norman_design_everyday_things` | The Design of Everyday Things | Don Norman |

## Topic Index 统计

| 指标     | 值  |
| -------- | --- |
| 主题数   | 52  |
| 引用数   | 266 |
| 覆盖书籍 | 50  |

重建索引：`uv run python scripts/rebuild_topic_index.py`
