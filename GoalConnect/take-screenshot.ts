import { chromium } from '@playwright/test';

/**
 * Simple screenshot utility for GoalConnect
 *
 * Usage:
 *   npx tsx take-screenshot.ts
 *   npx tsx take-screenshot.ts /dashboard
 *   npx tsx take-screenshot.ts /login screenshot-login.png
 */

async function takeScreenshot() {
  const baseURL = process.env.TEST_URL || 'http://localhost:5001';
  const path = process.argv[2] || '/';
  const outputFile = process.argv[3] || `screenshot-${Date.now()}.png`;

  console.log(`📸 Taking screenshot of ${baseURL}${path}`);
  console.log(`💾 Saving to: ${outputFile}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Navigate with increased timeout
    await page.goto(`${baseURL}${path}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // Wait a bit for any animations
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: outputFile, fullPage: true });

    console.log(`✅ Screenshot saved successfully!`);
  } catch (error) {
    console.error(`❌ Error taking screenshot:`, error);
    throw error;
  } finally {
    await browser.close();
  }
}

takeScreenshot().catch((error) => {
  console.error('Failed to take screenshot:', error);
  process.exit(1);
});
