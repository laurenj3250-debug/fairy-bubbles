import "../server/load-env";
import pkg from "pg";
const { Client } = pkg;
import fs from "fs";
import path from "path";

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL not found");
    process.exit(1);
  }

  // Create client with SSL config
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✓ Connected to database");

    // First, check existing habits
    const result = await client.query(
      "SELECT id, title, category, cadence, scheduled_day FROM habits WHERE user_id = $1",
      [1]
    );

    console.log(`\nFound ${result.rows.length} existing habits for user 1:`);
    result.rows.forEach(row => {
      const scheduled = row.scheduled_day ? `scheduled: ${row.scheduled_day}` : 'unscheduled';
      console.log(`  - ${row.title} (${row.category}, ${row.cadence}, ${scheduled})`);
    });

    if (result.rows.length === 0) {
      console.log("\nNo habits found. Adding test habits...");

      const today = new Date().toISOString().split('T')[0];

      // Add Mind category habit
      await client.query(`
        INSERT INTO habits (user_id, title, description, icon, color, cadence, category, effort, grade, difficulty)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [1, 'Morning Stretch', 'Light morning movement to start the day', '🧘',
          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'daily', 'mind', 'light', '5.6', 'easy']);

      console.log("✓ Added: Morning Stretch (mind)");

      // Add Foundation category habit
      await client.query(`
        INSERT INTO habits (user_id, title, description, icon, color, cadence, category, effort, grade, difficulty)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [1, 'Push-ups', 'Build upper body strength', '💪',
          'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 'daily', 'foundation', 'medium', '5.9', 'medium']);

      console.log("✓ Added: Push-ups (foundation)");

      // Add Training category habit
      await client.query(`
        INSERT INTO habits (user_id, title, description, icon, color, cadence, category, effort, grade, difficulty)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [1, 'Read 20 min', 'Daily reading practice', '📚',
          'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 'daily', 'training', 'light', '5.7', 'easy']);

      console.log("✓ Added: Read 20 min (training)");

      // Add Adventure category habit scheduled for today
      await client.query(`
        INSERT INTO habits (user_id, title, description, icon, color, cadence, category, effort, grade, difficulty, scheduled_day)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [1, 'Outdoor Adventure', 'Weekly outdoor activity - hike, climb, or explore', '🏔️',
          'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 'weekly', 'adventure', 'heavy', '5.11', 'hard', today]);

      console.log(`✓ Added: Outdoor Adventure (adventure, scheduled for ${today})`);

      console.log("\n✅ Successfully added 4 test habits!");
      console.log("\n📊 Habits that will show in Today's Pitch:");
      console.log("   - Mind: 1 (Morning Stretch)");
      console.log("   - Foundation: 1 (Push-ups)");
      console.log("   - Training: 1 (Read 20 min)");
      console.log("   - Adventure: 1 (Outdoor Adventure - scheduled for today)");
      console.log("\nRefresh the app to see the glowing climbing holds! 🧗");

    } else {
      console.log("\nHabits already exist.");

      // Check for issues
      const adventureHabits = result.rows.filter((r: any) => r.category === 'adventure');
      const unscheduled = adventureHabits.filter((r: any) => !r.scheduled_day);

      if (unscheduled.length > 0) {
        console.log(`\n⚠️  Found ${unscheduled.length} unscheduled adventure habit(s):`);
        unscheduled.forEach((h: any) => console.log(`   - ${h.title}`));
        console.log("   These won't show in Today's Pitch until scheduled.");
      }

      const today = new Date().toISOString().split('T')[0];
      const todaysAdventure = adventureHabits.filter((r: any) => r.scheduled_day === today);

      if (todaysAdventure.length > 0) {
        console.log(`\n✓ Found ${todaysAdventure.length} adventure habit(s) scheduled for today`);
      }

      // Count habits that should appear today
      const todaysHabits = result.rows.filter((r: any) =>
        r.category !== 'adventure' || r.scheduled_day === today
      );

      console.log(`\n📊 Expected habits in Today's Pitch: ${todaysHabits.length}`);

      const categoryCounts: Record<string, number> = {};
      todaysHabits.forEach((h: any) => {
        const cat = h.category || 'training';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      console.log("Categories breakdown:");
      Object.entries(categoryCounts).forEach(([cat, count]) => {
        console.log(`   - ${cat}: ${count}`);
      });
    }

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
