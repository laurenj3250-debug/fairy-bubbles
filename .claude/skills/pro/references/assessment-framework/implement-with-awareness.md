# Step 5: Implement with Awareness

Build with the unique context in mind.

## For Each Piece

### Does this fit the patterns I discovered?

- Am I following existing conventions?
- Does my code look like the code around it?
- Am I reinventing something that exists?

**Don't be "clever."** Be consistent.

### Am I handling the gotchas I identified?

Review your gotchas list from Step 3. For each one:
- [ ] Explicitly handled
- [ ] Tested
- [ ] Documented if non-obvious

### Is this integrated properly?

Not orphaned code that nothing uses:
- [ ] Imported where needed
- [ ] Exported if others need it
- [ ] Called from the right places
- [ ] Accessible to users (routes, navigation, buttons)

### Does this handle the edge cases?

For THIS task's specific edge cases:
- [ ] Empty/null inputs
- [ ] Error conditions
- [ ] Boundary conditions
- [ ] Concurrent access (if applicable)

### Am I creating new problems?

Every change can introduce issues:
- Performance regressions?
- Security vulnerabilities?
- Breaking changes?
- Technical debt?

## Integration Checklist

### Code Integration

- [ ] New code imported/exported correctly
- [ ] No circular dependencies introduced
- [ ] Types/interfaces updated if needed
- [ ] Consistent with existing error handling

### Route/Navigation Integration

- [ ] Routes added to router
- [ ] Navigation links added
- [ ] Breadcrumbs updated (if applicable)
- [ ] Deep links work

### State Integration

- [ ] State updates propagate correctly
- [ ] No stale state issues
- [ ] Cache invalidation handled
- [ ] Optimistic updates (if applicable)

### API Integration

- [ ] Frontend calls backend correctly
- [ ] Error responses handled
- [ ] Loading states shown
- [ ] Authentication headers included

### User Access

Can users actually reach this feature?
- [ ] Button/link to access it exists
- [ ] Permissions checked
- [ ] Feature discoverable

## Blocked Patterns (Never Do)

| Pattern | Why It's Blocked |
|---------|------------------|
| `// TODO: implement later` | Ship complete or don't ship |
| `return mockData` | Real implementation or nothing |
| Happy-path only | Handle errors and edge cases |
| `console.log` debugging | Clean up before commit |
| Orphaned code | If nothing uses it, don't write it |
| Ignoring gotchas | You identified them for a reason |

## Quality Checklist During Implementation

Before moving to next step:

- [ ] Does it work? (manual test)
- [ ] Is it tested? (automated test)
- [ ] Is it integrated? (not orphaned)
- [ ] Is it clean? (no debug code, no TODOs)
- [ ] Does it handle errors? (not just happy path)
- [ ] Does it follow patterns? (consistent with codebase)

## When You Hit Problems

1. **Step back** - Is this the right approach?
2. **Check assumptions** - What am I assuming that might be wrong?
3. **Consult gotchas** - Did I miss something I identified earlier?
4. **Ask for help** - If stuck > 30 min (see ask-vs-decide)

## The Implementation Mindset

Don't just make it work. Make it:
- **Correct** - Does what it should
- **Complete** - Handles all cases
- **Clean** - Readable and maintainable
- **Connected** - Integrated properly
