# Requirements Validation

Detect bad requirements before building.

## Why This Matters

Late-discovered requirement errors are exponentially more expensive:
- Finding in design: 1x cost
- Finding in development: 5x cost
- Finding in testing: 10x cost
- Finding in production: 100x cost

Invest time upfront. It pays off.

## Requirement Smells

### Smell: Ambiguous

```
"Make it faster"
└─ Faster for whom? Under what conditions? By how much?

"Improve the UX"
└─ What specific outcome? How do we measure success?

"Handle edge cases"
└─ Which ones? All of them? The common ones?
```

**Action:** Ask clarifying questions BEFORE designing.

### Smell: Inconsistent

```
"Prioritize consistency AND low-latency"
└─ These conflict under failure conditions. Which wins?

"Simple but feature-rich"
└─ These are often opposites. What's the priority?
```

**Action:** Surface the contradiction, force a priority decision.

### Smell: Implementation Disguised as Requirement

```
"Use Redis for caching"
└─ That's HOW, not WHAT

Real requirement: "Response time under 100ms"
└─ Redis might not be the best solution
```

**Action:** Separate what we need from how we build it.

### Smell: Hidden Assumptions

```
"Users won't need more than 100 connections"
└─ Says who? Based on what data?

"The API will always respond in under 1 second"
└─ What happens when it doesn't?
```

**Action:** Identify and validate assumptions explicitly.

### Smell: Missing Edge Cases

```
Happy path: "User uploads a file"
Missing: What if file is 0 bytes? 10GB? Wrong format? Network fails?
```

**Action:** Ask "What happens when X fails? When Y is empty? When Z times out?"

## Validation Techniques

### 1. Prototype or Model

Instead of building the full system:
- Create a quick proof of concept
- Validate assumptions with real data
- Reveals incomplete requirements immediately

### 2. Reframe from Different Angles

Express requirements in multiple formats:
- User stories
- Flow diagrams
- Technical specs
- Test cases

The act of translation reveals gaps.

### 3. Document Your Interpretation

Write down what you think the requirement means.
Show it to the requirement author.
Mismatches surface immediately.

### 4. Ask Domain Experts

Incomplete requirements often mean the people defining them don't fully understand the domain.
Find the actual domain expert. Ask them.

### 5. Walk Through Scenarios

For each requirement, ask:
- "Show me a concrete example"
- "What does the user see at each step?"
- "What data is needed?"
- "What can go wrong?"

## Red Flags in Requirements Documents

- Lots of "TBD" or "to be determined"
- Vague words: "fast," "easy," "user-friendly," "scalable"
- No acceptance criteria
- No edge cases mentioned
- Implementation details mixed with requirements
- No mention of what happens on failure
- Assumptions stated as facts

## The Senior Approach

Don't accept requirements passively.

Push back early when something is unclear, contradictory, or incomplete.

It's much cheaper to clarify now than to rebuild later.
