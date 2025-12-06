# Dashboard V5 Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 10 identified issues in the DashboardV4 (luxury journal) page to make all components functional and properly connected.

**Architecture:** Each fix is isolated to specific files. Most changes are in `DashboardV4.tsx` with some navigation component updates. We'll use existing components (`QuickAddModal`, `SmartTaskInput`) rather than building new ones.

**Tech Stack:** React, TypeScript, TanStack Query, Wouter, Tailwind CSS

---

## Issues Summary

| # | Issue | Status | Priority |
|---|-------|--------|----------|
| 1 | Habits limited to 4 | ✅ DONE | - |
| 2 | Weekly goals showing old completed goals | TODO | HIGH |
| 3 | Weekly rhythm not working | TODO | HIGH |
| 4 | Study tracker showing minutes (should show tasks) | TODO | MEDIUM |
| 5 | Places to Explore showing "beta" (climbing facts) | TODO | LOW |
| 6 | Quick task uses browser prompt() | TODO | HIGH |
| 7 | No navigation on web | TODO | HIGH |
| 8 | Schedule too short (only 2 tasks) | TODO | MEDIUM |
| 9 | Schedule needs logic (task management) | TODO | HIGH |
| 10 | Pimsleur/RemNote not in habits | TODO | VERIFY |

---

## Task 1: Fix Weekly Goals Filter (Exclude Completed)

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx:324-326`

**Problem:** The `weeklyGoals` filter includes completed goals. "climb 4/4" from ages ago still appears.

**Step 1: Update the weeklyGoals filter**

Find this code:
```typescript
const weeklyGoals = useMemo(() => {
  return goals.filter(g => g.deadline && g.deadline <= week.weekEnd && g.deadline >= week.weekStart).slice(0, 3);
}, [goals, week.weekStart, week.weekEnd]);
```

Replace with:
```typescript
const weeklyGoals = useMemo(() => {
  return goals
    .filter(g => {
      // Must have deadline in current week
      const hasWeeklyDeadline = g.deadline && g.deadline <= week.weekEnd && g.deadline >= week.weekStart;
      // Must NOT be completed (currentValue < targetValue)
      const isIncomplete = g.currentValue < g.targetValue;
      return hasWeeklyDeadline && isIncomplete;
    })
    .slice(0, 3);
}, [goals, week.weekStart, week.weekEnd]);
```

**Step 2: Verify change**

Run dev server, check that completed goals no longer appear in Weekly Goals card.

**Step 3: Commit**
```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "fix: exclude completed goals from weekly goals display"
```

---

## Task 2: Fix Navigation on Web (Always Visible)

**Files:**
- Modify: `client/src/components/MainLayout.tsx:42`

**Problem:** Nav rail is `hidden lg:flex` - only shows on large screens. User reports nav broken on web too.

**Step 1: Change nav visibility**

Find this code:
```typescript
<nav className="hidden lg:flex glass-card rounded-none border-r border-border/50 flex-col items-center py-6 gap-2">
```

Replace with (show on md and up):
```typescript
<nav className="hidden md:flex glass-card rounded-none border-r border-border/50 flex-col items-center py-6 gap-2">
```

**Step 2: Update grid for medium screens**

Find:
```typescript
showTodoPanel
  ? "grid-cols-1 lg:grid-cols-[64px_1fr_320px]"
  : "grid-cols-1 lg:grid-cols-[64px_1fr]"
```

Replace with:
```typescript
showTodoPanel
  ? "grid-cols-1 md:grid-cols-[64px_1fr] lg:grid-cols-[64px_1fr_320px]"
  : "grid-cols-1 md:grid-cols-[64px_1fr]"
```

**Step 3: Update bottom nav visibility**

Find:
```typescript
<div className="lg:hidden">
  <BottomNav />
</div>
```

Replace with:
```typescript
<div className="md:hidden">
  <BottomNav />
</div>
```

**Step 4: Commit**
```bash
git add client/src/components/MainLayout.tsx
git commit -m "fix: show nav rail on medium screens and up"
```

---

## Task 3: Replace prompt() with QuickAddModal

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx` (add import, state, and replace prompt)

**Problem:** The "+ add" button in Schedule uses `prompt()` which is a poor UX.

**Step 1: Add QuickAddModal import**

Add to imports section:
```typescript
import { QuickAddModal } from '@/components/QuickAddModal';
```

**Step 2: Add state for modal and selected date**

After the existing state declarations (around line 115), add:
```typescript
const [quickAddOpen, setQuickAddOpen] = useState(false);
const [quickAddDate, setQuickAddDate] = useState<string>('');
```

**Step 3: Create modified QuickAddModal with date preset**

We need to modify how we open the modal to preset the date. Since QuickAddModal sets default date internally, we'll create a wrapper approach.

Actually, simpler: replace the prompt with opening the existing task management page with a query param:

