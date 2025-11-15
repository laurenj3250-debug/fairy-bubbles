# 🏔️ GoalConnect Development Workflow

**The ideal workflow for building Base Camp - your climbing habit tracker**

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Development Cycle](#development-cycle)
3. [Feature Development Workflow](#feature-development-workflow)
4. [Code Quality Gates](#code-quality-gates)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Process](#deployment-process)
7. [Team Collaboration](#team-collaboration)

---

## 🚀 Quick Start

### Daily Development Flow

```bash
# 1. Start your day
git pull origin main
npm install  # If dependencies changed

# 2. Start dev server
npm run dev

# 3. Work on features (see Feature Development Workflow below)

# 4. Before committing
/security-review
/code-review
npm run check        # TypeScript check
npm run test         # Run Playwright tests

# 5. Commit and push
git add .
git commit -m "feat: add mountain hero glassmorphism"
git push

# 6. Create PR and review automated feedback
```

---

## 🔄 Development Cycle

### The 4-Phase Cycle

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  PLAN → BUILD → REVIEW → DEPLOY                        │
│    ↑                            │                       │
│    └────────────────────────────┘                       │
│              (Iterate)                                  │
└─────────────────────────────────────────────────────────┘
```

### 1. **PLAN Phase** (30 min - 2 hours)

**Before writing any code:**

✅ **Define the feature clearly**
```bash
# Ask yourself:
- What problem does this solve?
- What does success look like?
- What are the edge cases?
```

✅ **Break into tasks**
```bash
# Use TodoWrite to track:
/claude
> I need to add dark mode support

# Claude creates todos:
1. Design dark color palette
2. Update theme system
3. Add theme toggle component
4. Test in all browsers
```

✅ **Check existing code**
```bash
# Search for similar patterns
/claude
> Show me how theming currently works

# Review existing components
npm run dev
# Navigate and inspect
```

✅ **Design review for UI features**
```bash
# For UI work, sketch it first
/design-review

# Get feedback on:
- Color choices
- Accessibility
- Responsive layout
```

---

### 2. **BUILD Phase** (2-8 hours)

**Writing quality code from the start:**

#### A. Set up feature branch
```bash
git checkout -b feature/dark-mode
```

#### B. Development loop

```bash
# LOOP:
while feature_not_complete:
    # 1. Write small incremental changes
    # 2. Test in browser immediately
    npm run dev

    # 3. Check TypeScript
    npm run check

    # 4. Fix errors immediately
    # Don't accumulate technical debt!
```

#### C. Component development checklist

For each new component:

- [ ] TypeScript interfaces defined
- [ ] Props documented
- [ ] Default values provided
- [ ] Handles loading state
- [ ] Handles error state
- [ ] Handles empty state
- [ ] Accessible (ARIA labels, keyboard nav)
- [ ] Responsive (mobile + desktop)
- [ ] Uses theme variables (no hardcoded colors)
- [ ] Focus indicators visible

#### D. Commit frequently

```bash
# Small, atomic commits
git add client/src/components/DarkModeToggle.tsx
git commit -m "feat: add dark mode toggle component"

git add client/src/themes/config.ts
git commit -m "feat: add dark theme colors to config"

# NOT this:
git add .
git commit -m "add dark mode"  # ❌ Too vague, too big
```

---

### 3. **REVIEW Phase** (30 min - 1 hour)

**Before creating PR:**

#### A. Self-Review Checklist

```bash
# 1. Run all automated reviews
/security-review     # Check for vulnerabilities
/code-review         # Check code quality
/design-review       # Check UI/UX (if applicable)

# 2. Run tests
npm run test:ui      # Playwright tests

# 3. TypeScript check
npm run check

# 4. Manual testing
npm run dev
# Test all user flows:
# - Happy path
# - Error cases
# - Edge cases
# - Different screen sizes
```

#### B. Code Review Standards

**Before pushing, check:**

- [ ] **No console.logs** in production code
- [ ] **No commented-out code** (delete it, use git history)
- [ ] **No TODO comments** without tickets
- [ ] **No secrets** (API keys, passwords)
- [ ] **All TypeScript errors resolved**
- [ ] **All Playwright tests passing**
- [ ] **Accessibility tested** (keyboard navigation works)
- [ ] **Responsive tested** (mobile + desktop)

#### C. Visual regression check

```bash
# Take screenshots before/after
npm run test:ui

# Compare visually:
# - Does glassmorphism still work?
# - Are colors still accessible?
# - Is layout still correct?
```

---

### 4. **DEPLOY Phase** (15 min - 1 hour)

#### A. Create Pull Request

```bash
git push origin feature/dark-mode

# On GitHub:
# 1. Create PR
# 2. Use PR template (see below)
# 3. Add screenshots for UI changes
# 4. Link related issues
```

#### B. Automated Checks

**GitHub Actions will automatically run:**
- ✅ Code review bot (comments on code quality)
- ✅ Security scan bot (flags vulnerabilities)
- ✅ TypeScript compilation
- ✅ Playwright tests (all browsers)

**Wait for all checks to pass before merging!**

#### C. Address feedback

```bash
# If bots find issues:
# 1. Read the comments carefully
# 2. Fix the issues
# 3. Push updates
git add .
git commit -m "fix: address code review feedback"
git push

# Automated checks re-run automatically
```

#### D. Merge

```bash
# Once all checks pass:
# 1. Squash and merge (keeps history clean)
# 2. Delete feature branch
# 3. Pull latest main
git checkout main
git pull origin main
```

---

## 🎯 Feature Development Workflow

### Example: Adding a New Dashboard Card

#### **Week 1: Planning & Design**

**Monday:**
```bash
# 1. Define feature
/claude
> I need to add a "Weekly Goals" card to the dashboard

# 2. Review design
/design-review

# 3. Check existing patterns
# Read: GoalsCard.tsx, TodayCard.tsx
```

**Tuesday-Wednesday:**
```bash
# 4. Create mockup/sketch
# - What data does it show?
# - What interactions does it have?
# - How does it fit in the layout?

# 5. Break into tasks
# Use TodoWrite to create:
# - Create WeeklyGoalsCard component
# - Add API endpoint for weekly data
# - Write Playwright tests
# - Update dashboard layout
```

#### **Week 1: Thursday-Friday (Build Phase)**

```bash
# 1. Create branch
git checkout -b feature/weekly-goals-card

# 2. Build incrementally
# Day 1: Component shell
# Day 2: Data fetching
# Day 3: Interactions
# Day 4: Styling
# Day 5: Tests

# 3. Commit after each milestone
git commit -m "feat: add WeeklyGoalsCard component shell"
git commit -m "feat: add weekly goals data fetching"
git commit -m "feat: add goal progress interactions"
git commit -m "style: apply glassmorphism to weekly goals card"
git commit -m "test: add Playwright tests for weekly goals"
```

#### **Week 2: Monday (Review Phase)**

```bash
# 1. Self-review
/code-review
/security-review
/design-review

# 2. Fix issues
# 3. Run all tests
npm run test
npm run check

# 4. Manual testing
# Test on: Chrome, Firefox, Safari
# Test on: Desktop (1440×900), Mobile (375×667)
```

#### **Week 2: Tuesday (Deploy Phase)**

```bash
# 1. Create PR
git push origin feature/weekly-goals-card

# 2. Wait for automated reviews
# 3. Address feedback
# 4. Merge when green
```

---

## 🛡️ Code Quality Gates

### Gate 1: Before Every Commit

```bash
# Must pass:
npm run check  # TypeScript
```

### Gate 2: Before Creating PR

```bash
# Must pass:
/security-review  # No vulnerabilities
/code-review      # Code quality good
npm run test      # All tests pass
```

### Gate 3: Before Merging PR

```bash
# Must pass:
✅ GitHub Actions: Code Review
✅ GitHub Actions: Security Scan
✅ GitHub Actions: TypeScript Build
✅ GitHub Actions: Playwright Tests
✅ Manual review approved
```

### Gate 4: Before Deploying to Production

```bash
# Must verify:
✅ All tests pass on staging
✅ Manual QA complete
✅ Performance metrics acceptable
✅ Accessibility audit passed
✅ Security scan clean
✅ Database migrations tested
```

---

## 🧪 Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │ E2E Tests   │  ← Playwright (User flows)
        │   (Slow)    │
        ├─────────────┤
        │ Integration │  ← API + DB tests
        │   (Medium)  │
        ├─────────────┤
        │ Unit Tests  │  ← Component tests
        │   (Fast)    │
        └─────────────┘
```

### When to Write Tests

#### **E2E Tests (Playwright)** - Write for:
- ✅ Critical user flows (login, complete habit, view stats)
- ✅ Happy paths (most common use cases)
- ✅ Major features (dashboard, goals, habits)

**Don't test:**
- ❌ Every edge case
- ❌ CSS styling details
- ❌ Internal implementation

#### **Component Tests** - Write for:
- ✅ Complex logic (calculation functions)
- ✅ Utility functions (date formatting, scoring)
- ✅ Edge cases (null handling, error states)

### Testing Workflow

```bash
# 1. Write feature code first
# (TDD is ideal but not required)

# 2. Add E2E test for main flow
# tests/weekly-goals.spec.ts

# 3. Run tests during development
npm run test:ui  # Watch tests run visually

# 4. Debug failures
npm run test:debug

# 5. Ensure all tests pass before PR
npm run test
```

### Test Coverage Goals

- **E2E**: 80%+ of critical user flows
- **Unit**: 70%+ of utility functions
- **Integration**: 60%+ of API endpoints

**Quality over quantity!** A few good tests > many bad tests.

---

## 🚢 Deployment Process

### Development → Staging → Production

```
┌──────────────┐      ┌─────────┐      ┌────────────┐
│ Development  │  →   │ Staging │  →   │ Production │
│ (localhost)  │      │ (test)  │      │   (live)   │
└──────────────┘      └─────────┘      └────────────┘
     Daily            Weekly          Every 2 weeks
```

### Deployment Checklist

#### **Pre-Deployment** (30 min before deploy)

- [ ] All tests passing
- [ ] No console errors in browser
- [ ] TypeScript compilation successful
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] Performance benchmarks acceptable
- [ ] Security scan clean
- [ ] Accessibility audit passed

#### **Deployment** (Railway/Vercel)

```bash
# 1. Merge to main
git checkout main
git pull origin main

# 2. Deploy automatically triggers
# (Railway watches main branch)

# 3. Monitor deployment logs
railway logs

# 4. Verify deployment
curl https://your-app.railway.app/health
```

#### **Post-Deployment** (15 min after deploy)

- [ ] App loads successfully
- [ ] Login works
- [ ] Dashboard renders
- [ ] Habits can be completed
- [ ] No JavaScript errors in console
- [ ] Database connections working
- [ ] API responses fast (<500ms)

#### **Rollback Plan**

If deployment fails:

```bash
# Option 1: Revert commit
git revert HEAD
git push origin main

# Option 2: Redeploy previous version
railway redeploy <previous-deployment-id>

# Option 3: Emergency hotfix
git checkout -b hotfix/fix-critical-bug
# ... fix ...
git push
# Fast-track PR merge
```

---

## 👥 Team Collaboration

### Branch Strategy

```
main (production)
  ├─ develop (staging)
  │   ├─ feature/dark-mode
  │   ├─ feature/weekly-goals
  │   └─ bugfix/habit-toggle
  └─ hotfix/critical-security-fix
```

### Branch Naming

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Emergency production fixes
- `refactor/` - Code improvements
- `docs/` - Documentation updates
- `test/` - Test additions

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semi-colons, etc
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding tests
- `chore`: Maintain

**Examples:**

```bash
feat(dashboard): add weekly goals card

Add a new glassmorphism card showing weekly goal progress.
Includes segmented progress bars and completion percentages.

Closes #123
```

```bash
fix(habits): prevent double-toggle on rapid clicks

Add debouncing to habit toggle button to prevent
race conditions when user clicks multiple times quickly.

Fixes #456
```

### Code Review Standards

#### **As a Reviewer:**

✅ **Do:**
- Be kind and constructive
- Ask questions, don't demand changes
- Praise good work
- Test the code locally
- Check accessibility

❌ **Don't:**
- Nitpick style (let linters handle it)
- Block PRs for personal preferences
- Review when tired/rushed
- Assume malice

#### **As an Author:**

✅ **Do:**
- Keep PRs small (<400 lines)
- Write clear descriptions
- Add screenshots for UI changes
- Respond to feedback promptly
- Thank reviewers

❌ **Don't:**
- Take feedback personally
- Argue over minor points
- Merge without approval
- Break the build

---

## 🔧 Tools & Automation

### Required Tools

```bash
# Development
- Node.js 20+
- npm
- Git
- VS Code (recommended)

# VS Code Extensions (recommended)
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Playwright Test for VSCode
```

### Pre-Commit Hook (Recommended)

```bash
# Install Husky
npm install -D husky
npx husky init

# Add pre-commit hook
echo "npm run check && npm run test" > .husky/pre-commit
chmod +x .husky/pre-commit
```

Now every commit automatically:
- ✅ Checks TypeScript
- ✅ Runs tests

**Prevents broken code from being committed!**

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

---

## 📊 Metrics & KPIs

### Track These Metrics

**Code Quality:**
- TypeScript error count (goal: 0)
- Test coverage (goal: >70%)
- Code review turnaround time (goal: <24 hours)

**Performance:**
- Page load time (goal: <2 seconds)
- API response time (goal: <500ms)
- Lighthouse score (goal: >90)

**User Experience:**
- Habit completion success rate
- Dashboard load failures (goal: <1%)
- Mobile usability score (goal: >85)

---

## 🎓 Best Practices Summary

### Golden Rules

1. **Small, frequent commits** > Large infrequent commits
2. **Tests before merge** > Fix tests later
3. **Review before push** > Fix after deployment
4. **Automate everything** > Manual processes
5. **Document as you go** > Document later
6. **Ask questions early** > Assume and be wrong

### Workflow Anti-Patterns (Avoid!)

❌ **The "Big Bang" PR**
- 2000+ lines changed
- Touches 50 files
- Takes a week to review
→ **Instead:** Break into smaller PRs

❌ **The "Push and Pray"**
- No tests written
- "Works on my machine"
- Fingers crossed on deploy
→ **Instead:** Test thoroughly first

❌ **The "Merge and Run"**
- Merge without reviews
- Skip CI checks
- Deploy immediately
→ **Instead:** Wait for approval and tests

❌ **The "TODO Mountain"**
- Code full of TODO comments
- "I'll fix it later" (never does)
- Technical debt accumulates
→ **Instead:** Fix issues immediately

---

## 🚀 Getting Started Checklist

Your first day on the project:

- [ ] Clone repo
- [ ] Run `npm install`
- [ ] Run `npm run dev` - verify it works
- [ ] Read this workflow doc
- [ ] Review existing components
- [ ] Run `/code-review` to understand patterns
- [ ] Write your first test
- [ ] Make a small contribution (fix a typo, add a comment)
- [ ] Create your first PR
- [ ] Celebrate! 🎉

---

**Questions? Run `/claude` and ask!**

**This workflow evolves - suggest improvements via PR!**
