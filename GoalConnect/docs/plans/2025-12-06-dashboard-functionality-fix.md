# Dashboard Functionality Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the Schedule section (tasks not displaying) and ensure all dashboard components are functional.

**Architecture:** The root cause is a schema/database mismatch - the `projects` table in the database is missing the `icon` and `parent_id` columns defined in the Drizzle schema. When `/api/todos-with-metadata` queries projects, Drizzle generates SQL including these missing columns, causing a 500 error. We'll add a migration to sync the database with the schema.

**Tech Stack:** PostgreSQL, Drizzle ORM, Express.js, React/TanStack Query

---

## Task 1: Add Migration for Missing Projects Columns

**Files:**
- Modify: `server/migrate.ts` (add column migration after projects table creation ~line 643)

**Step 1: Add migration for `icon` column**

Add after line 643 (`log.info('[migrate] ✅ Projects table created/verified');`):

```typescript
      // Add icon column to projects (added for Todoist-style project icons)
      try {
        await db.execute(sql`
          ALTER TABLE projects
          ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '📁'
        `);
        log.info('[migrate] ✅ icon column added/verified in projects table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add icon column to projects:', error);
      }
```

**Step 2: Add migration for `parent_id` column**

Add immediately after the icon migration:

```typescript
      // Add parent_id column for nested projects
      try {
        await db.execute(sql`
          ALTER TABLE projects
          ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES projects(id) ON DELETE SET NULL
        `);
        log.info('[migrate] ✅ parent_id column added/verified in projects table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add parent_id column to projects:', error);
      }
```

**Step 3: Add migration to rename `is_archived` to `archived`**

Add immediately after parent_id migration:

```typescript
      // Rename is_archived to archived (schema uses 'archived')
      try {
        await db.execute(sql`
          ALTER TABLE projects
          RENAME COLUMN is_archived TO archived
        `);
        log.info('[migrate] ✅ is_archived renamed to archived in projects table');
      } catch (error) {
        // Column may already be named 'archived' or not exist
        log.debug('[migrate] is_archived rename skipped (may already be correct)');
      }
```

**Step 4: Add migration to drop `is_favorite` (not in schema)**

```typescript
      // Drop is_favorite column (not in current schema)
      try {
        await db.execute(sql`
          ALTER TABLE projects
          DROP COLUMN IF EXISTS is_favorite
        `);
        log.info('[migrate] ✅ is_favorite column dropped from projects table');
      } catch (error) {
        log.debug('[migrate] is_favorite drop skipped');
      }
```

**Step 5: Restart server to run migrations**

Run: `pkill -f "tsx server"; sleep 2; npm run dev`

Expected: Server logs show migration success messages for projects columns.

**Step 6: Verify API works**

Open browser DevTools Network tab, navigate to dashboard, check `/api/todos-with-metadata` returns 200 (not 500).

**Step 7: Commit**

```bash
git add server/migrate.ts
git commit -m "fix: add missing columns to projects table (icon, parent_id, archived)

Root cause: Schema defined icon/parent_id columns but database didn't have them.
This caused /api/todos-with-metadata to return 500 errors, breaking the Schedule section."
```

---

## Task 2: Fix Day Streak Display (Already Partially Done)

**Files:**
- Verify: `client/src/pages/DashboardV4.tsx` (~line 287-291)

**Step 1: Verify dayStreak computed value exists**

Check that this code is present around line 287:

```typescript
  // Calculate overall day streak (max streak across all habits)
  const dayStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map(h => h.streak?.streak ?? h.streak ?? 0));
  }, [habits]);
```

**Step 2: Verify dayStreak is used in UI**

Check around line 333 that the hardcoded "14" is replaced:

```typescript
<span className="font-heading text-base text-peach-400">{dayStreak}</span>
```

**Step 3: Visual verification**

Navigate to dashboard, verify streak shows actual number (likely 0 if no recent completions) instead of hardcoded 14.

---

## Task 3: Add Dynamic Fun Facts

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx` (add FUN_FACTS array and getDailyFunFact function)

**Step 1: Verify FUN_FACTS array exists**

Check that this array exists around line 61-102:

```typescript
const FUN_FACTS = [
  {
    title: "The Term 'Beta'",
    content: "Climbers call route information 'beta' after Bates Method videos in the 1980s...",
    category: "Climbing Lore",
  },
  // ... more facts
];

function getDailyFunFact() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return FUN_FACTS[dayOfYear % FUN_FACTS.length];
}
```

**Step 2: Verify dynamic fun fact is used in JSX**

Check the Place to Explore card uses getDailyFunFact():

```tsx
{(() => {
  const fact = getDailyFunFact();
  return (
    <LuxuryFunFact
      title={fact.title}
      content={fact.content}
      category={fact.category}
    />
  );
})()}
```

**Step 3: Visual verification**

Navigate to dashboard, verify "Place to Explore" card shows a fun fact. Tomorrow it will show a different one.

---

## Task 4: Fix React Key Warning in Schedule

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx` (~line 517)

**Step 1: Verify unique key fix**

Check that the Schedule grid uses unique keys (day name + index):

```tsx
{week.dayNames.map((day, i) => {
  // ...
  return (
    <div
      key={`${day}-${i}`}  // NOT just key={day} - Tuesday/Thursday both start with 'T'
```

---

## Task 5: Integration Testing

**Step 1: Full dashboard load test**

1. Navigate to http://localhost:5001
2. Open browser DevTools → Network tab
3. Verify these API calls return 200:
   - `/api/habits-with-data` - 200
   - `/api/goals` - 200
   - `/api/todos-with-metadata` - 200 (was 500 before fix)
   - `/api/points` - 200
   - `/api/habit-logs/range/*` - 200

**Step 2: Schedule section verification**

1. If you have todos with due dates this week, they should appear in the Schedule grid
2. Click a todo to toggle completion (should show confetti)
3. Check the todo shows strikethrough after completion

**Step 3: Other components verification**

1. Day streak shows actual number (not hardcoded 14)
2. Points shows actual number
3. Weekly Goals shows goals or "+ Add weekly goals" link
4. Monthly Progress shows progress rings or "+ Add monthly goals" link
5. Weekly Rhythm shows bars for habit completion
6. This Week grid shows habit checkmarks

**Step 4: Commit all changes**

```bash
git add -A
git commit -m "feat: ensure all dashboard V5 components are functional

- Fix projects table schema mismatch (icon, parent_id, archived columns)
- Connect day streak to real habit data
- Add dynamic daily fun facts (8 climbing-themed facts, rotates daily)
- Fix React key warning in Schedule grid"
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] `/api/todos-with-metadata` returns 200 (not 500)
- [ ] Schedule section displays todos (if any exist with due dates this week)
- [ ] Clicking a todo toggles completion with confetti
- [ ] Day streak shows actual number from habit data
- [ ] Fun fact changes daily (can verify by checking different facts exist in array)
- [ ] No console errors in browser DevTools
- [ ] No server errors in terminal logs
