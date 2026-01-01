# Consolidate Milestones Widget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show each goal once with "X due this month" instead of listing every milestone separately, with ability to increment.

**Architecture:** Group milestones by parent goalId in the frontend hook, calculate how many are due and how many are met, display consolidated view with progress and increment button.

**Tech Stack:** React, TanStack Query, date-fns, existing useGoalCalendar hook

---

## Current State

**Problem:** API returns 13 items for January 2026:
- "52 outdoor days" appears 5 times (weekly checkpoints 1-5)
- "Complete de Lahunta" appears 5 times (weekly checkpoints 1-5)
- "12 outdoor climbing" appears once (monthly checkpoint)
- etc.

**User sees:** 13 separate rows, hard to track what matters

**User wants:** ~5 rows showing unique goals with milestone counts

---

## Task 1: Add Consolidated Goal Types to Hook

**Files:**
- Modify: `client/src/hooks/useGoalCalendar.ts:115-163`

**Step 1: Add new type for consolidated goals**

Add after line 40 (after CalendarGoalWithStatus interface):

```typescript
export interface ConsolidatedGoal {
  goalId: number;
  title: string;
  source: "yearly" | "weekly" | "milestone";
  category: string;
  currentValue: number;
  targetValue: number;
  milestonesThisMonth: number;
  milestonesMet: number;
  nextDueDate: string | null;
  isCompleted: boolean;
  progressPercent: number;
}
```

**Step 2: Add consolidation logic**

Add new useMemo after `goalsThisMonth` (around line 149):

```typescript
// Consolidate goals - group milestones by parent goal
const consolidatedGoals = useMemo((): ConsolidatedGoal[] => {
  const goalMap = new Map<number, ConsolidatedGoal>();

  goalsWithStatus.forEach((goal) => {
    // For milestones, use goalId; for regular goals, use id
    const parentId = goal.goalId || goal.id;

    const existing = goalMap.get(parentId);

    if (existing) {
      // Add to existing consolidated goal
      existing.milestonesThisMonth += 1;
      if (goal.status === "milestone-met" || goal.status === "completed") {
        existing.milestonesMet += 1;
      }
      // Track earliest unmet due date
      if (!existing.nextDueDate ||
          (goal.status !== "milestone-met" && goal.status !== "completed" &&
           goal.dueDate < existing.nextDueDate)) {
        existing.nextDueDate = goal.dueDate;
      }
    } else {
      // Create new consolidated goal entry
      const isMet = goal.status === "milestone-met" || goal.status === "completed";
      goalMap.set(parentId, {
        goalId: parentId,
        title: goal.title,
        source: goal.source,
        category: goal.category,
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
        milestonesThisMonth: 1,
        milestonesMet: isMet ? 1 : 0,
        nextDueDate: isMet ? null : goal.dueDate,
        isCompleted: goal.currentValue >= goal.targetValue,
        progressPercent: goal.targetValue > 0
          ? Math.round((goal.currentValue / goal.targetValue) * 100)
          : 0,
      });
    }
  });

  // Sort by next due date (nulls last = completed goals at end)
  return Array.from(goalMap.values()).sort((a, b) => {
    if (!a.nextDueDate && !b.nextDueDate) return 0;
    if (!a.nextDueDate) return 1;
    if (!b.nextDueDate) return -1;
    return a.nextDueDate.localeCompare(b.nextDueDate);
  });
}, [goalsWithStatus]);
```

**Step 3: Export consolidatedGoals**

Update return statement (around line 151):

```typescript
return {
  goals: goalsWithStatus,
  consolidatedGoals,
  regularGoals,
  milestones,
  goalsByDate,
  goalsThisMonth,
  isLoading,
  error,
  refetch,
  startDate,
  endDate,
};
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add client/src/hooks/useGoalCalendar.ts
git commit -m "feat: add consolidatedGoals to useGoalCalendar hook"
```

---

## Task 2: Update GoalsDeadlinesWidget to Use Consolidated Data

**Files:**
- Modify: `client/src/components/GoalsDeadlinesWidget.tsx`

