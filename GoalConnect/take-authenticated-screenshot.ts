import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_URL = process.env.TEST_URL || 'http://localhost:5001';
const route = process.argv[2] || '/';
const filename = process.argv[3] || 'authenticated-screenshot.png';

async function takeAuthenticatedScreenshot() {
  console.log(`📸 Taking authenticated screenshot of ${TEST_URL}${route}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: path.join(__dirname, 'playwright/.auth/user.json')
  });

  const page = await context.newPage();

  try {
    await page.goto(`${TEST_URL}${route}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for any animations
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: filename,
      fullPage: true
    });

    console.log(`💾 Saving to: ${filename}`);
    console.log('✅ Screenshot saved successfully!');
  } catch (error) {
    console.error('❌ Error taking screenshot:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

takeAuthenticatedScreenshot();
