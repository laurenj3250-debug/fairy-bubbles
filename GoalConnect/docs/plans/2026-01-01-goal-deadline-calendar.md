# Goal Deadline Calendar Widget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a month calendar widget to IcyDash showing yearly and weekly goals with due dates, color-coded by status (on-track/behind/overdue), with click-to-popup goal details.

**Architecture:**
- New `GoalCalendarWidget` component placed in ROW 1 of IcyDash (alongside Weekly Goals)
- Custom calendar grid built with date-fns (already in use), matching app's glass-card aesthetic
- Uses existing Popover component for goal detail popups
- Fetches combined data from yearly_goals and goals tables via new API endpoint

**Tech Stack:** React, date-fns, Radix Popover, TanStack Query, existing enchanted.css styling

---

## Task 1: Create API Endpoint for Goals with Due Dates

**Files:**
- Create: `server/routes/goal-calendar.ts`
- Modify: `server/routes.ts` (add route registration)

**Step 1: Create the goal-calendar route file**

```typescript
// server/routes/goal-calendar.ts
import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { yearlyGoals, goals } from "@shared/schema";
import { eq, and, isNotNull, gte, lte, or } from "drizzle-orm";
import { requireUser } from "../simple-auth";

interface CalendarGoal {
  id: number;
  source: "yearly" | "weekly";
  title: string;
  dueDate: string;
  completed: boolean;
  currentValue: number;
  targetValue: number;
  category: string;
  goalType: string;
}

export function registerGoalCalendarRoutes(app: Express) {
  /**
   * GET /api/goal-calendar
   * Returns all goals with due dates within a date range
   * Query params: startDate, endDate (YYYY-MM-DD format)
   */
  app.get("/api/goal-calendar", async (req: Request, res: Response) => {
    try {
      const user = requireUser(req);
      const db = getDb();

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      // Fetch yearly goals with due dates in range
      const yearlyResults = await db
        .select({
          id: yearlyGoals.id,
          title: yearlyGoals.title,
          dueDate: yearlyGoals.dueDate,
          completed: yearlyGoals.completed,
          currentValue: yearlyGoals.currentValue,
          targetValue: yearlyGoals.targetValue,
          category: yearlyGoals.category,
          goalType: yearlyGoals.goalType,
        })
        .from(yearlyGoals)
        .where(
          and(
            eq(yearlyGoals.userId, user.id),
            isNotNull(yearlyGoals.dueDate),
            gte(yearlyGoals.dueDate, startDate),
            lte(yearlyGoals.dueDate, endDate)
          )
        );

      // Fetch weekly/monthly goals with deadlines in range
      const weeklyResults = await db
        .select({
          id: goals.id,
          title: goals.title,
          dueDate: goals.deadline,
          currentValue: goals.currentValue,
          targetValue: goals.targetValue,
        })
        .from(goals)
        .where(
          and(
            eq(goals.userId, user.id),
            isNotNull(goals.deadline),
            gte(goals.deadline, startDate),
            lte(goals.deadline, endDate)
          )
        );

      // Transform and combine results
      const calendarGoals: CalendarGoal[] = [
        ...yearlyResults.map((g) => ({
          id: g.id,
          source: "yearly" as const,
          title: g.title,
          dueDate: g.dueDate!,
          completed: g.completed,
          currentValue: g.currentValue,
          targetValue: g.targetValue,
          category: g.category,
          goalType: g.goalType,
        })),
        ...weeklyResults.map((g) => ({
          id: g.id,
          source: "weekly" as const,
          title: g.title,
          dueDate: g.dueDate!,
          completed: g.currentValue >= g.targetValue,
          currentValue: g.currentValue,
          targetValue: g.targetValue,
          category: "weekly",
          goalType: "count",
        })),
      ];

      res.json({ goals: calendarGoals });
    } catch (error) {
      console.error("[goal-calendar] Error:", error);
      res.status(500).json({ error: "Failed to fetch calendar goals" });
    }
  });
}
```

**Step 2: Register the route in server/routes.ts**

Find the route registrations section and add:

```typescript
import { registerGoalCalendarRoutes } from "./routes/goal-calendar";

// In the registerRoutes function, add:
registerGoalCalendarRoutes(app);
```

**Step 3: Test the endpoint**

```bash
curl "http://localhost:5001/api/goal-calendar?startDate=2026-01-01&endDate=2026-12-31" -H "Cookie: <session>"
```

Expected: JSON with `goals` array containing yearly and weekly goals with due dates.

**Step 4: Commit**

