"""Final verification: habit edit prefill + YearlyGoalRow CRUD roundtrip.

Usage (from repo root):
  python3 ~/.claude/skills/webapp-testing/scripts/with_server.py \\
    --server "npm run dev" --port 5001 --timeout 90 -- \\
    python3 tests/e2e-audit/verify-final.py
"""
import json, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

OUT = Path(__file__).resolve().parents[2] / ".e2e-output" / "verify-final"
SHOTS = OUT / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)
EMAIL = "laurenj3250@gmail.com"
PASSWORD = "Crumpet11!!"
BASE = "http://localhost:5001"
TEST_PREFIX = "_E2E_"
TEST_GOAL_NAME = f"{TEST_PREFIX}RowGoal_{int(time.time())}"
results = []


def _cleanup_stray_test_data(page):
    """Best-effort delete of any leftover test goals/habits from prior failed runs."""
    try:
        deleted = page.evaluate(f"""async () => {{
            const year = new Date().getFullYear().toString();
            const gRes = await fetch(`/api/yearly-goals/with-progress?year=${{year}}`, {{credentials:'include'}});
            const g = (await gRes.json()).goals || [];
            let count = 0;
            for (const goal of g) {{
                if (typeof goal.title === 'string' && goal.title.includes('{TEST_PREFIX}')) {{
                    await fetch(`/api/yearly-goals/${{goal.id}}`, {{method:'DELETE', credentials:'include'}});
                    count++;
                }}
            }}
            const hRes = await fetch('/api/habits', {{credentials:'include'}});
            const h = await hRes.json();
            for (const habit of h) {{
                if (typeof habit.title === 'string' && habit.title.includes('{TEST_PREFIX}')) {{
                    await fetch(`/api/habits/${{habit.id}}`, {{method:'DELETE', credentials:'include'}});
                    count++;
                }}
            }}
            return count;
        }}""")
        if deleted and deleted > 0:
            print(f"[cleanup] removed {deleted} stray test records")
    except Exception as e:
        print(f"[cleanup] error: {e}")


def record(name, status, detail=""):
    results.append({"name": name, "status": status, "detail": detail})
    print(f"[{status}] {name}: {detail}")


def shot(page, name):
    page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=False)


