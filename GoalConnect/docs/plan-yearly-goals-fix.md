# Plan: Fix Yearly Goals System

## Problem Summary
1. **De Lahunta not appearing** - seed script hasn't been run against database
2. **Can't link to weekly planner** - yearly goal sub-items don't show up in weekly schedule
3. **No week/month scoping** - yearly goals only track full year totals

---

## Phase 1: Seed de Lahunta (5 min)

**Goal:** Get the 26-week de Lahunta compound goal appearing under Residency

**Action:** Call `POST /api/seed/reading-schedule` endpoint

**Result:** "Complete de Lahunta" appears in 2026 Residency goals with 26 checkable weekly sub-items

---

## Phase 2: Link Sub-Items to Weekly Planner (2-3 hours)

**Goal:** Week 5's planner shows "Read de Lahunta pp. 93-115" as a task

### Schema Changes

Add to `goals` table (weekly goals):
```sql
linkedYearlyGoalId INTEGER REFERENCES yearly_goals(id)
linkedSubItemId VARCHAR(50)  -- UUID of the sub-item
```

### API Changes

1. Update `/api/seed/reading-schedule` to create weekly goals for each of the 26 weeks
2. Add sync endpoint: when weekly goal toggled, auto-toggle yearly sub-item
3. Add reverse sync: when yearly sub-item toggled, auto-toggle weekly goal

### UI Changes

1. Weekly planner shows linked yearly sub-items with a "yearly goal" badge
2. Checking off in either place syncs both

---

## Phase 3: Date Scoping (Optional, 2 hours)

**Goal:** Support quarterly/monthly goals like "Q1 Fitness" or "Summer Reading"

### Schema Changes

Add to `yearlyGoals` table:
```sql
startDate DATE  -- defaults to Jan 1
endDate DATE    -- defaults to Dec 31
```

### Logic Changes

- Progress computation only counts within date range
- UI shows active/inactive status based on current date

---

## Phase 4: Weekly Pace Indicator (Optional, 1 hour)

**Goal:** "200 lifting days" shows "4/week target" with on-track status

### UI Changes

- Show `weeklyTarget = targetValue / 52` on count goals
- Add pace badge: "on track" / "behind" / "ahead"
- Compare current progress vs expected progress for this point in year

---

## Recommended Execution Order

| Phase | Priority | Effort | Dependency |
|-------|----------|--------|------------|
| 1 | NOW | 5 min | None |
| 2 | HIGH | 2-3 hrs | Phase 1 |
| 3 | LOW | 2 hrs | None |
| 4 | LOW | 1 hr | None |

---

## Success Criteria

- [ ] De Lahunta shows under Residency with 26 sub-items
- [ ] Checking a sub-item awards 25 XP
- [ ] Weekly planner shows current week's de Lahunta reading
- [ ] Checking off in weekly planner syncs to yearly goal
