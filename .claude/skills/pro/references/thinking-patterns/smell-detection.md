# Smell Detection

Recognize patterns that signal deeper problems.

## Code Smells (Instant Recognition)

| Smell | Signal | Underlying Problem |
|-------|--------|-------------------|
| **Long methods** (50+ lines) | Hard to read/test | Poor responsibility distribution |
| **Duplicate code** | Copy-paste patterns | Missing abstraction |
| **Primitive obsession** | String for email, int for money | Shallow domain modeling |
| **Large classes** | 500+ lines, many responsibilities | Confused architecture |
| **Feature envy** | Method uses another class's data more than its own | Wrong location |
| **Data clumps** | Same 3+ params passed together | Missing object |
| **Refused inheritance** | Subclass ignores inherited methods | Broken hierarchy |
| **Comments explaining what** | `// increment counter` | Code not self-documenting |
| **Magic numbers** | `if (status === 3)` | Missing constants/enums |
| **God objects** | One class that knows everything | No separation of concerns |

## Situation Smells (System-Level)

| Smell | Signal | Underlying Problem |
|-------|--------|-------------------|
| **Growing requirements without clarity** | Scope keeps expanding | Unmanaged scope creep |
| **"We'll figure it out later"** | Deferred decisions | Technical debt accumulating |
| **Same bug recurring** | Fixed 3+ times | Root cause not addressed |
| **Circular changes** | A needs B needs A | Architectural coupling |
| **"Works on my machine"** | Environment-dependent | Untested assumptions |
| **Fear of changing code** | Nobody touches module X | Missing tests, unclear behavior |
| **Long deploy times** | Hours to ship | Pipeline/architecture problems |
| **Tribal knowledge** | Only Alice knows how X works | Documentation debt |

## Detection vs. Fixing

**Detection is the skill.** You don't have to fix every smell immediately.

What to do when you detect a smell:
1. **Acknowledge it** - Don't pretend it's fine
2. **Assess severity** - Blocking? Annoying? Future problem?
3. **Decide action** - Fix now, ticket for later, or accept
4. **Document if deferring** - Future you will thank you

## Why Seniors Detect Earlier

They've seen how "small" smells compound. A small duplicate in month 1 becomes maintenance hell in month 12.

Pattern recognition comes from exposure. The more codebases you see, the faster you smell problems.

## The Key Insight

Smells aren't rules violations. They're signals that something might be wrong.

Trust your instinct when something "feels off." Then investigate.
