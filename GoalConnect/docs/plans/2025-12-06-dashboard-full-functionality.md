# Dashboard V5 Full Functionality Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full CRUD functionality to dashboard - navigation links, habit/goal/task marking, and quick creation.

**Architecture:** Enhance existing dashboard components with click handlers and mutations. Add study link to nav. Use existing API endpoints - no backend changes needed.

**Tech Stack:** React, TanStack Query mutations, wouter Link, Tailwind CSS

---

## Current Status (Already Working)

- ✅ Navigation rail (MainLayout) - Home, Habits, Goals, Tasks, Journey, Settings
- ✅ Habit orbs (GlowingOrbHabits) - clickable to toggle today's habits
- ✅ Schedule section - clickable todos to mark complete (API fixed)
- ✅ Links to /goals for adding weekly/monthly goals

## Missing Features (To Implement)

1. Study page link in navigation
2. Goal increment from dashboard (click to +1)
3. Habit grid clickable (This Week card)
4. Quick task creation on Schedule
5. Link to create new habits

---

## Task 1: Add Study Link to Navigation

**Files:**
- Modify: `client/src/components/MainLayout.tsx:7-15`

**Step 1: Add BookMarked icon import and study nav item**

Change line 1 and add to navItems array:

```typescript
import { Home, Target, ListTodo, Settings, Mountain, BookOpen, TrendingUp, GraduationCap } from "lucide-react";
```

Add after line 13 (before settings):

```typescript
  { path: "/study", icon: GraduationCap, label: "Study" },
```

**Step 2: Verify navigation works**

Navigate to dashboard, check nav rail shows Study icon. Click it - should go to /study page.

**Step 3: Commit**

```bash
git add client/src/components/MainLayout.tsx
git commit -m "feat: add Study link to navigation rail"
```

---

## Task 2: Make Goal Items Clickable to Increment Progress

**Files:**
- Modify: `client/src/components/LuxuryGoalItem.tsx`
- Modify: `client/src/pages/DashboardV4.tsx` (pass onIncrement prop)

**Step 1: Add onClick prop to LuxuryGoalItem**

Update the component to accept an onIncrement callback:

```typescript
import { cn } from '@/lib/utils';

interface LuxuryGoalItemProps {
  title: string;
  current: number;
  target: number;
  isComplete?: boolean;
  className?: string;
  onIncrement?: () => void;
}

export function LuxuryGoalItem({
  title,
  current,
  target,
  isComplete,
  className,
  onIncrement,
}: LuxuryGoalItemProps) {
  const progress = Math.min((current / target) * 100, 100);
  const complete = isComplete ?? current >= target;

  return (
    <button
      type="button"
      onClick={onIncrement}
      disabled={complete || !onIncrement}
      role="listitem"
      aria-label={`${title}: ${current} of ${target}${complete ? ', completed' : ''}. ${!complete && onIncrement ? 'Click to increment.' : ''}`}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all goal-item text-left",
        complete ? "bg-peach-400/10" : "bg-white/5 hover:bg-white/10",
        !complete && onIncrement && "cursor-pointer",
        className
      )}
    >
      {/* Checkmark circle */}
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all",
          complete
            ? "bg-peach-400 text-ice-deep shadow-[0_0_10px_rgba(228,168,128,0.4)] goal-complete-check"
            : "border-2 border-white/20"
        )}
      >
        {complete && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Title */}
      <span
        className={cn(
          "flex-1 font-heading text-sm",
          complete ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
        )}
      >
        {title}
      </span>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden"
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: complete ? 'var(--peach-400)' : 'var(--peach-300)',
            }}
          />
        </div>
        <span
          className={cn(
            "font-heading text-xs font-medium min-w-[32px] text-right",
            complete ? "text-peach-400" : "text-[var(--text-muted)]"
          )}
        >
          {current}/{target}
        </span>
      </div>
    </button>
  );
}
```

**Step 2: Add goal increment mutation to DashboardV4**

Add after toggleTodoMutation (around line 255):

```typescript
  const incrementGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');
      return await apiRequest(`/api/goals/${goalId}`, 'PATCH', {
        currentValue: Math.min(goal.currentValue + 1, goal.targetValue),
      });
    },
    onSuccess: () => {
      triggerConfetti();
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
    },
  });
```

