import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const PAGES_TO_SCREENSHOT = [
  { name: 'home', url: '/', viewports: ['desktop', 'mobile'] },
  { name: 'login', url: '/login', viewports: ['desktop', 'mobile'], skipAuth: true },
  { name: 'register', url: '/register', viewports: ['desktop', 'mobile'], skipAuth: true },
  // Add more pages as needed
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_FILE = 'playwright/.auth/user.json';
const SCREENSHOTS_DIR = 'screenshots';

async function takeScreenshots() {
  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  try {
    for (const page of PAGES_TO_SCREENSHOT) {
      console.log(`\n📸 Capturing ${page.name}...`);

      for (const viewportName of page.viewports) {
        const viewport = VIEWPORTS[viewportName as keyof typeof VIEWPORTS];

        // Create context with or without auth
        const contextOptions: any = { viewport };
        if (!page.skipAuth && fs.existsSync(AUTH_FILE)) {
          contextOptions.storageState = AUTH_FILE;
        }

        const context = await browser.newContext(contextOptions);
        const browserPage = await context.newPage();

        try {
          // Navigate to page
          await browserPage.goto(`${BASE_URL}${page.url}`, {
            waitUntil: 'networkidle',
            timeout: 30000,
          });

          // Wait a bit for animations/transitions
          await browserPage.waitForTimeout(1000);

          // Take screenshot
          const screenshotPath = path.join(
            SCREENSHOTS_DIR,
            `${page.name}-${viewportName}.png`
          );
          await browserPage.screenshot({
            path: screenshotPath,
            fullPage: true,
          });

          console.log(`  ✅ ${viewportName}: ${screenshotPath}`);
        } catch (error) {
          console.error(`  ❌ ${viewportName}: ${error}`);
        } finally {
          await context.close();
        }
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