```bash
git add server/routes/goal-calendar.ts server/routes.ts
git commit -m "feat: add /api/goal-calendar endpoint for goals with due dates"
```

---

## Task 2: Create useGoalCalendar Hook

**Files:**
- Create: `client/src/hooks/useGoalCalendar.ts`

**Step 1: Create the hook**

```typescript
// client/src/hooks/useGoalCalendar.ts
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, format, parseISO, isBefore, differenceInDays } from "date-fns";

export interface CalendarGoal {
  id: number;
  source: "yearly" | "weekly";
  title: string;
  dueDate: string;
  completed: boolean;
  currentValue: number;
  targetValue: number;
  category: string;
  goalType: string;
}

export type GoalStatus = "completed" | "on-track" | "due-soon" | "overdue" | "behind";

export interface CalendarGoalWithStatus extends CalendarGoal {
  status: GoalStatus;
  progressPercent: number;
}

function calculateGoalStatus(goal: CalendarGoal): GoalStatus {
  if (goal.completed) return "completed";

  const now = new Date();
  const dueDate = parseISO(goal.dueDate);
  const daysUntilDue = differenceInDays(dueDate, now);

  // Overdue check
  if (isBefore(dueDate, now)) return "overdue";

  // Due soon (within 14 days)
  if (daysUntilDue <= 14) return "due-soon";

  // Progress check for count goals
  if (goal.targetValue > 1) {
    const progressPercent = (goal.currentValue / goal.targetValue) * 100;

    // Calculate expected progress based on time
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const totalDays = differenceInDays(dueDate, yearStart);
    const daysPassed = differenceInDays(now, yearStart);
    const expectedPercent = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

    // Behind if more than 15% under expected
    if (progressPercent < expectedPercent * 0.85) return "behind";
  }

  return "on-track";
}

export function useGoalCalendar(month: Date) {
  const startDate = format(startOfMonth(month), "yyyy-MM-dd");
  const endDate = format(endOfMonth(month), "yyyy-MM-dd");

  const { data, isLoading, error, refetch } = useQuery<{ goals: CalendarGoal[] }>({
    queryKey: [`/api/goal-calendar?startDate=${startDate}&endDate=${endDate}`],
    staleTime: 30 * 1000, // 30 seconds
  });

  // Process goals with status
  const goalsWithStatus = useMemo((): CalendarGoalWithStatus[] => {
    if (!data?.goals) return [];

    return data.goals.map((goal) => ({
      ...goal,
      status: calculateGoalStatus(goal),
      progressPercent: goal.targetValue > 0
        ? Math.round((goal.currentValue / goal.targetValue) * 100)
        : goal.completed ? 100 : 0,
    }));
  }, [data]);

  // Group goals by date for calendar rendering
  const goalsByDate = useMemo(() => {
    const map = new Map<string, CalendarGoalWithStatus[]>();

    goalsWithStatus.forEach((goal) => {
      const existing = map.get(goal.dueDate) || [];
      existing.push(goal);
      map.set(goal.dueDate, existing);
    });

    return map;
  }, [goalsWithStatus]);

  return {
    goals: goalsWithStatus,
    goalsByDate,
    isLoading,
    error,
    refetch,
    startDate,
    endDate,
  };
}
```

**Step 2: Commit**

```bash
git add client/src/hooks/useGoalCalendar.ts
git commit -m "feat: add useGoalCalendar hook with status calculation"
```

---

## Task 3: Create GoalCalendarWidget Component

**Files:**
- Create: `client/src/components/GoalCalendarWidget.tsx`

**Step 1: Create the calendar widget**