**Step 3: Pass onIncrement to LuxuryGoalItem**

Update the Weekly Goals rendering (around line 407):

```typescript
{weeklyGoals.map(goal => (
  <LuxuryGoalItem
    key={goal.id}
    title={goal.title}
    current={goal.currentValue}
    target={goal.targetValue}
    onIncrement={() => incrementGoalMutation.mutate(goal.id)}
  />
))}
```

**Step 4: Verify goal increment works**

Click a weekly goal item - should increment the count by 1 and show confetti.

**Step 5: Commit**

```bash
git add client/src/components/LuxuryGoalItem.tsx client/src/pages/DashboardV4.tsx
git commit -m "feat: make goal items clickable to increment progress"
```

---

## Task 3: Make Habit Grid Clickable

**Files:**
- Modify: `client/src/components/LuxuryHabitGrid.tsx`
- Modify: `client/src/pages/DashboardV4.tsx`

**Step 1: Add onToggle prop to LuxuryHabitGrid**

Update the component interface and circles:

```typescript
import { cn } from '@/lib/utils';

interface HabitRow {
  id: number;
  name: string;
  days: { date: string; completed: boolean }[];
  completed: number;
  total: number;
}

interface LuxuryHabitGridProps {
  habits: HabitRow[];
  dayLabels?: string[];
  todayIndex?: number;
  onToggle?: (habitId: number, date: string) => void;
  className?: string;
}

export function LuxuryHabitGrid({
  habits,
  dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  todayIndex = 0,
  onToggle,
  className,
}: LuxuryHabitGridProps) {
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (habits.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-6", className)}>
        <span className="font-heading italic text-sm text-[var(--text-muted)]">
          No habits yet
        </span>
        <span className="font-body text-xs text-[var(--text-muted)] mt-1 opacity-60">
          Add habits to track your week
        </span>
      </div>
    );
  }

  return (
    <div role="grid" aria-label="Weekly habit tracker" className={cn("space-y-3", className)}>
      {/* Day headers */}
      <div className="flex items-center gap-2" role="row">
        <div className="w-20" />
        <div className="flex-1 grid grid-cols-7 gap-1">
          {dayLabels.map((day, i) => (
            <span
              key={i}
              className={cn(
                "font-heading-sc text-[10px] text-center",
                i === todayIndex ? "text-peach-400" : "text-[var(--text-muted)]"
              )}
            >
              {day}
            </span>
          ))}
        </div>
        <div className="w-10" />
      </div>

      {/* Habit rows */}
      {habits.map((habit) => (
        <div key={habit.id} role="row" className="flex items-center gap-2">
          <span
            role="rowheader"
            className="w-20 font-body text-xs text-[var(--text-secondary)] truncate"
            title={habit.name}
          >
            {habit.name}
          </span>

          <div className="flex-1 grid grid-cols-7 gap-1">
            {habit.days.map((day, j) => (
              <button
                key={j}
                type="button"
                onClick={() => onToggle?.(habit.id, day.date)}
                disabled={!onToggle}
                role="gridcell"
                aria-label={`${habit.name} on ${fullDayNames[j]}: ${day.completed ? 'completed' : 'not completed'}`}
                className={cn(
                  "w-3.5 h-3.5 rounded-full mx-auto transition-all habit-circle",
                  day.completed
                    ? "bg-peach-400 shadow-[0_0_6px_rgba(228,168,128,0.4)]"
                    : "bg-white/10 border border-white/5",
                  onToggle && "cursor-pointer hover:scale-125"
                )}
              />
            ))}
          </div>

          <span className="w-8 font-heading text-xs text-right text-[var(--text-muted)]">
            {habit.completed}/{habit.total}
          </span>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Update DashboardV4 to pass habit data with dates**

Update the LuxuryHabitGrid usage (around line 490):

```typescript
<LuxuryHabitGrid
  habits={todayHabits.slice(0, 4).map(habit => ({
    id: habit.id,
    name: habit.title,
    days: week.dates.map(date => ({
      date,
      completed: completionMap[habit.id]?.[date] ?? false,
    })),
    completed: week.dates.filter(date => completionMap[habit.id]?.[date]).length,
    total: 7,
  }))}
  todayIndex={week.todayIndex}
  onToggle={(habitId, date) => toggleHabitMutation.mutate({ habitId, date })}
  className="w-full"
