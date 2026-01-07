import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// Navigate to signup first
await page.goto('http://localhost:5001/register', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1000));

// Fill signup form (using correct IDs: name, email, password, confirmPassword)
await page.type('input[type="text"]', 'Test User');
await page.type('#email', 'testuser' + Date.now() + '@test.com');
await page.type('#password', 'test123456');
await page.type('#confirmPassword', 'test123456');
await page.click('button[type="submit"]');

// Wait for redirect to homepage  
await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
await new Promise(r => setTimeout(r, 3000));

// Take screenshot
await page.screenshot({ path: '/Users/laurenjohnston/fairy-bubbles/GoalConnect/screenshots/homepage-auth.png', fullPage: true });
console.log('Screenshot saved! URL:', page.url());

await browser.close();
