---
name: prompt-first-workflow
description: Enforce prompt engineering before execution - Always use prompt-engineering skill to refine user requests before implementing them. This ensures high-quality, well-structured prompts that lead to better results.
---

# Prompt-First Workflow

## Purpose

This skill enforces a mandatory workflow where every user request must first be analyzed and refined using the `prompt-engineering` skill before implementation begins. This prevents hasty execution and ensures all prompts are well-structured, clear, and comprehensive.

## When to Use

**ALWAYS** use this skill at the start of ANY user request that involves:
- Writing code
- Creating features
- Fixing bugs
- Refactoring
- Making changes to the codebase
- Generating content
- Any task requiring planning or execution

**Exception**: Do NOT use for simple informational questions like "What does this code do?" or "How do I access X?"

## Workflow

### Step 1: Detect User Intent

When a user makes a request, immediately recognize that it requires prompt engineering:

```
User: "Add a dark mode toggle"
↓
Trigger: prompt-first-workflow skill
↓
Action: Use prompt-engineering skill FIRST
```

### Step 2: Use Prompt Engineering Skill

Before doing ANYTHING else, invoke the `prompt-engineering` skill:

```typescript
Skill("prompt-engineering")
```

Provide the skill with:
1. The user's original request
2. Any context from the conversation
3. What you think the user wants (your interpretation)

### Step 3: Wait for Refined Prompt

The prompt-engineering skill will return a refined, comprehensive prompt that includes:
- Clear task description
- Success criteria
- Technical requirements
- Edge cases to consider
- Testing approach
- Documentation needs

### Step 4: Confirm with User

Present the refined prompt to the user:

```
"Based on your request, here's what I understand:

[Refined prompt from prompt-engineering skill]

Is this correct? Would you like to proceed with this approach?"
```

### Step 5: Execute Only After Confirmation

Only AFTER user confirms the refined prompt, proceed with implementation.

## Benefits

1. **Clarity**: Ensures both you and the user are aligned on requirements
2. **Completeness**: Catches missing details before implementation
3. **Quality**: Well-structured prompts lead to better code
4. **Efficiency**: Reduces back-and-forth and rework
5. **Documentation**: Creates a clear specification for the work

## Example Workflow

### Bad (Old Way):
```
User: "Add authentication"
Claude: *immediately starts coding*
User: "No, I meant OAuth, not basic auth!"
Claude: *has to redo everything*
```

### Good (Prompt-First):
```
User: "Add authentication"
Claude: *uses prompt-engineering skill*
Claude: "I've analyzed your request. Here's what I understand:
- Implement user authentication system
- Method: Should I use OAuth 2.0, JWT, or basic auth?
- Features needed: Login, logout, session management, password reset?
- Security: Rate limiting, password requirements?
- Integration: Should work with existing user database?"

User: "OAuth 2.0 with Google. Just login/logout for now."
Claude: *now has clear requirements, implements correctly first time*
```

## Templates

### For Code Requests:
```
User request: [original request]

Using prompt-engineering skill to clarify:
1. Exact feature to implement
2. Technical stack/approach
3. Edge cases
4. Testing requirements
5. Success criteria

[Wait for refined prompt]
[Confirm with user]
[Execute]
```

### For Bug Fixes:
```
User request: [original bug report]

Using prompt-engineering skill to understand:
1. Expected behavior
2. Actual behavior
3. Root cause hypothesis
4. Testing to verify fix
5. Regression prevention

[Wait for refined prompt]
[Confirm with user]
[Execute]
```

## Enforcement

**CRITICAL**: This is a MANDATORY workflow. If you catch yourself starting to code without first using prompt-engineering:

1. STOP immediately
2. Use prompt-engineering skill
3. Get refined prompt
4. Confirm with user
5. THEN proceed

## Integration with Other Skills

This skill works BEFORE all others:

```
User Request
    ↓
prompt-first-workflow (mandatory)
    ↓
prompt-engineering skill
    ↓
[Get refined prompt]
    ↓
[Confirm with user]
    ↓
[Execute using other skills: skill-router, systematic-debugging, etc.]
```

## Summary

**Remember**: Prompt engineering FIRST, execution SECOND. No exceptions.

This workflow ensures every task starts with a solid foundation, reducing errors and rework.
