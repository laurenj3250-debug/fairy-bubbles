# Mental Models

Build and maintain internal understanding of systems.

## What a Mental Model Is

A compressed, intuitive understanding of how something works.

You can't remember every detail, so your brain builds a simplified representation that lets you reason about behavior without consulting documentation.

## Building Models

### Ask Fundamental Questions

When learning a new system:
- "What is this optimized for?"
- "Where are the bottlenecks?"
- "What are the invariants that must hold?"
- "What happens when X fails?"

### Build in Layers

```
BEHAVIOR LAYER: What users do
├─ User flows, interactions, expectations

DOMAIN LAYER: Business logic
├─ Rules, constraints, relationships

TECHNICAL LAYER: Implementation
├─ Architecture, data flow, algorithms

INFRASTRUCTURE LAYER: Operations
├─ Deployment, scaling, monitoring
```

### Test Predictions

Don't read passively. Form hypotheses:
- "If I do X, what SHOULD happen?"
- Then verify.
- When wrong, update your model.

### Extract Principles

Instead of memorizing specifics:
- "This system prioritizes consistency over availability"
- "This codebase favors explicit over implicit"
- "This team values small PRs over complete features"

Principles travel with you; specifics don't.

## Updating Models

### Failures Are Data

When something breaks or surprises you:
- Don't just fix it
- Update your mental model
- "Oh, so THIS can happen under THESE conditions"

### Contradiction = Signal

When reality doesn't match your model:
- Your model is wrong (most common)
- The system changed
- There's a bug

Investigate before proceeding.

### Teaching Forces Precision

When explaining to others:
- Gaps in your model become obvious
- You realize what you assumed vs. what you know
- Good engineers use teaching as model-refinement

### Regular Audits

Periodically ask:
- "Is my understanding still accurate?"
- "Has this system evolved?"
- "What have I assumed that I haven't verified?"

## Why This Matters

A junior with an incomplete mental model makes poor decisions because they don't see implications.

A senior with an accurate model makes decisions quickly because they can reason through consequences without deep investigation.

**Speed comes from understanding, not from skipping steps.**

## Signs of a Good Model

- You can predict system behavior before testing
- You can explain trade-offs to others
- You know where to look when things break
- You understand WHY things are the way they are, not just WHAT they are
