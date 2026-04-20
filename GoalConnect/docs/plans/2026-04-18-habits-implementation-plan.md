# GoalConnect Habits Rewrite — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Hand off to executing-plans in batches (Batch A, Batch B, Batch C, Batch D) with Lauren-review checkpoints between each.

**Goal:** Rewrite the GoalConnect habits system so Lauren can log today, log past days, edit any log, and use one consistent menu — without the bugs that silently break streaks or swallow errors.

**Architecture:** Collapse 27 roast findings via 9 simplification cascades. The keystone: the habit row IS the week — every log interaction becomes "tap a cell for a date." Three new components (`WeekRow`, `HabitLogEditor`, `HabitActionsMenu`) plus a unified mutations hook and one new weekly endpoint replace four orphan dialogs, three edit/delete implementations, the backfill dialog, the date-picker input, and server-side timezone logic.

**Tech Stack:** React 18 + Vite + Wouter + TanStack Query v5 + Tailwind + Express + Drizzle + Postgres. Design system: Sundown tokens at `client/src/styles/sundown-tokens.css`.

**Inputs:**
- [2026-04-18-habits-roast.md](./2026-04-18-habits-roast.md) — 27 findings (R1-R21), roadmap, psychology layer
- [2026-04-18-habits-simplification.md](./2026-04-18-habits-simplification.md) — 9 cascades (C1-C9), deletion map, risk register

**Research sources (already consulted during roast):**
- Loop Habit Tracker (open-source Android, in-repo at `uhabits-audit/`) — week-row reference pattern
- Streaks / Atoms / Duolingo — competitive analysis in roast appendix
- TanStack Query v5 docs — optimistic update + rollback pattern
- Drizzle `onConflictDoUpdate` — atomic upsert
- WCAG 2.2 — 44×44 touch target minimum

**Production Checklist:**
- [x] Centralized config — `useHabitMutations` hook is single source of truth (C2)
- [x] Error boundaries — existing boundaries on Sundown tabs stay; no new risky components added
- [x] Skeleton loading states — week-row renders 7 dim cells during query load
- [x] Toast notifications for mutations — default-on in `useHabitMutations` (C9)
- [x] Optimistic updates — baked into `useHabitMutations` (C2)
- [x] Mobile-friendly touch targets — `.sd-touch` utility, 44×44 minimum (C8)
- [x] E2E tests — `tests/habits.spec.ts` + `tests/e2e-audit/audit.py` view switcher
- [x] Accessibility basics — `aria-current="date"` on today cell, `aria-label` on all kebab menus

---

## Preflight accounting (FULL mode)

- **Files touched:** 20+ (new components, rewrites, deletions)
- **Integrations:** 1 new API endpoint, 1 DB upsert pattern change
- **Unknowns:** Mobile bottom-sheet animation polish (visual-review gate)
- **Gate 0–5 checkpoints:** every batch ends with a checkpoint; Gate 7 (completeness audit) after Batch D

## Migration-risk call-out

**ONE migration-risk task: T7 (new `/api/habits/week` endpoint).** Old endpoints (`/api/habits`, `/api/habit-logs/range/*`, `/api/habit-logs/toggle`, etc.) stay alive through the rewrite. Only deleted in Batch D after all consumers are ported and E2E green. No schema changes.

## Visual-review gate

**ONE visual-review gate: end of Batch B, after T9 (WeekRow component).** Lauren previews a mockup/screenshot before any page is rewritten. If the week-row feels wrong visually, we iterate before spending effort on Batch C. See T9 for details.

## E2E test scope

- `tests/habits.spec.ts` — needs updates for new week-row interaction (tap cell instead of toggle button)
- `tests/e2e-audit/audit.py:205-222` — view switcher already trimmed this session (Rings removed). Needs a new test asserting week-row cells are tappable + backfill works via past-cell tap
- `tests/verify-audit-fixes.spec.ts` — regression tests; add cases for: no silent toggle failure, date ≤ today server-side

---

## Code style rules (enforced)

