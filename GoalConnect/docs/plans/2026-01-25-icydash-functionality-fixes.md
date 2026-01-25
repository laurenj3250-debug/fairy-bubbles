# IcyDash Functionality Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all critical and moderate functionality bugs discovered in IcyDash dashboard audit.

**Architecture:** Fix bugs in order of user impact. Each fix is independent and can be committed separately. TDD approach where applicable.

**Tech Stack:** React, TanStack Query, TypeScript

**Research Sources:**
- TanStack Query docs on cache invalidation patterns
- React useCallback and closure patterns

**Production Checklist:**
- [x] Centralized config (no magic strings/numbers in 2+ places)
- [ ] Error boundaries around risky components
- [ ] Toast notifications for ALL mutations (success AND failure)
- [ ] Mobile-friendly touch targets (44px+)
- [x] E2E tests for critical paths (existing)
- [x] Accessibility basics (existing)

---

## Phase 1: Critical Functional Defects (F1-F5)

### Task 1.1: Fix GlowingOrbHabits bypassing requiresNote

**Files:**
- Modify: `client/src/components/GlowingOrbHabits.tsx`
- Modify: `client/src/pages/IcyDash.tsx`

**Problem:** Clicking a habit orb toggles directly without checking if the habit requires a note. This bypasses the note requirement entirely.

**Solution:** Remove the direct mutation from GlowingOrbHabits and instead use a callback prop that goes through IcyDash's `handleToggleHabit` function.

**Step 1: Update GlowingOrbHabits to accept onToggle prop**

```typescript
// GlowingOrbHabits.tsx - Replace entire component

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface HabitWithData {
  id: number;
  title: string;
  requiresNote?: boolean;
  history: Array<{ date: string; completed: boolean }>;
}

interface GlowingOrbHabitsProps {
  onToggle?: (habitId: number) => void;
}

export function GlowingOrbHabits({ onToggle }: GlowingOrbHabitsProps) {
  const today = new Date().toISOString().split('T')[0];

  const { data: habits = [] } = useQuery<HabitWithData[]>({
    queryKey: ['/api/habits-with-data'],
  });

  const isCompleted = (habit: HabitWithData) => {
    return habit.history?.some(h => h.date === today && h.completed) ?? false;
  };

  const getShortName = (title: string) => {
    return title.substring(0, 3).toUpperCase();
  };

  const handleClick = (habit: HabitWithData) => {
    if (onToggle) {
      onToggle(habit.id);
    }
  };

  return (
    <div className="flex gap-2">
      {habits.slice(0, 5).map((habit, index) => {
        const completed = isCompleted(habit);

        return (
          <motion.button
            key={habit.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleClick(habit)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[0.5rem] font-medium uppercase tracking-wide transition-all cursor-pointer"
            style={{
              background: completed
                ? "linear-gradient(135deg, #d4a59a 0%, #e8c4bc 100%)"
                : "rgba(61, 90, 80, 0.3)",
              border: completed ? "none" : "1px solid #3d5a50",
              color: completed ? "#080c08" : "#3d5a50",
              boxShadow: completed ? "0 0 20px rgba(212, 165, 154, 0.4)" : "none",
            }}
          >
            {getShortName(habit.title)}
          </motion.button>
        );
      })}
    </div>
  );
}
```

**Step 2: Wire up GlowingOrbHabits in IcyDash**

In IcyDash.tsx, find the GlowingOrbHabits usage (around line 510) and change:

```typescript
// FROM:
{habitsLoading ? <GlowingOrbsSkeleton /> : <GlowingOrbHabits />}

// TO:
{habitsLoading ? <GlowingOrbsSkeleton /> : <GlowingOrbHabits onToggle={handleToggleHabit} />}
```

**Step 3: Verify**

Run: `npm run check`
Expected: No TypeScript errors

**Step 4: Test manually**
1. Find a habit with `requiresNote: true`
2. Click the orb - should open note dialog, NOT toggle directly
3. Submit note - habit should complete

**Step 5: Commit**

