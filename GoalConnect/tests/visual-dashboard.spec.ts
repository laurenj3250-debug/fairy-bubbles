import { test, expect } from '@playwright/test';

test('capture dashboard screenshot', async ({ page }) => {
  console.log('🔐 Logging in...');

  await page.goto('/login');

  // Wait for React to mount
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return root && root.children.length > 0;
  }, { timeout: 30000 });

  // Fill and submit login (FIRST ATTEMPT - may need to login twice)
  await page.fill('input#email', 'laurenj3250@gmail.com');
  await page.fill('input#password', 'Crumpet11!!');
  await page.click('button[type="submit"]');

  console.log('⏳ Waiting for dashboard or login redirect...');

  // Wait a moment to see if we're redirected
  await page.waitForTimeout(2000);

  // Check if we're still on login page (need to login again)
  if (page.url().includes('/login')) {
    console.log('🔄 Need to login again...');
    await page.fill('input#email', 'laurenj3250@gmail.com');
    await page.fill('input#password', 'Crumpet11!!');
    await page.click('button[type="submit"]');
  }

  // Wait for redirect to dashboard
  await page.waitForURL('/', { timeout: 15000 });

  // Wait for React to mount on dashboard
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return root && root.children.length > 0;
  }, { timeout: 30000 });

  // Wait a bit for data to load
  await page.waitForTimeout(3000);

  console.log('📸 Taking screenshot...');

  // Take full page screenshot
  await page.screenshot({
    path: 'test-results/dashboard-visual.png',
    fullPage: true
  });

  console.log('✅ Screenshot saved to test-results/dashboard-visual.png');

  // Also take a viewport screenshot
  await page.screenshot({
    path: 'test-results/dashboard-viewport.png',
    fullPage: false
  });

  console.log('✅ Viewport screenshot saved');
});
