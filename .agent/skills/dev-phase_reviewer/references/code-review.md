# Code Review Checklist

Applies to: `backend`, `frontend`, `review`

## Automatic checks

- Run lint, format, type, test, and security checks appropriate to the stack.

## Blocking checks

- [ ] No hard-coded credentials or secrets.
- [ ] No unsafe input handling or obvious injection paths.
- [ ] New or changed behavior has matching tests.
- [ ] Reviewer confirmed textbook references were read before implementation and before review.
- [ ] If textbook lookup was skipped or backfilled late, `docs/process/textbook-compliance-log.md` was updated.

## High-severity quality checks

- [ ] Architecture and layering match repository design.
- [ ] Public behavior matches documented contracts.
- [ ] Error handling is explicit and non-silent.
- [ ] Naming and types are clear enough for maintenance.

## Medium-severity quality checks

- [ ] Complexity is reasonable for the scope.
- [ ] Duplication is justified or removed.
- [ ] User-facing errors are understandable.
- [ ] Review report summarizes the textbook basis for the decision.

## Approval

- Approve only if there are no `CRITICAL` or `HIGH` findings.
