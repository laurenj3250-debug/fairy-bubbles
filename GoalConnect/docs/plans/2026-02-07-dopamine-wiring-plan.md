# Dopamine Wiring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up 12+ orphaned dopamine components (sounds, animations, confetti, critical hits) into the live app, fix silent XP feedback loops, and polish the points UI.

**Architecture:** All components already exist and are fully implemented — this plan exclusively wires existing code into the running app. Changes split across 3 layers: (1) server routes return `pointsEarned` in responses, (2) client mutations invalidate points caches and show toasts, (3) UI components (TokenCounter, CriticalHit, sounds) are imported and rendered.

**Tech Stack:** React 18, Framer Motion, Web Audio API, TanStack Query, canvas-confetti, Wouter

**Production Checklist:**
- [x] Centralized config (XP_CONFIG already exists at shared/xp-config.ts)
- [ ] Error boundaries around CriticalHit overlay (pointer-events-none, auto-dismiss)
- [ ] Toast notifications for all new XP sources
- [ ] Cache invalidation for /api/points on every XP-earning mutation
- [ ] Mobile-friendly touch targets (44px+ on MediaWidget Done button)
- [ ] Sound graceful degradation (Web Audio API resume on user gesture)

---

## Phase 1: Habit Completion Feel (Sound + Haptic)

### Task 1: Wire sound + haptic into habit toggle

**Files:**
- Modify: `client/src/pages/IcyDash.tsx:380-393` (toggleHabitMutation.onSuccess)

**Context:** `LuxuryHabitGrid` calls `onToggle` → `handleToggleHabitForDate` → `toggleHabitMutation`. The `onSuccess` callback at line 380 already checks `!context?.wasCompleted` for completion direction. Sound/haptic should fire here, NOT inside LuxuryHabitGrid (which is a pure presentational component).

**Step 1: Add imports to IcyDash.tsx**

At the top of IcyDash.tsx, add after the existing imports (around line 17):

```typescript
import { playCompleteSound, triggerHaptic } from '@/lib/sounds';
```

**Step 2: Add sound + haptic to onSuccess**

In `toggleHabitMutation.onSuccess` (line 380), add sound/haptic immediately after the `if (!context?.wasCompleted)` check, BEFORE the confetti and toast logic:

```typescript
onSuccess: (data: any, _, context) => {
  // Only celebrate if completing (not uncompleting)
  if (!context?.wasCompleted) {
    // Immediate tactile + audio feedback
    playCompleteSound();
    triggerHaptic('light');

    // ... existing confetti and toast code stays unchanged
```

**Step 3: Verify build**

```bash
cd /Users/laurenjohnston/fairy-bubbles/GoalConnect && npm run check
```

**Step 4: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "feat: wire sound + haptic into habit completion"
```

---

## Phase 2: Animated XP Counter in Header

### Task 2: Replace plain XP text with TokenCounter

**Files:**
- Modify: `client/src/pages/IcyDash.tsx:559-564` (header XP display)
- Modify: `client/src/components/TokenCounter.tsx:57-58` (navigate target)

**Context:** Currently the header shows plain text: `<span className="font-heading text-sm text-peach-400">{xp.toLocaleString()}</span>`. The `TokenCounter` component (already built) has animated floating "+N" numbers, coin bounce, and glow effects. It uses its own `/api/points` query with `refetchInterval: 2000`.

**Important:** TokenCounter navigates to `/alpine-shop` (which redirects to `/rewards`). This is fine, but means clicking the counter goes to rewards — which is actually good UX since it replaces the PointsBreakdownPopover trigger.

**Step 1: Add TokenCounter import to IcyDash.tsx**

Add to imports section (around line 29):

```typescript
import { TokenCounter } from '@/components/TokenCounter';
```

**Step 2: Replace the plain XP display**

Replace the `PointsBreakdownPopover` wrapper and plain text (lines 559-564) with TokenCounter wrapped in the popover:

Current code:
```tsx
<PointsBreakdownPopover>
  <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
    <span className="font-heading text-sm text-peach-400">{xp.toLocaleString()}</span>
    <span className="ml-1 opacity-70">pts</span>
  </button>
