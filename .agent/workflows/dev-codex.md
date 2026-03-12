# Dev Workflow for Codex

This file bridges the legacy `/dev` command vocabulary to Codex execution behavior.

## Core rule

Interpret `/dev` phrases as workflow intents, not shell commands.

## Model recommendation

When reporting phase status, remind the user which model is recommended for the current phase:

| Phases | Recommended Model | Reason |
| --- | --- | --- |
| `requirements`, `prd`, `architecture`, `stories` | **Opus** | Complex reasoning, planning, cross-referencing |
| `database`, `backend`, `frontend`, `testing` | **Sonnet** | Fast code generation, well-defined specs already exist |
| `review`, `deployment` | **Sonnet** | Checklist execution, straightforward tasks |

Include a one-line reminder like `💡 推荐模型: Sonnet（代码阶段）` in status reports.

Examples:

- `/dev start` means resume or execute the phased development workflow
- `/dev start status` means summarize `.dev-state.yaml`
- `/dev start goto backend` means move the active phase to `backend`
- `/dev review` means perform a review workflow, not run a terminal command named `review`
- `/dev test` means execute the repository testing workflow

## Session start behavior

When the user asks to continue the dev workflow:

1. Read `.dev-state.yaml`.
2. Summarize completed, in-progress, and not-started phases.
3. Determine the current phase using these rules:
   - Resume any `in_progress` phase.
   - Otherwise start the first phase whose status is neither `completed` nor `skipped`.
   - If the state file is missing, initialize from `requirements`.
4. Before advancing, verify that previously completed phases still have their expected outputs and review files.
5. Execute only the current phase unless the user explicitly asks for automatic continuation.

## Canonical phase order

`requirements -> prd -> architecture -> stories -> database -> backend -> frontend -> testing -> review -> deployment`

Do not skip forward unless the user explicitly requests skip or goto behavior.

## Phase execution contract

For each phase:

1. Read the corresponding step file from `.agent/workflows/full-development-steps/`.
2. Read any directly relevant role or checklist files.
3. Read `.agent/config/textbook-skill-mapping.yaml`, resolve topics via `textbooks/topic_index.json`, and read the relevant textbook excerpts under `data/mineru_output/` before producing phase outputs.
4. Prefer existing templates from `.agent/templates/` and scripts from `.agent/scripts/`.
5. Produce or update the expected deliverables for that phase.
6. Run the required validation checks.
7. Invoke the review gate by following `.agent/skills/dev-phase_reviewer/SKILL.md`.
8. Mark the phase complete in `.dev-state.yaml` only after the review gate passes.

## Review gate

Every phase requires review before completion.

- Review reports live at `docs/reviews/phase-{NN}-{phase_key}.md`
- Any `CRITICAL` or `HIGH` issue blocks completion
- Any post-review deliverable change requires re-review
- Reviewer role must differ from the author role

If a review artifact or deliverable is inconsistent with the current files, treat the phase as needing re-validation.

## Supported `/dev` intent mappings

### `/dev start`

- Resume the workflow from `.dev-state.yaml`
- Follow the current phase contract

### `/dev start auto`

- Continue phase-by-phase without pausing after each successful phase
- Stop on any blocking review issue, failed validation, or missing requirement

### `/dev start status`

- Read `.dev-state.yaml`
- Report phase statuses and identify the next actionable phase

### `/dev start goto <phase_key>`

- Validate `<phase_key>` against the canonical phase list
- Update `.dev-state.yaml` carefully without deleting historical review references
- Treat the selected phase as the current phase

### `/dev start skip`

- Mark only the current phase as `skipped`
- Advance to the next phase in canonical order

### `/dev start reset`

- Reinitialize `.dev-state.yaml` to the beginning of the workflow
- Do not delete existing deliverables or review docs unless explicitly requested

### `/dev plan`

- Produce a concrete implementation plan
- Do not write code until the user confirms the plan

### `/dev fix`

- Diagnose build, lint, type, or test failures
- Fix root causes incrementally
- Re-run validations after each fix batch

### `/dev test`

- Execute the repository test workflow
- Prefer TDD when adding or changing behavior
- Report coverage or testing gaps if full validation cannot be run

### `/dev review`

- Review current changes with a code-review mindset
- Prioritize bugs, regressions, risks, and missing tests

### `/dev git`

- Perform only the requested Git action
- Never rewrite or discard user changes unless explicitly requested

## Windows command policy

When this workflow requires shell commands on Windows:

- Use PowerShell syntax
- Use `uv run python ...` instead of `python ...`
- Use the command tool working directory instead of `cd`
- Use `;` rather than `&&` or `||`

## Textbook-backed implementation policy

For every workflow phase and every skill-driven coding, testing, review, or planning task:

1. Read `.agent/config/textbook-skill-mapping.yaml`
2. Resolve topics via `textbooks/topic_index.json`
3. Read the relevant textbook markdown under `data/mineru_output/`
4. Use concise source attribution where appropriate
5. If work started before textbook lookup, stop, record the miss in `docs/process/textbook-compliance-log.md`, then restart from the textbook step

If no relevant textbook basis is available, state that limitation explicitly before proceeding with substantial generated implementation.
