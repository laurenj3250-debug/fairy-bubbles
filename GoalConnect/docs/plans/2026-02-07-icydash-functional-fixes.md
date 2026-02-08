# IcyDash Functional Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every IcyDash widget actionable — fix points dead-ends, add XP for adventures, add quick-log buttons to sidebar widgets.

**Architecture:** All changes use existing patterns: `useMutation` + `apiRequest` on client, `storage.addPoints()` on server. No new tables, no new API patterns. The `pointTransactions.type` column is varchar(30) so adding new type values requires only a TypeScript union update, no migration.

**Production Checklist:**
- [x] Centralized config (reuse existing TYPE_LABELS, apiRequest, storage.addPoints)
- [ ] Error boundaries around risky components
- [ ] Skeleton loading states (existing patterns)
- [ ] Toast notifications for mutations
- [ ] Optimistic updates where applicable
- [ ] Mobile-friendly touch targets (44px+)
- [ ] E2E tests for critical paths
- [ ] Accessibility basics (ARIA, keyboard nav)

---

## Phase 1: Points System Fixes

### Task 1: Add footer links to PointsBreakdownPopover

**Files:**
- Modify: `client/src/components/dashboard/PointsBreakdownPopover.tsx`

**What:** Add "View Rewards" link and conditional "Redeem" CTA at the bottom of the popover.

**Step 1: Add the Link import and footer section**

Add `Link` from wouter and a footer below the existing content:

```tsx
import { Link } from "wouter";
```

After the `nextReward` progress bar section (line ~250), before the closing `</div>` of `space-y-3`, add:

```tsx
{/* Footer links */}
<div className="h-px bg-white/10" />
<div className="flex items-center justify-between">
  <Link href="/rewards" className="text-xs text-peach-400 hover:underline">
    View Rewards
  </Link>
  {nextReward && nextReward.current >= nextReward.cost && (
    <Link href="/rewards" className="text-xs font-medium text-emerald-400 hover:underline">
      Redeem now
    </Link>
  )}
</div>
```

**Step 2: Verify**

Run: `npm run check`
Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add client/src/components/dashboard/PointsBreakdownPopover.tsx
git commit -m "feat(points): add footer links to PointsBreakdownPopover"
```

---

### Task 2: Add inline redeem to NextRewardWidget

**Files:**
- Modify: `client/src/components/dashboard/NextRewardWidget.tsx`

**What:** When `available >= cost`, show a "Redeem" button that calls `POST /api/rewards/:id/redeem` directly. Stop wrapping the whole card in a `<Link>` — instead only make the title/progress area navigable, and add a separate redeem button.

**Step 1: Add imports and redeem mutation**

```tsx
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Gift, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { triggerConfetti } from "@/lib/confetti";
import type { CustomReward } from "@shared/schema";
```

Inside the component, add:

```tsx
const { toast } = useToast();
const canRedeem = nextReward && available >= nextReward.cost;

