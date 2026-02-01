# Implementation Plan: Gamification & Dashboard Overhaul

**Design doc:** `docs/plans/2026-02-01-gamification-dashboard-overhaul-design.md`
**Created:** 2026-02-01

---

## Execution Order & Dependencies

```
Phase 1: Backend Foundation (no frontend changes)
  ├── Task 1: Schema + migration (customRewards, streakFreezeApplications)
  ├── Task 2: db-storage.ts methods (spendPoints fix, new query methods)
  └── Task 3: Habit XP + daily bonus in routes/habits.ts

Phase 2: More Backend + Reward API
  ├── Task 4: Daily bonus in todo-complete route
  ├── Task 5: Reward CRUD + redeem API (server/routes/rewards.ts)
  └── Task 6: Points transactions date-range endpoint

Phase 3: Streak Freeze (backend)
  └── Task 7: Streak freeze purchase + apply endpoints

Phase 4: Frontend — Dashboard Core
  ├── Task 8: Habit toggle XP toast (IcyDash.tsx onSuccess fix)
  ├── Task 9: WeeklyMonthlyGoalsWidget (replaces GoalsDeadlinesWidget)
  └── Task 10: QuickGoalDialog (compact goal creation from dashboard)

Phase 5: Frontend — Points & Rewards
  ├── Task 11: PointsBreakdownPopover (header XP click)
  ├── Task 12: NextRewardWidget (slim sidebar widget)
  └── Task 13: Rewards page (/rewards) with CRUD + redemption

Phase 6: Frontend — Connectivity & Polish
  ├── Task 14: Dashboard wiring (MilestoneDonut link, sidebar nav, route)
  └── Task 15: Streak freeze UI (prompt + purchase in streak display)

Phase 7: Cleanup
  └── Task 16: Remove Alpine Shop route + deprecated pet costume UI
```

---

## Phase 1: Backend Foundation

### Task 1: Schema + Migration

**Files:**
- `shared/schema.ts`
- `db/migrations/XXXX_add_custom_rewards_and_freeze_applications.sql` (new)

**Changes:**

1. Add `customRewards` table to `shared/schema.ts` after `userPoints`:
```typescript
export const customRewards = pgTable("custom_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  cost: integer("cost").notNull(), // minimum 50 enforced by Zod
  imageUrl: text("image_url"),
  redeemed: boolean("redeemed").notNull().default(false),
  redeemedAt: timestamp("redeemed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

2. Add `streakFreezeApplications` table:
```typescript
export const streakFreezeApplications = pgTable("streak_freeze_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  frozenDate: varchar("frozen_date", { length: 10 }).notNull(), // YYYY-MM-DD
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserDate: { name: "uq_freeze_user_date", columns: [table.userId, table.frozenDate] },
}));
```

3. Add `insertCustomRewardSchema` using drizzle-zod:
```typescript
export const insertCustomRewardSchema = createInsertSchema(customRewards)
  .omit({ id: true, redeemed: true, redeemedAt: true, createdAt: true })
  .extend({
    cost: z.number().int().min(50, "Minimum reward cost is 50 XP"),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(1000).optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
  });
```

4. Export types: `CustomReward`, `InsertCustomReward`, `StreakFreezeApplication`

5. Create migration SQL file (additive only):
```sql
CREATE TABLE IF NOT EXISTS custom_rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL,
  image_url TEXT,
  redeemed BOOLEAN NOT NULL DEFAULT false,
  redeemed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_custom_rewards_user_id ON custom_rewards(user_id);

CREATE TABLE IF NOT EXISTS streak_freeze_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  frozen_date VARCHAR(10) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, frozen_date)
);

