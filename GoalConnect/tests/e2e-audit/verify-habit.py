"""Habit CRUD roundtrip on Sundown dashboard — create via dialog, delete via trash+confirm.

Usage (from repo root):
  python3 ~/.claude/skills/webapp-testing/scripts/with_server.py \\
    --server "npm run dev" --port 5001 --timeout 90 -- \\
    python3 tests/e2e-audit/verify-habit.py
"""
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

TEST_PREFIX = "_E2E_"
TEST_NAME = f"{TEST_PREFIX}Habit_{int(time.time())}"

SHOTS = Path(__file__).resolve().parents[2] / ".e2e-output" / "verify-habit" / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)
EMAIL = "laurenj3250@gmail.com"
PASSWORD = "Crumpet11!!"
BASE = "http://localhost:5001"


def _cleanup_stray_habits(page):
    """Best-effort delete of any stray test habits from prior failed runs."""
    try:
        deleted = page.evaluate(f"""async () => {{
            const r = await fetch('/api/habits', {{credentials:'include'}});
            const habits = await r.json();
            let count = 0;
            for (const h of habits) {{
                if (typeof h.title === 'string' && h.title.includes('{TEST_PREFIX}')) {{
                    await fetch(`/api/habits/${{h.id}}`, {{method:'DELETE', credentials:'include'}});
                    count++;
                }}
            }}
            return count;
        }}""")
        if deleted and deleted > 0:
            print(f"[cleanup] removed {deleted} stray habits")
    except Exception as e:
        print(f"[cleanup] error: {e}")


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
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_context(viewport={"width": 1280, "height": 900}).new_page()

        login(page)
        if "/login" in page.url:
            print("LOGIN FAIL")
            return 1

        # Pre-test cleanup
        _cleanup_stray_habits(page)

        page.goto(BASE + "/", wait_until="networkidle")
        page.wait_for_timeout(1500)

        # Switch to Habits tab
        page.locator("button.sd-tab:has-text('Habits')").click()
        page.wait_for_timeout(800)
        shot(page, "01-habits-tab")

        # Count delete buttons before
        before_delete = page.locator('[data-testid^="delete-habit-"]').count()
        before_edit = page.locator('[data-testid^="edit-habit-"]').count()
        print(f"Before: {before_delete} delete buttons, {before_edit} edit buttons")
        results.append(("edit_buttons_visible",
                        "PASS" if before_edit > 0 else "FAIL", f"{before_edit}"))
        results.append(("delete_buttons_visible",
                        "PASS" if before_delete > 0 else "FAIL", f"{before_delete}"))

        # Create a test habit via the Add button
        add_btn = page.locator('[data-testid="add-habit"]').first
        if add_btn.count() == 0:
            print("Add button missing, aborting")
            results.append(("add_button", "FAIL", "not found"))
            _dump(results)
            return 1

        add_btn.click()
        page.wait_for_timeout(1500)
        shot(page, "02-create-dialog")
        # HabitCreateDialog opens to a template picker — click "customize from scratch"
        custom_link = page.locator('text=/customize from scratch/i').first
        if custom_link.count() > 0:
            custom_link.click()
            page.wait_for_timeout(800)
            shot(page, "02b-custom-form")
        else:
            # Alternative: pick a template
            page.locator('text=Morning Stretch').first.click()
            page.wait_for_timeout(800)
        # Now the form should have inputs
        visible_inputs = page.locator('input[type="text"]:visible').all()
        print(f"Found {len(visible_inputs)} text inputs in dialog")
        results.append(("create_dialog", "PASS" if visible_inputs else "FAIL",
                        f"{len(visible_inputs)} inputs"))
        if visible_inputs:
            visible_inputs[0].fill(TEST_NAME)
            page.wait_for_timeout(300)
            # Find submit button
            submit = page.locator('button:has-text("Create Habit"), button:has-text("Save Habit"), button:has-text("Create"), button[type="submit"]').last
            submit.click()
            page.wait_for_timeout(2500)
            shot(page, "03-after-create")
        else:
            _dump(results)
            browser.close()
            return 1

        # Reload and verify habit appears
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.locator("button.sd-tab:has-text('Habits')").click()
        page.wait_for_timeout(800)

        found_after_create = page.locator(f"text={TEST_NAME}").count()
        after_delete_count = page.locator('[data-testid^="delete-habit-"]').count()
        print(f"After create: {after_delete_count} delete buttons, found text: {found_after_create}")
        shot(page, "04-after-reload")
        results.append(("create_persists",
                        "PASS" if found_after_create > 0 else "FAIL",
                        f"text found {found_after_create}, button count {before_delete}→{after_delete_count}"))

        # Now delete it — look up the test habit ID via the habits API
        if found_after_create > 0:
            test_habit_id = page.evaluate(f"""
                async () => {{
                    const res = await fetch('/api/habits', {{ credentials: 'include' }});
                    const habits = await res.json();
                    const match = habits.find(h => h.title === {repr(TEST_NAME)});
                    return match ? match.id : null;
                }}
            """)
            print(f"Test habit id from API: {test_habit_id}")
            results.append(("habit_id_lookup",
                            "PASS" if test_habit_id else "FAIL",
                            f"id={test_habit_id}"))

            if test_habit_id:
                del_btn = page.locator(f'[data-testid="delete-habit-{test_habit_id}"]').first
                del_btn.click()
                page.wait_for_timeout(800)
                shot(page, "05-delete-confirm")

                # Click the confirm button — use "Delete permanently" since that's the actual label
                confirm = page.locator('button:has-text("Delete permanently")').first
                if confirm.count() == 0:
                    confirm = page.locator('[role="alertdialog"] button').filter(has_text="Delete").first
                confirm.click()
                page.wait_for_timeout(2500)
                shot(page, "06-after-delete")

                # Verify removed via API (authoritative)
                still_in_db = page.evaluate(f"""
                    async () => {{
                        const res = await fetch('/api/habits', {{ credentials: 'include' }});
                        const habits = await res.json();
                        return habits.some(h => h.id === {test_habit_id});
                    }}
                """)
                results.append(("delete_persists",
                                "PASS" if not still_in_db else "FAIL",
                                f"still_in_db={still_in_db}"))

        # Post-test cleanup
        try: _cleanup_stray_habits(page)
        except Exception as e: print(f"[cleanup] post-test: {e}")
        browser.close()

    print("\n===== HABIT CRUD RESULTS =====")
    passed = sum(1 for _, s, _ in results if s == "PASS")
    for name, status, detail in results:
        print(f"[{status}] {name}: {detail}")
    print(f"\n{passed}/{len(results)} passed")
    return 0 if passed == len(results) else 1


def _dump(results):
    print("\n===== HABIT CRUD RESULTS =====")
    passed = sum(1 for _, s, _ in results if s == "PASS")
    for name, status, detail in results:
        print(f"[{status}] {name}: {detail}")
    print(f"\n{passed}/{len(results)} passed")


if __name__ == "__main__":
    sys.exit(main())