/>
```

**Step 3: Verify habit grid clicking works**

Click any habit circle in the This Week grid - should toggle that day's completion.

**Step 4: Commit**

```bash
git add client/src/components/LuxuryHabitGrid.tsx client/src/pages/DashboardV4.tsx
git commit -m "feat: make habit grid circles clickable to toggle completions"
```

---

## Task 4: Add Quick Task Creation to Schedule

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx`

**Step 1: Add create todo mutation**

Add after incrementGoalMutation:

```typescript
  const createTodoMutation = useMutation({
    mutationFn: async ({ title, dueDate }: { title: string; dueDate: string }) => {
      return await apiRequest('/api/todos', 'POST', {
        title,
        dueDate,
        priority: 4,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/todos-with-metadata'] });
    },
  });
```

**Step 2: Add quick-add input to each day**

Update the Schedule day cells to include a quick-add button. Replace the inner content of the day column (around line 530):

```typescript
<div className="space-y-1">
  {dayTodos.slice(0, 2).map(todo => (
    <button
      type="button"
      key={todo.id}
      onClick={() => handleToggleTodo(todo.id)}
      className={cn(
        "w-full text-left font-body text-[0.65rem] p-1 rounded bg-ice-card/50 cursor-pointer truncate hover:bg-peach-400/10 transition-colors",
        todo.completed && "opacity-50 line-through"
      )}
    >
      {todo.title}
    </button>
  ))}
  {dayTodos.length < 2 && (
    <button
      type="button"
      onClick={() => {
        const title = prompt('Quick add task:');
        if (title?.trim()) {
          createTodoMutation.mutate({ title: title.trim(), dueDate: week.dates[i] });
        }
      }}
      className="w-full text-center font-body text-[0.55rem] p-1 rounded text-[var(--text-muted)] hover:bg-white/5 transition-colors opacity-50 hover:opacity-100"
    >
      + add
    </button>
  )}
</div>
```

**Step 3: Verify quick add works**

Click "+ add" on any day, enter a task name, it should appear in that day's slot.

**Step 4: Commit**

```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "feat: add quick task creation to schedule days"
```

---

## Task 5: Add Link to Create New Habits

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx`

**Step 1: Add "Add Habit" link to header**

Update the header section (around line 376) to include a quick link:

```typescript
<header className="flex justify-center items-center mb-8">
  <div className="flex items-center gap-8">
    <h1 className="logo-text">
      GOAL CONNECT
    </h1>
    <div className="flex-shrink-0">
      <GlowingOrbHabits />
    </div>
    <Link href="/habits">
      <button className="text-[var(--text-muted)] hover:text-peach-400 transition-colors text-xs font-heading">
        + habit
      </button>
    </Link>
  </div>
  <div className="flex gap-6 text-xs ml-8">
    {/* ... existing points and streak ... */}
  </div>
</header>
```

**Step 2: Verify link works**

Click "+ habit" next to the orbs - should navigate to /habits page.

**Step 3: Commit**

```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "feat: add quick link to create new habits"
```

---

## Task 6: Final Integration Testing

**Step 1: Test all interactive features**

1. **Navigation:** Click Study in nav rail → goes to /study
2. **Habit Orbs:** Click orb → toggles habit, shows visual feedback
3. **Weekly Goals:** Click goal item → increments progress, shows confetti
4. **Habit Grid:** Click any circle → toggles that day's habit
5. **Schedule Tasks:** Click task → toggles completion with confetti
6. **Quick Add:** Click "+ add" on day → prompt appears, task created
7. **Add Habit Link:** Click "+ habit" → navigates to habits page

**Step 2: Check for console errors**

Open DevTools Console - should be no React errors or API failures.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: dashboard V5 full interactivity

- Study link in navigation
- Clickable goal items to increment progress
- Clickable habit grid for any day
- Quick task creation on schedule
- Quick link to create habits"
```

---

## Verification Checklist

After completing all tasks:

- [ ] Study link appears in nav rail and works
- [ ] Clicking weekly goal increments its progress
- [ ] Clicking habit grid circle toggles that day
- [ ] Schedule shows tasks and clicking toggles them
- [ ] "+ add" on schedule days creates new tasks
- [ ] "+ habit" link navigates to habits page
- [ ] Confetti triggers on completions
- [ ] No console errors
