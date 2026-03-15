# IcyDash Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 3 IcyDash issues - habit widget height, ice climbing in Recent Adventures, and book goals auto-counting.

**Architecture:**
1. CSS fix for habit widget (already done, needs verification)
2. Backend unified "recent outdoor activities" endpoint combining adventures + climbing days
3. Backend linkedJourneyKey support for audiobooks/books from media_library

**Tech Stack:** React, TanStack Query, Drizzle ORM, PostgreSQL

**Research Sources:**
- Existing `outdoor_days` query pattern in server/routes/yearly-goals.ts:118-145
- media_library table schema in shared/schema.ts:1447-1467

**Production Checklist:**
- [ ] Centralized config (no magic strings/numbers in 2+ places)
- [ ] Error boundaries around risky components
- [ ] Skeleton loading states
- [ ] Toast notifications for mutations
- [ ] Optimistic updates where applicable
- [ ] Mobile-friendly touch targets (44px+)
- [ ] E2E tests for critical paths
- [ ] Accessibility basics (ARIA, keyboard nav)

---

## Phase 1: Verify Existing Fix (Habit Widget)

### Task 1.1: Verify Habit Widget CSS Fix

**Files:**
- Check: `client/src/pages/IcyDash.tsx:550-575`

**Step 1: Verify the edit was applied**

Check that lines 550-552 no longer have `flex-1` or `flex flex-col`:

```typescript
// SHOULD BE (after previous fix):
<div className="col-span-2 glass-card frost-accent">
  <span className="card-title">This Week</span>
  <div>

// NOT this (before fix):
<div className="col-span-2 glass-card frost-accent flex flex-col">
  <span className="card-title">This Week</span>
  <div className="flex-1">
```

**Step 2: Browser test**

Run Playwright test to verify the habit widget doesn't stretch:
```bash
npx playwright test --project=firefox --grep "habit widget"
```

If no test exists, verify manually:
1. Navigate to dashboard
2. Check habit widget doesn't take excessive vertical space
3. Compare height to right sidebar widgets

---

## Phase 2: Recent Outdoor Activities (Ice Climbing)

### Task 2.1: Create Unified Recent Activities Endpoint

**Files:**
- Create: `server/routes/recent-activities.ts` (new endpoint)
- Modify: `server/routes.ts` (register route)

**Problem:** RecentAdventuresWidget only shows `outdoor_adventures`, not `outdoor_climbing_ticks`. User logged ice climbing via "Count outdoor day" which saves to `outdoor_climbing_ticks`, not `outdoor_adventures`.

**Solution:** Create `/api/recent-outdoor-activities` that combines both sources.

**Step 1: Create route file**

```typescript
// server/routes/recent-activities.ts
import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

interface RecentActivity {
  id: number;
  date: string;
  type: "adventure" | "climbing_day";
  activity: string;
  location: string | null;
  photoPath: string | null;
  thumbPath: string | null;
  notes: string | null;
}

router.get("/recent-outdoor-activities", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 4, 20);

    // Combine outdoor_adventures and outdoor_climbing_ticks
    const result = await db.execute(sql`
      SELECT * FROM (
        SELECT
          id,
          date::text,
          'adventure' as type,
          activity,
          location,
          photo_path as "photoPath",
          thumb_path as "thumbPath",
          notes
        FROM outdoor_adventures
        WHERE user_id = ${userId}

        UNION ALL

        SELECT
          id,
          date::text,
          'climbing_day' as type,
          COALESCE(notes, 'Outdoor climbing day') as activity,
          location,
          NULL as "photoPath",
          NULL as "thumbPath",
          notes
        FROM outdoor_climbing_ticks
        WHERE user_id = ${userId}
      ) combined
      ORDER BY date DESC
      LIMIT ${limit}
    `);

    res.json(result.rows as RecentActivity[]);
  } catch (error) {
    next(error);
  }
});

export default router;
```

**Step 2: Register route**

In `server/routes.ts`, add:
```typescript
import recentActivitiesRouter from "./routes/recent-activities";
// ... in registerRoutes:
app.use("/api", recentActivitiesRouter);
```

**Step 3: Test endpoint**

```bash
curl -H "Cookie: connect.sid=..." http://localhost:5001/api/recent-outdoor-activities
```

Expected: Array with both adventures AND climbing days, sorted by date desc.

---

### Task 2.2: Update RecentAdventuresWidget to Use Unified Endpoint

**Files:**
- Modify: `client/src/components/dashboard/RecentAdventuresWidget.tsx`

**Step 1: Update the component**

```typescript
// client/src/components/dashboard/RecentAdventuresWidget.tsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Mountain, MapPin, ChevronRight, Snowflake } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentActivity {
  id: number;
  date: string;
  type: "adventure" | "climbing_day";
  activity: string;
  location: string | null;
  photoPath: string | null;
  thumbPath: string | null;
  notes: string | null;
}

export function RecentAdventuresWidget() {
  const { data: activities, isLoading, error } = useQuery<RecentActivity[]>({
    queryKey: ["/api/recent-outdoor-activities"],
    queryFn: async () => {
      const res = await fetch("/api/recent-outdoor-activities?limit=4");
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  // ... rest of component with updated rendering for both types
  // Show Snowflake icon for climbing_day, Mountain for adventure
  // Handle missing photos gracefully (climbing_day has no photos)
}
```