CREATE INDEX idx_streak_freeze_apps_user_id ON streak_freeze_applications(user_id);
```

**Verification:** `npm run db:push` succeeds, `npm run check` passes.

---

### Task 2: db-storage.ts — New Methods & spendPoints Fix

**File:** `server/db-storage.ts`

**Changes:**

1. **Fix `spendPoints()` signature** (~line 427):
   - Before: `async spendPoints(userId: number, amount: number, description: string)`
   - After: `async spendPoints(userId: number, amount: number, type: PointTransaction['type'], description: string)`
   - Change line 445: `type: "costume_purchase"` → `type: type`
   - Find all callers of `spendPoints()` and add the `type` argument. Search the codebase for `spendPoints(` to find them all.

2. **Add `getPointTransactionByTypeAndRelatedId()`:**
```typescript
async getPointTransactionByTypeAndRelatedId(
  userId: number,
  type: PointTransaction['type'],
  relatedId: number
): Promise<PointTransaction | undefined> {
  const [tx] = await this.db
    .select()
    .from(schema.pointTransactions)
    .where(
      and(
        eq(schema.pointTransactions.userId, userId),
        eq(schema.pointTransactions.type, type),
        eq(schema.pointTransactions.relatedId, relatedId)
      )
    )
    .limit(1);
  return tx;
}
```

3. **Add `getPointTransactionsByDateRange()`:**
```typescript
async getPointTransactionsByDateRange(
  userId: number,
  since: string // YYYY-MM-DD
): Promise<PointTransaction[]> {
  return await this.db
    .select()
    .from(schema.pointTransactions)
    .where(
      and(
        eq(schema.pointTransactions.userId, userId),
        gte(schema.pointTransactions.createdAt, new Date(since))
      )
    )
    .orderBy(desc(schema.pointTransactions.createdAt));
}
```

4. **Add `getPointTransactionByTypeAndDate()`** (for daily bonus idempotency):
```typescript
async getPointTransactionByTypeAndDate(
  userId: number,
  type: PointTransaction['type'],
  date: string // YYYY-MM-DD
): Promise<PointTransaction | undefined> {
  const dayStart = new Date(date + 'T00:00:00.000Z');
  const dayEnd = new Date(date + 'T23:59:59.999Z');
  const [tx] = await this.db
    .select()
    .from(schema.pointTransactions)
    .where(
      and(
        eq(schema.pointTransactions.userId, userId),
        eq(schema.pointTransactions.type, type),
        gte(schema.pointTransactions.createdAt, dayStart),
        lte(schema.pointTransactions.createdAt, dayEnd)
      )
    )
    .limit(1);
  return tx;
}
```

5. **Add reward CRUD methods:**
```typescript
// getRewards(userId): select * where userId, order by createdAt desc
// getReward(id): select * where id, limit 1
// createReward(data: InsertCustomReward): insert returning
// updateReward(id, data: Partial<CustomReward>): update where id returning
// deleteReward(id): delete where id
// redeemReward(id): update set redeemed=true, redeemedAt=now() where id returning
```

6. **Add streak freeze application methods:**
```typescript
// getStreakFreezeApplication(userId, date): check if freeze applied for date
// createStreakFreezeApplication(userId, frozenDate): insert (will fail on unique constraint if duplicate)
// getStreakFreezeApplications(userId): get all applied freezes for streak calculation
```

7. **Add required imports**: `and`, `gte`, `lte` from drizzle-orm if not already imported.

**Verification:** `npm run check` passes. All new methods have correct types.

---

### Task 3: Habit XP Award in Toggle Endpoint

**File:** `server/routes/habits.ts` — the `POST /api/habit-logs/toggle` handler (~line 457-599)

**Changes:**

Insert XP award logic AFTER the score update block (~line 575) but BEFORE the final `res.json()`:

```typescript
// After score calculation, award XP for habit completion
let pointsEarned = 0;
let streakDays = 0;

if (logResult?.completed) {
  try {
    const logId = logResult.id;

    // Idempotency: check if points already awarded for this log
    const existingTx = await storage.getPointTransactionByTypeAndRelatedId(
      userId, 'habit_complete', logId
    );

    if (!existingTx) {
      // Calculate per-habit streak
      const habitLogs = await storage.getHabitLogs(habitId);
      streakDays = calculateStreak(habitLogs);
      const multiplier = getStreakMultiplier(streakDays);

      // Base XP by difficulty
      const baseXP: Record<string, number> = { easy: 5, medium: 10, hard: 15 };
      const base = baseXP[habit.difficulty || 'medium'] || 10;
      pointsEarned = Math.round(base * multiplier);

      await storage.addPoints(
        userId,
        pointsEarned,
        'habit_complete',
        logId,
        `Completed ${habit.name} (${streakDays}-day streak, ${multiplier}x)`
      );
    }

    // Daily activity bonus (server time)
    const serverToday = new Date().toISOString().split('T')[0];
    const existingDailyBonus = await storage.getPointTransactionByTypeAndDate(
      userId, 'daily_login', serverToday
    );

    if (!existingDailyBonus) {
      // Calculate activity streak from recent transactions
      const recentTxs = await storage.getPointTransactionsByDateRange(
        userId,
        new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0]
      );
      const activeDays = new Set(
        recentTxs
          .filter(tx => tx.amount > 0)
          .map(tx => new Date(tx.createdAt).toISOString().split('T')[0])
      );
      // Count consecutive days backwards from yesterday
      let activityStreak = 0;
      let checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1);
      while (activityStreak < 60) {
        const ds = checkDate.toISOString().split('T')[0];
        if (!activeDays.has(ds)) break;
        activityStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      const dailyBonus = activityStreak >= 30 ? 15 : activityStreak >= 7 ? 10 : 5;
      await storage.addPoints(userId, dailyBonus, 'daily_login', null,
        `Daily activity bonus (${activityStreak + 1}-day activity streak)`
      );
      pointsEarned += dailyBonus;
    }
  } catch (pointsError) {
    log.error('[habits] Points award failed:', pointsError);
    // Don't fail the request
  }
}
```

Then modify the response to include `pointsEarned` and `streakDays`:
```typescript
return res.json({
  ...logResult,
  score: { current: scoreResult.newScore, change: scoreResult.scoreChange, percentage: ... },
  pointsEarned,
  streakDays,
});
```

Also update the fallback response (line 594 catch block) to include `pointsEarned: 0, streakDays: 0`.

**Import needed:** `getStreakMultiplier` is already importable from `../pet-utils`.

**Verification:** `npm run check` passes. Manual test: toggle a habit, check `/api/points` increases.

---

## Phase 2: More Backend + Reward API

### Task 4: Daily Bonus in Todo-Complete Route

**File:** `server/routes.ts` — the `POST /api/todos/:id/complete` handler (~line 600)

**Changes:**

After `const completed = await storage.completeTodo(id);` and the linked goal update block, add daily activity bonus check (same logic as Task 3):

```typescript
// Daily activity bonus on todo completion (same as habit toggle)
try {
  const serverToday = new Date().toISOString().split('T')[0];
  const existingDailyBonus = await storage.getPointTransactionByTypeAndDate(
    userId, 'daily_login', serverToday
  );

  if (!existingDailyBonus && !existing.completed) {
    // Same activity streak calculation as habits...
    const recentTxs = await storage.getPointTransactionsByDateRange(
      userId,
      new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0]
    );
    const activeDays = new Set(
      recentTxs.filter(tx => tx.amount > 0)
        .map(tx => new Date(tx.createdAt).toISOString().split('T')[0])
    );
    let activityStreak = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);
    while (activityStreak < 60) {
      const ds = checkDate.toISOString().split('T')[0];
      if (!activeDays.has(ds)) break;
      activityStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    const dailyBonus = activityStreak >= 30 ? 15 : activityStreak >= 7 ? 10 : 5;
    await storage.addPoints(userId, dailyBonus, 'daily_login', null,
      `Daily activity bonus (${activityStreak + 1}-day activity streak)`
    );
  }
} catch (bonusError) {
  log.error('[todos] Daily bonus failed:', bonusError);
}
```

**Note:** Consider extracting the daily bonus logic into a shared helper function in `server/services/dailyBonus.ts` to avoid duplicating between habits and todos. The function signature: `async function awardDailyBonusIfNeeded(userId: number): Promise<number>` — returns bonus amount awarded (0 if already earned today).

**Verification:** `npm run check` passes.

---

### Task 5: Reward CRUD + Redeem API

**File:** `server/routes/rewards.ts` (new)

**Create file with:**

```typescript
import type { Express } from "express";
import { storage } from "../storage";
import { requireUser } from "../simple-auth";
import { insertCustomRewardSchema } from "@shared/schema";
import { log } from "../lib/logger";

