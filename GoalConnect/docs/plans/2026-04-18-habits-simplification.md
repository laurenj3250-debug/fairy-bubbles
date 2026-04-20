# Habits Simplification Cascade Analysis

> **Date:** 2026-04-18
> **Input:** `2026-04-18-habits-roast.md` (27 findings)
> **Output:** Nine cascade insights. Four of them collapse multiple components each.
> **Net effect:** ~14 components/implementations deleted. 4-5 new ones added. ~60% code reduction in the habits domain.

---

## Method

For each candidate insight, apply: **"Everything is a special case of ___"**. If the sentence completes cleanly and all edge cases fit, it's a cascade. Stress-test with at least 5 edge cases per candidate. Measure cascade by counting deletions, not by abstract "cleanness."

## Summary table

| # | Cascade insight | Components eliminated | Remains |
|---|-----------------|-----------------------|---------|
| 1 | Every log operation is a special case of "tap a cell for a date" | Backfill dialog, date-picker input, duplicate + button, contribution graph on main page | One `<WeekRow>` |
| 2 | Every client-side habit mutation is a special case of "optimistic mutation with toast-on-error" | Duplicate toggle/create/update/delete logic in Habits.tsx, SundownHabitsTab.tsx, HabitInsights.tsx, 5 ad-hoc `invalidateQueries` blocks | One `useHabitMutations` hook |
| 3 | Every per-log interaction is a special case of editing habit_log row metadata | All 4 orphan dialogs (HabitDetailDialog, HabitLogDialog, HabitCompletionDialog, HabitNoteDialog) | One `<HabitLogEditor>` |
| 4 | Every habit-level action is a special case of a kebab-menu item | Inline edit/delete buttons in 3 components | One `<HabitActionsMenu>` |
| 5 | The client owns the calendar; the server stores strings | Server-side `new Date().toISOString()` calls, timezone comparisons, server-time-dependent bonuses | One `getTodayLocal()` util |
| 6 | Every habit_log write is a special case of "upsert on (habitId, userId, date)" | Fetch-then-insert pattern, race conditions, separate `/api/habit-logs` POST vs `/api/habit-logs/toggle` | One DB upsert call |
| 7 | Every habit list surface consumes the same enriched shape | Parallel `/api/habits`, `/api/habit-logs/range/*`, `/api/habits-with-data` queries; client-side log-map construction in 2+ places | One `/api/habits/week?weekStart=YYYY-MM-DD` endpoint |
| 8 | Every habit interaction point is a special case of a 44×44 tap target | Ad-hoc 28/40/12/20px sizes across 4+ components | One `.sd-touch` utility class |
| 9 | Every mutation failure surfaces through the same toast pipeline | Missing `onError` handlers, "I forgot to add it" bugs | `toastError` default inside `useHabitMutations` |

---

## Cascade 1: The week-row as sole log-interaction surface

**Claim:** *Every log operation is a special case of "tap a cell for a date."*

- Today toggle = tap the rightmost cell
- Backfill = tap a past cell
- Multi-day log = tap multiple cells
- Uncomplete = tap an already-filled cell
- Quantity/duration/note = long-press any cell (opens `HabitLogEditor`)
- Zoomed-out history view = same cells, wider window

**Stress tests:**

| Edge case | Does the week-row hold? |
|-----------|------------------------|
| Quantity habits ("drink 8 glasses") | Yes — cell shows progress ring. Tap increments; long-press for precise value. |
| Duration habits ("meditate 10 min") | Yes — same ring treatment. Tap adds default increment. |
| Weekly-frequency habits ("run 3x/week") | Yes — daily cells still work. Small counter ("2/3 this week") below row shows weekly progress. |
| Session-type habits (multiple types per habit) | Yes — tap = default session type; long-press opens editor with picker. |
| Skip-day state (future feature) | Yes — cell supports a third visual state (dotted outline). |
| Archived habits | Yes — filtered out server-side. |
| Linked-goal habits | Yes — the gesture triggers a server-side cascade; the UI doesn't change. Errors surface via Cascade 9. |
| Contribution graph value | Lives in insights view only (90-day scale). Not deleted, demoted. |

