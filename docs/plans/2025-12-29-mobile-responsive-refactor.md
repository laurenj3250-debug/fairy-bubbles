# Mobile Responsive Refactor - Proper Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor IcyDash and Goals pages with production-quality mobile responsiveness - no hacks, no duplication, proper architecture.

**Architecture:** Single responsive components using CSS-only breakpoints where possible, shared mobile schedule component, proper data fetching for extended date ranges.

**Tech Stack:** React, Tailwind CSS (responsive utilities), TanStack Query, date-fns

---

## Task 1: Create Shared MobileSchedule Component

**Problem:** Schedule view is duplicated inline with `{isMobile ? ... : ...}` pattern.

**Files:**
- Create: `client/src/components/MobileSchedule.tsx`
- Modify: `client/src/pages/IcyDash.tsx`

**Step 1: Create the component**

```tsx
// client/src/components/MobileSchedule.tsx
import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

interface MobileScheduleProps {
  getTodosForDate: (date: string) => Todo[];
  onToggleTodo: (id: number) => void;
  maxOffset?: number; // Limit navigation range, default ±7
}

export function MobileSchedule({
  getTodosForDate,
  onToggleTodo,
  maxOffset = 7
}: MobileScheduleProps) {
  const [offset, setOffset] = useState(0);
  const today = useMemo(() => new Date(), []);
  const todayStr = format(today, 'yyyy-MM-dd');

  const threeDays = useMemo(() => {
    const centerDate = addDays(today, offset);
    return [-1, 0, 1].map(dayOffset => {
      const date = addDays(centerDate, dayOffset);
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date: dateStr,
        dayName: format(date, 'EEE'),
        dayNum: format(date, 'd'),
        isToday: dateStr === todayStr,
        todos: getTodosForDate(dateStr),
      };
    });
  }, [offset, today, todayStr, getTodosForDate]);

  const canGoBack = offset > -maxOffset;
  const canGoForward = offset < maxOffset;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => canGoBack && setOffset(o => o - 1)}
        disabled={!canGoBack}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
          canGoBack
            ? "bg-white/10 text-white hover:bg-white/20 active:scale-95"
            : "bg-white/5 text-white/30 cursor-not-allowed"
        )}
        aria-label="Previous days"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex gap-2 flex-1 overflow-hidden">
        {threeDays.map((day) => (
          <DayCard
            key={day.date}
            {...day}
            onToggle={onToggleTodo}
          />
        ))}
      </div>

      <button
        onClick={() => canGoForward && setOffset(o => o + 1)}
        disabled={!canGoForward}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
          canGoForward
            ? "bg-white/10 text-white hover:bg-white/20 active:scale-95"
            : "bg-white/5 text-white/30 cursor-not-allowed"
        )}
        aria-label="Next days"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function DayCard({
  date,
  dayName,
  dayNum,
  isToday,
  todos,
  onToggle
}: {
  date: string;
  dayName: string;
  dayNum: string;
  isToday: boolean;
  todos: Todo[];
  onToggle: (id: number) => void;
}) {
  return (
    <div
      className={cn(
        "flex-1 rounded-xl p-3 min-w-0 transition-colors",
        isToday
          ? "bg-peach-400/10 border border-peach-400/30"
          : "bg-white/5"
      )}
    >
      <div className={cn(
        "text-xs mb-1",
        isToday ? "text-peach-400 font-medium" : "text-[var(--text-muted)]"
      )}>
        {dayName}{isToday && " · Today"}
      </div>
      <div className={cn(
        "text-sm font-semibold mb-2",
        isToday ? "text-peach-400" : "text-white"
      )}>
        {dayNum}
      </div>
      <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
        {todos.slice(0, 4).map(todo => (
          <button
            key={todo.id}
            onClick={() => onToggle(todo.id)}
            className={cn(
              "w-full text-left bg-white/5 rounded-lg px-2 py-2 text-xs transition-all",
              "hover:bg-white/10 active:scale-[0.98]",
              todo.completed && "line-through opacity-50"
            )}
          >
            {todo.title}
          </button>
        ))}
        {todos.length > 4 && (
          <div className="text-xs text-[var(--text-muted)] text-center py-1">
            +{todos.length - 4} more
          </div>
        )}
        {todos.length === 0 && (
          <div className="text-xs text-[var(--text-muted)] text-center py-3">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify component compiles**

Run: `npx tsc --noEmit client/src/components/MobileSchedule.tsx`
Expected: No errors

**Step 3: Commit**

```bash
git add client/src/components/MobileSchedule.tsx
git commit -m "feat: add MobileSchedule component with bounded navigation"
```

---

## Task 2: Extend Todo Query for Date Range

**Problem:** Todos outside current week return empty because data isn't fetched.

**Files:**
- Modify: `client/src/pages/IcyDash.tsx`

**Step 1: Create extended date range query**

Add after existing `todosByDay` computation:

```tsx
// Extended todos map for mobile schedule (±7 days from today)
const extendedTodosMap = useMemo(() => {
  const map: Record<string, TodoWithMetadata[]> = {};
  const today = new Date();

  // Initialize all dates in range
  for (let i = -8; i <= 8; i++) {
    const date = addDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    map[dateStr] = [];
  }

  // Populate from todos
  todos.forEach(todo => {
    if (todo.dueDate && map[todo.dueDate] !== undefined) {
      if (!hideCompleted || !todo.completed) {
        map[todo.dueDate].push(todo);
      }
    }
  });

  return map;
}, [todos, hideCompleted]);

