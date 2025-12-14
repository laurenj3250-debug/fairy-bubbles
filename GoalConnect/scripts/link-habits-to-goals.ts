/**
 * Script to link existing habits to matching goals
 * Run with: DATABASE_URL="..." npx tsx scripts/link-habits-to-goals.ts
 */

import { getDb } from '../server/db';
import { habits, goals } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function linkHabitsToGoals() {
  console.log('Fetching habits and goals...');
  const db = getDb();

  const allHabits = await db.select().from(habits);
  const allGoals = await db.select().from(goals);

  console.log(`Found ${allHabits.length} habits and ${allGoals.length} goals\n`);

  // Display current state
  console.log('=== Current Habits ===');
  for (const habit of allHabits) {
    console.log(`  [${habit.id}] "${habit.title}" -> linkedGoalId: ${habit.linkedGoalId ?? 'none'}`);
  }

  console.log('\n=== Current Goals ===');
  for (const goal of allGoals) {
    console.log(`  [${goal.id}] "${goal.title}" (${goal.currentValue}/${goal.targetValue})`);
  }

  // Find matching habits and goals by title (case-insensitive)
  console.log('\n=== Matching and Linking ===');
  let linkedCount = 0;

  for (const habit of allHabits) {
    // Skip if already linked
    if (habit.linkedGoalId) {
      console.log(`  [${habit.id}] "${habit.title}" - already linked to goal ${habit.linkedGoalId}`);
      continue;
    }

    // Find matching goal by title (case-insensitive, partial match)
    const habitTitleLower = habit.title.toLowerCase();
    const matchingGoal = allGoals.find(g => {
      const goalTitleLower = g.title.toLowerCase();
      // Match if titles are equal or one contains the other
      return goalTitleLower === habitTitleLower ||
             goalTitleLower.includes(habitTitleLower) ||
             habitTitleLower.includes(goalTitleLower);
    });

    if (matchingGoal) {
      console.log(`  [${habit.id}] "${habit.title}" -> Linking to goal [${matchingGoal.id}] "${matchingGoal.title}"`);

      // Update the habit with the linked goal ID
      await db.update(habits)
        .set({ linkedGoalId: matchingGoal.id })
        .where(eq(habits.id, habit.id));

      linkedCount++;
    } else {
      console.log(`  [${habit.id}] "${habit.title}" - no matching goal found`);
    }
  }

  console.log(`\n✅ Linked ${linkedCount} habits to goals`);
}

// Run the script
linkHabitsToGoals()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
