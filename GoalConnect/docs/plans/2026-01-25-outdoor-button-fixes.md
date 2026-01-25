# Outdoor Button Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Fix bugs and code smells found in /pro roast of unified outdoor button implementation.

**Issues to fix:**
1. Dead code - `sourceLabel === "Climbing Log"` condition never matches
2. Redundant cache invalidation in IcyDash.tsx
3. Magic strings - "quick" | "full" type scattered across 4 files
4. No loading state on dropdown button

**Tech Stack:** React, TypeScript, Tailwind CSS

**Production Checklist:**
- [x] Remove dead code
- [x] DRY - centralize type definition
- [x] Add loading state for UX
- [ ] Visual verification after fixes

---

## Task 1: Remove Dead Code - Simplify sourceLabel Check

**Files:**
- Modify: `client/src/components/yearly-goals/CompactGoalCard.tsx:246`

**Problem:** `sourceLabel === "Climbing Log"` never matches because backend only produces "Adventures" for outdoor_days goals.

**Step 1: Simplify the condition**

Change line 246 from:
```tsx
{!goal.isCompleted && onLogOutdoorDay && (goal.sourceLabel === "Climbing Log" || goal.sourceLabel === "Adventures") && (
```

To:
```tsx
{!goal.isCompleted && onLogOutdoorDay && goal.sourceLabel === "Adventures" && (
```

**Step 2: Commit**
```bash
git add client/src/components/yearly-goals/CompactGoalCard.tsx
git commit -m "fix(goals): remove dead 'Climbing Log' sourceLabel check"
```

---

## Task 2: Create Shared Type for OutdoorLogType

**Files:**
- Modify: `client/src/components/yearly-goals/CompactGoalCard.tsx`
- Modify: `client/src/components/yearly-goals/CompactGoalGrid.tsx`
- Modify: `client/src/components/dashboard/YearlyGoalsSection.tsx`
- Modify: `client/src/pages/IcyDash.tsx`

**Step 1: Export type from CompactGoalCard (source of truth)**

At top of CompactGoalCard.tsx (after imports), add:
```tsx
export type OutdoorLogType = "quick" | "full";
```

Update interface to use it:
```tsx
onLogOutdoorDay?: (type: OutdoorLogType) => void;
```

**Step 2: Import type in CompactGoalGrid**

```tsx
import { CompactGoalCard, OutdoorLogType } from "./CompactGoalCard";

// Update interface:
onLogOutdoorDay?: (type: OutdoorLogType) => void;
```

**Step 3: Import type in YearlyGoalsSection**

```tsx
import { CompactGoalGrid } from '@/components/yearly-goals';
import type { OutdoorLogType } from '@/components/yearly-goals/CompactGoalCard';

// Update interface:
onLogOutdoorDay?: (type: OutdoorLogType) => void;
```

**Step 4: Import type in IcyDash**

```tsx
import type { OutdoorLogType } from '@/components/yearly-goals/CompactGoalCard';
```

**Step 5: Commit**
```bash
git add client/src/components/yearly-goals/CompactGoalCard.tsx \
        client/src/components/yearly-goals/CompactGoalGrid.tsx \
        client/src/components/dashboard/YearlyGoalsSection.tsx \
        client/src/pages/IcyDash.tsx
git commit -m "refactor(goals): centralize OutdoorLogType definition"
```

---

## Task 3: Remove Redundant Cache Invalidation

**Files:**
- Modify: `client/src/pages/IcyDash.tsx`

**Problem:** IcyDash manually invalidates yearly-goals after createAdventure, but the useAdventures hook already does this in onSuccess.

**Step 1: Remove redundant invalidation**

Change the adventure modal onSubmit (around line 643-648) from:
```tsx
onSubmit={async (input) => {
  await createAdventure(input);
  setAdventureDialogOpen(false);
  toast({ title: "Adventure logged!", description: "Your outdoor adventure has been recorded" });
  queryClient.invalidateQueries({ queryKey: ['/api/yearly-goals/with-progress'] });
}}
```

To:
```tsx
onSubmit={async (input) => {
  await createAdventure(input);
  setAdventureDialogOpen(false);
  toast({ title: "Adventure logged!", description: "Your outdoor adventure has been recorded" });
}}
```

**Step 2: Commit**
```bash
git add client/src/pages/IcyDash.tsx
git commit -m "fix(dashboard): remove redundant cache invalidation"
```

---

## Task 4: Add Loading State to Dropdown Button

**Files:**
- Modify: `client/src/components/yearly-goals/CompactGoalCard.tsx`
- Modify: `client/src/components/yearly-goals/CompactGoalGrid.tsx`
- Modify: `client/src/components/dashboard/YearlyGoalsSection.tsx`
- Modify: `client/src/pages/IcyDash.tsx`

**Step 1: Add isLoggingOutdoor prop to CompactGoalCard**

Update interface:
```tsx
onLogOutdoorDay?: (type: OutdoorLogType) => void;
isLoggingOutdoor?: boolean;
```

Update destructuring to include `isLoggingOutdoor`.

Update button to be disabled when logging:
```tsx
<button
  onClick={(e) => e.stopPropagation()}
  disabled={isLoggingOutdoor}
  className={cn(
    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium",
    "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30",
    "hover:bg-amber-500/30 transition-colors",
    isLoggingOutdoor && "opacity-50 cursor-not-allowed"
  )}
>
```

**Step 2: Pass through CompactGoalGrid**

Add prop to interface and pass to CompactGoalCard.

**Step 3: Pass through YearlyGoalsSection**

Add prop to interface and pass to CompactGoalGrid.

**Step 4: Wire up in IcyDash**

```tsx
<YearlyGoalsSection
  ...
  onLogOutdoorDay={(type) => {
    if (type === "quick") setClimbingDialogOpen(true);
    else setAdventureDialogOpen(true);
  }}
  isLoggingOutdoor={isQuickLogging || isCreatingAdventure}
/>
```

**Step 5: Commit**
```bash
git add client/src/components/yearly-goals/CompactGoalCard.tsx \
        client/src/components/yearly-goals/CompactGoalGrid.tsx \
        client/src/components/dashboard/YearlyGoalsSection.tsx \
        client/src/pages/IcyDash.tsx
git commit -m "feat(goals): add loading state to outdoor day button"
```

---

## Final Verification

```bash
# Type check
npm run check

# Build
npm run build

# Visual verification
npm run dev
# Check:
# 1. Button shows for "Adventures" sourceLabel goals only
# 2. Button disables during mutation
# 3. No console errors

# Show commits
git log --oneline -5
```

**Expected:** 4 commits, no TypeScript errors, cleaner implementation.
