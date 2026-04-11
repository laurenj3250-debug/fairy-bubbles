# Changelog

Ongoing user-facing changes to the GoalConnect / Mountain Habit app. New entries go on top. Format: `[commit short-sha] — summary`, grouped by type.

## 2026-04-11

### Added

- **Create / edit / delete yearly goals from the dashboard.** `SundownMonthlyGoals` now has an **Add Goal** header button and every tile shows an edit (pencil) + delete (trash) cluster. New `YearlyGoalDialog` (Sundown-themed, default category `residency`) handles create and edit; `DeleteConfirmDialog` handles delete. `ba6cfbc`
- **Create / edit / delete habits from the dashboard.** `SundownHabitsTab` Today view now has an **Add** header button and every row shows edit + delete buttons that reuse the existing `HabitCreateDialog`. Delete calls `DELETE /api/habits/:id` and confirms via `DeleteConfirmDialog`. `ba6cfbc`
- **`/yearly-goals` page CRUD.** Header `+ Add Goal` button, empty-state `+ Add your first goal` button, and inline edit + delete actions on every `YearlyGoalRow`. Previously the page could only toggle / increment / claim reward — now it supports full lifecycle. `ba6cfbc`, `70e6019`
- **E2E audit suite** at `tests/e2e-audit/` with `run-all.sh` runner: `audit.py` (26 checks), `verify-final.py` (8), `verify-habit.py` (6), `verify-hardening.py` (5). Output lands in `.e2e-output/` (gitignored). See `tests/e2e-audit/README.md`. `70e6019`, `581e7b9`
- **Unit tests** for `isGoalLinked` helper (`client/src/lib/yearlyGoalUtils.test.ts`, 7 cases).

### Changed

- **Yearly goal completion state is now internally consistent.** `computeGoalProgress` now overrides the persisted `completed` + `completedAt` fields in API responses to match the freshly-computed `isCompleted`. Previously a goal like "2 physical books" could return `completed: true, isCompleted: false` when the linked journey count dropped below target; now they always agree. `70e6019`
- **Goal calendar reads authoritative completion state.** `/api/goal-calendar` previously selected the persisted `yearlyGoals.completed` column, which could be stale for goals computed from a linked source. It now runs `computeGoalProgress` for each goal to get the real state. Visible effect: linked yearly goals no longer show as "complete" on the calendar when their actual linked-source value drops below target. *(this release)*
- **`YearlyGoalRow` edit + delete buttons now show symmetrically.** Previously edit only appeared for `isManual` goals; delete appeared for all. Both now appear for all user-owned goals (title, targetValue, xpReward are always editable). Increment/decrement buttons are hidden for goals whose value is computed from a linked source. `70e6019`
- **`isGoalLinked` helper** in `client/src/lib/yearlyGoalUtils.ts` replaces two drifting ad-hoc checks in `SundownMonthlyGoals.tsx` and `YearlyGoalRow.tsx`. `70e6019`

### Fixed

- **Dashboard CRUD wiring.** `useYearlyGoals` already exposed `createGoal` / `updateGoal` / `deleteGoal` mutations — they were never connected to any button. Root cause of "I can't edit or add goals". `ba6cfbc`
- **Duplicate title validation on yearly goal create.** `YearlyGoalDialog` previously had both an HTML5 `required` attribute AND a JS `title.trim()` check. The native browser tooltip always fired first, making the JS toast dead code. The `required` attribute has been removed; the JS toast is now the single source of truth. *(this release)*

### Infrastructure

- `.e2e-output/` added to `.gitignore`. `70e6019`
- Preflight tracker + /truth protocol used end-to-end for three rounds of fixes.