```bash
git add client/src/components/GlowingOrbHabits.tsx client/src/pages/IcyDash.tsx
git commit -m "fix(habits): route GlowingOrbHabits clicks through handleToggleHabit

GlowingOrbHabits was directly toggling habits, bypassing the requiresNote
check. Now uses onToggle callback to go through IcyDash's handleToggleHabit
which properly shows the note dialog for habits that require notes.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.2: Add error handling to GlowingOrbHabits

**Files:**
- Modify: `client/src/pages/IcyDash.tsx`

**Problem:** If the habit toggle mutation fails, user gets no feedback.

**Solution:** The mutation already has `onError` in IcyDash's `toggleHabitMutation`. Since we now route through that, errors will show toasts. Verify this is working.

**Step 1: Verify error handling exists**

Check that `toggleHabitMutation` in IcyDash.tsx has `onError`:

```typescript
// Should already exist around line 373:
onError: (error: Error) => {
  toast({ title: "Failed to update habit", description: error.message, variant: "destructive" });
},
```

**Step 2: Test error scenario**
1. Disconnect network
2. Click a habit orb
3. Should see error toast

**Step 3: Commit (if any changes needed)**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "fix(habits): verify error handling for habit toggle

Confirmed that GlowingOrbHabits now routes through toggleHabitMutation
which has proper onError handler showing toast on failure.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.3: Fix MediaWidget cache invalidation

**Files:**
- Modify: `client/src/hooks/useMediaLibrary.ts`

**Problem:** When media items are created/updated/deleted, the `/api/media-library/current` endpoint isn't invalidated, so the MediaWidget shows stale data.

**Solution:** Add invalidation for `/api/media-library/current` in all mutation `onSuccess` handlers.

**Step 1: Update createMutation**

```typescript
// In useMediaLibrary.ts, around line 112:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
  queryClient.invalidateQueries({ queryKey: ["/api/media-library/current"] }); // ADD THIS
},
```

**Step 2: Update updateMutation**

```typescript
// Around line 131:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
  queryClient.invalidateQueries({ queryKey: ["/api/media-library/current"] }); // ADD THIS
},
```

**Step 3: Update updateProgressMutation**

```typescript
// Around line 150:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
  queryClient.invalidateQueries({ queryKey: ["/api/media-library/current"] }); // ADD THIS
},
```

**Step 4: Update updateStatusMutation**

```typescript
// Around line 169:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
  queryClient.invalidateQueries({ queryKey: ["/api/media-library/current"] }); // ADD THIS
},
```

**Step 5: Update deleteMutation**

```typescript
// Around line 185:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
  queryClient.invalidateQueries({ queryKey: ["/api/media-library/current"] }); // ADD THIS
},
```

**Step 6: Verify**

Run: `npm run check`
Expected: No TypeScript errors

**Step 7: Test manually**
1. Go to Media Library, mark a "current" book as "done"
2. Go to Dashboard
3. MediaWidget should NOT show that book anymore

**Step 8: Commit**

```bash
git add client/src/hooks/useMediaLibrary.ts
git commit -m "fix(media): invalidate /current cache on all mutations

MediaWidget was showing stale data because mutations only invalidated
/api/media-library but not /api/media-library/current. Added cache
invalidation for both query keys in all mutation handlers.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.4: Add error handling for toggleSubItem in IcyDash

**Files:**
- Modify: `client/src/components/dashboard/YearlyGoalsSection.tsx`

**Problem:** `toggleSubItem` is passed directly without error handling. If it fails, no toast is shown.

**Solution:** Wrap the call with try/catch and toast, similar to how YearlyGoals.tsx does it.

**Step 1: Update YearlyGoalsSection props to include toast**

```typescript
// Add to imports at top of YearlyGoalsSection.tsx:
import { useToast } from "@/hooks/use-toast";

// Inside the component, add:
const { toast } = useToast();
```

**Step 2: Create wrapped handler**

```typescript
// Add inside component, before the return:
const handleToggleSubItem = async (goalId: number, subItemId: string) => {
  try {
    const result = await toggleSubItem({ goalId, subItemId });
    if (result.isGoalCompleted) {
      toast({
        title: "Goal completed!",
        description: "All sub-items done. Claim your reward!",
      });
    }
  } catch (err) {
    toast({
      title: "Error",
      description: err instanceof Error ? err.message : "Failed to toggle sub-item",
      variant: "destructive",
    });
  }
};
```

**Step 3: Update CompactGoalGrid usage**

