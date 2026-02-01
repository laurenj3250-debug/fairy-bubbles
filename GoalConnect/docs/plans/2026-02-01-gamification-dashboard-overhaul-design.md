# GoalConnect: Gamification & Dashboard Overhaul — Design Document

**Date:** 2026-02-01
**Status:** Approved (roasted, hardened, L7-reviewed)
**Scope:** Gamification points for habits, personal reward shop, weekly/monthly goals on dashboard, UX connectivity

---

## Context

GoalConnect ("fairy bubbles") is a personal habit/goal tracking app. The IcyDash dashboard shows daily habits, yearly goals, and widgets in a nature/mountain-themed dark UI with glass-card styling and peach accent colors.

### Current State
- **Working:** Yearly goal completions award XP (25-1000). Todo completions award 5/10/15 XP. Points display in header refreshes on actions.
- **Broken:** Habit completions award zero XP despite the full point infrastructure existing. No daily activity tracking.
- **Deprecated (to remove):** Pet costumes, Alpine Gear Shop, virtual pet system.
- **Missing:** Personal reward shop, weekly/monthly goals on dashboard, XP feedback, dashboard connectivity.

---

## Part 1: Gamification Point System

### Point Sources

| Action | XP | Calculation | Idempotency |
|--------|-----|-------------|-------------|
| Habit check-in | 5-45 | Base by difficulty (easy=5, med=10, hard=15) × streak multiplier (1.0-3.0x) | Use `relatedId` (habit log ID) + `type = 'habit_complete'` to check. Since toggle reuses the same log ID, querying `WHERE type='habit_complete' AND relatedId=$logId` prevents double-dipping on check→uncheck→recheck. |
| Todo completion | 5-15 | By difficulty (already working in `db-storage.ts:519`) | Already guarded — `completeTodo()` returns early if already complete |
| Daily activity bonus | 5-15 | First activity each calendar day. 5 base, 10 at 7+ day streak, 15 at 30+ day streak | Query `WHERE type='daily_login' AND created_at::date = $serverToday`. Uses **server timestamp** to determine "today" (not client date). See Anti-Exploit Rule #2. |
| Goal milestone | 5+ | 5 per 10% milestone × urgency × priority (already working in `goals.ts:272`) | Already working |
| Yearly goal sub-item | 25 | Per sub-item completion (already working in `yearly-goals.ts:721`) | Already working |
| Yearly goal completion | 50-1000 | Per goal's xpReward setting (already working in `yearly-goals.ts:776`) | Already working |
| Category sweep | 500 | All goals in a category completed (already working in `yearly-goals.ts:820`) | Already working |

### Streak Multiplier (reuses existing `getStreakMultiplier` from `pet-utils.ts:137`)

**Rounding strategy:** `Math.round()` — always round to nearest integer. The `amount` column in `point_transactions` is an integer. The existing `calculateCoinsEarned()` in `pet-utils.ts:161` already uses `Math.round(baseCoins * streakMultiplier)`, so we match that pattern.

| Streak Length | Multiplier | Easy (5 base) | Medium (10 base) | Hard (15 base) |
|---------------|-----------|---------------|-------------------|----------------|
| 0-2 days | 1.0x | 5 XP | 10 XP | 15 XP |
| 3-6 days | 1.2x | 6 XP | 12 XP | 18 XP |
| 7-13 days | 1.5x | 8 XP | 15 XP | 23 XP |
| 14-29 days | 2.0x | 10 XP | 20 XP | 30 XP |
| 30+ days | 3.0x | 15 XP | 30 XP | 45 XP |

*Note: 7.5 rounds to 8, 22.5 rounds to 23. All values shown are post-`Math.round()`.*

### Anti-Exploit Rules