**Eliminated:**
- Date-picker input + label (`Habits.tsx:219-226`)
- Backfill mutation + dialog (`Habits.tsx:77-88, 304-381`)
- Contribution graph as primary surface on `/habits`
- Duplicate `+ New Habit` button on empty state
- The concept of "backfill" as a separate user flow

**Remains:**
- One `<WeekRow habit logMap weekDates onToggle onLongPress />` component, rendered once per habit row.
- Contribution graph, moved to insights panel (optional).

**Components eliminated: 4 + one whole user flow.**

---

## Cascade 2: `useHabitMutations` as single client-side data flow

**Claim:** *Every client-side habit mutation is a special case of "optimistic update, toast on error, fine-grained invalidation."*

CRUD operations (create, update, delete, archive), toggle, reorder — all share a pattern:
1. Fire API call
2. Optimistically update local cache
3. On success, invalidate the right query keys
4. On error, roll back and toast

Right now this pattern is re-implemented (partially) in `Habits.tsx`, `SundownHabitsTab.tsx`, and presumably `HabitInsights.tsx`, with different invalidation sets, different (or missing) error handlers, different optimistic behaviors.

**Stress tests:**

| Edge case | Does the hook hold? |
|-----------|---------------------|
| Toggle on today | `toggle(habitId, today)` — optimistic cell flip; rollback + toast on error |
| Backfill past day | `toggle(habitId, pastDate)` — same mutation, no branch |
| Create habit from any surface | `create(habit)` — invalidates habit list queries everywhere |
| Delete with dependents (logs exist) | Server-side ON DELETE CASCADE handles it; hook just invalidates |
| Rapid fire toggles (race) | React Query handles in-flight deduplication; combined with Cascade 6 (server upsert) no duplicate rows |
| Offline toggle | Mutation queued; optimistic update persists; retries on reconnect |

**Eliminated:**
- Toggle logic in `Habits.tsx:57-74`
- Toggle logic plumbed through `SundownHabitsTab.tsx`'s parent callback
- Backfill mutation in `Habits.tsx:77-88`
- 5 ad-hoc `invalidateQueries` blocks per mutation site
- Missing `onError` handlers (Cascade 9 combines with this)

**Remains:**
- One `useHabitMutations()` hook returning `{ create, update, delete, archive, toggle }` — each with optimistic update + toast-on-error baked in.

---

## Cascade 3: `HabitLogEditor` replaces all 4 orphan dialogs

**Claim:** *Every per-log interaction is a special case of editing the habit_log row's metadata.*

The 4 orphans each render a subset of the same underlying data:
- `HabitLogDialog`: note only
- `HabitNoteDialog`: note only (duplicate)
- `HabitCompletionDialog`: mood + energy + note
- `HabitDetailDialog`: read-only history + note

They all act on habit_log rows. They differ in which fields they expose and whether they're editable.

**Collapse:** One `<HabitLogEditor log={log} habit={habit} mode="edit|view" />`. The habit's configuration determines which fields render (e.g., if the habit doesn't track mood, the mood row doesn't appear). Mode determines editability.

**Stress tests:**

| Use case | Covered by HabitLogEditor? |
|----------|---------------------------|
| Quick note after completing | Yes — editor opens with note field focused |
| Mood + energy logging (resurrected feature) | Yes — if habit config includes mood tracking |
| View past log | Yes — `mode="view"` |
| Edit a past log | Yes — `mode="edit"` on past date |
| Fresh log (long-press empty cell) | Yes — editor opens with new log draft |
| Delete a log (uncomplete) | Yes — "Clear log" button in editor, or just tap the week-row cell again |

**Eliminated:** All 4 orphan dialog components. (Net: -4 files.)

