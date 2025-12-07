# Weekly Planner Rebuild Plan

## Executive Summary

This plan addresses the broken Weekly Planner/Homepage by creating an **ADHD-friendly, frictionless command center** that surfaces all of GoalConnect's features without overwhelming users.

---

## Research Findings

### ADHD-Friendly Design Principles (Sources: [UX Collective](https://uxdesign.cc/software-accessibility-for-users-with-attention-deficit-disorder-adhd-f32226e6037c), [Lunatask](https://lunatask.app/adhd), [FocusBear](https://www.focusbear.io/blog-post/adhd-accessibility-designing-apps-for-focus))

| Principle | Implementation |
|-----------|----------------|
| **Simplicity & Minimalism** | Clean interface, hide complexity until needed |
| **Reduce Distractions** | No ads, minimal animations, focus mode |
| **Hick's Law** | Limit visible options, progressive disclosure |
| **Time Blindness** | Always show clock, session duration warnings |
| **Gamification** | Pet status visible, streak flames, XP progress |
| **1 Next Action** | Clear primary CTA, highlight what to do NOW |
| **Reasons to Return** | Notifications, streak warnings, pet needs |
| **Quick Capture** | Single-tap logging, keyboard shortcuts |

### Best Habit Tracker Patterns (Sources: [Zapier](https://zapier.com/blog/best-habit-tracker-app/), [DailyHabits](https://www.dailyhabits.xyz/habit-tracker-app/best-habit-tracking-apps))

- **Streaks**: Single-tap completion with satisfying feedback
- **HabitHub**: Notification action buttons (mark done without opening app)
- **Way of Life**: Yes/No/Skip/Note options for flexible logging
- **Habitify**: Clean weekly view with completion trends
- **Loop**: Lightweight, data-focused, no fluff

### GoalConnect Feature Inventory

The app has 10+ major systems that need to be surfaced:
1. **Habits** - Daily tracking with streaks, multi-metrics, scoring
2. **Goals** - Regular, monthly, weekly with hierarchy
3. **Tasks/Todos** - Full Todoist-like system with projects, labels, recurrence
4. **Virtual Pet** - Evolution, costumes, happiness
5. **Points/Gamification** - Transactions, daily quests, combos
6. **Mountaineering Game** - Expeditions, gear, missions
7. **Sports Tracking** - Strava (cycling), Kilter (climbing), Lifting
8. **Journey Dashboard** - Yearly goals for cycling/lifting/climbing
9. **Dream Scroll** - Wishlist/aspirations
10. **Mood Tracking** - Daily mood logging

---

## Design Philosophy

### Core Principles

1. **"What do I do NOW?"** - Always show the one next action
2. **Zero-friction input** - Add anything in 2 clicks or less
3. **Progressive disclosure** - Simple by default, power when needed
4. **Visible progress** - Streaks, bars, percentages always in view
5. **Dopamine hits** - Satisfying animations on completion
6. **Time awareness** - Clock visible, session warnings
7. **Escape hatches** - Easy to undo, skip, or defer

### Information Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│  ALWAYS VISIBLE (Top Bar)                                       │
│  - Current time (combats time blindness)                        │
│  - Pet status (emotional hook)                                  │
│  - Points/XP (gamification)                                     │
│  - Quick Add button (universal capture)                         │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  TODAY'S FOCUS (Hero Section)                                   │
│  - What habits need doing TODAY                                 │
│  - Single-tap completion                                        │
│  - Current streak status                                        │
│  - "Next up" suggestion                                         │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  WEEK AT A GLANCE (Context)                                     │
│  - Navigate between weeks (WORKING buttons!)                    │
│  - Day-by-day habit/task view                                   │
│  - Visual completion indicators                                 │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  GOALS & PROGRESS (Motivation)                                  │
│  - Weekly/Monthly goals with progress bars                      │
│  - Edit inline, not buried in dialogs                           │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  QUICK ACCESS (Secondary)                                       │
│  - Recent tasks                                                 │
│  - Active expedition status                                     │
│  - Journey stats summary                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Fix Critical Broken Functionality

**Priority: P0 - Must fix before anything else**

