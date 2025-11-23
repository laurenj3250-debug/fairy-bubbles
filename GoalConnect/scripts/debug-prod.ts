import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors: string[] = [];

  page.on('pageerror', e => {
    console.log('PAGE ERROR:', e.message);
    errors.push(e.message);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
      errors.push(msg.text());
    }
  });

  page.on('crash', () => {
    console.log('BROWSER CRASHED');
  });

  try {
    console.log('Loading production site...');
    await page.goto('https://fairy-bubbles-production.up.railway.app', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for JS to execute
    await page.waitForTimeout(3000);

    console.log('Title:', await page.title());

    const root = await page.$('#root');
    const html = await root?.innerHTML();
    console.log('Root length:', html?.length || 0);

    if (!html || html.length < 200) {
      console.log('ROOT IS EMPTY OR NEARLY EMPTY!');
      console.log('Content:', html);
    }

    console.log('Total errors:', errors.length);

    await page.screenshot({ path: 'debug-screenshot.png' });
    console.log('Screenshot saved to debug-screenshot.png');
  } catch (e) {
    console.log('ERROR:', e);
    console.log('Collected errors:', errors);
  }

  await browser.close();
}

debug();
