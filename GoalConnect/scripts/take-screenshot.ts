import { chromium } from '@playwright/test';
import * as fs from 'fs';

async function takeScreenshot() {
  const authFile = 'playwright/.auth/user.json';

  const contextOptions: any = {
    viewport: { width: 1280, height: 720 },
  };

  if (fs.existsSync(authFile)) {
    contextOptions.storageState = authFile;
    console.log('🔐 Using stored authentication');
  }

  const browser = await chromium.launch();
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  await page.goto('http://localhost:5001');
  await page.waitForTimeout(2000); // Wait for page to load

  await page.screenshot({ path: 'screenshot-current.png', fullPage: true });
  console.log('✅ Screenshot saved to screenshot-current.png');

  await browser.close();
}

takeScreenshot();
