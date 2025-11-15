# 🧠 Workflow Learning System

This directory tracks what we learn as we work, so the workflow gets smarter over time.

## How It Works

Every time something breaks, takes too long, or could be better, we:
1. **Document the issue** in the appropriate learning file
2. **Add automation** to prevent it next time
3. **Update the workflow** based on what we learned

## Learning Categories

- `build-failures.md` - Build issues and how we fixed them
- `deployment-issues.md` - Railway/deployment problems
- `time-wasters.md` - Things that slow us down
- `optimization-wins.md` - Things that made us faster
- `code-patterns.md` - Repeated patterns we should automate
- `user-preferences.md` - Your specific preferences and style

## The Loop

```
Work → Hit Issue → Document → Automate → Improve Workflow → Work Better
```

## How Claude Uses This

When you ask me to do something, I:
1. Check these files for previous learnings
2. Apply those learnings to avoid past mistakes
3. Add new learnings when we discover better ways
4. Suggest workflow improvements based on patterns

## Example

**Before this system:**
- We pushed code without testing the build
- Railway deployment failed
- Wasted time debugging

**After learning:**
- Added pre-push hooks to test builds
- Now we catch build issues before pushing
- Saved time on every future push

## Your Learnings Start Now

This system learns from today forward. Every issue becomes a lesson.
