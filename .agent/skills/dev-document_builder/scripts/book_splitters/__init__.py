"""
Book Splitters - Custom PDF splitting scripts for academic textbooks.
书籍拆分器 - 针对不同学术教材的自定义PDF拆分脚本

These scripts handle books with non-standard TOC structures or no TOC at all.
适用于具有非标准目录结构或无目录的书籍。

Available splitters (11):
  ML:
  - split_bishop.py     - Bishop PRML (numbered chapters at L1)
  - split_murphy.py     - Murphy PML1/PML2 (Parts + Chapters structure)
  - split_esl.py        - Hastie ESL (no TOC, chapter title pages + section headings)
  - split_barber.py     - Barber BRML (no TOC, CHAPTER labels + section headings)
  - split_goodfellow.py - Goodfellow Deep Learning
  - split_kelleher.py   - Kelleher ML Fundamentals
  - split_shalev.py     - Shalev-Shwartz UML

  Math:
  - split_boyd.py       - Boyd Convex Optimization (embedded TOC, L1/L2/L3)
  - split_mackay.py     - MacKay Information Theory (no TOC, CMSSBX font detection)
  - split_grinstead.py  - Grinstead Probability

  Graphs:
  - split_hamilton.py   - Hamilton GRL (Chapter N labels + section headings)

Usage:
    cd <book_directory>
    python split_<book>.py
"""