**Remains:** One `<HabitLogEditor>`. Single source of truth for log-row UI.

---

## Cascade 4: `HabitActionsMenu` replaces inline edit/delete everywhere

**Claim:** *Every habit-level action is a special case of a kebab-menu item.*

Actions: edit, archive, delete, view insights, reorder, pin, configure reminders.

**Collapse:** One `<HabitActionsMenu habit={h} />` component rendered as the rightmost element in each habit row. Kebab button opens a bottom sheet (mobile) or popover (desktop).

**Stress tests:**

| Use case | Covered? |
|----------|---------|
| Edit from /habits | Kebab → Edit → HabitCreateDialog |
| Edit from Sundown dashboard | Same kebab, same dialog |
| Edit from HabitInsights | Same kebab, same dialog |
| Delete with confirm | Kebab → Delete → Confirm dialog |
| Archive | Kebab → Archive (no confirm needed, reversible) |
| View insights | Kebab → View insights (navigation) |
| Future: configure reminders | Kebab → Reminders (new menu item, no new UI pattern) |

**Eliminated:**
- Inline edit button + delete button in `Habits.tsx`
- Inline edit/delete in `SundownHabitsTab.tsx`
- Inline edit/delete in `HabitInsights.tsx` (if present)
- Parent prop drilling of `onEdit` / `onDelete` callbacks

**Remains:** One menu component, one set of dialogs, one kebab gesture.

---

## Cascade 5: Client owns the calendar, server stores strings

**Claim:** *Timezone correctness is a solved problem if the server never constructs "today."*

Every timezone bug in the roast (R1, R13) traces to a server call like `new Date().toISOString().split('T')[0]`. The server has no way to know what "today" means for the user — it only knows Railway's clock (which is UTC).

**Collapse:** The client is the source of truth for the user's calendar day. Server just stores and returns the string the client sends. Server-side date comparisons (for validation, bonuses, streaks) take the client's date string as input, not `new Date()`.

**Stress tests:**

| Edge case | Does it work? |
|-----------|--------------|
| User completes habit at 11pm PST | Client sends `2026-04-18`. Server stores `2026-04-18`. Streak reads `2026-04-18`. Correct. |
| Streak computed across dates | Server reads log date strings, compares lexically. No `new Date()` needed. |
| User travels across timezones | Their "today" changes with their device; streak continues where their calendar continues. Behaves like their calendar app does. |
| Daily bonus (one per local day) | Client sends `{action: 'toggle', date, isFirstToggleToday: true}`. Server trusts `isFirstToggleToday` or checks by string equality, not by Date arithmetic. |
| Early-bird XP bonus | Client sends `{localHour: 6}`. Server reads the number, awards bonus. No timezone guessing. |
| User changes device clock | Their cheating cost is exactly one extra XP bonus; streak isn't awarded fraudulently because server validates `date ≤ now + 1 day buffer`. |

**Eliminated:**
- All `new Date().toISOString()` usage in habits.ts
- Server-side timezone comparisons
- R1 (streak reset bug)
- R13 (server-time-dependent bonuses)

**Remains:**
- One `client/src/lib/time.ts` with `getTodayLocal()` — used everywhere on the client.
- Server reads strings, stores strings. No Date objects in business logic.

---

## Cascade 6: Upsert kills the race

**Claim:** *Every habit_log write is a special case of `INSERT ... ON CONFLICT (habitId, userId, date) DO UPDATE RETURNING *`.*

Current code (`habits.ts:484-505`) does a read-then-insert. The unique constraint exists but isn't used for conflict resolution — it throws 500s on races.

**Collapse:** Use Postgres `ON CONFLICT DO UPDATE` directly. One atomic DB call. No read-then-insert. No race. Drizzle supports this with `.onConflictDoUpdate()`.

**Stress tests:**