#### 1.1 Week Navigation Buttons
- **File**: `WeeklyPlannerPage.tsx:465-473`
- **Issue**: Buttons have no onClick handlers
- **Fix**:
  ```tsx
  // Add state
  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate current week based on offset
  const currentWeek = addWeeks(startOfWeek(new Date()), weekOffset);

  // Wire up buttons
  <button onClick={() => setWeekOffset(prev => prev - 1)}>‹</button>
  <button onClick={() => setWeekOffset(0)}>Today</button>
  <button onClick={() => setWeekOffset(prev => prev + 1)}>›</button>
  ```

#### 1.2 Add Habit From Homepage
- **Issue**: No way to add habits from planner
- **Fix**: Import and render `HabitCreateDialog` with trigger button
- **Placement**: Next to "Daily Pitches" header or floating action button

#### 1.3 Edit/Delete Habits
- **Issue**: Habits are read-only on planner
- **Fix**: Add context menu or edit icon on habit rows
- **Options**: Edit, Delete, Skip Today, View History

#### 1.4 Delete Tasks
- **Issue**: No delete button for tasks
- **Fix**: Add trash icon with confirmation dialog

#### 1.5 Edit/Delete Goals
- **Issue**: Goals are read-only
- **Fix**: Click to edit inline, or context menu for delete

---

### Phase 2: ADHD-Friendly Quick Input System

**Priority: P0 - Core usability**

#### 2.1 Universal Quick Add (Command Palette)
- **Trigger**: `Cmd+K` / `Ctrl+K` or floating "+" button
- **Features**:
  - Natural language parsing: "climb tomorrow", "read 30min daily"
  - Auto-detect type (habit, task, goal)
  - Recent items for quick re-add
  - Fuzzy search existing items

```tsx
// QuickAddCommand.tsx
interface QuickAddProps {
  isOpen: boolean;
  onClose: () => void;
}

// Input parses:
// "habit: meditate" → Opens HabitCreateDialog
// "task: buy groceries tomorrow" → Creates task with due date
// "goal: run 100 miles this month" → Creates monthly goal
// Just text → Creates task with smart defaults
```

#### 2.2 Single-Tap Habit Completion
- **Current**: Click habit → Dialog → Fill fields → Submit
- **New**: Click habit → Completed (with undo option)
- **Advanced**: Long-press for logging dialog (mood, duration, notes)

```tsx
// HabitQuickComplete.tsx
const handleClick = () => {
  // Optimistic update
  markComplete(habitId);
  toast({
    title: "✓ Habit completed!",
    action: <Button onClick={undo}>Undo</Button>
  });
};

const handleLongPress = () => {
  openDetailedLogDialog(habitId);
};
```

#### 2.3 Swipe Actions (Mobile)
- **Swipe right**: Complete habit/task
- **Swipe left**: Skip/defer to tomorrow
- **Implementation**: Use `@use-gesture/react` or similar

#### 2.4 Keyboard Shortcuts
- `Cmd+K`: Quick add
- `H`: Focus habits section
- `T`: Focus tasks section
- `G`: Focus goals section
- `J/K`: Navigate up/down in lists
- `Enter`: Complete focused item
- `E`: Edit focused item
- `D`: Delete focused item (with confirmation)

---

### Phase 3: Unified Homepage Architecture

**Priority: P1 - Consolidate the mess**

#### 3.1 Merge Dashboard Variants
- **Problem**: DashboardV3, DashboardNew, WeeklyPlannerPage all exist
- **Solution**: Create single `HomePage.tsx` that combines best of each
- **Routing**: `/` → HomePage (delete or redirect old routes)

#### 3.2 New Component Structure

```
client/src/pages/HomePage.tsx (Main container)
├── components/home/
│   ├── TopBar.tsx (time, pet, points, quick-add)
│   ├── TodaysFocus.tsx (today's habits, primary CTA)
│   ├── WeekView.tsx (navigable week calendar)
│   ├── GoalsPanel.tsx (weekly/monthly goals)
│   ├── QuickTasks.tsx (upcoming tasks)
│   ├── ExpeditionStatus.tsx (active expedition)
│   └── JourneySummary.tsx (sports stats)
```

