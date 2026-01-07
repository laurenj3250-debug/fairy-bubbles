# Step 4: Plan the Fit

How do the pieces come together for THIS task?

## Task-Specific Plan

### What needs to happen in what order?

Break down into discrete steps:

```
EXAMPLE: Add user settings page

1. [ ] Create settings API endpoint
2. [ ] Add settings schema/types
3. [ ] Build settings form component
4. [ ] Wire form to API
5. [ ] Add route and navigation
6. [ ] Handle error states
7. [ ] Add loading states
8. [ ] Write tests
```

### What are the dependencies?

```
[Schema] ──→ [API] ──→ [Frontend] ──→ [Tests]
              ↓
         [Error handling]
```

What must be done before what? Identify the critical path.

### What can I do incrementally?

| All-at-Once | Incremental |
|-------------|-------------|
| Risky | Safer |
| Big PR | Small PRs |
| Hard to review | Easy to review |
| Hard to rollback | Easy to rollback |

Prefer incremental. Each step should be:
- Deployable (doesn't break anything)
- Testable (can verify it works)
- Reviewable (small enough to understand)

### What tests prove each step works?

For each step, define:
- How do I know this works?
- What test can I write?
- What manual verification?

## Risk Mitigation

### What could go wrong at each step?

| Step | Risk | Mitigation |
|------|------|------------|
| Schema change | Data loss | Backup first, test migration |
| API change | Break clients | Version the API |
| UI change | User confusion | Feature flag, gradual rollout |

### How do I detect if something breaks?

- Automated tests (unit, integration, E2E)
- Monitoring/alerting
- Manual smoke tests
- User feedback channels

### What's my rollback plan?

**Before you start, know how to undo:**
- Git revert?
- Feature flag disable?
- Database rollback?
- Config change?

If you can't answer this, you're not ready to start.

### What's the blast radius?

If step 3 fails:
- What breaks?
- Who is affected?
- How do we recover?

## Output

A specific plan for THIS task:

```
IMPLEMENTATION PLAN:

Step 1: [Description]
- Files: [list]
- Test: [how to verify]
- Rollback: [how to undo]

Step 2: [Description]
- Depends on: Step 1
- Files: [list]
- Test: [how to verify]
- Rollback: [how to undo]

...

RISKS:
- [Risk 1]: [Mitigation]
- [Risk 2]: [Mitigation]

ROLLBACK STRATEGY:
[How to undo the entire change if needed]
```

## When to Use writing-plans Skill

Invoke `writing-plans` skill if:
- Task is complex (multi-day)
- Multiple valid approaches exist
- Architectural decisions involved
- Need formal documentation
- Team needs to review approach first

## Common Planning Mistakes

1. **No order** - Just a list of things with no sequence
2. **Missing dependencies** - Steps that can't work without others
3. **No verification** - No way to know if step worked
4. **No rollback** - No plan for when things go wrong
5. **Too big** - Steps that can't be done incrementally