- **No hardcoded colors.** Use `var(--sd-*)` from `sundown-tokens.css`. CI can grep for `#[0-9a-f]{3,6}` in `client/src/components/sundown/` as a sanity check.
- **No dark mode.** Only Sundown.
- **No arrows in UI copy.** No "→", "↑", "↓", "⇒", "=>" in any visible string. Keywords only in code.
- **Lauren-voice in UI copy.** Conversational, plain. If empty state sounds like a CMS template, rewrite.
- **TypeScript strict.** No `any`. Use `unknown` + narrow.
- **Zod on server inputs.** Every new/changed endpoint route validates body.
- **TanStack Query for server state.** No ad-hoc `useState` + fetch.
- **`apiRequest(url, method, data)`** — that arg order. URL first, method second. Never swap.
- **Touch targets ≥ 44×44.** Use `.sd-touch` utility class added in T1.

---

## Batch structure

| Batch | Theme | Tasks | Effort | Gate |
|-------|-------|-------|--------|------|
| **A** | Foundations (non-UI) | T1–T8 | ~6-7 hrs | Lauren review: run typecheck, smoke test old flows still work |
| **B** | New components | T9–T11 | ~1.5-2 days | **Visual review** of WeekRow before Batch C |
| **C** | Page rewrites | T12–T14 | ~1-1.5 days | Playwright green + Lauren manual walk |
| **D** | Cleanup | T15–T18 | ~2-3 hrs | Gate 7 completeness audit, nothing regressed |

**Total: ~4-5 days of focused work.**

## Critical path

**T1 (time) → T2 (sd-touch) → T3 (useHabitMutations) → T7 (week endpoint) → T9 (WeekRow) → T12 (Habits.tsx rewrite) → T15 (delete orphans)**

Everything else is parallel-izable within its batch.

---

# Batch A — Foundations

## T1. Confirm `getToday()` canonical, delete server-side date-construction

**Dependencies:** none
**Resolves:** R1, R13, C5
**Effort:** 1 hr

**Context:** `client/src/lib/utils.ts:22` already has `getToday()` returning local YYYY-MM-DD via `formatDateInput(new Date())`. The bug is that `server/routes/habits.ts` constructs its own "today" via `new Date().toISOString().split('T')[0]` (UTC). Cascade 5 says: client owns the calendar.

**Files:**
- Modify: `server/routes/habits.ts` — all call sites of `new Date().toISOString()` or similar for "today" logic in the habits routes
- Modify: `client/src/lib/utils.ts` — add doc comment above `getToday()` declaring it the only source of truth
- Grep-check: `grep -rn "new Date().toISOString()" server/routes/habits.ts` should return zero matches after this task for any "today" semantics

**Approach:**
- For the toggle handler: the client already sends `date` in the body. Trust it. No server-side "today" needed.
- For bonus logic (`awardDailyBonusIfNeeded`, all-done, early-bird): the client sends the local date + local hour in the toggle body: `{ date, localHour, clientTzOffsetMinutes }`. Server reads these values instead of constructing.
- For streak calculation (wherever `server/routes/habits.ts:36` is called from): same — read the client-provided date for "reference today."

**Verification:**
```bash
cd GoalConnect
grep -n "new Date()" server/routes/habits.ts
# Acceptable: timestamps for createdAt, updatedAt
# NOT acceptable: new Date().toISOString() used for calendar-day comparisons
npm run check
```

**Commit:** `fix(habits): client owns the calendar, server reads date from request`

---

## T2. Add `.sd-touch` utility class

**Dependencies:** none
**Resolves:** R10, C8
**Effort:** 20 min

**Files:**
- Modify: `client/src/styles/sundown-tokens.css` — append to end

**Add:**
```css
/* === TOUCH TARGETS === */
.sd-touch {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.sd-touch:focus-visible {
  outline: 2px solid var(--sd-accent);
  outline-offset: 2px;
}
```

**Verification:** visual — any element given `.sd-touch` renders at 44×44 min.

**Commit:** `design: add .sd-touch 44x44 utility for WCAG AA minimum`

---

## T3. Create `useHabitMutations` hook

**Dependencies:** T1
**Resolves:** C2, C9, R4, R11, R18
**Effort:** 3 hrs

**Files:**
- Create: `client/src/hooks/useHabitMutations.ts`

**Skeleton:**
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Habit, HabitLog, InsertHabit } from "@shared/schema";