// Callback for MobileSchedule
const getTodosForDate = useCallback((date: string) => {
  return extendedTodosMap[date] || [];
}, [extendedTodosMap]);
```

**Step 2: Verify no type errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "feat: add extended todos map for mobile schedule date range"
```

---

## Task 3: Replace Inline Mobile Schedule with Component

**Files:**
- Modify: `client/src/pages/IcyDash.tsx`

**Step 1: Import MobileSchedule**

```tsx
import { MobileSchedule } from '@/components/MobileSchedule';
```

**Step 2: Replace the inline mobile schedule**

Replace the entire `{isMobile ? (...) : (...)}` block in ROW 4 with:

```tsx
{/* ROW 4: Weekly Schedule */}
<div className="glass-card frost-accent min-h-[200px] md:min-h-[280px]">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <span className="card-title">Schedule</span>
      <button
        onClick={() => setHideCompleted(!hideCompleted)}
        className={cn(
          "p-1 rounded transition-colors",
          hideCompleted
            ? "text-peach-400 bg-peach-400/10"
            : "text-[var(--text-muted)] hover:text-peach-400"
        )}
        title={hideCompleted ? "Show completed" : "Hide completed"}
      >
        {hideCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
    <span className="font-body text-xs text-[var(--text-muted)]">
      {week.formatRange}
    </span>
  </div>

  {/* Mobile: 3-day view */}
  <div className="md:hidden">
    <MobileSchedule
      getTodosForDate={getTodosForDate}
      onToggleTodo={handleToggleTodo}
      maxOffset={7}
    />
  </div>

  {/* Desktop: 7-day grid */}
  <div className="hidden md:block">
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveTaskId(e.active.id as number)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTaskId(null)}
    >
      <div className="grid grid-cols-7 gap-2">
        {week.dayNames.map((day, i) => (
          <DroppableDayColumn
            key={`${day}-${i}`}
            dayIndex={i}
            dayName={day}
            date={week.dates[i]}
            isToday={i === week.todayIndex}
            todos={todosByDay[i] || []}
            studyTasks={studyTasksByDay[i] || []}
            onToggle={handleToggleTodo}
            onUpdate={(id, title) => updateTodoMutation.mutate({ id, title })}
            onDelete={(id) => deleteTodoMutation.mutate(id)}
            onAdd={() => setInlineAddDay(i)}
            onStudyToggle={(taskType) => handleStudyTaskToggle(taskType, week.dates[i])}
            isAddingDay={inlineAddDay}
            inlineAddTitle={inlineAddTitle}
            setInlineAddTitle={setInlineAddTitle}
            setInlineAddDay={setInlineAddDay}
            onSubmitAdd={(dueDate) => {
              createTodoMutation.mutate({ title: inlineAddTitle.trim(), dueDate });
            }}
            isCreating={createTodoMutation.isPending}
            isUpdating={updateTodoMutation.isPending}
            isDeleting={deleteTodoMutation.isPending}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="bg-ice-card/90 p-1 rounded shadow-lg text-[0.65rem] border border-peach-400/50 max-w-[100px] truncate">
            {activeTask.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  </div>
</div>
```

**Step 3: Remove unused state and imports**

