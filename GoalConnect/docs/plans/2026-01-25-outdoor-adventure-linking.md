# Outdoor Adventure Linking - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix goal linking so adventures count toward "52 outdoor days" and climbing counts toward "12 outdoor climbing days"

**Architecture:**
- Add new `outdoor_climbing_days` linkedJourneyKey that counts ONLY climbing ticks
- Update `outdoor_days` to count BOTH climbing + adventures (already does this)
- Update CompactGoalCard to show "Log outdoor day" button for BOTH sourceLabels
- Both buttons open same dropdown, but behavior may differ

**Tech Stack:** React, TypeScript, PostgreSQL, Drizzle ORM

**Research Sources:**
- Current backend: `server/routes/yearly-goals.ts:116-130` - `outdoor_days` already unions both tables
- Current frontend: `client/src/components/yearly-goals/CompactGoalCard.tsx:249` - button shows for `sourceLabel === "Adventures"`

---

## Issues Found During Browser Audit

### Critical Issues 🔥🔥🔥

1. **Missing `outdoor_climbing_days` linkedJourneyKey**
   - Current: No backend case for climbing-only days
   - Effect: "12 outdoor climbing days" goal uses manual counting, not auto-linked to climbing_log
   - Fix: Add new case in yearly-goals.ts

2. **"52 outdoor days" goal doesn't show "Log outdoor day" button**
   - Current: Button only shows for `sourceLabel === "Adventures"`
   - Problem: The "52 outdoor days (1/week)" goal has different sourceLabel or isn't being recognized
   - Fix: Update CompactGoalCard to check for multiple sourceLabels

### Moderate Issues 🔥🔥

3. **Console warning: `<a>` nesting in MediaWidget**
   - Current: `<Link><a>` creates invalid HTML
   - Fix: Remove inner `<a>` tag or use `asChild` pattern

4. **Adventures widget shows "Log your first adventure"**
   - User has 0 adventures in `outdoor_adventures` table
   - User has 2 entries in `outdoor_climbing_ticks` table
   - This is expected behavior, not a bug

### Minor Issues 🔥

5. **Auth setup flaky in Playwright tests**
   - Sometimes WebKit closes before auth completes
   - Not blocking production functionality

---

## Implementation Tasks

### Phase 1: Backend - Add outdoor_climbing_days linkedJourneyKey

#### Task 1.1: Add outdoor_climbing_days case to yearly-goals.ts

**Files:**
- Modify: `server/routes/yearly-goals.ts:165` (after kilter_max_grade case)

**Step 1: Add the new case**

```typescript
case "outdoor_climbing_days": {
  sourceLabel = "Climbing Log";
  // Count distinct dates from outdoor climbing ticks only
  const result = await db.execute(sql`
    SELECT COUNT(DISTINCT date) as count
    FROM outdoor_climbing_ticks
    WHERE user_id = ${userId} AND date >= ${startDate} AND date <= ${endDate}
  `);
  computedValue = Number(result.rows[0]?.count ?? 0);
  break;
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**
```bash
git add server/routes/yearly-goals.ts
git commit -m "feat: add outdoor_climbing_days linkedJourneyKey for climbing-only goal tracking"
```

---

### Phase 2: Database - Update goal linkedJourneyKey

#### Task 2.1: Update "12 outdoor climbing days" goal

**Step 1: Identify the goal**

The goal "12 outdoor climbing days" needs to be updated to use `linkedJourneyKey: "outdoor_climbing_days"` instead of being manual.

**Option A: Via SQL (if direct DB access)**
```sql
UPDATE yearly_goals
SET linked_journey_key = 'outdoor_climbing_days',
    source = 'auto'
WHERE title LIKE '%outdoor climbing days%'
  AND user_id = 1;
```

**Option B: Via the app settings/goals page**
User can edit the goal and set the linkedJourneyKey

**Step 2: Verify the goal updates**
- Check API response shows source: "auto", sourceLabel: "Climbing Log"
- Verify computedValue matches climbing_log stats (currently 2)

---

### Phase 3: Frontend - Update CompactGoalCard button visibility

#### Task 3.1: Show "Log outdoor day" button for both goal types

**Files:**
- Modify: `client/src/components/yearly-goals/CompactGoalCard.tsx:249`

**Current code:**
```typescript
{!goal.isCompleted && onLogOutdoorDay && goal.sourceLabel === "Adventures" && (
```

**New code:**
```typescript
{!goal.isCompleted && onLogOutdoorDay && (goal.sourceLabel === "Adventures" || goal.sourceLabel === "Climbing Log") && (
```

**Step 1: Update the condition**

**Step 2: TypeScript check**
Run: `npx tsc --noEmit`

**Step 3: Browser verify**
- Both "52 outdoor days" and "12 outdoor climbing days" should show "Log outdoor day" button
- Screenshot both buttons visible

**Step 4: Commit**
```bash
git add client/src/components/yearly-goals/CompactGoalCard.tsx
git commit -m "feat: show Log outdoor day button for both Adventures and Climbing Log goals"
```

---

### Phase 4: Fix MediaWidget console warning

#### Task 4.1: Remove nested `<a>` tags

**Files:**
- Modify: `client/src/components/MediaWidget.tsx`

**Current code (around line 54):**
```tsx
<Link href="/media">
  <a className="flex items-center gap-0.5 text-xs ...">
    All
    <ChevronRight className="w-3 h-3" />
  </a>
</Link>
```

**New code:**
```tsx
<Link href="/media" className="flex items-center gap-0.5 text-xs text-[var(--text-muted)] hover:text-peach-400 transition-colors">
  All
  <ChevronRight className="w-3 h-3" />
</Link>
```

Wouter's `<Link>` renders as an `<a>` by default, so the inner `<a>` creates invalid nesting.

**Step 1: Fix all Link/a nesting instances in MediaWidget**

**Step 2: TypeScript check**

**Step 3: Browser verify - no console warnings**

**Step 4: Commit**
```bash
git add client/src/components/MediaWidget.tsx
git commit -m "fix: remove nested anchor tags in MediaWidget causing console warnings"
```

---

## Verification Checklist

After all tasks:

- [ ] "12 outdoor climbing days" shows correct count from climbing_log (should be 2)
- [ ] "52 outdoor days (1/week)" shows correct count from climbing + adventures
- [ ] Both goals have "Log outdoor day" button
- [ ] Clicking "Count outdoor day" increments climbing days count
- [ ] Clicking "Log adventure" opens adventure modal
- [ ] No console warnings about `<a>` nesting
- [ ] All TypeScript compiles
- [ ] Browser tests pass

---

## Data Flow Summary

**After implementation:**

```
User clicks "Log outdoor day"
├── "Count outdoor day"
│   └── Creates entry in outdoor_climbing_ticks
│       └── Increments BOTH:
│           ├── "52 outdoor days" (outdoor_days query includes climbing)
│           └── "12 outdoor climbing days" (outdoor_climbing_days query)
│
└── "Log adventure"
    └── Creates entry in outdoor_adventures
        └── Increments ONLY:
            └── "52 outdoor days" (outdoor_days query includes adventures)
```

This ensures:
- Adventures count toward general outdoor days (52)
- Climbing counts toward BOTH climbing days (12) AND outdoor days (52)
- User can differentiate between "just went outside" and "did climbing specifically"