**Step 1: Update imports and hook usage**

Replace lines 10-27 with:

```typescript
import { useGoalCalendar, type ConsolidatedGoal } from "@/hooks/useGoalCalendar";

interface GoalsDeadlinesWidgetProps {
  onIncrement: (goalId: number) => void;
  isIncrementing: boolean;
}

export function GoalsDeadlinesWidget({
  onIncrement,
  isIncrementing,
}: GoalsDeadlinesWidgetProps) {
  const currentMonth = new Date();
  const { consolidatedGoals, isLoading } = useGoalCalendar(currentMonth);
```

**Step 2: Update status helpers**

Replace getStatusIcon and getStatusColor functions (lines 29-54) with:

```typescript
const getStatusInfo = (goal: ConsolidatedGoal) => {
  const allMet = goal.milestonesMet >= goal.milestonesThisMonth;
  const someMet = goal.milestonesMet > 0;
  const isOverdue = goal.nextDueDate && isBefore(parseISO(goal.nextDueDate), new Date());

  if (goal.isCompleted || allMet) {
    return {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
      color: "text-emerald-400"
    };
  }
  if (isOverdue) {
    return {
      icon: <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />,
      color: "text-rose-400"
    };
  }
  if (someMet) {
    return {
      icon: <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />,
      color: "text-sky-400"
    };
  }
  return {
    icon: <Calendar className="w-4 h-4 text-sky-400 flex-shrink-0" />,
    color: "text-[var(--text-primary)]"
  };
};
```

**Step 3: Update render with consolidated view**

Replace the goals list render (lines 83-158) with:

```typescript
{/* Consolidated goals list */}
{!isLoading && consolidatedGoals.length > 0 && (
  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
    {consolidatedGoals.map((goal) => {
      const { icon, color } = getStatusInfo(goal);
      const allMet = goal.milestonesMet >= goal.milestonesThisMonth;
      const canIncrement = !goal.isCompleted && goal.targetValue > 1;

      return (
        <div
          key={goal.goalId}
          className={cn(
            "flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors",
            allMet && "opacity-60"
          )}
        >
          {/* Increment button or status icon */}
          {canIncrement ? (
            <button
              onClick={() => onIncrement(goal.goalId)}
              disabled={isIncrementing}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-white/10 text-[var(--text-primary)] hover:bg-peach-400/20 hover:text-peach-400 transition-all flex-shrink-0"
            >
              +1
            </button>
          ) : (
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
          )}

          {/* Goal info */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm truncate",
              allMet ? "line-through text-emerald-400" : color
            )}>
              {goal.title}
            </p>

            {/* Milestone count badge */}
            {goal.milestonesThisMonth > 1 && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-[var(--text-muted)]">
                  <span className={goal.milestonesMet > 0 ? "text-emerald-400" : ""}>
                    {goal.milestonesMet}
                  </span>
                  /{goal.milestonesThisMonth} due this month
                </span>
              </div>
            )}

            {/* Progress bar for count goals */}
            {goal.targetValue > 1 && !allMet && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full",
                      goal.nextDueDate && isBefore(parseISO(goal.nextDueDate), new Date())
                        ? "bg-rose-400"
                        : "bg-peach-400"
                    )}
                    style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                  {goal.currentValue}/{goal.targetValue}
                </span>
              </div>
            )}
          </div>

          {/* Next due date */}
          {goal.nextDueDate && (
            <span className={cn(
              "text-xs whitespace-nowrap",
              isBefore(parseISO(goal.nextDueDate), new Date())
                ? "text-rose-400 font-medium"
                : "text-[var(--text-muted)]"
            )}>
              {format(parseISO(goal.nextDueDate), "MMM d")}
            </span>
          )}
        </div>
      );
    })}
  </div>
)}
```

**Step 4: Update empty state check**

Change line 76 from `allGoals.length === 0` to:

```typescript
{!isLoading && consolidatedGoals.length === 0 && (
```

**Step 5: Remove unused useMemo**

