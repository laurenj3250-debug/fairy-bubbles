# Habit Science Overhaul - Make the Planner Actually Work

## Problems Identified (from Habit Expert Roast)

1. **Goals Without Implementation Intentions** - No "when/where" behavior anchoring
2. **Habit Dots Are Worthless** - Can't see which habits completed, streaks, what's breaking
3. **No Habit Stacking** - Habits float in isolation, no cue association
4. **Weekly/Monthly Goals Don't Link** - Fake title-matching, no real `parentGoalId`
5. **No Review/Reflection** - No weekly review ritual
6. **Progress Bars Without Milestones** - Linear progress, no checkpoints
7. **Task Completion Doesn't Feed Goals** - Tasks and goals live in parallel universes
8. **No Friction Logging** - Don't know why habits were skipped
9. **Streak-Blind Design** - No prominent streak display per habit
10. **No "2-Day Rule" Support** - No warning for consecutive misses

---

## Phase 1: Connect Tasks to Goal Progress (Critical)

### Problem
Completing a task linked to a goal (via `goalId`) does nothing to the goal's `currentValue`.

### Solution
Modify the todo completion endpoint to auto-increment linked goal progress.

**File:** `server/routes.ts` (line ~571-588)

```ts
app.post("/api/todos/:id/complete", async (req, res) => {
  // ... existing ownership checks ...

  const completed = await storage.completeTodo(id);

  // NEW: Auto-increment goal progress if task is linked
  if (completed.goalId && !existing.completed) {
    const goal = await storage.getGoal(completed.goalId);
    if (goal && goal.currentValue < goal.targetValue) {
      await storage.updateGoalProgress(completed.goalId, completed.userId, {
        value: 1,
        note: `Completed task: ${completed.title}`,
        date: format(new Date(), "yyyy-MM-dd"),
      });
    }
  }

  res.json(completed);
});
```

Also update `app.patch("/api/todos/:id")` to handle toggling completion.

---

## Phase 2: Real Streak Display in Planner

### Problem
StreakFlames component uses mock data. WeeklyPlannerPage habits section shows dots but not streak counts.

### Solution

**File:** `client/src/pages/WeeklyPlannerPage.tsx`

Replace the compact habits dots section with a streak-aware display:

```tsx
// In Habits Compact section, add streak info
{weekDays.map(day => {
  const data = habitWeekData[day.dateStr];
  const allDone = data?.total > 0 && data.completed >= data.total;
  // ... existing dot rendering ...
})}

// Add below the dots:
<div className="mt-3 pt-3 border-t border-card-border">
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground">Current streak</span>
    <span className="text-sm font-bold text-orange-500 flex items-center gap-1">
      <Flame className="w-4 h-4" />
      {overallStreak} days
    </span>
  </div>
</div>
```

**File:** `server/routes/habits.ts`

Ensure `/api/habits-with-data` calculates real streaks (it already does via `calculateStreak`).

---

## Phase 3: Add Implementation Intention Field to Goals

### Problem
Goals have no "when/where" anchoring.

### Solution

**File:** `shared/schema.ts`

Add to goals table:
```ts
implementationIntention: text("implementation_intention"), // "I will [X] at [TIME] in [LOCATION]"
```

**File:** `client/src/components/GoalDialog.tsx`

Add a field after description:
```tsx
<div>
  <label className="text-xs uppercase tracking-wider text-muted-foreground">
    Implementation Intention (optional)
  </label>
  <input
    type="text"
    placeholder="I will [behavior] at [time] in [location]"
    value={implementationIntention}
    onChange={(e) => setImplementationIntention(e.target.value)}
    className="..."
  />
  <p className="text-xs text-muted-foreground mt-1">
    e.g., "I will review flashcards at 7am in my kitchen"
  </p>
</div>
```

---

## Phase 4: Add `parentGoalId` for Goal Hierarchy

### Problem
Weekly goals should explicitly link to monthly goals, not via title matching.

### Solution

**File:** `shared/schema.ts`

Add to goals table:
```ts
parentGoalId: integer("parent_goal_id").references(() => goals.id, { onDelete: "set null" }),
```

**File:** `client/src/components/GoalDialog.tsx`

When creating a weekly goal, show a dropdown of current month's goals:
```tsx
{goalType === "weekly" && monthlyGoals.length > 0 && (
  <div>
    <label>Links to Monthly Goal</label>
    <select value={parentGoalId} onChange={...}>
      <option value="">None</option>
      {monthlyGoals.map(g => (
        <option key={g.id} value={g.id}>{g.title}</option>
      ))}
    </select>
  </div>
)}
```

