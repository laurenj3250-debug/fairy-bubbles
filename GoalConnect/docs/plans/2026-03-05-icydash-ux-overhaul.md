# IcyDash UX Overhaul Plan

**Date:** 2026-03-05
**Goal:** Transform the dashboard from "information display" to "daily motivation engine"
**Scope:** UX improvements + critical bug fixes (no new features, no new dependencies)
**Guiding Principle:** Answer ONE question: "What should I do right now?"

---

## Phase 1: Critical Bug Fixes (Do First)

These are bugs found during audit that affect correctness.

### 1A. Fix false confetti on habit uncomplete

**File:** `client/src/pages/IcyDash.tsx` line 309
**Bug:** `completedTodayCount + 1` is always +1, even when uncompleting a habit. This triggers "all habits done!" confetti when toggling OFF.
**Fix:**
```typescript
// Line 309 — replace:
const newCompletedCount = completedTodayCount + 1;
// With:
const newCompletedCount = context?.wasCompleted
  ? completedTodayCount - 1
  : completedTodayCount + 1;
```

### 1B. Memoize habit grid transform

**File:** `client/src/pages/IcyDash.tsx` lines 465-475
**Bug:** Creates new array every render, causing unnecessary re-renders of LuxuryHabitGrid.
**Fix:** Wrap in `useMemo` with `[todayHabits, completionMap, week.dates]` deps.

### 1C. Remove redundant variable

**File:** `client/src/pages/IcyDash.tsx` line 361
**What:** `const todayHabits = habits;` — pointless alias. Replace all `todayHabits` with `habits`.

### 1D. Wrap AdventureModal callback in useCallback

**File:** `client/src/pages/IcyDash.tsx` lines 559-579
**What:** Inline `onSubmit` creates new function every render.

---

## Phase 2: Today's Progress Ring (High Impact, Small Effort)

**What:** Add a prominent progress indicator showing "X of Y habits done today" above the habit grid.

**Why:** Users currently have to count dots in the grid to know if they're on track. A progress ring gives instant "am I done?" feedback — the single most requested UX pattern in habit tracker research.

### Implementation

**File:** `client/src/pages/IcyDash.tsx` (render section, line ~458)

Add between the header and habit grid:

```tsx
{/* Today's Progress */}
<div className="flex items-center gap-3 mb-2">
  <div className="relative w-8 h-8">
    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
      <circle cx="18" cy="18" r="15" fill="none" stroke="var(--glass-border)" strokeWidth="2" />
      <circle
        cx="18" cy="18" r="15" fill="none"
        stroke="var(--peach-400)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${(completedTodayCount / habits.length) * 94.2} 94.2`}
        className="transition-all duration-500"
      />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-heading text-peach-400">
      {completedTodayCount}/{habits.length}
    </span>
  </div>
  <div>
    <span className="text-xs font-body text-[var(--text-secondary)]">
      {completedTodayCount === habits.length
        ? "All done today!"
        : `${habits.length - completedTodayCount} habits left`}
    </span>
  </div>
</div>
```

**Dependencies:** None — uses existing `completedTodayCount` and `habits.length`.

---

## Phase 3: Streak Freeze Shield (Tiny Effort, Reduces Anxiety)

**What:** Show available streak freezes next to the streak count in the header.

**Why:** Research shows streak anxiety is the #1 reason users quit habit trackers. Showing "you have a safety net" transforms a fragile metric into a resilient one.

### Implementation

**File:** `client/src/pages/IcyDash.tsx` (header section, line ~443)

**Step 1:** Add query for streak freezes (API already exists at `GET /api/streak-freezes`):
```tsx
const { data: freezeData } = useQuery<{ available: number; used: number }>({
  queryKey: ['/api/streak-freezes'],
});
```

**Step 2:** Update streak display (line 443-446):
```tsx
<div className="text-[var(--text-muted)]">
  <span className="font-heading text-sm text-peach-400">{dayStreak}</span>
  <span className="ml-1 opacity-70">streak</span>
  {freezeData?.available > 0 && (
    <span className="ml-1.5 text-[10px] text-blue-300/70" title="Streak freezes available">
      +{freezeData.available} shield{freezeData.available > 1 ? 's' : ''}
    </span>
  )}
