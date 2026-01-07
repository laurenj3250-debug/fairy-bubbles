#!/usr/bin/env node
import { getBrowser, getPage, closeBrowser, outputJSON } from './lib/browser.js';

const URL = 'https://empathetic-clarity-production.up.railway.app';
const EMAIL = 'laurenj3250@gmail.com';
const PASSWORD = 'Crumpet11!!';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function testTaskToggle() {
  const browser = await getBrowser({ headless: true });
  const page = await getPage(browser);

  try {
    // 1. Navigate to login page
    console.error('Navigating to login page...');
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // 2. Fill login form
    console.error('Filling login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', EMAIL);
    await page.type('input[type="password"]', PASSWORD);

    // 3. Click Sign In
    console.error('Clicking Sign In...');
    await page.click('button[type="submit"]');

    // Wait for login
    console.error('Waiting for login...');
    await delay(5000);

    // Screenshot after login attempt
    await page.screenshot({ path: '/tmp/vethub-after-login.png', fullPage: true });
    console.error('Screenshot saved to /tmp/vethub-after-login.png');
    console.error('Current URL:', page.url());

    // 4. Wait a bit more for React
    await delay(2000);

    // 5. Take screenshot of dashboard
    await page.screenshot({ path: '/tmp/vethub-dashboard.png', fullPage: true });
    console.error('Dashboard screenshot saved to /tmp/vethub-dashboard.png');

    // 6. Set up console logging
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('TASK') || text.includes('toggle') || text.includes('API')) {
        consoleLogs.push(text);
      }
    });

    // 7. Look for task items and find one to click
    const taskInfo = await page.evaluate(() => {
      const tasks = [];
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent || '';
        if (text.includes('○') || text.includes('✓')) {
          tasks.push({
            text: text.trim().substring(0, 50),
            completed: text.includes('✓')
          });
        }
      }
      return {
        taskCount: tasks.length,
        tasks: tasks.slice(0, 10)
      };
    });

    console.error('Found tasks:', JSON.stringify(taskInfo, null, 2));

    // 8. Scroll down to see patient cards, then click a patient task
    await page.evaluate(() => window.scrollTo(0, 500));
    await delay(1000);

    // Take a screenshot showing patient view
    await page.screenshot({ path: '/tmp/vethub-patient-view.png', fullPage: true });
    console.error('Patient view screenshot saved');

    // 9. Click a PATIENT task (not general task) using page.evaluate
    const clickResult = await page.evaluate(() => {
      // Find all clickable elements
      const allElements = document.querySelectorAll('button, [role="button"], [onclick]');
      let clicked = null;
      let foundGeneral = false;

      for (const el of allElements) {
        const text = el.textContent || '';
        // Skip the General task, look for patient tasks with ○
        if (text.includes('○')) {
          if (text.includes('General')) {
            foundGeneral = true;
            continue;  // Skip general task
          }
          clicked = text.trim().substring(0, 80);
          el.click();
          break;
        }
      }

      return { clicked, foundGeneral, elementCount: allElements.length };
    });

    console.error('Click result:', JSON.stringify(clickResult));

    if (clickResult.clicked) {
      console.error('Clicked task, waiting for update...');
      await delay(2000);

      // Take screenshot after click
      await page.screenshot({ path: '/tmp/vethub-after-click.png', fullPage: true });
      console.error('After-click screenshot saved to /tmp/vethub-after-click.png');

      // Get task state after click
      const afterInfo = await page.evaluate(() => {
        const tasks = [];
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent || '';
          if (text.includes('○') || text.includes('✓')) {
            tasks.push(text.trim().substring(0, 50));
          }
        }
        return { tasks: tasks.slice(0, 10) };
      });

      outputJSON({
        success: true,
        loggedIn: true,
        url: page.url(),
        beforeClick: clickResult.clicked,
        afterClick: afterInfo,
        consoleLogs: consoleLogs
      });
    } else {
      outputJSON({
        success: true,
        loggedIn: true,
        url: page.url(),
        message: 'No incomplete tasks found to click',
        taskInfo,
        elementCount: clickResult.elementCount
      });
    }

  } catch (error) {
    outputJSON({
      success: false,
      error: error.message,
      stack: error.stack
    });
  } finally {
    await closeBrowser(browser);
  }
}

testTaskToggle();
