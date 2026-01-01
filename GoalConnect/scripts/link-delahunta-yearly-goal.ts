import { getDb } from "../server/db";
import { yearlyGoals, studyBooks } from "@shared/schema";
import { eq, and } from "drizzle-orm";

async function linkDeLahuntaGoal() {
  const db = getDb();
  const userId = 1;
  const year = "2026";

  // Find de Lahunta book
  const [book] = await db.select()
    .from(studyBooks)
    .where(and(
      eq(studyBooks.userId, userId),
      eq(studyBooks.title, "de Lahunta")
    ))
    .limit(1);

  if (!book) {
    console.error("de Lahunta book not found! Run seed-delahunta-book.ts first.");
    process.exit(1);
  }

  console.log(`Found de Lahunta book (ID: ${book.id})`);

  // Find yearly goal
  const [goal] = await db.select()
    .from(yearlyGoals)
    .where(and(
      eq(yearlyGoals.userId, userId),
      eq(yearlyGoals.year, year),
      eq(yearlyGoals.title, "Complete de Lahunta")
    ))
    .limit(1);

  if (!goal) {
    console.error("Yearly goal 'Complete de Lahunta' not found for 2026!");
    process.exit(1);
  }

  console.log(`Found yearly goal (ID: ${goal.id}): ${goal.title}`);

  // Update goal: link to book, update targetValue, clear old subItems
  await db.update(yearlyGoals)
    .set({
      linkedBookId: book.id,
      targetValue: 22,
      subItems: [], // Clear old 26-week subItems
      currentValue: 0, // Reset progress (will be computed from study_chapters)
    })
    .where(eq(yearlyGoals.id, goal.id));

  console.log(`\nLinked yearly goal (ID: ${goal.id}) to de Lahunta book (ID: ${book.id})`);
  console.log("Progress will now be computed from study_chapters.");
  console.log("Old 26-week subItems cleared, targetValue set to 22 chapters.");
  process.exit(0);
}

linkDeLahuntaGoal().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
