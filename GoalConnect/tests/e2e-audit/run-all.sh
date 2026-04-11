#!/usr/bin/env bash
# Run all Sundown dashboard E2E audits against a local dev server.
#
# Each script boots its own dev server via ~/.claude/skills/webapp-testing
# so they're independent — a failure in one doesn't block the rest.
# Output screenshots + findings land in GoalConnect/.e2e-output/ (gitignored).
#
# Usage:
#   ./tests/e2e-audit/run-all.sh         # run everything, exit non-zero on first failure
#   ./tests/e2e-audit/run-all.sh quick   # skip verify-habit (slowest) + hardening
#
# Scripts executed (in order):
#   audit.py           — 26 baseline checks (tabs, nav, countdown, buttons, selectors)
#   verify-final.py    — habit prefill + /yearly-goals row CRUD roundtrip (8 checks)
#   verify-habit.py    — habit CRUD roundtrip with DB-level delete check (6 checks)
#   verify-hardening.py — client + server validation + 404 path (5 checks)

set -e
cd "$(dirname "$0")/../.."

HELPER="$HOME/.claude/skills/webapp-testing/scripts/with_server.py"
SERVER='npm run dev'
PORT=5001
TIMEOUT=90

if [[ ! -f "$HELPER" ]]; then
  echo "ERROR: webapp-testing helper not found at $HELPER" >&2
  exit 1
fi

MODE="${1:-full}"
SCRIPTS=(
  "tests/e2e-audit/audit.py"
  "tests/e2e-audit/verify-final.py"
)
if [[ "$MODE" != "quick" ]]; then
  SCRIPTS+=(
    "tests/e2e-audit/verify-habit.py"
    "tests/e2e-audit/verify-hardening.py"
  )
fi

FAILED=()
for script in "${SCRIPTS[@]}"; do
  echo
  echo "================================================================"
  echo "RUN: $script"
  echo "================================================================"
  if python3 "$HELPER" --server "$SERVER" --port "$PORT" --timeout "$TIMEOUT" -- python3 "$script"; then
    echo "[OK] $script"
  else
    echo "[FAIL] $script"
    FAILED+=("$script")
  fi
done

echo
echo "================================================================"
echo "SUMMARY"
echo "================================================================"
if [[ ${#FAILED[@]} -eq 0 ]]; then
  echo "All ${#SCRIPTS[@]} E2E scripts passed."
  exit 0
else
  echo "${#FAILED[@]} of ${#SCRIPTS[@]} scripts failed:"
  for s in "${FAILED[@]}"; do echo "  - $s"; done
  exit 1
fi