```typescript
// client/src/components/GoalCalendarWidget.tsx
import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Target, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoalCalendar, type CalendarGoalWithStatus, type GoalStatus } from "@/hooks/useGoalCalendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const STATUS_COLORS: Record<GoalStatus, string> = {
  completed: "bg-emerald-500",
  "on-track": "bg-sky-500",
  "due-soon": "bg-yellow-500",
  overdue: "bg-red-500",
  behind: "bg-orange-500",
};

const STATUS_LABELS: Record<GoalStatus, string> = {
  completed: "Completed",
  "on-track": "On Track",
  "due-soon": "Due Soon",
  overdue: "Overdue",
  behind: "Behind Pace",
};

interface GoalPopoverProps {
  goal: CalendarGoalWithStatus;
}

function GoalPopover({ goal }: GoalPopoverProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", STATUS_COLORS[goal.status])} />
        <div>
          <h4 className="font-medium text-sm text-[var(--text-primary)]">{goal.title}</h4>
          <p className="text-xs text-[var(--text-muted)]">
            Due: {format(new Date(goal.dueDate), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {goal.targetValue > 1 && (
        <div className="space-y-1">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", STATUS_COLORS[goal.status])}
              style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>{goal.currentValue} / {goal.targetValue}</span>
            <span>{goal.progressPercent}%</span>
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          goal.status === "completed" && "bg-emerald-500/20 text-emerald-400",
          goal.status === "on-track" && "bg-sky-500/20 text-sky-400",
          goal.status === "due-soon" && "bg-yellow-500/20 text-yellow-400",
          goal.status === "overdue" && "bg-red-500/20 text-red-400",
          goal.status === "behind" && "bg-orange-500/20 text-orange-400",
        )}>
          {STATUS_LABELS[goal.status]}
        </span>
        <span className="text-xs text-[var(--text-muted)] capitalize">
          {goal.source} goal
        </span>
      </div>
    </div>
  );
}

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  goals: CalendarGoalWithStatus[];
}

function DayCell({ date, isCurrentMonth, goals }: DayCellProps) {
  const dayNumber = format(date, "d");
  const hasGoals = goals.length > 0;
  const today = isToday(date);

  // Get most urgent status for the day
  const urgentStatus = useMemo(() => {
    if (goals.length === 0) return null;
    const priorities: GoalStatus[] = ["overdue", "due-soon", "behind", "on-track", "completed"];
    for (const status of priorities) {
      if (goals.some(g => g.status === status)) return status;
    }
    return "on-track";
  }, [goals]);

  const cellContent = (
    <div
      className={cn(
        "h-9 w-9 flex flex-col items-center justify-center rounded-lg text-sm relative",
        !isCurrentMonth && "text-[var(--text-muted)]/40",
        isCurrentMonth && "text-[var(--text-primary)]",
        today && "ring-1 ring-peach-400 bg-peach-400/10",
        hasGoals && isCurrentMonth && "cursor-pointer hover:bg-white/5",
      )}
    >
      <span className={cn(today && "font-semibold text-peach-400")}>{dayNumber}</span>
      {hasGoals && isCurrentMonth && (
        <div className="flex gap-0.5 absolute -bottom-0.5">
          {goals.slice(0, 3).map((goal, i) => (
            <div
              key={goal.id}
              className={cn("w-1.5 h-1.5 rounded-full", STATUS_COLORS[goal.status])}
            />
          ))}
          {goals.length > 3 && (
            <span className="text-[8px] text-[var(--text-muted)]">+{goals.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );

  if (!hasGoals || !isCurrentMonth) {
    return cellContent;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {cellContent}
      </PopoverTrigger>
      <PopoverContent
        className="w-72 bg-[var(--bg-card)] border-white/10 p-4"
        align="center"
      >
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {format(date, "MMMM d")} - {goals.length} goal{goals.length > 1 ? "s" : ""}
          </h3>
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalPopover key={`${goal.source}-${goal.id}`} goal={goal} />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function GoalCalendarWidget() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { goalsByDate, isLoading, goals } = useGoalCalendar(currentMonth);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Get calendar grid (including days from prev/next months to fill weeks)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Stats for header
  const stats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter(g => g.status === "completed").length;
    const urgent = goals.filter(g => g.status === "overdue" || g.status === "due-soon").length;
    return { total, completed, urgent };
  }, [goals]);

  return (
    <div className="glass-card frost-accent min-h-[220px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="card-title">Deadlines</span>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            className="p-1 text-[var(--text-muted)] hover:text-peach-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className="text-xs text-[var(--text-muted)] hover:text-peach-400 transition-colors px-2"
          >
            {format(currentMonth, "MMM yyyy")}
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1 text-[var(--text-muted)] hover:text-peach-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mini stats */}
      {stats.total > 0 && (
        <div className="flex items-center gap-3 mb-2 text-xs">
          <span className="text-[var(--text-muted)]">
            <span className="text-emerald-400 font-medium">{stats.completed}</span>/{stats.total} done
          </span>
          {stats.urgent > 0 && (
            <span className="text-yellow-400">
              {stats.urgent} urgent
            </span>
          )}
        </div>
      )}

      {/* Calendar grid */}
      <div className="flex-1">
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div key={i} className="h-6 flex items-center justify-center text-[10px] text-[var(--text-muted)] uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-9 w-9 bg-white/5 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const dayGoals = goalsByDate.get(dateStr) || [];
              return (
                <DayCell
                  key={dateStr}
                  date={date}
                  isCurrentMonth={isSameMonth(date, currentMonth)}
                  goals={dayGoals}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && goals.length === 0 && (
        <div className="text-center py-4 text-xs text-[var(--text-muted)]">
          No goals with due dates this month
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/GoalCalendarWidget.tsx
git commit -m "feat: create GoalCalendarWidget with popover details"
```

