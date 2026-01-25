# Unified "Log Outdoor Day" Button Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Replace separate "Log climb" and "Log adventure" buttons with a single unified "Log outdoor day" button that shows a chooser menu.

**Architecture:** Single button with dropdown menu. Two options: "Quick log" opens QuickClimbingDayDialog, "Full adventure" opens AdventureModal. Button visible for goals with sourceLabel "Climbing Log" OR "Adventures".

**Tech Stack:** React, TypeScript, Tailwind CSS, Radix DropdownMenu

**Production Checklist:**
- [x] Centralized config (no new magic strings)
- [x] Error boundaries (not needed - UI enhancement)
- [x] Skeleton loading states (existing)
- [x] Toast notifications (existing pattern)
- [x] Mobile-friendly touch targets (44px+ menu items)
- [ ] Visual verification after changes

---

## Phase 1: Simplify Props

### Task 1.1: Consolidate Callbacks to Single onLogOutdoorDay

**Files:**
- Modify: `client/src/components/yearly-goals/CompactGoalCard.tsx`

**Problem:** Currently has separate `onLogClimb` and `onLogAdventure` props. Need single callback that receives choice.

**Step 1: Update props interface**

Change lines 55-57 from:
```tsx
// Auto goal action callbacks
onLogClimb?: () => void;
onLogAdventure?: () => void;
```

To:
```tsx
// Outdoor day logging callback - receives "quick" or "full"
onLogOutdoorDay?: (type: "quick" | "full") => void;
```

**Step 2: Update destructuring**

Change lines 70-71 from:
```tsx
onLogClimb,
onLogAdventure,
```

To:
```tsx
onLogOutdoorDay,
```

**Step 3: Commit**
```bash
git add client/src/components/yearly-goals/CompactGoalCard.tsx
git commit -m "refactor(goals): consolidate outdoor logging callbacks into single prop"
```

---

### Task 1.2: Update CompactGoalGrid Props

**Files:**
- Modify: `client/src/components/yearly-goals/CompactGoalGrid.tsx`

**Step 1: Update interface**

Change lines 14-16 from:
```tsx
// Auto goal action callbacks
onLogClimb?: () => void;
onLogAdventure?: () => void;
```

To:
```tsx
// Outdoor day logging callback - receives "quick" or "full"
onLogOutdoorDay?: (type: "quick" | "full") => void;
```

**Step 2: Update destructuring and passing**

Change lines 29-30 from:
```tsx
onLogClimb,
onLogAdventure,
```

To:
```tsx
onLogOutdoorDay,
```

Change lines 50-51 from:
```tsx
onLogClimb={onLogClimb}
onLogAdventure={onLogAdventure}
```

To:
```tsx
onLogOutdoorDay={onLogOutdoorDay}
```

**Step 3: Commit**
```bash
git add client/src/components/yearly-goals/CompactGoalGrid.tsx
git commit -m "refactor(goals): update CompactGoalGrid to use consolidated callback"
```

---

### Task 1.3: Update YearlyGoalsSection Props

**Files:**
- Modify: `client/src/components/dashboard/YearlyGoalsSection.tsx`

**Step 1: Update interface**

Change lines 26-27 from:
```tsx
onLogClimb: () => void;
onLogAdventure?: () => void;
```

To:
```tsx
onLogOutdoorDay?: (type: "quick" | "full") => void;
```

**Step 2: Update destructuring**

Change lines 42-43 from:
```tsx
onLogClimb,
onLogAdventure,
```

To:
```tsx
onLogOutdoorDay,
```

**Step 3: Update CompactGoalGrid call**

Change lines 91-92 from:
```tsx
onLogClimb={onLogClimb}
onLogAdventure={onLogAdventure}
```

To:
```tsx
onLogOutdoorDay={onLogOutdoorDay}
```

**Step 4: Commit**
```bash
git add client/src/components/dashboard/YearlyGoalsSection.tsx
git commit -m "refactor(goals): update YearlyGoalsSection to use consolidated callback"
```

---

### Task 1.4: Update IcyDash to Use New Callback

**Files:**
- Modify: `client/src/pages/IcyDash.tsx`

**Step 1: Replace the two callback props**

Change lines 599-600 from:
```tsx
onLogClimb={() => setClimbingDialogOpen(true)}
onLogAdventure={() => setAdventureDialogOpen(true)}
```

To:
```tsx
onLogOutdoorDay={(type) => {
  if (type === "quick") setClimbingDialogOpen(true);
  else setAdventureDialogOpen(true);
}}
```

**Step 2: Commit**
```bash
git add client/src/pages/IcyDash.tsx
git commit -m "refactor(dashboard): use consolidated onLogOutdoorDay callback"
```

---

## Phase 2: Implement Unified Button with Dropdown

### Task 2.1: Replace Separate Buttons with Dropdown Menu

**Files:**
- Modify: `client/src/components/yearly-goals/CompactGoalCard.tsx`

**Step 1: Add imports for DropdownMenu**

After line 2, add:
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

**Step 2: Replace the two separate button blocks**

Delete lines 241-276 (the entire `{/* Action buttons for auto-tracked goals */}` section) and replace with:

```tsx
{/* Action button for outdoor day goals */}
{!goal.isCompleted && onLogOutdoorDay && (goal.sourceLabel === "Climbing Log" || goal.sourceLabel === "Adventures") && (
  <div className="flex items-center gap-2 mb-2">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium",
            "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30",
            "hover:bg-amber-500/30 transition-colors"
          )}
        >
          <Mountain className="w-3.5 h-3.5" />
          Log outdoor day
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onLogOutdoorDay("quick");
          }}
          className="cursor-pointer"
        >
          <Zap className="w-4 h-4 mr-2 text-sky-400" />
          Quick log
          <span className="ml-auto text-[10px] text-[var(--text-muted)]">date + notes</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onLogOutdoorDay("full");
          }}
          className="cursor-pointer"
        >
          <Mountain className="w-4 h-4 mr-2 text-amber-400" />
          Full adventure
          <span className="ml-auto text-[10px] text-[var(--text-muted)]">+ photos</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)}
```

**Step 3: Commit**
```bash
git add client/src/components/yearly-goals/CompactGoalCard.tsx
git commit -m "feat(goals): unified 'Log outdoor day' dropdown button"
```

---

## Final Verification

After all tasks complete:

```bash
# Type check
npm run check

# Build verification
npm run build

# Visual verification
npm run dev
# Check:
# 1. Goals with sourceLabel "Climbing Log" show "Log outdoor day" button
# 2. Goals with sourceLabel "Adventures" show "Log outdoor day" button
# 3. Clicking button shows dropdown with two options
# 4. "Quick log" opens QuickClimbingDayDialog
# 5. "Full adventure" opens AdventureModal
# 6. Both work and update the goal progress

# Show commits
git log --oneline -5
```

**Expected:** 5 commits total, no TypeScript errors, unified button works for both goal types.
