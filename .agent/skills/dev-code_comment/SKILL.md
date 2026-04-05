---
name: code-comment
description: English code comment standards for Python and TypeScript. Use when (1) adding comments to code, (2) standardizing comment format, (3) inline comment placement, (4) section dividers
---

# Code Comment Standards

## Objectives

- Add clear, English-only comments to code
- Follow consistent comment formatting rules per language (Python / TypeScript)
- Explain complex logic with reasons
- Maintain clear code documentation

## Shared Principles (All Languages)

| Principle       | Rule                                              |
| --------------- | ------------------------------------------------- |
| Language        | English only                                      |
| File header     | See [file-templates.md](../../workflows/rag-dev-v3/file-templates.md) — single source of truth |
| Function docs   | Concise English docstring                         |
| Inline comments | English, placed ABOVE code, not beside it         |
| Code spacing    | Blank line between code blocks                    |

---

## Part A: Python

> **File header format** → see [file-templates.md](../../workflows/rag-dev-v3/file-templates.md) § 一

### 3. Class Docstring (One Line)

```python
class ChatHistoryService:
    """Chat history persistence service."""

class AzureOpenAIError(Exception):
    """Azure OpenAI service error."""
```

### 4. Function Docstring

Concise English docstring. For complex functions, include Args/Returns.

**Simple function (one-liner):**

```python
def _validate_config(self) -> None:
    """Validate required configuration."""

@staticmethod
def _doc_to_session(doc: UniversalDocument) -> dict:
    """Convert UniversalDocument to session response dict."""
```

**Complex function (with Args/Returns):**

```python
async def create_session(self, owner_id: str, title: str | None = None) -> dict:
    """Create a new chat session.

    Args:
        owner_id: User ID.
        title: Session title.

    Returns:
        Session dict.
    """
```

**Rules:**

- Keep it concise
- Args/Returns for complex functions only
- Skip for trivial getters/setters

### 5. Inline Comments

English comments placed ABOVE the code:

```python
# Create new dict to trigger SQLAlchemy change detection
data = dict(doc.data)

# Auto-set first user message as session title
if len(user_messages) == 1 and role == ChatRole.USER:
    data["title"] = content[:50]
```

**Rules:**

- Comment ABOVE code, never beside it
- Blank line between code blocks
- For complex logic, add reason:

```python
# Use low temperature for stable JSON output.
# High temperature causes unstable JSON format, increasing parse failure risk.
response = await self._openai_service.chat_completion(
    messages=[{"role": "user", "content": prompt}],
    temperature=0.1,
)
```

### 6. Section Dividers

Use three-line box dividers (60 `=` characters) to group related methods within a class:

```python
class ChatHistoryService:

    # ============================================================
    # Session CRUD
    # ============================================================

    async def create_session(self, ...) -> dict:
        ...

    async def list_sessions(self, ...) -> list[dict]:
        ...

    # ============================================================
    # Message Operations
    # ============================================================

    async def append_message(self, ...) -> dict | None:
        ...

    # ============================================================
    # Private Helpers
    # ============================================================

    async def _get_session_doc(self, ...) -> UniversalDocument | None:
        ...
```

### 7. Import Comments

**Do NOT comment obvious imports.** Only add comments for non-obvious choices:

```python
# Use TYPE_CHECKING to avoid circular imports
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.azure.openai import AzureOpenAIService
```

---

## Part B: TypeScript / TSX

> **File header format** → see [file-templates.md](../../workflows/rag-dev-v3/file-templates.md) § 三

### 3. Function / Hook Comments (JSDoc)

Use JSDoc above exported functions:

```tsx
/**
 * Handle message sending with streaming response management.
 */
export function useChatStream(baseUrl: string) { ... }

/**
 * Format confidence value as percentage display.
 */
function formatConfidence(value: number): string { ... }
```

**Rules:**

- Keep it concise — no `@param` / `@returns` unless the types are non-obvious
- Use for exported functions and complex internal functions

### 4. Inline Comments

English comments placed ABOVE the code:

```tsx
// Scroll to latest message
scrollRef.current?.scrollIntoView({ behavior: "smooth" });

// Generate unique message ID using nanoid
const msgId = nanoid();
```

**Rules:**

- Comment ABOVE code, never beside it
- Blank line between code blocks
- Skip trivial comments — do NOT comment obvious JSX structure

### 5. Import Comments

**Do NOT comment obvious imports:**

```tsx
// Using nanoid instead of uuid for lighter weight in frontend
import { nanoid } from "nanoid";
```

---

## Comment Checklist

Before finishing, verify per language:

### Python

- [ ] File header follows [file-templates.md](../../workflows/rag-dev-v3/file-templates.md) format
- [ ] Class docstrings are concise one-liners
- [ ] Function docstrings are clear and concise
- [ ] Complex functions include Args/Returns
- [ ] Inline comments are above code, not beside it
- [ ] Section dividers used for method groups in classes
- [ ] Obvious imports are NOT commented

### TypeScript / TSX

- [ ] File header follows [file-templates.md](../../workflows/rag-dev-v3/file-templates.md) format
- [ ] Exported functions have JSDoc comments
- [ ] Inline comments are above code, not beside it
- [ ] Obvious imports are NOT commented
- [ ] Trivial JSX structure is NOT commented
