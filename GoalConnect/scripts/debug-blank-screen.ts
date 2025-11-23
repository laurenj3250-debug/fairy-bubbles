import { chromium } from 'playwright';

async function debugBlankScreen() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs: string[] = [];
  const errors: string[] = [];

  // Capture all console messages
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    logs.push(text);
    console.log(text);
  });

  // Capture page errors
  page.on('pageerror', error => {
    const text = `[PAGE ERROR] ${error.message}`;
    errors.push(text);
    console.error(text);
  });

  // Capture request failures
  page.on('requestfailed', request => {
    const text = `[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`;
    errors.push(text);
    console.error(text);
  });

  const url = process.env.TEST_URL || 'https://fairy-bubbles-production.up.railway.app/';

  console.log(`\n=== DEBUGGING: ${url} ===\n`);

  try {
    // Navigate and wait for network idle
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait a bit for any delayed JS execution
    await page.waitForTimeout(3000);

    // Check what's visible
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        hasRoot: !!root,
        rootChildCount: root?.children.length || 0,
        rootHTML: root?.innerHTML.substring(0, 500) || 'NO ROOT',
        bodyHTML: document.body.innerHTML.substring(0, 1000),
        title: document.title,
      };
    });

    console.log('\n=== PAGE STATE ===');
    console.log('Title:', rootContent.title);
    console.log('Has root div:', rootContent.hasRoot);
    console.log('Root child count:', rootContent.rootChildCount);
    console.log('Root HTML preview:', rootContent.rootHTML);

    // Take screenshot
    await page.screenshot({ path: 'debug-blank-screen.png', fullPage: true });
    console.log('\nScreenshot saved to debug-blank-screen.png');

    // Check for any visible text
    const visibleText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 500);
    });
    console.log('\n=== VISIBLE TEXT ===');
    console.log(visibleText || '(no visible text)');

    console.log('\n=== ALL CONSOLE LOGS ===');
    logs.forEach(l => console.log(l));

    console.log('\n=== ALL ERRORS ===');
    errors.forEach(e => console.log(e));

  } catch (error) {
    console.error('Navigation error:', error);
  }

  await browser.close();
}

debugBlankScreen().catch(console.error);
