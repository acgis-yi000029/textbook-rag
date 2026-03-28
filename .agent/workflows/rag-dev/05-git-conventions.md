---
description: textbook-rag Git 提交规范与提交前检查清单
---

# 📦 Git 提交规范

## Commit Message 格式

```
feat: add pipeline dashboard with book selector
fix: move Ready badge to bottom-right of BookCard
refactor: extract PipelineDashboard to features/pipeline
chore: add subcategory registry for textbooks
```

## 提交前检查清单

1. `npx tsc --noEmit` (在 payload/ 目录)
2. 确认 i18n messages 完整
3. page.tsx 只是薄壳
4. 新组件已加入 barrel export