#### 3.3 State Management
```tsx
// useHomePage.ts - centralized hook
function useHomePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const currentWeek = useMemo(() => /* calculate */, [weekOffset]);

  // Data queries
  const { data: habits } = useQuery(['/api/habits']);
  const { data: tasks } = useQuery(['/api/todos', { week: currentWeek }]);
  const { data: goals } = useQuery(['/api/goals']);
  const { data: pet } = useQuery(['/api/pet']);
  const { data: expedition } = useQuery(['/api/expedition/active']);

  // Mutations
  const completeHabit = useMutation(/* ... */);
  const completeTask = useMutation(/* ... */);

  return {
    weekOffset, setWeekOffset, currentWeek,
    habits, tasks, goals, pet, expedition,
    completeHabit, completeTask,
    // ... dialogs state
  };
}
```

---

### Phase 4: Today's Focus Section

**Priority: P1 - The ADHD brain needs "what's next"**

#### 4.1 Smart Prioritization Algorithm
```tsx
function getTodaysFocus(habits: Habit[], tasks: Todo[], goals: Goal[]) {
  const today = new Date();

  return {
    // Habits due today, sorted by:
    // 1. Streak at risk (hasn't been done, close to breaking)
    // 2. Difficulty (easy first for momentum)
    // 3. Time of day preference
    habits: sortHabitsForToday(habits),

    // Tasks due today or overdue, sorted by:
    // 1. Priority (P1 > P2 > P3 > P4)
    // 2. Due date
    // 3. Has linked goal
    tasks: sortTasksForToday(tasks),

    // The ONE thing to do first
    nextAction: determineNextAction(habits, tasks),
  };
}
```

#### 4.2 Visual Design
```
┌────────────────────────────────────────────────────────────┐
│  TODAY                                      Thu, Dec 4     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  🔥 3 habits to go         ☐ 2 tasks due                  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  ⭐ NEXT UP: Climb                                   │  │
│  │  [Complete] [Skip] [Later]              🔥 15 streak │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  Other habits today:                                       │
│  ○ RemNote        🔥 58    [tap to complete]              │
│  ○ Pimsleur       🔥 7     [tap to complete]              │
│                                                            │
│  Tasks due:                                                │
│  ☐ Buy groceries           P2    [✓] [→]                  │
│  ☐ Call dentist            P3    [✓] [→]                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### Phase 5: Week View Redesign

**Priority: P1 - Make it actually useful**

#### 5.1 Requirements
- [ ] Navigate between weeks (← Today →)
- [ ] Show habits scheduled for each day
- [ ] Show tasks due each day
- [ ] Visual completion status (filled/empty circles)
- [ ] Click day to see details
- [ ] Drag tasks between days to reschedule
- [ ] Add habit/task directly to a day

#### 5.2 Layout Options

**Option A: Horizontal Scroll (Current, but fixed)**
```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Mon │ Tue │ Wed │ THU │ Fri │ Sat │ Sun │
│  30 │   1 │   2 │   3 │   4 │   5 │   6 │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ ●●○ │ ●●● │ ●●● │ ●○○ │     │     │     │
│     │     │     │     │     │     │     │
│ 2   │ 1   │ 0   │ 2   │ 3   │ 0   │ 0   │
│tasks│task │tasks│tasks│tasks│tasks│tasks│
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

**Option B: Vertical List (Better for mobile)**
```
┌────────────────────────────────────────────┐
│ ← Week of Dec 2-8, 2025          Today →   │
├────────────────────────────────────────────┤
│ THU 3 ★ TODAY                              │
│   ○ Gym        ○ RemNote      ○ Pimsleur   │
│   ☐ Buy groceries (P2)                     │
│   ☐ Call dentist (P3)                      │
│   [+ Add]                                  │
├────────────────────────────────────────────┤
│ FRI 4                                      │
│   ○ Gym        ○ RemNote      ○ Pimsleur   │
│   ☐ Submit report (P1)                     │
│   [+ Add]                                  │
├────────────────────────────────────────────┤
│ SAT 5                                      │
│   ○ Gym        ○ RemNote                   │
│   [+ Add]                                  │
└────────────────────────────────────────────┘
```

#### 5.3 Interaction Details
- **Click habit circle**: Toggle complete/incomplete
- **Click task checkbox**: Toggle complete
- **Click "+ Add"**: Opens quick add scoped to that day
- **Drag task**: Reschedule to different day
- **Long press habit**: Open edit dialog
- **Long press task**: Open edit dialog

---

### Phase 6: Goals Panel

**Priority: P2 - Motivation and tracking**

#### 6.1 Unified Goals View
- Show weekly goals with progress
- Show monthly goals with progress
- Link to expedition missions
- Quick update progress inline

