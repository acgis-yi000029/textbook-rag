---
name: code-comment
description: English code comment standards for Python and TypeScript. Use when (1) adding comments to code, (2) standardizing comment format, (3) TypeScript/TSX file header comments, (4) Python module docstrings
---

# Code Comment Standards

## Objectives

- Add clear, English-only comments to code
- Follow consistent comment formatting rules per language (Python / TypeScript)
- Explain complex logic with reasons
- Maintain clear code documentation

## Shared Principles (All Languages)

| Principle           | Rule                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| Language            | English only                                                               |
| File header         | Name + description + metadata tags                                         |
| Header content      | Describe **what** it is, NOT **how** it's implemented                      |
| Forbidden in header | ❌ User Story IDs (e.g. `US-107`) — belong in Git commits                  |
| Forbidden in header | ❌ Implementation details (e.g. "uses shadcn/ui") — self-evident from code |
| `@module` tag       | ✅ Required — matches directory path (e.g. `features/chat`, `core/config`) |
| `@template` tag     | ✅ Required — template from `.agent/templates/`, or `none` if no template  |
| `@reference` tag    | ✅ Required — external project or best practice source, or `none`          |
| Function docs       | Concise English docstring                                                  |
| Inline comments     | English, placed ABOVE code, not beside it                                  |
| Code spacing        | Blank line between code blocks                                             |

### ⚠️ Critical: `@template` and `@reference` Relationship

1. **If `@template` is set → `@reference` MUST also be set.**
   Every template was extracted from an external project. Open the template file, find its `@source` or `@reference`, and carry it forward.

2. **`@reference` path format**: Use `project-name/path/to/file` (file-level), NOT a URL.
   - ✅ `@reference rag-web-ui/frontend/src/lib/api.ts`
   - ✅ `@reference shadcn-admin/src/components/confirm-dialog.tsx`
   - ❌ `@reference https://github.com/xyb/rag-web-ui` (URL, not file path)
   - ❌ `@reference rag-web-ui` (project-level only, not specific enough)

3. **Only when `@template none` AND no external inspiration** → `@reference none`.

---

## Part A: Python

### 1. File-level Docstring

Every `.py` file MUST have a module docstring at the top, before imports.

**Standard format:**

```python
"""
ModuleName - Short description of what this module does

@module app/chat/service
@template A10 backend/domain/service.py — Generic CRUD Service Layer
@reference none
"""
```

**Field rules:**

| Field        | Required | Description                                                     |
| ------------ | -------- | --------------------------------------------------------------- |
| Line 1       | ✅       | `ModuleName - Brief description`                                |
| `@module`    | ✅       | Python module path matching directory (e.g. `app/chat/service`) |
| `@template`  | ✅       | Template ID + path, or `none` if no template applies            |
| `@reference` | ✅       | External reference project or best practice, or `none`          |

### 2. File-level Docstring Examples

**Service layer (with template):**

```python
"""
ChatHistoryService - Manages persistence of chat sessions and messages

@module app/chat/service
@template A10 backend/domain/service.py — Generic CRUD Service Layer
@reference none
"""
```

**Configuration module (with reference):**

```python
"""
AppConfig - Manages environment variables and application settings using pydantic-settings

@module app/core/config
@template none
@reference full-stack-fastapi-template/backend/app/core/config.py
@reference fastapi-best-practices §1 Project Structure
"""
```

**Azure integration (with template + reference):**

```python
"""
AzureOpenAIService - Provides LLM chat completion, streaming, and embedding generation

@module app/azure/openai
@template F3 backend/azure/openai_error.py — OpenAI Adapter + Streaming Chat
@reference azure-search-openai-demo/app/backend/approaches/
"""
```

**Business-specific module (no template, no reference):**

```python
"""
ChartDataExtractor - Extracts structured chart data from document content using LLM and regex fallback

@module app/research/service
@template none
@reference none
"""
```

**Route module:**

