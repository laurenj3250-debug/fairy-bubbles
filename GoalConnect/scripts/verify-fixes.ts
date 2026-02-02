import { firefox } from "playwright";

async function main() {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const results: { test: string; pass: boolean; detail: string }[] = [];

  function log(test: string, pass: boolean, detail: string) {
    results.push({ test, pass, detail });
    console.log(`${pass ? "PASS" : "FAIL"} ${test}: ${detail}`);
  }

  try {
    // Login
    console.log("=== Logging in... ===");
    await page.goto("http://localhost:5001/login", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.fill("#email", "laurenj3250@gmail.com");
    await page.fill("#password", "Crumpet11!!");
    await page.click("button[type=submit]");
    await page.waitForTimeout(5000);
    console.log("Current URL:", page.url());

    // === TEST 1: Dashboard loads ===
    console.log("\n=== TEST 1: Dashboard loads ===");
    await page.goto("http://localhost:5001/", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "/tmp/verify-dashboard.png", fullPage: true });
    log("Dashboard loads", true, "Screenshot saved");

    // === TEST 2: Outdoor day button exists (not dropdown) ===
    console.log("\n=== TEST 2: Outdoor day one-click button ===");
    const outdoorButtons = await page.locator("button:has-text('Outdoor day')").count();
    log("Outdoor day button exists", outdoorButtons > 0, `Found ${outdoorButtons} outdoor day button(s)`);

    // === TEST 3: API - POST /api/adventures/quick exists ===
    console.log("\n=== TEST 3: Quick adventure API ===");
    const apiResult = await page.evaluate(async () => {
      try {
        const res = await fetch("/api/adventures/quick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: "2026-02-02", activity: "Verify test" }),
        });
        return { status: res.status, body: await res.json() };
      } catch (e: any) {
        return { status: 0, body: e.message };
      }
    });
    log(
      "POST /api/adventures/quick works",
      apiResult.status === 201,
      `Status: ${apiResult.status}, Body: ${JSON.stringify(apiResult.body).slice(0, 200)}`
    );

    // === TEST 4: Adventures page shows data ===
    console.log("\n=== TEST 4: Adventures page ===");
    await page.goto("http://localhost:5001/adventures", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "/tmp/verify-adventures.png", fullPage: true });
    const emptyState = await page.locator("text=Log your first adventure").count();
    log(
      "Adventures page has data",
      emptyState === 0,
      emptyState > 0 ? "Shows empty state 'Log your first adventure'" : "No empty state shown"
    );

    // === TEST 5: Quick Goal Dialog has yearly goal linking ===
    console.log("\n=== TEST 5: Quick Goal Dialog yearly linking ===");
    await page.goto("http://localhost:5001/", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(3000);
    // Look for Quick Goal button variants
    const addGoalBtn = page.locator("button:has-text('Quick Goal'), button:has-text('Add Goal'), button:has-text('quick goal')").first();
    const addBtnExists = await addGoalBtn.count();
    if (addBtnExists > 0) {
      await addGoalBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: "/tmp/verify-quickgoal.png", fullPage: true });
      const yearlyLinkLabel = await page.locator("text=Link to Yearly Goal").count();
      log(
        "Quick Goal has yearly goal linking",
        yearlyLinkLabel > 0,
        yearlyLinkLabel > 0 ? "Found 'Link to Yearly Goal' dropdown" : "Missing yearly goal link dropdown"
      );
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    } else {
      // Try clicking + buttons or other triggers
      const plusBtns = await page.locator("button:has(svg.lucide-plus)").all();
      console.log(`Found ${plusBtns.length} plus buttons, trying each...`);
      let found = false;
      for (let i = 0; i < Math.min(plusBtns.length, 5); i++) {
        try {
          await plusBtns[i].click();
          await page.waitForTimeout(1000);
          const yearlyLinkLabel = await page.locator("text=Link to Yearly Goal").count();
          if (yearlyLinkLabel > 0) {
            await page.screenshot({ path: "/tmp/verify-quickgoal.png", fullPage: true });
            log("Quick Goal has yearly goal linking", true, `Found via plus button #${i}`);
            found = true;
            await page.keyboard.press("Escape");
            break;
          }
          await page.keyboard.press("Escape");
          await page.waitForTimeout(300);
        } catch { /* button might not be clickable */ }
      }
      if (!found) {
        log("Quick Goal has yearly goal linking", false, "Could not find or open Quick Goal dialog");
      }
    }

    // === TEST 6: Mountain icon for full adventure ===
    console.log("\n=== TEST 6: Mountain icon for full adventure ===");
    await page.goto("http://localhost:5001/", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(3000);
    const mountainBtns = await page.locator("button[title='Log full adventure with photos']").count();
    log("Mountain icon button exists", mountainBtns > 0, `Found ${mountainBtns} mountain button(s)`);

    // === TEST 7: Points API ===
    console.log("\n=== TEST 7: Points system ===");
    const pointsData = await page.evaluate(() => fetch("/api/points").then(r => r.json()));
    log("Points API responds", !!pointsData, `Points: ${JSON.stringify(pointsData).slice(0, 200)}`);

    // === TEST 8: Yearly goals data ===
    console.log("\n=== TEST 8: Yearly goals ===");
    const yearlyData = await page.evaluate(() =>
      fetch("/api/yearly-goals/with-progress?year=2026").then(r => r.json())
    );
    const goalCount = Array.isArray(yearlyData?.goals) ? yearlyData.goals.length : 0;
    log("Yearly goals load", goalCount > 0, `Found ${goalCount} yearly goals`);

    // === SUMMARY ===
    console.log("\n\n========== VERIFICATION SUMMARY ==========");
    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;
    console.log(`Passed: ${passed}/${results.length}`);
    console.log(`Failed: ${failed}/${results.length}`);
    if (failed > 0) {
      console.log("\nFailed tests:");
      results.filter(r => !r.pass).forEach(r => console.log(`  FAIL ${r.test}: ${r.detail}`));
    }
    console.log("==========================================");

  } catch (err) {
    console.error("Error:", err);
    await page.screenshot({ path: "/tmp/verify-error.png" }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main();
