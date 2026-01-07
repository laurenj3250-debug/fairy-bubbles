# Step 3: Identify the Gotchas

What's unique about THIS task that could bite you?

## Frontend UI

- [ ] Responsive breakpoints needed? (mobile, tablet, desktop)
- [ ] Component states documented? (hover, active, disabled, loading, error, empty)
- [ ] Animation/transition requirements?
- [ ] Design system consistency? (using existing components?)
- [ ] Browser compatibility issues?
- [ ] Keyboard navigation/focus management?
- [ ] Form validation (client AND server)?
- [ ] Loading states for async operations?
- [ ] Error boundaries for failures?
- [ ] SEO/meta tags if applicable?

## Backend API

- [ ] Database schema changes needed?
- [ ] API versioning required?
- [ ] Rate limiting considerations?
- [ ] Caching strategy? (what, where, how long, invalidation)
- [ ] Validation requirements? (input sanitization)
- [ ] Error response format consistent?
- [ ] Pagination for list endpoints?
- [ ] Authentication/authorization checks?
- [ ] Logging for debugging?
- [ ] Timeout handling?

## Bug Fix

- [ ] What's the actual root cause? (not just symptom)
- [ ] What other code paths might have same bug?
- [ ] What regression test prevents this recurring?
- [ ] What was the original assumption that failed?
- [ ] Who else needs to know about this?
- [ ] Is this a symptom of a larger problem?
- [ ] Could the fix break something else?

## Refactoring

- [ ] Is there test coverage BEFORE I touch this?
- [ ] Can I do this incrementally? (smaller PRs)
- [ ] What depends on the current interface?
- [ ] How do I maintain backward compatibility?
- [ ] What's my rollback plan?
- [ ] Am I changing behavior or just structure?
- [ ] Will this affect performance?

## Database Migration

- [ ] Can this run without downtime?
- [ ] Is the migration reversible?
- [ ] What's the data integrity check?
- [ ] Performance impact on large tables?
- [ ] Rollback procedure?
- [ ] Need to backfill existing data?
- [ ] Index changes needed?
- [ ] Foreign key implications?

## Third-Party Integration

- [ ] What are the API rate limits?
- [ ] How do I handle API failures gracefully?
- [ ] What's the retry strategy?
- [ ] How do I test without hitting production API?
- [ ] Secrets/credentials management?
- [ ] Webhook reliability? (idempotency)
- [ ] API versioning/deprecation?
- [ ] Timeout and circuit breaker?

## Performance Optimization

- [ ] What's the current baseline? (measure first!)
- [ ] Where's the actual bottleneck? (profile, don't guess)
- [ ] What's the target improvement?
- [ ] How do I verify the improvement?
- [ ] Could this optimization break something?
- [ ] Trade-offs? (memory vs speed, complexity vs performance)
- [ ] Will this hold at 10x scale?

## New Feature

- [ ] Feature flag needed?
- [ ] Analytics/tracking requirements?
- [ ] Documentation updates?
- [ ] Does this change user workflows?
- [ ] Migration for existing users?
- [ ] A/B testing considerations?
- [ ] Rollback strategy?

## Output

List the specific gotchas for YOUR task:

```
GOTCHAS FOR THIS TASK:
1. [Specific thing that could go wrong]
2. [Another thing to watch out for]
3. [Edge case that must be handled]
...
```

These become your checklist during implementation.
