/**
 * Delete old climbing sessions and re-sync with correct grades
 */
import { getDb } from "../server/db";
import { climbingSessions, users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { createKilterBoardClient } from "../server/importers/kilter-board-client";
import { groupIntoSessions, toClimbingSessionInsert } from "../server/importers/kilter-board-parser";

const KILTER_USERNAME = "laurenj3250";
const KILTER_PASSWORD = "Crumpet11!!";

async function resync() {
  const db = getDb();

  console.log("=== Step 1: Delete old sessions with wrong grades ===");
  const deleted = await db.delete(climbingSessions).returning();
  console.log(`Deleted ${deleted.length} old sessions`);

  console.log("\n=== Step 2: Login to Kilter ===");
  const client = createKilterBoardClient();
  const loginResult = await client.login(KILTER_USERNAME, KILTER_PASSWORD);
  console.log(`Logged in as Kilter user ID: ${loginResult.userId}`);

  console.log("\n=== Step 3: Fetch fresh data ===");
  const data = await client.getUserClimbingData(loginResult.token, loginResult.userId);
  console.log(`Fetched ${data.ascents.length} ascents, ${data.climbs.length} climbs`);

  console.log("\n=== Step 4: Parse into sessions with CORRECT grades ===");
  const sessions = groupIntoSessions(data.ascents, data.attempts, data.climbs, loginResult.userId);
  console.log(`Parsed ${sessions.length} sessions`);

  // Show what grades we'll save
  const allGrades = sessions.flatMap(s => s.climbs.map(c => c.grade));
  const uniqueGrades = [...new Set(allGrades)].sort();
  console.log(`Grades in parsed sessions: ${uniqueGrades.join(", ")}`);
  const maxGrade = sessions.reduce((max, s) => {
    if (!s.maxGrade) return max;
    const gradeOrder = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10"];
    return gradeOrder.indexOf(s.maxGrade) > gradeOrder.indexOf(max) ? s.maxGrade : max;
  }, "V0");
  console.log(`Max grade across all sessions: ${maxGrade}`);

  console.log("\n=== Step 5: Find database user ===");
  const [user] = await db.select().from(users).where(eq(users.email, "laurenj3250@gmail.com")).limit(1);
  if (!user) {
    console.error("ERROR: User not found in database");
    return;
  }
  console.log(`Found database user ID: ${user.id} (${user.name})`);

  console.log("\n=== Step 6: Save sessions with correct grades ===");
  for (const session of sessions) {
    const insert = toClimbingSessionInsert(session, user.id);
    await db.insert(climbingSessions).values({
      userId: insert.userId,
      sourceType: insert.sourceType,
      externalId: insert.externalId,
      sessionDate: insert.sessionDate,
      sessionStartTime: insert.sessionStartTime,
      durationMinutes: insert.durationMinutes,
      problemsAttempted: insert.problemsAttempted,
      problemsSent: insert.problemsSent,
      averageGrade: insert.averageGrade,
      maxGrade: insert.maxGrade,
      boardAngle: insert.boardAngle,
      climbs: insert.climbs,
    }).onConflictDoNothing();
  }
  console.log(`Saved ${sessions.length} sessions with correct grades`);

  console.log("\n=== DONE ===");
  console.log(`Your new max grade: ${maxGrade}`);
  console.log("Please refresh the app to see corrected data.");
}

resync().catch(console.error);