---

## Task 4: Integrate Widget into IcyDash

**Files:**
- Modify: `client/src/pages/IcyDash.tsx`

**Step 1: Import the component**

At the top of IcyDash.tsx, add:

```typescript
import { GoalCalendarWidget } from '@/components/GoalCalendarWidget';
```

**Step 2: Add to ROW 1 layout**

Find ROW 1 (around line 838-871) which currently has:
```tsx
{/* ROW 1: Weekly Goals + Study Tracker (2 columns) */}
<div className="card-grid grid grid-cols-2 gap-5">
  {/* Weekly Goals */}
  <div className="glass-card frost-accent min-h-[220px] flex flex-col">
    ...
  </div>
</div>
```

Replace with:
```tsx
{/* ROW 1: Weekly Goals + Goal Calendar (2 columns) */}
<div className="card-grid grid grid-cols-2 gap-5">
  {/* Weekly Goals */}
  <div className="glass-card frost-accent min-h-[220px] flex flex-col">
    <span className="card-title">Weekly Goals</span>
    <div className="flex-1 flex flex-col justify-center">
      {goalsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}
        </div>
      ) : weeklyGoals.length === 0 ? (
        <Link href="/goals">
          <div className="font-body text-sm text-[var(--text-muted)] hover:text-peach-400 py-8 text-center cursor-pointer transition-colors">
            + Add weekly goals
          </div>
        </Link>
      ) : (
        <div className="space-y-2">
          {weeklyGoals.map(goal => (
            <LuxuryGoalItem
              key={goal.id}
              title={goal.title}
              current={goal.currentValue}
              target={goal.targetValue}
              onIncrement={() => incrementGoalMutation.mutate(goal.id)}
              isPending={incrementGoalMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  </div>

  {/* Goal Deadline Calendar */}
  <GoalCalendarWidget />
</div>
```

**Step 3: Test the integration**

```bash
npm run dev
```

Navigate to dashboard and verify:
- Calendar shows in ROW 1 next to Weekly Goals
- Month navigation works
- Goals appear as colored dots on their due dates
- Clicking a day with goals shows popover with details

**Step 4: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "feat: integrate GoalCalendarWidget into IcyDash ROW 1"
```

---

## Task 5: Add TypeScript Types to Shared Schema

**Files:**
- Modify: `shared/schema.ts` (if needed for type exports)

**Step 1: Verify types are accessible**

The CalendarGoal types are defined in the hook file. If needed for API contracts, add to shared/schema.ts:

```typescript
// Goal Calendar Types
export interface CalendarGoal {
  id: number;
  source: "yearly" | "weekly";
  title: string;
  dueDate: string;
  completed: boolean;
  currentValue: number;
  targetValue: number;
  category: string;
  goalType: string;
}
```

**Step 2: Commit (if changes made)**

```bash
git add shared/schema.ts
git commit -m "feat: add CalendarGoal type to shared schema"
```

---

## Task 6: Final Testing & Polish

**Step 1: Test all interactions**

1. Navigate months with arrows
2. Click on days with goals - verify popover appears
3. Check status colors match goal state:
   - ✅ Completed = green
   - 🔵 On track = blue
   - 🟡 Due soon (≤14 days) = yellow
   - 🔴 Overdue = red
   - 🟠 Behind pace = orange
4. Verify today is highlighted with peach ring
5. Test with different months (Feb for Pimsleur, July for residency)

**Step 2: Verify responsive behavior**

Calendar should maintain grid layout and be readable at widget size.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete GoalCalendarWidget with full functionality

- API endpoint for fetching goals with due dates
- Custom hook with status calculation
- Calendar widget with glass-card styling
- Popover showing goal details and progress
- Status colors for completed/on-track/due-soon/overdue/behind
- Month navigation and today highlighting"
```

---

## Summary

| File | Action | Description |
|------|--------|-------------|
| `server/routes/goal-calendar.ts` | Create | API endpoint for goals with due dates |
| `server/routes.ts` | Modify | Register new route |
| `client/src/hooks/useGoalCalendar.ts` | Create | Data fetching and status calculation |
| `client/src/components/GoalCalendarWidget.tsx` | Create | Calendar UI with popovers |
| `client/src/pages/IcyDash.tsx` | Modify | Integrate widget into ROW 1 |

**Total new code:** ~350 lines
**Reused patterns:** glass-card styling, Popover component, date-fns utilities, TanStack Query