Delete the `allGoals` useMemo (lines 24-27 after changes) - no longer needed.

**Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add client/src/components/GoalsDeadlinesWidget.tsx
git commit -m "feat: show consolidated goals with milestone counts"
```

---

## Task 3: Update IcyDash to Use Correct Goal ID for Increment

**Files:**
- Modify: `client/src/pages/IcyDash.tsx:403-419`

**Step 1: Update incrementGoalMutation to handle yearly goals**

The current mutation uses the regular `goals` query which doesn't include yearly goals. Need to use the yearly goals API.

Replace `incrementGoalMutation` (around line 403):

```typescript
const incrementGoalMutation = useMutation({
  mutationFn: async (goalId: number) => {
    // Try yearly goals first, then regular goals
    return await apiRequest(`/api/yearly-goals/${goalId}/increment`, 'POST');
  },
  onSuccess: () => {
    triggerConfetti();
    queryClient.invalidateQueries({ queryKey: ['/api/yearly-goals'] });
    queryClient.invalidateQueries({ queryKey: ['/api/goal-calendar'] });
    queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    queryClient.invalidateQueries({ queryKey: ['/api/points'] });
  },
  onError: (error: Error) => {
    toast({ title: "Failed to update goal", description: error.message, variant: "destructive" });
  },
});
```

**Step 2: Check if yearly goals increment endpoint exists**

Run: `grep -r "increment" server/routes/ --include="*.ts" | head -10`

If endpoint doesn't exist, we need to create it in Task 4.

**Step 3: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "feat: update goal increment to use yearly goals API"
```

---

## Task 4: Create Yearly Goal Increment Endpoint (if needed)

**Files:**
- Modify: `server/routes/yearly-goals.ts`

**Step 1: Check if endpoint exists**

Look for existing increment route. If not found, add:

```typescript
// POST /api/yearly-goals/:id/increment
app.post("/api/yearly-goals/:id/increment", async (req: Request, res: Response) => {
  try {
    const user = requireUser(req);
    const goalId = parseInt(req.params.id, 10);
    const db = getDb();

    // Get current goal
    const [goal] = await db
      .select()
      .from(yearlyGoals)
      .where(and(eq(yearlyGoals.id, goalId), eq(yearlyGoals.userId, user.id)));

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    // Increment (don't exceed target)
    const newValue = Math.min(goal.currentValue + 1, goal.targetValue);
    const isCompleted = newValue >= goal.targetValue;

    await db
      .update(yearlyGoals)
      .set({
        currentValue: newValue,
        completed: isCompleted
      })
      .where(eq(yearlyGoals.id, goalId));

    res.json({
      id: goalId,
      currentValue: newValue,
      completed: isCompleted
    });
  } catch (error) {
    console.error("[yearly-goals] Increment error:", error);
    res.status(500).json({ error: "Failed to increment goal" });
  }
});
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add server/routes/yearly-goals.ts
git commit -m "feat: add yearly goal increment endpoint"
```

---

## Task 5: Visual Verification

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Open app and navigate to dashboard**

Check the "Due This Month" widget displays:
- Each goal appears ONCE
- Shows "X/Y due this month" badge for multi-milestone goals
- Progress bar shows overall goal progress
- +1 button increments the goal
- Green checkmark when all milestones met

**Step 3: Test increment**

Click +1 on a goal like "52 outdoor days"
Expected: currentValue increases by 1, progress bar updates

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: consolidated milestones widget complete"
git push
```

---

## Summary

| Before | After |
|--------|-------|
| 13 rows (5x outdoor, 5x de Lahunta, etc.) | ~5 rows (one per unique goal) |
| Each milestone listed separately | "52 outdoor days" with "3/5 due this month" |
| Confusing to track | Clear progress per goal |

**Expected final result:**
- "52 outdoor days" - 3/5 due this month [+1] - 4/52 progress
- "Complete de Lahunta" - 5/5 due this month [+1] - 2/22 progress
- "12 outdoor climbing" - 1/1 due this month [+1] - 0/12 progress
- etc.