1. **Idempotent habit points:** Before awarding, query `point_transactions WHERE type='habit_complete' AND related_id=$logId`. The habit toggle endpoint reuses the same log record (updates `completed` flag instead of creating a new row), so the log ID is stable across check→uncheck→recheck cycles. If a transaction already exists for this log ID, skip awarding. This uses indexed columns (`type`, `related_id`) instead of fragile string matching.
2. **Daily bonus uses server time, not client time:** The client sends `localDate` for logging purposes (so the calendar looks correct), but the daily activity bonus uses the **server's current date** (`new Date().toISOString().split('T')[0]`) to determine "today." This prevents farming: if the client claims it's checking in for yesterday, habit XP is awarded (for the backfill) but the daily bonus is denied because the server knows activity didn't happen today. Past-date habit backfills earn habit points but NOT the daily bonus.
3. **No daily cap:** Single-user app — all habits should feel rewarding. The streak multiplier provides natural scaling.
4. **Un-checking does not deduct:** Points are earned permanently. The idempotency check prevents re-earning.
5. **Difficulty fallback:** Always use `habit.difficulty || "medium"` to handle any legacy null values.

### XP Feedback (Toast Notifications)

When a habit is checked off and XP is awarded:
- Backend returns `{ ...logResult, score: {...}, pointsEarned: 12, streakDays: 7 }` in the toggle response
- Frontend `onSuccess(data, _, context)` destructures the first parameter (currently ignored as `_`) to read `data.pointsEarned`
- Shows toast: "+12 XP (7-day streak!)" on completion, nothing on un-check
- Points display in header refreshes (already implemented via query invalidation on `/api/points`)

### Implementation Files

| File | Change |
|------|--------|
| `server/routes/habits.ts` ~line 575 | After habit score update: get per-habit streak via `calculateStreak(logs)`, get multiplier via `getStreakMultiplier(streak)`, query for existing `habit_complete` transaction by `relatedId=logId`, if none exists call `storage.addPoints()`, include `pointsEarned` and `streakDays` in response JSON |
| `server/routes/habits.ts` | Add daily activity bonus: query for today's `daily_login` transaction, if missing calculate activity streak from recent transactions, award 5/10/15 XP |
| `server/routes.ts` ~line 612 | Add daily activity bonus check in todo-complete endpoint (same logic) |
| `server/db-storage.ts` | Add `getPointTransactionsByDateRange(userId, startDate, endDate)` method. Add `getPointTransactionByTypeAndRelatedId(userId, type, relatedId)` for idempotency checks. |
| `client/src/pages/IcyDash.tsx` ~line 360 | Change `onSuccess: (_, __, context)` to `onSuccess: (data, _, context)`. If `data.pointsEarned > 0`, show toast with XP info. |

---

## Part 2: Personal Reward Shop

Users create real-life rewards with XP prices and redeem them when earned.

### Schema (New Table: `customRewards`)

```
customRewards {
  id: serial (PK)
  userId: integer → users.id (ON DELETE CASCADE)
  title: text NOT NULL (e.g., "Custom scrub cap")
  description: text (optional — details, link, notes)
  cost: integer NOT NULL (XP price, e.g., 800) — validated: must be >= 50 (minimum to prevent trivial rewards)
  imageUrl: text (optional photo URL)
  redeemed: boolean DEFAULT false
  redeemedAt: timestamp
  createdAt: timestamp DEFAULT now()
}
```

**Validation:** Define `insertCustomRewardSchema` using `createInsertSchema(customRewards)` from drizzle-zod, then `.refine()` to enforce: title non-empty (min 1 char), cost >= 50 (prevent trivial 1 XP rewards that break the economy), description/imageUrl are optional strings.

### API Endpoints

| Method | Endpoint | Action | Validation |
|--------|----------|--------|------------|
| GET | `/api/rewards` | List all rewards for user (both redeemed and available) | Auth only |
| POST | `/api/rewards` | Create reward | `insertCustomRewardSchema.parse(req.body)` |
| PATCH | `/api/rewards/:id` | Update reward details/cost | Ownership check + partial schema validation |
| DELETE | `/api/rewards/:id` | Delete unredeemed reward | Ownership check, reject if already redeemed |
| POST | `/api/rewards/:id/redeem` | Redeem reward | Ownership check → verify `available >= cost` → `spendPoints()` → mark redeemed |

