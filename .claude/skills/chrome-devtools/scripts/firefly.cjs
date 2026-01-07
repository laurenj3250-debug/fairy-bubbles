const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 900 }
  });
  
  const page = await browser.newPage();
  
  console.log('Going to Firefly...');
  await page.goto('https://firefly.adobe.com/generate/images', { 
    waitUntil: 'networkidle0', 
    timeout: 60000 
  });
  
  await page.screenshot({ path: '/tmp/ff1.png' });
  console.log('Step 1 done');
  
  await new Promise(r => setTimeout(r, 3000));
  const url = page.url();
  console.log('URL:', url);
  
  if (url.includes('ims') || url.includes('auth') || url.includes('signin')) {
    console.log('Login needed');
    
    await page.waitForSelector('input', { timeout: 10000 });
    await page.type('input[type="email"], input[name="username"], input:first-of-type', 'laurenj3250@gmail.com');
    await page.screenshot({ path: '/tmp/ff2.png' });
    
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.evaluate(el => el.innerText);
      if (text.includes('Continue') || text.includes('Next')) {
        await btn.click();
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '/tmp/ff3.png' });
    
    try {
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await page.type('input[type="password"]', '143Klaus!');
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 10000));
    } catch (e) {
      console.log('PW error:', e.message);
    }
  }
  
  await page.screenshot({ path: '/tmp/ff5.png' });
  console.log('Post-login, URL:', page.url());
  
  await new Promise(r => setTimeout(r, 5000));
  
  try {
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.click();
      await textarea.type('Mobile app UI dark fitness dashboard orange accent glass cards 47 marathons progress ring chart strava style');
      await page.screenshot({ path: '/tmp/ff6.png' });
      
      await page.keyboard.down('Meta');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Meta');
      
      console.log('Generating...');
      await new Promise(r => setTimeout(r, 60000));
    }
  } catch (e) {
    console.log('Prompt error:', e.message);
  }
  
  await page.screenshot({ path: '/tmp/ff-final.png', fullPage: true });
  fs.copyFileSync('/tmp/ff-final.png', '/Users/laurenjohnston/fairy-bubbles/GoalConnect/.design-session/05-mockup-strava.png');
  
  console.log('Done!');
  await browser.close();
})();
