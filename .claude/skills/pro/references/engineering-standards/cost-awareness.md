# Cost Awareness

Estimate and manage infrastructure costs before implementing.

## Cost Estimation Checklist

### Before Implementing, Answer These:

```
COMPUTE:
├─ Expected requests per month?
├─ Average request duration?
├─ Peak vs average load ratio?
├─ Scaling behavior (linear, exponential)?
└─ Minimum instances needed for availability?

STORAGE:
├─ Initial data size?
├─ Data growth rate (per day/month)?
├─ Retention requirements?
├─ Storage tier (hot/warm/cold)?
└─ Backup storage needs?

NETWORK:
├─ Average response size?
├─ Total data transfer per month?
├─ Cross-region traffic?
├─ CDN requirements?
└─ API gateway costs?

THIRD-PARTY:
├─ API calls per month?
├─ Pricing tier and limits?
├─ Overage costs?
└─ Alternative services?
```

## Cost Review Triggers

### Requires Cost Review

| Trigger | Review Depth |
|---------|--------------|
| New service/infrastructure | Full estimate |
| Expected > $100/month increase | Manager approval |
| Expected > $1000/month increase | Director approval |
| Change in scaling behavior | Re-estimate |
| New third-party integration | Vendor comparison |
| Architecture change | Full re-estimate |

### Review Template

```markdown
## Cost Impact Analysis

**Change:** [What's changing]
**Estimated Monthly Cost:** $[amount]
**Cost Breakdown:**
- Compute: $[amount]
- Storage: $[amount]
- Network: $[amount]
- Third-party: $[amount]

**Comparison:**
- Current cost: $[amount]
- New cost: $[amount]
- Delta: $[amount] ([percentage]%)

**Justification:**
[Why this cost is justified]

**Cost Optimization Opportunities:**
1. [Opportunity 1]
2. [Opportunity 2]
```

## Compute Cost Optimization

### Right-Sizing

```
COMMON WASTE:
├─ Oversized instances (CPU < 20% average)
├─ Idle development environments
├─ Running 24/7 when usage is business hours only
├─ Over-provisioned databases
└─ Zombie resources (unused but not deleted)

ACTIONS:
├─ Monitor actual utilization for 2+ weeks
├─ Downsize to 80% of peak capacity
├─ Use auto-scaling for variable load
├─ Schedule dev environments to shut down
└─ Regular audit of all resources
```

### Pricing Models

| Model | Best For | Savings |
|-------|----------|---------|
| On-demand | Variable/unknown load | Baseline |
| Reserved (1yr) | Stable workloads | 30-40% |
| Reserved (3yr) | Long-term stable | 50-60% |
| Spot/Preemptible | Fault-tolerant batch | 60-90% |
| Savings plans | Flexible commitment | 20-30% |

### Auto-Scaling Strategy

```
SCALE-UP:
├─ Threshold: CPU > 70% for 3 min
├─ Action: Add 2 instances
├─ Cooldown: 5 min
└─ Max instances: [calculated for peak]

SCALE-DOWN:
├─ Threshold: CPU < 30% for 10 min
├─ Action: Remove 1 instance
├─ Cooldown: 10 min
└─ Min instances: [for availability]
```

## Storage Cost Optimization

### Storage Tiers

| Tier | Use Case | Cost |
|------|----------|------|
| Hot/Standard | Frequently accessed | $$$ |
| Warm/Infrequent | Monthly access | $$ |
| Cold/Archive | Yearly access | $ |
| Glacier/Deep Archive | Compliance retention | ¢ |

### Data Lifecycle Policy

```
EXAMPLE POLICY:
├─ Days 0-30: Hot storage
├─ Days 31-90: Warm storage
├─ Days 91-365: Cold storage
├─ Days 366+: Archive or delete
└─ Compliance data: Archive for 7 years
```

### Storage Optimization