export interface ToggleInput {
  habitId: number;
  date: string; // YYYY-MM-DD, client-local
  localHour: number; // 0-23, client-local
  note?: string;
  mood?: number;
  energy?: number;
  quantityCompleted?: number;
  durationMinutes?: number;
  sessionType?: string;
  // incrementValue: if omitted, server toggles (complete true<->false); if set, increments
  incrementValue?: number;
}

export function useHabitMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateHabitQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/habits/week"] });
    queryClient.invalidateQueries({ queryKey: ["/api/habits"] }); // legacy, remove in T17
    queryClient.invalidateQueries({ queryKey: ["/api/points"] });
  };

  const toggle = useMutation<HabitLog, Error, ToggleInput, { previous: unknown }>({
    mutationFn: (input) => apiRequest("/api/habit-logs/toggle", "POST", input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["/api/habits/week"] });
      const previous = queryClient.getQueryData(["/api/habits/week"]);
      // Optimistic: flip the cell for (habitId, date) in the cached week data
      queryClient.setQueryData(["/api/habits/week"], (old: any) => {
        if (!old) return old;
        return optimisticToggle(old, input);
      });
      return { previous };
    },
    onError: (err, _input, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["/api/habits/week"], ctx.previous);
      toast({
        title: "Couldn't save that",
        description: err.message || "Give it another tap.",
        variant: "destructive",
      });
    },
    onSettled: invalidateHabitQueries,
  });

  const create = useMutation<Habit, Error, InsertHabit>({ /* similar shape */ });
  const update = useMutation<Habit, Error, { id: number; patch: Partial<Habit> }>({ /* ... */ });
  const del = useMutation<void, Error, number>({ /* ... */ });
  const archive = useMutation<Habit, Error, number>({ /* ... */ });

  return { toggle, create, update, delete: del, archive };
}

// Helper — pure function, testable
function optimisticToggle(old: WeekResponse, input: ToggleInput): WeekResponse {
  return {
    ...old,
    habits: old.habits.map((h) => {
      if (h.id !== input.habitId) return h;
      return {
        ...h,
        logs: applyOptimisticLog(h.logs, input),
      };
    }),
  };
}
```

**Verification:**
- Type-check: `npm run check`
- Unit test: `client/src/hooks/useHabitMutations.test.ts` — mock `apiRequest`, assert toast fires on error, assert rollback on error
- Run: `npm run test:unit -- useHabitMutations`

**Commit:** `feat(habits): useHabitMutations hook with optimistic updates + error toasts`

---

## T4. Server — `POST /api/habit-logs/toggle` uses `ON CONFLICT DO UPDATE`

**Dependencies:** T1
**Resolves:** R2, C6
**Effort:** 1 hr

**Files:**
- Modify: `server/routes/habits.ts` — the toggle handler around line 460-705

**Changes:**
- Add Zod schema at the top of the file:
  ```ts
  const toggleBodySchema = z.object({
    habitId: z.number().int().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    localHour: z.number().int().min(0).max(23),
    note: z.string().optional(),
    mood: z.number().int().min(1).max(5).optional(),
    energy: z.number().int().min(1).max(5).optional(),
    quantityCompleted: z.number().optional(),
    durationMinutes: z.number().optional(),
    sessionType: z.string().optional(),
    incrementValue: z.number().optional(),
  });
  ```
- Validate body first. 400 on parse failure.
- Validate `date <= <30-day-future-buffer>` — reject further future to prevent data poisoning while allowing timezone slop. (See R3.)
- Authz: verify habit belongs to `req.session.userId`. If not, 403.
- Replace fetch-then-insert with:
  ```ts
  await db.insert(habitLogs).values({ ... }).onConflictDoUpdate({
    target: [habitLogs.habitId, habitLogs.userId, habitLogs.date],
    set: { completed, note, mood, energy, ... }
  }).returning();
  ```
- Linked-goal update, streak recalc, XP: keep existing logic but return any non-fatal errors in response body as `warnings: string[]` so client can toast them (R5, R11).

**Verification:**
- Manual: curl the endpoint with same `(habitId, date)` twice concurrently; assert no 500, no duplicate row:
  ```bash
  # In psql
  SELECT habit_id, user_id, date, COUNT(*) FROM habit_logs GROUP BY 1,2,3 HAVING COUNT(*) > 1;
  # Expected: zero rows
  ```
- Unit test: `server/routes/habits.test.ts` (create if missing) — test date validation, authz, upsert idempotency
- Playwright: `tests/habits.spec.ts` still green

**Commit:** `fix(habits): upsert on toggle, validate date + authz, surface warnings`

---

## T5. Server — centralize "future date" validation

**Dependencies:** T4
**Resolves:** R3
**Effort:** 20 min

**Files:**
- Modify: `server/routes/habits.ts` — add helper near Zod schemas:
  ```ts
  function isValidLogDate(clientDate: string): boolean {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const parsed = new Date(clientDate + "T00:00:00Z");
    return parsed <= thirtyDaysFromNow && parsed.getFullYear() >= 2020;
  }
  ```
- Use it in the toggle handler. 400 with `{ error: "Date out of range" }` on failure.

**Verification:**
```bash
curl -X POST http://localhost:5000/api/habit-logs/toggle \
  -H "Content-Type: application/json" \
  -d '{"habitId":1,"date":"2099-01-01","localHour":12}'
