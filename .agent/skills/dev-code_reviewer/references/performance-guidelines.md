---
description: Performance optimization guidelines and model selection
---

# Performance Guidelines

性能优化指南和模型选择策略。

## 算法复杂度

### 常见复杂度

| 复杂度     | 名称     | 示例         |
| ---------- | -------- | ------------ |
| O(1)       | 常数     | 哈希表查找   |
| O(log n)   | 对数     | 二分查找     |
| O(n)       | 线性     | 遍历数组     |
| O(n log n) | 线性对数 | 快速排序     |
| O(n²)      | 平方     | 嵌套循环     |
| O(2^n)     | 指数     | 递归斐波那契 |

### 优化原则

```python
# ❌ O(n²) - 嵌套循环
def find_pairs_slow(arr, target):
    pairs = []
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] + arr[j] == target:
                pairs.append((arr[i], arr[j]))
    return pairs

# ✅ O(n) - 使用哈希表
def find_pairs_fast(arr, target):
    seen = set()
    pairs = []
    for num in arr:
        complement = target - num
        if complement in seen:
            pairs.append((complement, num))
        seen.add(num)
    return pairs
```

## 数据库优化

### 索引策略

```sql
-- 为常用查询添加索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- 复合索引：最左前缀原则
-- 索引 (a, b, c) 可用于:
-- WHERE a = ?
-- WHERE a = ? AND b = ?
-- WHERE a = ? AND b = ? AND c = ?
```

### N+1 查询问题

```python
# ❌ N+1 查询
users = db.query(User).all()
for user in users:
    orders = db.query(Order).filter(Order.user_id == user.id).all()

# ✅ 使用 JOIN 或预加载
users = db.query(User).options(joinedload(User.orders)).all()
```

## 缓存策略

### 缓存层级

1. **内存缓存** - 函数级别 (lru_cache)
2. **应用缓存** - Redis/Memcached
3. **HTTP 缓存** - CDN, 浏览器缓存
4. **数据库缓存** - 查询缓存

### Python 缓存

```python
from functools import lru_cache
from datetime import timedelta

# 内存缓存
@lru_cache(maxsize=128)
def expensive_computation(n):
    return n ** 2

# Redis 缓存
import redis
cache = redis.Redis()

def get_user(user_id: str):
    cached = cache.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)

    user = db.get_user(user_id)
    cache.setex(f"user:{user_id}", timedelta(hours=1), json.dumps(user))
    return user
```

## 前端性能

### React 优化

```typescript
// ✅ 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

// ✅ 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

// ✅ 使用 React.memo 避免不必要的重渲染
const MemoizedComponent = React.memo(function Component({ data }) {
  return <div>{data}</div>
})
```

### 代码分割

```typescript
// 动态导入
const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

## 网络优化

### 减少请求

- 合并小请求
- 使用 GraphQL 减少过度获取
- 实现分页加载

### 压缩

```typescript
// Next.js 配置
module.exports = {
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};
```

## 性能检查清单

### 后端

- [ ] 数据库查询有适当索引
- [ ] 避免 N+1 查询
- [ ] 热点数据有缓存
- [ ] 使用连接池
- [ ] 异步处理耗时任务

### 前端

- [ ] 使用代码分割
- [ ] 图片优化和懒加载
- [ ] 避免不必要的重渲染
- [ ] 使用生产构建
- [ ] 启用 Gzip/Brotli 压缩

### 通用

- [ ] 算法复杂度合理
- [ ] 无内存泄漏
- [ ] 有性能监控
- [ ] 定期性能测试

## 性能测量工具

```bash
# Python
uv run python -m cProfile -s time app.py
uv run py-spy top -- python app.py

# Node.js
node --prof app.js
node --inspect app.js  # Chrome DevTools

# 网站
npx lighthouse https://example.com
```

---

**先让它工作，再让它正确，最后让它快速！**