</div>
```

---

## Phase 4: Nearest Yearly Goal Spotlight (Small Effort, High Motivation)

**What:** Surface the 1-2 yearly goals closest to completion near the top of the dashboard, just below the habit grid.

**Why:** Yearly goals are the BIG motivators ("climb 50 mountains") but they're buried at the bottom. Showing "you're 92% to your reading goal!" right after completing habits creates a narrative: daily actions -> big achievements.

### Implementation

**New component:** `client/src/components/dashboard/GoalSpotlight.tsx` (~40 lines)

```tsx
interface GoalSpotlightProps {
  goals: YearlyGoalWithProgress[];
}

export function GoalSpotlight({ goals }: GoalSpotlightProps) {
  // Find top 2 closest-to-completion non-completed goals
  const spotlight = goals
    .filter(g => !g.completed && g.progressPercent > 0)
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 2);

  if (spotlight.length === 0) return null;

  return (
    <div className="flex gap-3">
      {spotlight.map(goal => (
        <div key={goal.id} className="flex-1 glass-card frost-accent !p-3 flex items-center gap-3">
          <div className="relative w-8 h-8 shrink-0">
            {/* Mini progress ring */}
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--glass-border)" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--peach-400)" strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${goal.progressPercent * 0.942} 94.2`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-heading text-peach-400">
              {goal.progressPercent}%
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-body text-[var(--text-secondary)] truncate">{goal.title}</p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {goal.computedValue}/{goal.targetValue}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Placement:** After the habit grid card (line ~483), before the right sidebar.

**Data source:** `yearlyGoals` is already fetched in IcyDash (line 214).

---

## Phase 5: Contextual Greeting + Expedition Narrative (Small Effort, Emotional Hook)

**What:** Replace the static "GOAL CONNECT" logo with a contextual greeting that changes based on:
- Time of day ("Good morning" / "Good afternoon" / "Good evening")
- Active expedition ("Day 14 on Mont Blanc")
- Streak milestone ("2 weeks strong!")

**Why:** Every great habit app creates a "moment" when you open it. Finch greets you with your pet. Habitica shows your quest. Currently IcyDash opens to a static logo — no personal connection.

### Implementation

**File:** `client/src/pages/IcyDash.tsx` (header, line ~424-428)

```tsx
function getDashboardGreeting(streak: number, missionName?: string): string {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (missionName) return `${timeGreeting} — Day ${streak} on ${missionName}`;
  if (streak >= 14) return `${timeGreeting} — ${streak} days strong`;
  if (streak >= 7) return `${timeGreeting} — Week ${Math.floor(streak / 7)} rolling`;
  return timeGreeting;
}
```

Replace the `<h1>` logo with:
```tsx
<div>
  <h1 className="logo-text tracking-wider text-sm">GOAL CONNECT</h1>
  <p className="text-[10px] font-body text-[var(--text-muted)] mt-0.5">
    {getDashboardGreeting(dayStreak, mission?.mountain?.name)}
  </p>
</div>
```

**Data source:** `dayStreak` already computed. `mission` needs to be queried (already available via `/api/expedition-missions/current` — used by CurrentExpeditionWidget).

---

## Phase 6: Habit-to-Expedition Toast Integration (Tiny Effort, Narrative Connection)

**What:** When completing a habit during an active expedition, include expedition context in the XP toast: "Your expedition advanced! Day 8/21 on Mont Blanc"

**Why:** This connects the daily micro-action (check a habit) to the macro-narrative (climbing a mountain). Currently these feel like two separate systems.

### Implementation

**File:** `client/src/pages/IcyDash.tsx` (toggleHabitMutation onSuccess, line ~316-328)

After the existing XP toast, add expedition context:
```tsx
// If expedition is active, mention progress in toast
if (mission && data?.pointsEarned > 0) {
  const expeditionProgress = Math.round((mission.daysCompleted / mission.totalDays) * 100);
  toast({
    title: `Expedition: ${mission.mountain.name}`,
    description: `Day ${mission.currentDay}/${mission.totalDays} — ${expeditionProgress}% complete`,
  });
}
```

**Consideration:** Don't show this every single time — only on expedition milestone days (every 5th day, or when progress crosses 25/50/75%). Otherwise it's noise.

---

## Phase 7: Mobile Sidebar Tabs (Medium Effort, Big Mobile Win)

**What:** On mobile (< md breakpoint), convert the 4 stacked right-sidebar widgets into a horizontally-swipable tabbed container.

**Why:** On mobile, the current layout stacks everything vertically, creating a very long scroll. The 4 sidebar widgets (Media, Adventures, Wellness, Rewards) are all secondary info — users shouldn't have to scroll past all of them to reach weekly/monthly goals.

### Implementation

**New component:** `client/src/components/dashboard/SidebarTabs.tsx` (~60 lines)

```tsx
const tabs = [
  { label: 'Media', component: <MediaWidget /> },
  { label: 'Adventures', component: <RecentAdventuresWidget onLogAdventure={onLogAdventure} /> },
  { label: 'Wellness', component: <WellnessWheelWidget /> },
  { label: 'Rewards', component: <NextRewardWidget /> },
];
```

Use a simple tab bar with horizontal scroll:
```tsx
<div className="md:hidden">
  <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
    {tabs.map((tab, i) => (
      <button key={i} onClick={() => setActive(i)}
        className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap",
          active === i ? "bg-peach-400/20 text-peach-400" : "text-[var(--text-muted)]"
        )}>
        {tab.label}
      </button>
    ))}
  </div>
  {tabs[active].component}
</div>
```

On desktop, keep the current stacked layout unchanged.

**File changes:**
- New: `client/src/components/dashboard/SidebarTabs.tsx`
- Edit: `client/src/pages/IcyDash.tsx` lines 486-498 — wrap in responsive conditional

---

## Execution Order

| Phase | What | Files Changed | Est. Lines | Depends On |
|-------|------|--------------|------------|------------|
| **1** | Bug fixes | IcyDash.tsx | ~20 | Nothing |
| **2** | Today's Progress ring | IcyDash.tsx | ~25 | Phase 1 |
| **3** | Streak freeze shield | IcyDash.tsx | ~15 | Nothing |
| **4** | Goal spotlight | GoalSpotlight.tsx (new), IcyDash.tsx | ~50 | Nothing |
| **5** | Contextual greeting | IcyDash.tsx | ~20 | Nothing |
| **6** | Expedition toast | IcyDash.tsx | ~10 | Nothing |
| **7** | Mobile sidebar tabs | SidebarTabs.tsx (new), IcyDash.tsx | ~70 | Nothing |

Phases 1-6 can be done in a single session (~200 lines of changes).
Phase 7 is independent and can be done separately.

---

## What This Does NOT Include (Future Work)

- Drag-to-reorder widgets (complex, needs DnD library integration)
- Focus mode toggle (needs UI design work)
- AI-powered daily insights ("You tend to skip habits on Wednesdays")
- Migration system overhaul (separate project, see 2026-03-05 discussion)
- The 55 code-quality issues found in the widget audit (tracked separately)

---

## Verification Plan

After each phase:
1. Start dev server (`PORT=5002 npm run dev`)
2. Login as Lauren
3. Check the specific change visually
4. Test on mobile viewport (375px)
5. Verify no TypeScript errors (`npx tsc --noEmit`)

After all phases:
1. Full CRUD test of habits (toggle on/off, verify confetti logic)
2. Verify streak display with freeze count
3. Verify goal spotlight shows correct nearest goals
4. Verify greeting changes by time of day
5. Test mobile tab switching
6. Run `npm run build` for production build check