const redeemMutation = useMutation({
  mutationFn: async (rewardId: number) => {
    return await apiRequest(`/api/rewards/${rewardId}/redeem`, "POST");
  },
  onSuccess: (data: { reward: CustomReward; pointsRemaining: number }) => {
    triggerConfetti('reward_redeemed');
    toast({
      title: "Reward redeemed!",
      description: `You earned "${data.reward.title}". ${data.pointsRemaining} XP remaining.`,
    });
    queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
    queryClient.invalidateQueries({ queryKey: ["/api/points"] });
    queryClient.invalidateQueries({ queryKey: ["/api/points/transactions"] });
  },
  onError: (error: Error) => {
    toast({
      title: "Failed to redeem",
      description: error.message,
      variant: "destructive",
    });
  },
});
```

**Step 2: Replace the Link wrapper with a div + conditional button**

Remove the outer `<Link to="/rewards">` wrapper. Replace with:

```tsx
<div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-3">
  <div className="flex items-center gap-1.5 mb-2">
    <Gift className="h-3.5 w-3.5 text-[var(--text-muted)]" />
    <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
      Next Reward
    </span>
    <Link href="/rewards" className="ml-auto text-xs text-peach-400 hover:underline">
      All
    </Link>
  </div>

  {nextReward ? (
    <>
      <p className="text-sm font-medium text-[var(--text-primary)] mb-2 truncate">
        {nextReward.title}
      </p>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
        <div
          className="h-full bg-peach-400 rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)] tabular-nums">
          {available}/{nextReward.cost} XP
        </p>
        {canRedeem && (
          <button
            onClick={() => redeemMutation.mutate(nextReward.id)}
            disabled={redeemMutation.isPending}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50 flex items-center gap-1 min-h-[44px] px-2"
          >
            <Check className="w-3 h-3" />
            {redeemMutation.isPending ? "..." : "Redeem"}
          </button>
        )}
      </div>
    </>
  ) : (
    <Link href="/rewards">
      <p className="text-sm text-[var(--text-muted)] hover:text-peach-400 cursor-pointer transition-colors">
        Set a reward to work toward!
      </p>
    </Link>
  )}
</div>
```

**Note:** `nextReward` needs to include `id`. Update the reduce to keep the full object:

```tsx
const nextReward = unredeemed.length
  ? unredeemed.reduce((best, r) => (r.cost < best.cost ? r : best))
  : null;
```

This already returns the full `CustomReward` object which has `.id`. No change needed.

**Step 3: Verify**

Run: `npm run check`
Expected: No TypeScript errors.

**Step 4: Commit**

```bash
git add client/src/components/dashboard/NextRewardWidget.tsx
git commit -m "feat(rewards): add inline redeem button to NextRewardWidget"
```

---

### Task 3: Award XP for adventure logging

**Files:**
- Modify: `shared/schema.ts:168` — add `"adventure_log"` to type union
- Modify: `server/routes/adventures.ts` — add `storage.addPoints()` after adventure creation
- Modify: `client/src/components/dashboard/PointsBreakdownPopover.tsx` — add `"adventure_log"` to TYPE_LABELS and TYPE_ORDER

**Step 1: Update schema type union**

In `shared/schema.ts:168`, change:

```ts
type: varchar("type", { length: 30 }).notNull().$type<"habit_complete" | "goal_progress" | "costume_purchase" | "daily_login" | "todo_complete">(),
```

to:

```ts
type: varchar("type", { length: 30 }).notNull().$type<"habit_complete" | "goal_progress" | "costume_purchase" | "daily_login" | "todo_complete" | "adventure_log">(),
```

**Step 2: Add XP to adventure creation routes**

In `server/routes/adventures.ts`, add imports at the top:

```ts
import { storage } from "../storage";
import { awardDailyBonusIfNeeded } from "../services/dailyBonus";
```

In `POST /api/adventures` (line ~331, after `res.status(201).json(adventure);`), change the success response to:

```ts
// Award XP for logging an adventure
try {
  const ADVENTURE_XP = 15;
  await storage.addPoints(userId, ADVENTURE_XP, 'adventure_log', adventure.id, `Logged adventure: ${activity}`);
  await awardDailyBonusIfNeeded(userId);
  res.status(201).json({ ...adventure, pointsEarned: ADVENTURE_XP });
} catch (pointsError) {
  // Don't fail the request if points fail
  console.error('[adventures] Points award failed:', pointsError);
  res.status(201).json(adventure);
}
```

Same pattern for `POST /api/adventures/quick` (line ~371):

```ts
try {
  const QUICK_ADVENTURE_XP = 10;
  await storage.addPoints(userId, QUICK_ADVENTURE_XP, 'adventure_log', adventure.id, `Quick outdoor day: ${activity}`);
  await awardDailyBonusIfNeeded(userId);
  res.status(201).json({ ...adventure, pointsEarned: QUICK_ADVENTURE_XP });
} catch (pointsError) {
  console.error('[adventures] Points award failed:', pointsError);
  res.status(201).json(adventure);
}
```

**Step 3: Add adventure_log to PointsBreakdownPopover display**

In `client/src/components/dashboard/PointsBreakdownPopover.tsx`:

Update the `PointTransaction` type interface (line ~14):

```ts
type:
  | "habit_complete"
  | "goal_progress"
  | "costume_purchase"
  | "daily_login"
  | "todo_complete"
  | "adventure_log";
