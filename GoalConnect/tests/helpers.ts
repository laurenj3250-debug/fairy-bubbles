import { Page } from '@playwright/test';

/**
 * Helper function to log in a user for testing
 */
export async function login(page: Page): Promise<void> {
  // Go to login page
  await page.goto('/login', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Wait for React to mount
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    },
    { timeout: 30000 }
  );

  // Wait for the login form
  const emailInput = page.locator('input#email');
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });

  // Fill in credentials (using test user)
  await emailInput.fill('test@example.com');
  await page.locator('input#password').fill('test123');

  // Click login button
  await page.locator('button[type="submit"]').click();

  // Wait for navigation to complete
  await page.waitForURL(/\/(dashboard|todos|habits)/, { timeout: 15000 });
}
