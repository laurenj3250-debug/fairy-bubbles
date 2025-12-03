# Fix Weekly Planner Page

## Problems Identified (from roast)

1. **No way to create Monthly/Weekly goals** - The `month` and `week` fields exist in schema but no UI to set them
2. **No navigation to /planner** - Page exists but isn't in the nav
3. **7-day grid breaks on mobile** - 7 equal columns are unusable on small screens
4. **"+ add" buttons not functional** - They open TodoDialog without context
5. **Copy-pasted ExpeditionHeader logic** - DRY violation
6. **Empty states show nothing useful** - Just placeholder text

---

## Implementation Plan

### Phase 1: Add Goal Type Selection to GoalDialog

**File:** `client/src/components/GoalDialog.tsx`

Add a "Goal Type" selector at the top of the form with three options:
- **Regular Goal** (default) - No month/week, works like current goals
- **Monthly Goal** - Auto-sets `month` to current month (e.g., "2024-12")
- **Weekly Goal** - Auto-sets `week` to current ISO week (e.g., "2024-W49")

Changes:
1. Add state: `const [goalType, setGoalType] = useState<"regular" | "monthly" | "weekly">("regular")`
2. Add a 3-button selector similar to difficulty/priority selectors
3. In `handleSubmit`, add `month` or `week` to the data based on goalType
4. When "Monthly Goal" selected, auto-set deadline to end of month
5. When "Weekly Goal" selected, auto-set deadline to end of week

### Phase 2: Add Planner to Navigation

**File:** `client/src/components/BottomNav.tsx`

Replace the Journey nav item with Planner (or add as 5th item if space allows):

```tsx
const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/habits", label: "Habits", icon: Mountain },
  { path: "/planner", label: "Planner", icon: Calendar }, // NEW
  { path: "/goals", label: "Goals", icon: Target },
  { path: "/todos", label: "Tasks", icon: CheckSquare },
];
```

Import `Calendar` from lucide-react.

### Phase 3: Make 7-Day Grid Responsive

**File:** `client/src/pages/WeeklyPlannerPage.tsx`

Current (broken):
```tsx
<div className="grid grid-cols-7 gap-2">
```

Fix - horizontal scroll on mobile:
```tsx
<div className="flex md:grid md:grid-cols-7 gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
  {weekDays.map(day => (
    <div className="min-w-[140px] md:min-w-0 snap-start ...">
```

Or alternatively, show 3 days at a time on mobile with swipe navigation.

### Phase 4: Wire Up "+ add" Buttons Properly

**Files:**
- `client/src/pages/WeeklyPlannerPage.tsx`
- `client/src/components/GoalDialog.tsx`

Changes to WeeklyPlannerPage:
1. Add state for goal dialog: `const [goalDialogOpen, setGoalDialogOpen] = useState(false)`
2. Add state for default goal type: `const [defaultGoalType, setDefaultGoalType] = useState<"monthly" | "weekly">("monthly")`
3. Monthly Goals "+ add" button: Opens GoalDialog with `goalType="monthly"` preset
4. Weekly Goals "+ add" button: Opens GoalDialog with `goalType="weekly"` preset
5. Day task "+ add" buttons: Already works (opens TodoDialog with date preset)

Changes to GoalDialog:
1. Add prop: `defaultGoalType?: "regular" | "monthly" | "weekly"`
2. Initialize goalType state from prop

### Phase 5: Extract Shared Expedition Data Hook

**New File:** `client/src/hooks/useExpeditionData.ts`

Extract the duplicated logic from WeeklyHub and WeeklyPlannerPage into a shared hook:

```tsx
export function useExpeditionData() {
  // Fetch habits, habitLogs, climbingStats
  // Calculate seasonProgress, weekProgress, rank
  // Return all computed values

  return {
    seasonProgress,
    weekProgress,
    rank,
    habits,
    habitLogs,
    isLoading,
  };
}
```

Update both WeeklyHub and WeeklyPlannerPage to use this hook.

### Phase 6: Improve Empty States

**File:** `client/src/pages/WeeklyPlannerPage.tsx`

Instead of "No monthly goals set", show:
- An illustration or icon
- A clear call-to-action button
- Brief explanation of what goes here

Example:
```tsx
{monthlyGoals.length === 0 ? (
  <div className="text-center py-6">
    <Target className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
    <p className="text-sm text-muted-foreground mb-3">
      Set your focus for {format(now, "MMMM")}
    </p>
    <button
      onClick={() => { setDefaultGoalType("monthly"); setGoalDialogOpen(true); }}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
    >
      Add Monthly Goal
    </button>
  </div>
) : (...)}
```

---

## Order of Implementation

1. **Phase 1** - Most critical, enables data creation
2. **Phase 4** - Wire up buttons (depends on Phase 1)
3. **Phase 2** - Add navigation
4. **Phase 3** - Fix mobile responsiveness
5. **Phase 6** - Polish empty states
6. **Phase 5** - Code cleanup (optional, can defer)

---

## Files to Modify

| File | Changes |
|------|---------|
| `client/src/components/GoalDialog.tsx` | Add goalType selector, month/week fields |
| `client/src/components/BottomNav.tsx` | Add /planner nav item |
| `client/src/pages/WeeklyPlannerPage.tsx` | Fix mobile grid, wire buttons, improve empty states |
| `client/src/hooks/useExpeditionData.ts` | NEW - shared hook (optional) |

---

## Estimated Complexity

- Phase 1: Medium (GoalDialog is complex, but changes are additive)
- Phase 2: Easy (one line change)
- Phase 3: Easy (CSS changes)
- Phase 4: Medium (state management)
- Phase 5: Medium (refactoring)
- Phase 6: Easy (UI polish)

Total: ~200 lines of changes across 4 files.
