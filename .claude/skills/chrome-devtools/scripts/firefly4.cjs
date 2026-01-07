const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Launching...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  console.log('Going to Firefly...');
  await page.goto('https://firefly.adobe.com', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // Click Sign In button in header
  console.log('Clicking Sign In...');
  await page.evaluate(() => {
    const els = document.querySelectorAll('button, a, span');
    for (const el of els) {
      if (el.textContent && el.textContent.trim() === 'Sign in') {
        el.click();
        return;
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: '/tmp/ff4-1.png' });
  
  // Now click the "Sign in" link in the modal (not Google/Facebook/Apple)
  console.log('Clicking Sign in with email link...');
  await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    for (const a of links) {
      if (a.textContent && a.textContent.trim() === 'Sign in') {
        a.click();
        return;
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: '/tmp/ff4-2.png' });
  console.log('URL:', page.url());
  
  // Now on email login page
  try {
    await page.waitForSelector('input', { timeout: 10000 });
    console.log('Entering email...');
    await page.type('input', 'laurenj3250@gmail.com', { delay: 30 });
    
    await page.screenshot({ path: '/tmp/ff4-3.png' });
    
    // Click Continue
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent && b.textContent.includes('Continue')) {
          b.click();
          return;
        }
      }
    });
    
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: '/tmp/ff4-4.png' });
    
    // Password
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    console.log('Entering password...');
    await page.type('input[type="password"]', '143Klaus!', { delay: 30 });
    
    await page.screenshot({ path: '/tmp/ff4-5.png' });
    
    // Submit
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const txt = b.textContent || '';
        if (txt.includes('Continue')) {
          b.click();
          return;
        }
      }
    });
    
    console.log('Waiting for login to complete...');
    await new Promise(r => setTimeout(r, 10000));
  } catch (e) {
    console.log('Login error:', e.message);
  }
  
  await page.screenshot({ path: '/tmp/ff4-6.png' });
  console.log('Post-login URL:', page.url());
  
  // Go to generate page
  console.log('Going to generate...');
  await page.goto('https://firefly.adobe.com/generate/images', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: '/tmp/ff4-7.png' });
  
  // Find and fill prompt
  console.log('Looking for prompt field...');
  await page.evaluate(() => {
    const textareas = document.querySelectorAll('textarea');
    if (textareas.length > 0) {
      textareas[0].focus();
      textareas[0].click();
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.type('Professional mobile app UI mockup for fitness dashboard. Dark mode with orange accent color. Glass cards. Big 47 marathons number. Progress ring. Premium Strava style design.', { delay: 15 });
  
  await page.screenshot({ path: '/tmp/ff4-8.png' });
  
  // Click Generate
  console.log('Clicking Generate...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent && b.textContent.includes('Generate')) {
        b.click();
        return true;
      }
    }
  });
  
  console.log('Waiting 90s for generation...');
  await new Promise(r => setTimeout(r, 90000));
  
  await page.screenshot({ path: '/tmp/ff4-final.png', fullPage: true });
  fs.copyFileSync('/tmp/ff4-final.png', '/Users/laurenjohnston/fairy-bubbles/GoalConnect/.design-session/05-mockup-strava.png');
  
  console.log('Done!');
  await browser.close();
})();
