import { getBrowser, getPage, closeBrowser } from './lib/browser.js';
import fs from 'fs';

async function main() {
  const page = await getPage({ headless: false });
  
  console.log('Navigating to Firefly...');
  await page.goto('https://firefly.adobe.com/generate/images', { waitUntil: 'networkidle2', timeout: 60000 });
  
  await page.screenshot({ path: '/tmp/firefly-1-landing.png' });
  console.log('Screenshot 1: landing');
  
  await new Promise(r => setTimeout(r, 3000));
  
  const currentUrl = page.url();
  console.log('URL:', currentUrl);
  
  if (currentUrl.includes('auth') || currentUrl.includes('signin') || currentUrl.includes('login') || currentUrl.includes('ims')) {
    console.log('Login page detected');
    
    try {
      await page.waitForSelector('input[type="email"], input[name="email"], #EmailPage-EmailField', { timeout: 15000 });
      const emailInput = await page.$('input[type="email"], input[name="email"], #EmailPage-EmailField');
      if (emailInput) {
        await emailInput.type('laurenj3250@gmail.com', { delay: 50 });
      }
      await page.screenshot({ path: '/tmp/firefly-2-email.png' });
      
      await new Promise(r => setTimeout(r, 1000));
      await page.keyboard.press('Enter');
      
      await new Promise(r => setTimeout(r, 4000));
      await page.screenshot({ path: '/tmp/firefly-3-afteremail.png' });
      
      const pwInput = await page.$('input[type="password"]');
      if (pwInput) {
        await pwInput.type('143Klaus!', { delay: 50 });
        await new Promise(r => setTimeout(r, 500));
        await page.keyboard.press('Enter');
      }
      
      await new Promise(r => setTimeout(r, 10000));
    } catch (e) {
      console.log('Login error:', e.message);
    }
  }
  
  await page.screenshot({ path: '/tmp/firefly-4-state.png' });
  console.log('Screenshot 4: current state');
  console.log('Final URL:', page.url());
  
  // Look for prompt area
  await new Promise(r => setTimeout(r, 5000));
  
  const promptArea = await page.$('textarea, [data-testid="prompt-input"], [contenteditable="true"]');
  if (promptArea) {
    console.log('Found prompt input');
    await promptArea.click();
    await page.keyboard.type('Mobile app UI mockup dark mode fitness dashboard Strava Journey orange accent glassmorphism big 47 marathons number progress ring donut chart premium design');
    await page.screenshot({ path: '/tmp/firefly-5-prompt.png' });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Press Cmd+Enter or find generate button
    await page.keyboard.down('Meta');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Meta');
    
    console.log('Waiting 60s for generation...');
    await new Promise(r => setTimeout(r, 60000));
  }
  
  await page.screenshot({ path: '/tmp/firefly-6-final.png', fullPage: true });
  fs.copyFileSync('/tmp/firefly-6-final.png', '/Users/laurenjohnston/fairy-bubbles/GoalConnect/.design-session/05-mockup-strava.png');
  
  console.log('Done! Check /tmp/firefly-*.png for progress');
  await closeBrowser();
}

main().catch(e => { console.error(e); process.exit(1); });