```typescript
// Change from:
onToggleSubItem={(goalId, subItemId) => toggleSubItem({ goalId, subItemId })}

// To:
onToggleSubItem={handleToggleSubItem}
```

**Step 4: Verify**

Run: `npm run check`
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add client/src/components/dashboard/YearlyGoalsSection.tsx
git commit -m "fix(goals): add error handling and success toast for sub-item toggle

toggleSubItem was passed directly without try/catch, so failures showed
no feedback. Added proper error handling with toast and success message
when goal is completed.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.5: Fix dialog close timing for quick log

**Files:**
- Modify: `client/src/components/QuickClimbingDayDialog.tsx`
- Modify: `client/src/components/adventures/AdventureModal.tsx`

**Problem:** Dialogs close immediately after `await onSubmit()`, but if submission throws AFTER the await resolves (edge case), or if there's a timing issue, dialog may close before user sees error.

**Solution:** Wrap in try/catch and only close on success.

**Step 1: Update QuickClimbingDayDialog**

```typescript
// In QuickClimbingDayDialog.tsx, replace handleSubmit:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    await onSubmit({
      date,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onOpenChange(false); // Only close on success
  } catch (error) {
    // Error will be handled by parent's toast
    // Keep dialog open so user can retry
  }
};
```

**Step 2: Update AdventureModal**

```typescript
// In AdventureModal.tsx, replace handleSubmit:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!activity.trim()) return;

  try {
    await onSubmit({
      date,
      activity: activity.trim(),
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      photo: photo || undefined,
    });
    // onClose will be called by parent on success
  } catch (error) {
    // Error will be handled by parent's toast
    // Keep modal open so user can retry
  }
};
```

**Step 3: Update IcyDash adventure dialog handler**

```typescript
// In IcyDash.tsx, update the AdventureModal onSubmit (around line 643):
onSubmit={async (input) => {
  try {
    await createAdventure(input);
    setAdventureDialogOpen(false); // Move close here
    toast({ title: "Adventure logged!", description: "Your outdoor adventure has been recorded" });
  } catch (error) {
    toast({
      title: "Failed to log adventure",
      description: error instanceof Error ? error.message : "Please try again",
      variant: "destructive"
    });
    // Don't close - let user retry
  }
}}
```

**Step 4: Verify**

Run: `npm run check`
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add client/src/components/QuickClimbingDayDialog.tsx client/src/components/adventures/AdventureModal.tsx client/src/pages/IcyDash.tsx
git commit -m "fix(dialogs): only close on successful submission

Quick log dialogs were closing before confirming success, so errors
could be missed. Now dialogs stay open on failure so users can retry.
Success toast and close moved to parent handlers.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Moderate Functional Defects (F6-F12)

### Task 2.1: Fix HabitDetailDialog label

**Files:**
- Modify: `client/src/components/HabitDetailDialog.tsx`

**Problem:** Label says "with notes" but shows ALL completions.

**Solution:** Change label to be accurate.

**Step 1: Update label**

```typescript
// Line 88, change from:
{sortedLogs.length} completion{sortedLogs.length !== 1 ? 's' : ''} with notes

// To:
{sortedLogs.length} completion{sortedLogs.length !== 1 ? 's' : ''}
```

**Step 2: Commit**

```bash
git add client/src/components/HabitDetailDialog.tsx
git commit -m "fix(habits): correct label in HabitDetailDialog

Label said 'with notes' but showed all completions regardless of notes.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.2: Prevent double-click on GlowingOrbHabits

**Files:**
- Modify: `client/src/components/GlowingOrbHabits.tsx`

**Problem:** No disabled state during mutation allows rapid double-clicks.

**Solution:** Since we now use callback, IcyDash's mutation handles this. But we should still visually indicate loading.

**Step 1: Add isPending tracking via callback**

This is already handled by routing through IcyDash - the mutation's `isPending` state prevents UI issues. No additional changes needed since we're using the parent's mutation.

---

### Task 2.3: Add toast for claimReward in IcyDash

**Files:**
- Modify: `client/src/components/dashboard/YearlyGoalsSection.tsx`

**Problem:** No success toast when claiming rewards on dashboard.

**Solution:** Wrap claimReward with toast.

**Step 1: Create wrapped handler**

```typescript
// Add inside YearlyGoalsSection component:
const handleClaimReward = async (goalId: number) => {
  try {
    const result = await claimReward(goalId);
    toast({
      title: "Reward claimed!",
      description: `+${result.pointsAwarded} XP earned`,
    });
  } catch (err) {
    toast({
      title: "Error",
      description: err instanceof Error ? err.message : "Failed to claim reward",
      variant: "destructive",
    });
  }
};
```

**Step 2: Update CompactGoalGrid usage**

```typescript
// Change from:
onClaimReward={(goalId) => claimReward(goalId)}