const getUserId = (req: any) => requireUser(req).id;

export function registerRewardRoutes(app: Express) {
  // GET /api/rewards — list all rewards
  // POST /api/rewards — create (validate with insertCustomRewardSchema)
  // PATCH /api/rewards/:id — update (ownership check, partial validation)
  // DELETE /api/rewards/:id — delete unredeemed only (ownership check)
  // POST /api/rewards/:id/redeem — verify ownership, check !redeemed, check balance, spendPoints(), mark redeemed
}
```

**Key details:**
- Redeem endpoint: `storage.spendPoints(userId, reward.cost, "costume_purchase", \`Redeemed: ${reward.title}\`)` — reuse `costume_purchase` type for spending
- On successful redeem, return `{ reward: updatedReward, pointsRemaining }` where `pointsRemaining = (await storage.getUserPoints(userId)).available`
- Delete should reject with 400 if `reward.redeemed === true`

**Register in `server/routes.ts`:** Import and call `registerRewardRoutes(app)` alongside existing route registrations.

**Verification:** `npm run check` passes.

---

### Task 6: Points Transactions Date-Range Endpoint

**File:** `server/routes/points.ts`

**Changes:**

Modify `GET /api/points/transactions` to accept optional `?since=YYYY-MM-DD` query parameter:

```typescript
// Current: returns all transactions
// New: if ?since provided, call getPointTransactionsByDateRange(userId, since)
// Else: call existing getPointTransactions(userId) — backwards compatible
const since = req.query.since as string | undefined;
const transactions = since
  ? await storage.getPointTransactionsByDateRange(userId, since)
  : await storage.getPointTransactions(userId);
```

**Verification:** `npm run check` passes.

---

## Phase 3: Streak Freeze (Backend)

### Task 7: Streak Freeze Purchase + Apply Endpoints

**File:** `server/routes.ts` — the existing stub endpoints (~line 1312-1348)

**Changes:**

1. **Fix `GET /api/streak-freezes`** — un-comment and use real data:
```typescript
const freezeData = await storage.getStreakFreeze(userId);
const freezeCount = freezeData?.freezeCount || 0;
res.json({ freezeCount, maxFreezes: 2 });
```

2. **Fix `POST /api/streak-freezes/purchase`:**
```typescript
const freezeData = await storage.getStreakFreeze(userId);
const currentCount = freezeData?.freezeCount || 0;

if (currentCount >= 2) {
  return res.status(400).json({ error: "Already have maximum streak freezes (2)" });
}

const FREEZE_COST = 250;
const success = await storage.spendPoints(userId, FREEZE_COST, "costume_purchase", "Streak freeze purchase");
if (!success) {
  return res.status(400).json({ error: `Insufficient XP (need ${FREEZE_COST})` });
}

await storage.incrementStreakFreeze(userId);
const updated = await storage.getStreakFreeze(userId);
res.json({ freezeCount: updated.freezeCount, pointsSpent: FREEZE_COST });
```

3. **Add `POST /api/streak-freeze/apply`** (new endpoint):
```typescript
app.post("/api/streak-freeze/apply", async (req, res) => {
  const userId = getUserId(req);
  const { frozenDate } = req.body; // YYYY-MM-DD

  // Validate date format
  if (!frozenDate || !/^\d{4}-\d{2}-\d{2}$/.test(frozenDate)) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  // Check idempotency
  const existing = await storage.getStreakFreezeApplication(userId, frozenDate);
  if (existing) {
    return res.json({ applied: true, message: "Already applied" });
  }

  // Check freeze inventory
  const freezeData = await storage.getStreakFreeze(userId);
  if (!freezeData || freezeData.freezeCount <= 0) {
    return res.status(400).json({ error: "No streak freezes available" });
  }

  // Apply: decrement + record
  await storage.decrementStreakFreeze(userId);
  await storage.createStreakFreezeApplication(userId, frozenDate);

  res.json({ applied: true, freezeCount: freezeData.freezeCount - 1 });
});
```

**Verification:** `npm run check` passes.

---

## Phase 4: Frontend — Dashboard Core

### Task 8: Habit Toggle XP Toast

**File:** `client/src/pages/IcyDash.tsx` (~line 352-376)

**Changes:**

1. Change `onSuccess: (_, __, context)` → `onSuccess: (data, _, context)` (line 360)

2. Add XP toast when completing (not uncompleting):
```typescript
onSuccess: (data, _, context) => {
  // Confetti for all-habits-done (existing)
  if (!context?.wasCompleted) {
    const newCompletedCount = completedTodayCount + 1;
    if (checkAllHabitsComplete(newCompletedCount, todayHabits.length)) {
      triggerConfetti('all_habits_today');
    }

    // XP toast
    if (data?.pointsEarned > 0) {
      const streakText = data.streakDays > 1 ? ` (${data.streakDays}-day streak!)` : '';
      toast({ title: `+${data.pointsEarned} XP${streakText}` });
    }
  }

  queryClient.invalidateQueries({ queryKey: ['/api/habits-with-data'] });
  queryClient.invalidateQueries({ queryKey: ['/api/habit-logs/range'] });
  queryClient.invalidateQueries({ queryKey: ['/api/points'] });
},
```

**Verification:** `npm run check` passes. Manual test: toggle habit → see XP toast.

---

### Task 9: WeeklyMonthlyGoalsWidget

**File:** `client/src/components/dashboard/WeeklyMonthlyGoalsWidget.tsx` (new)

**Component spec:**

- Uses `useQuery` to fetch `/api/goals`
- Filters client-side:
  - `weeklyGoals = goals.filter(g => g.week === currentWeek && !g.archived)`
  - `monthlyGoals = goals.filter(g => g.month === currentMonth && !g.archived)`
- ISO week calculation: copy exact pattern from `GoalDialog.tsx` using `date-fns` (`getISOWeek`, `getYear`)
- Two sections with headers: "This Week" and "This Month"
- Each header has a `+` button → opens QuickGoalDialog (Task 10) with pre-set type
- Each goal row shows: title, progress bar, "3/10", +1 button, optional due date badge
- Goal title is clickable → navigates to `/goals`
- +1 increment button calls existing `PATCH /api/goals/:id` to increment `currentValue`
- Empty states: "No goals this week — add one?" / "No goals this month — add one?"
- Glass-card styling matching existing widgets

**File:** `client/src/pages/IcyDash.tsx`

- Replace `<GoalsDeadlinesWidget />` (~line 591-594) with `<WeeklyMonthlyGoalsWidget />`
- Remove import of GoalsDeadlinesWidget, add import of WeeklyMonthlyGoalsWidget
- Do NOT delete GoalsDeadlinesWidget.tsx (may be used elsewhere)

**Verification:** `npm run check` passes. Visual: widget renders in dashboard slot.

---

### Task 10: QuickGoalDialog

**File:** `client/src/components/QuickGoalDialog.tsx` (new)

**Props:**
```typescript
interface QuickGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: "week" | "month";
}
```

**Fields:**
- Title (text, required)
- Type toggle: "This Week" | "This Month" | "Custom Date" (pre-set from prop)
- Target value (number) + Unit (text, e.g., "sessions")
- Difficulty: easy/medium/hard (select, default medium)
- Priority: high/medium/low (select, default medium)

**Auto-sets on submit:**
- `week` field → current ISO week string (from `date-fns`)
- `month` field → current YYYY-MM
- `deadline` → end of current week (Sunday) or end of current month

**Uses:** `POST /api/goals` (existing endpoint) via `useMutation`
**Invalidates:** `['/api/goals']`, `['/api/goal-calendar']`

**Styling:** Radix Dialog, glass-card theme, compact layout. Reference `GoalDialog.tsx` patterns.

**Verification:** `npm run check` passes. Dialog opens from +, creates goal visible in widget.

---

## Phase 5: Frontend — Points & Rewards

### Task 11: PointsBreakdownPopover

**File:** `client/src/components/dashboard/PointsBreakdownPopover.tsx` (new)

**Behavior:**
- Triggered by clicking the XP display in the IcyDash header
- Fetches `/api/points/transactions?since=YYYY-MM-DD` (start of current ISO week)
- Groups transactions by `type`, sums amounts, counts entries
- Calculates activity streak: consecutive calendar days with positive transactions (lookback 60 days)
- Shows: This Week total, breakdown by type, activity streak, next reward preview

**Data:**
```typescript
const weekStart = startOfISOWeek(new Date()).toISOString().split('T')[0];
const { data: txs } = useQuery({
  queryKey: ['/api/points/transactions', { since: weekStart }],
  queryFn: () => api.get(`/api/points/transactions?since=${weekStart}`),
});
```

**Layout (Radix Popover):**
```
This Week: +89 XP
  Habits:      52 XP (6 check-ins)
  Todos:       22 XP (3 completed)
  Goals:        0 XP
  Daily bonus: 15 XP (3 active days)

Activity Streak: 15 days 🔥
Next reward: Custom scrub cap (340/800)
```

**File:** `client/src/pages/IcyDash.tsx`
- Wrap the existing points display in the header with `<PointsBreakdownPopover>` as trigger

**Verification:** `npm run check` passes. Click XP → popover shows breakdown.

---

### Task 12: NextRewardWidget

**File:** `client/src/components/dashboard/NextRewardWidget.tsx` (new)

**Behavior:**
- Queries `/api/rewards` and `/api/points`
- Finds cheapest unredeemed reward (closest to afford)
- Shows: reward title, progress bar (available XP / cost), "340/800 XP"
- Clicking → navigates to `/rewards`
- Empty state: "Set a reward to work toward!" with + button

**Placement in IcyDash:** In the right sidebar, below MilestoneDonutWidget.

**Verification:** `npm run check` passes.

---

### Task 13: Rewards Page

**File:** `client/src/pages/Rewards.tsx` (new)

**Full page with:**
- **Header:** "Rewards" title + available XP display
- **Active rewards section:** Cards with title, cost, progress bar, "Redeem" button (enabled when XP >= cost)
- **Redeemed section:** Cards with "Redeemed ✓" stamp + redemption date
- **Create button:** Opens dialog with title, cost (min 50), optional description/imageUrl
- **Delete:** Unredeemed rewards only (confirm dialog)
- **Edit:** Inline edit or edit dialog for unredeemed rewards

**Redeem flow:**
1. Click "Redeem" → confirm dialog ("Spend 800 XP on Custom scrub cap?")
2. `POST /api/rewards/:id/redeem`
3. On success: `confetti()` + celebratory toast + invalidate queries
4. On error: destructive toast with server error message

**Queries to invalidate on mutations:** `['/api/rewards']`, `['/api/points']`

**File:** `client/src/App.tsx`
- Add `<Route path="/rewards">` with lazy-loaded Rewards component

**Verification:** `npm run check` passes. Navigate to /rewards, create reward, verify in sidebar widget.

---

## Phase 6: Frontend — Connectivity & Polish

### Task 14: Dashboard Wiring

**Files:**
- `client/src/components/MilestoneDonutWidget.tsx` — wrap in `<Link href="/goals?view=monthly">`
- `client/src/pages/IcyDash.tsx` — add sidebar nav link for "rewards" between "adventures" and "settings"

**Verification:** Click MilestoneDonut → navigates. Sidebar has rewards link.

---

### Task 15: Streak Freeze UI

**File:** `client/src/pages/IcyDash.tsx` (or streak display component)

**Behavior:**
- When streak display shows, check if `canFreeze` data is available from the habit streak
- For now, defer full implementation — the backend endpoints (Task 7) are ready
- Show freeze count badge next to streak number
- "Buy Freeze (250 XP)" button in PointsBreakdownPopover or streak area
- "Use Freeze?" prompt when user opens app with 1-day gap detected

**Note:** This is lower priority than the core gamification loop. Can be a fast follow.

**Verification:** `npm run check` passes. Streak freeze count visible, purchase works.

---

## Phase 7: Cleanup

### Task 16: Remove Deprecated UI

**Files:**
- `client/src/App.tsx` — remove `/alpine-shop` route
- `client/src/pages/AlpineShop.tsx` — delete file (verify no other imports first)
- Remove any sidebar nav links to Alpine Shop
- Leave DB tables for now (separate destructive migration later)

**Verification:** `npm run check` passes. No dead links in nav.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Migration breaks prod | Run `npm run db:push` in dev first. Additive only — no drops. |
| Double XP on rapid clicks | Idempotency via `relatedId` check. Mutation `isPending` disables button. |
| Daily bonus timezone edge | Server timestamp only. Documented in design doc. |
| Widget data mismatch | Both widget and goals page use same `/api/goals` endpoint. |
| spendPoints caller breakage | Search all callers before changing signature. Add `type` param. |

## Implementation Notes

- **Execute phases sequentially.** Each phase depends on the previous.
- **Within a phase, tasks can run in parallel** where noted.
- **Test after each task** — `npm run check` minimum, browser verify for frontend tasks.
- **Commit after each task** — small, reviewable commits.
- **Extract shared code** — daily bonus logic → `server/services/dailyBonus.ts`, ISO week util → shared helper.