| Edge case | Does it hold? |
|-----------|--------------|
| Two concurrent toggles | Both become upserts; the second wins (or merges). No duplicate rows. |
| Idempotent retry after network flake | Upsert is naturally idempotent. |
| Toggle (complete → uncomplete) | Same endpoint; `completed: false` flips the row. Upsert handles it. |
| Create-only vs update-only branches | Collapse. One write. |

**Eliminated:**
- Race condition R2
- The fetch-then-insert pattern
- Ambiguity between `POST /api/habit-logs` and `POST /api/habit-logs/toggle` — one endpoint, one semantic.

**Remains:** One atomic upsert. One endpoint.

---

## Cascade 7: One endpoint feeds every habit surface

**Claim:** *Every habit list view consumes the same shape: habits + this-week-logs + streak.*

Right now multiple queries get stitched together client-side:
- `/api/habits` for the habit list
- `/api/habit-logs/range/...` for log data
- `/api/habits-with-data` for the enriched version

This means 2-3 network round trips before a habits page renders. Also means the "logMap" construction (`SundownHabitsTab.tsx:104-105`) is duplicated client-side.

**Collapse:** One endpoint: `GET /api/habits/week?weekStart=YYYY-MM-DD`. Returns:
```ts
{
  weekStart: string;
  habits: Array<{
    ...habit,
    logs: HabitLog[]; // exactly 7 entries, one per day of week (null for empty)
    streak: number;
    weeklyProgress: { done: number; target: number } | null;
  }>;
}
```

**Stress tests:**

| Use case | Served by this endpoint? |
|----------|-------------------------|
| /habits page | Yes — weekStart = start of current week |
| Sundown dashboard Habits tab | Same endpoint, same weekStart |
| HabitInsights | Different endpoint (per-habit deep view); this cascade doesn't reach there |
| Insights contribution graph | Different endpoint (90+ days); lives separately |
| Backfill to a past week | Re-query with different weekStart; React Query caches by key |

**Eliminated:**
- Parallel queries
- Client-side log-map construction in two places
- Out-of-sync displays (one source of truth)

**Remains:** One endpoint. Two surfaces consume it.

---

## Cascade 8: One touch class, one size

**Claim:** *Every habit interaction point is a 44×44px tap target.*

Current sizes sprinkled everywhere: 40 (HabitCard check), 28 (SundownHabits kebab), 12 (graph cells), 20 (heatmap cells), 30 (previous audit baseline).

**Collapse:** A `.sd-touch` utility class in `sundown-tokens.css`:
```css
.sd-touch {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
```

All habit interaction points use it. Fixed globally, once.

**Stress tests:**

| Use case | Works? |
|----------|--------|
| WeekRow cell | `.sd-touch` ensures 44px; visual content smaller inside |
| Kebab menu trigger | Same |
| Edit/delete in sheet | Same |
| Graph cells in insights | Same — means graph is bigger, but that's better on mobile |
| Compact desktop view | `.sd-touch` doesn't restrict maximum size; looks fine |

**Eliminated:** Finding R10 across 4+ components.

**Remains:** One CSS class.

---

## Cascade 9: Default-on error toasts

**Claim:** *Every mutation failure surfaces through the same toast.*

Combined with Cascade 2, `useHabitMutations` has `toastError: true` as the default in the hook implementation. Any mutation using the hook automatically gets error surfacing. Can't forget.

**Stress tests:**

