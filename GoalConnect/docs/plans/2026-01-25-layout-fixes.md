# IcyDash Layout Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Fix visual overlap bug in dashboard and add quick-add adventure button to relevant goal cards.

**Architecture:** Two bug fixes (CSS changes) + one small feature (add button to CompactGoalCard following existing onLogClimb pattern).

**Tech Stack:** React, TypeScript, Tailwind CSS

**Production Checklist:**
- [x] Centralized config (no new magic strings)
- [x] Error boundaries (not needed - CSS fixes)
- [x] Skeleton loading states (existing)
- [x] Toast notifications (existing pattern for adventure creation)
- [x] Mobile-friendly touch targets (44px+ - will verify)
- [ ] Visual verification after fixes

---

## Phase 1: Bug Fixes

### Task 1.1: Fix MediaWidget Height Causing Visual Overlap

**Files:**
- Modify: `client/src/components/MediaWidget.tsx:43`

**Problem:** `h-full` class makes MediaWidget stretch to fill parent container, causing MilestoneDonutWidget to visually overlap GoalsDeadlinesWidget.

**Step 1: Remove h-full from outer div**

Change line 43 from:
```tsx
<div className="glass-card frost-accent h-full flex flex-col">
```

To:
```tsx
<div className="glass-card frost-accent flex flex-col">
```

**Step 2: Remove flex-1 from empty state container**

Change line 67 from:
```tsx
<div className="flex-1 flex flex-col items-center justify-center py-8">
```

To:
```tsx
<div className="flex flex-col items-center justify-center py-6">
```

**Step 3: Verify visually**
- Run `npm run dev`
- Check dashboard at localhost:5173
- Confirm: MediaWidget no longer stretches
- Confirm: MilestoneDonutWidget no longer overlaps GoalsDeadlinesWidget

**Step 4: Commit**
```bash
git add client/src/components/MediaWidget.tsx
git commit -m "fix(ui): remove h-full from MediaWidget to fix visual overlap"
```

---

## Phase 2: Adventure Linking Feature

### Task 2.1: Add onLogAdventure Prop to CompactGoalCard

**Files:**
- Modify: `client/src/components/yearly-goals/CompactGoalCard.tsx:56-57, 69-70, 242-259`

**Step 1: Add the prop to interface**

After line 56 (`onLogClimb?: () => void;`), add:
```tsx
onLogAdventure?: () => void;
```

**Step 2: Destructure the prop**

In the component function parameters (around line 69), add `onLogAdventure` to destructuring:
```tsx
onLogClimb,
onLogAdventure,
```

**Step 3: Add button for Adventures source**

After the existing `onLogClimb` button block (around line 257), add:
```tsx
{goal.sourceLabel === "Adventures" && onLogAdventure && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onLogAdventure();
    }}
    className={cn(
      "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium",
      "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30",
      "hover:bg-amber-500/30 transition-colors"
    )}
  >
    <Mountain className="w-3.5 h-3.5" />
    Log adventure
  </button>
)}
```

**Step 4: Verify Mountain icon is imported**

Check line 2 - Mountain should already be imported from lucide-react.

**Step 5: Commit**
```bash
git add client/src/components/yearly-goals/CompactGoalCard.tsx
git commit -m "feat(goals): add onLogAdventure button for Adventure-tracked goals"
```

---

### Task 2.2: Wire Up onLogAdventure in IcyDash

**Files:**
- Modify: `client/src/pages/IcyDash.tsx`

**Step 1: Add state for adventure dialog**

After line 257 (`const [climbingDialogOpen, setClimbingDialogOpen] = useState(false);`), add:
```tsx
const [adventureDialogOpen, setAdventureDialogOpen] = useState(false);
```

**Step 2: Pass onLogAdventure to YearlyGoalsSection**

Around line 590, after `onLogClimb={() => setClimbingDialogOpen(true)}`, add:
```tsx
onLogAdventure={() => setAdventureDialogOpen(true)}
```

**Step 3: Import and add AdventureModal**

Check if AdventureModal is already imported. If not, add to imports:
```tsx
import { AdventureModal } from '@/components/adventures/AdventureModal';
```

Also need to import useAdventures hook:
```tsx
import { useAdventures } from '@/hooks/useAdventures';
```

**Step 4: Add the adventure modal and create handler**

After the QuickClimbingDayDialog (around line 624), add:
```tsx
{/* Quick Adventure Dialog */}
{adventureDialogOpen && (
  <AdventureModal
    adventure={null}
    onClose={() => setAdventureDialogOpen(false)}
    onSubmit={async (input) => {
      await createAdventure(input);
      setAdventureDialogOpen(false);
      toast({ title: "Adventure logged!", description: "Your outdoor adventure has been recorded" });
      queryClient.invalidateQueries({ queryKey: ['/api/yearly-goals/with-progress'] });
    }}
    isSubmitting={isCreatingAdventure}
  />
)}
```

**Step 5: Add useAdventures hook call**

After the useClimbingLog hook (around line 328), add:
```tsx
const { createAdventure, isCreating: isCreatingAdventure } = useAdventures({
  year: currentYear,
  limit: 1
});
```

**Step 6: Commit**
```bash
git add client/src/pages/IcyDash.tsx
git commit -m "feat(dashboard): wire up adventure logging from goal cards"
```

---

### Task 2.3: Pass onLogAdventure Through YearlyGoalsSection

**Files:**
- Modify: `client/src/components/dashboard/YearlyGoalsSection.tsx`

**Step 1: Add prop to interface**

After line 26 (`onLogClimb: () => void;`), add:
```tsx
onLogAdventure?: () => void;
```

**Step 2: Destructure the prop**

In the component function (around line 41), add `onLogAdventure` to destructuring.

**Step 3: Pass to CompactGoalGrid**

In the CompactGoalGrid component (around line 89), add:
```tsx
onLogAdventure={onLogAdventure}
```

**Step 4: Commit**
```bash
git add client/src/components/dashboard/YearlyGoalsSection.tsx
git commit -m "feat(goals): pass onLogAdventure through YearlyGoalsSection"
```

---

### Task 2.4: Pass onLogAdventure Through CompactGoalGrid

**Files:**
- Modify: `client/src/components/yearly-goals/CompactGoalGrid.tsx`

**Step 1: Check if the prop needs to be added**

Read the file to see current props interface.

**Step 2: Add prop to interface and pass to CompactGoalCard**

Add `onLogAdventure?: () => void;` to props interface and pass through to each CompactGoalCard.

**Step 3: Commit**
```bash
git add client/src/components/yearly-goals/CompactGoalGrid.tsx
git commit -m "feat(goals): pass onLogAdventure through CompactGoalGrid"
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
# 1. MediaWidget no longer causes overlap
# 2. MilestoneDonutWidget displays correctly
# 3. "Log adventure" button appears on outdoor_days goals
# 4. Clicking button opens AdventureModal
# 5. Creating adventure closes modal and shows toast

# Show commits
git log --oneline -5
```

**Expected:** 5 commits total, no TypeScript errors, visual issues resolved.
