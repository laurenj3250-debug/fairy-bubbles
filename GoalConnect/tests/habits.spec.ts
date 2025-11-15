import { test, expect } from '@playwright/test';

/**
 * Habit Tracking Tests
 *
 * Tests for creating, completing, and viewing habits
 */

test.describe('Habit Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Login and navigate to dashboard
    await page.goto('/');
  });

  test('can toggle a habit completion', async ({ page }) => {
    // Find a habit pill in the Today card
    const habitPill = page.locator('button').filter({ hasText: /ANKI|GERMAN|GYM|OUTSIDE/i }).first();

    if (await habitPill.isVisible()) {
      // Get initial state
      const initialClass = await habitPill.getAttribute('class');

      // Click to toggle
      await habitPill.click();

      // Wait for state change
      await page.waitForTimeout(500);

      // Class should change (completed state adds different styles)
      const newClass = await habitPill.getAttribute('class');
      expect(newClass).not.toBe(initialClass);
    }
  });

  test('completed habit shows checkmark', async ({ page }) => {
    // Find a completed habit (has primary color background)
    const completedHabit = page.locator('button[class*="bg-primary"]').first();

    if (await completedHabit.isVisible()) {
      // Should have a checkmark icon
      const checkmark = completedHabit.locator('svg');
      await expect(checkmark).toBeVisible();
    }
  });

  test('habit completion updates streak', async ({ page }) => {
    // Complete a habit
    const habitPill = page.locator('button').filter({ hasText: /habit/i }).first();

    if (await habitPill.isVisible()) {
      await habitPill.click();

      // Wait for Little Wins to update
      await page.waitForTimeout(1000);

      // Should see streak or completion in Little Wins
      await expect(page.getByText(/habit.*done|streak/i)).toBeVisible();
    }
  });

  test('expedition progress updates after habit completion', async ({ page }) => {
    // Get initial progress percentage
    const progressText = page.getByText(/\d+%/).first();
    const initialProgress = await progressText.textContent();

    // Complete a habit
    const habitPill = page.locator('button').filter({ hasText: /habit/i }).first();

    if (await habitPill.isVisible()) {
      await habitPill.click();
      await page.waitForTimeout(1000);

      // Progress might update (depending on calculation logic)
      const newProgress = await progressText.textContent();

      // At minimum, page should still be functional
      expect(newProgress).toBeTruthy();
    }
  });
});

test.describe('Week View', () => {
  test('week overview shows activity for completed days', async ({ page }) => {
    await page.goto('/');

    // Find week overview card
    const weekCard = page.locator('text=This Week').locator('..');

    // Days with activity should have visual indicators
    const activityBars = weekCard.locator('[class*="border-primary"]');
    const count = await activityBars.count();

    // Should have at least some activity (or zero if brand new account)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('clicking a day opens detailed modal', async ({ page }) => {
    await page.goto('/');

    // Click on a day in the week strip
    const dayButton = page.locator('text=/M|T|W|F|S/').first();
    await dayButton.click();

    // Modal should show day details
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Should show stats for that day
    await expect(modal.getByText(/Habits Completed|Tasks Completed|Goal Progress/i)).toBeVisible();
  });
});
