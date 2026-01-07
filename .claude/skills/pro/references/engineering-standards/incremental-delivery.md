# Incremental Delivery

Safe rollout strategies with clear criteria and rollback plans.

## Rollout Percentages

### Standard Rollout

```
0% → 2% → 10% → 50% → 100%

TIMELINE:
├─ 0% → 2%:   Internal testing (hours to 1 day)
├─ 2% → 10%:  Early adopters (1-2 days)
├─ 10% → 50%: Broader rollout (2-3 days)
└─ 50% → 100%: Full rollout (1-2 days)
```

### Conservative Rollout (High Risk)

```
0.1% → 1% → 5% → 10% → 25% → 50% → 100%

USE WHEN:
├─ Database migrations
├─ Payment/financial features
├─ Authentication changes
├─ High-traffic endpoints
└─ Irreversible operations
```

### Aggressive Rollout (Low Risk)

```
1% → 5% → 25% → 50% → 100%

USE WHEN:
├─ Bug fixes (verified in staging)
├─ UI-only changes
├─ New features (not replacing existing)
└─ Low-traffic features
```

## Advancement Criteria

**ALL criteria must pass to advance to next percentage:**

```
ERROR RATE:
├─ Within baseline ± 0.01%
├─ No new error types appearing
└─ Error rate trending flat or down

LATENCY:
├─ P50 within baseline ± 5%
├─ P95 within baseline ± 10%
├─ P99 within baseline ± 20%
└─ No latency spikes

BUSINESS METRICS:
├─ Conversion rate unchanged
├─ User engagement unchanged
└─ No customer complaints

INFRASTRUCTURE:
├─ CPU/memory within normal range
├─ No connection pool exhaustion
└─ No disk I/O spikes

TIME AT STAGE:
├─ Minimum 30 minutes at each stage
├─ 4+ hours for critical paths
└─ 24+ hours for database changes
```

## Rollback Triggers

**ANY of these triggers immediate rollback:**

```
AUTOMATIC ROLLBACK:
├─ Error rate > 5% above baseline
├─ P99 latency > 2x baseline
├─ Data corruption detected
├─ Memory leak detected
├─ Cascading failures observed
└─ Circuit breaker tripping

MANUAL ROLLBACK:
├─ User complaints spike
├─ Business metrics degraded
├─ Security vulnerability found
├─ Unexpected behavior reported
└─ On-call engineer judgment
```

## Feature Flags

### Flag Lifecycle

```
1. CREATE
   └─ Flag created, disabled by default

2. DEVELOP
   └─ Code deployed behind flag

3. TEST
   └─ Enabled for internal team

4. CANARY
   └─ Gradual percentage rollout

5. FULL
   └─ 100% enabled

6. CLEANUP (within 30 days)
   └─ Flag and conditional code removed
```

### Flag Types

| Type | Use Case | Duration |
|------|----------|----------|
| Release | Decouple deploy from release | Days to weeks |
| Experiment | A/B testing | Weeks to months |
| Ops | Kill switch for features | Permanent OK |
| Permission | User-specific access | Permanent OK |

### Flag Best Practices

```
DO:
├─ Use clear, descriptive names (enable_new_checkout_flow)
├─ Document purpose and owner
├─ Set expiration date for release flags
├─ Test both flag states
└─ Clean up after full rollout

DON'T:
├─ Nest feature flags deeply
├─ Use flags for permanent config (use config)
├─ Leave flags indefinitely (tech debt)
├─ Deploy code that only works with flag on
└─ Forget to test flag-off path
```

### Flag Configuration

```yaml
feature_flags:
  new_checkout_flow:
    description: "New streamlined checkout experience"
    owner: "checkout-team"
    created: "2024-01-15"
    expires: "2024-03-15"
    default: false
    rollout:
      percentage: 10
      sticky: true  # Same users always get same experience
    targeting:
      - internal_users: 100%
      - beta_users: 50%
```

## Canary Deployments

### Canary Strategy

```
CANARY SETUP:
├─ Small percentage (1-5%) of traffic to new version
├─ Rest of traffic to stable version
├─ Same infrastructure, different code
└─ Real production traffic

COMPARISON:
├─ Error rates: canary vs stable
├─ Latency: canary vs stable
├─ Resource usage: canary vs stable
└─ Business metrics: canary vs stable
```

### Canary Checklist

```
BEFORE CANARY:
├─ [ ] Staging tests pass
├─ [ ] Smoke tests ready
├─ [ ] Rollback procedure documented
├─ [ ] On-call aware
└─ [ ] Monitoring dashboards ready

DURING CANARY:
├─ [ ] Error rate monitored
├─ [ ] Latency monitored
├─ [ ] Logs reviewed
├─ [ ] No anomalies detected
└─ [ ] Business metrics stable

AFTER CANARY:
├─ [ ] Full rollout complete
├─ [ ] Stable for 24+ hours
├─ [ ] Old version decommissioned
└─ [ ] Postmortem if issues
```

## Blue-Green Deployments

### When to Use

```
BLUE-GREEN GOOD FOR:
├─ Database migrations (can test with real data)
├─ Major version upgrades
├─ Full environment validation
└─ Instant rollback needed

BLUE-GREEN NOT FOR:
├─ Frequent small changes (overhead too high)
├─ Stateful applications (session handling complex)
└─ Limited infrastructure budget
```

### Blue-Green Process

```
1. BLUE (current) serving traffic
2. Deploy to GREEN (inactive)
3. Test GREEN thoroughly
4. Switch traffic to GREEN
5. Monitor
6. If issues: switch back to BLUE
7. If stable: BLUE becomes next GREEN
```

## Database Migrations

### Safe Migration Pattern

```
1. BACKWARD COMPATIBLE CHANGE
   └─ Add column (nullable), don't remove anything

2. DEPLOY NEW CODE
   └─ Code works with both old and new schema

3. MIGRATE DATA
   └─ Backfill, transform as needed

4. VERIFY
   └─ Data integrity checks pass

5. REMOVE OLD (next release)
   └─ Now safe to remove old column/table
```

### Migration Checklist

```
BEFORE:
├─ [ ] Backup completed
├─ [ ] Migration tested on copy of prod data
├─ [ ] Rollback script ready
├─ [ ] Estimated duration calculated
├─ [ ] Maintenance window scheduled (if needed)
└─ [ ] Stakeholders notified

DURING:
├─ [ ] Monitor query performance
├─ [ ] Monitor replication lag
├─ [ ] Monitor lock contention
└─ [ ] Ready to abort if issues

AFTER:
├─ [ ] Verify data integrity
├─ [ ] Application functioning
├─ [ ] Performance baseline restored
└─ [ ] Document any issues
```

## Monitoring During Rollout

### Key Metrics

```
REAL-TIME DASHBOARD:
├─ Error rate (by version)
├─ Latency percentiles (by version)
├─ Request count (by version)
├─ Business metrics (conversion, etc.)
└─ Infrastructure (CPU, memory, etc.)
```

### Alerting

```
ROLLOUT-SPECIFIC ALERTS:
├─ Error rate delta > 0.1% between versions
├─ P95 latency delta > 20% between versions
├─ Canary error rate > 1%
└─ Rollout stuck at percentage for > 4 hours
```

## Communication

### Stakeholder Updates

```
NOTIFY:
├─ Before: "Starting rollout of X at Y time"
├─ Progress: "X is at N% with no issues"
├─ Issues: "Rollback triggered due to X"
├─ Complete: "X is fully rolled out"
└─ Incident: "Postmortem for X available"
```
