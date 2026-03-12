---
name: dev-phase_reviewer
description: Phase review gate for development workflow. Use when completing any /dev phase, validating outputs before moving on, or generating a phase review report.
---

# Phase Reviewer

Mandatory review gate for every `/dev` phase.

## Core rules

1. Reviewer must differ from the author.
2. Review must be strict and independent.
3. Any deliverable change after review requires re-review.
4. Review results must be persisted to `docs/reviews/phase-{NN}-{phase_key}.md`.
5. Reviewer must read mapped textbook references before reviewing.
6. Reviewer must verify textbook compliance and update `docs/process/textbook-compliance-log.md` if the process was violated.

## Reviewer assignment

| Phase | Author | Reviewer |
| --- | --- | --- |
| `requirements` | Alice (PM) | Bob (Architect) |
| `prd` | Alice (PM) | Bob (Architect) |
| `architecture` | Bob (Architect) | Charlie (Tech Lead) |
| `stories` | Charlie (Lead) | Bob (Architect) |
| `database` | Bob (Architect) | David (Backend) |
| `backend` | David (Backend) | Grace (Reviewer) |
| `frontend` | Eve (Frontend) | Grace (Reviewer) |
| `testing` | Frank (QA) | Charlie (Tech Lead) |
| `review` | Grace (Reviewer) | Charlie (Tech Lead) |
| `deployment` | Henry (DevOps) | Bob (Architect) |

## Phase to checklist mapping

| Phase | Review type | Checklist |
| --- | --- | --- |
| `requirements` | document | `references/document-review.md` |
| `prd` | document | `references/document-review.md` |
| `architecture` | document | `references/document-review.md` |
| `stories` | document | `references/document-review.md` |
| `database` | document | `references/document-review.md` |
| `backend` | code | `references/code-review.md` |
| `frontend` | code | `references/code-review.md` |
| `review` | code | `references/code-review.md` |
| `testing` | testing | `references/testing-review.md` |
| `deployment` | deployment | `references/deployment-review.md` |

## Workflow

1. Read the current phase from `.dev-state.yaml`.
2. Determine the reviewer from the table above.
3. Determine the review type and checklist.
4. Read `.agent/config/textbook-skill-mapping.yaml`.
5. Resolve relevant topics with `textbooks/topic_index.json`.
6. Read the relevant textbook excerpts under `data/mineru_output/`.
7. Run automatic validation for the phase.
8. Execute the checklist, including textbook-compliance checks.
9. If textbook lookup was skipped or backfilled late, append an entry to `docs/process/textbook-compliance-log.md`.
10. Generate or update `docs/reviews/phase-{NN}-{phase_key}.md`.
11. If any `CRITICAL` or `HIGH` finding exists, block the phase and require re-review after fixes.
12. Update `.dev-state.yaml` only after the review gate passes.

## Automatic validation

| Phase | Validation |
| --- | --- |
| `requirements` | output document exists and is non-empty |
| `prd` | output document exists and is non-empty |
| `architecture` | output document exists and is non-empty |
| `stories` | output document exists and is non-empty |
| `database` | output document exists |
| `backend` | `uv run ruff check app/`, `uv run pytest --tb=short` in `backend/` |
| `frontend` | project-specific frontend validation |
| `testing` | tests pass and coverage meets threshold |
| `review` | no blocking review findings remain |
| `deployment` | deployment config exists |

## Output requirements

Review reports must include:
- automated validation results
- findings ordered by severity
- textbook basis summary
- final conclusion
- re-review section if fixes were made after initial review
