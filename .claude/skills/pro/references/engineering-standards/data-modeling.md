# Data Modeling

Schema design, migration safety, and query performance.

## Schema Design Principles

### Normalization vs Denormalization

```
NORMALIZE WHEN:
├─ Data integrity is critical
├─ Write-heavy workload
├─ Storage cost matters
└─ Relationships are complex

DENORMALIZE WHEN:
├─ Read performance is critical
├─ Read-heavy workload (10:1+ read:write)
├─ Queries always need joined data
└─ Data staleness is acceptable
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `user_accounts`, `order_items` |
| Columns | snake_case | `created_at`, `user_id` |
| Primary keys | `id` or `{table}_id` | `id`, `user_id` |
| Foreign keys | `{referenced_table}_id` | `user_id`, `order_id` |
| Indexes | `idx_{table}_{columns}` | `idx_users_email` |
| Constraints | `{type}_{table}_{column}` | `fk_orders_user_id` |

### Required Columns

```
EVERY TABLE SHOULD HAVE:
├─ id: Primary key (UUID or bigint)
├─ created_at: Timestamp of creation
├─ updated_at: Timestamp of last update
└─ (optional) deleted_at: Soft delete timestamp
```

## Schema Change Safety

### Safe Changes (Backward Compatible)

```
SAFE - Can deploy without coordination:
├─ Adding nullable columns
├─ Adding new tables
├─ Adding indexes (be mindful of lock time)
├─ Widening constraints (VARCHAR(50) → VARCHAR(100))
└─ Adding default values to existing nullable columns
```

### Unsafe Changes (Require Migration Plan)

```
UNSAFE - Needs careful migration:
├─ Removing columns/tables
├─ Renaming columns/tables
├─ Changing data types
├─ Adding NOT NULL to existing columns
├─ Changing primary keys
├─ Removing indexes (might break queries)
└─ Tightening constraints
```

### Migration Pattern (Expand/Contract)

```
PHASE 1: EXPAND
├─ Add new column (nullable)
├─ Deploy code that writes to BOTH old and new
└─ Test thoroughly

PHASE 2: MIGRATE
├─ Backfill old data to new column
├─ Verify data integrity
└─ Monitor for issues

PHASE 3: CONTRACT
├─ Deploy code that reads from new column only
├─ Remove old column (later release)
└─ Clean up dual-write code

TIMELINE:
├─ Expand → Migrate: Same release
├─ Migrate → Contract: 1+ release cycles
└─ Never skip phases
```

### Example: Renaming a Column

```sql
-- Phase 1: Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

-- Phase 2: Backfill
UPDATE users SET full_name = name WHERE full_name IS NULL;

-- Phase 3: Application reads from full_name
-- Phase 4: (Later release) Drop old column
ALTER TABLE users DROP COLUMN name;
```

## Query Performance Budget

### Response Time Targets

| Query Type | P95 | P99 | Alert |
|------------|-----|-----|-------|
| Simple lookup (by PK) | < 10ms | < 20ms | > 50ms |
| Indexed query | < 50ms | < 100ms | > 200ms |
| Complex join | < 100ms | < 200ms | > 500ms |
| Report/analytics | < 1s | < 2s | > 5s |
| Background job | < 5s | < 10s | > 30s |

### Index Requirements

```
INDEX RULES:
├─ Every foreign key should be indexed
├─ Every WHERE clause column in frequent queries
├─ Every ORDER BY column
├─ Composite indexes for multi-column queries
└─ Consider covering indexes for hot queries

INDEX LIMITS:
├─ Maximum indexes per table: ~10 (writes slow down)
├─ Avoid indexing low-cardinality columns alone
└─ Partial indexes for filtered queries
```

### Query Health Metrics

```
TARGETS:
├─ Index hit ratio: > 99%
├─ Sequential scans: < 1% of queries
├─ Slow query rate: < 0.1%
└─ Lock wait time: < 10ms average
```

## Connection Management

### Pool Configuration

```
SIZING FORMULA:
connections = (core_count * 2) + effective_spindle_count

TYPICAL SETTINGS:
├─ Min pool: 5-10 connections
├─ Max pool: 20-50 connections
├─ Idle timeout: 5-10 minutes
└─ Max lifetime: 30 minutes
```

### Connection Health

```
MONITOR:
├─ Active connections
├─ Idle connections
├─ Connection wait time
├─ Connection errors
└─ Pool exhaustion events
```

## Data Integrity

### Constraints to Use

```
ALWAYS USE:
├─ NOT NULL for required fields
├─ FOREIGN KEY for relationships
├─ UNIQUE for natural keys
├─ CHECK for domain constraints
└─ DEFAULT for sensible defaults

EXAMPLE:
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'shipped')),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Referential Integrity

```
ON DELETE OPTIONS:
├─ RESTRICT: Prevent deletion if referenced (safest)
├─ CASCADE: Delete referencing rows too (use carefully)
├─ SET NULL: Set FK to NULL (for optional relationships)
└─ NO ACTION: Check at end of transaction

DEFAULT TO RESTRICT unless you have specific reason for CASCADE.
```

## Backup & Recovery

### Backup Requirements

```
BACKUP SCHEDULE:
├─ Full backup: Daily
├─ Incremental: Every 1-6 hours
├─ Point-in-time recovery: Continuous WAL archiving
└─ Retention: 30 days minimum

BACKUP VERIFICATION:
├─ Weekly restore test
├─ Verify data integrity after restore
└─ Document recovery time (RTO target)
```

### Recovery Objectives

| Metric | Target | Description |
|--------|--------|-------------|
| RPO (Recovery Point) | < 1 hour | Max data loss |
| RTO (Recovery Time) | < 4 hours | Time to restore |

## Common Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Entity-Attribute-Value | Performance nightmare | Proper schema design |
| Polymorphic associations | No FK constraints | Separate tables or STI |
| Storing JSON blobs | Can't query/index | Structured columns |
| No indexes on FKs | Slow joins/cascades | Index all FKs |
| SELECT * everywhere | Over-fetching | Select specific columns |
| Missing created_at/updated_at | No audit trail | Add to all tables |
| Unbounded queries | Memory exhaustion | Always paginate |
| N+1 queries | Performance death | Eager loading/joins |

## Query Optimization Checklist

```
BEFORE DEPLOYING QUERY:
├─ [ ] EXPLAIN ANALYZE shows index usage
├─ [ ] No sequential scans on large tables
├─ [ ] Estimated vs actual rows are close
├─ [ ] No nested loops on large sets
├─ [ ] Sort/hash operations fit in memory
└─ [ ] Query time under budget
```
