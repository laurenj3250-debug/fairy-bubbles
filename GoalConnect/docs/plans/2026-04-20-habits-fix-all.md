# Habits — Fix All of It

**Date:** 2026-04-20
**Branch:** main
**Inputs:**
- Roast: `docs/plans/2026-04-18-habits-roast.md` (27 findings)
- Cascades: `docs/plans/2026-04-18-habits-simplification.md` (9 insights)
- Existing plan: `docs/plans/2026-04-18-habits-implementation-plan.md` (T1-T18)
- VG 2026-04-20 baseline: `screenshots/visual-qa/` + report in conversation
- Tonight's vibe ship: default view flipped to `week`, anxiety copy removed

**Goal:** Lauren opens GoalConnect, sees her week, taps any cell on any habit for any day, and it just works — on phone and on desktop. Nothing asks her to find a hidden date picker. Nothing yells "at risk." Every interaction reaches at least WCAG AA.

**Constraint:** Don't kill her momentum. Ship in small batches. Each batch = 1-4 hours of focused work. Each batch gives her something she can tap tonight.

---

## What already shipped

- **Batch A (Foundations):** T1-T8 from the 2026-04-18 plan. Client owns calendar, `.sd-touch`, `useHabitMutations` hook with optimistic + rollback + toast, Zod-validated upsert-on-conflict toggle, future-date rejection, `GET /api/habits/week`, warning bubble. Pushed in commit bad189b.
- **Tonight's ship:** Default view = week. Anxiety copy gone. 7-column grid visible on open.

## What's left — prioritized by daily-use impact

| Batch | Theme | Unblocks | Effort | When |
|-------|-------|----------|--------|------|
| **E** | Weekly habit backfill + mobile grid | The two gaps from tonight — her actual complaint | 2-3 hrs | NEXT |
| **F** | `/habits` page backfill | Tapping cells on /habits page, not just dashboard tab | 2 hrs | After E |
| **G** | One WeekRow primitive + shared hook | Eliminates dashboard/habits-page drift | 3-4 hrs | After F |
| **H** | HabitActionsMenu (unified kebab) | Kills inline edit/delete in 3 places | 2-3 hrs | After G |
| **I** | HabitLogEditor (replaces 4 orphans) | Mood + energy + notes on long-press | 3-4 hrs | After H |
| **J** | Navigation touch targets + a11y labels | WCAG compliance on top nav + icon-only buttons | 1 hr | Parallel |
| **K** | Token cleanup | 14 hardcoded colors in SundownBrainDump + a few stragglers | 1 hr | Parallel |
| **L** | Cleanup | Delete 4 orphan dialogs, legacy endpoints, duplicate queries | 1 hr | After I |

Total: ~15-20 hrs across 8 batches. Each batch is reviewable in isolation.

---

# Batch E — Close tonight's gaps

## E1. Weekly habit backfill

**File:** `client/src/components/sundown/SundownStardustTrail.tsx:81-95`

**Problem:** weekly-cadence habits (Gym, Pimsleur, Phone-free-nature) render as a single `<button class="sd-weekly-bar">` that spans 7 columns. Its onClick hardcodes `weekDates[todayIndex]`, so Lauren can't backfill yesterday's Gym.

**Approach:** Render weekly habits the same as daily — as 7 tappable cells. The bar was only there because weekly habits are "cumulative," but that cumulative metric is already shown via the header badge and the streak number elsewhere. The row becomes:

```tsx
{weekDates.map((date, i) => {
  const done = !!logMap.get(`${habit.id}:${date}`);
  // ... same rendering as daily
})}
```

Keep the `{weekDoneCount} of {target} this week` label — render it inside the `.sd-habit-label` column to the left of the name, as a subtitle. That preserves the weekly-target information without taking a whole row.