#### 6.2 Layout
```
┌────────────────────────────────────────────────────────────┐
│  WEEKLY GOALS                                    [+ Add]   │
├────────────────────────────────────────────────────────────┤
│  ✓ Climb 4x                              4/4 ████████ 100% │
│  ○ Run 15 miles                         8/15 █████░░░  53% │
│  ○ Read 3 chapters                      1/3  ███░░░░░  33% │
├────────────────────────────────────────────────────────────┤
│  MONTHLY GOALS - December                        [+ Add]   │
├────────────────────────────────────────────────────────────┤
│  ○ Ship feature X                      60%  ██████░░░  60% │
│  ○ 20 climbing sessions               12/20 ██████░░░  60% │
└────────────────────────────────────────────────────────────┘
```

#### 6.3 Inline Editing
- Click progress bar to update value
- Click goal text to edit goal
- Swipe left to delete (with confirmation)

---

### Phase 7: Integration Panels

**Priority: P2 - Surface the sports tracking**

#### 7.1 Journey Summary Widget
- Show key stats from cycling/lifting/climbing
- Link to full Journey page
- Auto-refresh from Strava/Kilter

```
┌────────────────────────────────────────────────────────────┐
│  JOURNEY                                      [View All →] │
├────────────────────────────────────────────────────────────┤
│  🚴 CYCLING        🏋️ LIFTING        🧗 CLIMBING          │
│  847 / 1500 mi     42 / 100 workouts  28 / 50 sends       │
│  ████████░░ 56%    ████░░░░░░ 42%     █████████░ 56%      │
└────────────────────────────────────────────────────────────┘
```

#### 7.2 Expedition Status (If Active)
```
┌────────────────────────────────────────────────────────────┐
│  🏔️ EXPEDITION: Mount Rainier                              │
│  Day 3 of 5 | Altitude: 12,400 ft | Progress: 62%         │
│  ███████████████░░░░░░░░░░░                                │
│  [Continue Climb →]                                        │
└────────────────────────────────────────────────────────────┘
```

---

### Phase 8: Pet & Gamification Widget

**Priority: P2 - Emotional engagement**

#### 8.1 Always-Visible Pet Status
```
┌──────────────────────────┐
│  🌱 Sprout               │
│  ████████░░ Happiness    │
│  ███████░░░ Health       │
│                          │
│  ⚡ 415 XP   🪙 120 pts  │
└──────────────────────────┘
```

#### 8.2 Celebration Animations
- Confetti on habit completion
- Pet bounce/dance on streak milestone
- XP flying to total on completion
- Level up modal with fanfare

---

### Phase 9: Empty States & Onboarding

**Priority: P2 - First-time user experience**

#### 9.1 Empty State Messages
```tsx
// When no habits
<EmptyState
  icon={<Sparkles />}
  title="Start your first habit"
  description="Habits are daily actions that build over time. Start with something small!"
  action={<Button onClick={openHabitDialog}>Create Habit</Button>}
/>

// When no tasks
<EmptyState
  icon={<CheckSquare />}
  title="Nothing to do today!"
  description="Add tasks to plan your day, or enjoy the freedom."
  action={<Button onClick={openTaskDialog}>Add Task</Button>}
/>

// When no goals
<EmptyState
  icon={<Target />}
  title="Set a goal"
  description="Goals give direction to your habits and tasks."
  action={<Button onClick={openGoalDialog}>Create Goal</Button>}
/>
```

#### 9.2 First-Run Tutorial
- Highlight Quick Add button
- Show how to complete a habit
- Explain streak system
- Introduce pet

---

### Phase 10: Performance & Polish

**Priority: P3 - Nice to have**

#### 10.1 Optimistic Updates
- All actions update UI immediately
- Background sync with server
- Rollback on error with toast notification

#### 10.2 Loading States
- Skeleton loaders for each section
- Never block the whole page

#### 10.3 Error Handling
- Toast notifications for all errors
- Retry buttons where appropriate
- Offline indicator

#### 10.4 Animations
- Subtle micro-interactions
- Completion celebrations
- Smooth transitions between weeks

---

## Component Inventory

### New Components Needed

