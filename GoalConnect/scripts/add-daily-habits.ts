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

    const today = new Date().toISOString().split('T')[0];

    // Add Mind category habit (daily)
    await client.query(`
      INSERT INTO habits (user_id, title, description, icon, color, cadence, category, effort, grade, difficulty)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [1, 'Morning Stretch', 'Light morning movement to start the day', '🧘',
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'daily', 'mind', 'light', '5.6', 'easy']);

    console.log("✓ Added: Morning Stretch (mind, daily)");

    // Add Foundation category habit (daily)
    await client.query(`
      INSERT INTO habits (user_id, title, description, icon, color, cadence, category, effort, grade, difficulty)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [1, 'Push-ups', 'Build upper body strength', '💪',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 'daily', 'foundation', 'medium', '5.9', 'medium']);

    console.log("✓ Added: Push-ups (foundation, daily)");

    // Add Adventure category habit scheduled for today
    await client.query(`
      INSERT INTO habits (user_id, title, description, icon, color, cadence, category, effort, grade, difficulty, scheduled_day)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [1, 'Outdoor Adventure', 'Weekly outdoor activity - hike, climb, or explore', '🏔️',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 'weekly', 'adventure', 'heavy', '5.11', 'hard', today]);

    console.log(`✓ Added: Outdoor Adventure (adventure, scheduled for ${today})`);

    console.log("\n✅ Successfully added 3 new test habits!");
    console.log("\n📊 New habits that will show in Today's Pitch:");
    console.log("   - Mind: Morning Stretch (daily)");
    console.log("   - Foundation: Push-ups (daily)");
    console.log("   - Adventure: Outdoor Adventure (scheduled for today)");
    console.log("\nPlus your existing 2 weekly habits:");
    console.log("   - Mind: RemNote");
    console.log("   - Training: Gym");
    console.log("\nTotal expected in Today's Pitch: 5 habits with glowing climbing holds! 🧗");

  } catch (error: any) {
    if (error.code === '23505') {
      console.log("\n⚠️  One or more habits already exist. Skipping...");
    } else {
      console.error("Error:", error);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

main();
