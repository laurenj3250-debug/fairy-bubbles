"""Hardening verification: validation errors, error toasts.

Usage (from repo root):
  python3 ~/.claude/skills/webapp-testing/scripts/with_server.py \\
    --server "npm run dev" --port 5001 --timeout 90 -- \\
    python3 tests/e2e-audit/verify-hardening.py
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

OUT = Path(__file__).resolve().parents[2] / ".e2e-output" / "verify-hardening"
SHOTS = OUT / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)
EMAIL = "laurenj3250@gmail.com"
PASSWORD = "Crumpet11!!"
BASE = "http://localhost:5001"

results = []


def record(name, status, detail=""):
    results.append((name, status, detail))
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

        # ===== 1. Empty-title validation (client-side short-circuit) =====
        print("\n== EMPTY TITLE VALIDATION ==")
        page.goto(BASE + "/", wait_until="networkidle")
        page.wait_for_timeout(1500)
        # Open dialog via dashboard add button
        add_btn = page.locator('[data-testid="add-yearly-goal"]').first
        add_btn.click()
        page.wait_for_timeout(800)
        shot(page, "01-dialog-open")
        # Remove HTML5 required attribute so we can submit empty
        # (YearlyGoalDialog uses `required` on the input, which blocks native submit)
        page.evaluate("""
            const inp = document.querySelector('[data-testid=\"yearly-goal-title-input\"]');
            if (inp) inp.removeAttribute('required');
        """)
        # Submit with empty title
        page.locator('[data-testid="yearly-goal-submit"]').first.click()
        page.wait_for_timeout(1000)
        shot(page, "02-empty-submit")
        # Toast — look for destructive variant or the exact string
        toast = page.locator("text=Title required").count()
        record("empty_title_toast", "PASS" if toast > 0 else "FAIL",
               f"toast matches: {toast}")
        # Dialog should still be open (not closed on error)
        dialog_still_open = page.locator('[data-testid="yearly-goal-title-input"]').count()
        record("dialog_stays_open_on_error",
               "PASS" if dialog_still_open > 0 else "FAIL",
               f"inputs visible: {dialog_still_open}")
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)

        # ===== 2. Confirm server-side Zod rejects invalid data =====
        print("\n== SERVER VALIDATION (Zod) ==")
        status_empty = page.evaluate("""async () => {
            const r = await fetch('/api/yearly-goals', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({year:'2026', title:'', category:'fitness'})
            });
            return r.status;
        }""")
        record("server_rejects_empty_title",
               "PASS" if status_empty == 400 else "FAIL",
               f"status={status_empty}")

        status_bad_category = page.evaluate("""async () => {
            const r = await fetch('/api/yearly-goals', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({year:'2026', title:'X', category:'not_a_real_category'})
            });
            return r.status;
        }""")
        record("server_rejects_bad_category",
               "PASS" if status_bad_category == 400 else "FAIL",
               f"status={status_bad_category}")

        # ===== 3. Delete non-existent goal (404 path) =====
        print("\n== DELETE 404 ==")
        del_status = page.evaluate("""async () => {
            const r = await fetch('/api/yearly-goals/999999', {
                method: 'DELETE',
                credentials: 'include'
            });
            return r.status;
        }""")
        record("delete_nonexistent_404",
               "PASS" if del_status == 404 else "FAIL",
               f"status={del_status}")

        browser.close()

    print("\n===== HARDENING RESULTS =====")
    passed = sum(1 for _, s, _ in results if s == "PASS")
    print(f"{passed}/{len(results)} passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
