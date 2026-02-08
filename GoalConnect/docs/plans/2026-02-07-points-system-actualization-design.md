# Points System Actualization — Design

**Date:** 2026-02-07
**Goal:** Make the userPoints system the single, complete XP economy — every meaningful action earns XP, all amounts are centrally configured, transaction types are accurately named.

**Scope:** userPoints + pointTransactions only. Climbing XP / expeditions / strava untouched. Dead schema (combos, dailyQuests) left for future cleanup.

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Dual XP | Leave climbing separate for now | User wants habits/goals/media focus, not climbing/strava rework |
| Dead tables | Leave them | Not hurting anything, cleanup is low-value |
| XP config | Centralize to `shared/xp-config.ts` | DRY — 6+ files currently hardcode amounts |
| New sources | Media, streaks, goal completion, climbing sessions | All four selected |
| Type rename | `costume_purchase` → `reward_redeem` | Accuracy — needs data migration |

*Note: User descoped climbing sessions from XP sources during brainstorming ("let's just do habits/goals/things, nothing from strava or climbing log"). Final sources: media completion, streak milestones, goal completion bonus.*

---

## Architecture

### 1. Central XP Config (`shared/xp-config.ts`)

```typescript
export const XP_CONFIG = {
  habit: { easy: 5, medium: 10, hard: 15 },
  todo: { easy: 5, medium: 10, hard: 15 },
  goal: {
    progressBase: 5,
    completionBonus: 50,
    difficultyMultiplier: { easy: 0.5, medium: 1.0, hard: 1.5 },
    urgencyMultiplier: { urgent: 1.5, soon: 1.2, normal: 1.0 },
  },
  adventure: { full: 15, quick: 10 },
  media: { complete: 10 },
  streakMilestone: { 7: 50, 30: 150, 100: 500 },
  dailyBonus: { base: 5, week: 10, month: 15 },
  yearlyGoal: { subItem: 25, categoryBonus: 500 },
} as const;

export const STREAK_MILESTONES = [7, 30, 100] as const;
```

### 2. New Transaction Types

Schema type union update in `shared/schema.ts`:
```
"habit_complete" | "goal_progress" | "goal_complete" | "reward_redeem" |
"daily_login" | "todo_complete" | "adventure_log" | "media_complete" | "streak_milestone"
```

Removed: `"costume_purchase"` (renamed to `"reward_redeem"`)
Added: `"goal_complete"`, `"media_complete"`, `"streak_milestone"`

### 3. New XP Sources

**Media completion** (`server/routes/media-library.ts` — status PATCH):
- Trigger: status changes TO `"done"`
- Idempotent: `getPointTransactionByTypeAndRelatedId(userId, "media_complete", mediaItemId)`
- Amount: `XP_CONFIG.media.complete` (10 XP)
- Also call `awardDailyBonusIfNeeded(userId)`
- Cache invalidation: `/api/points`, `/api/points/transactions`

**Streak milestones** (`server/routes/habits.ts` — after habit completion):
- Trigger: after awarding habit_complete XP, check current streak
- For each milestone in `STREAK_MILESTONES` where `streak === milestone`:
  - Idempotent: custom check — query `point_transactions` WHERE `type='streak_milestone'` AND `userId` AND `description LIKE '%{milestone}-day%'` AND `relatedId=habitId`
  - Amount: `XP_CONFIG.streakMilestone[milestone]`
  - Description: `"{habitName} {milestone}-day streak!"`
- One-time per habit per milestone tier (rebuilding a streak doesn't re-award)

**Goal completion bonus** (`server/routes/goals.ts` — after progress update):
- Trigger: `currentValue >= targetValue` after update
- Idempotent: `getPointTransactionByTypeAndRelatedId(userId, "goal_complete", goalId)`
- Amount: `XP_CONFIG.goal.completionBonus` (50 XP)
- Only awarded once per goal (idempotent by goalId)

### 4. Type Rename: `costume_purchase` → `reward_redeem`

**Code changes:**
- `shared/schema.ts` — update type union
- `server/routes/rewards.ts` — change transaction creation type
- `client/src/components/dashboard/PointsBreakdownPopover.tsx` — update TYPE_LABELS, TYPE_ORDER

**Data migration** (new migration file):
```sql
UPDATE point_transactions SET type = 'reward_redeem' WHERE type = 'costume_purchase';
```

### 5. PointsBreakdownPopover Updates

New entries needed:
```typescript
const TYPE_LABELS = {
  habit_complete: "Habits",
  goal_progress: "Goals",
  goal_complete: "Goal Bonus",
  reward_redeem: "Redeemed",    // renamed
  daily_login: "Daily",
  todo_complete: "Todos",
  adventure_log: "Adventures",
  media_complete: "Media",
  streak_milestone: "Streaks",
};
```

---

## Files Affected

| File | Change |
|------|--------|
| `shared/xp-config.ts` | **CREATE** — central config |
| `shared/schema.ts` | Update type union |
| `server/routes/habits.ts` | Import XP_CONFIG, add streak milestone logic |
| `server/routes/goals.ts` | Import XP_CONFIG, add completion bonus |
| `server/routes/media-library.ts` | Add XP award on status→done |
| `server/routes/rewards.ts` | Change type to `reward_redeem` |
| `server/routes/adventures.ts` | Import XP_CONFIG (replace hardcoded 10/15) |
| `server/routes.ts` | Import XP_CONFIG for todo XP |
| `server/routes/yearly-goals.ts` | Import XP_CONFIG for yearly amounts |
| `server/services/dailyBonus.ts` | Import XP_CONFIG for bonus tiers |
| `client/.../PointsBreakdownPopover.tsx` | Add new type labels |
| `db/migrations/XXXX_*.sql` | Rename costume_purchase rows |

---

## Self-Roast Findings (Pre-Ship)

1. **Streak dedup is string-based** — `description LIKE '%7-day%'` is fragile. Mitigated by: we control the format, and it's wrapped in a helper function that can be upgraded later.
2. **Goal completion check** — must use `currentValue >= targetValue` not `=== 100%` since goals use raw values not percentages.
3. **Cache invalidation** — media status route must invalidate `/api/points` and `/api/points/transactions` after awarding XP.
4. **Migration order matters** — data migration (rename rows) must run BEFORE code deploy that removes `costume_purchase` from the type union.
