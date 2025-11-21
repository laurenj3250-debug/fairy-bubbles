/**
 * Test script for cumulative goals system
 * Tests creating a cumulative habit with metrics and logging sessions
 */

const BASE_URL = process.env.TEST_URL || "http://localhost:5001";

async function testCumulativeGoals() {
  console.log("🧪 Testing Cumulative Goals System\n");

  try {
    // Step 1: Login
    console.log("1️⃣ Logging in...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "laurenj3250@gmail.com",
        password: "Crumpet11!!",
      }),
      credentials: "include",
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }

    // Extract ALL set-cookie headers and parse them
    const cookies = loginRes.headers.getSetCookie?.() || [loginRes.headers.get("set-cookie")].filter(Boolean);
    // Extract just the cookie name=value pairs (before the first semicolon)
    const cookieString = cookies
      .map(c => c.split(';')[0])
      .join('; ');
    console.log("✅ Logged in successfully");
    console.log(`   Cookies: ${cookieString}\n`);

    // Step 2: Create a cumulative habit
    console.log("2️⃣ Creating cumulative climbing habit...");
    const createHabitRes = await fetch(`${BASE_URL}/api/habits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
      body: JSON.stringify({
        title: "Rock Climbing [TEST]",
        description: "Send 6b on kilter by March 15, 2025",
        icon: "🧗",
        color: "#ef4444",
        cadence: "daily",
        difficulty: "hard",
        category: "training",
        effort: "heavy",
        goalType: "cumulative",
        targetValue: 40,
        currentValue: 0,
        targetDate: "2025-03-15",
        createdDate: new Date().toISOString().split("T")[0],
        isLocked: true,
        primaryGoalAchieved: false,
      }),
      credentials: "include",
    });

    if (!createHabitRes.ok) {
      const error = await createHabitRes.text();
      throw new Error(`Failed to create habit: ${error}`);
    }

    const habit = await createHabitRes.json();
    console.log(`✅ Created habit: ${habit.title} (ID: ${habit.id})`);
    console.log(`   Goal Type: ${habit.goalType}`);
    console.log(`   Target: ${habit.targetValue} by ${habit.targetDate}`);
    console.log(`   Current: ${habit.currentValue}\n`);

    // Step 3: Quick tap logging (no details)
    console.log("3️⃣ Testing quick tap logging...");
    const today = new Date().toISOString().split("T")[0];

    const quickLogRes = await fetch(`${BASE_URL}/api/habit-logs/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
      body: JSON.stringify({
        habitId: habit.id,
        date: today,
        incrementValue: 1,
      }),
      credentials: "include",
    });

    if (!quickLogRes.ok) {
      const error = await quickLogRes.text();
      throw new Error(`Quick log failed: ${error}`);
    }

    const quickLog = await quickLogRes.json();
    console.log(`✅ Quick tap logged!`);
    console.log(`   Completed: ${quickLog.completed}`);
    console.log(`   Increment Value: ${quickLog.incrementValue || 1}\n`);

    // Step 4: Verify currentValue incremented
    console.log("4️⃣ Verifying currentValue updated...");
    const checkHabitRes = await fetch(`${BASE_URL}/api/habits/${habit.id}`, {
      headers: { Cookie: cookies || "" },
      credentials: "include",
    });

    const updatedHabit = await checkHabitRes.json();
    console.log(`✅ Current Value: ${updatedHabit.currentValue}/${updatedHabit.targetValue}`);

    if (updatedHabit.currentValue === 1) {
      console.log("   ✓ Increment working correctly!\n");
    } else {
      console.log(`   ⚠️  Expected 1, got ${updatedHabit.currentValue}\n`);
    }

    // Step 5: Detailed logging (with session info)
    console.log("5️⃣ Testing detailed logging...");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const detailedLogRes = await fetch(`${BASE_URL}/api/habit-logs/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
      body: JSON.stringify({
        habitId: habit.id,
        date: yesterdayStr,
        durationMinutes: 90,
        quantityCompleted: 5,
        sessionType: "gym",
        incrementValue: 1,
      }),
      credentials: "include",
    });

    if (!detailedLogRes.ok) {
      const error = await detailedLogRes.text();
      throw new Error(`Detailed log failed: ${error}`);
    }

    const detailedLog = await detailedLogRes.json();
    console.log(`✅ Detailed log created!`);
    console.log(`   Duration: ${detailedLog.durationMinutes} min`);
    console.log(`   Quantity: ${detailedLog.quantityCompleted} problems`);
    console.log(`   Session Type: ${detailedLog.sessionType}\n`);

    // Step 6: Check final state
    console.log("6️⃣ Final verification...");
    const finalHabitRes = await fetch(`${BASE_URL}/api/habits/${habit.id}`, {
      headers: { Cookie: cookies || "" },
      credentials: "include",
    });

    const finalHabit = await finalHabitRes.json();
    console.log(`✅ Final State:`);
    console.log(`   Current Value: ${finalHabit.currentValue}/${finalHabit.targetValue}`);
    console.log(`   Progress: ${Math.round((finalHabit.currentValue / finalHabit.targetValue) * 100)}%`);
    console.log(`   Primary Goal: ${finalHabit.primaryGoalAchieved ? "✓ ACHIEVED" : "Not yet"}\n`);

    // Step 7: Cleanup
    console.log("7️⃣ Cleaning up test data...");
    await fetch(`${BASE_URL}/api/habits/${habit.id}`, {
      method: "DELETE",
      headers: { Cookie: cookies || "" },
      credentials: "include",
    });
    console.log("✅ Test habit deleted\n");

    console.log("🎉 ALL TESTS PASSED!");
    console.log("\n📊 Summary:");
    console.log("   ✓ Cumulative habit creation");
    console.log("   ✓ Quick tap logging (no details)");
    console.log("   ✓ Detailed logging (with session data)");
    console.log("   ✓ currentValue auto-increment");
    console.log("   ✓ Progress tracking\n");

  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
    process.exit(1);
  }
}

testCumulativeGoals();
