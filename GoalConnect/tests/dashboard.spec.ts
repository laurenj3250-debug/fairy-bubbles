import { test, expect } from '@playwright/test';

/**
 * Base Camp Dashboard Tests
 *
 * Tests for the new travel-poster style dashboard with glassmorphism cards
 */

test.describe('Base Camp Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Add login logic here when auth is ready
    // For now, assume we can navigate to dashboard
    await page.goto('/');
  });

  test('displays mountain hero card', async ({ page }) => {
    // Check for mountain hero elements
    await expect(page.getByText(/EL CAPITAN/i)).toBeVisible();
    await expect(page.getByText(/Current Expedition/i)).toBeVisible();

    // Check for expedition progress bar
    const progressBar = page.locator('[class*="progress"]').first();
    await expect(progressBar).toBeVisible();
  });

  test('shows Today card with habits', async ({ page }) => {
    // Look for Today card title
    await expect(page.getByText('Today')).toBeVisible();

    // Should show habit pills or empty state
    const todaySection = page.locator('text=Today').locator('..');
    await expect(todaySection).toBeVisible();
  });

  test('displays Week Overview card', async ({ page }) => {
    await expect(page.getByText('This Week')).toBeVisible();

    // Should show M-S day labels
    await expect(page.getByText('M')).toBeVisible();
    await expect(page.getByText('S')).toBeVisible();
  });

  test('opens week detail modal on click', async ({ page }) => {
    // Find and click Week Overview card
    const weekCard = page.locator('text=This Week').locator('..');
    await weekCard.click();

    // Modal should open with detailed view
    // (Update selector based on actual modal implementation)
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('shows Goals card with progress visualizations', async ({ page }) => {
    await expect(page.getByText('Goals')).toBeVisible();

    // Should show goals or empty state
    const goalsSection = page.locator('text=Goals').locator('..');
    await expect(goalsSection).toBeVisible();
  });

  test('displays Looking Forward card', async ({ page }) => {
    await expect(page.getByText('Looking Forward To')).toBeVisible();
  });

  test('shows Peak Lore card with daily inspiration', async ({ page }) => {
    // Check for one of the lore card titles
    const loreCard = page.locator('text=/Peak of the Day|Climbing Lore|Technique Tip|Climbing Wisdom/');
    await expect(loreCard).toBeVisible();
  });

  test('displays Little Wins strip', async ({ page }) => {
    // Check for wins section
    const winsSection = page.locator('text=/Today\'s Wins|habit|streak|expedition/i').first();
    await expect(winsSection).toBeVisible();
  });

  test('displays level and coins badges on mountain hero', async ({ page }) => {
    // Check for level badge
    await expect(page.getByText(/LEVEL \d+/)).toBeVisible();

    // Check for coins display
    const coinsElement = page.locator('[class*="coin"]').first();
    await expect(coinsElement).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('dashboard works at 1440×900 (target resolution)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // All cards should be visible
    await expect(page.getByText(/EL CAPITAN/i)).toBeVisible();
    await expect(page.getByText('Today')).toBeVisible();
    await expect(page.getByText('Goals')).toBeVisible();
  });

  test('dashboard adapts to smaller screens', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Content should still be accessible (may stack vertically)
    await expect(page.getByText(/EL CAPITAN/i)).toBeVisible();
  });
});
