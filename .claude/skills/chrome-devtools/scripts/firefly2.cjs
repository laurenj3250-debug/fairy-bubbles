const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Launching...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // First click Sign In
  console.log('Going to Firefly...');
  await page.goto('https://firefly.adobe.com', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // Click Sign In button
  console.log('Looking for Sign In button...');
  const signInBtn = await page.$('button:has-text("Sign in"), a:has-text("Sign in"), [data-testid="sign-in"]');
  if (signInBtn) {
    await signInBtn.click();
    await new Promise(r => setTimeout(r, 3000));
  } else {
    // Try clicking by text
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a');
      for (const b of btns) {
        if (b.textContent.includes('Sign in')) {
          b.click();
          return;
        }
      }
    });
    await new Promise(r => setTimeout(r, 3000));
  }
  
  await page.screenshot({ path: '/tmp/ff2-1.png' });
  console.log('After sign in click, URL:', page.url());
  
  // Now we should be on Adobe login
  if (page.url().includes('ims') || page.url().includes('auth')) {
    console.log('On login page');
    
    // Email
    await page.waitForSelector('input', { timeout: 15000 });
    const inputs = await page.$$('input');
    if (inputs.length > 0) {
      await inputs[0].type('laurenj3250@gmail.com', { delay: 30 });
    }
    
    await page.screenshot({ path: '/tmp/ff2-2.png' });
    
    // Click Continue
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.includes('Continue')) {
          b.click();
          return;
        }
      }
    });
    
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: '/tmp/ff2-3.png' });
    
    // Password
    const pwInput = await page.$('input[type="password"]');
    if (pwInput) {
      console.log('Entering password...');
      await pwInput.type('143Klaus!', { delay: 30 });
      await page.screenshot({ path: '/tmp/ff2-4.png' });
      
      // Click Continue/Sign In
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          if (b.textContent.includes('Continue') || b.textContent.includes('Sign')) {
            b.click();
            return;
          }
        }
      });
      
      console.log('Waiting for redirect...');
      await new Promise(r => setTimeout(r, 8000));
    }
  }
  
  await page.screenshot({ path: '/tmp/ff2-5.png' });
  console.log('Post-login URL:', page.url());
  
  // Navigate to generate page
  await page.goto('https://firefly.adobe.com/generate/images', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: '/tmp/ff2-6.png' });
  
  // Find the prompt field - it has placeholder text "Describe the image you want to generate"
  console.log('Looking for prompt field...');
  const promptField = await page.$('textarea, [contenteditable="true"], input[placeholder*="Describe"]');
  
  if (promptField) {
    console.log('Found prompt field, typing...');
    await promptField.click();
    await promptField.type('Professional mobile app UI mockup for fitness dashboard called Strava Journey. Dark mode with orange accent color. Glassmorphism cards. Hero shows big orange 47 marathons text. Progress ring, donut chart, line chart. Premium Strava Apple Fitness style. High fidelity design.');
  } else {
    // Try clicking on the prompt area by coordinates or placeholder text
    await page.evaluate(() => {
      const el = document.querySelector('[placeholder*="Describe"], textarea');
      if (el) el.click();
    });
    await page.keyboard.type('Professional mobile app UI mockup for fitness dashboard called Strava Journey. Dark mode with orange accent color. Glassmorphism cards. Hero shows big orange 47 marathons text. Progress ring, donut chart, line chart. Premium Strava Apple Fitness style.');
  }
  
  await page.screenshot({ path: '/tmp/ff2-7.png' });
  
  // Click Generate button
  console.log('Clicking Generate...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.includes('Generate')) {
        b.click();
        return true;
      }
    }
    return false;
  });
  
  console.log('Waiting 90s for generation...');
  await new Promise(r => setTimeout(r, 90000));
  
  await page.screenshot({ path: '/tmp/ff2-final.png', fullPage: true });
  fs.copyFileSync('/tmp/ff2-final.png', '/Users/laurenjohnston/fairy-bubbles/GoalConnect/.design-session/05-mockup-strava.png');
  
  console.log('Done!');
  await browser.close();
})();
