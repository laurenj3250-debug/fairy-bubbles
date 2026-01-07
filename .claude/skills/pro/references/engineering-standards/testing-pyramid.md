# Testing Pyramid

A balanced test suite with enforced ratios and size limits.

## Required Ratios

### Standard Applications

```
        /\
       /  \     10% E2E
      /────\
     /      \   20% Integration
    /────────\
   /          \ 70% Unit
  /────────────\
```

### Microservices

```
        /\
       /  \     10% E2E
      /────\
     /      \   30% Integration (more service boundaries)
    /────────\
   /          \ 60% Unit
  /────────────\
```

## Test Size Limits (Enforced)

| Size | Time Limit | Network | Database | External Services |
|------|-----------|---------|----------|-------------------|
| Small (Unit) | 60s | NO | NO | NO |
| Medium (Integration) | 300s | localhost only | YES | Discouraged |
| Large (E2E) | 900s | YES | YES | YES |

**Tests exceeding time limits should be optimized or split.**

## Test Types by Change

| Change Type | Unit | Integration | E2E | Load |
|-------------|------|-------------|-----|------|
| Bug fix | ✓ Regression | If affected | - | - |
| New endpoint | ✓ Logic | ✓ Contract | - | If critical path |
| New feature | ✓ Components | ✓ Flows | ✓ User journey | If user-facing |
| Schema change | ✓ Models | ✓ Queries | - | ✓ Migration |
| Refactor | ✓ Existing pass | ✓ Existing pass | ✓ Existing pass | - |
| Performance fix | ✓ | ✓ | - | ✓ Before/after |

## Unit Test Standards

### What to Test

```
ALWAYS TEST:
├─ Business logic
├─ Edge cases (null, empty, boundary values)
├─ Error conditions
├─ State transitions
└─ Pure functions

DON'T UNIT TEST:
├─ Framework code (trust the framework)
├─ Simple getters/setters
├─ Configuration
├─ Third-party libraries
└─ Glue code with no logic
```

### Structure (AAA Pattern)

```typescript
describe('calculateDiscount', () => {
  it('applies 10% discount for orders over $100', () => {
    // Arrange
    const order = { total: 150 };

    // Act
    const result = calculateDiscount(order);

    // Assert
    expect(result).toBe(15);
  });
});
```

## Integration Test Standards

### What to Test

```
ALWAYS TEST:
├─ API contracts (request/response shapes)
├─ Database queries (actual SQL, not mocked)
├─ Service-to-service communication
├─ Authentication/authorization flows
└─ Cache behavior

DON'T INTEGRATION TEST:
├─ UI rendering (use E2E)
├─ Business logic (use unit tests)
└─ Third-party API internals
```

### Isolation Strategy

```
PER-TEST ISOLATION:
├─ Fresh database state (truncate or transaction rollback)
├─ Mocked external services (WireMock, MSW)
├─ Isolated cache instance
└─ Clean environment variables
```

## E2E Test Standards

### What to Test

```
ALWAYS TEST:
├─ Critical user journeys (signup, checkout, etc.)
├─ Happy paths for core features
├─ Integration between frontend and backend
└─ Real browser behavior

LIMIT E2E FOR:
├─ Edge cases (use unit tests)
├─ Error handling details (use integration)
├─ Performance (use load tests)
└─ Every permutation (too slow, too flaky)
```

### Best Practices

```
E2E RULES:
├─ Test user outcomes, not implementation
├─ Use stable selectors (data-testid, not CSS classes)
├─ Wait for conditions, not arbitrary timeouts
├─ One logical assertion per test
└─ Independent tests (no shared state)
```

## Flakiness Tolerance

```
THRESHOLDS:
├─ Acceptable: < 0.15% flake rate
├─ Warning: 0.15% - 1% (must fix within 1 week)
├─ Critical: > 1% (quarantine immediately)
└─ Quarantined tests don't block CI but must be fixed
```

**Tests approaching 1% flakiness lose value and should be fixed or removed.**

### Common Flakiness Causes

| Cause | Fix |
|-------|-----|
| Timing/race conditions | Use proper waits, not sleep |
| Shared state | Isolate test data |
| External dependencies | Mock or use test doubles |
| Time-dependent logic | Use fixed time in tests |
| Resource exhaustion | Clean up after tests |

## Coverage Requirements

```
MINIMUM COVERAGE:
├─ Overall: 80%
├─ Critical paths: 95%
├─ New code: 90%
└─ Bug fixes: 100% (regression test required)

COVERAGE IS NECESSARY BUT NOT SUFFICIENT:
├─ 100% coverage ≠ 100% tested
├─ Focus on behavior coverage, not line coverage
└─ Untested edge cases can exist at 100% coverage
```

## Test Organization

```
tests/
├── unit/
│   └── [mirrors src/ structure]
├── integration/
│   ├── api/
│   ├── database/
│   └── services/
└── e2e/
    ├── journeys/
    └── features/
```

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Ice cream cone (many E2E, few unit) | Slow, flaky | Invert the pyramid |
| Mocking everything | Tests pass, prod fails | Use real dependencies in integration |
| Test duplication | Redundant coverage | Each behavior tested once at right level |
| Testing implementation | Brittle tests | Test behavior, not internals |
| No assertions | False confidence | Every test must assert something |
