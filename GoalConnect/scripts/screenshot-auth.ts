import { chromium } from 'playwright-core';

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // Go to login
    console.log('Navigating to login...');
    await page.goto('http://localhost:5001/login', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for form
    console.log('Waiting for login form...');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });

    // Fill form - try different selectors
    const emailInput = await page.$('input[type="email"]') || await page.$('input[name="username"]') || await page.$('input[placeholder*="email" i]');
    if (emailInput) {
      await emailInput.fill('lj@test.com');
    }
    await page.fill('input[type="password"]', 'test123');

    // Submit
    console.log('Logging in...');
    await page.click('button[type="submit"]');

    // Wait for redirect to homepage
    console.log('Waiting for homepage...');
    await page.waitForURL(/localhost:5001\/?$/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'screenshots/homepage-auth.png', fullPage: true });
    console.log('Screenshot saved to screenshots/homepage-auth.png');
  } catch (err) {
    console.error('Error:', err);
    // Take error screenshot
    await page.screenshot({ path: 'screenshots/error.png' });
    console.log('Error screenshot saved to screenshots/error.png');
  } finally {
    await browser.close();
  }
}

main();
