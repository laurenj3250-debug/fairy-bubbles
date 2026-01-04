/**
 * Fix Pimsleur goals to have 30 lessons per module
 * Run with: npx tsx scripts/fix-pimsleur-goals.ts
 */

import { getDb } from "../server/db";
import { yearlyGoals } from "../shared/schema";
import { eq, like } from "drizzle-orm";
import { randomUUID } from "crypto";

async function fixPimsleurGoals() {
  console.log("Fixing Pimsleur goals...");
  const db = getDb();

  // Find the Pimsleur goal
  const [pimsleurGoal] = await db
    .select()
    .from(yearlyGoals)
    .where(like(yearlyGoals.title, "%Pimsleur%"))
    .limit(1);

  if (!pimsleurGoal) {
    console.log("No Pimsleur goal found");
    return;
  }

  console.log(`Found goal: ${pimsleurGoal.title} (id: ${pimsleurGoal.id})`);
  console.log(`Current targetValue: ${pimsleurGoal.targetValue}`);
  console.log(`Current subItems: ${JSON.stringify(pimsleurGoal.subItems)}`);

  // Generate 30 lessons for each of modules 3, 4, 5
  const modules = [3, 4, 5];
  const subItems = modules.flatMap((moduleNum) =>
    Array.from({ length: 30 }, (_, i) => ({
      id: randomUUID(),
      title: `Module ${moduleNum} - Lesson ${i + 1}`,
      completed: false,
    }))
  );

  // Update the goal
  const [updated] = await db
    .update(yearlyGoals)
    .set({
      targetValue: 90, // 30 lessons × 3 modules
      subItems: subItems,
    })
    .where(eq(yearlyGoals.id, pimsleurGoal.id))
    .returning();

  console.log(`Updated goal:`);
  console.log(`  - targetValue: ${updated.targetValue}`);
  console.log(`  - subItems count: ${(updated.subItems as any[]).length}`);
  console.log("Done!");
}

fixPimsleurGoals()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
