import { getDb } from "../server/db";
import { externalWorkouts, climbingSessions, dataSourceConnections } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

async function main() {
  const db = getDb();

  // Get all Strava activities with user info
  const activities = await db
    .select()
    .from(externalWorkouts)
    .where(eq(externalWorkouts.sourceType, "strava"))
    .orderBy(desc(externalWorkouts.startTime))
    .limit(10);

  console.log("Recent Strava activities:");
  activities.forEach(a => {
    const name = (a.metadata as any)?.name || "unnamed";
    console.log(`  User ${a.userId}: Type: ${a.workoutType}, Name: "${name}"`);
  });

  // Check RockClimbing specifically
  console.log("\n\nRockClimbing activities:");
  const climbing = await db
    .select()
    .from(externalWorkouts)
    .where(and(
      eq(externalWorkouts.sourceType, "strava"),
      eq(externalWorkouts.workoutType, "RockClimbing")
    ));
  console.log(`Found ${climbing.length} RockClimbing activities`);
  climbing.forEach(c => {
    console.log(`  User ${c.userId}: ${(c.metadata as any)?.name}`);
  });

  // Check Kilter connections
  console.log("\n\nKilter Board connections:");
  const kilterConnections = await db
    .select()
    .from(dataSourceConnections)
    .where(eq(dataSourceConnections.sourceType, "kilter_board"));
  console.log(`Found ${kilterConnections.length} Kilter connections`);
  kilterConnections.forEach(k => console.log(`  User ${k.userId}: active=${k.isActive}, lastSync=${k.lastSyncAt}`));

  // Check Kilter sessions
  console.log("\n\nKilter sessions:");
  const kilterSessions = await db
    .select()
    .from(climbingSessions)
    .where(eq(climbingSessions.sourceType, "kilter_board"))
    .orderBy(desc(climbingSessions.sessionDate))
    .limit(5);
  console.log(`Found ${kilterSessions.length} Kilter sessions`);
  kilterSessions.forEach(s => {
    console.log(`  User ${s.userId}: ${s.sessionDate} - max grade: ${s.maxGrade}, ${(s.climbs as any[])?.length || 0} climbs`);
  });

  process.exit(0);
}
main();
