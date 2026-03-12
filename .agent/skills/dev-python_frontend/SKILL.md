---
name: dev-python_frontend
description: Python frontend skill for this repository. Use when working on Streamlit, Gradio, or NiceGUI interfaces, Python-driven UI state, layout, styling, interaction flows, frontend bug fixes, or frontend-focused reviews in this project.
---

# Python Frontend

Use this skill for the Python UI layer in this repository.

Current frontend implementations in `frontend/src/`:

- `app.py` for Streamlit
- `app_gradio.py` for Gradio
- `app_nicegui.py` for NiceGUI

Prefer this skill over the JavaScript/TypeScript frontend skill unless the user explicitly asks for a JS frontend stack.

## Core rules

1. Treat the frontend as Python application code, not as a React or Next.js project.
2. Before substantial frontend edits, first create or update a frontend codemap that maps stories to views, components, state flow, and backend contracts.
3. Follow repository command rules on Windows:
   - use `uv run python ...`
   - do not use `cd`
   - use the command tool working directory instead
4. Preserve the existing framework of the target file unless the user explicitly asks to migrate frameworks.
5. Keep UI logic readable and modular. Extract helpers when a view function starts carrying transport, formatting, and rendering concerns at once.
6. Prefer safe text rendering by default. Only use raw HTML injection when necessary and review it carefully.

## Framework routing

Choose the framework path based on the file being edited:

- `frontend/src/app.py` -> Streamlit workflow
- `frontend/src/app_gradio.py` -> Gradio workflow
- `frontend/src/app_nicegui.py` -> NiceGUI workflow

If a task affects more than one frontend entrypoint, keep shared behavior consistent across implementations.

## Streamlit workflow

Use for `frontend/src/app.py`.

Focus areas:

- page structure with `st.set_page_config`, layout containers, sidebar, forms
- `st.session_state` for UI state
- caching where appropriate
- minimizing duplicated render logic
- careful use of `unsafe_allow_html=True`

Validation ideas:

- `uv run python -m py_compile frontend/src/app.py`
- framework-specific smoke review of imports, state keys, and render paths

## Gradio workflow

Use for `frontend/src/app_gradio.py`.

Focus areas:

- `gr.Blocks` composition
- explicit input/output wiring
- event handlers with predictable signatures
- reusable helper functions for formatting and API calls
- CSS kept localized and intentional

Validation ideas:

- `uv run python -m py_compile frontend/src/app_gradio.py`
- verify event chains and component outputs still match

## NiceGUI workflow

Use for `frontend/src/app_nicegui.py`.

Focus areas:

- clear component tree structure
- event callbacks that stay small and testable
- separation between data-fetching helpers and UI-building functions
- styling consolidated in shared constants where possible

Validation ideas:

- `uv run python -m py_compile frontend/src/app_nicegui.py`
- verify callback wiring and app startup path

## Review checklist

When reviewing Python frontend changes, check these first:

- UI framework matches the target file and existing architecture
- no JS-stack assumptions leaked into the implementation
- user input, query params, and rendered content are handled safely
- repeated markup or widget-building logic is factored when it starts obscuring intent
- state transitions are explicit and not spread across unrelated callbacks
- error messages are user-readable and actionable
- loading, empty, success, and failure states are all covered
- styling changes are coherent with the existing visual language of that frontend entrypoint

## Textbook-backed guidance

Before substantial UI or architecture changes, consult:

- `.agent/config/textbook-skill-mapping.yaml`
- `textbooks/topic_index.json`
- relevant markdown in `data/mineru_output/`

Use concise references where appropriate, for example:

```python
# Ref: Ramalho, Fluent Python, Ch5 - first-class functions for callback organization
# Ref: Krug, Don't Make Me Think - clear navigation and reduced cognitive load
```

## Output expectations

For implementation tasks:

- keep changes framework-specific and minimal
- preserve working entrypoints
- run lightweight validation where feasible

For review tasks:

- prioritize bugs, regressions, unsafe rendering, and state-management mistakes
- mention missing validation or testing if you could not run framework-level checks
