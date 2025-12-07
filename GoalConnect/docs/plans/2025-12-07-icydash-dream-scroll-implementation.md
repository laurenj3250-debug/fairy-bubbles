# IcyDash Dream Scroll Widget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Dream Scroll widget to IcyDash with "pull to calendar" feature and redesign layout for visual hierarchy.

**Architecture:** Modify IcyDash grid layout to 2-2-3-1 column structure, import existing DreamScrollWidget, enhance widget with calendar popover for creating todos from ideas.

**Tech Stack:** React, TanStack Query, Tailwind CSS, Radix Popover, date-fns

---

## Task 1: Restructure IcyDash Grid Layout

**Files:**
- Modify: `client/src/pages/IcyDash.tsx:724-843`

**Step 1: Update Row 1 from 3-col to 2-col**

Find and replace in IcyDash.tsx around line 725:

```tsx
{/* ROW 1: Weekly Goals + Study Tracker */}
<div className="grid grid-cols-2 gap-5">
```

Remove Monthly Progress from Row 1 (we'll move it to Row 3).

**Step 2: Update Row 2 from 3-col to 2-col with tall height**

Replace the current Row 2 section with:

```tsx
{/* ROW 2: This Week Habits + Dream Scroll (tall) */}
<div className="grid grid-cols-2 gap-5">
  {/* This Week Habits */}
  <div className="glass-card frost-accent min-h-[320px] flex flex-col">
    <span className="card-title">This Week</span>
    <div className="flex-1">
      <LuxuryHabitGrid
        habits={todayHabits.map(habit => ({
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
    </div>
  </div>

  {/* Dream Scroll Widget */}
  <div className="min-h-[320px]">
    <DreamScrollWidget />
  </div>
</div>
```

**Step 3: Create Row 3 with 3 small widgets**

Add new row after Row 2:

```tsx
{/* ROW 3: Monthly Progress + Weekly Rhythm + Climbing Tip (small) */}
<div className="grid grid-cols-3 gap-5">
  {/* Monthly Progress */}
  <div className="glass-card frost-accent min-h-[160px] flex flex-col">
    <span className="card-title">Monthly Progress</span>
    <div className="flex-1 flex items-center justify-around">
      {monthlyGoals.length === 0 ? (
        <Link href="/goals">
          <div className="font-body text-sm text-[var(--text-muted)] hover:text-peach-400 py-4 text-center cursor-pointer transition-colors">
            + Add monthly goals
          </div>
        </Link>
      ) : (
        monthlyGoals.slice(0, 3).map(goal => {
          const progress = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
          return (
            <LuxuryProgressRing
              key={goal.id}
              progress={progress}
              label={goal.title}
            />
          );
        })
      )}
    </div>
  </div>

  {/* Weekly Rhythm */}
  <div className="glass-card frost-accent min-h-[160px] flex flex-col">
    <span className="card-title">Weekly Rhythm</span>
    <div className="flex-1 flex items-end">
      <LuxuryWeeklyRhythm data={weeklyRhythm} className="w-full" />
    </div>
  </div>

  {/* Climbing Tip */}
  <div className="glass-card frost-accent min-h-[160px] flex flex-col">
    <span className="card-title">Climbing Tip</span>
    <div className="flex-1">
      {(() => {
        const fact = getDailyFunFact();
        return (
          <LuxuryFunFact
            title={fact.title}
            content={fact.content}
            category={fact.category}
          />
        );
      })()}
    </div>
  </div>
</div>
```

**Step 4: Add DreamScrollWidget import**

At top of IcyDash.tsx, add:

```tsx
import { DreamScrollWidget } from '@/components/DreamScrollWidget';
```

**Step 5: Run dev server and verify layout**

Run: `npm run dev`
Expected: Dashboard shows new 2-2-3-1 layout with Dream Scroll in Row 2

**Step 6: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "feat: restructure IcyDash layout to 2-2-3-1 grid with Dream Scroll"
```

---

## Task 2: Add "Pull to Calendar" Button to Dream Scroll Items

**Files:**
- Modify: `client/src/components/DreamScrollWidget.tsx`

**Step 1: Add Calendar import**

At top of DreamScrollWidget.tsx, add to imports:

```tsx
import { Sparkles, Plus, Check, ChevronDown, Mountain, CalendarPlus } from "lucide-react";
```

**Step 2: Add state for calendar popover**

Inside DreamScrollWidget component, after existing state declarations:

```tsx
const [calendarItemId, setCalendarItemId] = useState<number | null>(null);
const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
```

**Step 3: Add todo creation mutation**

After existing mutations:

```tsx
const createTodoMutation = useMutation({
  mutationFn: async ({ title, dueDate }: { title: string; dueDate: string }) => {
    return apiRequest("/api/todos", "POST", {
      title,
      dueDate,
      priority: 4,
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/todos-with-metadata"] });
    setCalendarItemId(null);
    setSelectedDate(undefined);
  },
});
```

**Step 4: Commit partial progress**

```bash
git add client/src/components/DreamScrollWidget.tsx
git commit -m "feat: add calendar mutation to DreamScrollWidget"
```

---

## Task 3: Add Calendar Popover UI

**Files:**
- Modify: `client/src/components/DreamScrollWidget.tsx`

**Step 1: Add Popover and Calendar imports**

```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
```

**Step 2: Add calendar button to each item**

In the item rendering section (around line 184-205), update to add calendar button:

```tsx
{activeItems.map(item => (
  <div
    key={item.id}
    className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/10 hover:border-[hsl(var(--accent))]/40 transition-all duration-300"
  >
    <button
      onClick={() => toggleMutation.mutate(item.id)}
      disabled={toggleMutation.isPending}
      className="mt-0.5 flex-shrink-0"
    >
      <Check className={cn(
        "w-5 h-5 transition-colors",
        "text-muted-foreground hover:text-[hsl(var(--accent))]"
      )} />
    </button>
    <div className="flex-1 min-w-0">
      <div className="text-sm text-foreground font-semibold line-clamp-2">{item.title}</div>
      {item.description && (
        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</div>
      )}
    </div>

    {/* Pull to Calendar Button */}
    <Popover open={calendarItemId === item.id} onOpenChange={(open) => {
      if (open) {
        setCalendarItemId(item.id);
        setSelectedDate(new Date());
      } else {
        setCalendarItemId(null);
      }
    }}>
      <PopoverTrigger asChild>
        <button
          className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-[hsl(var(--accent))] transition-colors"
          title="Add to schedule"
        >
          <CalendarPlus className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              setSelectedDate(date);
              createTodoMutation.mutate({
                title: item.title,
                dueDate: format(date, 'yyyy-MM-dd'),
              });
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  </div>
))}
```

**Step 3: Run and test**

Run: `npm run dev`
Test: Click calendar icon on a Dream Scroll item, select date, verify todo appears in schedule

**Step 4: Commit**

```bash
git add client/src/components/DreamScrollWidget.tsx
git commit -m "feat: add pull-to-calendar popover for Dream Scroll items"
```

---

## Task 4: Add Toast Feedback

**Files:**
- Modify: `client/src/components/DreamScrollWidget.tsx`

**Step 1: Import useToast**

```tsx
import { useToast } from "@/hooks/use-toast";
```

**Step 2: Add toast hook**

Inside component:

```tsx
const { toast } = useToast();
```

**Step 3: Update mutation to show toast**

Update createTodoMutation onSuccess:

```tsx
const createTodoMutation = useMutation({
  mutationFn: async ({ title, dueDate }: { title: string; dueDate: string }) => {
    return apiRequest("/api/todos", "POST", {
      title,
      dueDate,
      priority: 4,
    });
  },
  onSuccess: (_, { dueDate }) => {
    queryClient.invalidateQueries({ queryKey: ["/api/todos-with-metadata"] });
    setCalendarItemId(null);
    setSelectedDate(undefined);
    toast({
      title: "Added to schedule",
      description: `Task scheduled for ${format(new Date(dueDate), 'MMM d')}`,
    });
  },
  onError: (error: Error) => {
    toast({
      title: "Failed to add to schedule",
      description: error.message,
      variant: "destructive",
    });
  },
});
```

**Step 4: Run and verify toast**

Run: `npm run dev`
Test: Pull item to calendar, verify toast appears

**Step 5: Commit**

```bash
git add client/src/components/DreamScrollWidget.tsx
git commit -m "feat: add toast feedback for pull-to-calendar"
```

---

## Task 5: Adjust Widget Heights for Visual Balance

**Files:**
- Modify: `client/src/components/DreamScrollWidget.tsx`

**Step 1: Update widget container for taller height**

In DreamScrollWidget, update the outer container:

```tsx
<div className="glass-card interactive-glow p-6 h-full flex flex-col">
```

**Step 2: Update items list max-height**

Change the items container to flex-grow:

```tsx
<div className="space-y-2 flex-1 overflow-y-auto relative z-10">
```

**Step 3: Verify layout**

Run: `npm run dev`
Expected: Dream Scroll fills available height in Row 2

**Step 4: Commit**

```bash
git add client/src/components/DreamScrollWidget.tsx
git commit -m "feat: adjust DreamScrollWidget for flexible height"
```

---

## Task 6: Final Cleanup and Type Check

**Step 1: Run type check**

```bash
npm run check
```

Expected: No TypeScript errors

**Step 2: Test full flow**
1. Open IcyDash dashboard
2. Verify new layout (2-2-3-1 grid)
3. Switch Dream Scroll categories
4. Add a new idea
5. Pull an idea to calendar (select date)
6. Verify todo appears in Schedule widget
7. Verify toast feedback

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete IcyDash Dream Scroll integration with pull-to-calendar"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Restructure grid layout | IcyDash.tsx |
| 2 | Add calendar mutation | DreamScrollWidget.tsx |
| 3 | Add calendar popover UI | DreamScrollWidget.tsx |
| 4 | Add toast feedback | DreamScrollWidget.tsx |
| 5 | Adjust widget heights | DreamScrollWidget.tsx |
| 6 | Type check and test | - |
