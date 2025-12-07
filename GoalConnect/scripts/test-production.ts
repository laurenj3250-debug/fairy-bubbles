// Test task creation on production
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  // Listen for network errors
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/todos') && response.request().method() === 'POST') {
      console.log('\n=== POST /api/todos ===');
      console.log('Status:', response.status());
      try {
        const body = await response.json();
        console.log('Response:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('Response body:', await response.text());
      }
    }
  });

  const baseUrl = 'https://fairy-bubbles-production.up.railway.app';

  try {
    console.log('Going to:', baseUrl + '/login');
    await page.goto(baseUrl + '/login');
    await page.waitForLoadState('networkidle');

    // You need to manually login - let's wait
    console.log('Please login manually in the browser...');
    console.log('After login, go to /weekly and try to add a task');
    console.log('Press Ctrl+C when done testing');

    // Keep browser open
    await page.waitForTimeout(300000); // 5 minutes

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

main();
