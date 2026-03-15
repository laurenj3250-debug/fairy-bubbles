import { chromium } from 'playwright';
import * as fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const cookieContent = fs.readFileSync('/tmp/gc-cookies5.txt', 'utf-8');
  const sidMatch = cookieContent.match(/connect\.sid\s+(\S+)/);
  if (!sidMatch) {
    console.log('ERROR: No session cookie found');
    await browser.close();
    return;
  }

  await context.addCookies([{
    name: 'connect.sid',
    value: sidMatch[1],
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax' as const
  }]);

  const page = await context.newPage();
  await page.goto('http://localhost:5001');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Find the header with orbs
  const header = page.locator('header').first();

  // Check for circular buttons (the orbs)
  const orbs = await page.evaluate(() => {
    // Orbs are 40x40 (w-10 h-10) rounded-full buttons
    const buttons = document.querySelectorAll('button.rounded-full');
    const orbData: any[] = [];
    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      // Filter for orb-sized buttons (around 40px)
      if (rect.width >= 36 && rect.width <= 44) {
        orbData.push({
          text: btn.textContent?.trim(),
          width: rect.width,
          completed: btn.getAttribute('style')?.includes('peach') || btn.getAttribute('style')?.includes('#d4a59a')
        });
      }
    });
    return orbData;
  });

  console.log('Found orbs:', orbs);

  // Screenshot just the top of the page
  await page.screenshot({ path: '/tmp/header-orbs.png', clip: { x: 0, y: 0, width: 1280, height: 150 } });
  console.log('Header screenshot saved to /tmp/header-orbs.png');

  await browser.close();
})();