```python
"""
ChatRoutes - RESTful endpoints for chat session CRUD and message operations

@module app/chat/routes
@template A8 backend/domain/routes.py — FastAPI Router with Depends
@reference none
"""
```

**Schema module:**

```python
"""
ChatSchemas - Pydantic schemas for request/response validation in chat endpoints

@module app/chat/schemas
@template A9 backend/domain/schemas.py — Pydantic Request/Response Models
@reference none
"""
```

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

### 1. File-level JSDoc

Every `.tsx` / `.ts` file MUST have a JSDoc block at the top, before imports.

**Standard format:**

```tsx
/**
 * ComponentName - Short description of what this component does
 *
 * @module features/chat
 * @template .agent/templates/frontend/features/chat/chat-input.tsx.template
 * @reference none
 */
```

**Field rules:**

| Field        | Required | Description                                                                             |
| ------------ | -------- | --------------------------------------------------------------------------------------- |
| Line 1       | ✅       | `ComponentName - Brief description`                                                     |
| `@module`    | ✅       | Module path matching directory structure (e.g. `features/chat`, `shared/components/ui`) |
| `@template`  | ✅       | Template path, or `none` if no template applies                                         |
| `@reference` | ✅       | External reference project or best practice, or `none`                                  |

### 2. File-level JSDoc Examples

**Feature component aligned with template:**

```tsx
/**
 * ChatInput - Rich chat input with file upload, deep search toggle, and stop generation
 *
 * @module features/chat
 * @template .agent/templates/frontend/features/chat/chat-input.tsx.template
 * @reference none
 */
```

**Business-specific component (no template):**

```tsx
/**
 * ConfidenceIndicator - Visual indicator showing RAG response confidence level with color coding
 *
 * @module features/chat
 * @template none
 * @reference none
 */
```

**Shared UI component:**

```tsx
/**
 * ConfirmDialog - Reusable confirmation dialog with customizable title, message, and actions
 *
 * @module shared/components/ui
 * @template .agent/templates/frontend/shared/components/ui/confirm-dialog.tsx.template
 * @reference shadcn-admin/src/components/confirm-dialog.tsx
 */
```

**Custom Hook:**

```tsx
/**
 * useChatStream - Manages SSE streaming connection for chat messages with error handling
 *
 * @module features/chat/hooks
 * @template .agent/templates/frontend/features/chat/use-chat-stream.ts.template
 * @reference none
 */
```

**Page / View component:**

```tsx
/**
 * ChatPage - Main chat page view composing sidebar and chat interface
 *
 * @module features/chat/views
 * @template none
 * @reference none
 */
```

**Service / API layer:**

```tsx
/**
 * chatService - API client for chat-related endpoints including history and message sending
 *
 * @module features/chat/services
 * @template none
 * @reference none
 */
```

**Type definition file:**

```tsx
/**
 * ChatTypes - Shared type definitions for messages, conversations, and stream events
 *
 * @module features/chat/types
 * @template none
 * @reference none
 */
```

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

- [ ] File-level docstring has `ModuleName - Description` format
- [ ] `@module` tag matches Python module path
- [ ] `@template` tag present on every file (use `none` if no template)
- [ ] `@reference` tag present on every file (use `none` if no reference)
- [ ] No US IDs or implementation details in file header
- [ ] Class docstrings are concise one-liners
- [ ] Function docstrings are clear and concise
- [ ] Complex functions include Args/Returns
- [ ] Inline comments are above code, not beside it
- [ ] Section dividers used for method groups in classes
- [ ] Obvious imports are NOT commented

### TypeScript / TSX

- [ ] File-level JSDoc has `ComponentName - Description` format
- [ ] `@module` tag matches directory structure
- [ ] `@template` tag present on every file (use `none` if no template)
- [ ] `@reference` tag present on every file (use `none` if no reference)
- [ ] No US IDs or implementation details in file header
- [ ] Exported functions have JSDoc comments
- [ ] Inline comments are above code, not beside it
- [ ] Obvious imports are NOT commented
- [ ] Trivial JSX structure is NOT commented