**Verification:**
- Lauren taps Monday's Gym cell. Server accepts (validated by T5). Cell lights up. Weekly count badge increments. No full-row bar anywhere.
- Typecheck: `npm run check` → 0 errors.
- Playwright: `tests/habits.spec.ts` still green (daily habit test unchanged; if there's a weekly-bar test, rewrite it to tap a cell).

**Commit:** `feat(habits): weekly habits backfill via 7 cells, same pattern as daily`

## E2. Mobile grid layout

**File:** `client/src/sundown.css:269, 618`

**Problem:** `.sd-habit-grid` is `grid-template-columns: 150px repeat(7, minmax(44px, 1fr))` = 458px minimum width. At 375px mobile viewport it overflows. The existing media query at line 618 drops the label to 120px but still allocates `repeat(7, 1fr)` which can shrink cells below 44px tap target.

**Approach:** At mobile width, stack the label ABOVE the cells. Each habit becomes a two-row block:

```css
@media (max-width: 640px) {
  .sd-habit-grid {
    grid-template-columns: repeat(7, 1fr);
    row-gap: 14px;
  }
  .sd-habit-label {
    grid-column: 1 / -1;  /* span full width */
    margin-top: 8px;
  }
  .sd-day-hdr:not(:first-of-type) { /* shown once per week, not per habit */ }
}
```

Full 375px / 7 = 53px per cell. Comfortable tap, WCAG AA.

Alternative if stacking feels wrong visually: collapse the label column to an icon-only 44px column, hide the name, show name on tap via tooltip/accordion. But stacking is simpler and Lauren's screenshot showed she's fine with multi-line layouts in the Sundown cards.

**Verification:**
- Chrome devtools mobile emulation at 375px: all 7 cells visible, each ≥ 44px wide, no horizontal scroll.
- Real-device check: Lauren opens on her phone, daily habit row shows 7 tappable cells without cramping.

**Commit:** `fix(habits): mobile grid stacks label above 7 cells — WCAG AA compliant`

### Batch E checkpoint

```
[ ] `npm run check` green
[ ] Lauren taps Gym yesterday on dashboard — server accepts, count increments
[ ] Mobile view shows 7 wide cells, no overflow
[ ] No regression: daily habits still work identically
```

---

# Batch F — `/habits` page backfill via cells

## F1. Delete the date-picker input

**File:** `client/src/pages/Habits.tsx:219-236`

**Problem:** The only backfill affordance is `<input type="date">` labeled "Log for date" next to the Activity Overview. Zero discoverability (roast R8).

**Approach:** Delete the input + label. Keep the Activity Overview graph for now (it's a legitimate 90-day historical view). Immediately below each habit card, the existing mini-heatmap is already a 7-day grid. Make those cells tappable — same `onToggle` signature as the dashboard.

Search the file for the mini-heatmap rendering and wire it up. If it's rendered via a shared component, fix it once there.

**Verification:**
- Navigate to `/habits`. Tap a cell on any habit card. Server accepts. Cell lights up.
- Date-picker input is gone. "Click any day or use the date picker above" instructional text is gone.

**Commit:** `refactor(habits): /habits page backfill via habit-card cells, date picker removed`

## F2. Mobile Activity Overview relocation

**File:** `client/src/pages/Habits.tsx` (wherever `HabitContributionGraph` mounts)

**Problem:** On mobile, Activity Overview consumes the entire 375px viewport. Lauren has to scroll past the whole thing to see one habit card.

**Approach:** On mobile only, render Activity Overview as a collapsed `<details>` block ("View 90-day activity") below the habit cards. Desktop keeps the current placement.

```tsx
<div className="md:block">
  <HabitContributionGraph ... />
</div>
<details className="md:hidden mt-6">
  <summary>View 90-day activity</summary>
  <HabitContributionGraph ... />
</details>
```

**Verification:**
- Mobile: habit cards are the first thing visible under the page header.
- Desktop: Activity Overview renders inline as today.

**Commit:** `fix(habits): mobile /habits leads with habit cards, graph collapsed`

### Batch F checkpoint

```
[ ] /habits tapping cells works on desktop + mobile
[ ] Mobile no longer dominated by Activity Overview
[ ] /habits + dashboard Habits tab produce identical toggle behavior (shared query keys, synced UI)
```

---

# Batch G — Shared WeekRow primitive

## G1. Extract `<WeekRow>` from SundownStardustTrail

**Files:**
- Create: `client/src/components/sundown/WeekRow.tsx`
- Modify: `SundownStardustTrail.tsx` (delete inline cell rendering, mount `<WeekRow>`)
- Modify: `client/src/pages/Habits.tsx` (mount `<WeekRow>` where the mini-heatmap was)

**Approach:** The SundownStardustTrail has working cell rendering. Move the per-habit row rendering into a standalone `WeekRow` component that takes `{ habit, weekDates, logs, todayIndex, onToggle, onLongPress? }`. SundownStardustTrail becomes a container that renders the grid scaffolding + `<WeekRow>` per habit. `/habits` cards mount `<WeekRow>` directly.

This is T9 from the original plan, but grounded: the primitive extracted from working code, not designed from scratch.

**Verification:**
- Dashboard Habits tab: identical visual to pre-extraction.
- `/habits` cards: now use the same tappable cells.
- Both surfaces tap the same endpoint, invalidate the same keys.

**Commit:** `refactor(habits): WeekRow extracted as shared primitive`

## G2. Migrate both surfaces to `/api/habits/week`

**Files:**
- `client/src/pages/SundownDash.tsx` — replace `/api/habits-with-data` + `/api/habit-logs/range/*` queries with single `/api/habits/week?weekStart=...`
- `client/src/pages/Habits.tsx` — same

**Approach:** Endpoint already exists (T6, commit bad189b). This is the client migration.

**Verification:**
- Network tab: dashboard loads with 1 habit-related query, not 2-3.
- Invalidation on toggle: only `/api/habits/week` key, UI still updates everywhere.
- Typecheck + Playwright green.

**Commit:** `refactor(habits): unify surfaces on /api/habits/week`

### Batch G checkpoint

```
[ ] One WeekRow component used in 2+ places
[ ] One endpoint feeding both surfaces
[ ] No regression on daily toggle, weekly toggle, or backfill
```

---

# Batch H — HabitActionsMenu (unified kebab)

## H1. Create `<HabitActionsMenu>`

**File:** `client/src/components/sundown/HabitActionsMenu.tsx` (new)

**Approach:** Per T11 in the original plan. Kebab button (44x44, `.sd-touch`), opens bottom sheet on mobile / popover on desktop. Actions: Edit, Archive, Delete, View insights. All actions use `useHabitMutations`.

## H2. Wire into SundownHabitsTab + /habits

**Files:**
- `SundownHabitsTab.tsx` — replace the vertical edit/delete cluster (28x28 buttons, lines 339-370) with `<HabitActionsMenu habit={h} />`.
- `Habits.tsx` — same, wherever inline edit/delete lives now.

**Verification:**
- Tap kebab on any habit. Menu opens. Edit, Archive, Delete, Insights all work.
- Old 28x28 buttons removed — `grep -rn "data-testid=\"edit-habit-" client/src` returns matches only from HabitActionsMenu.

**Commit:** `feat(habits): HabitActionsMenu replaces inline edit/delete everywhere`

---

# Batch I — HabitLogEditor (long-press)

## I1. Create `<HabitLogEditor>`

**File:** `client/src/components/sundown/HabitLogEditor.tsx` (new)

**Approach:** Per T10 in the original plan. Sundown-themed sheet/popover. Conditionally renders mood, energy, quantity, duration, session-type, note fields based on habit config.

## I2. Long-press on WeekRow cells

**File:** `WeekRow.tsx` (from G1)

**Approach:** Add `useLongPress` hook (500ms, cancels on movement). Tap = `onToggle`. Long-press = open `<HabitLogEditor>`.

**Verification:**
- Long-press a cell. Editor opens with correct habit, correct date, existing log values pre-filled.
- Save persists. Close + reopen shows values.
- Tap still toggles as before.

**Commit:** `feat(habits): long-press cell opens HabitLogEditor`

---

# Batch J — Nav touch targets + a11y labels (parallel)

## J1. Top nav tabs to 44x44

**File:** `client/src/components/sundown/` — find the top-of-dashboard tab pills (Overview / Goals / Habits / Dump)

**Problem (VG):** tabs are 85x30px, 63x30px, 66x30px, 64x30px. All below WCAG minimum.

**Approach:** Add `.sd-touch` utility class to each tab button, bump padding.

**Commit:** `fix(a11y): top nav tabs meet 44x44 WCAG minimum`

## J2. Accessible labels on icon buttons

**Problem (VG):** 5 `<button>` elements in the dashboard have no accessible label.

**Approach:** Grep for `<button>` with only icon children in `client/src/components/sundown/`. Add `aria-label` per button's purpose.

**Commit:** `fix(a11y): aria-label on all icon-only buttons in Sundown components`

---

# Batch K — Token cleanup (parallel)

## K1. SundownBrainDump hardcoded colors

**File:** `client/src/components/sundown/SundownBrainDump.tsx:23-29, 86`

**Problem (VG):** 14 hardcoded hex values where Sundown tokens should be used.

**Approach:** Identify each color's intent (category tag? background? border?). Map to an existing `var(--sd-*)` token or add a new one to `sundown-tokens.css` if none fits.

**Verification:**
- `grep -nE "#[0-9a-fA-F]{3,6}" client/src/components/sundown/SundownBrainDump.tsx` → 0 matches
- VG score: token compliance 93.9% → 100%

**Commit:** `fix(tokens): SundownBrainDump uses var(--sd-*) throughout`

---

# Batch L — Cleanup

## L1. Delete orphan dialogs

**Files (delete):**
- `client/src/components/HabitDetailDialog.tsx`
- `client/src/components/HabitLogDialog.tsx`
- `client/src/components/HabitNoteDialog.tsx`
- `client/src/components/HabitCompletionDialog.tsx` (replaced by HabitLogEditor)

**Verification:** `grep -rn "HabitDetailDialog\|HabitLogDialog\|HabitCompletionDialog\|HabitNoteDialog" client/src` → 0 matches.

## L2. Delete legacy endpoints + query keys

**Files:**
- `server/routes/habits.ts` — delete `GET /api/habit-logs/range/*` and `GET /api/habits-with-data` after grep confirms no client callers
- `client/src/hooks/useHabitMutations.ts` — remove legacy `["/api/habits"]` invalidation

## L3. Final audit

```bash
grep -nE "#[0-9a-fA-F]{3,6}|rgba?\(" client/src/components/sundown/WeekRow.tsx client/src/components/sundown/HabitLogEditor.tsx client/src/components/sundown/HabitActionsMenu.tsx
# → 0 inline color matches; all via var(--sd-*)

grep -rnE "→|↑|↓|⇒" client/src/components/sundown/ client/src/pages/Habits.tsx
# → 0 (Lauren rule)

grep -rniE "start building|track your progress|achieve your goals|daily consistency|at risk" client/src
# → 0 textbook voice
```

**Commit:** `chore(habits): cleanup orphans, legacy endpoints, token audit`

---

## Traceability — roast findings → batches

| R# | Finding | Batch | Notes |
|----|---------|-------|-------|
| R1 | Timezone streak reset | shipped T1 | — |
| R2 | Toggle race duplicates | shipped T4 | — |
| R3 | No future-date validation | shipped T5 | — |
| R4 | Silent toggle failure | shipped T3 | — |
| R5 | Swallowed linked-goal error | shipped T4, T8 | — |
| R6 | Edit/delete duplicated 3x | H | HabitActionsMenu |
| R7 | 4 orphan dialogs | I, L | HabitLogEditor + delete |
| R8 | Backfill zero-discoverability | tonight + F | flipped default + delete date picker |
| R9 | No week-row | tonight | Week view now default |
| R10 | Touch targets < 44px | E2, J | mobile grid + nav |
| R11 | Swallowed bonus errors | shipped T4, T8 | — |
| R12 | Partial authz on log write | shipped T4 | — |
| R13 | Server-time bonuses | shipped T1 | — |
| R14 | Non-transactional score | shipped T4 | — |
| R15 | Textbook-voice empty state | tonight (streak at risk) + L | empty state copy still needs a pass |
| R16 | No confirm on backfill | N/A | backfill is tap, no dialog |
| R17 | Empty graph title | F | handled while editing /habits |
| R18 | Over-broad invalidations | shipped T3 | — |
| R19 | No loading skeleton | G | WeekRow shows 7 dim cells while loading |
| R20 | No optimistic updates | shipped T3 | — |
| R21 | Loose typing | G1 | WeekRow props fully typed |

## Traceability — VG findings → batches

| Finding | Batch |
|---------|-------|
| TOUCH TARGETS 49.2% — top nav, + Add, edit/delete icons | E2, J1, H |
| TOKEN COMPLIANCE 93.9% — 14 hardcoded in SundownBrainDump | K |
| ALIGNMENT 0% — habit grid baseline mismatch | G (WeekRow fixes by construction) |
| ACCESSIBILITY 75% — 5 unlabeled buttons | J2 |
| CONTRAST 96.7% — ✓ button 1.13:1, "4/19 Complete" 1.42:1 | G (WeekRow fixes cell contrast), K (progress text) |

## Execution

Each batch stands alone. Between batches: commit + Lauren taps the thing.

**Recommended order:** E → F → J (parallel) → K (parallel) → G → H → I → L.

E first because it closes the exact complaints from tonight ("can't back-add habits"). F second because it makes /habits match. J and K run parallel to E/F because they touch different files. G consolidates. H, I, L finish the original plan.

**When to use subagents:** G, H, I are well-scoped enough for fresh subagents (per `subagent-driven-development`). E, F, J, K, L Lauren does herself or I do inline.