**File:** `client/src/pages/WeeklyPlannerPage.tsx`

Replace fake title matching:
```tsx
// OLD (fake)
const linkedMonthly = monthlyGoals.find(mg =>
  goal.title.toLowerCase().includes(mg.title.toLowerCase().split(' ')[0])
);

// NEW (real)
const linkedMonthly = goal.parentGoalId
  ? monthlyGoals.find(mg => mg.id === goal.parentGoalId)
  : null;
```

---

## Phase 5: Add Friction Logging to Habit Logs

### Problem
No way to record WHY a habit was skipped.

### Solution

**File:** `shared/schema.ts`

Add to habitLogs table:
```ts
skipReason: varchar("skip_reason", { length: 50 }).$type<
  "time" | "energy" | "forgot" | "sick" | "travel" | "other"
>(),
skipNote: text("skip_note"),
```

**File:** Create `client/src/components/HabitSkipDialog.tsx`

When user taps an incomplete habit at end of day, prompt:
```tsx
<Dialog>
  <DialogTitle>What got in the way?</DialogTitle>
  <div className="grid grid-cols-2 gap-2">
    {["No time", "Low energy", "Forgot", "Sick", "Travel", "Other"].map(reason => (
      <button onClick={() => logSkip(reason)}>{reason}</button>
    ))}
  </div>
  <textarea placeholder="Optional note..." />
</Dialog>
```

---

## Phase 6: Add Weekly Review Component

### Problem
No reflection mechanism at end of week.

### Solution

**File:** Create `client/src/components/WeeklyReviewPrompt.tsx`

Show on Sunday evening or Monday morning:
```tsx
export function WeeklyReviewPrompt({ weekData }) {
  return (
    <Dialog>
      <DialogTitle>Week {weekNumber} Review</DialogTitle>

      <div className="space-y-4">
        {/* What went well */}
        <div>
          <h4>What went well this week?</h4>
          <textarea ... />
        </div>

        {/* What got in the way */}
        <div>
          <h4>What got in the way?</h4>
          <p className="text-sm">Top friction reasons: {topSkipReasons}</p>
          <textarea ... />
        </div>

        {/* Adjustments for next week */}
        <div>
          <h4>What will you adjust next week?</h4>
          <textarea ... />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Habits" value={`${habitCompletion}%`} />
          <StatCard label="Tasks Done" value={tasksCompleted} />
          <StatCard label="Goals Progress" value={goalsAdvanced} />
        </div>
      </div>
    </Dialog>
  );
}
```