| Scenario | Toast? |
|----------|--------|
| 500 on toggle | Yes |
| Network offline | Yes (special "offline" toast) |
| Validation error | Yes, with server's message |
| Linked-goal sync failed | Yes, as a warning toast (not blocking the primary action's success) |
| Daily bonus silently not awarded | Yes, as a warning ("Your daily bonus couldn't be awarded. Tap to retry.") |

**Eliminated:**
- Findings R4, R11, R18 (silent failures)
- The pattern of "we should remember to add onError"

**Remains:** Default behavior. No opt-in required.

---

## What does NOT collapse

Honest inventory of things that stay separate:

1. **Habit creation flow** — creating a habit is a different gesture than logging one. Dialog stays.
2. **Habit editing dialog** — distinct from log editor. Stays.
3. **Delete confirmation** — UX necessity. Stays.
4. **Archive** — has its own semantic (hides but preserves). Stays, but lives in `HabitActionsMenu`.
5. **Habit reordering / pinning** — drag-to-reorder is a separate interaction from tap-to-toggle. Stays.
6. **Insights page analytics** — the 90-day graph, mood/energy trends, streak history. Different scale, different purpose.
7. **XP / rewards system** — adjacent, not habit-UX. Stays separate.
8. **Goal linking configuration** — creates/edits the link; not a log operation.
9. **Notification scheduling (future)** — configuration, not logging. Will live in `HabitActionsMenu → Reminders`.

---

## Final shape after all cascades

**New components (5):**
- `<WeekRow>` — primary log surface
- `<HabitLogEditor>` — replaces 4 orphans
- `<HabitActionsMenu>` — replaces inline edit/delete in 3 places
- `useHabitMutations` hook — replaces ad-hoc mutations everywhere
- `client/src/lib/time.ts` with `getTodayLocal()` — replaces mixed timezone logic

**New API (1):**
- `GET /api/habits/week?weekStart=YYYY-MM-DD` — replaces parallel queries

**New CSS (1):**
- `.sd-touch` utility in `sundown-tokens.css`

**Server-side change (1):**
- `/api/habit-logs/toggle` uses `ON CONFLICT DO UPDATE`; removes `new Date()` for "today."

**Deleted:**
- `HabitDetailDialog.tsx`
- `HabitLogDialog.tsx`
- `HabitNoteDialog.tsx`
- `HabitCompletionDialog.tsx` (replaced by `HabitLogEditor`, so it's a rewrite not a delete — but functionally it's gone)
- Inline edit/delete in `HabitCard.tsx`
- Inline edit/delete in `SundownHabitsTab.tsx`
- Contribution graph + date-picker + backfill dialog from primary `/habits` page
- Duplicate `+ New Habit` on empty state
- Scattered `invalidateQueries` blocks
- Server-side `new Date().toISOString()` in habits domain

**Total: ~14 components/implementations deleted, 7 added. Net -7 files, ~60% less habits code.**

---

## Risk register

| Risk | Mitigation |
|------|-----------|
| Week-row doesn't scale to 12+ habits visually | Cells are fixed-width; row scrolls vertically in list. Tested visually before ship. |
| `HabitLogEditor` becomes god-component as features grow | Keep it thin — it's a form. If it grows past 300 lines, split by habit type. |
| Upsert changes semantics for existing clients | No — return shape stays the same. Caller unchanged. |
| Weekly endpoint forces re-query on day boundary | React Query `staleTime` handles this gracefully. Cache key includes weekStart. |
| HabitActionsMenu mobile sheet is jarring | Use Sundown-themed bottom sheet with spring animation. Same pattern as existing drawer. |
| Backfill via tap is less explicit than a "backlog" button | Pros outweigh cons. But add a first-use tooltip ("Tap any day to log it.") to aid discovery. |

---

## Single load-bearing insight

If you had to pick one insight that's the keystone:

**"The habit row IS the week. Every interaction is a date + an intent."**

The current design treats the week as a side-panel visualization. The simplification is: the week IS the primary UI. Today is one of the seven cells. Backfill is a cell on the left. Editing is long-press. Deleting is tap-again. The contribution graph, the date picker, the backfill dialog — all of them are extra scaffolding that existed only because the week wasn't the surface.

Once the week is the surface, half the complexity dissolves.

---

## Next step

Hand this + the roast to `writing-plans`. The plan needs to specify:
- File-by-file implementation order (cascades have dependencies — e.g., `useHabitMutations` should precede the component rewrites)
- Migration plan for the single `/api/habits/week` endpoint (keep old ones alive until all consumers ported)
- Visual mockups of the week-row in Sundown tokens before writing the component
- Verification steps for each quick win