```

Add to `TYPE_LABELS` (line ~49):

```ts
adventure_log: "Adventures",
```

Add to `TYPE_ORDER` (line ~57, after `"goal_progress"`):

```ts
"adventure_log",
```

**Step 4: Verify**

Run: `npm run check`
Expected: No TypeScript errors.

**Step 5: Commit**

```bash
git add shared/schema.ts server/routes/adventures.ts client/src/components/dashboard/PointsBreakdownPopover.tsx
git commit -m "feat(points): award XP for adventure logging (15 full / 10 quick)"
```

---

### Task 4: Show XP toast on adventure log from IcyDash

**Files:**
- Modify: `client/src/pages/IcyDash.tsx` — update quickOutdoorDayMutation onSuccess

**What:** The `quickOutdoorDayMutation` in IcyDash already invalidates points queries. Now that the server returns `pointsEarned`, show it in the toast.

**Step 1: Update onSuccess handler**

Change the `quickOutdoorDayMutation` onSuccess (line ~346):

```ts
onSuccess: (data: any) => {
  const xpText = data?.pointsEarned ? ` (+${data.pointsEarned} XP)` : '';
  toast({ title: `Outdoor day logged!${xpText}` });
  queryClient.invalidateQueries({ queryKey: ['/api/yearly-goals/with-progress'] });
  queryClient.invalidateQueries({ queryKey: ['/api/adventures'] });
  queryClient.invalidateQueries({ queryKey: ['/api/points'] });
  queryClient.invalidateQueries({ queryKey: ['/api/points/transactions'] });
  queryClient.invalidateQueries({ queryKey: ['/api/recent-outdoor-activities'] });
},
```

**Step 2: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "feat(icydash): show XP toast on adventure log, invalidate activity cache"
```

---

## Phase 2: Dashboard Logging Gaps

### Task 5: Add quick-log "+" button to RecentAdventuresWidget

**Files:**
- Modify: `client/src/components/dashboard/RecentAdventuresWidget.tsx`

**What:** Add a "+" button in the header that opens IcyDash's adventure dialog. The widget needs an `onLogAdventure` callback prop.

**Step 1: Add prop and button**

```tsx
import { Mountain, MapPin, ChevronRight, Snowflake, Plus } from "lucide-react";
```

Add prop:

```tsx
interface RecentAdventuresWidgetProps {
  onLogAdventure?: () => void;
}

export function RecentAdventuresWidget({ onLogAdventure }: RecentAdventuresWidgetProps) {
```

In the header section (line ~90-100), add the "+" button between the title and "View all":

```tsx
<div className="flex items-center justify-between mb-3">
  <div className="flex items-center gap-2">
    <Mountain className="w-4 h-4 text-peach-400" />
    <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
      Recent Adventures
    </span>
  </div>
  <div className="flex items-center gap-2">
    {onLogAdventure && (
      <button
        onClick={onLogAdventure}
        className="text-peach-400 hover:text-peach-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Log new adventure"
      >
        <Plus className="w-4 h-4" />
      </button>
    )}
    <Link href="/adventures" className="text-xs text-peach-400 hover:underline cursor-pointer flex items-center gap-0.5">
      View all
      <ChevronRight className="w-3 h-3" />
    </Link>
  </div>
</div>
```

Apply the same header pattern to the loading and empty states too.

**Step 2: Wire up in IcyDash**