### Redeem Endpoint Details

```
1. Verify ownership (reward.userId === req.user.id)
2. Verify not already redeemed (reward.redeemed === false)
3. Verify sufficient points (userPoints.available >= reward.cost)
4. Call spendPoints(userId, reward.cost, type, description) — returns boolean
5. If false → return 400 "Insufficient XP"
6. If true → UPDATE customRewards SET redeemed=true, redeemedAt=now() WHERE id=$id
7. Return { reward: updatedReward, pointsRemaining: newBalance }
```

### Required Fix: `spendPoints()` needs a `type` parameter

**Current code** (`db-storage.ts:442`): `type: "costume_purchase"` is hardcoded.
**Fix:** Add `type` parameter to `spendPoints(userId, amount, type, description)` with a default of `"costume_purchase"` for backwards compatibility. New callers pass the correct type:
- Reward redemption: type = `"costume_purchase"` (reuse for general spending) or add new type
- Streak freeze: type = `"costume_purchase"` or add new type

**Decision:** Add a new point transaction type `"reward_redeem"` to the schema enum, or reuse `"costume_purchase"` as a generic "spent" type. Since the plan removes costumes, reusing it as the "spending" type is fine. Rename conceptually but keep the DB value to avoid migration.

### Dashboard Widget: "Next Reward"

A slim widget on IcyDash showing the closest/cheapest unredeemed reward:
```
Custom scrub cap    ██████████░░░░░  340/800 XP
```
- Shows progress bar with current available XP / reward cost
- Clicking navigates to `/rewards` page
- If no rewards set: shows "Set a reward to work toward!" with + button
- Widget queries `/api/rewards` and `/api/points` — both already cached by TanStack Query

### Rewards Page (`/rewards`)

Full CRUD interface:
- **Available rewards**: Cards with title, cost, progress bar, "Redeem" button (enabled when XP >= cost)
- **Redeemed rewards**: Cards with "Redeemed" stamp, date
- **Create new**: Compact dialog with title, cost, optional description/image
- Celebration on redemption: `confetti()` + celebratory toast

### Empty State

When no active rewards exist after redemption: prompt "Set a new reward to work toward!" with quick-add button. Always keep the carrot dangling.

---

## Part 3: Dashboard Weekly/Monthly Goals Widget

Replace the `GoalsDeadlinesWidget` ("Due February" section) with `WeeklyMonthlyGoalsWidget`.

### Important: Unified Data Shape

The current `GoalsDeadlinesWidget` uses `useGoalCalendar` hook returning `ConsolidatedGoal` with milestone tracking. The replacement widget uses `/api/goals` returning raw `Goal` objects. Maintaining two data shapes for the same entity invites bugs (dashboard shows "3/10" while Goals page shows "40%").

**Fix: Hydrate goals server-side.** Add computed fields to the `/api/goals` response:
```typescript
interface HydratedGoal extends Goal {
  progressPercent: number;  // Math.round((currentValue / targetValue) * 100)
  status: "on-track" | "behind" | "overdue" | "completed";
  milestonesMet: number;    // floor(currentValue / (targetValue / 10))
}
```
The backend computes these on fetch (cheap math). Both the dashboard widget and the Goals page consume the same hydrated shape. The `MilestoneDonutWidget` can also switch to this data source, eliminating the separate `useGoalCalendar` hook for this use case.

**Implementation:** Add a `hydrateGoal(goal: Goal): HydratedGoal` utility in a shared server helper. Apply it in the `GET /api/goals` response. Frontend types updated to match.

### What It Shows

**Two sections with headers:**
1. **"This Week"** — Goals where `week === currentISOWeek && !archived`
2. **"This Month"** — Goals where `month === currentMonth && !archived`

Each goal row:
- Title (clickable → navigates to /goals)
- Progress bar (currentValue/targetValue)
- Progress text ("3/10 sessions")
- Due date indicator (overdue = red, due soon = yellow)
- +1 increment button (on hover/always on mobile)
- Optional: linked yearly goal label ("→ 50 outdoor days")

