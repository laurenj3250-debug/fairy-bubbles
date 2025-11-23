# Summit Log Widget - Design Specification

**Date:** November 22, 2024
**Component:** `SummitLog.tsx`
**Status:** Ready for Implementation

---

## 1. Design Vision

### Purpose
A **trophy case for monthly accomplishments** that answers:
- "What have I conquered this month?"
- "Where should I focus?"

Unlike generic dashboard widgets, this celebrates completed work (which normally vanishes) and highlights ONE actionable focus area.

### Why This Design
After roasting the original "3 rings" approach:
- Existing dashboard already has elevation gauges (Routes)
- Progress rings are generic dashboard slop
- Completed items currently disappear with no celebration
- Data dumps don't create focus

### Design Principles
1. **Celebrate wins** - Completed goals/tasks don't disappear
2. **One focus only** - Not a data dump, ONE weak area
3. **Pressure preserved** - Countdown creates urgency
4. **Specific numbers** - No vague encouragement

---

## 2. Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🏔️ November Summit Log                      ⏱️ 8 days left │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CONQUERED THIS MONTH                                       │
│  ⛰️ Pimsleur: 12 Lessons Complete           [Goal 100%]    │
│  🎹 Piano Practice: 14 sessions             [Habit 87%]    │
│  ✓ Filed quarterly taxes                    [HARD]         │
│  ✓ Finished project proposal                [HARD]         │
│  ✓ Scheduled all Q1 meetings                [HARD]         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ FOCUS AREA                                              │
│  Rock Climbing dropped 40% from October (2/7 this week)    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📊 VS OCTOBER: ↑12% overall  •  Habits ↑8%  •  Goals +2   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Component Specifications

### 3.1 Card Container
```css
bg-background/40 backdrop-blur-xl
border border-foreground/10
rounded-2xl shadow-xl p-5
```
- Width: 100% of container
- Height: Auto (~280-350px based on content)

### 3.2 Header
```
🏔️ November Summit Log                      ⏱️ 8 days left
```

| Element | Style |
|---------|-------|
| Mountain icon | `w-5 h-5` or emoji |
| Title | `text-lg font-semibold text-foreground` |
| Countdown | `text-sm font-medium` |

**Countdown Colors:**
| Days Left | Color |
|-----------|-------|
| > 14 | `text-foreground/50` |
| 8-14 | `text-foreground/70` |
| 4-7 | `text-amber-500` |
| 1-3 | `text-orange-500` |
| Last day | `text-red-500 animate-pulse` |

### 3.3 Conquered Section

**Header:**
- Text: "CONQUERED THIS MONTH"
- Style: `text-xs font-semibold text-foreground/50 uppercase tracking-wider`

**Achievement Row:**
```
⛰️ Pimsleur: 12 Lessons Complete           [Goal 100%]
```

| Element | Style |
|---------|-------|
| Icon | `w-5 h-5` |
| Title | `text-sm text-foreground/80 flex-1` |
| Badge | `text-xs px-2 py-0.5 rounded-full` |

**Badge Colors:**
| Type | Badge Style |
|------|-------------|
| Goal Complete | `bg-primary/20 text-primary` |
| Habit 80%+ | `bg-accent/20 text-accent` |
| Hard Task | `bg-amber-500/20 text-amber-600` |

**What Qualifies:**
1. Goals reaching 100% this month
2. Habits with ≥80% completion this month
3. Tasks with `priority: 'high'` or `difficulty: 'hard'`, completed this month

**Limit:** Show max 5 items, then "+N more" link

### 3.4 Focus Area

**Purpose:** ONE weak spot requiring attention.

```css
Container: bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mt-4
Header: text-xs font-semibold text-amber-600 uppercase
Message: text-sm text-foreground/80 mt-1
```

**Selection Logic (Priority):**
1. Habit with biggest % drop vs last month
2. Goal behind schedule (deadline near, <50% done)
3. Habit with lowest % this month
4. If all good: "🎉 No weak spots! Keep crushing it."

**Message Examples:**
- "Rock Climbing dropped 40% from October (2/7 this week)"
- "Read 4 Books at 25% with 8 days until deadline"

### 3.5 Comparison Footer

```
📊 VS OCTOBER: ↑12% overall  •  Habits ↑8%  •  Goals +2
```

| Element | Style |
|---------|-------|
| Container | `border-t border-foreground/10 pt-3 mt-4` |
| Text | `text-xs text-foreground/60` |
| Up arrow | `text-green-500` |
| Down arrow | `text-red-500` |

---

## 4. Data Model

```typescript
interface SummitLogData {
  month: string;              // "2024-11"
  daysElapsed: number;
  daysRemaining: number;

  conquered: Array<{
    id: number;
    type: 'goal' | 'habit' | 'task';
    title: string;
    icon: string;
    badge: string;            // "Goal 100%" | "Habit 87%" | "HARD"
    completedAt?: string;
  }>;

  focusArea: {
    type: 'habit' | 'goal' | 'none';
    title: string;
    message: string;          // Full message with numbers
    percentDrop?: number;
  } | null;

  comparison: {
    overall: number;          // +12 or -5 (percentage points)
    habits: number;
    goalsCompleted: number;   // +2 or -1 (count)
    vsMonth: string;          // "October"
  };
}
```

---

## 5. Data Fetching

**Existing Endpoints Used:**
- `/api/habits-with-data` - Habit history array
- `/api/goals` - Goal currentValue/targetValue
- `/api/todos` - Filter by completedAt and priority

**New Calculations (Client-Side):**
```typescript
// Conquered goals: currentValue >= targetValue
const conqueredGoals = goals.filter(g => g.currentValue >= g.targetValue);

// Conquered habits: 80%+ completion this month
const conqueredHabits = habits.filter(h => {
  const thisMonthDays = h.history.filter(d => d.date.startsWith(currentMonth));
  const completedDays = thisMonthDays.filter(d => d.completed).length;
  return (completedDays / thisMonthDays.length) >= 0.8;
});

// Hard tasks: priority === 'high', completed this month
const hardTasks = todos.filter(t =>
  t.priority === 'high' &&
  t.completed &&
  t.completedAt?.startsWith(currentMonth)
);
```

---

## 6. Edge Cases

| Scenario | Display |
|----------|---------|
| No conquests yet | "Nothing conquered yet. You've got [N] days!" |
| First day of month | "Fresh month! Let's see what you can conquer." |
| No focus area needed | "🎉 No weak spots! Keep crushing it." |
| No data for comparison | Hide comparison footer |
| Everything at 100% | Special celebration: "🏆 PERFECT MONTH" banner |

---

## 7. Implementation Checklist

- [ ] Create `SummitLog.tsx` component
- [ ] Create `useSummitLogData.ts` hook
- [ ] Add to V2Dashboard (after QuickLogWidget or Routes)
- [ ] Style conquered items with badges
- [ ] Implement focus area selection logic
- [ ] Add month-over-month comparison
- [ ] Test empty states
- [ ] Test countdown color transitions

---

## 8. File Structure

```
client/src/components/
└── SummitLog/
    ├── index.tsx           # Main component
    ├── ConqueredList.tsx   # Trophy case section
    ├── FocusArea.tsx       # Weak link section
    └── useSummitLogData.ts # Data hook
```

---

*Design finalized: November 22, 2024*
