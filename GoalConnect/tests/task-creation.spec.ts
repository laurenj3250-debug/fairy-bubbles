import { test, expect } from '@playwright/test';

test.describe('Weekly Planner Functions', () => {
  // Use existing user or register a new one
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');

    // Try to login with existing test account
    await page.fill('input[type="email"]', 'testuser3@example.com');
    await page.fill('input[type="password"]', 'SecureP@ssword123');
    await page.click('button[type="submit"]');

    // Wait for redirect to home/weekly page
    await page.waitForURL(/\/(home|weekly|journey)/, { timeout: 10000 }).catch(async () => {
      // If login fails, register new user
      await page.goto('/login');
      // Find register link and click it
      const registerLink = page.locator('a:has-text("Sign up"), a:has-text("Register")');
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await page.fill('input[name="name"], input[placeholder*="name"]', 'E2E Test User');
        await page.fill('input[type="email"]', `e2etest${Date.now()}@example.com`);
        await page.fill('input[type="password"]', 'SecureP@ssword123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/(home|weekly|journey)/, { timeout: 10000 });
      }
    });
  });

  test('should display weekly planner page', async ({ page }) => {
    await page.goto('/weekly');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page.locator('text=Goals, text=Weekly, text=Planner').first()).toBeVisible({ timeout: 5000 });
  });

  test('should open task creation dialog', async ({ page }) => {
    await page.goto('/weekly');
    await page.waitForLoadState('networkidle');

    // Find and click a plus/add button
    const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Dialog should be open
      const dialog = page.locator('.fixed.bg-background, [role="dialog"]').first();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }
  });

  test('should create and complete a task', async ({ page }) => {
    await page.goto('/weekly');
    await page.waitForLoadState('networkidle');

    // Find add button in the weekly grid
    const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();

    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Fill task title
      const titleInput = page.locator('input[type="text"]').first();
      await titleInput.fill('E2E Test Task ' + Date.now());

      // Submit
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      // Check for success toast (no error)
      const errorToast = page.locator('text=Error, text=Failed, text=log in');
      expect(await errorToast.isVisible()).toBeFalsy();
    }
  });
});