**Step 2: Verify in browser**

Ice climbing entry should now appear in Recent Adventures widget.

---

## Phase 3: Book Goals Auto-Counting

### Task 3.1: Add linkedJourneyKey Cases for Books

**Files:**
- Modify: `server/routes/yearly-goals.ts` (add cases)

**Problem:** "6 audiobooks" and "2 physical books" goals are manual count. User wants them to auto-count from media_library when books are marked "done".

**Solution:** Add `audiobooks_completed` and `books_completed` linkedJourneyKey cases.

**Step 1: Add cases to computeGoalProgress**

After the `outdoor_climbing_days` case (around line 196), add:

```typescript
case "audiobooks_completed": {
  sourceLabel = "Media Library";
  // Count audiobooks with status = 'done' completed this year
  const result = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM media_library
    WHERE user_id = ${userId}
      AND media_type = 'audiobook'
      AND status = 'done'
      AND EXTRACT(YEAR FROM updated_at) = ${parseInt(year)}
  `);
  computedValue = Number(result.rows[0]?.count ?? 0);
  break;
}

case "books_completed": {
  sourceLabel = "Media Library";
  // Count physical books (type = 'book') with status = 'done' completed this year
  const result = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM media_library
    WHERE user_id = ${userId}
      AND media_type = 'book'
      AND status = 'done'
      AND EXTRACT(YEAR FROM updated_at) = ${parseInt(year)}
  `);
  computedValue = Number(result.rows[0]?.count ?? 0);
  break;
}
```

**Step 2: Commit**

```bash
git add server/routes/yearly-goals.ts
git commit -m "feat: add linkedJourneyKey for audiobooks and books"
```

---

### Task 3.2: Update Database Goal Records

**Files:**
- Create: `scripts/link-book-goals.ts`

**Step 1: Write migration script**

```typescript
// scripts/link-book-goals.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

const { Pool } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  const db = drizzle(pool);

  console.log("Linking book goals to media_library...\n");

  // Link "6 audiobooks" goal
  const result1 = await db.execute(sql`
    UPDATE yearly_goals
    SET linked_journey_key = 'audiobooks_completed'
    WHERE title LIKE '%audiobook%'
      AND user_id = 1
    RETURNING id, title, linked_journey_key
  `);
  console.log("Updated audiobooks goal:");
  console.log(result1.rows);

  // Link "2 physical books" goal
  const result2 = await db.execute(sql`
    UPDATE yearly_goals
    SET linked_journey_key = 'books_completed'
    WHERE title LIKE '%physical book%'
      AND user_id = 1
    RETURNING id, title, linked_journey_key
  `);
  console.log("\nUpdated physical books goal:");
  console.log(result2.rows);

  // Verify
  const verify = await db.execute(sql`
    SELECT id, title, linked_journey_key
    FROM yearly_goals
    WHERE title LIKE '%book%' AND user_id = 1
  `);
  console.log("\nVerification - all book goals:");
  console.log(verify.rows);

  await pool.end();
  console.log("\nDone!");
}

main().catch(console.error);
```

**Step 2: Run script**

```bash
export DATABASE_URL="your-connection-string"
NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/link-book-goals.ts
```

**Step 3: Verify in browser**

Navigate to dashboard, find books category goals, check sourceLabel shows "Media Library" and counts match completed books.

---

## Phase 4: Verification

### Task 4.1: Full Browser Test

**Step 1: Test all 3 fixes**

1. **Habit widget:** Should not stretch vertically
2. **Recent Adventures:** Should show ice climbing entry
3. **Book goals:** Should show "Media Library" source and auto-count

**Step 2: Fill verification certificate**

```
=== VERIFICATION CERTIFICATE ===
Date: [YYYY-MM-DD HH:MM]
Task: IcyDash fixes - habit height, recent activities, book goals

🚨 BROWSER VERIFICATION:
Method used: [Playwright / manual]
Screenshot proof: [path]

BUILD OUTPUT:
```
[paste npm run build output]
```

TYPECHECK OUTPUT:
```
[paste npm run check output]
```

ACTUAL BROWSER TEST:
1. [Dashboard loaded → habit widget height = Xpx]
2. [Recent Adventures shows: adventure A, climbing day B, ...]
3. [Book goals show: "6 audiobooks" → 2/6 (Media Library)]

GRADE: [A+/A/B/C/D/F]
=== END CERTIFICATE ===
```

---

## Summary

| Task | Type | Effort | Files |
|------|------|--------|-------|
| 1.1 Verify habit CSS | Verify | Small | IcyDash.tsx |
| 2.1 Recent activities endpoint | Backend | Medium | new route file, routes.ts |
| 2.2 Update widget | Frontend | Medium | RecentAdventuresWidget.tsx |
| 3.1 Book linkedJourneyKey | Backend | Small | yearly-goals.ts |
| 3.2 Update DB records | Script | Small | new script |
| 4.1 Full verification | Test | Medium | - |

**Total: 6 tasks**