**Add button** (+) in each section header opens compact creation dialog.

**Empty states:**
- No weekly goals: "No goals this week — add one?"
- No monthly goals: "No goals this month — add one?"
- Both empty: Widget still renders with headers and + buttons (not hidden)

### Compact Goal Creation Dialog

Fields:
- Title (text input, required)
- Type toggle: "This Week" | "This Month" | "Custom Date"
- Target value (number) + Unit (text, e.g., "sessions")
- Difficulty: easy/medium/hard (affects milestone point rewards)
- Priority: high/medium/low (affects urgency multiplier)
- Optional: link to parent monthly goal (for weekly sub-goals, uses `parentGoalId`)

Auto-sets:
- `week` field to current ISO week string if "This Week" (use same `date-fns` calculation as GoalDialog.tsx)
- `month` field to current month string if "This Month"
- `deadline` to end of week/month accordingly

### Data Source

Uses existing `/api/goals` endpoint. Frontend filters:
```typescript
weeklyGoals = goals.filter(g => g.week === currentWeek && !g.archived)
monthlyGoals = goals.filter(g => g.month === currentMonth && !g.archived)
```
Same logic already in `WeeklyPlannerPage.tsx` and `Goals.tsx`.

**ISO Week Calculation:** Copy the pattern from GoalDialog.tsx which already uses `date-fns` for ISO week formatting. Do NOT reinvent — import from a shared utility or copy exactly.

**Locale Warning:** `date-fns` ISO weeks (Monday start) may differ from Postgres `EXTRACT(WEEK FROM ...)` (locale-dependent). Since we filter client-side (not via SQL), this is safe — both the `week` field value and the filter use the same `date-fns` function. But if we ever add server-side week filtering, hardcode `{ weekStartsOn: 1 }` (Monday) in both JS and SQL to match ISO 8601.

---

## Part 4: Points Breakdown Popover

Clicking the XP display in the IcyDash header opens a Radix Popover showing:

```
This Week: +89 XP
  Habits:      52 XP (6 check-ins)
  Todos:       22 XP (3 completed)
  Goals:        0 XP
  Daily bonus: 15 XP (3 active days)

Activity Streak: 15 days
Next reward: Custom scrub cap (340/800)
```

### Data Source

**New endpoint:** `GET /api/points/transactions?since=YYYY-MM-DD`

The current `getPointTransactions()` returns ALL transactions (unbounded query). For the popover, we need only the current week's data.

**Backend change:** Add `since` query parameter to `/api/points/transactions`. New storage method: `getPointTransactionsByDateRange(userId, since)` that adds `WHERE created_at >= $since` to the query. Falls back to all transactions if `since` is not provided (backwards compatible).

**Frontend:** Query with `since` = start of current week. Group by type, sum amounts, count entries. Calculate activity streak: count consecutive calendar days (backwards from today) that have at least one positive transaction. Limit streak lookback to 60 days for performance.

### Activity Streak Indicator

- Visible in the points popover
- Calculated client-side from transaction dates (last 60 days of transactions)
- Different from individual habit streaks — this is the global "did I do anything today" streak
- Shows streak count + fire emoji at thresholds (7+, 30+)

---

## Part 5: Dashboard Connectivity Fixes

| Element | Current State | Fix |
|---------|--------------|-----|
| Points display in header | Shows number, not clickable | Wrap in Radix Popover trigger → opens Points Breakdown Popover |
| MilestoneDonutWidget | Shows monthly %, not clickable | Wrap in `<Link href="/goals?view=monthly">` |
| "Next Reward" widget | Doesn't exist | New slim widget in right sidebar (below MilestoneDonutWidget) |
| Sidebar nav | Missing rewards link | Add "rewards" link between "adventures" and "settings" |
| Weekly Planner page | Exists at `/planner`, not linked | Defer — dashboard WeeklyMonthlyGoalsWidget replaces the need |

---

## Part 6: Streak Freeze (Point Sink)

### Cost: 250 XP (approximately 3-4 days of solid effort)

### Implementation

