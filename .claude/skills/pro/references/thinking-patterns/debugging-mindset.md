# Debugging Mindset

Investigate systematically, not randomly.

## Core Principles

1. **Reproduce before reasoning** - If you can't trigger it reliably, you don't understand it
2. **Facts over intuition** - "I think it's X" is not evidence
3. **Root cause, not symptom** - Fix why it happened, not just what happened
4. **Prevent the class of error** - Don't just fix this instance

## The Systematic Approach

### Step 1: Reproduce First

- Define precisely: "What should happen?" vs. "What actually happens?"
- Make it reproducible. Can you trigger it 100% of the time?
- If not reproducible: collect more data, add logging, wait for recurrence
- **Don't skip this.** Random fixes for non-reproducible bugs create new bugs.

### Step 2: Binary Search the Problem Space

Don't investigate everything. Narrow systematically:

```
1. Is the problem in frontend or backend?
2. Is it in this function or before it?
3. Is it in this line or after it?
4. Is it this variable or that one?
```

Cut the problem space in half with each test. This finds bugs in minutes that random debugging finds in hours.

### Step 3: Work Backward from Symptom

- Don't trace forward from where you THINK the problem is
- Trace backward from where the symptom manifests
- This prevents confirmation bias—you follow the data, not your hypothesis

### Step 4: Rubber Duck Debugging

Speaking about the problem forces you to articulate every assumption:
- "The user clicks submit..."
- "Which calls this function..."
- "Which should update the database..."
- "Wait, what if the transaction isn't committed yet?"

False assumptions surface when you have to explain them.

### Step 5: Five Whys

Surface answer is rarely root cause:

```
"The request timed out"
└─ Why? "The database was slow"
   └─ Why? "There was a missing index"
      └─ Why? "The schema changed last week"
         └─ Why? "Nobody tested the new schema under load"
            └─ ROOT CAUSE: No load testing in CI pipeline
```

Fix the root cause (add load testing), not just the symptom (add index).

## Debugging Checklist

- [ ] Can I reproduce it 100%?
- [ ] Have I checked the actual error message/logs?
- [ ] Have I verified my assumptions about input data?
- [ ] Have I checked recent changes (git blame)?
- [ ] Have I isolated the component (does it fail in isolation)?
- [ ] Have I checked environment differences (local vs prod)?
- [ ] Have I ruled out caching/stale data?

## Anti-Patterns

| Anti-Pattern | Problem |
|--------------|---------|
| "I think I know what it is" | Confirmation bias, skips investigation |
| Random changes | Creates new bugs, doesn't teach anything |
| "Let me just try this" | Cargo cult debugging |
| Fixing without understanding | Bug will recur |
| Assuming the obvious | Often wrong |

## The Mindset Difference

**Junior:** Debug to fix the immediate problem.

**Senior:** Debug to understand why it happened, with an eye toward preventing similar issues.

Every bug is a learning opportunity about the system.
