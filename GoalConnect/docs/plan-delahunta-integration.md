# de Lahunta Reading Schedule Integration Plan

## Overview
Fully integrate the de Lahunta textbook reading schedule into the app with week-by-week tracking, dashboard visibility, and auto-sync with yearly goals.

---

## Current State

### What Exists:
1. **Seed endpoint** (`POST /api/seed/reading-schedule`) - Creates 26-week schedule for 2025
2. **26-week breakdown** - pp. 1-621, ~23 pages/week, Chapters 1-22
3. **Compound yearly goal support** - `goalType: "compound"` with `subItems[]`
4. **Weekly goals table** - Can link to yearly goal sub-items via description field

### What's Missing:
1. 2026 version of the reading schedule (current is 2025)
2. Dashboard widget showing "This week's reading"
3. Auto-population in weekly planner
4. Visual progress on IcyDash

---

## Phase 1: Update Seed Script for 2026

### Task 1.1: Create new reading schedule dates
Update `scripts/seed-2026-goals.ts` to include de Lahunta as compound goal:

```typescript
// Change from:
{ category: "residency", title: "Finish de Lahunta", goalType: "binary", targetValue: 1, xpReward: 150 }

// To:
{
  category: "residency",
  title: "Complete de Lahunta",
  goalType: "compound",
  targetValue: 26,
  xpReward: 500,
  subItems: [
    { id: uuid(), title: "Week 1: pp. 1-23 (Ch 1 + Ch 2)", completed: false },
    { id: uuid(), title: "Week 2: pp. 24-46 (Ch 2 + Ch 3)", completed: false },
    // ... all 26 weeks
  ]
}
```

### Task 1.2: Calculate 2026 dates
- Start: Week of Jan 5, 2026 (first full week)
- End: Week of June 28, 2026 (26 weeks later)
- Each week: Monday start date

**Files to modify:**
- `scripts/seed-2026-goals.ts`

---

## Phase 2: Dashboard Widget - "This Week's Reading"

### Task 2.1: Create ReadingWidget component

Location: `client/src/components/ReadingWidget.tsx`

```tsx
// Compact widget showing:
// ┌─────────────────────────────────────┐
// │ 📖 de Lahunta                       │
// │ This week: pp. 47-69 (Ch 3)         │
// │ ████████░░░░░░░░░░░░░  5/26         │
// │                          [✓] Done   │
// └─────────────────────────────────────┘
```

### Task 2.2: Add hook to get current week's reading

Location: `client/src/hooks/useCurrentReading.ts`

```typescript
export function useCurrentReading() {
  const { goals } = useYearlyGoals("2026");

  // Find de Lahunta goal
  const deLahunta = goals.find(g =>
    g.title.includes("de Lahunta") && g.goalType === "compound"
  );

  // Calculate current week based on date
  const currentWeekIndex = calculateWeekIndex();

  // Get current sub-item
  const currentReading = deLahunta?.subItems[currentWeekIndex];
  const completedWeeks = deLahunta?.subItems.filter(s => s.completed).length;

  return {
    goal: deLahunta,
    currentWeek: currentWeekIndex + 1,
    currentReading,
    completedWeeks,
    totalWeeks: 26,
    isCurrentWeekDone: currentReading?.completed,
  };
}
```

### Task 2.3: Add widget to IcyDash

