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
  
  // Click Sign In by evaluating in page
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
  
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: '/tmp/ff3-1.png' });
  console.log('URL after sign in click:', page.url());
  
  // On Adobe login
  if (page.url().includes('ims') || page.url().includes('auth') || page.url().includes('adobe')) {
    console.log('On login page, entering email...');
    
    await page.waitForSelector('input', { timeout: 15000 });
    await page.type('input[type="email"], input[name="username"], input', 'laurenj3250@gmail.com', { delay: 30 });
    
    await page.screenshot({ path: '/tmp/ff3-2.png' });
    
    // Continue
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
    await page.screenshot({ path: '/tmp/ff3-3.png' });
    
    // Password
    try {
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      console.log('Entering password...');
      await page.type('input[type="password"]', '143Klaus!', { delay: 30 });
      
      await page.screenshot({ path: '/tmp/ff3-4.png' });
      
      // Submit
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          const txt = b.textContent || '';
          if (txt.includes('Continue') || txt.includes('Sign in')) {
            b.click();
            return;
          }
        }
      });
      
      console.log('Waiting for login...');
      await new Promise(r => setTimeout(r, 10000));
    } catch (e) {
      console.log('Password error:', e.message);
    }
  }
  
  await page.screenshot({ path: '/tmp/ff3-5.png' });
  console.log('Post-login URL:', page.url());
  
  // Go to generate
  console.log('Going to generate page...');
  await page.goto('https://firefly.adobe.com/generate/images', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: '/tmp/ff3-6.png' });
  
  // Type in prompt - click on the prompt area first
  console.log('Finding prompt area...');
  
  // The prompt area has placeholder "Describe the image you want to generate"
  await page.evaluate(() => {
    // Try to find and click the prompt input
    const textareas = document.querySelectorAll('textarea');
    if (textareas.length > 0) {
      textareas[0].click();
      textareas[0].focus();
      return;
    }
    // Try contenteditable
    const editables = document.querySelectorAll('[contenteditable="true"]');
    if (editables.length > 0) {
      editables[0].click();
      editables[0].focus();
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Type the prompt
  await page.keyboard.type('Professional mobile app UI mockup for fitness dashboard. Dark mode design with orange accent. Glassmorphism cards. Hero shows big 47 marathons number. Progress ring chart. Premium Strava Apple Fitness style.', { delay: 20 });
  
  await page.screenshot({ path: '/tmp/ff3-7.png' });
  
  // Click Generate
  console.log('Clicking Generate...');
  const clicked = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent && b.textContent.includes('Generate')) {
        b.click();
        return true;
      }
    }
    return false;
  });
  console.log('Generate clicked:', clicked);
  
  console.log('Waiting 90s for images...');
  await new Promise(r => setTimeout(r, 90000));
  
  await page.screenshot({ path: '/tmp/ff3-final.png', fullPage: true });
  fs.copyFileSync('/tmp/ff3-final.png', '/Users/laurenjohnston/fairy-bubbles/GoalConnect/.design-session/05-mockup-strava.png');
  
  console.log('Done! Check /tmp/ff3-*.png');
  await browser.close();
})();