def login(page):
    page.goto(BASE, wait_until="networkidle", timeout=15000)
    page.locator('input[type="email"]').first.fill(EMAIL)
    page.locator('input[type="password"]').first.fill(PASSWORD)
    page.locator('button[type="submit"]').first.click()
    try:
        page.wait_for_url(lambda u: "/login" not in u, timeout=20000)
    except PWTimeout:
        pass
    page.wait_for_load_state("networkidle", timeout=20000)
    page.wait_for_timeout(1500)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_context(viewport={"width": 1280, "height": 900}).new_page()

        login(page)
        if "/login" in page.url:
            record("login", "FAIL", page.url)
            _dump()
            browser.close()
            return 1

        # Pre-test: clean up any stray records from prior failed runs
        _cleanup_stray_test_data(page)

        # ===== PART 1: Habit edit prefill =====
        print("\n== HABIT EDIT PREFILL (Flag #7) ==")
        page.goto(BASE + "/", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.locator("button.sd-tab:has-text('Habits')").click()
        page.wait_for_timeout(800)

        # Get expected habit name from API
        first_habit = page.evaluate("""
            async () => {
                const res = await fetch('/api/habits', { credentials: 'include' });
                const habits = await res.json();
                return habits[0] || null;
            }
        """)
        if not first_habit:
            record("habit_prefill", "FAIL", "no habits in DB")
        else:
            expected_title = first_habit["title"]
            expected_id = first_habit["id"]
            print(f"Expected habit: id={expected_id}, title='{expected_title}'")
            edit_btn = page.locator(f'[data-testid="edit-habit-{expected_id}"]').first
            if edit_btn.count() == 0:
                record("habit_prefill", "FAIL", f"no edit button for id={expected_id}")
            else:
                edit_btn.click()
                page.wait_for_timeout(1200)
                shot(page, "01-habit-edit-dialog")
                # HabitCreateDialog's title input — find the name/title input
                # It's a text input, look for one with the habit title as value
                all_inputs = page.locator('input[type="text"]:visible').all()
                found_value = None
                for inp in all_inputs:
                    try:
                        v = inp.input_value()
                        if v == expected_title:
                            found_value = v
                            break
                    except:
                        pass
                if found_value:
                    record("habit_prefill", "PASS", f"input value='{found_value}'")
                else:
                    values = [inp.input_value() for inp in all_inputs]
                    record("habit_prefill", "FAIL",
                           f"no input matches '{expected_title}'; found values: {values[:5]}")
                page.keyboard.press("Escape")
                page.wait_for_timeout(400)

        # ===== PART 2: YearlyGoalRow CRUD on /yearly-goals page =====
        print("\n== /yearly-goals ROW CRUD (Flag #9) ==")
        page.goto(BASE + "/yearly-goals", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(2000)
        shot(page, "02-yearly-goals-page")

        # Categories render expanded by default — no click needed
        page.wait_for_timeout(800)
        shot(page, "03-categories-expanded")

        # Count row-level edit/delete buttons across the whole page
        row_edit_count = page.locator("[data-testid^='edit-yearly-goal-']").count()
        row_delete_count = page.locator("[data-testid^='delete-yearly-goal-']").count()
        record("row_edit_buttons", "PASS" if row_edit_count > 0 else "FAIL", f"{row_edit_count} found")
        record("row_delete_buttons", "PASS" if row_delete_count > 0 else "FAIL", f"{row_delete_count} found")

        # Create a test goal via page's + Add Goal header button
        add_btn = page.locator("[data-testid='add-yearly-goal-page']").first
        if add_btn.count() > 0:
            add_btn.click()
            page.wait_for_timeout(800)
            page.locator('[data-testid="yearly-goal-title-input"]').first.fill(TEST_GOAL_NAME)
            page.locator('[data-testid="yearly-goal-submit"]').first.click()
            page.wait_for_timeout(2500)
            shot(page, "04-after-create")
            record("page_create", "PASS", "dialog submitted")
        else:
            record("page_create", "FAIL", "no add button")

        # Reload — categories render expanded by default
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(2000)

        # Find test goal's ID via API
        test_goal_id = page.evaluate(f"""
            async () => {{
                const res = await fetch('/api/yearly-goals/with-progress?year={time.strftime('%Y')}', {{ credentials: 'include' }});
                const data = await res.json();
                const match = data.goals.find(g => g.title === {repr(TEST_GOAL_NAME)});
                return match ? match.id : null;
            }}
        """)
        print(f"Test goal id from API: {test_goal_id}")
        record("test_goal_id_lookup", "PASS" if test_goal_id else "FAIL", f"id={test_goal_id}")

        if test_goal_id:
            # ROW EDIT: click its edit button, verify dialog prefill
            edit_btn = page.locator(f'[data-testid="edit-yearly-goal-{test_goal_id}"]').first
            if edit_btn.count() > 0:
                edit_btn.scroll_into_view_if_needed()
                edit_btn.click()
                page.wait_for_timeout(1200)
                shot(page, "05-row-edit-dialog")
                title_input = page.locator('[data-testid="yearly-goal-title-input"]').first
                prefilled = title_input.input_value() if title_input.count() > 0 else ""
                record("row_edit_prefill", "PASS" if prefilled == TEST_GOAL_NAME else "FAIL",
                       f"value='{prefilled}'")
                page.keyboard.press("Escape")
                page.wait_for_timeout(400)
            else:
                record("row_edit_click", "FAIL", f"no edit button for id {test_goal_id}")

            # ROW DELETE: click delete, confirm, verify gone via API
            del_btn = page.locator(f'[data-testid="delete-yearly-goal-{test_goal_id}"]').first
            if del_btn.count() > 0:
                del_btn.scroll_into_view_if_needed()
                del_btn.click()
                page.wait_for_timeout(800)
                shot(page, "06-delete-confirm")
                confirm = page.locator('button:has-text("Delete permanently")').first
                if confirm.count() == 0:
                    confirm = page.locator('[role="alertdialog"] button').filter(has_text="Delete").first
                confirm.click()
                page.wait_for_timeout(2500)
                shot(page, "07-after-delete")
                # Verify via API
                still_exists = page.evaluate(f"""
                    async () => {{
                        const res = await fetch('/api/yearly-goals/with-progress?year={time.strftime('%Y')}', {{ credentials: 'include' }});
                        const data = await res.json();
                        return data.goals.some(g => g.id === {test_goal_id});
                    }}
                """)
                record("row_delete_persists", "PASS" if not still_exists else "FAIL",
                       f"still_exists={still_exists}")
            else:
                record("row_delete_click", "FAIL", f"no delete button for id {test_goal_id}")

        # ===== PART 3: Default category verification =====
        print("\n== DEFAULT CATEGORY ==")
        add_btn = page.locator("[data-testid='add-yearly-goal-page']").first
        if add_btn.count() > 0:
            add_btn.click()
            page.wait_for_timeout(800)
            # Find category select element
            cat_select = page.locator('select').first
            if cat_select.count() > 0:
                cat_value = cat_select.input_value()
                record("default_category", "PASS" if cat_value == "residency" else "FAIL",
                       f"default='{cat_value}'")
            else:
                record("default_category", "FAIL", "no select element")
            page.keyboard.press("Escape")

        # Post-test cleanup: catch anything left behind
        try:
            _cleanup_stray_test_data(page)
        except Exception as e:
            print(f"[cleanup] post-test: {e}")
        browser.close()
    _dump()


def _dump():
    (OUT / "verify-final-results.json").write_text(json.dumps(results, indent=2))
    passed = sum(1 for r in results if r["status"] == "PASS")
    total = len(results)
    print(f"\n===== VERIFY FINAL =====")
    print(f"{passed}/{total} passed")


if __name__ == "__main__":
    sys.exit(main())
