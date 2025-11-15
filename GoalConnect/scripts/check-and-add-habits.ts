import "../server/load-env";
import { getDb } from "../server/db";
import { habits, habitLogs } from "../shared/schema";
import { eq } from "drizzle-orm";

const db = getDb();
const userId = 1; // laurenj3250@gmail.com

async function main() {
  try {
    console.log("Checking existing habits for user ID:", userId);

    // Get existing habits
    const existingHabits = await db.select().from(habits).where(eq(habits.userId, userId));

    console.log(`\nFound ${existingHabits.length} existing habits:`);
    existingHabits.forEach(habit => {
      console.log(`- ${habit.title} (${habit.category}, ${habit.cadence}, ${habit.scheduledDay ? `scheduled: ${habit.scheduledDay}` : 'unscheduled'})`);
    });

    if (existingHabits.length === 0) {
      console.log("\nNo habits found. Adding test habits...");

      const today = new Date().toISOString().split('T')[0];

      // Create 3 test habits with different categories
      const newHabits = [
        {
          userId,
          title: 'Morning Stretch',
          description: 'Light morning movement to start the day',
          icon: '🧘',
          color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          cadence: 'daily' as const,
          category: 'mind' as const,
          effort: 'light' as const,
          grade: '5.6',
          difficulty: 'easy' as const,
        },
        {
          userId,
          title: 'Push-ups',
          description: 'Build upper body strength',
          icon: '💪',
          color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          cadence: 'daily' as const,
          category: 'foundation' as const,
          effort: 'medium' as const,
          grade: '5.9',
          difficulty: 'medium' as const,
        },
        {
          userId,
          title: 'Outdoor Adventure',
          description: 'Weekly outdoor activity - hike, climb, or explore',
          icon: '🏔️',
          color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          cadence: 'weekly' as const,
          category: 'adventure' as const,
          effort: 'heavy' as const,
          grade: '5.11',
          difficulty: 'hard' as const,
          scheduledDay: today, // Schedule adventure for today so it shows up
        },
      ];

      for (const habitData of newHabits) {
        const [newHabit] = await db.insert(habits).values(habitData as any).returning();
        console.log(`✓ Created habit: ${newHabit.title} (${newHabit.category})`);
      }

      console.log("\n✅ Successfully added 3 test habits!");
      console.log("These habits should now appear in Today's Pitch with glowing climbing holds.");
    } else {
      console.log("\nHabits already exist. No new habits added.");

      // Check if any adventure habits need to be scheduled for today
      const adventureHabits = existingHabits.filter(h => h.category === 'adventure');
      const unscheduledAdventure = adventureHabits.filter(h => !h.scheduledDay);

      if (unscheduledAdventure.length > 0) {
        console.log(`\n⚠️  Found ${unscheduledAdventure.length} unscheduled adventure habit(s):`);
        unscheduledAdventure.forEach(h => console.log(`   - ${h.title}`));
        console.log("   Adventure habits need to be scheduled to show up in Today's Pitch.");
      }

      const scheduledAdventure = adventureHabits.filter(h => h.scheduledDay);
      const today = new Date().toISOString().split('T')[0];
      const todaysAdventure = scheduledAdventure.filter(h => h.scheduledDay === today);

      if (todaysAdventure.length > 0) {
        console.log(`\n✓ Found ${todaysAdventure.length} adventure habit(s) scheduled for today:`);
        todaysAdventure.forEach(h => console.log(`   - ${h.title}`));
      }

      // Count habits that should appear today
      const todaysHabits = existingHabits.filter(h =>
        h.category !== 'adventure' || h.scheduledDay === today
      );

      console.log(`\n📊 Expected habits in Today's Pitch: ${todaysHabits.length}`);
      console.log("Categories breakdown:");
      const categoryCounts: Record<string, number> = {};
      todaysHabits.forEach(h => {
        const cat = h.category || 'training';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      Object.entries(categoryCounts).forEach(([cat, count]) => {
        console.log(`   - ${cat}: ${count}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
