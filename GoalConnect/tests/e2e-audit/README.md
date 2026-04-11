# Sundown E2E Audit Suite

End-to-end tests for the Sundown dashboard and related yearly-goals/habits flows. Run against a local dev server at `http://localhost:5001`. Each script boots its own dev server via `~/.claude/skills/webapp-testing/scripts/with_server.py`.

## Quick start

```bash
./tests/e2e-audit/run-all.sh          # run all 4 scripts, 45 checks total
./tests/e2e-audit/run-all.sh quick    # audit.py + verify-final.py only (faster)
```

Output lands in `.e2e-output/` (gitignored): screenshots per script + `findings.json` for `audit.py`.

## What each script covers

| Script | Checks | Scope |
|--------|--------|-------|
| `audit.py` | 26 | Baseline: tab switching, star dots, goal tiles, edit/delete button counts, countdown strip, nav links, `/yearly-goals` page |
| `verify-final.py` | 8 | Habit edit prefill, `/yearly-goals` row CRUD roundtrip (create → edit prefill → delete), default category check |
| `verify-habit.py` | 6 | Habit CRUD roundtrip on dashboard with DB-level `still_in_db` verification |
| `verify-hardening.py` | 5 | Client empty-title toast, server Zod rejection (empty title, bad category), DELETE 404 |

## Test data conventions

All scripts that create records use `TEST_PREFIX = "_E2E_"` (e.g. `_E2E_RowGoal_1775920484`, `_E2E_Habit_1775920484`) and run `_cleanup_stray_test_data` both before and after the test body. A crashed run leaves at most one generation of stray records, and the next run reaps them automatically.

## Adding a new check

1. Put the new script in `tests/e2e-audit/`.
2. Output path: `Path(__file__).resolve().parents[2] / ".e2e-output" / "<name>"`.
3. If you create records, use the `_E2E_` prefix and add pre/post cleanup calls — see `verify-final.py` for the pattern.
4. Add the script to `run-all.sh` `SCRIPTS` array.

## Credentials

Scripts use hardcoded dev credentials from `.env` (`laurenj3250@gmail.com` / `Crumpet11!!`). This is intentional for a single-user dev app — do not use in CI or shared environments.

## Unit tests

Pure-function helpers have Vitest unit tests co-located with the source (e.g. `client/src/lib/yearlyGoalUtils.test.ts`). Run with `npm run test:unit` or `npx vitest run <path>`.
