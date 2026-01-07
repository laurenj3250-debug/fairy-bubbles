# Design Documents

For non-trivial work, write a design doc BEFORE coding.

## When to Write a Design Doc

| Condition | Write Doc? |
|-----------|------------|
| Solution is ambiguous (complex problem OR complex solution) | YES |
| Change affects multiple systems | YES |
| Work will take > 1 week | YES |
| Decision has lasting architectural impact | YES |
| Simple, well-understood change | NO |
| Trivial bug fix | NO |

## Required Sections

### 1. Context/Background

Objective overview of the problem being solved.

- What exists today?
- What problem are we solving?
- Why does this matter now?

**Tone:** Facts, not opinions. Value-neutral language.

### 2. Goals and Non-Goals

```
GOALS (what this achieves):
- [ ] Specific, measurable outcome 1
- [ ] Specific, measurable outcome 2
- [ ] Specific, measurable outcome 3

NON-GOALS (explicitly NOT doing):
- [ ] Thing we're intentionally excluding 1
- [ ] Thing we're intentionally excluding 2
```

Non-goals are just as important as goals. They prevent scope creep.

### 3. Detailed Design

```
REQUIRED SUBSECTIONS:
├─ Trade-off Analysis
│  └─ What are we trading for what?
│
├─ System Architecture
│  └─ How do components interact?
│
├─ API Sketches
│  └─ Key interfaces and contracts
│
└─ Data Storage Approach
   └─ Schema, storage engine, access patterns
```

### 4. Alternatives Considered

For each alternative:
- What is it?
- Why was it rejected?
- What would make us reconsider?

**Minimum:** 2-3 alternatives with genuine consideration.

### 5. Cross-Cutting Concerns

| Concern | How Addressed |
|---------|---------------|
| Observability | Logging, metrics, tracing approach |
| Performance | Expected latency, throughput |
| Edge Cases | How handled |
| Failure Modes | What happens when X fails |
| Rollback | How to undo if needed |

## Review Process

### Timeline

```
Day 0:    Draft completed
Day 1-3:  Initial reviewer feedback
Day 4-7:  Iteration and discussion
Day 8-10: Final approval or rejection
```

**Minimum review period:** 10 calendar days for significant designs.

### Reviewers

- **Minimum:** 2 reviewers
- **Required:** At least 1 domain expert
- **Recommended:** 1 person unfamiliar with area (fresh eyes)

### Approval Criteria

- [ ] Goals are clear and measurable
- [ ] Non-goals prevent scope creep
- [ ] Alternatives genuinely considered
- [ ] Trade-offs explicitly documented
- [ ] Cross-cutting concerns addressed
- [ ] Rollback strategy exists

## Template

```markdown
# Design Doc: [Title]

**Author:** [Name]
**Reviewers:** [Names]
**Status:** [Draft | In Review | Approved | Rejected]
**Last Updated:** [Date]

## Context

[Problem background]

## Goals

- [ ] Goal 1
- [ ] Goal 2

## Non-Goals

- [ ] Non-goal 1
- [ ] Non-goal 2

## Detailed Design

### Architecture

[System diagram and explanation]

### API Design

[Key interfaces]

### Data Model

[Schema and access patterns]

### Trade-offs

| Trade-off | What We Gain | What We Lose |
|-----------|--------------|--------------|
| Choice 1 | Benefit | Cost |

## Alternatives Considered

### Alternative A: [Name]
- Description: [What]
- Rejected because: [Why]

### Alternative B: [Name]
- Description: [What]
- Rejected because: [Why]

## Cross-Cutting Concerns

### Observability
[Approach]

### Performance
[Expected metrics]

### Failure Modes
[What happens when things break]

### Rollback Strategy
[How to undo]

## Open Questions

- [ ] Question 1?
- [ ] Question 2?
```

## Common Mistakes

1. **Writing doc after coding** - Design docs are for BEFORE, not after
2. **No alternatives** - If you only considered one approach, you didn't design
3. **Vague goals** - "Make it better" isn't measurable
4. **Missing non-goals** - Leads to scope creep
5. **Skipping review** - Doc without review is just notes
