# SRE Principles

Site Reliability Engineering principles for production systems.

## SLI/SLO Definitions

### SLI (Service Level Indicator)

**What you measure** - a quantitative measure of service behavior.

```
STANDARD SLIs:
├─ Availability: successful responses / total responses
├─ Latency: p50, p95, p99 response times
├─ Error Rate: failed requests / total requests
├─ Throughput: requests per second
└─ Saturation: resource utilization (CPU, memory, connections)
```

### SLO (Service Level Objective)

**Your target** - the reliability goal for an SLI.

```
EXAMPLE SLOs:
├─ "99.9% of requests complete successfully over 30-day window"
├─ "p95 latency < 200ms over rolling 7-day window"
├─ "Error rate < 0.01% over calendar week"
└─ "99.95% availability over calendar month"
```

### Error Budget

**Error Budget = 100% - SLO%**

```
EXAMPLES:
├─ 99.9% SLO = 0.1% error budget
│  └─ 1M requests/month = 1,000 allowed errors
│
├─ 99.95% SLO = 0.05% error budget
│  └─ 1M requests/month = 500 allowed errors
│
├─ 99.99% monthly = ~4.3 minutes allowed downtime
└─ 99.9% monthly = ~43 minutes allowed downtime
```

## SLO-Based Release Policy

| Error Budget Status | Release Policy |
|---------------------|----------------|
| Above SLO (budget available) | Releases proceed normally |
| At SLO (budget tight) | Extra caution, smaller releases |
| Below SLO (budget exceeded) | HALT non-critical releases |

### Exceptions to Release Halt

Even when error budget is exceeded:
- P0 incidents (security, data loss)
- Fixes for the SLO violation itself
- Contractual obligations

## Monitoring Requirements

### The Four Golden Signals

```
1. LATENCY
   ├─ Time to serve requests
   ├─ Distinguish successful vs failed request latency
   └─ Track p50, p95, p99

2. TRAFFIC
   ├─ Demand on system
   ├─ HTTP requests/sec, transactions/sec
   └─ Track by endpoint, user type

3. ERRORS
   ├─ Rate of failed requests
   ├─ Explicit (500s) and implicit (wrong content, slow)
   └─ Track by error type, endpoint

4. SATURATION
   ├─ How "full" the system is
   ├─ CPU, memory, disk, connections
   └─ Track utilization and headroom
```

### Alert Thresholds

| Signal | Warning | Critical | Page |
|--------|---------|----------|------|
| Error rate | > 0.1% for 5min | > 1% for 2min | > 5% for 1min |
| P95 latency | > 1.5x baseline | > 2x baseline | > 3x baseline |
| CPU | > 70% for 10min | > 85% for 5min | > 95% for 2min |
| Memory | > 80% for 10min | > 90% for 5min | > 95% for 2min |
| Disk | > 70% | > 85% | > 95% |

## Incident Response

### Severity Levels

| Level | Definition | Response Time | Examples |
|-------|------------|---------------|----------|
| P0 | Service down, data loss | Immediate | Full outage, security breach |
| P1 | Major feature broken | < 1 hour | Auth broken, payments failing |
| P2 | Minor feature broken | < 4 hours | Non-critical feature down |
| P3 | Degraded performance | < 24 hours | Slow but functional |
| P4 | Minor issue | < 1 week | UI glitch, minor bug |

### Incident Lifecycle

```
1. DETECT
   └─ Monitoring alert or user report

2. TRIAGE
   └─ Assess severity, assign owner

3. MITIGATE
   └─ Stop the bleeding (rollback, disable, scale)

4. RESOLVE
   └─ Fix root cause

5. POSTMORTEM
   └─ Learn and prevent recurrence
```

## Postmortem Requirements

### When Required

- Single incident consumes > 20% of error budget
- P0 or P1 incident
- User-facing impact > 30 minutes
- Data loss or corruption
- Near-miss that could have been severe

### Blameless Culture

```
POSTMORTEM RULES:
├─ Focus on SYSTEMS, not people
├─ "The system allowed this to happen"
├─ Never: "Person X made a mistake"
├─ Ask: "How do we prevent this class of error?"
└─ Identify process/tooling improvements
```

### Required Sections

```markdown
## Incident Summary
- Duration: [start] to [end]
- Impact: [what was affected, how many users]
- Severity: [P0-P4]

## Timeline
- [timestamp]: [event]
- [timestamp]: [event]

## Root Causes
- Primary: [what actually caused it]
- Contributing: [what made it worse]

## What Went Well
- [thing that helped]

## What Went Poorly
- [thing that hurt]

## Action Items
- [ ] [action] - Owner: [name] - Due: [date]
```

## Capacity Planning

### Traffic Projections

```
PLAN FOR:
├─ Expected growth (monthly projections)
├─ Seasonal peaks (holidays, events)
├─ Viral potential (what if 10x traffic?)
└─ Degradation modes (what breaks first?)
```

### Headroom Requirements

| Resource | Minimum Headroom | Why |
|----------|------------------|-----|
| CPU | 30% | Handle traffic spikes |
| Memory | 20% | Prevent OOM |
| Disk | 30% | Allow for growth |
| Connections | 20% | Handle bursts |

## On-Call Best Practices

```
ON-CALL RULES:
├─ Clear escalation paths
├─ Runbooks for common issues
├─ No alert fatigue (actionable alerts only)
├─ Rotation schedule (sustainable hours)
└─ Post-incident handoff documentation
```

### Runbook Template

```markdown
## Alert: [Alert Name]

### What It Means
[Plain language explanation]

### Immediate Actions
1. [Step 1]
2. [Step 2]

### Diagnosis
- Check: [what to look at]
- Common causes: [list]

### Resolution
- If [condition]: [action]
- If [condition]: [action]

### Escalation
- If unresolved after [time]: contact [who]
```

## Toil Reduction

**Toil:** Manual, repetitive, automatable work with no enduring value.

```
TOIL BUDGET:
├─ Maximum: 50% of time on toil
├─ Target: < 30% of time on toil
└─ Rest: Engineering work (automation, improvement)

IDENTIFY TOIL:
├─ Manual (human required)
├─ Repetitive (same task repeatedly)
├─ Automatable (could be scripted)
├─ Reactive (responding to events)
└─ No enduring value (doesn't improve system)
```