</PointsBreakdownPopover>
```

Replace with:
```tsx
<PointsBreakdownPopover>
  <div>
    <TokenCounter />
  </div>
</PointsBreakdownPopover>
```

**Why the wrapper `<div>`:** `PopoverTrigger asChild` needs a single child that can receive a ref. TokenCounter is a `motion.button`, so wrapping in a div prevents ref conflicts between Radix and Framer Motion.

**Step 3: Remove the now-unused `xp` variable reference in the header**

The `xp` variable (line 446: `const xp = points?.available ?? 0;`) may still be used elsewhere — check before removing. Keep it if used elsewhere. If only used in the header, remove it.

Actually — `xp` is likely used nowhere else since TokenCounter fetches its own data. But leave it since removing it is premature and the `points` query is still useful for other widgets. No action needed.

**Step 4: Verify build**

```bash
cd /Users/laurenjohnston/fairy-bubbles/GoalConnect && npm run check
```

**Step 5: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "feat: replace plain XP text with animated TokenCounter in header"
```

---

## Phase 3: Fix Silent XP — Media Completion

### Task 3a: Return pointsEarned from media status endpoint

**Files:**
- Modify: `server/routes/media-library.ts:342-363` (status change handler)

**Context:** When status changes to "done", the server awards XP (lines 343-361) but the response at line 363 is just `res.json(item)` — the client never knows XP was earned.

**Step 1: Track pointsEarned and include in response**

In the `/api/media-library/:id/status` handler, add a `pointsEarned` variable before the XP section and include it in the response:

After line 340 (`const [item] = await db.update(...).returning();`), find the XP award block. Wrap it to capture pointsEarned:

```typescript
// Award XP for completing media item (transitioning TO "done")
let pointsEarned = 0;
if (newStatus === "done" && currentItem.status !== "done") {
  try {
    const existingTx = await storage.getPointTransactionByTypeAndRelatedId(
      userId, 'media_complete', id
    );
    if (!existingTx) {
      await storage.addPoints(
        userId,
        XP_CONFIG.media.complete,
        'media_complete',
        id,
        `Finished: ${currentItem.title}`
      );
      pointsEarned = XP_CONFIG.media.complete;
      await awardDailyBonusIfNeeded(userId);
    }
  } catch (xpError) {
    log.error('[media-library] XP award failed:', xpError);
  }
}

res.json({ ...item, pointsEarned });
```

**Step 2: Verify build**

```bash
cd /Users/laurenjohnston/fairy-bubbles/GoalConnect && npm run check
```

**Step 3: Commit**

```bash
git add server/routes/media-library.ts
git commit -m "feat: return pointsEarned from media status endpoint"
```

### Task 3b: Client-side XP feedback for media completion

**Files:**
- Modify: `client/src/hooks/useMediaLibrary.ts:180-199` (updateStatusMutation)
- Modify: `client/src/components/MediaWidget.tsx:111-117` (Done button click handler)

**Context:** `updateStatusMutation.onSuccess` invalidates media queries but NOT `/api/points` or `/api/points/transactions`. The widget shows a toast with no XP mention.

**Step 1: Add points cache invalidation to updateStatusMutation**