| Component | Purpose | Priority |
|-----------|---------|----------|
| `HomePage.tsx` | New unified homepage | P0 |
| `QuickAddCommand.tsx` | Universal quick add (Cmd+K) | P0 |
| `TodaysFocus.tsx` | Today's habits and tasks | P1 |
| `WeekView.tsx` | Navigable week calendar | P1 |
| `HabitQuickComplete.tsx` | Single-tap habit completion | P1 |
| `GoalsPanel.tsx` | Goals with inline editing | P2 |
| `JourneySummary.tsx` | Sports stats widget | P2 |
| `ExpeditionWidget.tsx` | Active expedition status | P2 |
| `PetWidget.tsx` | Pet status display | P2 |
| `EmptyState.tsx` | Reusable empty state | P2 |

### Existing Components to Modify

| Component | Changes Needed |
|-----------|----------------|
| `HabitCreateDialog.tsx` | Add to homepage trigger |
| `GoalDialog.tsx` | Better error handling, toast |
| `TodoDialogEnhanced.tsx` | Natural language shortcuts |
| `useKeyboardShortcuts.ts` | Add homepage shortcuts |

### Components to Delete

| Component | Reason |
|-----------|--------|
| `DashboardV3.tsx` | Replaced by HomePage |
| `DashboardNew.tsx` | Replaced by HomePage |
| `WeeklyPlannerPage.tsx` | Functionality merged into HomePage |
| `V2Dashboard.tsx` | Legacy, unused |

---

## Implementation Order

### Sprint 1: Critical Fixes (Fix what's broken)
1. [ ] Wire up week navigation buttons
2. [ ] Add HabitCreateDialog trigger to homepage
3. [ ] Add edit/delete for habits
4. [ ] Add delete for tasks
5. [ ] Add edit/delete for goals

### Sprint 2: Quick Input (ADHD-friendly capture)
1. [ ] Build QuickAddCommand (Cmd+K)
2. [ ] Implement single-tap habit completion
3. [ ] Add keyboard shortcuts
4. [ ] Add undo for all actions

### Sprint 3: Unified Homepage
1. [ ] Create new HomePage.tsx
2. [ ] Build TodaysFocus component
3. [ ] Build WeekView component (with working navigation!)
4. [ ] Build GoalsPanel component
5. [ ] Update routing to use new HomePage

### Sprint 4: Integration & Polish
1. [ ] Add JourneySummary widget
2. [ ] Add ExpeditionWidget
3. [ ] Add PetWidget to top bar
4. [ ] Implement empty states
5. [ ] Add loading skeletons
6. [ ] Add celebration animations

### Sprint 5: Testing & Cleanup
1. [ ] Delete old dashboard variants
2. [ ] E2E tests for all interactions
3. [ ] Mobile responsiveness pass
4. [ ] Performance optimization
5. [ ] Accessibility audit

---

## Success Metrics

After implementation, the homepage should:

1. **Allow adding habits** in < 3 clicks
2. **Allow completing habits** in 1 click
3. **Allow navigating weeks** with working buttons
4. **Show today's priorities** without scrolling
5. **Surface all major features** without overwhelming
6. **Work on mobile** with touch-friendly targets
7. **Feel satisfying** with animations and feedback
8. **Respect time blindness** with visible clock
9. **Encourage return** with streak visibility and pet

---

## Appendix: ADHD-Friendly Checklist

Before shipping, verify:

- [ ] Can I see the time without scrolling?
- [ ] Is there ONE clear "next action"?
- [ ] Can I complete a habit in one tap?
- [ ] Can I add something with Cmd+K?
- [ ] Are there < 7 visible options at once? (Hick's Law)
- [ ] Is there satisfying feedback on completion?
- [ ] Can I undo any action?
- [ ] Are empty states helpful, not judgmental?
- [ ] Does the pet provide emotional connection?
- [ ] Is the streak visible and motivating?

---

## Questions to Resolve

Before implementation, we should clarify:

1. **Mobile-first or Desktop-first?** The current design assumes desktop, but ADHD users often use phones for quick capture.

2. **Combine with Journey?** Should cycling/lifting/climbing stats be on homepage or keep Journey separate?

3. **Pet prominence?** How prominent should the pet be? Small widget vs. main character?

4. **Week start?** Sunday or Monday? Should this be configurable?

5. **Delete old dashboards immediately?** Or keep as fallback during transition?

---

*Plan created: December 4, 2025*
*Research sources: UX Collective, Lunatask, FocusBear, Zapier, DailyHabits*
