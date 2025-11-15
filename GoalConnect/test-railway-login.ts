import { chromium } from '@playwright/test';

/**
 * Simple test to verify Railway deployment login
 */
async function testRailwayLogin() {
  console.log('🚀 Testing Railway deployment login...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Listen to console and errors
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type()}]`, msg.text());
    });
    page.on('pageerror', error => {
      console.error('[PAGE ERROR]', error.message);
    });

    // Navigate to login page
    console.log('📄 Navigating to login page...');
    await page.goto('https://fairy-bubbles-production.up.railway.app/login', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Wait for React to mount
    console.log('⏳ Waiting for React to mount...');
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.children.length > 0;
      },
      { timeout: 30000 }
    );

    // Take screenshot of login page
    console.log('📸 Taking screenshot of login page...');
    await page.screenshot({ path: 'railway-login-page.png', fullPage: true });

    // Fill in credentials
    console.log('✍️  Filling in credentials...');
    await page.fill('input#email', 'laurenj3250@gmail.com');
    await page.fill('input#password', 'Crumpet11!!');

    // Take screenshot before submit
    await page.screenshot({ path: 'railway-before-submit.png', fullPage: true });

    // Listen to network requests
    page.on('response', async (response) => {
      if (response.url().includes('/api/auth/login')) {
        console.log(`📡 Login API response: ${response.status()}`);
        try {
          const body = await response.json();
          console.log('Response body:', JSON.stringify(body, null, 2));
        } catch (e) {
          console.log('Could not parse response body');
        }
      }
    });

    // Click sign in
    console.log('🖱️  Clicking sign in...');
    await page.click('button[type="submit"]:has-text("Sign in")');

    // Wait a bit and check URL multiple times
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      console.log(`📍 URL after ${i * 0.5}s: ${currentUrl}`);
      if (!currentUrl.includes('/login')) {
        break;
      }
    }

    // Take screenshot after submit
    await page.screenshot({ path: 'railway-after-submit.png', fullPage: true });

    // Check all text on the page to see if there's any error
    const bodyText = await page.locator('body').textContent();
    console.log('📄 Page content includes:', bodyText?.substring(0, 200));

    // Try to check if there's an error message
    const errorElement = page.locator('.text-destructive');
    const hasError = await errorElement.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorElement.textContent();
      console.log('❌ Error visible:', errorText);
    } else {
      console.log('✓ No error message visible');
    }

    // Check if Sign in button is still visible or if it changed
    const submitButton = page.locator('button[type="submit"]');
    const buttonText = await submitButton.textContent();
    const buttonDisabled = await submitButton.isDisabled();
    console.log(`🔘 Submit button: "${buttonText}", disabled: ${buttonDisabled}`);

    // Wait for potential navigation
    try {
      await page.waitForURL('/', { timeout: 10000 });
      console.log('✅ Successfully navigated to dashboard!');
      await page.screenshot({ path: 'railway-dashboard.png', fullPage: true });
    } catch (e) {
      console.log('⚠️  Did not navigate to dashboard');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'railway-error.png', fullPage: true });
  } finally {
    console.log('🏁 Test complete');
    await browser.close();
  }
}

testRailwayLogin();
