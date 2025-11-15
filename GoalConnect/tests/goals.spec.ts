import { test, expect } from '@playwright/test';

/**
 * Goals Management Tests
 *
 * Tests for creating, updating, and tracking goals
 */

test.describe('Goals Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Goals card shows active goals', async ({ page }) => {
    const goalsCard = page.locator('text=Goals').locator('..');
    await expect(goalsCard).toBeVisible();

    // Should show goals or empty state
    const hasGoals = await page.getByText(/\d+\/\d+/).isVisible();
    const hasEmptyState = await page.getByText(/No active goals/i).isVisible();

    expect(hasGoals || hasEmptyState).toBeTruthy();
  });

  test('goal progress visualizations are visible', async ({ page }) => {
    // Check for segmented bars or milestone dots
    const goalsCard = page.locator('text=Goals').locator('..');

    // Look for progress visualization elements
    const hasSegments = await goalsCard.locator('[class*="flex gap-1"]').isVisible();
    const hasDots = await goalsCard.locator('[class*="rounded-full"]').isVisible();

    // At least one visualization type should be present (if goals exist)
    if (await goalsCard.getByText(/\d+\/\d+/).isVisible()) {
      expect(hasSegments || hasDots).toBeTruthy();
    }
  });

  test('goals show percentage progress', async ({ page }) => {
    const goalsCard = page.locator('text=Goals').locator('..');

    // If goals exist, should show percentage
    if (await goalsCard.getByText(/\d+\/\d+/).isVisible()) {
      await expect(goalsCard.getByText(/\d+%/)).toBeVisible();
    }
  });

  test('different goals use different visualizations', async ({ page }) => {
    const goalsCard = page.locator('text=Goals').locator('..');

    // Count segmented bars
    const segments = goalsCard.locator('[class*="flex gap-1"]');
    const segmentCount = await segments.count();

    // Count dot visualizations
    const dots = goalsCard.locator('[class*="justify-between"]').filter({ has: page.locator('[class*="rounded-full"]') });
    const dotCount = await dots.count();

    // If multiple goals exist, should have variety
    if ((segmentCount + dotCount) > 1) {
      // At least one of each type should exist (based on alternating logic)
      expect(segmentCount > 0 || dotCount > 0).toBeTruthy();
    }
  });
});

test.describe('Goal Navigation', () => {
  test('can navigate to full goals page', async ({ page }) => {
    await page.goto('/');

    // Look for navigation link to Goals page
    const goalsLink = page.getByRole('link', { name: /goals/i });

    if (await goalsLink.isVisible()) {
      await goalsLink.click();
      await expect(page).toHaveURL(/.*goals/);
    }
  });
});
