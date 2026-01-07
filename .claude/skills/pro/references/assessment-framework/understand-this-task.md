# Step 1: Understand THIS Task

Ask these questions FIRST, before writing any code.

## Requirements Discovery

### What is the actual goal?

- Not just what was asked, but what problem are we solving
- Who is this for? What do they need?
- Why does this matter to the business?

### What does "done" look like?

- Specific acceptance criteria (not vague descriptions)
- Testable conditions
- Edge cases included

**Bad:** "User can log in"
**Good:** "User can log in with email/password, sees error on invalid credentials, is redirected to dashboard on success, session persists for 24 hours"

### What are the unstated assumptions?

- What is everyone assuming that hasn't been said?
- What "obvious" things might not be obvious?
- What prior context am I missing?

## Scope Discovery

### What type of work is this?

| Type | Characteristics |
|------|-----------------|
| UI work | User-facing, visual, interactive |
| Backend | API, data, business logic |
| Full-stack | Both sides, integration |
| Infrastructure | DevOps, deployment, config |
| Bug fix | Something broken that worked before |
| Refactor | Changing structure, not behavior |
| New feature | Adding new capability |
| Performance | Making existing things faster |

### Does this touch existing systems?

- What existing code will be affected?
- What systems does this integrate with?
- What dependencies exist?

### What's the blast radius?

If something goes wrong:
- Who/what is affected?
- How bad is the worst case?
- Can we roll back easily?

### Quick fix or architectural change?

| Quick Fix | Architectural |
|-----------|---------------|
| Localized change | Touches many files |
| Clear solution | Multiple valid approaches |
| Low risk | High risk |
| Hours | Days/weeks |

This determines how much planning is needed.

## Output

Before proceeding, you should have:

1. **Clear goal statement** - One sentence describing what success looks like
2. **Acceptance criteria** - Testable list of requirements
3. **Scope understanding** - What type of work, what's touched
4. **Risk assessment** - What could go wrong

If any of these are unclear, **ask questions now**, not during implementation.

## Red Flags

- "Just make it work" (no clear criteria)
- "You'll know it when you see it" (no definition of done)
- "It should be simple" (famous last words)
- "Can you just..." (scope minimization)

When you see these, push back with specific questions.