Place in ROW 1 or ROW 2 (small, doesn't take much space):

```tsx
{/* Near Study Tracker */}
<ReadingWidget
  onToggle={() => toggleSubItem({
    goalId: deLahunta.id,
    subItemId: currentReading.id
  })}
/>
```

**Files to create:**
- `client/src/components/ReadingWidget.tsx`
- `client/src/hooks/useCurrentReading.ts`

**Files to modify:**
- `client/src/pages/IcyDash.tsx`

---

## Phase 3: Weekly Planner Integration

### Task 3.1: Auto-create weekly goal for current de Lahunta reading

When user views weekly planner, check if de Lahunta goal exists for that week:

```typescript
// In useWeeklyPlanner or similar
const ensureReadingGoalExists = async (weekStart: string) => {
  const existingGoal = weeklyGoals.find(g =>
    g.title.includes("de Lahunta") && g.week === isoWeek
  );

  if (!existingGoal && currentReadingWeek) {
    await createWeeklyGoal({
      title: `Read de Lahunta pp. ${currentReading.startPage}-${currentReading.endPage}`,
      week: isoWeek,
      linkedYearlyGoalId: deLahuntaGoal.id,
      linkedSubItemId: currentReading.id,
    });
  }
};
```

### Task 3.2: Sync completion between weekly goal and yearly sub-item

When weekly goal is completed → mark yearly goal sub-item as complete:

```typescript
// In goal completion handler
if (goal.linkedYearlyGoalId && goal.linkedSubItemId) {
  await toggleYearlySubItem({
    goalId: goal.linkedYearlyGoalId,
    subItemId: goal.linkedSubItemId,
  });
}
```

**Files to modify:**
- `client/src/hooks/useWeeklyPlanner.ts` (or create)
- `server/routes/goals.ts` (add sync logic)

---

## Phase 4: Visual Polish

### Task 4.1: Progress visualization in yearly goals

When viewing de Lahunta in Goals page (Yearly tab):
- Expand to show all 26 weeks as sub-items
- Highlight current week with different color
- Show checkmarks for completed weeks
- Mini calendar view option?

### Task 4.2: Reading streak tracking

Track consecutive weeks completed:
- "🔥 5 week reading streak!"
- Bonus XP for streaks (5 weeks = +50 XP, 10 weeks = +100 XP)

---

## Data Model Reference

### Yearly Goal (compound type):
```typescript
{
  id: 123,
  title: "Complete de Lahunta",
  goalType: "compound",
  targetValue: 26,
  subItems: [
    { id: "uuid-1", title: "Week 1: pp. 1-23 (Ch 1 + Ch 2)", completed: true },
    { id: "uuid-2", title: "Week 2: pp. 24-46 (Ch 2 + Ch 3)", completed: true },
    { id: "uuid-3", title: "Week 3: pp. 47-69 (Ch 3)", completed: false },  // current
    // ...
  ],
  computedValue: 2,  // auto-calculated from completed sub-items
  progressPercent: 8,
}
```

### Reading Schedule Data:
```typescript
const READING_SCHEDULE_2026 = [
  { week: 1, startDate: "2026-01-05", endDate: "2026-01-11", startPage: 1, endPage: 23, content: "Ch 1 + Ch 2" },
  { week: 2, startDate: "2026-01-12", endDate: "2026-01-18", startPage: 24, endPage: 46, content: "Ch 2 + Ch 3" },
  { week: 3, startDate: "2026-01-19", endDate: "2026-01-25", startPage: 47, endPage: 69, content: "Ch 3" },
  // ... through week 26
  { week: 26, startDate: "2026-06-22", endDate: "2026-06-28", startPage: 591, endPage: 621, content: "Ch 22" },
];
```

---

## Implementation Order

1. **Phase 1** - Update seed script (30 min)
   - Quick win, gets data in place

2. **Phase 2** - Dashboard widget (1-2 hours)
   - Most visible improvement
   - User sees "this week's reading" immediately

3. **Phase 3** - Weekly planner sync (1-2 hours)
   - More complex, involves bi-directional sync

4. **Phase 4** - Polish (optional)
   - Streaks, visual improvements

---

## Questions to Resolve

1. Should 2025 schedule be migrated to 2026, or keep both?
2. What if user is behind schedule - show "catch up" mode?
3. Should reading widget replace something on dashboard or be added?
4. XP rewards per week completed? (currently sub-items give 25 XP each)

---

## Success Criteria

- [ ] "Complete de Lahunta" shows as compound goal with 26 sub-items
- [ ] IcyDash shows "This week: pp. X-Y" widget
- [ ] Clicking checkbox marks sub-item complete
- [ ] Progress bar shows 5/26, 10/26, etc.
- [ ] Weekly planner shows de Lahunta reading for current week
