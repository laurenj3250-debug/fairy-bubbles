import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFile = 'playwright/.auth/user.json';

// Ensure auth directory exists
const authDir = path.dirname(authFile);
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

setup('authenticate', async ({ page }) => {
  console.log('🔐 Starting authentication setup...');

  // Listen to console messages from the browser
  page.on('console', msg => console.log(`[BROWSER ${msg.type()}]`, msg.text()));
  page.on('pageerror', error => console.log(`[PAGE ERROR]`, error.message));
  page.on('requestfailed', request => console.log(`[REQUEST FAILED]`, request.url(), request.failure()?.errorText));

  // Set longer timeout for initial page load
  page.setDefaultTimeout(60000);

  // Go to login page and wait for network to be idle
  console.log('📄 Loading login page...');
  await page.goto('/login', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait for React to mount (check if #root has children)
  console.log('⏳ Waiting for React to mount...');
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    },
    { timeout: 30000 }
  );
  console.log('✓ React mounted');

  // Now wait for the login form
  console.log('⏳ Waiting for login form...');
  const emailInput = page.locator('input#email');
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });
  console.log('✓ Login form visible');

  // Fill in credentials (using real user account for visual testing)
  await emailInput.fill('laurenj3250@gmail.com');
  await page.locator('input#password').fill('Crumpet11!!');
  console.log('✓ Filled credentials');

  // Click sign in (use type=submit to avoid GitHub OAuth button)
  const signInButton = page.locator('button[type="submit"]:has-text("Sign in")');
  await signInButton.click();
  console.log('✓ Clicked sign in');

  // Wait a moment for any immediate responses
  await page.waitForTimeout(2000);
  console.log('⏳ Waited 2s after click');

  // Check if there's an error visible
  const errorElement = page.locator('.text-destructive');
  const errorVisible = await errorElement.isVisible().catch(() => false);
  if (errorVisible) {
    const errorText = await errorElement.textContent();
    console.log('❌ Error visible on page:', errorText);
  }

  // Check current URL
  console.log('Current URL after click:', page.url());

  // Wait for either navigation to dashboard OR an error message
  console.log('⏳ Waiting for navigation or error...');

  try {
    // Wait for navigation with network idle
    await page.waitForURL('/', { timeout: 15000, waitUntil: 'networkidle' });
    console.log('✓ Redirected to dashboard');
  } catch (error) {
    // If navigation failed, check for error messages
    const errorText = await page.locator('.text-destructive').textContent().catch(() => null);
    console.log('❌ Navigation failed. Error on page:', errorText || 'none');
    console.log('Current URL:', page.url());

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/login-failed.png', fullPage: true });

    throw new Error(`Failed to navigate to dashboard. Current URL: ${page.url()}, Error: ${errorText || 'none'}`);
  }

  // Wait for dashboard React to mount
  console.log('⏳ Waiting for dashboard to mount...');
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    },
    { timeout: 30000 }
  );

  // Wait for dashboard content
  console.log('⏳ Waiting for dashboard content...');
  await page.waitForSelector('text=/EL CAPITAN|Base Camp|Today/i', { timeout: 15000 });
  console.log('✓ Dashboard loaded');

  // Save the authentication state
  await page.context().storageState({ path: authFile });
  console.log(`✅ Authentication state saved to ${authFile}`);
});
