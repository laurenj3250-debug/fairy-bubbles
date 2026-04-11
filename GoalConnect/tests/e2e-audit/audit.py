"""Sundown dashboard E2E functionality audit.

Tests every interactive element on the dashboard post-login.
Captures screenshots and binary pass/fail per element.

Usage (from repo root):
  python3 ~/.claude/skills/webapp-testing/scripts/with_server.py \\
    --server "npm run dev" --port 5001 --timeout 90 -- \\
    python3 tests/e2e-audit/audit.py

Output: .e2e-output/audit/findings.json + screenshots/*.png
"""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

# Output lands next to the repo but under .e2e-output so it's gitignorable
OUT = Path(__file__).resolve().parents[2] / ".e2e-output" / "audit"
SHOTS = OUT / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)

EMAIL = "laurenj3250@gmail.com"
PASSWORD = "Crumpet11!!"
BASE = "http://localhost:5001"

findings = {"passed": [], "failed": [], "errors": []}


def record(category, name, status, detail=""):
    entry = {"name": name, "status": status, "detail": detail}
    if status == "PASS":
        findings["passed"].append(entry)
    elif status == "FAIL":
        findings["failed"].append(entry)
    else:
        findings["errors"].append(entry)
    print(f"  [{status}] {category}/{name}: {detail}")