```
REDUCE STORAGE COSTS:
├─ Compress data before storing
├─ Deduplicate redundant data
├─ Delete temporary/test data
├─ Use appropriate data types (don't store ints as strings)
├─ Implement lifecycle policies
└─ Regular cleanup of orphaned data
```

## Database Cost Optimization

### Instance Sizing

```
START SMALL, SCALE UP:
├─ Begin with smallest viable instance
├─ Monitor for 2 weeks
├─ Scale based on actual usage
├─ Consider read replicas for read-heavy
└─ Use serverless for variable workloads
```

### Query Efficiency

```
EXPENSIVE QUERIES:
├─ Full table scans (add indexes)
├─ N+1 queries (use eager loading)
├─ SELECT * (select only needed columns)
├─ Unoptimized joins (review execution plans)
└─ Missing LIMIT clauses (paginate everything)
```

### Connection Costs

```
REDUCE CONNECTION OVERHEAD:
├─ Use connection pooling
├─ Right-size pool (not too large)
├─ Close idle connections
├─ Use serverless for infrequent access
└─ Consider proxy services for scaling
```

## Network Cost Optimization

### Data Transfer

```
EXPENSIVE TRANSFERS:
├─ Cross-region: $0.02/GB
├─ Internet egress: $0.09/GB
├─ Inter-AZ: $0.01/GB
├─ Same-AZ: Free
└─ CDN: Varies by volume

OPTIMIZATION:
├─ Keep traffic in same AZ when possible
├─ Use CDN for static assets
├─ Compress responses (gzip, brotli)
├─ Implement caching
└─ Batch API calls
```

### CDN Usage

```
CDN COST FACTORS:
├─ Data transfer out
├─ Request count
├─ SSL/TLS certificates
├─ Custom domains
└─ Edge functions

OPTIMIZE:
├─ Set appropriate cache TTLs
├─ Use cache-friendly URLs
├─ Compress assets at origin
├─ Monitor cache hit ratio
└─ Purge only when necessary
```

## Third-Party Cost Management

### Vendor Selection Criteria

```
EVALUATE:
├─ Pricing model (per request, per user, flat)
├─ Free tier limits
├─ Overage costs
├─ Volume discounts
├─ Contract flexibility
├─ Alternative services
└─ Build vs buy analysis
```

### API Cost Control

```
CONTROL MECHANISMS:
├─ Rate limiting per client
├─ Usage quotas
├─ Caching to reduce calls
├─ Batch requests when possible
├─ Alert on unusual usage
└─ Circuit breaker for cost spikes
```

## Cost Monitoring

### Dashboard Requirements

```
TRACK:
├─ Daily/weekly/monthly spend
├─ Spend by service
├─ Spend by environment (prod/staging/dev)
├─ Spend per customer (if applicable)
├─ Trend analysis
└─ Budget vs actual
```

### Alerts

| Condition | Alert |
|-----------|-------|
| Daily spend > 1.5x average | Warning |
| Weekly spend > budget | Warning |
| Single resource > $100/day | Review |
| Unknown charges appear | Investigate |
| Projected to exceed monthly budget | Escalate |

## Cost Allocation

### Tagging Strategy

```
REQUIRED TAGS:
├─ Environment: prod/staging/dev
├─ Team: [team-name]
├─ Service: [service-name]
├─ Cost Center: [code]
└─ Owner: [email]

ENABLES:
├─ Cost per team
├─ Cost per service
├─ Cost per environment
├─ Chargeback/showback
└─ Anomaly detection
```

## FinOps Best Practices

```
CULTURE:
├─ Engineers own their costs
├─ Cost visibility for all
├─ Regular cost review meetings
├─ Cost in design discussions
└─ Celebrate cost savings

PROCESS:
├─ Cost estimation in planning
├─ Cost review in PRs
├─ Monthly cost reports
├─ Quarterly optimization sprints
└─ Annual architecture review
```