Replace the "+ add" button onClick:
```typescript
onClick={() => {
  const title = prompt('Quick add task:');
  if (title?.trim()) {
    createTodoMutation.mutate({ title: title.trim(), dueDate: week.dates[i] });
  }
}}
```

With a link to the tasks page:
```typescript
onClick={() => {
  setQuickAddDate(week.dates[i]);
  setQuickAddOpen(true);
}}
```

**Step 4: Add QuickAddModal with date prop**

We need to enhance QuickAddModal to accept an optional initialDate prop. For now, let's use a simpler approach - navigate to /todos.

Actually, the cleanest fix is to create a small inline modal. Let me revise:

**Step 3 (revised): Add inline quick-add state**

Add state:
```typescript
const [inlineAddDay, setInlineAddDay] = useState<number | null>(null);
const [inlineAddTitle, setInlineAddTitle] = useState('');
```

**Step 4: Replace prompt with inline input**

Replace the "+ add" button with an inline input when that day is selected:
```typescript
{dayTodos.length < 2 && (
  inlineAddDay === i ? (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (inlineAddTitle.trim()) {
          createTodoMutation.mutate({ title: inlineAddTitle.trim(), dueDate: week.dates[i] });
          setInlineAddTitle('');
          setInlineAddDay(null);
        }
      }}
      className="flex gap-1"
    >
      <input
        type="text"
        value={inlineAddTitle}
        onChange={(e) => setInlineAddTitle(e.target.value)}
        placeholder="Task..."
        autoFocus
        onBlur={() => {
          if (!inlineAddTitle.trim()) {
            setInlineAddDay(null);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setInlineAddTitle('');
            setInlineAddDay(null);
          }
        }}
        className="flex-1 text-[0.6rem] p-1 rounded bg-white/10 border border-white/20 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-peach-400/50"
      />
    </form>
  ) : (
    <button
      type="button"
      onClick={() => setInlineAddDay(i)}
      className="w-full text-center font-body text-[0.55rem] p-1 rounded text-[var(--text-muted)] hover:bg-white/5 transition-colors opacity-50 hover:opacity-100"
    >
      + add
    </button>
  )
)}
```

**Step 5: Commit**
```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "fix: replace browser prompt with inline task input"
```

---