| Component | Status | Action |
|-----------|--------|--------|
| `streakFreezes` table | Exists | No change |
| `getStreakFreeze()` | Exists in db-storage.ts | No change |
| `incrementStreakFreeze()` | Exists in db-storage.ts | No change |
| `decrementStreakFreeze()` | Exists in db-storage.ts | No change |
| `spendPoints()` | Exists in db-storage.ts | Add `type` parameter (default `"costume_purchase"` for backwards compat) |
| API endpoint | Commented out stub | New: `POST /api/streak-freeze/purchase` |
| Streak calculation | Not connected to freezes | `calculateStreak()` returns freeze-eligible gaps (pure read). Separate write endpoint applies freezes. See Consumption section. |
| UI | `StreakFreeze.tsx` exists but not wired | Connect to API, show freeze count, purchase button |

### Purchase Flow

1. User clicks "Buy Streak Freeze" (in rewards page or streak display area)
2. `POST /api/streak-freeze/purchase`
3. Backend: check freeze count < 2 (max stored) → `spendPoints(userId, 250, "costume_purchase", "Streak freeze purchase")` → if true: `incrementStreakFreeze(userId)` → return new freeze count
4. If insufficient points: return 400 "Insufficient XP (need 250)"
5. If already at max: return 400 "Already have maximum streak freezes (2)"

### Streak Freeze Consumption — Decoupled Read/Write

**Critical architecture decision:** `calculateStreak()` is a pure function called on GET requests (reading habits). It MUST NOT mutate state (decrementing freeze inventory). Mutating in a getter causes: retries consuming multiple freezes, background widget fetches burning inventory, network failures causing inconsistent state.

**Design: Separate read from write.**

#### Read Path (Pure — no side effects)

Modify `calculateStreak()` to return enriched data:
```typescript
interface StreakResult {
  streak: number;           // Current streak count
  missedDays: string[];     // Dates that broke the streak (max 1-2)
  canFreeze: boolean;       // Has available freezes AND a 1-day gap exists
  freezeEligibleDate: string | null; // The specific date a freeze could cover
}
```
The function checks for 1-day gaps and whether freezes are available, but does NOT consume them. It just reports the opportunity.

#### Write Path (Explicit — user-initiated or daily cron)

**Option A (Recommended): User prompt**
Frontend sees `canFreeze: true` and shows UI: "You missed yesterday! Use a Streak Freeze to save your streak?" User clicks "Use Freeze" → `POST /api/streak-freeze/apply` → backend decrements freeze, records `freeze_applied` for that date → streak recalculates as continuous.

**Option B: Daily cron (background)**
A daily cron job (the app already uses `node-cron`) runs at midnight, checks each user's streak, and auto-applies a freeze if a 1-day gap exists. Idempotent via a `streakFreezeApplications` record: `{ userId, date, appliedAt }`. If a record exists for this date, skip.

**Decision:** Use Option A (user prompt). It gives Lauren agency ("Do I want to use this?") and avoids the side-effect-in-getter anti-pattern entirely.

#### Idempotency for Freeze Application

New table or JSONB field on `streakFreezes`:
```
streakFreezeApplications {
  userId: integer
  frozenDate: varchar (YYYY-MM-DD) — the date the freeze covers
  appliedAt: timestamp
  UNIQUE(userId, frozenDate)
}
```
Before applying a freeze, check: `SELECT 1 FROM streakFreezeApplications WHERE userId=$id AND frozenDate=$date`. If exists, skip (already applied). This prevents double-consumption regardless of retries.

#### Streak Calculation with Applied Freezes

`calculateStreak()` queries `streakFreezeApplications` for the user and treats frozen dates as "active" days when counting consecutive streaks. This is a read-only join — no mutations.

**Edge case:** If Lauren doesn't open the app for 3 days, the streak is broken regardless of freezes (freezes only cover 1-day gaps, and the prompt only appears when she opens the app). This is intentional — freezes protect against occasional misses, not vacations.

---

## Part 7: Cleanup (Deprecated Features)

**Important: Do cleanup in a SEPARATE migration from additive changes. Never bundle additive + destructive in one migration.**

