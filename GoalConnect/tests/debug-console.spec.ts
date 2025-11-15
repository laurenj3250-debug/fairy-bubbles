import { test } from '@playwright/test';

test('debug console errors', async ({ page }) => {
  // Listen to all console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.log(`[BROWSER ERROR]:`, error.message);
  });

  // Listen to request failures
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED]: ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log('Loading page...');
  await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('Waiting 5 seconds to capture all errors...');
  await page.waitForTimeout(5000);

  // Get HTML content to confirm page loaded
  const html = await page.content();
  console.log('Page has root div:', html.includes('<div id="root">'));

  // Check if any scripts loaded
  const scripts = await page.locator('script').count();
  console.log('Number of script tags:', scripts);

  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-console.png', fullPage: true });
  console.log('Screenshot saved to test-results/debug-console.png');
});
