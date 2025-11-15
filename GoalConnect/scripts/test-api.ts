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

    const today = new Date().toISOString().split('T')[0];

    // Simulate what the API returns
    const habitsResult = await client.query(
      "SELECT * FROM habits WHERE user_id = $1 ORDER BY id",
      [1]
    );

    console.log("=== API Response Simulation ===");
    console.log(`Today's date: ${today}\n`);

    console.log("All habits from database:");
    habitsResult.rows.forEach(habit => {
      console.log(`\nHabit ID ${habit.id}:`);
      console.log(`  Title: ${habit.title}`);
      console.log(`  Category: ${habit.category || 'null'}`);
      console.log(`  Cadence: ${habit.cadence}`);
      console.log(`  Scheduled Day: ${habit.scheduled_day || 'null'}`);
      console.log(`  Effort: ${habit.effort || 'null'}`);
      console.log(`  Grade: ${habit.grade || 'null'}`);
    });

    // Simulate the filtering logic from TodaysPitchEnhanced.tsx
    console.log("\n\n=== Filtering Logic (TodaysPitchEnhanced.tsx) ===");

    const groups: Record<string, any[]> = {
      mind: [],
      foundation: [],
      adventure: [],
      training: [],
    };

    habitsResult.rows.forEach((habit) => {
      const category = habit.category || "training";

      if (category === "adventure") {
        if (habit.scheduled_day === today) {
          groups[category].push(habit);
          console.log(`✓ ${habit.title} → ${category} (scheduled for today)`);
        } else {
          console.log(`✗ ${habit.title} → ${category} (NOT scheduled for today, scheduled: ${habit.scheduled_day || 'null'})`);
        }
      } else {
        groups[category].push(habit);
        console.log(`✓ ${habit.title} → ${category}`);
      }
    });

    console.log("\n\n=== Grouped Habits (what shows in UI) ===");
    Object.entries(groups).forEach(([category, habits]) => {
      if (habits.length > 0) {
        console.log(`\n${category.toUpperCase()}:`);
        habits.forEach(h => console.log(`  - ${h.title}`));
      }
    });

    const totalVisible = Object.values(groups).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n📊 Total habits visible in Today's Pitch: ${totalVisible}`);

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