# Expected: 400
```

**Commit:** `fix(habits): reject future dates beyond 30-day buffer on toggle`

---

## T6. Server — `GET /api/habits/week?weekStart=YYYY-MM-DD` endpoint

**Dependencies:** T1, T4
**Resolves:** C7
**Effort:** 2 hrs

**Files:**
- Modify: `server/routes/habits.ts` — add new route handler

**Handler shape:**
```ts
app.get("/api/habits/week", requireAuth, async (req, res) => {
  const { weekStart } = req.query;
  const parsed = weekStartSchema.safeParse(weekStart);
  if (!parsed.success) return res.status(400).json({ error: "Invalid weekStart" });

  const userId = req.session.userId!;
  const startDate = parsed.data;
  const endDate = addDays(startDate, 6); // YYYY-MM-DD string math

  const habits = await storage.getHabitsByUser(userId);
  const logs = await storage.getHabitLogsInRange(userId, startDate, endDate);

  const logMap = new Map<string, HabitLog>();
  logs.forEach(l => logMap.set(`${l.habitId}:${l.date}`, l));

  const weekDates = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(startDate, i));
  const response = {
    weekStart: startDate,
    weekDates,
    habits: habits.map(h => ({
      ...h,
      logs: weekDates.map(d => logMap.get(`${h.id}:${d}`) ?? null),
      streak: computeStreak(h.id, logs),
      weeklyProgress: h.weeklyTarget ? { done: countDone(h.id, logs), target: h.weeklyTarget } : null,
    })),
  };

  res.json(response);
});
```

**Verification:**
```bash
curl "http://localhost:5000/api/habits/week?weekStart=2026-04-13" -H "Cookie: ..."
# Expected: 200 with { weekStart, weekDates[7], habits[] }
```

**Commit:** `feat(habits): GET /api/habits/week returns habits + week-logs + streak`

---

## T7. Client — migrate `useQuery` keys to `/api/habits/week` (old keys stay alive)

**Dependencies:** T6
**Resolves:** C7
**Effort:** 30 min

**Files:**
- Modify: `client/src/hooks/useHabitMutations.ts` — invalidation keys already reference `["/api/habits/week"]`
- No changes to pages yet. Just verify the new endpoint is callable from the client.

**Verification:**
- Open React Query devtools, manually call `queryClient.fetchQuery({ queryKey: ["/api/habits/week", weekStart] })`, inspect response.

**Commit:** (none — this is a verification task, not a code change)

---

## T8. Bubble server warnings to client toasts

**Dependencies:** T3, T4
**Resolves:** R5, R11, R18
**Effort:** 30 min

**Files:**
- Modify: `client/src/hooks/useHabitMutations.ts` — in toggle's `onSuccess`:
  ```ts
  onSuccess: (response) => {
    if (response.warnings?.length) {
      response.warnings.forEach(w => {
        toast({ title: "Saved with a hiccup", description: w });
      });
    }
  },
  ```

**Verification:** Manually kill the linked-goal update path server-side, toggle a linked habit, confirm warning toast fires.

**Commit:** `feat(habits): surface server-side warnings as toast notifications`

---

### Batch A checkpoint (Lauren review)

```
[ ] npm run check — green
[ ] npm test — green (unit)
[ ] GET /api/habits/week returns valid shape
[ ] POST /api/habit-logs/toggle (new) passes idempotency test
[ ] Old endpoints still live; old Habits.tsx still works (nothing rewritten yet)
[ ] Lauren smoke-tests: toggle a habit, verify still works
```

---

# Batch B — New components

## T9. Create `<WeekRow>` component  ⭐ **VISUAL REVIEW GATE**

**Dependencies:** T2, T3
**Resolves:** C1, C8, R9, R10
**Effort:** 1 day (including mockup + iteration)

**Files:**
- Create: `client/src/components/sundown/WeekRow.tsx`
- Create: `client/src/styles/sundown-tokens.css` additions (week-cell tokens)

**Tokens to add to `sundown-tokens.css`:**
```css
--sd-week-cell-bg-empty: rgba(85, 48, 52, 0.3);
--sd-week-cell-bg-complete: linear-gradient(135deg, var(--sd-accent) 0%, var(--sd-accent-mid) 100%);
--sd-week-cell-bg-today-idle: rgba(225, 164, 92, 0.15);
--sd-week-cell-border: rgba(225, 164, 92, 0.2);
--sd-week-cell-border-today: var(--sd-accent);
--sd-week-cell-glow-complete: 0 0 12px rgba(225, 164, 92, 0.4);
```

**Component signature:**
```ts
interface WeekRowProps {
  habit: EnrichedHabit;
  weekDates: string[]; // 7 YYYY-MM-DD, leftmost = oldest
  logs: (HabitLog | null)[]; // parallel to weekDates
  onToggle: (date: string) => void;
  onLongPress: (date: string, existingLog: HabitLog | null) => void;
}
```

**Behavior:**
- Renders 7 `<button class="sd-touch sd-week-cell">` elements.
- Cell visual states:
  - Complete → `background: var(--sd-week-cell-bg-complete); box-shadow: var(--sd-week-cell-glow-complete)`
  - Empty past → `background: var(--sd-week-cell-bg-empty); border: 1px solid var(--sd-week-cell-border)`
  - Empty today → `background: var(--sd-week-cell-bg-today-idle); border: 2px solid var(--sd-week-cell-border-today)`
  - Future → `opacity: 0.3; pointer-events: none`
- Today has `aria-current="date"`.
- Each cell has `aria-label={`${dayOfWeek} ${date}, ${complete ? 'complete' : 'empty'}, tap to toggle`}`.
- Long-press via `useLongPress` hook (500ms, cancels on movement). Calls `onLongPress`.
- Tap calls `onToggle`.
- Weekly day labels (Sat / Sun / M / T / W / T / F) rendered above the cells in a small row.

**Visual review deliverable:**
Before proceeding to Batch C, produce:
1. Screenshot of the component rendered with 3 sample habits (1 full streak, 1 spotty, 1 empty), at desktop + mobile widths.
2. Post in conversation: "Week-row visual review: approve / iterate?"

**Verification:**
- Storybook-free: render the component in `/habits` page as a throwaway demo before Batch C officially starts. (Revert the demo after review.)
- `npm run check`
- Manual tap on mobile (real device or Chrome devtools mobile emulation): cells register taps, 44×44 min

**Commit:** `feat(habits): WeekRow component — 7 tappable day cells with Sundown tokens`

---

## T10. Create `<HabitLogEditor>` (replaces 4 orphan dialogs)

**Dependencies:** T3, T9
**Resolves:** C3, R7
**Effort:** 4-5 hrs

**Files:**
- Create: `client/src/components/sundown/HabitLogEditor.tsx`

**Component signature:**
```ts
interface HabitLogEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit;
  date: string;
  existingLog: HabitLog | null;
  mode?: "edit" | "view";
}
```

**Behavior:**
- Sundown-themed bottom sheet on mobile, popover/dialog on desktop.
- Fields rendered conditionally based on `habit` configuration:
  - Always: `completed` (checkbox)
  - If `habit.trackMood`: mood (1-5 radio pills)
  - If `habit.trackEnergy`: energy (1-5 radio pills)
  - If `habit.trackQuantity`: quantity input
  - If `habit.trackDuration`: duration input (minutes)
  - If `habit.allowSessionType`: session type dropdown
  - Always: note (textarea)
- Save button: calls `toggle` mutation with all fields.
- Clear log button: calls `toggle` with `completed: false` (removes or soft-clears).
- Mode `"view"` renders all fields read-only with an "Edit" affordance.

**Verification:**
- Manual: open on a quantity-tracking habit, fill quantity, save, close. Re-open; values persisted.
- `npm run check`

**Commit:** `feat(habits): HabitLogEditor — unified log editing, replaces 4 orphan dialogs`

---

## T11. Create `<HabitActionsMenu>` (kebab menu)

**Dependencies:** T3
**Resolves:** C4, R6
**Effort:** 3 hrs

**Files:**
- Create: `client/src/components/sundown/HabitActionsMenu.tsx`

**Component signature:**
```ts
interface HabitActionsMenuProps {
  habit: Habit;
}
```

**Behavior:**
- Renders a kebab button (`⋮`, `.sd-touch` class).
- Click opens a Sundown-themed bottom sheet (mobile) or popover (desktop).
- Menu items:
  - **Edit** — opens existing `HabitCreateDialog` in edit mode.
  - **Archive** — calls `archive` mutation. No confirm (reversible).
  - **Delete** — opens confirm dialog, then calls `delete` mutation.
  - **View insights** — navigates to `/habit-insights?id=${habit.id}`.
- All actions use `useHabitMutations` — no inline mutation logic.

**Verification:**
- Manual: kebab on one habit, tap Edit, dialog opens pre-filled. Tap Delete, confirm, habit gone.
- `npm run check`

**Commit:** `feat(habits): HabitActionsMenu — unified kebab for edit/archive/delete/insights`

---

### Batch B checkpoint (Lauren visual review)

```
[ ] WeekRow screenshot approved (desktop + mobile)
[ ] HabitLogEditor opens + saves fields correctly
[ ] HabitActionsMenu opens + all actions work
[ ] Sundown tokens consistent — no hardcoded colors (grep check)
[ ] All touch targets ≥ 44px (measure in devtools)
```

---

# Batch C — Page rewrites

## T12. Rewrite `Habits.tsx` to use WeekRow + HabitActionsMenu

**Dependencies:** T3, T6, T9, T10, T11
**Resolves:** R6, R8, R9, R15, R16, R17, R19, R20
**Effort:** 4-5 hrs

**Files:**
- Modify: `client/src/pages/Habits.tsx`

**Changes:**
- Remove: `toggleMutation`, `backfillMutation` (replaced by `useHabitMutations`).
- Remove: date-picker input + label (R8).
- Remove: backfill dialog entirely (C1 — backfill is a cell tap).
- Remove: contribution graph from this page (moved to insights eventually; for now it's gone from primary surface).
- Remove: duplicate `+ New Habit` button in empty state (keeps header button only).
- Replace habit rendering with:
  ```tsx
  <div className="sd-habits-list">
    {habits.map(h => (
      <div key={h.id} className="sd-habit-row">
        <div className="sd-habit-meta">
          <span className="sd-habit-name">{h.name}</span>
          <span className="sd-habit-streak">{h.streak}d</span>
        </div>
        <WeekRow
          habit={h}
          weekDates={weekDates}
          logs={h.logs}
          onToggle={(date) => toggle.mutate({ habitId: h.id, date, localHour: new Date().getHours() })}
          onLongPress={(date, log) => setEditor({ habit: h, date, log })}
        />
        <HabitActionsMenu habit={h} />
      </div>
    ))}
  </div>
  ```
- Add `HabitLogEditor` mount + controlled state.
- Empty state copy (Lauren-voice): replace "No habits yet. Start building better habits today." with something like: "Nothing to track yet. Pick one thing — small — you'd like to do most days."

**Verification:**
- Playwright: `tests/habits.spec.ts` updated — replace `click('[data-testid="toggle-habit-..."]')` with `click('[data-testid="week-cell-${date}-${habitId}"]')`. Assert cell color changes post-tap.
- Manual: toggle today, past day, future day (should be disabled). Verify each case.

**Commit:** `refactor(habits): Habits page uses WeekRow + HabitActionsMenu + HabitLogEditor`

---

## T13. Rewrite `SundownHabitsTab.tsx` to use same components

**Dependencies:** T12
**Resolves:** R6, C1, C2, C4
**Effort:** 3 hrs

**Files:**
- Modify: `client/src/components/sundown/SundownHabitsTab.tsx`

**Changes:**
- Remove: inline edit/delete buttons, local `toggleMutation` plumbing.
- Remove: the "today" / "week" view pill toggle (week-row is inherently both — today is just rightmost).
- Render the same WeekRow + HabitActionsMenu layout as T12, but wrapped in the Sundown tab styling.
- Data source: query `["/api/habits/week", weekStart]` — same as `Habits.tsx`.

**Verification:**
- Open dashboard, Habits tab, interact exactly like T12.
- Both pages show same data, synchronized via invalidations.

**Commit:** `refactor(habits): SundownHabitsTab uses shared WeekRow + mutations hook`

---

## T14. Update Playwright tests

**Dependencies:** T12, T13
**Effort:** 2 hrs

**Files:**
- Modify: `tests/habits.spec.ts`
- Modify: `tests/e2e-audit/audit.py` — update habit flow assertions
- Modify: `tests/verify-audit-fixes.spec.ts` — new regressions

**New test cases:**
- Tap a past-week cell → cell turns complete, assert via data-testid or computed style.
- Tap the same cell again → uncompletes. Atomic round-trip.
- Long-press a cell → editor opens.
- Delete habit via kebab → habit gone.
- Network 500 simulation → toast appears, cell rolls back.
- Date validation: send future date via direct API call → server returns 400.

**Verification:**
```bash
npm test
npm run test:unit
```

**Commit:** `test(habits): Playwright + unit tests for new week-row interaction`

---

### Batch C checkpoint (Lauren manual walk + Playwright green)

```
[ ] npm test — all green
[ ] npm run check — green
[ ] Lauren walks /habits:
   [ ] Tap today cell — completes
   [ ] Tap yesterday cell — backfills (her core complaint SOLVED)
   [ ] Tap 3 past days — multi-day log (her other core complaint SOLVED)
   [ ] Long-press cell — editor opens with right fields
   [ ] Kebab menu — edit/delete/archive/insights all work
