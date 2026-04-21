const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  browser.on('disconnected', () => console.log('[BROWSER DISCONNECTED]'));
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[PAGE ERROR]', e.message));
  page.on('close', () => console.log('[PAGE CLOSED]'));
  page.on('crash', () => console.log('[PAGE CRASH]'));
  page.on('console', (m) => console.log(`[${m.type()}]`, m.text().slice(0, 200)));
  page.on('requestfailed', (r) => console.log('[REQ FAIL]', r.url(), r.failure()?.errorText));

  console.log('goto login');
  try {
    await page.goto('http://localhost:5001/login', { waitUntil: 'load', timeout: 30000 });
    console.log('url after goto:', page.url());
    await page.waitForTimeout(3000);
    console.log('after timeout — url:', page.url());
    console.log('title:', await page.title());
    const hasEmail = await page.locator('input#email').count();
    console.log('input#email count:', hasEmail);
  } catch (e) {
    console.log('ERR in goto/wait:', e.message);
  }

  try {
    await page.fill('input#email', 'laurenj3250@gmail.com');
    await page.fill('input#password', 'Crumpet11!!');
    await page.click('button[type="submit"]:has-text("Sign in")');
    console.log('clicked submit');
    await page.waitForURL('http://localhost:5001/', { timeout: 20000 });
    console.log('redirected to dashboard');
    await page.waitForSelector('text=/SUNDOWN|Sundown|Today|Habits/i', { timeout: 15000 });
    const dest = path.resolve(process.env.HOME, 'Desktop/fairy-bubbles/GoalConnect/playwright/.auth/user.json');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await ctx.storageState({ path: dest });
    console.log('saved auth to', dest);
  } catch (e) {
    console.log('ERR in login flow:', e.message);
  }

  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
