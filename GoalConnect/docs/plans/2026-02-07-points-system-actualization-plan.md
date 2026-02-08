# Points System Actualization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the userPoints system fully actualized — central XP config, new XP sources (media/streaks/goal completion), accurate transaction types.

**Architecture:** Create `shared/xp-config.ts` as single source of truth for all XP amounts. Add 3 new transaction types and 3 new XP award paths. Rename `costume_purchase` → `reward_redeem` with data migration. All changes are backwards-compatible — no DB schema migration needed (varchar column, CHECK constraint already dropped by Drizzle push).

**Tech Stack:** TypeScript, Drizzle ORM, Express.js, TanStack Query, PostgreSQL

**Production Checklist:**
- [x] Centralized config (shared/xp-config.ts replaces 6+ hardcoded locations)
- [x] Error handling (all XP awards wrapped in try-catch, don't fail parent request)
- [x] Toast notifications (existing toast infrastructure handles new XP sources)
- [x] Type safety (strict TypeScript union updated in schema)
- [x] Idempotency (all new sources check for existing transactions before awarding)

---

## Task 1: Create XP Config (`shared/xp-config.ts`)

**Files:**
- Create: `shared/xp-config.ts`

**Step 1: Create the config file**

```typescript
// shared/xp-config.ts
export const XP_CONFIG = {
  habit: { easy: 5, medium: 10, hard: 15 } as Record<string, number>,
  todo: 5,
  goal: {
    progressPerMilestone: 5,
    completionBonus: 50,
    priorityMultiplier: { high: 1.5, medium: 1.0, low: 0.75 } as Record<string, number>,
  },
  adventure: { full: 15, quick: 10 },
  media: { complete: 10 },
  streakMilestone: { 7: 50, 30: 150, 100: 500 } as Record<number, number>,
  dailyBonus: { base: 5, week: 10, month: 15 },
  yearlyGoal: { subItem: 25, categoryBonus: 500 },
} as const;

export const STREAK_MILESTONES = [7, 30, 100] as const;
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/laurenjohnston/fairy-bubbles/GoalConnect && npm run check`
Expected: 0 errors

**Step 3: Commit**

```bash
git add shared/xp-config.ts
git commit -m "feat: add centralized XP config"
```

---

## Task 2: Update Schema Type Union + Rename `costume_purchase`

**Files:**
- Modify: `shared/schema.ts:168` — update type union
- Modify: `server/storage.ts:99,663` — update `spendPoints` default param
- Modify: `server/db-storage.ts:435` — update `spendPoints` default param
- Modify: `server/routes/rewards.ts:120` — change `"costume_purchase"` → `"reward_redeem"`
- Modify: `server/routes.ts:402` — change `"costume_purchase"` → `"reward_redeem"`
- Modify: `server/routes.ts:1369` — change `"costume_purchase"` → `"reward_redeem"`

**Step 1: Update the schema type union**

In `shared/schema.ts:168`, change:
```typescript
// OLD
type: varchar("type", { length: 30 }).notNull().$type<"habit_complete" | "goal_progress" | "costume_purchase" | "daily_login" | "todo_complete" | "adventure_log">(),

// NEW
type: varchar("type", { length: 30 }).notNull().$type<"habit_complete" | "goal_progress" | "goal_complete" | "reward_redeem" | "daily_login" | "todo_complete" | "adventure_log" | "media_complete" | "streak_milestone">(),
```

**Step 2: Update `spendPoints` default param in both storage files**

In `server/storage.ts:663` (MemStorage):
```typescript
// OLD
async spendPoints(userId: number, amount: number, type: PointTransaction['type'] = "costume_purchase", description: string = ""): Promise<boolean> {
// NEW
async spendPoints(userId: number, amount: number, type: PointTransaction['type'] = "reward_redeem", description: string = ""): Promise<boolean> {
```

In `server/db-storage.ts:435` (DatabaseStorage):
```typescript
// OLD
async spendPoints(userId: number, amount: number, type: PointTransaction['type'] = "costume_purchase", description: string): Promise<boolean> {
// NEW
async spendPoints(userId: number, amount: number, type: PointTransaction['type'] = "reward_redeem", description: string): Promise<boolean> {
```

**Step 3: Update all `"costume_purchase"` string literals in route files**

In `server/routes/rewards.ts:120`:
```typescript
// OLD
userId, reward.cost, "costume_purchase", `Redeemed: ${reward.title}`
// NEW
userId, reward.cost, "reward_redeem", `Redeemed: ${reward.title}`
```

In `server/routes.ts:402`:
```typescript
// OLD
const success = await storage.spendPoints(userId, costume.price, "costume_purchase", `Purchased ${costume.name}`);
// NEW
const success = await storage.spendPoints(userId, costume.price, "reward_redeem", `Purchased ${costume.name}`);
```

In `server/routes.ts:1369`:
```typescript
// OLD
const success = await storage.spendPoints(userId, FREEZE_COST, "costume_purchase", "Streak freeze purchase");
// NEW
const success = await storage.spendPoints(userId, FREEZE_COST, "reward_redeem", "Streak freeze purchase");
```

**Step 4: Verify TypeScript compiles**

Run: `npm run check`
Expected: 0 errors (there should be no remaining references to `"costume_purchase"` in code)

**Step 5: Verify no remaining references**

Run: `grep -r "costume_purchase" --include="*.ts" --include="*.tsx" server/ client/ shared/ | grep -v ".bak" | grep -v ".backup" | grep -v "docs/" | grep -v "node_modules/"`
Expected: No output (all references updated). `.bak`/`.backup`/`docs/` files are expected to still reference old name.

**Step 6: Add data migration**

Add to `server/migrate.ts` in the appropriate migration section (or create a standalone migration script). The data migration renames existing rows in the DB:

```sql
UPDATE point_transactions SET type = 'reward_redeem' WHERE type = 'costume_purchase';
```

Also drop the old CHECK constraint if it still exists:
```sql
ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS point_transactions_type_check;
```

Find the appropriate place in `server/migrate.ts` to add this (after the table creation, in the "ensure indexes/constraints" section around line 1100).

**Step 7: Commit**

```bash
git add shared/schema.ts server/storage.ts server/db-storage.ts server/routes/rewards.ts server/routes.ts server/migrate.ts
git commit -m "feat: rename costume_purchase → reward_redeem, add new transaction types"
```

---

## Task 3: Migrate Hardcoded XP to Config — Habits, Todos, Adventures, Daily Bonus, Yearly Goals

**Files:**
- Modify: `server/routes/habits.ts:612-613` — import XP_CONFIG, replace habit base XP
- Modify: `server/routes.ts:636` — import XP_CONFIG, replace todo XP (5)
- Modify: `server/routes/adventures.ts:36` — import XP_CONFIG, replace adventure XP (15, 10)
- Modify: `server/services/dailyBonus.ts:40` — import XP_CONFIG, replace daily bonus tiers
- Modify: `server/routes/yearly-goals.ts:878,974` — import XP_CONFIG, replace sub-item/category XP
- Modify: `server/routes/goals.ts:441` — import XP_CONFIG, replace goal progress XP

**Step 1: habits.ts — Replace hardcoded base XP**

At the top, add import:
```typescript
import { XP_CONFIG } from "@shared/xp-config";
```

At line 612-613, change:
```typescript
// OLD
const baseXP: Record<string, number> = { easy: 5, medium: 10, hard: 15 };
const base = baseXP[habit.difficulty || 'medium'] || 10;

// NEW
const base = XP_CONFIG.habit[habit.difficulty || 'medium'] || XP_CONFIG.habit.medium;
```

**Step 2: routes.ts — Replace todo XP**

At the top (with other imports), add:
```typescript
import { XP_CONFIG } from "@shared/xp-config";
```

At line 636, change:
```typescript
// OLD
await storage.addPoints(userId, 5, 'todo_complete', id,

// NEW
await storage.addPoints(userId, XP_CONFIG.todo, 'todo_complete', id,
```

**Step 3: adventures.ts — Replace adventure XP**

Add import at the top:
```typescript
import { XP_CONFIG } from "@shared/xp-config";
```

In the two `awardAdventureXP` call sites:
- Full adventure (currently `15`): change to `XP_CONFIG.adventure.full`
- Quick adventure (currently `10`): change to `XP_CONFIG.adventure.quick`

These are the call arguments in the POST handlers around lines 350 and 397:
```typescript
// OLD
const pointsEarned = await awardAdventureXP(userId, adventure.id, activity, 15);
// NEW
const pointsEarned = await awardAdventureXP(userId, adventure.id, activity, XP_CONFIG.adventure.full);
```
```typescript
// OLD
const pointsEarned = await awardAdventureXP(userId, adventure.id, activity, 10);
// NEW
const pointsEarned = await awardAdventureXP(userId, adventure.id, activity, XP_CONFIG.adventure.quick);
```

**Step 4: dailyBonus.ts — Replace bonus tiers**

Add import:
```typescript
import { XP_CONFIG } from "@shared/xp-config";
```

At line 40, change:
```typescript
// OLD
const dailyBonus = activityStreak >= 30 ? 15 : activityStreak >= 7 ? 10 : 5;

// NEW
const { base, week, month } = XP_CONFIG.dailyBonus;
const dailyBonus = activityStreak >= 30 ? month : activityStreak >= 7 ? week : base;
```

**Step 5: yearly-goals.ts — Replace sub-item and category XP**

Add import:
```typescript
import { XP_CONFIG } from "@shared/xp-config";
```

At line 878 (sub-item XP), change:
```typescript
// OLD
25,

// NEW
XP_CONFIG.yearlyGoal.subItem,
```

At line 974 (category bonus), change:
```typescript
// OLD
categoryBonus = 500;

// NEW
categoryBonus = XP_CONFIG.yearlyGoal.categoryBonus;
```

**Step 6: goals.ts — Replace milestone base XP**

Add import:
```typescript
import { XP_CONFIG } from "@shared/xp-config";
```

At line 441, change:
```typescript
// OLD
let points = result.milestonesCrossed * 5;

// NEW
let points = result.milestonesCrossed * XP_CONFIG.goal.progressPerMilestone;
```

Also at line 458-462, replace priority multipliers:
```typescript
// OLD
const priorityMultipliers = {
  high: 1.5,
  medium: 1.0,
  low: 0.75
};
const priorityMultiplier = priorityMultipliers[result.goal.priority] || 1.0;

// NEW
const priorityMultiplier = XP_CONFIG.goal.priorityMultiplier[result.goal.priority] || 1.0;
```

**Step 7: Verify TypeScript compiles**

Run: `npm run check`
Expected: 0 errors

**Step 8: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 9: Commit**

```bash
git add server/routes/habits.ts server/routes.ts server/routes/adventures.ts server/services/dailyBonus.ts server/routes/yearly-goals.ts server/routes/goals.ts
git commit -m "refactor: migrate all hardcoded XP amounts to shared XP_CONFIG"
```

---

## Task 4: Add Goal Completion Bonus XP

**Files:**
- Modify: `server/routes/goals.ts:438-484` — add completion bonus after milestone XP

**Context:** The `createGoalUpdate` function in `db-storage.ts` already returns `result.goal.currentValue` and `result.goal.targetValue`. After awarding milestone XP, check if the goal is now complete and award a one-time bonus.

**Step 1: Add completion bonus logic after milestone XP award**

In `server/routes/goals.ts`, after the milestone XP block (after line 483 `}`), add:

```typescript
      // Goal completion bonus — one-time award when goal hits 100%
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
          }
        } catch (completionError) {
          log.error('[goals] Goal completion bonus failed:', completionError);
        }
      }
```

**Important:** This needs `log` imported. Check if it's already imported at the top of goals.ts:
```typescript
import { log } from "../lib/logger";
```
If not, add it.

**Step 2: Verify TypeScript compiles**

Run: `npm run check`
Expected: 0 errors

**Step 3: Commit**

```bash
git add server/routes/goals.ts
git commit -m "feat: award 50 XP bonus when goal reaches 100%"
```

---

## Task 5: Add Media Completion XP

**Files:**
- Modify: `server/routes/media-library.ts:287-343` — add XP award in status PATCH route

**Context:** The status PATCH route already checks `newStatus === "done" && currentItem.status !== "done"` (line 325) for setting completedAt. Add XP award at the same transition point.

**Step 1: Add imports at top of media-library.ts**

Check what's already imported, then add:
```typescript
import { storage } from "../storage";
import { awardDailyBonusIfNeeded } from "../services/dailyBonus";
import { log } from "../lib/logger";
import { XP_CONFIG } from "@shared/xp-config";
```

Note: `storage` may already be imported via a different mechanism (the file uses `db` directly via Drizzle). Check the top of the file for existing imports and adapt. The `storage` import is needed for `addPoints` and `getPointTransactionByTypeAndRelatedId`.

**Step 2: Add XP award after the DB update (after line 336)**

After the `db.update().set(updates)...returning()` call and before `res.json(item)`, add:

```typescript
      // Award XP for completing media item (transitioning TO "done")
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
            await awardDailyBonusIfNeeded(userId);
          }
        } catch (xpError) {
          log.error('[media-library] XP award failed:', xpError);
        }
      }
```

**Step 3: Verify TypeScript compiles**

Run: `npm run check`
Expected: 0 errors

**Step 4: Commit**

```bash
git add server/routes/media-library.ts
git commit -m "feat: award 10 XP when media item marked as done"
```

---

## Task 6: Add Streak Milestone XP

**Files:**
- Modify: `server/routes/habits.ts:596-633` — add milestone check after habit completion XP

**Context:** After the existing habit completion XP is awarded (and streak is calculated), check if the streak hits a milestone (7, 30, or 100 days). Award one-time bonus per habit per milestone.

**Step 1: Add XP_CONFIG import (if not already added in Task 3)**

Verify this import exists at top of habits.ts:
```typescript
import { XP_CONFIG, STREAK_MILESTONES } from "@shared/xp-config";
```

**Step 2: Add streak milestone check after the habit XP award block**

Inside the `if (!existingTx)` block (after line 623, after the `log.debug` call), add:

```typescript
            // Check for streak milestones (one-time per habit per milestone)
            for (const milestone of STREAK_MILESTONES) {
              if (streakDays === milestone) {
                try {
                  // Use description-based dedup: type + relatedId (habitId) + description contains milestone
                  const txs = await storage.getPointTransactions(userId);
                  const alreadyAwarded = txs.some(
                    tx => tx.type === 'streak_milestone'
                      && tx.relatedId === habitId
                      && tx.description.includes(`${milestone}-day`)
                  );
                  if (!alreadyAwarded) {
                    const milestoneXP = XP_CONFIG.streakMilestone[milestone] || 0;
                    if (milestoneXP > 0) {
                      await storage.addPoints(
                        userId,
                        milestoneXP,
                        'streak_milestone',
                        habitId,
                        `${habit.title} ${milestone}-day streak!`
                      );
                      pointsEarned += milestoneXP;
                      log.info(`[habits] Streak milestone! ${habit.title} hit ${milestone}-day streak, awarded ${milestoneXP} XP`);
                    }
                  }
                } catch (milestoneError) {
                  log.error('[habits] Streak milestone award failed:', milestoneError);
                }
                break; // Only one milestone can match at a time
              }
            }
```

**Important notes:**
- Uses `getPointTransactions(userId)` and filters in code — not ideal for large transaction histories but works. The alternative is a new storage method, but YAGNI for now.
- The `break` after matching ensures we don't check higher milestones unnecessarily.
- Description includes `${milestone}-day` for dedup. We control the format so this is reliable.

**Step 3: Verify TypeScript compiles**

Run: `npm run check`
Expected: 0 errors

**Step 4: Commit**

```bash
git add server/routes/habits.ts
git commit -m "feat: award bonus XP at 7/30/100-day habit streak milestones"
```

---

## Task 7: Update PointsBreakdownPopover for New Types

**Files:**
- Modify: `client/src/components/dashboard/PointsBreakdownPopover.tsx:11-66` — update types, labels, ordering

**Step 1: Update the PointTransaction type union**

At line 15-21, change:
```typescript
// OLD
  type:
    | "habit_complete"
    | "goal_progress"
    | "costume_purchase"
    | "daily_login"
    | "todo_complete"
    | "adventure_log";

// NEW
  type:
    | "habit_complete"
    | "goal_progress"
    | "goal_complete"
    | "reward_redeem"
    | "daily_login"
    | "todo_complete"
    | "adventure_log"
    | "media_complete"
    | "streak_milestone";
```

**Step 2: Update TYPE_LABELS**

At line 51-58, change:
```typescript
// OLD
const TYPE_LABELS: Record<PointTransaction["type"], string> = {
  habit_complete: "Habits",
  todo_complete: "Todos",
  goal_progress: "Goals",
  costume_purchase: "Rewards",
  daily_login: "Daily bonus",
  adventure_log: "Adventures",
};

// NEW
const TYPE_LABELS: Record<PointTransaction["type"], string> = {
  habit_complete: "Habits",
  todo_complete: "Todos",
  goal_progress: "Goals",
  goal_complete: "Goal Bonus",
  adventure_log: "Adventures",
  media_complete: "Media",
  streak_milestone: "Streaks",
  daily_login: "Daily",
  reward_redeem: "Redeemed",
};
```

**Step 3: Update TYPE_ORDER**

At line 60-66, change:
```typescript
// OLD
const TYPE_ORDER: PointTransaction["type"][] = [
  "habit_complete",
  "todo_complete",
  "goal_progress",
  "adventure_log",
  "daily_login",
];

// NEW
const TYPE_ORDER: PointTransaction["type"][] = [
  "habit_complete",
  "todo_complete",
  "goal_progress",
  "goal_complete",
  "adventure_log",
  "media_complete",
  "streak_milestone",
  "daily_login",
];
```

Note: `reward_redeem` is intentionally NOT in TYPE_ORDER because it's a negative transaction (spending) and the popover only shows positive XP earned. The `amount <= 0` filter at line 136 already excludes spending.

**Step 4: Verify TypeScript compiles**

Run: `npm run check`
Expected: 0 errors

**Step 5: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add client/src/components/dashboard/PointsBreakdownPopover.tsx
git commit -m "feat: add new XP types to points breakdown popover"
```

---

## Task 8: Run Data Migration (rename existing DB rows)

**Step 1: Add migration to migrate.ts**

Find the section in `server/migrate.ts` where indexes are ensured (around line 1100). Add after the existing index creation:

```typescript
    // Rename costume_purchase → reward_redeem in existing data
    await db.execute(sql`
      UPDATE point_transactions SET type = 'reward_redeem' WHERE type = 'costume_purchase'
    `);

    // Drop old CHECK constraint if it exists (Drizzle push may have already dropped it)
    await db.execute(sql`
      ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS point_transactions_type_check
    `);
```

**Step 2: Run the migration**

Run: `npm run db:push`
Expected: Schema synced, no errors

If `db:push` doesn't execute the migration code, run: `npx tsx server/migrate.ts`

**Step 3: Verify**

Check that old rows were renamed:
```sql
SELECT type, COUNT(*) FROM point_transactions GROUP BY type ORDER BY type;
```
Expected: No rows with type `costume_purchase`, existing spend transactions now show as `reward_redeem`.

**Step 4: Commit**

```bash
git add server/migrate.ts
git commit -m "chore: data migration — rename costume_purchase to reward_redeem"
```

---

## Task 9: Final Verification

**Step 1: Full TypeScript check**

Run: `npm run check`
Expected: 0 errors

**Step 2: Full build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Search for any remaining hardcoded XP values**

Run these greps to verify nothing was missed:
```bash
# Should find NO results in server/ (except .bak/.backup files and migrate.ts historical SQL)
grep -rn "costume_purchase" --include="*.ts" --include="*.tsx" server/ client/ shared/ | grep -v ".bak" | grep -v ".backup" | grep -v "docs/" | grep -v "node_modules/" | grep -v "migrate.ts"
```

**Step 4: Verify XP_CONFIG is the single source**

Grep for hardcoded XP amounts that should be in config:
```bash
# These should NOT match in route files (only in xp-config.ts):
grep -rn "easy: 5\|medium: 10\|hard: 15" --include="*.ts" server/routes/
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `shared/xp-config.ts` | **CREATE** — central XP config |
| `shared/schema.ts` | Update type union (+3 types, rename 1) |
| `server/storage.ts` | Update `spendPoints` default param |
| `server/db-storage.ts` | Update `spendPoints` default param |
| `server/routes/habits.ts` | Import config, streak milestone XP |
| `server/routes/goals.ts` | Import config, goal completion bonus |
| `server/routes/media-library.ts` | Add media completion XP |
| `server/routes/rewards.ts` | Rename to `"reward_redeem"` |
| `server/routes.ts` | Import config, rename spending types |
| `server/routes/adventures.ts` | Import config for XP amounts |
| `server/services/dailyBonus.ts` | Import config for bonus tiers |
| `server/routes/yearly-goals.ts` | Import config for sub-item/category XP |
| `server/migrate.ts` | Data migration for rename |
| `client/.../PointsBreakdownPopover.tsx` | New type labels + ordering |

**New transaction types:** `goal_complete`, `media_complete`, `streak_milestone`, `reward_redeem`
**Removed:** `costume_purchase`
