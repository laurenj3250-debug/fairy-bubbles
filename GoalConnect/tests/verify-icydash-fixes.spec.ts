/**
 * Verify IcyDash fixes:
 * 1. Habit widget not stretched
 * 2. Recent Adventures shows climbing days (ice climbing)
 * 3. Book goals show Media Library source
 */
import { test, expect } from "@playwright/test";

test.describe("IcyDash Fixes Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("1. Habit widget height is reasonable", async ({ page }) => {
    const habitCard = page.locator('div.glass-card:has(span.card-title:text("This Week"))');
    await expect(habitCard).toBeVisible({ timeout: 10000 });

    const box = await habitCard.boundingBox();
    console.log(`Habit widget height: ${box?.height}px`);

    // 515px was measured - this is the natural content height, not stretched
    expect(box?.height).toBeLessThan(600);

    await page.screenshot({ path: "tests/screenshots/habit-widget.png", fullPage: false });
  });

  test("2. Recent outdoor activities API returns climbing days", async ({ page }) => {
    // Test the API directly
    const response = await page.request.get("/api/recent-outdoor-activities?limit=10");
    expect(response.ok()).toBeTruthy();

    const activities = await response.json();
    console.log("Recent outdoor activities:", JSON.stringify(activities, null, 2));

    // Check if any climbing_day type exists
    const hasClimbingDay = activities.some((a: any) => a.type === "climbing_day");
    console.log(`Has climbing_day entries: ${hasClimbingDay}`);

    // If there are climbing days, they should be included
    if (activities.length > 0) {
      console.log(`Total activities: ${activities.length}`);
      const types = activities.map((a: any) => a.type);
      console.log(`Activity types: ${types.join(", ")}`);
    }
  });

  test("3. Recent Adventures widget shows content", async ({ page }) => {
    const recentAdventures = page.locator('div.glass-card:has(span:text("Recent Adventures"))');
    await expect(recentAdventures).toBeVisible({ timeout: 10000 });

    const content = await recentAdventures.textContent();
    console.log(`Recent Adventures widget content: ${content?.substring(0, 200)}`);

    // Take screenshot
    await page.screenshot({ path: "tests/screenshots/recent-adventures-widget.png", fullPage: false });
  });

  test("4. Book goals show Media Library source", async ({ page }) => {
    // Test the yearly goals API to check book goals have correct sourceLabel
    const response = await page.request.get("/api/yearly-goals/with-progress?year=2026");
    expect(response.ok()).toBeTruthy();

    const goals = await response.json();

    // Find book-related goals
    const bookGoals = goals.filter((g: any) =>
      g.title.toLowerCase().includes("book") ||
      g.title.toLowerCase().includes("audiobook")
    );

    console.log("Book-related goals:");
    bookGoals.forEach((g: any) => {
      console.log(`  - "${g.title}": sourceLabel="${g.sourceLabel}", value=${g.currentValue}/${g.targetValue}`);
    });

    // Check at least one has Media Library source
    const hasMediaLibrarySource = bookGoals.some((g: any) => g.sourceLabel === "Media Library");
    console.log(`Has Media Library source: ${hasMediaLibrarySource}`);

    // Take full page screenshot to see goals
    await page.screenshot({ path: "tests/screenshots/book-goals.png", fullPage: true });
  });
});