- Remove: `const [scheduleOffset, setScheduleOffset] = useState(0);`
- Remove: `threeDaySchedule` useMemo
- Remove: `ChevronLeft, ChevronRight` from lucide imports (moved to component)
- Remove: `subDays` from date-fns imports (unused)

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "refactor: use MobileSchedule component instead of inline duplication"
```

---

## Task 4: Fix Bottom Padding Hack

**Problem:** Using `{isMobile && <div className="h-16" />}` for spacing.

**Files:**
- Modify: `client/src/pages/IcyDash.tsx`
- Modify: `client/src/pages/Goals.tsx`

**Step 1: Remove the hack div from IcyDash**

Delete:
```tsx
{/* Extra padding for bottom nav on mobile */}
{isMobile && <div className="h-16" />}
```

**Step 2: Update container padding**

Change:
```tsx
<div className="relative z-10 px-4 md:px-8 pb-20 md:pb-24">
```

To:
```tsx
<div className="relative z-10 px-4 md:px-8 pb-24">
```

The BottomNav component already has `h-16` and is `fixed`, so `pb-24` (96px) provides enough clearance on both mobile and desktop.

**Step 3: Do the same for Goals.tsx**

Same changes.

**Step 4: Commit**

```bash
git add client/src/pages/IcyDash.tsx client/src/pages/Goals.tsx
git commit -m "fix: use proper padding instead of conditional spacer div"
```

---

## Task 5: Increase Touch Target Sizes

**Problem:** Navigation arrows are 32px, below 44px iOS minimum.

**Files:**
- Modify: `client/src/components/MobileSchedule.tsx`

**Step 1: Update button sizes**

Change `w-10 h-10` to `w-11 h-11` (44px) and increase icon size:

```tsx
<button
  className={cn(
    "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
    // ...
  )}
>
  <ChevronLeft className="w-6 h-6" />
</button>
```

**Step 2: Update task item padding**

Change task buttons from `py-2` to `py-2.5` for better tap targets:

```tsx
<button
  className={cn(
    "w-full text-left bg-white/5 rounded-lg px-2.5 py-2.5 text-xs transition-all min-h-[44px]",
    // ...
  )}
>
```

**Step 3: Commit**

```bash
git add client/src/components/MobileSchedule.tsx
git commit -m "fix: increase touch targets to meet 44px minimum"
```

---

## Task 6: Add Loading State to Mobile Schedule

**Problem:** No loading indicator while data fetches.

**Files:**
- Modify: `client/src/components/MobileSchedule.tsx`

**Step 1: Add loading prop and skeleton**

```tsx
interface MobileScheduleProps {
  getTodosForDate: (date: string) => Todo[];
  onToggleTodo: (id: number) => void;
  maxOffset?: number;
  isLoading?: boolean;
}

// In the component:
if (isLoading) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-11 h-11 rounded-full bg-white/5 animate-pulse" />
      <div className="flex gap-2 flex-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-1 rounded-xl p-3 bg-white/5 animate-pulse h-[140px]" />
        ))}
      </div>
      <div className="w-11 h-11 rounded-full bg-white/5 animate-pulse" />
    </div>
  );
}
```

**Step 2: Pass loading state from IcyDash**

```tsx
<MobileSchedule
  getTodosForDate={getTodosForDate}
  onToggleTodo={handleToggleTodo}
  maxOffset={7}
  isLoading={todosLoading}
/>
```

**Step 3: Commit**

```bash
git add client/src/components/MobileSchedule.tsx client/src/pages/IcyDash.tsx
git commit -m "feat: add loading skeleton to MobileSchedule"
```

---

## Task 7: Add Double-Tap to Reset Schedule to Today

**Problem:** Users can get lost navigating away from today.

**Files:**
- Modify: `client/src/components/MobileSchedule.tsx`

**Step 1: Add reset functionality**

```tsx
// Add to component
const handleReset = useCallback(() => {
  setOffset(0);
}, []);

// Add reset indicator when offset !== 0
{offset !== 0 && (
  <button
    onClick={handleReset}
    className="absolute top-2 right-2 text-xs text-peach-400 hover:underline"
  >
    Back to today
  </button>
)}
```

**Step 2: Commit**

```bash
git add client/src/components/MobileSchedule.tsx
git commit -m "feat: add 'Back to today' button when navigated away"
```

---

## Summary of Changes

| Issue | Fix |
|-------|-----|
| Duplicated schedule code | Extract to `MobileSchedule` component |
| Infinite scroll offset | Bound to ±7 days with disabled buttons |
| Empty todos outside week | Extended todos map covering ±8 days |
| Magic spacer div | Proper `pb-24` padding |
| Small touch targets | 44px minimum on buttons and tasks |
| No loading state | Skeleton loader on mobile schedule |
| Lost in navigation | "Back to today" reset button |
| Unused `subDays` import | Removed |

---

## Execution Options

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Manual execution** - You implement task by task

Which approach?