In `useMediaLibrary.ts`, update the `updateStatusMutation.onSuccess` callback (line 194-198):

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
  queryClient.invalidateQueries({ queryKey: ["/api/media-library/current"] });
  queryClient.invalidateQueries({ queryKey: ["/api/media-library/recent"] });
  queryClient.invalidateQueries({ queryKey: ["/api/points"] });
  queryClient.invalidateQueries({ queryKey: ["/api/points/transactions"] });
},
```

**Step 2: Show XP in toast (MediaWidget)**

In `MediaWidget.tsx`, update the Done button onClick handler (lines 111-117). The mutation now returns an object with `pointsEarned`:

```typescript
onClick={async () => {
  try {
    const result = await updateStatus({ id: item.id, status: "done" });
    const xpText = result?.pointsEarned ? ` (+${result.pointsEarned} XP)` : '';
    toast({ title: `Finished "${item.title}"!${xpText}` });
  } catch {
    toast({ title: "Failed to update", variant: "destructive" });
  }
}}
```

**Step 3: Verify build**

```bash
cd /Users/laurenjohnston/fairy-bubbles/GoalConnect && npm run check
```

**Step 4: Commit**

```bash
git add client/src/hooks/useMediaLibrary.ts client/src/components/MediaWidget.tsx
git commit -m "feat: show XP feedback on media completion + invalidate points cache"
```

---

## Phase 4: Fix Silent XP — Goal Completion Bonus

### Task 4: Return pointsEarned from goal update endpoint

**Files:**
- Modify: `server/routes/goals.ts:430-502` (POST /api/goal-updates handler)

**Context:** The goal update handler awards progress XP and completion bonus XP but responds with just `res.status(201).json(result.update)` — no XP info returned.

**Step 1: Track and return total pointsEarned**

Add a `pointsEarned` accumulator variable at the start of the XP section (around line 439), accumulate both progress XP and completion bonus, and include in response:

After `if (result.milestonesCrossed && result.milestonesCrossed > 0 && result.goal)` block:

```typescript
let pointsEarned = 0;

if (result.milestonesCrossed && result.milestonesCrossed > 0 && result.goal) {
  // ... existing point calculation logic ...
  // After the addPoints call at line 473-479:
  pointsEarned += points; // 'points' is the calculated variable already there
}

// Goal completion bonus
if (result.goal && result.goal.currentValue >= result.goal.targetValue) {
  try {
    const existingCompletion = await storage.getPointTransactionByTypeAndRelatedId(
      userId, 'goal_complete', result.goal.id
    );
    if (!existingCompletion) {
      await storage.addPoints(
        userId,
        XP_CONFIG.goal.completionBonus,
        'goal_complete',
        result.goal.id,
        `Goal completed: "${result.goal.title}"`
      );
      pointsEarned += XP_CONFIG.goal.completionBonus;
    }
  } catch (completionError) {
    log.error('[goals] Goal completion bonus failed:', completionError);
  }
}

res.status(201).json({ ...result.update, pointsEarned });
```

**Step 2: Verify build**

```bash
cd /Users/laurenjohnston/fairy-bubbles/GoalConnect && npm run check
```

**Step 3: Commit**

```bash
git add server/routes/goals.ts
git commit -m "feat: return pointsEarned from goal update endpoint"
```

---

## Phase 5: Fix Silent XP — Streak Milestones + Confetti

### Task 5: Add streak celebration to habit completion

**Files:**
- Modify: `client/src/pages/IcyDash.tsx:380-401` (toggleHabitMutation.onSuccess)

**Context:** The server already returns `streakDays` in the habit toggle response (line 670: `streakDays`). The confetti module has `shouldCelebrateStreak(newStreak)` which checks milestones [7, 14, 30, 60, 100, 200, 365]. The sounds module has `playStreakSound()`. None are called.

**Step 1: Add imports**

At the top of IcyDash.tsx, update the confetti import (line 4):

```typescript
import { triggerConfetti, checkAllHabitsComplete, shouldCelebrateStreak } from '@/lib/confetti';
```

Add streak sound import (near the sounds import added in Task 1):

```typescript
import { playCompleteSound, playStreakSound, triggerHaptic } from '@/lib/sounds';
```

**Step 2: Add streak celebration logic to onSuccess**

In `toggleHabitMutation.onSuccess`, after the existing XP toast (around line 391), add:

```typescript
// Celebrate streak milestones
if (data?.streakDays && shouldCelebrateStreak(data.streakDays)) {
  playStreakSound();
  triggerHaptic('heavy');
  triggerConfetti('streak_milestone');
}
```

This fires AFTER the completion sound (from Task 1), creating a layered celebration: quick complete sound → then if milestone, the bigger streak sound + confetti.

**Step 3: Verify build**

```bash
cd /Users/laurenjohnston/fairy-bubbles/GoalConnect && npm run check
```

**Step 4: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "feat: celebrate streak milestones with sound + confetti"
```

