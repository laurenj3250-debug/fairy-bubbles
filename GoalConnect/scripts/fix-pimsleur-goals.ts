/**
 * Fix Pimsleur goals to have 30 lessons per module
 * PRESERVES existing progress - completed lessons stay completed
 * Run with: npx tsx scripts/fix-pimsleur-goals.ts
 */

import { getDb } from "../server/db";
import { yearlyGoals } from "../shared/schema";
import { eq, like } from "drizzle-orm";
import { randomUUID } from "crypto";

interface SubItem {
  id: string;
  title: string;
  completed: boolean;
}

async function fixPimsleurGoals() {
  console.log("Fixing Pimsleur goals (preserving existing progress)...\n");
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
  console.log(`Current currentValue: ${pimsleurGoal.currentValue}`);

  // Parse existing subItems to preserve completion state
  const existingSubItems: SubItem[] = (pimsleurGoal.subItems as SubItem[]) || [];
  console.log(`Existing subItems: ${existingSubItems.length}`);

  // Create a map of existing items by their title for quick lookup
  const existingByTitle = new Map<string, SubItem>();
  for (const item of existingSubItems) {
    existingByTitle.set(item.title, item);
  }

  // Count existing completed items
  const existingCompleted = existingSubItems.filter(s => s.completed).length;
  console.log(`Existing completed lessons: ${existingCompleted}\n`);

  // Generate 30 lessons for Module 3 only
  // BUT preserve completion state from existing items with matching titles
  const newSubItems: SubItem[] = [];
  let preservedCount = 0;
  let newCount = 0;

  for (let lessonNum = 1; lessonNum <= 30; lessonNum++) {
    const title = `Module 3 - Lesson ${lessonNum}`;
    const existing = existingByTitle.get(title);

    if (existing) {
      // Preserve the existing item (keeps its ID and completion state)
      newSubItems.push(existing);
      if (existing.completed) preservedCount++;
    } else {
      // Create new item
      newSubItems.push({
        id: randomUUID(),
        title,
        completed: false,
      });
      newCount++;
    }
  }

  // Calculate correct currentValue based on completed items
  const completedCount = newSubItems.filter(s => s.completed).length;

  console.log(`Result:`);
  console.log(`  - Preserved ${preservedCount} completed lessons`);
  console.log(`  - Added ${newCount} new lessons`);
  console.log(`  - Total: ${newSubItems.length} lessons`);
  console.log(`  - New currentValue: ${completedCount}`);
  console.log(`  - New targetValue: 30\n`);

  // Update the goal
  const [updated] = await db
    .update(yearlyGoals)
    .set({
      targetValue: 30, // 30 lessons for Module 3 only
      currentValue: completedCount,
      subItems: newSubItems,
    })
    .where(eq(yearlyGoals.id, pimsleurGoal.id))
    .returning();

  console.log(`✓ Updated goal successfully!`);
  console.log(`  - targetValue: ${updated.targetValue}`);
  console.log(`  - currentValue: ${updated.currentValue}`);
  console.log(`  - subItems count: ${(updated.subItems as SubItem[]).length}`);
}

fixPimsleurGoals()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