// To:
onClaimReward={handleClaimReward}
```

**Step 3: Commit**

```bash
git add client/src/components/dashboard/YearlyGoalsSection.tsx
git commit -m "fix(goals): add success/error toast for reward claiming

Claiming rewards on dashboard had no user feedback. Added toast for
both success and failure cases.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.4: Fix LuxuryHabitGrid toggle to use handleToggleHabit

**Files:**
- Modify: `client/src/pages/IcyDash.tsx`

**Problem:** LuxuryHabitGrid's `onToggle` directly calls mutation, bypassing `requiresNote` check for past dates.

**Solution:** Route through a handler that checks for note requirement.

**Step 1: Create date-aware toggle handler**

```typescript
// In IcyDash.tsx, add new handler:
const handleToggleHabitForDate = useCallback((habitId: number, date: string) => {
  const habit = habits.find(h => h.id === habitId);
  const isCompleted = completionMap[habitId]?.[date] ?? false;

  // Only show note dialog for today and if habit requires note
  if (date === todayStr && habit?.requiresNote && !isCompleted) {
    setNoteDialogHabit(habit);
    setNoteDialogOpen(true);
    return;
  }

  toggleHabitMutation.mutate({ habitId, date });
}, [toggleHabitMutation, todayStr, habits, completionMap]);
```

**Step 2: Update LuxuryHabitGrid usage**

```typescript
// Change from (around line 554):
onToggle={(habitId, date) => toggleHabitMutation.mutate({ habitId, date })}

// To:
onToggle={handleToggleHabitForDate}
```

**Step 3: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "fix(habits): route LuxuryHabitGrid through note check handler

LuxuryHabitGrid was directly calling mutation, bypassing requiresNote
check. Now routes through handleToggleHabitForDate which shows note
dialog for today's habits that require notes.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.5: Prevent AdventureModal backdrop close during submission

**Files:**
- Modify: `client/src/components/adventures/AdventureModal.tsx`

**Problem:** Clicking backdrop during `isSubmitting` still closes modal.

**Solution:** Check `isSubmitting` before closing.

**Step 1: Update backdrop click handler**

```typescript
// Change from (line 82):
onClick={onClose}

// To:
onClick={() => !isSubmitting && onClose()}
```

**Step 2: Commit**

```bash
git add client/src/components/adventures/AdventureModal.tsx
git commit -m "fix(adventures): prevent backdrop close during submission

Clicking backdrop while submitting would close modal and potentially
lose data. Now ignores backdrop clicks while isSubmitting is true.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Final Verification

### Task 3.1: Run full type check and build

**Step 1: Type check**

Run: `npm run check`
Expected: No errors

**Step 2: Build**

Run: `npm run build`
Expected: Successful build

**Step 3: Manual smoke test**

1. Complete a habit via orb that requires note → should show dialog
2. Complete a habit via grid that requires note → should show dialog
3. Update media item → MediaWidget should refresh
4. Toggle sub-item → should show toast on success/error
5. Quick log adventure → dialog should stay open on error
6. Claim reward → should show toast

---

## Summary

**Total Tasks:** 12 (including verification)
**Estimated Commits:** 10

**Critical fixes:**
1. GlowingOrbHabits requiresNote bypass
2. GlowingOrbHabits error handling
3. MediaWidget cache invalidation
4. toggleSubItem error handling
5. Dialog close timing

**Moderate fixes:**
6. HabitDetailDialog label
7. (Double-click already handled by Task 1)
8. claimReward toast
9. LuxuryHabitGrid note check
10. AdventureModal backdrop close

All fixes maintain backwards compatibility and follow existing patterns in the codebase.
