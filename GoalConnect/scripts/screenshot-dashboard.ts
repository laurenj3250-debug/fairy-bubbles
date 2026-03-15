/**
 * Take a screenshot of the dashboard for verification
 */
import { firefox } from "playwright";

async function main() {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto("http://localhost:5001/login");
  await page.waitForTimeout(3000); // Wait for React to mount
  await page.screenshot({ path: "tests/screenshots/login-page.png" });

  // Fill login form - wait for input to appear
  const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
  await usernameInput.waitFor({ state: "visible", timeout: 10000 });
  await usernameInput.fill("lauren");

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: "visible" });
  await passwordInput.fill("password123");

  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL("http://localhost:5001/", { timeout: 10000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000); // Let animations settle

  // Take screenshot
  await page.screenshot({ path: "tests/screenshots/dashboard-verified.png", fullPage: true });
  console.log("Screenshot saved to tests/screenshots/dashboard-verified.png");

  // Test the API endpoint
  const response = await page.request.get("http://localhost:5001/api/recent-outdoor-activities?limit=4");
  console.log("API Response:", await response.json());

  // Test yearly goals API
  const goalsResponse = await page.request.get("http://localhost:5001/api/yearly-goals/with-progress?year=2026");
  const goals = await goalsResponse.json();

  // Find book goals
  const bookGoals = goals.filter((g: any) =>
    g.title.toLowerCase().includes("book") ||
    g.title.toLowerCase().includes("audiobook")
  );
  console.log("\nBook goals:");
  bookGoals.forEach((g: any) => {
    console.log(`  - "${g.title}": sourceLabel="${g.sourceLabel}", value=${g.currentValue}/${g.targetValue}`);
  });

  await browser.close();
}

main().catch(console.error);