**Storage:** Add `weeklyReviews` table:
```ts
export const weeklyReviews = pgTable("weekly_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  weekNumber: varchar("week_number", { length: 10 }).notNull(), // "2024-W49"
  wentWell: text("went_well"),
  challenges: text("challenges"),
  adjustments: text("adjustments"),
  rating: integer("rating"), // 1-5
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Phase 7: Two-Day Rule Warning

### Problem
No visual warning for consecutive missed days.

### Solution

**File:** `client/src/pages/WeeklyPlannerPage.tsx`

In the habits section, add a warning badge:
```tsx
{habits.map(habit => {
  const consecutiveMisses = calculateConsecutiveMisses(habit, habitLogs);

  return (
    <div className="relative">
      {/* Existing habit dot */}

      {consecutiveMisses >= 2 && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"
             title={`${consecutiveMisses} days missed - don't break the chain!`}
        />
      )}
    </div>
  );
})}
```

Helper function:
```ts
function calculateConsecutiveMisses(habit: Habit, logs: HabitLog[]): number {
  const today = new Date();
  let misses = 0;

  for (let i = 0; i < 7; i++) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    const log = logs.find(l => l.habitId === habit.id && l.date === date);

    if (!log?.completed) {
      misses++;
    } else {
      break; // Found a completion, stop counting
    }
  }

  return misses;
}
```

---

## Phase 8: Goal Milestones

### Problem
Progress bars are linear with no checkpoints.

### Solution

**File:** `shared/schema.ts`

Add milestones field to goals:
```ts
milestones: jsonb("milestones").$type<Array<{
  percent: number; // 25, 50, 75, 100
  label: string; // "Quarter way", "Halfway", "Almost there", "Done!"
  reached: boolean;
  reachedAt?: string;
}>>().default([]),
```

**File:** `client/src/pages/WeeklyPlannerPage.tsx`

Update goal progress display:
```tsx
{monthlyGoals.map(goal => {
  const progress = (goal.currentValue / goal.targetValue) * 100;
  const milestones = goal.milestones || [
    { percent: 25, label: "25%" },
    { percent: 50, label: "Halfway" },
    { percent: 75, label: "Almost there" },
    { percent: 100, label: "Done!" },
  ];

  return (
    <div className="relative">
      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div style={{ width: `${progress}%` }} className="h-full bg-primary" />
      </div>

      {/* Milestone markers */}
      <div className="relative">
        {milestones.map(m => (
          <div
            key={m.percent}
            className={cn(
              "absolute w-2 h-2 rounded-full -top-1",
              progress >= m.percent ? "bg-green-500" : "bg-muted-foreground/30"
            )}
            style={{ left: `${m.percent}%`, transform: "translateX(-50%)" }}
            title={m.label}
          />
        ))}
      </div>
    </div>
  );
})}
```

---

## Phase 9: Habit Stacking / Cue Association (Future)

### Scope
This is a larger feature that requires UX research. Defer to Phase 2.

**Concept:** Add `cueHabitId` to habits table - "After I complete [cueHabit], I should do [this habit]"

Display as a chain in the UI: "Morning Coffee → Read 10 pages → Journal"

---

## Phase 10: Enhanced Habit Detail in Planner

### Problem
Planner habits section doesn't show which specific habits were done.

### Solution

**File:** `client/src/pages/WeeklyPlannerPage.tsx`

Make habits section expandable:
```tsx
<div className="glass-card p-4 rounded-2xl">
  <div
    className="flex items-center justify-between cursor-pointer"
    onClick={() => setHabitsExpanded(!habitsExpanded)}
  >
    <h3>Habits</h3>
    <ChevronDown className={cn("transition-transform", habitsExpanded && "rotate-180")} />
  </div>

  {/* Compact dots view */}
  <div className="flex items-center gap-2">
    {weekDays.map(day => /* dots */)}
  </div>

  {/* Expanded detail view */}
  {habitsExpanded && (
    <div className="mt-4 space-y-2">
      {habits.map(habit => (
        <div className="flex items-center gap-2">
          <span style={{ color: habit.color }}>{habit.icon}</span>
          <span className="text-sm">{habit.title}</span>
          <div className="ml-auto flex gap-1">
            {weekDays.map(day => {
              const done = habitLogs.some(
                l => l.habitId === habit.id && l.date === day.dateStr && l.completed
              );
              return (
                <div className={cn(
                  "w-4 h-4 rounded",
                  done ? "bg-green-500" : "bg-muted"
                )} />
              );
            })}
          </div>
          <span className="text-xs text-muted-foreground ml-2">
            {habit.streak} day streak
          </span>
        </div>
      ))}
    </div>
  )}
</div>
```

---

## Implementation Order

| Priority | Phase | Impact | Effort |
|----------|-------|--------|--------|
| 1 | Phase 1: Task → Goal Auto-Progress | HIGH | LOW |
| 2 | Phase 4: parentGoalId Hierarchy | HIGH | LOW |
| 3 | Phase 2: Real Streak Display | MEDIUM | LOW |
| 4 | Phase 7: Two-Day Rule Warning | MEDIUM | LOW |
| 5 | Phase 10: Expandable Habit Detail | MEDIUM | MEDIUM |
| 6 | Phase 5: Friction Logging | MEDIUM | MEDIUM |
| 7 | Phase 3: Implementation Intentions | LOW | LOW |
| 8 | Phase 8: Goal Milestones | LOW | MEDIUM |
| 9 | Phase 6: Weekly Review | LOW | HIGH |
| 10 | Phase 9: Habit Stacking | LOW | HIGH |

---

## Files to Modify

| File | Changes |
|------|---------|
| `shared/schema.ts` | Add `parentGoalId`, `implementationIntention`, `milestones` to goals; `skipReason`, `skipNote` to habitLogs; new `weeklyReviews` table |
| `server/routes.ts` | Auto-increment goal on task completion |
| `server/migrate.ts` | Add migration for new columns |
| `client/src/pages/WeeklyPlannerPage.tsx` | Streak display, two-day warning, expandable habits, real goal linking |
| `client/src/components/GoalDialog.tsx` | Implementation intention field, parent goal dropdown |
| `client/src/components/HabitSkipDialog.tsx` | NEW - friction logging UI |
| `client/src/components/WeeklyReviewPrompt.tsx` | NEW - weekly review modal |

---

## Estimated Scope

- **Quick wins (Phases 1, 2, 4, 7):** ~150 lines, immediate impact
- **Medium features (Phases 3, 5, 8, 10):** ~300 lines, polish
- **Large features (Phases 6, 9):** ~500 lines, can defer

**Recommendation:** Start with Phases 1, 4, 2, 7 for maximum behavior science impact with minimum code.
