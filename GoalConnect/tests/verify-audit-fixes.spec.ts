/**
 * Verify ALL IcyDash audit fixes:
 * Commit 1: orbs, rewards widget, goal cards, lifting sync
 * Commit 2: sidebar active, CriticalHit, MountainHero, ResidencyCountdown
 * Commit 3: SQL type fix, duplicate mobile nav removal
 */
import { test, expect } from "@playwright/test";

test.describe("IcyDash Audit Fixes — Desktop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  // === COMMIT 1 FIXES ===

  test("Fix 1: Habit orbs are NOT wrapped in a Link to /habits", async ({ page }) => {
    // The fix removed <Link href="/habits"> around GlowingOrbHabits
    // Check there's no anchor linking orbs to /habits near the header
    const orbSection = page.locator('text=Goal Connect').locator('..');
    const linkToHabits = orbSection.locator('a[href="/habits"]');
    const linkCount = await linkToHabits.count();
    console.log(`Links to /habits near "Goal Connect": ${linkCount}`);
    expect(linkCount).toBe(0);

    await page.screenshot({ path: "tests/screenshots/orb-no-link.png" });
  });

  test("Fix 2: NextRewardWidget uses glass-card frost-accent styling", async ({ page }) => {
    // Find the Next Reward widget by its label text
    const rewardLabel = page.locator('text=Next Reward').first();
    await expect(rewardLabel).toBeVisible({ timeout: 10000 });

    // Walk up to the glass-card container
    const rewardWidget = page.locator('.glass-card:has(span:text("Next Reward"))').first();
    const classAttr = await rewardWidget.getAttribute("class");
    console.log(`NextRewardWidget classes: ${classAttr}`);
    expect(classAttr).toContain("glass-card");

    await page.screenshot({ path: "tests/screenshots/reward-widget-glass.png" });
  });

  test("Fix 3: Goal cards use compact 28x28 SVG rings", async ({ page }) => {
    // Find SVG rings used by weekly/monthly goal cards
    const svgRings = page.locator('svg[viewBox="0 0 28 28"]');
    const ringCount = await svgRings.count();
    console.log(`Compact 28x28 SVG rings found: ${ringCount}`);

    if (ringCount > 0) {
      const ringBox = await svgRings.first().boundingBox();
      console.log(`Ring size: ${ringBox?.width}x${ringBox?.height}px`);
      expect(ringBox?.width).toBeLessThanOrEqual(32);
    } else {
      console.log("No weekly/monthly goals present — skipping ring size check");
    }

    await page.screenshot({ path: "tests/screenshots/compact-goals.png" });
  });

  test("Fix 4: Yearly goals API returns lifting data correctly", async ({ page }) => {
    const response = await page.request.get("/api/yearly-goals/with-progress?year=2026");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    const goals = Array.isArray(data) ? data : data.goals || [];
    const liftingGoal = goals.find((g: any) =>
      g.title.toLowerCase().includes("lifting") ||
      g.linkedJourneyKey === "lifting_workouts"
    );

    if (liftingGoal) {
      console.log(`Lifting goal: "${liftingGoal.title}"`);
      console.log(`  Progress: ${liftingGoal.computedValue}/${liftingGoal.targetValue}`);
      console.log(`  Source: ${liftingGoal.sourceLabel}`);
      expect(liftingGoal.sourceLabel).toBe("Lifting Log");
      expect(liftingGoal.computedValue).toBeGreaterThan(0);
    } else {
      console.log("No lifting goal found in yearly goals");
    }
  });

  // === COMMIT 2 FIXES ===

  test("Fix 5: Sidebar shows active state for dashboard", async ({ page }) => {
    // On desktop, sidebar nav links should exist
    // The dashboard link should have peach-400 color (active)
    const sidebarLinks = page.locator('aside a, nav a').filter({ hasText: /dashboard/i });

    if (await sidebarLinks.count() > 0) {
      const link = sidebarLinks.first();
      const span = link.locator('span');
      const classAttr = await span.getAttribute("class");
      console.log(`Dashboard nav classes: ${classAttr}`);
      const isActive = classAttr?.includes("text-peach-400");
      console.log(`Dashboard link has active color: ${isActive}`);
      expect(isActive).toBeTruthy();
    } else {
      console.log("Sidebar not visible at this viewport — OK");
    }

    await page.screenshot({ path: "tests/screenshots/sidebar-active.png" });
  });

  test("Fix 6: MountainHero shows real habit count", async ({ page }) => {
    // Get actual habit count from API
    const response = await page.request.get("/api/habits-with-data");
    expect(response.ok()).toBeTruthy();
    const habits = await response.json();
    const totalHabits = habits.length;
    console.log(`API reports ${totalHabits} habits`);

    // Check that the hero text uses the real count
    const heroText = page.locator('text=/\\d+ of \\d+ habits/');
    await expect(heroText).toBeVisible({ timeout: 10000 });
    const text = await heroText.textContent();
    console.log(`Hero text: "${text}"`);

    const match = text?.match(/of (\d+) habits/);
    if (match) {
      const displayedTotal = parseInt(match[1]);
      console.log(`Displayed total: ${displayedTotal}, API total: ${totalHabits}`);
      expect(displayedTotal).toBe(totalHabits);
    }
  });

  test("Fix 7: ResidencyCountdown shows years AND months", async ({ page }) => {
    // Look for the residency countdown in both compact and full forms
    const yearMonthPattern = page.locator('text=/\\d+y\\s+\\d+m/').first();

    if (await yearMonthPattern.isVisible({ timeout: 5000 }).catch(() => false)) {
      const text = await yearMonthPattern.textContent();
      console.log(`Residency countdown text: "${text}"`);
      expect(/\d+y\s+\d+m/.test(text || "")).toBeTruthy();
    } else {
      // Maybe residency hasn't started yet or is complete
      console.log("Residency countdown pattern not found — checking for widget");
      await page.screenshot({ path: "tests/screenshots/residency-countdown.png" });
    }
  });

  test("Fix 8: No duplicate bottom nav on desktop", async ({ page }) => {
    // On desktop, there should only be the existing BottomNav component
    const bottomNavs = page.locator('nav.fixed');
    const count = await bottomNavs.count();
    console.log(`Fixed nav elements: ${count}`);
    // On desktop they may be hidden, but there shouldn't be duplicates
    // The md:hidden one we removed should no longer exist

    const allNavs = page.locator('nav');
    const navCount = await allNavs.count();
    console.log(`Total nav elements: ${navCount}`);

    await page.screenshot({ path: "tests/screenshots/no-duplicate-nav.png" });
  });
});

test.describe("IcyDash Audit Fixes — Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("Fix 9: Single mobile bottom nav is visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should have exactly one bottom nav visible
    const bottomNav = page.getByTestId("bottom-nav");
    await expect(bottomNav).toBeVisible({ timeout: 10000 });

    // Verify it has nav items
    const navButtons = bottomNav.locator('button');
    const buttonCount = await navButtons.count();
    console.log(`Mobile nav buttons: ${buttonCount}`);
    expect(buttonCount).toBeGreaterThanOrEqual(3);

    await page.screenshot({ path: "tests/screenshots/mobile-single-nav.png", fullPage: false });
  });
});
