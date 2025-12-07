import "../server/load-env";
import pkg from "pg";
const { Client } = pkg;

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL not found");
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✓ Connected to database");

    const userId = 1; // Lauren's user ID
    const deadline = "2025-12-31";
    const month = "2025-12";

    // ============ GOALS ============

    // Goal 1: Ice Climbing
    const iceClimbingGoal = await client.query(`
      INSERT INTO goals (user_id, title, description, target_value, current_value, unit, deadline, category, difficulty, priority, month)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [userId, 'Go Ice Climbing', 'Book and complete a guided ice climbing trip', 1, 0, 'trip', deadline, 'adventure', 'medium', 'high', month]);
    console.log("✓ Created goal: Go Ice Climbing");

    // Goal 2: Bed by 9pm (linked to cumulative habit)
    const bedtimeGoal = await client.query(`
      INSERT INTO goals (user_id, title, description, target_value, current_value, unit, deadline, category, difficulty, priority, month)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [userId, 'Bed by 9pm', 'Get to bed by 9pm at least 25 days this month', 25, 0, 'days', deadline, 'health', 'medium', 'high', month]);
    console.log("✓ Created goal: Bed by 9pm (25/30 days)");

    // Goal 3: German Module 2
    const germanGoal = await client.query(`
      INSERT INTO goals (user_id, title, description, target_value, current_value, unit, deadline, category, difficulty, priority, month)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [userId, 'Finish German Module 2', 'Complete remaining 15 Pimsleur lessons', 15, 0, 'lessons', deadline, 'learning', 'medium', 'high', month]);
    console.log("✓ Created goal: Finish German Module 2 (15 lessons)");

    // Goal 4: V4 Kilter Benchmark
    const kilterGoal = await client.query(`
      INSERT INTO goals (user_id, title, description, target_value, current_value, unit, deadline, category, difficulty, priority, month)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [userId, 'Send V4 Kilter Benchmark', 'Complete the V4 benchmark climb on Kilter board', 1, 0, 'send', deadline, 'climbing', 'hard', 'high', month]);
    console.log("✓ Created goal: Send V4 Kilter Benchmark");

    // Goal 5: Localization Practice
    const localizationGoal = await client.query(`
      INSERT INTO goals (user_id, title, description, target_value, current_value, unit, deadline, category, difficulty, priority, month)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [userId, 'Localization Practice', 'Document 15 neuro cases with localization predictions, track accuracy (target 80%+)', 15, 0, 'cases', deadline, 'career', 'hard', 'high', month]);
    console.log("✓ Created goal: Localization Practice (15 cases)");

    // ============ HABITS (linked to goals) ============

    // Habit for Bed by 9pm
    await client.query(`
      INSERT INTO habits (user_id, title, description, icon, color, cadence, category, difficulty, goal_type, target_value, target_date, linked_goal_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      userId,
      'Bed by 9pm',
      'Get in bed by 9pm - even on weekends',
      '🌙',
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'daily',
      'foundation',
      'medium',
      'cumulative',
      25,
      deadline,
      bedtimeGoal.rows[0].id
    ]);
    console.log("✓ Created habit: Bed by 9pm (linked to goal)");

    // Habit for German
    await client.query(`
      INSERT INTO habits (user_id, title, description, icon, color, cadence, category, difficulty, goal_type, target_value, target_date, linked_goal_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      userId,
      'German Pimsleur',
      'Complete one Pimsleur German lesson',
      '🇩🇪',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'daily',
      'mind',
      'medium',
      'cumulative',
      15,
      deadline,
      germanGoal.rows[0].id
    ]);
    console.log("✓ Created habit: German Pimsleur (linked to goal)");

    // Habit for Localization
    await client.query(`
      INSERT INTO habits (user_id, title, description, icon, color, cadence, category, difficulty, goal_type, target_value, target_date, linked_goal_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      userId,
      'Localization Case',
      'Document a neuro case: signalment, exam findings, your localization, actual diagnosis',
      '🧠',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'weekly',
      'training',
      'hard',
      'cumulative',
      15,
      deadline,
      localizationGoal.rows[0].id
    ]);
    console.log("✓ Created habit: Localization Case (linked to goal)");

    console.log("\n" + "=".repeat(50));
    console.log("✅ DECEMBER 2025 GOALS ADDED!");
    console.log("=".repeat(50));
    console.log("\n📊 Goals created:");
    console.log("   1. Go Ice Climbing (1 trip)");
    console.log("   2. Bed by 9pm (25/30 days)");
    console.log("   3. Finish German Module 2 (15 lessons)");
    console.log("   4. Send V4 Kilter Benchmark (1 send)");
    console.log("   5. Localization Practice (15 cases, 80%+ accuracy)");
    console.log("\n🔗 Linked habits created:");
    console.log("   - Bed by 9pm → tracks toward 25-day goal");
    console.log("   - German Pimsleur → tracks toward 15-lesson goal");
    console.log("   - Localization Case → tracks toward 15-case goal");
    console.log("\n💡 Note: Ice Climbing and Kilter goals are standalone");
    console.log("   (complete them manually when you send/do them)");

  } catch (error: any) {
    if (error.code === '23505') {
      console.log("\n⚠️  Some goals/habits already exist. Skipping duplicates...");
    } else {
      console.error("Error:", error);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

main();