def shot(page, name):
    path = SHOTS / f"{name}.png"
    page.screenshot(path=str(path), full_page=False)
    return str(path)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        page = context.new_page()

        # 1. LOGIN
        print("\n== LOGIN ==")
        try:
            page.goto(BASE, wait_until="networkidle", timeout=15000)
            shot(page, "01-login-page")
            # Look for email input
            email_input = page.locator('input[type="email"], input[name="email"]').first
            email_input.fill(EMAIL)
            pw_input = page.locator('input[type="password"]').first
            pw_input.fill(PASSWORD)
            page.locator('button[type="submit"]').first.click()
            # Wait for URL to change off /login
            try:
                page.wait_for_url(lambda u: "/login" not in u, timeout=20000)
            except PWTimeout:
                pass
            page.wait_for_load_state("networkidle", timeout=20000)
            page.wait_for_timeout(1500)
            shot(page, "02-post-login")
            if "/login" in page.url:
                record("auth", "login", "FAIL", f"Still on login, url={page.url}")
                browser.close()
                _dump()
                return 1
            record("auth", "login", "PASS", f"navigated to {page.url}")
        except Exception as e:
            record("auth", "login", "ERROR", str(e))
            browser.close()
            _dump()
            return 1

        # 2. Navigate to Sundown dashboard
        print("\n== NAV TO DASHBOARD ==")
        try:
            if page.url != BASE + "/" and not page.url.endswith("/"):
                page.goto(BASE + "/", wait_until="networkidle")
            page.wait_for_timeout(1500)
            shot(page, "03-dashboard-overview")
            # verify sd-shell or sd-content present
            has_sundown = page.locator(".sd-content, .sd-shell").count() > 0
            record("nav", "dashboard_loads", "PASS" if has_sundown else "FAIL",
                   f"sundown elements: {page.locator('.sd-shell').count()}")
        except Exception as e:
            record("nav", "dashboard_loads", "ERROR", str(e))

        # 3. TABS
        print("\n== TABS ==")
        for tab_name in ["Overview", "Goals", "Habits"]:
            try:
                tab = page.locator(f"button.sd-tab:has-text('{tab_name}')").first
                tab.click()
                page.wait_for_timeout(500)
                shot(page, f"04-tab-{tab_name.lower()}")
                active = page.locator(f"button.sd-tab.active:has-text('{tab_name}')").count()
                record("tabs", f"switch_to_{tab_name}", "PASS" if active else "FAIL",
                       f"active count: {active}")
            except Exception as e:
                record("tabs", f"switch_to_{tab_name}", "ERROR", str(e))

        # 4. OVERVIEW tab — toggle habit
        print("\n== OVERVIEW / HABIT TOGGLE ==")
        try:
            page.locator("button.sd-tab:has-text('Overview')").click()
            page.wait_for_timeout(500)
            # star dots in stardust trail
            dots = page.locator(".sd-star-dot")
            dot_count = dots.count()
            record("overview", "star_dots_rendered", "PASS" if dot_count > 0 else "FAIL",
                   f"{dot_count} star dots")
            if dot_count > 0:
                # click a non-future dot — find one that isn't .future
                try:
                    non_future = page.locator(".sd-star-dot:not(.future)")
                    if non_future.count() == 0:
                        non_future = dots
                    initial_done = page.locator(".sd-star-dot.done").count()
                    non_future.first.click(force=True)
                    page.wait_for_timeout(800)
                    after_done = page.locator(".sd-star-dot.done").count()
                    changed = initial_done != after_done
                    record("overview", "habit_toggle_visual_change", "PASS" if changed else "FAIL",
                           f"done {initial_done}→{after_done}")
                except Exception as e:
                    record("overview", "habit_toggle_click", "ERROR", str(e))
        except Exception as e:
            record("overview", "star_dots", "ERROR", str(e))

        # 5. OVERVIEW — increment goal
        print("\n== OVERVIEW / GOAL INCREMENT ==")
        try:
            # Scroll to monthly goals
            page.evaluate("window.scrollTo(0, 800)")
            page.wait_for_timeout(500)
            shot(page, "05-goals-section")
            # Count goal tiles
            tiles = page.locator(".sd-goal-tile")
            tile_count = tiles.count()
            record("goals", "goal_tiles_rendered", "PASS" if tile_count > 0 else "FAIL",
                   f"{tile_count} tiles")
            if tile_count > 0:
                # Pick an increment button and track its specific goal ID — tile order can reshuffle on refetch.
                inc_btn = page.locator("[data-testid^='increment-goal-']").first
                try:
                    if inc_btn.count() > 0:
                        testid = inc_btn.get_attribute("data-testid") or ""
                        goal_id = testid.replace("increment-goal-", "")
                        # Check currentValue via API before and after
                        before_val = page.evaluate(f"""async () => {{
                            const r = await fetch('/api/yearly-goals/with-progress', {{credentials:'include'}});
                            const d = await r.json();
                            const g = d.goals.find(x => x.id === {goal_id});
                            return g ? g.computedValue : null;
                        }}""")
                        inc_btn.click()
                        page.wait_for_timeout(1500)
                        after_val = page.evaluate(f"""async () => {{
                            const r = await fetch('/api/yearly-goals/with-progress', {{credentials:'include'}});
                            const d = await r.json();
                            const g = d.goals.find(x => x.id === {goal_id});
                            return g ? g.computedValue : null;
                        }}""")
                        record("goals", "goal_increment",
                               "PASS" if (after_val is not None and before_val is not None and after_val > before_val) else "FAIL",
                               f"goal {goal_id}: {before_val} → {after_val}")
                    else:
                        record("goals", "goal_increment", "FAIL", "no increment testid")
                except Exception as e:
                    record("goals", "goal_increment_click", "ERROR", str(e))
            # Look for edit/delete/create buttons — now using real testids
            edit_btns = page.locator("[data-testid^='edit-goal-']").count()
            delete_btns = page.locator("[data-testid^='delete-goal-']").count()
            add_btns = page.locator("[data-testid='add-yearly-goal']").count()
            record("goals", "edit_button_exists", "PASS" if edit_btns > 0 else "FAIL", f"{edit_btns} found")
            record("goals", "delete_button_exists", "PASS" if delete_btns > 0 else "FAIL", f"{delete_btns} found")
            record("goals", "add_button_exists", "PASS" if add_btns > 0 else "FAIL", f"{add_btns} found")
        except Exception as e:
            record("goals", "overall_goals_audit", "ERROR", str(e))

        # 6. HABITS tab — edit/delete/create
        print("\n== HABITS TAB ==")
        try:
            page.locator("button.sd-tab:has-text('Habits')").click()
            page.wait_for_timeout(800)
            shot(page, "06-habits-tab")
            edit_btns = page.locator("[data-testid^='edit-habit-']").count()
            delete_btns = page.locator("[data-testid^='delete-habit-']").count()
            add_btns = page.locator("[data-testid='add-habit']").count()
            record("habits_tab", "edit_button_exists", "PASS" if edit_btns > 0 else "FAIL", f"{edit_btns} found")
            record("habits_tab", "delete_button_exists", "PASS" if delete_btns > 0 else "FAIL", f"{delete_btns} found")
            record("habits_tab", "add_button_exists", "PASS" if add_btns > 0 else "FAIL", f"{add_btns} found")

            # Today view toggle button already tested in Overview, check the big 44x44 square
            today_toggles = page.locator("div:has(> button) button").filter(
                has_text=""
            ).count()
            # View switcher pills
            for view in ["today", "week", "rings"]:
                try:
                    pill = page.locator(f"button.sd-habits-view-pill:has-text('{view.capitalize()}')").first
                    pill.click()
                    page.wait_for_timeout(400)
                    active = page.locator(f"button.sd-habits-view-pill.active:has-text('{view.capitalize()}')").count()
                    record("habits_tab", f"view_{view}", "PASS" if active else "FAIL",
                           f"active={active}")
                    shot(page, f"07-habits-view-{view}")
                except Exception as e:
                    record("habits_tab", f"view_{view}", "ERROR", str(e))
        except Exception as e:
            record("habits_tab", "overall_habits_audit", "ERROR", str(e))

        # 7. GOALS tab
        print("\n== GOALS TAB ==")
        try:
            page.locator("button.sd-tab:has-text('Goals')").click()
            page.wait_for_timeout(800)
            shot(page, "08-goals-tab")
            # count visible elements
            goals_tab_visible = page.locator("div").filter(has_text="Goals").count()
            record("goals_tab", "renders", "PASS" if goals_tab_visible > 0 else "FAIL", "")
            edit_btns = page.locator("[data-testid^='edit-goal-']").count()
            add_btns = page.locator("[data-testid='add-yearly-goal']").count()
            record("goals_tab", "edit_exists", "PASS" if edit_btns > 0 else "FAIL", f"{edit_btns}")
            record("goals_tab", "add_exists", "PASS" if add_btns > 0 else "FAIL", f"{add_btns}")
        except Exception as e:
            record("goals_tab", "overall", "ERROR", str(e))

        # 8. Residency countdown
        print("\n== RESIDENCY COUNTDOWN ==")
        try:
            page.locator("button.sd-tab:has-text('Overview')").click()
            page.wait_for_timeout(500)
            countdown = page.locator(".sd-residency-strip")
            c_count = countdown.count()
            record("countdown", "renders", "PASS" if c_count > 0 else "FAIL", f"{c_count} elements")
        except Exception as e:
            record("countdown", "renders", "ERROR", str(e))

        # 9. Nav links
        print("\n== NAV LINKS ==")
        try:
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(500)
            nav_links = page.locator(".sd-nav-link")
            link_count = nav_links.count()
            record("nav", "link_count", "PASS" if link_count >= 6 else "FAIL",
                   f"{link_count}/6 nav links")
            shot(page, "09-nav-links")
        except Exception as e:
            record("nav", "nav_links", "ERROR", str(e))

        # 10. /yearly-goals page audit
        print("\n== /yearly-goals PAGE ==")
        try:
            page.goto(BASE + "/yearly-goals", wait_until="networkidle", timeout=10000)
            page.wait_for_timeout(1500)
            shot(page, "10-yearly-goals-page")
            add_btn = page.locator("[data-testid='add-yearly-goal-page']").count()
            edit_btns = page.locator("[data-testid^='edit-yearly-goal-']").count()
            delete_btns = page.locator("[data-testid^='delete-yearly-goal-']").count()
            record("yearly_goals_page", "add_button", "PASS" if add_btn > 0 else "FAIL", f"{add_btn}")
            record("yearly_goals_page", "edit_buttons", "PASS" if edit_btns > 0 else "FAIL", f"{edit_btns}")
            record("yearly_goals_page", "delete_buttons", "PASS" if delete_btns > 0 else "FAIL", f"{delete_btns}")
        except Exception as e:
            record("yearly_goals_page", "load", "ERROR", str(e))

        browser.close()
    _dump()


def _dump():
    out = OUT / "findings.json"
    out.write_text(json.dumps(findings, indent=2))
    total = len(findings["passed"]) + len(findings["failed"]) + len(findings["errors"])
    print(f"\n===== AUDIT COMPLETE =====")
    print(f"PASS:  {len(findings['passed'])}/{total}")
    print(f"FAIL:  {len(findings['failed'])}/{total}")
    print(f"ERROR: {len(findings['errors'])}/{total}")
    print(f"Screenshots: {SHOTS}")
    print(f"Findings: {out}")


if __name__ == "__main__":
    sys.exit(main())
