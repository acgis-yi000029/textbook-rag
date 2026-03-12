---
description: Common design patterns and architectural patterns
---

# Design Patterns

常用设计模式和架构模式参考。

## 创建型模式

### 单例模式 (Singleton)

```python
# Python - 使用模块级变量
# config.py
class Config:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# 使用
config = Config()
```

```typescript
// TypeScript
class Database {
  private static instance: Database;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}
```

### 工厂模式 (Factory)

```python
from abc import ABC, abstractmethod

class Notification(ABC):
    @abstractmethod
    def send(self, message: str) -> None:
        pass

class EmailNotification(Notification):
    def send(self, message: str) -> None:
        print(f"Email: {message}")

class SMSNotification(Notification):
    def send(self, message: str) -> None:
        print(f"SMS: {message}")

def create_notification(type: str) -> Notification:
    if type == "email":
        return EmailNotification()
    elif type == "sms":
        return SMSNotification()
    raise ValueError(f"Unknown type: {type}")
```

## 结构型模式

### 适配器模式 (Adapter)

```typescript
// 旧接口
interface OldPayment {
  pay(amount: number): void;
}

// 新接口
interface NewPayment {
  process(data: { amount: number; currency: string }): Promise<void>;
}

// 适配器
class PaymentAdapter implements NewPayment {
  constructor(private oldPayment: OldPayment) {}

  async process(data: { amount: number; currency: string }): Promise<void> {
    // 转换为旧接口格式
    this.oldPayment.pay(data.amount);
  }
}
```

### 装饰器模式 (Decorator)

```python
from functools import wraps
import time

def timing_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.2f}s")
        return result
    return wrapper

@timing_decorator
def slow_function():
    time.sleep(1)
```

### 仓库模式 (Repository)

```python
from abc import ABC, abstractmethod
from typing import List, Optional

class UserRepository(ABC):
    @abstractmethod
    def find_by_id(self, id: str) -> Optional[User]:
        pass

    @abstractmethod
    def find_all(self) -> List[User]:
        pass

    @abstractmethod
    def save(self, user: User) -> User:
        pass

    @abstractmethod
    def delete(self, id: str) -> None:
        pass

class SQLUserRepository(UserRepository):
    def __init__(self, db):
        self.db = db

    def find_by_id(self, id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == id).first()

    # ... 其他方法实现
```

## 行为型模式

### 策略模式 (Strategy)

```python
from abc import ABC, abstractmethod

class PricingStrategy(ABC):
    @abstractmethod
    def calculate(self, price: float) -> float:
        pass

class RegularPricing(PricingStrategy):
    def calculate(self, price: float) -> float:
        return price

class DiscountPricing(PricingStrategy):
    def __init__(self, discount: float):
        self.discount = discount

    def calculate(self, price: float) -> float:
        return price * (1 - self.discount)

class PriceCalculator:
    def __init__(self, strategy: PricingStrategy):
        self.strategy = strategy

    def get_price(self, base_price: float) -> float:
        return self.strategy.calculate(base_price)

# 使用
calculator = PriceCalculator(DiscountPricing(0.2))
final_price = calculator.get_price(100)  # 80
```

### 观察者模式 (Observer)

```typescript
interface Observer {
  update(data: unknown): void;
}

class EventEmitter {
  private observers: Map<string, Observer[]> = new Map();

  subscribe(event: string, observer: Observer): void {
    const observers = this.observers.get(event) || [];
    observers.push(observer);
    this.observers.set(event, observers);
  }

  emit(event: string, data: unknown): void {
    const observers = this.observers.get(event) || [];
    observers.forEach((observer) => observer.update(data));
  }
}
```

## 架构模式

### 分层架构

```
┌─────────────────────────────────┐
│         Presentation            │  ← API 路由、控制器
├─────────────────────────────────┤
│          Application            │  ← 用例、服务
├─────────────────────────────────┤
│            Domain               │  ← 实体、业务规则
├─────────────────────────────────┤
│         Infrastructure          │  ← 数据库、外部服务
└─────────────────────────────────┘
```

### 依赖注入

```python
from dataclasses import dataclass

@dataclass
class UserService:
    repository: UserRepository
    email_service: EmailService

    def create_user(self, data: dict) -> User:
        user = User(**data)
        self.repository.save(user)
        self.email_service.send_welcome(user.email)
        return user

# 组装
user_service = UserService(
    repository=SQLUserRepository(db),
    email_service=SMTPEmailService()
)
```

## 何时使用哪种模式

| 问题           | 推荐模式         |
| -------------- | ---------------- |
| 创建复杂对象   | Factory, Builder |
| 全局唯一实例   | Singleton        |
| 适配不兼容接口 | Adapter          |
| 动态添加功能   | Decorator        |
| 数据访问抽象   | Repository       |
| 可互换算法     | Strategy         |
| 事件通知       | Observer         |
| 撤销/重做      | Command          |

---

**选择模式要权衡：不要过度设计，也不要重复造轮子！**
