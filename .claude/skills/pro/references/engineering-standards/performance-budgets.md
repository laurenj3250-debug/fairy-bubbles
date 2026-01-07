# Performance Budgets

Concrete targets for latency, errors, and resources.

## API Latency Targets

### By Endpoint Type

| Endpoint Type | P50 | P95 | P99 | Alert Threshold |
|---------------|-----|-----|-----|-----------------|
| Auth/login | 50ms | 150ms | 250ms | P95 > 300ms |
| Standard API | 75ms | 200ms | 400ms | P95 > 500ms |
| Search/query | 100ms | 300ms | 600ms | P95 > 800ms |
| File upload | 500ms | 2s | 5s | P95 > 8s |
| Background job | 1s | 5s | 10s | P95 > 15s |
| Report generation | 2s | 10s | 30s | P95 > 60s |

### Latency Budget Allocation

```
TOTAL BUDGET: 200ms (P95 for standard API)

BREAKDOWN:
├─ Network (client → server): 20ms
├─ Load balancer: 5ms
├─ Application processing: 100ms
├─ Database queries: 50ms
├─ External API calls: 0ms (async or cached)
├─ Response serialization: 10ms
└─ Network (server → client): 15ms
```

## Error Rate Thresholds

### By Endpoint Criticality

| Criticality | Target | Warning | Critical |
|-------------|--------|---------|----------|
| Critical (auth, payment) | < 0.001% | > 0.01% | > 0.1% |
| High (core features) | < 0.01% | > 0.1% | > 0.5% |
| Standard | < 0.1% | > 0.5% | > 1% |
| Low (analytics, logging) | < 1% | > 2% | > 5% |

### Error Categories

```
5XX ERRORS (server fault):
├─ Target: < 0.01%
├─ Alert: > 0.1% for 5 min
└─ Page: > 1% for 2 min

4XX ERRORS (client fault):
├─ 400 (Bad Request): Monitor for patterns
├─ 401 (Unauthorized): Track auth failures
├─ 403 (Forbidden): Track permission issues
├─ 404 (Not Found): Ignore (expected)
├─ 429 (Rate Limited): Track separately
└─ 422 (Validation): Track patterns
```

## Frontend Performance Budgets

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5s - 4s | > 4s |
| FID (First Input Delay) | < 100ms | 100ms - 300ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 |
| INP (Interaction to Next Paint) | < 200ms | 200ms - 500ms | > 500ms |

### Additional Frontend Metrics

| Metric | Budget |
|--------|--------|
| Time to First Byte (TTFB) | < 600ms |
| First Contentful Paint (FCP) | < 1.8s |
| Time to Interactive (TTI) | < 3.8s |
| Total Blocking Time (TBT) | < 200ms |
| Speed Index | < 3.4s |

### Bundle Size Budgets

```
JAVASCRIPT:
├─ Initial bundle: < 150KB gzip
├─ Per-route chunk: < 50KB gzip
├─ Total JS: < 350KB gzip
└─ No single dependency > 50KB gzip

CSS:
├─ Critical CSS: < 14KB (inline)
├─ Total CSS: < 100KB gzip
└─ Unused CSS: < 10%

IMAGES:
├─ Hero image: < 200KB
├─ Thumbnail: < 20KB
├─ Icon: < 5KB
└─ Use modern formats (WebP, AVIF)

FONTS:
├─ Total fonts: < 100KB
├─ Per font: < 50KB
└─ Use font-display: swap
```

### Lighthouse Scores

| Category | Minimum | Target |
|----------|---------|--------|
| Performance | 80 | 90+ |
| Accessibility | 90 | 100 |
| Best Practices | 90 | 100 |
| SEO | 90 | 100 |

## Backend Resource Budgets

### CPU

| State | Threshold | Action |
|-------|-----------|--------|
| Normal | < 50% | None |
| Elevated | 50-70% | Monitor |
| Warning | 70-85% | Investigate |
| Critical | > 85% | Scale/alert |
| Emergency | > 95% | Page on-call |

### Memory

| State | Threshold | Action |
|-------|-----------|--------|
| Normal | < 60% | None |
| Elevated | 60-80% | Monitor |
| Warning | 80-90% | Investigate |
| Critical | > 90% | Scale/alert |
| OOM Risk | > 95% | Page on-call |

### Database Connections

```
POOL SIZING:
├─ Min connections: 5
├─ Max connections: 20-50 (depends on instance)
├─ Idle timeout: 5-10 min
└─ Max lifetime: 30 min

THRESHOLDS:
├─ Normal: < 60% pool used
├─ Warning: 60-80% pool used
├─ Critical: > 80% pool used
└─ Exhausted: 100% (requests blocked)
```

### Cache Performance

```
CACHE HIT RATIO:
├─ Excellent: > 95%
├─ Good: 85-95%
├─ Acceptable: 70-85%
├─ Poor: < 70%
└─ Alert if < 70% for 10+ minutes
```

## Database Performance

### Query Budgets

| Query Type | P50 | P95 | Alert |
|------------|-----|-----|-------|
| Simple lookup | < 5ms | < 10ms | > 20ms |
| Indexed query | < 20ms | < 50ms | > 100ms |
| Complex join | < 50ms | < 100ms | > 200ms |
| Aggregate | < 100ms | < 500ms | > 1s |
| Full scan (avoid) | N/A | N/A | Any |

### Index Health

```
METRICS:
├─ Index hit ratio: > 99%
├─ Sequential scans: < 1% of queries
├─ Index bloat: < 20%
├─ Dead tuples: < 5%
└─ Vacuum frequency: adequate
```

## Network Budgets

### API Response Size

| Endpoint Type | Max Size |
|---------------|----------|
| Single resource | < 10KB |
| List (paginated) | < 100KB |
| Search results | < 50KB |
| File metadata | < 5KB |
| Error response | < 1KB |

### Request Rate Limits

```
DEFAULT LIMITS:
├─ Anonymous: 60/min
├─ Authenticated: 600/min
├─ Premium: 6000/min
├─ Internal: 60000/min
└─ Burst allowance: 2x limit for 10s
```

## Mobile-Specific Budgets

### Network Conditions

```
TEST UNDER:
├─ 4G: 12 Mbps down, 5 Mbps up, 70ms RTT
├─ 3G: 1.6 Mbps down, 750 Kbps up, 300ms RTT
├─ Slow 3G: 400 Kbps down, 400 Kbps up, 400ms RTT
└─ Offline: Service worker fallback
```

### Mobile Performance Targets

```
ON 4G:
├─ First paint: < 2s
├─ Interactive: < 4s
├─ Full load: < 6s
└─ API response: < 500ms

ON 3G:
├─ First paint: < 4s
├─ Interactive: < 8s
├─ Full load: < 12s
└─ API response: < 1s
```

## Monitoring & Alerting

### Dashboard Requirements

```
REAL-TIME:
├─ Request rate
├─ Error rate
├─ Latency percentiles (p50, p95, p99)
├─ Resource utilization
└─ Active users

TRENDS:
├─ Week-over-week comparison
├─ Degradation detection
├─ Capacity forecasting
└─ Cost per request
```

### Alert Configuration

```
PAGE (wake someone up):
├─ Error rate > 5% for 2 min
├─ P99 latency > 3x baseline for 5 min
├─ Service unavailable > 1 min
└─ Data corruption detected

NOTIFY (during business hours):
├─ Error rate > 0.5% for 10 min
├─ P95 latency > 2x baseline for 15 min
├─ Resource utilization > 80% for 30 min
└─ Cache hit ratio < 70% for 10 min
```
