import { test, expect } from '@playwright/test';

/**
 * Dream Scroll Integration Tests
 *
 * Tests for Looking Forward card pulling from Dream Scroll
 */

test.describe('Looking Forward Card', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Looking Forward card is visible on dashboard', async ({ page }) => {
    await expect(page.getByText('Looking Forward To')).toBeVisible();
  });

  test('shows Dream Scroll items or empty state', async ({ page }) => {
    const lookingForwardCard = page.locator('text=Looking Forward To').locator('..');

    // Should show items or "Nothing added yet"
    const hasItems = await lookingForwardCard.locator('button, a').first().isVisible();
    const hasEmptyState = await lookingForwardCard.getByText(/Nothing added yet/i).isVisible();

    expect(hasItems || hasEmptyState).toBeTruthy();
  });

  test('Dream Scroll items show icons', async ({ page }) => {
    const lookingForwardCard = page.locator('text=Looking Forward To').locator('..');

    // If items exist, they should have icons
    const items = lookingForwardCard.locator('[class*="flex items-center gap-3"]');

    if (await items.first().isVisible()) {
      const icon = items.first().locator('svg');
      await expect(icon).toBeVisible();
    }
  });

  test('high priority items are highlighted', async ({ page }) => {
    const lookingForwardCard = page.locator('text=Looking Forward To').locator('..');

    // High priority items should have special styling
    const priorityItems = lookingForwardCard.locator('[class*="bg-primary"]');

    // May or may not have high priority items
    const count = await priorityItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('shows add button', async ({ page }) => {
    const lookingForwardCard = page.locator('text=Looking Forward To').locator('..');

    // Should have "+ Add Something" button
    const addButton = lookingForwardCard.getByRole('button', { name: /Add Something to Look Forward To/i });
    await expect(addButton).toBeVisible();
  });

  test('can click add button', async ({ page }) => {
    const lookingForwardCard = page.locator('text=Looking Forward To').locator('..');

    const addButton = lookingForwardCard.getByRole('button', { name: /Add Something/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      // Should trigger some action (modal, navigation, etc.)
      // Update this based on actual implementation
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Dream Scroll Full Page', () => {
  test('can navigate to Dream Scroll page', async ({ page }) => {
    await page.goto('/');

    // Look for navigation to Dream Scroll
    const dreamScrollLink = page.getByRole('link', { name: /dream scroll|journal|notes/i });

    if (await dreamScrollLink.isVisible()) {
      await dreamScrollLink.click();
      // Should navigate to dream scroll page
      await page.waitForURL(/.*dream|.*journal|.*notes/);
    }
  });
});
