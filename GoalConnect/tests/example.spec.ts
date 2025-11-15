import { test, expect } from '@playwright/test';

/**
 * Example test to verify Playwright is working
 */
test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  // Should see the app title or main content
  await expect(page).toHaveTitle(/GoalConnect|Base Camp/);
});

test('can navigate to login page', async ({ page }) => {
  await page.goto('/');

  // If not logged in, should redirect to login or show login button
  const loginButton = page.getByRole('link', { name: /login|sign in/i });
  if (await loginButton.isVisible()) {
    await loginButton.click();
    await expect(page).toHaveURL(/.*login/);
  }
});