## Task 4: Increase Schedule Task Display

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx:594`

**Problem:** Schedule only shows 2 tasks per day (`.slice(0, 2)`).

**Step 1: Increase task limit**

Find:
```typescript
{dayTodos.slice(0, 2).map(todo => (
```

Replace with:
```typescript
{dayTodos.slice(0, 4).map(todo => (
```

**Step 2: Adjust minimum height for more tasks**

Find:
```typescript
"rounded-xl p-3 min-h-[70px] text-center transition-all",
```

Replace with:
```typescript
"rounded-xl p-3 min-h-[100px] text-center transition-all",
```

**Step 3: Commit**
```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "fix: increase schedule to show 4 tasks per day"
```

---

## Task 5: Fix Study Tracker (Show Tasks Not Minutes)

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx:476-487`
- Modify: `client/src/components/LuxuryStudyTracker.tsx`

**Problem:** Study tracker shows hardcoded `todayMinutes={0}` instead of actual study tasks.

**Step 1: Create studyTasks filter in DashboardV4**

Add after other useMemo hooks (around line 358):
```typescript
// Study tasks - tasks tagged with study-related projects or labels
const studyTasks = useMemo(() => {
  return todos.filter(t => {
    // Check if task has "study" in title or is in a study project
    const isStudyTask = t.title.toLowerCase().includes('study') ||
      t.title.toLowerCase().includes('learn') ||
      t.title.toLowerCase().includes('review') ||
      t.title.toLowerCase().includes('flashcard') ||
      t.title.toLowerCase().includes('anki') ||
      t.title.toLowerCase().includes('remnote');
    return isStudyTask && !t.completed;
  }).slice(0, 3);
}, [todos]);
```

**Step 2: Update LuxuryStudyTracker props**

Modify `LuxuryStudyTracker.tsx` to accept tasks instead of minutes:

```typescript
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

interface StudyTask {
  id: number;
  title: string;
  completed: boolean;
}

interface LuxuryStudyTrackerProps {
  tasks: StudyTask[];
  onToggle?: (id: number) => void;
  onStartSession?: () => void;
  className?: string;
}

export function LuxuryStudyTracker({
  tasks,
  onToggle,
  onStartSession,
  className,
}: LuxuryStudyTrackerProps) {
  const isEmpty = tasks.length === 0;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="empty-display">No study tasks</span>
          <span className="font-body text-xs text-[var(--text-muted)] mt-2">
            Add tasks with "study" or "learn" in the title
          </span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2">
          <div className="text-xs text-[var(--text-muted)] mb-2">
            {completedCount}/{tasks.length} complete
          </div>
          {tasks.map(task => (
            <button
              key={task.id}
              onClick={() => onToggle?.(task.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg text-left transition-all",
                task.completed ? "opacity-50" : "hover:bg-white/5"
              )}
            >
              {task.completed ? (
                <CheckCircle2 className="w-4 h-4 text-peach-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              )}
              <span className={cn(
                "font-body text-xs truncate",
                task.completed && "line-through text-[var(--text-muted)]"
              )}>
                {task.title}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Start button */}
      <button
        onClick={onStartSession}
        className={cn(
          "w-full py-3 rounded-2xl font-heading text-sm tracking-wide transition-all mt-4",
          "bg-peach-400 text-ice-deep",
          "shadow-[0_4px_20px_rgba(228,168,128,0.3)]",
          "hover:shadow-[0_6px_28px_rgba(228,168,128,0.4)]",
          "hover:translate-y-[-1px]",
          "active:translate-y-0"
        )}
      >
        Go to Study
      </button>
    </div>
  );
}
```

**Step 3: Update DashboardV4 usage**

Replace:
```typescript
<LuxuryStudyTracker
  todayMinutes={0}
  weekMinutes={0}
  onStartSession={() => {
    toast({ title: "Study session started" });
  }}
/>
```

With:
```typescript
<LuxuryStudyTracker
  tasks={studyTasks.map(t => ({ id: t.id, title: t.title, completed: t.completed }))}
  onToggle={(id) => handleToggleTodo(id)}
  onStartSession={() => {
    window.location.href = '/study';
  }}
/>
```

**Step 4: Commit**
```bash
git add client/src/pages/DashboardV4.tsx client/src/components/LuxuryStudyTracker.tsx
git commit -m "fix: study tracker shows tasks instead of minutes"
```

---

## Task 6: Rename "Places to Explore" to "Climbing Tips"

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx:518-520`

**Problem:** The card is called "Places to Explore" but shows climbing fun facts.

**Step 1: Rename the card title**

Find:
```typescript
<span className="card-title">Place to Explore</span>
```

Replace with:
```typescript
<span className="card-title">Climbing Tip</span>
```

**Step 2: Commit**
```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "fix: rename Places to Explore to Climbing Tip"
```

---

## Task 7: Verify/Fix Weekly Rhythm

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx` (if needed)
- Check: `client/src/components/LuxuryWeeklyRhythm.tsx`

**Problem:** Weekly rhythm bars not displaying correctly.

**Step 1: Debug weeklyRhythm calculation**

The current calculation (line 361-367) looks correct:
```typescript
const weeklyRhythm = useMemo(() => {
  return week.dates.map((date, i) => {
    const completed = habits.filter(h => completionMap[h.id]?.[date]).length;
    const total = habits.length || 1;
    return { day: week.dayNames[i].charAt(0), height: Math.round((completed / total) * 100), isToday: i === week.todayIndex };
  });
}, [habits, completionMap, week]);
```

**Step 2: Check LuxuryWeeklyRhythm component**

Read and verify the component handles the data correctly. If `habits` is empty or `completionMap` is empty, bars will show 0%.

**Step 3: Add fallback for empty state**

If habits.length is 0, the rhythm should show an empty state message instead of empty bars.

**Verification:** If habits are loading properly after Task 1 fix, this should work. No code change needed unless testing reveals issues.

---

## Task 8: Verify Pimsleur/RemNote in Habits DB

**Files:**
- N/A (Database check)

**Problem:** User says Pimsleur and RemNote should appear in habits.

**Step 1: Check database**

Run SQL query to verify habits exist:
```sql
SELECT id, title, user_id FROM habits WHERE title ILIKE '%pimsleur%' OR title ILIKE '%remnote%';
```

**Step 2: If missing, add via API or directly**

If they don't exist, user needs to add them via the Habits page.

**Step 3: Document finding**

No code change - this is a data issue, not a bug.

---

## Execution Order

1. **Task 1** - Weekly goals filter (fixes visible bug)
2. **Task 2** - Navigation visibility (fixes usability)
3. **Task 3** - Inline task input (fixes UX)
4. **Task 4** - Schedule task limit (fixes display)
5. **Task 5** - Study tracker (fixes functionality)
6. **Task 6** - Card rename (cosmetic)
7. **Task 7** - Weekly rhythm verification
8. **Task 8** - Database verification

---

## Testing Checklist

After all fixes:

- [ ] Weekly goals only shows incomplete goals with deadlines this week
- [ ] Nav rail visible on tablets and desktops (md breakpoint and up)
- [ ] Bottom nav visible only on mobile (below md)
- [ ] "+ add" in schedule opens inline input, not browser prompt
- [ ] Pressing Enter creates task, Escape cancels
- [ ] Schedule shows up to 4 tasks per day
- [ ] Study tracker shows tasks with study/learn keywords
- [ ] Clicking study task toggles completion
- [ ] "Go to Study" button navigates to /study
- [ ] "Climbing Tip" card shows climbing facts
- [ ] Weekly rhythm shows habit completion bars
- [ ] All habits appear in "This Week" grid