In `client/src/pages/IcyDash.tsx`, update the RecentAdventuresWidget usage (line ~611):

```tsx
<RecentAdventuresWidget onLogAdventure={() => setAdventureDialogOpen(true)} />
```

**Step 3: Verify**

Run: `npm run check`

**Step 4: Commit**

```bash
git add client/src/components/dashboard/RecentAdventuresWidget.tsx client/src/pages/IcyDash.tsx
git commit -m "feat(icydash): add quick-log '+' button to RecentAdventuresWidget"
```

---

### Task 6: Add "Done" action to MediaWidget items

**Files:**
- Modify: `client/src/components/MediaWidget.tsx`

**What:** Add a small checkmark button on each "current" media item that marks it as "done" via `PATCH /api/media-library/:id/status`. This makes the widget actionable without needing to navigate away.

**Step 1: Add imports and hook**

```tsx
import { BookOpen, Tv, Film, AudioLines, Podcast, ChevronRight, Check, type LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
```

Update the hook call to include the `updateStatus` mutation:

```tsx
const { widgetItems, widgetMode, isLoadingWidget, updateStatus, isUpdatingStatus } = useMediaLibrary();
const { toast } = useToast();
```

**Step 2: Add "Done" button to each item**

In the items list (line ~84-118), wrap each item in a flex container and add a check button:

```tsx
<div
  key={item.id}
  className="flex items-center gap-3 group"
>
  {/* Book spine */}
  <div className={cn("w-2 h-10 rounded-full bg-gradient-to-b flex-shrink-0", colorClass)} />

  {/* Title and progress */}
  <div className="flex-1 min-w-0">
    <p className="text-sm text-[var(--text-primary)] truncate leading-tight">
      {item.title}
    </p>
    <div className="flex items-center gap-2 mt-0.5">
      <Icon className="w-3 h-3 text-[var(--text-muted)]" />
      {item.currentProgress && (
        <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
          {item.currentProgress}
        </span>
      )}
    </div>
  </div>

  {/* Done button — only show for "current" items */}
  {widgetMode === "current" && (
    <button
      onClick={async () => {
        try {
          await updateStatus({ id: item.id, status: "done" });
          toast({ title: `Finished "${item.title}"!` });
        } catch {
          toast({ title: "Failed to update", variant: "destructive" });
        }
      }}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 hover:text-emerald-300 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
      aria-label={`Mark "${item.title}" as done`}
    >
      <Check className="w-3.5 h-3.5" />
    </button>
  )}
</div>
```

**Step 3: Add points invalidation to useMediaLibrary updateStatus**

In `client/src/hooks/useMediaLibrary.ts`, update the `updateStatusMutation` onSuccess (line ~193):

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
  queryClient.invalidateQueries({ queryKey: ["/api/media-library/current"] });
  queryClient.invalidateQueries({ queryKey: ["/api/media-library/recent"] });
},
```

**Step 4: Verify**

Run: `npm run check`

**Step 5: Commit**

```bash
git add client/src/components/MediaWidget.tsx client/src/hooks/useMediaLibrary.ts
git commit -m "feat(media): add 'Done' checkmark to current items in MediaWidget"
```

---

## Summary

| Task | Phase | Files | Description |
|------|-------|-------|-------------|
| 1 | P1 | PointsBreakdownPopover | Add "View Rewards" link + conditional "Redeem now" |
| 2 | P1 | NextRewardWidget | Inline redeem button when affordable |
| 3 | P1 | schema + adventures + popover | Award XP for adventure logging |
| 4 | P1 | IcyDash | Show XP in adventure toast, invalidate caches |
| 5 | P2 | RecentAdventuresWidget + IcyDash | Quick-log "+" button opening adventure dialog |
| 6 | P2 | MediaWidget + useMediaLibrary | "Done" checkmark on current items |

**Total files touched:** 7 (+ schema.ts)
**Estimated changes:** ~150 lines added, ~20 lines modified
