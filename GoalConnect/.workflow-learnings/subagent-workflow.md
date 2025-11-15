# 🤖 Subagent Workflow Guide

## What Are Subagents?

Subagents are specialized AI agents that can be launched in parallel to analyze different aspects of your codebase simultaneously. Think of them as team members who can work on separate tasks at the same time.

## When to Use Subagents

### ✅ **ALWAYS use subagents for:**

1. **Parallel Analysis Tasks** - When you need to investigate multiple independent issues
2. **Large Codebases** - When searching/analyzing would take significant time
3. **Complex Investigations** - When you need deep analysis of different components
4. **Multi-faceted Problems** - When a bug could have multiple root causes

### ❌ **DON'T use subagents for:**

1. **Sequential Tasks** - When Task B depends on Task A's result
2. **Simple File Reads** - Just use Read tool directly
3. **Single File Edits** - Edit tool is faster
4. **Quick Greps** - Direct Grep is more efficient

## Real Example: Base Camp Dashboard Fixes

### Problem
User reported 3 major issues:
1. No glassmorphism effect visible
2. Clunky layout with wasted space
3. Playwright can't authenticate to view the app

### Traditional Approach (Sequential)
```
1. Read GlassCard.tsx → 2min
2. Check all card components → 5min
3. Analyze layout spacing → 5min
4. Read auth files → 3min
5. Debug auth issue → 10min
Total: ~25 minutes
```

### Subagent Approach (Parallel)
```
Launch 3 subagents simultaneously:

Subagent 1: "Investigate glassmorphism"
- Read GlassCard.tsx
- Check all 5 dashboard card components
- Analyze CSS variables
- Report findings

Subagent 2: "Analyze layout spacing"
- Read DashboardBaseCamp.tsx
- Check all card components for padding
- Identify wasted space
- List specific line numbers to fix

Subagent 3: "Fix Playwright auth"
- Read Login.tsx for form structure
- Read simple-auth.ts for API
- Analyze auth flow
- Provide fixed auth.setup.ts

Total: ~8 minutes (parallel execution)
```

**Time Saved: 17 minutes (68% faster)**

## How to Request Subagent Usage

### Example Prompts

**Good:**
```
"Analyze why my dashboard cards look clunky - check glassmorphism,
spacing, and layout. Use subagents to investigate all three in parallel."
```

**Better:**
```
"Use 3 parallel subagents to:
1. Investigate glassmorphism rendering
2. Find excessive spacing/padding issues
3. Debug Playwright authentication

Report all findings together."
```

**Best:**
```
"Launch parallel subagents to analyze these independent issues:
- Glassmorphism: Check GlassCard implementation and all card components
- Layout: Identify wasted space in DashboardBaseCamp and card padding
- Auth: Debug why Playwright tests can't authenticate

Have each subagent provide specific file:line fixes."
```

## Subagent Output Quality

### What You Get Back

Each subagent returns a comprehensive report with:

1. **Root Cause Analysis** - What's actually wrong
2. **Specific File Locations** - Exact file paths and line numbers
3. **Recommended Fixes** - Code changes with before/after
4. **Context** - Why the issue exists
5. **Priority** - Which fixes are most critical

### Example Output

```markdown
## Glassmorphism Investigation Results

**Root Cause:** Opacity too high (75%) creates insufficient contrast
with warm cream background.

**Files to Fix:**
- client/src/components/ui/GlassCard.tsx:24
  Change: opacity = 75 → opacity = 60
- client/src/components/ui/GlassCard.tsx:45
  Change: border-border/30 → border-border/50

**Why This Works:**
60% opacity creates visible transparency against cream background,
50% border opacity makes glass edges more distinct.

**Priority:** HIGH - User-visible design issue
```

## Workflow Integration

### Current Workflow (Updated)

```markdown
## When I make UI changes:
1. IMMEDIATELY use subagents to analyze impact:
   - Subagent 1: Visual/design analysis
   - Subagent 2: Layout/spacing check
   - Subagent 3: Accessibility review
2. READ the subagent reports
3. Apply all fixes in parallel
4. Run /visual-check to verify
5. Fix any remaining issues
6. Push to production
```

## Cost/Performance

### Token Usage
- **Single analysis:** ~5k-10k tokens
- **3 parallel subagents:** ~15k-30k tokens total
- **Budget:** 200k tokens per session = 6-13 full parallel analyses

### Speed Comparison
| Task | Sequential | Parallel | Savings |
|------|-----------|----------|---------|
| 3 file investigations | 15min | 5min | 67% |
| Component analysis | 10min | 4min | 60% |
| Debug 3 issues | 25min | 8min | 68% |

**Average time savings: 65%**

## Best Practices

### 1. Clear Task Boundaries
```
✅ Good: "Analyze glassmorphism implementation"
❌ Bad: "Check styling"
```

### 2. Specify Expected Output
```
✅ Good: "Report specific file:line changes needed"
❌ Bad: "Tell me what's wrong"
```

### 3. Independent Tasks Only
```
✅ Good: Parallel auth debug + layout analysis
❌ Bad: Parallel "fix auth" + "test the fix"
```

### 4. Use Fast Models for Simple Tasks
```
Use model="haiku" for straightforward analysis to save tokens
Use model="sonnet" (default) for complex reasoning
Use model="opus" only when absolutely necessary
```

## Future Automation

### Ideas to Implement

1. **Auto-Launch on Error**
   - Git pre-push hook triggers visual analysis
   - Auto-launch 3 subagents: types, tests, visual
   - Block push if any agent finds issues

2. **Proactive Code Review**
   - On file save, launch subagent to check:
     - Accessibility (WCAG AA)
     - Performance (bundle size, re-renders)
     - Security (XSS, injection risks)

3. **Documentation Generation**
   - Subagent reads all components in folder
   - Generates component API docs
   - Updates README automatically

## Summary

**Use subagents whenever you have 2+ independent analysis tasks.**

They work in parallel, provide detailed file:line reports, and save 65% of analysis time on average. Perfect for complex debugging, codebase exploration, and multi-faceted problems.

**Default to parallel execution - it's almost always faster.**
