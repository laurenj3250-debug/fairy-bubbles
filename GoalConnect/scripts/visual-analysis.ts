import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const PAGES_TO_SCREENSHOT = [
  { name: 'login', url: '/login', skipAuth: true },
  { name: 'signup', url: '/signup', skipAuth: true },
  { name: 'weekly-hub', url: '/' },
  { name: 'dashboard', url: '/dashboard' },
  { name: 'habits', url: '/habits' },
  { name: 'goals', url: '/goals' },
  { name: 'todos', url: '/todos' },
  { name: 'alpine-shop', url: '/alpine-shop' },
  { name: 'world-map', url: '/world-map' },
  { name: 'dream-scroll', url: '/dream-scroll' },
  { name: 'settings', url: '/settings' },
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_FILE = 'playwright/.auth/user.json';
const SCREENSHOTS_DIR = 'screenshots';

async function takeScreenshots() {
  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false }); // Use headed mode for debugging

  try {
    for (const page of PAGES_TO_SCREENSHOT) {
      console.log(`\n📸 Capturing ${page.name}...`);

      const contextOptions: any = {
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2 // Retina display
      };

      if (!page.skipAuth && fs.existsSync(AUTH_FILE)) {
        contextOptions.storageState = AUTH_FILE;
      }

      const context = await browser.newContext(contextOptions);
      const browserPage = await context.newPage();

      try {
        // Navigate to page
        await browserPage.goto(`${BASE_URL}${page.url}`, {
          waitUntil: 'networkidle',
          timeout: 60000,
        });

        // Wait for content to load
        await browserPage.waitForTimeout(3000);

        // Wait for main content
        try {
          await browserPage.waitForSelector('body', { timeout: 5000 });
        } catch (e) {
          console.log('  ⚠️  Body element not found quickly, continuing anyway');
        }

        // Take screenshot
        const screenshotPath = path.join(
          SCREENSHOTS_DIR,
          `${page.name}-desktop.png`
        );

        await browserPage.screenshot({
          path: screenshotPath,
          fullPage: true,
        });

        console.log(`  ✅ Saved: ${screenshotPath}`);
      } catch (error) {
        console.error(`  ❌ Error: ${error}`);
      } finally {
        await context.close();
      }
    }

    console.log(`\n✅ All screenshots saved to ${SCREENSHOTS_DIR}/`);
  } finally {
    await browser.close();
  }
}

// Run the script
takeScreenshots().catch((error) => {
  console.error('Screenshot script failed:', error);
  process.exit(1);
});
