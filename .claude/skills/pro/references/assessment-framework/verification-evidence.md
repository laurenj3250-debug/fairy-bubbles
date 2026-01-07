# Step 6: Verify Against Requirements

Did you actually complete what THIS task needed?

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

This is non-negotiable. Violating it breaks trust.

## Task-Specific Verification

### Does it meet the specific acceptance criteria?

Go back to Step 1. For each criterion:
- [ ] Verified working
- [ ] Evidence captured

### Did I handle the edge cases I identified?

Go back to Step 3. For each edge case:
- [ ] Tested
- [ ] Working

### Did I address the gotchas I found?

Go back to Step 3. For each gotcha:
- [ ] Handled
- [ ] Verified

### Is it integrated with all the pieces I mapped?

Go back to Step 2. For each integration point:
- [ ] Connected
- [ ] Working

### Does it work in the actual environment?

Not just tests. Actually works:
- [ ] Local development environment
- [ ] Staging/preview (if available)
- [ ] Different browsers (if frontend)
- [ ] Different screen sizes (if UI)

### Would I bet money this works in production?

If the answer is anything other than "yes," you're not done.

## Evidence Gate (5-Step Protocol)

For every completion claim:

```
1. IDENTIFY → What command/action proves this claim?
2. RUN      → Execute it (fresh, not cached)
3. READ     → Check output and exit code
4. VERIFY   → Does output confirm the claim?
5. CLAIM    → Only now state completion WITH evidence
```

**Skipping any step = lying, not verifying**

## Evidence Requirements by Claim

| Claim | Required Evidence |
|-------|-------------------|
| "Tests pass" | Test output showing 0 failures, exit code 0 |
| "Build succeeds" | Build command output with exit code 0 |
| "Bug fixed" | Test of original symptom now passing |
| "Feature complete" | Each acceptance criterion checked |
| "No regressions" | Full test suite green |
| "Deployed" | Deployment logs + smoke test |

## Red Flag Language

If you catch yourself saying:

| Red Flag | Reality Check |
|----------|---------------|
| "Should work now" | Did you verify? Run the test. |
| "I'm confident" | Confidence ≠ evidence. Prove it. |
| "Probably fixed" | Probably isn't definitely. Verify. |
| "I think it's done" | Think isn't know. Test it. |
| "Looks good" | Looks aren't proof. Run it. |

## Verification Checklist

### Automated Verification

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Linter passes
- [ ] Type checker passes
- [ ] Build succeeds

### Manual Verification

- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] Error states work correctly
- [ ] UI looks correct (if applicable)
- [ ] Performance acceptable

### Integration Verification

- [ ] New code is reachable
- [ ] State updates work
- [ ] API calls succeed
- [ ] Data persists correctly

## Before Claiming Done

Answer these questions honestly:

1. Have I verified every acceptance criterion?
2. Have I run the tests (not just assumed they pass)?
3. Have I manually tested the feature?
4. Have I checked edge cases?
5. Would I be comfortable if this deployed right now?

If any answer is "no" or "I think so," you're not done.

## The Completion Statement

When you're actually done, say:

```
VERIFIED:
- Tests pass: [command output or screenshot]
- Build succeeds: [exit code 0]
- Feature works: [description of manual test]
- Edge cases: [list of cases tested]
- Integration: [confirmation of connection points]
```

Not "I think it's done." Evidence.
