import { firefox } from "playwright";

const PAGES = [
  { path: "/", name: "dashboard" },
  { path: "/goals", name: "goals" },
  { path: "/adventures", name: "adventures" },
  { path: "/yearly-goals", name: "yearly-goals" },
  { path: "/rewards", name: "rewards" },
];

async function main() {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    // Login
    console.log("Logging in...");
    await page.goto("http://localhost:5001/login", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.fill("#email", "laurenj3250@gmail.com");
    await page.fill("#password", "Crumpet11!!");
    await page.click("button[type=submit]");
    await page.waitForTimeout(5000);
    // Check if we landed on dashboard
    console.log("Current URL after login:", page.url());
    await page.waitForTimeout(2000);
    console.log("Logged in successfully");

    // Screenshot each page
    for (const { path, name } of PAGES) {
      console.log(`Screenshotting ${name} (${path})...`);
      await page.goto(`http://localhost:5001${path}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(3000); // Let data load
      await page.screenshot({ path: `/tmp/audit-${name}.png`, fullPage: true });
      console.log(`  Saved: /tmp/audit-${name}.png`);
    }

    // Also get API data for debugging
    console.log("\nFetching API data...");

    const goalsResp = await page.evaluate(() => fetch("/api/goals").then(r => r.json()));
    console.log(`Goals: ${JSON.stringify(goalsResp).slice(0, 500)}`);

    const yearlyResp = await page.evaluate(() => fetch("/api/yearly-goals").then(r => r.json()));
    console.log(`Yearly goals: ${JSON.stringify(yearlyResp).slice(0, 500)}`);

    const habitsResp = await page.evaluate(() => fetch("/api/habits-with-data").then(r => r.json()));
    console.log(`Habits count: ${Array.isArray(habitsResp) ? habitsResp.length : 'error'}`);
    if (Array.isArray(habitsResp)) {
      habitsResp.forEach((h: any) => {
        console.log(`  - ${h.title} (id:${h.id}, difficulty:${h.difficulty}, linkedGoal:${h.linkedGoalId})`);
      });
    }

    const pointsResp = await page.evaluate(() => fetch("/api/points").then(r => r.json()));
    console.log(`Points: ${JSON.stringify(pointsResp)}`);

  } catch (err) {
    console.error("Error:", err);
    await page.screenshot({ path: "/tmp/audit-error.png" }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main();