---

## Phase 6: Wire CriticalHit into Habit Completion

### Task 6: Add CriticalHit overlay to IcyDash

**Files:**
- Modify: `client/src/pages/IcyDash.tsx` (imports, state, onSuccess, JSX)

**Context:** `CriticalHit` is a full-screen overlay (`fixed inset-0 z-[100] pointer-events-none`) that auto-dismisses after 1.5s. `rollCritical()` returns `{ isCritical, multiplier }` with 25% total chance (3% for 5x, 7% for 3x, 15% for 2x).

**Important:** CriticalHit is purely visual — it does NOT actually multiply the XP on the server. It's a dopamine mechanic (visual + sound + confetti), not a game balance mechanic. The `rollCritical()` is client-side only. This is the correct approach — no server changes needed.

**Step 1: Add imports and state**

Add to imports:
```typescript
import { CriticalHit, rollCritical } from '@/components/CriticalHit';
```

Add state variables near other state declarations (around line 170-180):
```typescript
const [criticalHit, setCriticalHit] = useState<{ show: boolean; multiplier: number }>({ show: false, multiplier: 1 });
```

**Step 2: Add critical hit roll to onSuccess**

In `toggleHabitMutation.onSuccess`, inside the `if (!context?.wasCompleted)` block, after the sound/haptic (added in Task 1):

```typescript
// Roll for critical hit (visual only — does not affect actual XP)
const crit = rollCritical();
if (crit.isCritical) {
  setCriticalHit({ show: true, multiplier: crit.multiplier });
}
```

**Step 3: Add CriticalHit component to JSX**

Add at the end of the component's return, just before the closing fragment or wrapper div (at the bottom of the JSX, around line 680+):

```tsx
<CriticalHit
  show={criticalHit.show}
  multiplier={criticalHit.multiplier}
  onComplete={() => setCriticalHit({ show: false, multiplier: 1 })}
/>
```

**Step 4: Verify build**

```bash
cd /Users/laurenjohnston/fairy-bubbles/GoalConnect && npm run check
```

