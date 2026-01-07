# Architecture Decision Records (ADRs)

Document significant technical decisions for future reference.

## When to Write an ADR

```
WRITE AN ADR FOR:
├─ Technology choices (framework, database, cloud provider)
├─ Architectural patterns (monolith vs microservices, event-driven)
├─ API design decisions (REST vs GraphQL, versioning strategy)
├─ Data model changes (schema redesign, new storage approach)
├─ Cross-cutting concerns (auth approach, logging strategy)
├─ Build/deployment choices (CI/CD tool, container strategy)
├─ Third-party integrations (which vendor, why)
└─ Any decision you'd want documented for the next engineer

DON'T WRITE AN ADR FOR:
├─ Trivial decisions (which linter rule)
├─ Temporary choices (quick fix to revert)
├─ Pure implementation details (algorithm choice in one function)
└─ Decisions already covered by existing standards
```

## ADR Template

```markdown
# ADR-[NUMBER]: [Title]

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-XXX]

## Date

[YYYY-MM-DD]

## Context

What is the issue that we're seeing that motivates this decision or change?

Write in neutral, objective language. Focus on facts, not opinions.
Include relevant constraints, requirements, and forces at play.

## Decision

What is the change that we're proposing and/or doing?

Write in full sentences, using active voice.
Be specific about what will be done.

## Consequences

What becomes easier or harder to do because of this change?

### Positive
- [Outcome 1]
- [Outcome 2]

### Negative
- [Outcome 1]
- [Outcome 2]

### Neutral
- [Outcome 1]

## Alternatives Considered

### Alternative A: [Name]
- **Description:** [What it is]
- **Pros:** [Benefits]
- **Cons:** [Drawbacks]
- **Why not chosen:** [Reason]

### Alternative B: [Name]
- **Description:** [What it is]
- **Pros:** [Benefits]
- **Cons:** [Drawbacks]
- **Why not chosen:** [Reason]
```

## Example ADR

```markdown
# ADR-001: Use PostgreSQL as Primary Database

## Status

Accepted

## Date

2024-01-15

## Context

We need to choose a primary database for our new application.
Key requirements:
- ACID compliance for financial transactions
- Support for complex queries and joins
- Horizontal read scaling capability
- Strong ecosystem and community support
- Team familiarity

Current team has experience with both PostgreSQL and MySQL.
Expected data volume: 10M+ rows within first year.
Query patterns: 70% reads, 30% writes, complex reporting queries.

## Decision

We will use PostgreSQL as our primary database.

Specifically:
- PostgreSQL 15+ for new features (MERGE, JSON improvements)
- Amazon RDS for managed hosting in production
- Local Docker containers for development
- pgBouncer for connection pooling

## Consequences

### Positive
- Rich feature set (JSON, full-text search, window functions)
- Strong ACID compliance for financial data integrity
- Excellent query optimizer for complex queries
- Large ecosystem of tools and extensions
- Read replicas for scaling read workload

### Negative
- Slightly more complex setup than MySQL
- Less forgiving of unoptimized queries (can be positive too)
- Team needs to learn PostgreSQL-specific features

### Neutral
- Similar operational costs to MySQL
- Comparable hosting options available

## Alternatives Considered

### Alternative A: MySQL 8.0
- **Description:** Oracle's MySQL with improved JSON and CTE support
- **Pros:** Team familiarity, simpler replication setup
- **Cons:** Weaker JSON support, less powerful query optimizer
- **Why not chosen:** PostgreSQL's superior analytics capabilities outweigh familiarity

### Alternative B: MongoDB
- **Description:** Document database with flexible schema
- **Pros:** Schema flexibility, horizontal scaling
- **Cons:** No ACID transactions (until recently), poor for complex joins
- **Why not chosen:** Financial data requires strong consistency guarantees
```

## ADR Maintenance

### Immutability Rule

```
ADRs ARE IMMUTABLE ONCE ACCEPTED:
├─ Never edit accepted ADRs (except typos)
├─ To change a decision, create new ADR that supersedes
├─ Mark original as "Superseded by ADR-XXX"
├─ New ADR should reference original
└─ This preserves the decision history
```

### Status Lifecycle

```
PROPOSED
  ↓ (after review and approval)
ACCEPTED
  ↓ (if later replaced)
SUPERSEDED BY ADR-XXX
  or
DEPRECATED (if no longer applicable)
```

### Superseding Example

```markdown
# ADR-015: Migrate from PostgreSQL to CockroachDB

## Status

Accepted

## Context

ADR-001 established PostgreSQL as our primary database.
However, after 2 years of operation, we've encountered:
- Horizontal scaling limitations
- Global latency issues (users in 3 continents)
- Complex failover procedures

## Decision

We will migrate to CockroachDB for global distribution.

This supersedes ADR-001.

[Rest of ADR...]
```

## Storage and Organization

### File Location

```
docs/
└── architecture/
    └── decisions/
        ├── 0001-use-postgresql.md
        ├── 0002-adopt-rest-api.md
        ├── 0003-implement-cqrs.md
        └── README.md (index of all ADRs)
```

### Numbering

```
FORMAT: NNNN-short-title.md

EXAMPLES:
├─ 0001-use-postgresql.md
├─ 0002-adopt-typescript.md
├─ 0003-implement-event-sourcing.md
└─ (sequential, never reuse numbers)
```

### Index File

```markdown
# Architecture Decision Records

This directory contains the Architecture Decision Records (ADRs) for [Project Name].

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-use-postgresql.md) | Use PostgreSQL | Accepted | 2024-01-15 |
| [0002](0002-adopt-rest-api.md) | Adopt REST API | Accepted | 2024-01-20 |
| [0003](0003-implement-cqrs.md) | Implement CQRS | Proposed | 2024-02-01 |

## About ADRs

ADRs document significant architectural decisions...
```

## Review Process

### Who Reviews

| ADR Scope | Required Reviewers |
|-----------|-------------------|
| Within one service | Team lead + 1 engineer |
| Cross-service | Affected team leads |
| Organization-wide | Architecture council |
| External integration | Security + legal |

### Review Checklist

```
BEFORE ACCEPTING:
├─ [ ] Context is complete and objective
├─ [ ] Decision is specific and actionable
├─ [ ] Consequences are honest (including negatives)
├─ [ ] Alternatives were genuinely considered
├─ [ ] Stakeholders have reviewed
├─ [ ] Timeline for implementation is reasonable
└─ [ ] Metrics for success are defined (if applicable)
```

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| No alternatives | Appears not well-considered | Always list 2+ alternatives |
| Only positive consequences | Incomplete picture | Include negatives honestly |
| Too vague | Not useful later | Be specific and concrete |
| Too detailed | Hard to maintain | Focus on decision, not implementation |
| Not discoverable | Gets lost | Index file, consistent location |
| Edited after acceptance | Loses history | Create new ADR to supersede |

## Benefits of ADRs

```
FOR CURRENT TEAM:
├─ Forces explicit discussion of trade-offs
├─ Creates shared understanding
├─ Documents the "why" behind decisions
└─ Prevents relitigating resolved decisions

FOR FUTURE TEAM:
├─ Understand historical context
├─ Know what alternatives were considered
├─ Learn from past decisions
└─ Know when to revisit decisions
```