[ ] Lauren walks Sundown dashboard Habits tab — same behavior
[ ] Mobile (real device): all touch targets reachable, no fat-finger
```

---

# Batch D — Cleanup

## T15. Delete orphan dialog components

**Dependencies:** T10
**Resolves:** R7
**Effort:** 15 min

**Files (delete):**
- `client/src/components/HabitDetailDialog.tsx`
- `client/src/components/HabitLogDialog.tsx`
- `client/src/components/HabitCompletionDialog.tsx` (content superseded by `HabitLogEditor`)
- `client/src/components/HabitNoteDialog.tsx`

**Verification:**
```bash
grep -rn "HabitDetailDialog\|HabitLogDialog\|HabitCompletionDialog\|HabitNoteDialog" client/src
# Expected: zero matches
npm run check
```

**Commit:** `chore(habits): delete 4 orphan dialog components superseded by HabitLogEditor`

---

## T16. Delete inline edit/delete buttons leftover anywhere

**Dependencies:** T12, T13
**Resolves:** R6
**Effort:** 30 min

**Files:**
- Audit: `client/src/components/HabitCard.tsx` — remove edit/delete buttons if still present (might be legitimately deleted in T12/T13 already)
- Audit: `client/src/pages/HabitInsights.tsx` — replace inline edit/delete with `<HabitActionsMenu>`

**Verification:**
```bash
grep -rn "data-testid=\"edit-habit-\|data-testid=\"delete-habit-" client/src
# Expected: references only inside HabitActionsMenu
```

**Commit:** `refactor(habits): remove leftover inline edit/delete, use HabitActionsMenu everywhere`

---

## T17. Delete legacy habit endpoints + invalidation keys

**Dependencies:** T12, T13, T14
**Resolves:** C7
**Effort:** 1 hr

**Files:**
- Modify: `server/routes/habits.ts` — delete endpoints no longer used by the client:
  - `POST /api/habit-logs` (if `/toggle` fully replaces it) — verify with `grep apiRequest.*habit-logs.*POST` client-side, exclude `/toggle`
  - `GET /api/habit-logs/range/*` (if `/api/habits/week` replaces it)
  - `GET /api/habits-with-data` (if `/api/habits/week` replaces it)
- Modify: `client/src/hooks/useHabitMutations.ts` — remove the legacy `["/api/habits"]` invalidation key

**Approach:** Before deleting, `grep -rn "habit-logs/range\|habits-with-data" client/src` and confirm zero callers. Only delete after all consumers are on the new endpoint.

**Verification:**
- `npm run check`
- `npm test`
- Manual: toggle a habit, confirm UI updates correctly.

**Commit:** `chore(habits): delete legacy endpoints superseded by /api/habits/week`

---

## T18. Final audit — no hardcoded colors, no arrows, no textbook voice

**Dependencies:** all previous
**Resolves:** CLAUDE.md rules + Lauren's hard rules
**Effort:** 30 min

**Checks:**
```bash
# Hardcoded colors in new files
grep -nE "#[0-9a-fA-F]{3,6}|rgba?\(" client/src/components/sundown/WeekRow.tsx client/src/components/sundown/HabitLogEditor.tsx client/src/components/sundown/HabitActionsMenu.tsx client/src/hooks/useHabitMutations.ts
# Expected: zero matches in inline styles; all colors via var(--sd-*)

# Arrows in UI strings (code only, not docs)
grep -rnE "→|↑|↓|⇒" client/src/components/sundown/ client/src/pages/Habits.tsx
# Expected: zero

# Textbook voice heuristics (grep for generic phrases)
grep -rniE "start building|track your progress|achieve your goals|daily consistency" client/src
# Expected: zero (replace any hits with Lauren-voice)
```

**Verification:** all three greps return zero.

**Commit:** `chore(habits): final audit — tokens only, no arrows, no textbook voice`

---

### Batch D checkpoint (Gate 7 completeness audit)

```
[ ] All 27 roast findings addressed (map each R to the commit that fixed it)
[ ] All 9 cascades executed (map each C to files that embody it)
[ ] Playwright full suite green
[ ] Typecheck green
[ ] No orphan components remain
[ ] No hardcoded colors in habits code
[ ] No arrows in UI strings
[ ] Empty state copy sounds like Lauren
[ ] Mobile tested on real device
[ ] Lauren final walk-through — "does this feel right?"
```

---

## Finding → Task traceability

| Finding | Task | Batch |
|---------|------|-------|
| R1 streak timezone reset | T1 | A |
| R2 toggle race duplicates | T4 | A |
| R3 no future-date validation | T5 | A |
| R4 silent toggle failure | T3, T8 | A |
| R5 swallowed linked-goal error | T4, T8 | A |
| R6 edit/delete duplicated 3x | T11, T12, T13, T16 | B, C, D |
| R7 4 orphan dialogs | T10, T15 | B, D |
| R8 backfill zero discoverability | T9, T12 | B, C |
| R9 no week-row | T9 | B |
| R10 touch targets < 44px | T2, T9, T11 | A, B |
| R11 swallowed bonus errors | T4, T8 | A |
| R12 partial authz on log write | T4 | A |
| R13 server-time bonuses | T1 | A |
| R14 non-transactional score | T4 | A |
| R15 textbook-voice empty state | T12, T18 | C, D |
| R16 no confirm on backfill | T12 (removed entirely) | C |
| R17 empty graph title | T12 (graph removed) | C |
| R18 over-broad invalidations | T3 | A |
| R19 no loading skeleton | T9 (skeleton cells) | B |
| R20 no optimistic updates | T3 | A |
| R21 loose typing | T13 | C |

| Cascade | Tasks |
|---------|-------|
| C1 week-row | T9, T12, T13 |
| C2 useHabitMutations | T3, T12, T13 |
| C3 HabitLogEditor | T10, T15 |
| C4 HabitActionsMenu | T11, T12, T13 |
| C5 client owns calendar | T1 |
| C6 upsert | T4 |
| C7 one endpoint | T6, T7, T17 |
| C8 sd-touch | T2, T9, T11 |
| C9 default error toasts | T3, T8 |

---

## Execution Handoff

**Plan complete.** Next up:

**Subagent-Driven (this session)** — recommended per Lauren's preference for review checkpoints:
- Dispatch fresh subagent per task (or batch)
- Code-review between batches
- Lauren reviews Batch A before B starts, Batch B visual before C, Batch C walkthrough before D

**Required sub-skill:** `superpowers:executing-plans` consumes this file batch-by-batch.
