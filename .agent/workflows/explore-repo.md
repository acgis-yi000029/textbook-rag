---
description: Explore reference GitHub repositories in .github/ directory
---

# Explore Repository Workflow

Use this workflow to explore AI agent configuration examples from cloned repositories.

## Available Repositories

| Repository                        | Description                |
| --------------------------------- | -------------------------- |
| `awesome-claude-prompts`          | Claude prompt templates    |
| `courses`                         | Anthropic official courses |
| `anthropic-cookbook`              | Claude API examples        |
| `claude-code-action`              | GitHub Actions integration |
| `prompt-eng-interactive-tutorial` | Prompt engineering guide   |

## Steps

1. List repository structure:

   ```
   find_by_name in .github/[repo-name]/
   ```

2. Read README:

   ```
   view_file .github/[repo-name]/README.md
   ```

3. Find key configuration files:
   - Look for `CLAUDE.md`, `.windsurfrules`, `.kiro/` directories
   - Look for `*.ipynb` notebooks for examples
   - Look for `prompts/`, `examples/`, `templates/` directories

4. Summarize findings in format:

   ```markdown
   ## 📂 Repository: [name]

   **Purpose:** Brief description

   **Key Files:**

   - `path/to/file` - Description

   **💡 Best Practice:** Key takeaway
   ```

## Usage Examples

- "Explore awesome-claude-prompts for prompt templates"
- "Find API examples in anthropic-cookbook"
- "Learn prompt engineering from prompt-eng-interactive-tutorial"
