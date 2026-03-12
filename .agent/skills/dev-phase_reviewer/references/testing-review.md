# Testing Review Checklist

Applies to: `testing`

## Coverage

- [ ] Total coverage meets the phase threshold.
- [ ] Core business logic coverage is strong enough for the phase.
- [ ] No important happy path or error path is left untested without explanation.

## Test completeness

- [ ] Public behavior is covered for the changed or critical modules.
- [ ] Boundary cases are covered.
- [ ] Failure paths are covered.
- [ ] External dependencies are isolated where appropriate.

## Test quality

- [ ] Test names describe behavior and expected outcome.
- [ ] Tests use clear Arrange-Act-Assert structure.
- [ ] Tests are isolated and order-independent.
- [ ] Mocks or fakes are appropriate and do not hide the real contract.
- [ ] Reviewer confirmed textbook references were read before test design and before review.
- [ ] Test files or review artifacts make the textbook basis traceable.
- [ ] If textbook lookup was skipped or backfilled late, `docs/process/textbook-compliance-log.md` was updated.

## Approval

- Approve only if tests pass, coverage is acceptable, and no blocking quality issues remain.
