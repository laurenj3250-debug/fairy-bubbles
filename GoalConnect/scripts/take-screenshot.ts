import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    // Login first
    console.log("Navigating to login...");
    await page.goto("http://localhost:5001/login", { waitUntil: "networkidle", timeout: 10000 });
    console.log("Filling login form...");
    await page.fill("#email", "laurenj3250");
    await page.fill("#password", "Crumpet11!!");
    await page.click("button[type=submit]");
    console.log("Submitted login, waiting...");
    await page.waitForTimeout(3000);

    // Navigate to yearly goals
    console.log("Navigating to yearly goals...");
    await page.goto("http://localhost:5001/yearly-goals", { waitUntil: "networkidle", timeout: 10000 });
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: "/tmp/yearly-goals.png", fullPage: true });
    console.log("Screenshot saved to /tmp/yearly-goals.png");
  } catch (err) {
    console.error("Error:", err);
    await page.screenshot({ path: "/tmp/error-screenshot.png" });
    console.log("Error screenshot saved");
  } finally {
    await browser.close();
  }
}

main();