**Step 5: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "feat: wire CriticalHit overlay into habit completion (25% chance)"
```

---

## Phase 7: Polish — Popover Zero-Row Filter + Mobile Done Button

### Task 7a: Filter zero-XP rows from PointsBreakdownPopover

**Files:**
- Modify: `client/src/components/dashboard/PointsBreakdownPopover.tsx:207-228`

**Context:** The popover renders ALL 8 TYPE_ORDER entries even when total=0, creating visual clutter. Example: if you earned no Media XP this week, "Media 0 XP" still shows.

**Step 1: Filter the grouped array before rendering**

In the breakdown rows section (line 208), add a filter:

```tsx
{grouped.filter(g => g.total > 0).map((group) => (
```

That's it. One word change. Rows with zero XP this week are hidden.

**Step 2: Verify build**

```bash
cd /Users/laurenjohnston/fairy-bubbles/GoalConnect && npm run check
```

**Step 3: Commit**

```bash
git add client/src/components/dashboard/PointsBreakdownPopover.tsx
git commit -m "fix: hide zero-XP rows in points breakdown popover"
```

### Task 7b: Fix mobile visibility of MediaWidget Done button

**Files:**
- Modify: `client/src/components/MediaWidget.tsx:119`

**Context:** The Done button uses `opacity-0 group-hover:opacity-100` which is invisible on touch devices (no hover state). Need to make it always visible on mobile while keeping hover behavior on desktop.

**Step 1: Update button classes**

Change line 119 from:
```tsx
className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 hover:text-emerald-300 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 -my-3"
```

To:
```tsx
className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-emerald-400 hover:text-emerald-300 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 -my-3"
```

**Logic:** On mobile (`<sm`): always 60% visible. On desktop (`sm+`): hidden until hover. The `min-w-[44px] min-h-[44px]` already ensures the touch target is adequate.

**Step 2: Verify build**

```bash
cd /Users/laurenjohnston/fairy-bubbles/GoalConnect && npm run check
```

**Step 3: Commit**

```bash
git add client/src/components/MediaWidget.tsx
git commit -m "fix: make media Done button visible on mobile (touch devices)"
```

---

## Phase 8: Cache Invalidation Gaps

### Task 8: Add missing /api/points invalidation to useYearlyGoals

**Files:**
- Modify: `client/src/hooks/useYearlyGoals.ts:205-208` (incrementGoalMutation.onSuccess)
- Modify: `client/src/hooks/useYearlyGoals.ts:221-224` (toggleGoalMutation.onSuccess)

**Context:** Yearly goal increment and toggle mutations don't invalidate `/api/points`, so the header counter stays stale after goal XP is earned. The `toggleSubItemMutation` already does this correctly (line 242).

**Step 1: Add points invalidation to incrementGoalMutation.onSuccess**

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
  queryClient.invalidateQueries({ queryKey: ["/api/points"] });
  queryClient.invalidateQueries({ queryKey: ["/api/points/transactions"] });
},
```

**Step 2: Add points invalidation to toggleGoalMutation.onSuccess**

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
  queryClient.invalidateQueries({ queryKey: ["/api/points"] });
  queryClient.invalidateQueries({ queryKey: ["/api/points/transactions"] });
},
```

**Step 3: Verify build**

```bash
cd /Users/laurenjohnston/fairy-bubbles/GoalConnect && npm run check
```

**Step 4: Commit**

```bash
git add client/src/hooks/useYearlyGoals.ts
git commit -m "fix: invalidate points cache on yearly goal mutations"
```

---

## Summary of Changes

| Task | File(s) | What |
|------|---------|------|
| 1 | IcyDash.tsx | Sound + haptic on habit completion |
| 2 | IcyDash.tsx, TokenCounter.tsx | Animated XP counter in header |
| 3a | media-library.ts | Return pointsEarned from server |
| 3b | useMediaLibrary.ts, MediaWidget.tsx | XP toast + cache invalidation |
| 4 | goals.ts | Return pointsEarned from server |
| 5 | IcyDash.tsx | Streak milestone celebration |
| 6 | IcyDash.tsx | CriticalHit overlay (25% chance) |
| 7a | PointsBreakdownPopover.tsx | Filter zero-XP rows |
| 7b | MediaWidget.tsx | Mobile Done button visibility |
| 8 | useYearlyGoals.ts | Cache invalidation gaps |

**Total files modified:** 7 files
**Total new files:** 0 (everything already exists)

## Self-Roast Checklist

- **"What if sound crashes?"** — Web Audio API is wrapped in null checks (`if (!audioContext) return`). AudioContext resume is handled. Graceful degradation.
- **"What if CriticalHit overlay gets stuck?"** — Auto-dismisses after 1.5s via setTimeout. pointer-events-none prevents blocking interaction. `onComplete` resets state.
- **"What happens on mobile?"** — Haptic uses `navigator.vibrate` with feature check. Sound works on mobile after first user gesture (AudioContext resume). Done button now visible.
- **"Race condition: rapid habit toggles?"** — toggleHabitMutation is already debounced by TanStack Query's mutation lifecycle. Sound plays instantly (no await). CriticalHit state resets on each new roll.
- **"Is CriticalHit multiplier deceiving?"** — It's visual-only. The toast already shows the real XP amount from the server. Critical overlay is clearly labeled as "BONUS" for dopamine, not accuracy.
- **"TokenCounter refetchInterval: 2000 — too frequent?"** — Already existing code, we're just wiring it in. The 2s poll means floating "+N" animations appear within 2s of any XP event, even without explicit cache invalidation.
- **"What if points query fails?"** — TokenCounter handles `points?.available ?? 0` gracefully. No crash.