| Feature | Action | Migration |
|---------|--------|-----------|
| Pet costume system | Remove `costume_purchase` references from UI. Keep DB type for `spendPoints()`. | No migration needed |
| Alpine Gear Shop | Remove `/alpine-shop` route, `AlpineShop.tsx`, related components | Separate later migration to drop tables |
| Virtual Pet | Defer removal decision — not blocking this plan | No change |
| `linkedBookId` on yearly goals | Already removed from active code | No change |
| `WeeklyPlannerPage` | Keep — deferred | No change |

---

## Roast Fixes Applied (from Pro Review)

| # | Issue | Resolution |
|---|-------|------------|
| 1 | `spendPoints()` hardcodes `costume_purchase` | Add `type` parameter with default for backwards compat |
| 2 | String-based idempotency is fragile | Changed to `relatedId` (logId) + `type` query on indexed columns |
| 3 | `getPointTransactions()` returns ALL rows | New `?since=` param + `getPointTransactionsByDateRange()` method |
| 4 | `getUserPoints()` insert race on first call | Low risk for single-user. Note: use `ON CONFLICT DO NOTHING` if ever multi-user |
| 5 | `onSuccess` ignores mutation result | Changed to destructure first param for toast data |
| 6 | `calculateStreak()` fetches ALL logs | Accepted for now — single-user, lightweight. Optimization candidate later. |
| 7 | ISO week format mismatch risk | Documented: copy pattern from GoalDialog.tsx exactly |
| 8 | `spendPoints()` returns boolean only | Redeem endpoint handles boolean return with proper error responses |
| 9 | No Zod validation on reward endpoints | Added: `insertCustomRewardSchema` from drizzle-zod |
| 10 | `habit.difficulty` might be null | Added fallback: `habit.difficulty \|\| "medium"` |
| 11 | Activity streak calculation performance | Limit to 60-day lookback window |
| 12 | Streak freeze auto-consumption timing | On-demand in `calculateStreak()`, bridges single-day gaps only |
| 13 | No migration rollback plan | Separate additive (customRewards) and destructive (cleanup) migrations |
| 14 | Widget data source mismatch | Documented: new widget uses goals table, milestone view preserved in MilestoneDonutWidget |

---

## Summary: All Changes by File

### New Files
- `shared/schema.ts` — Add `customRewards` table + `insertCustomRewardSchema`
- `server/routes/rewards.ts` — CRUD + redeem endpoints with Zod validation
- `client/src/pages/Rewards.tsx` — Reward shop page with CRUD + redemption + confetti
- `client/src/components/dashboard/WeeklyMonthlyGoalsWidget.tsx` — Replace GoalsDeadlinesWidget
- `client/src/components/dashboard/NextRewardWidget.tsx` — Slim reward progress widget
- `client/src/components/dashboard/PointsBreakdownPopover.tsx` — XP breakdown popover
- `client/src/components/QuickGoalDialog.tsx` — Compact goal creation for dashboard
- `db/migrations/XXXX_add_custom_rewards.sql` — Additive migration ONLY

### Modified Files
- `server/db-storage.ts` — Add `getPointTransactionsByDateRange()`, `getPointTransactionByTypeAndRelatedId()`, add `type` param to `spendPoints()`
- `server/routes/habits.ts` — Add XP award logic + daily bonus + return points in response
- `server/routes.ts` — Add daily bonus in todo-complete, add streak freeze purchase endpoint, register reward routes
- `server/pet-utils.ts` — Modify `calculateStreak()` to consume streak freezes for 1-day gaps
- `client/src/pages/IcyDash.tsx` — Replace GoalsDeadlinesWidget, add NextRewardWidget, add toast on XP earn, make points clickable with popover
- `client/src/App.tsx` — Add `/rewards` route
- `client/src/components/MilestoneDonutWidget.tsx` — Wrap in Link to `/goals?view=monthly`

### Removed/Deferred
- `AlpineShop.tsx` removal — separate later migration
- Virtual pet removal — deferred, not blocking
