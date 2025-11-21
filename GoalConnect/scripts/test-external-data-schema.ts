// Test script to verify external data schema is working
import { getDb } from "../server/db";
const db = getDb();
import {
  externalWorkouts,
  climbingSessions,
  dataSourceConnections,
  habitDataMappings
} from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function testSchema() {
  console.log("\n[test] Testing external data schema...\n");

  // Use unique IDs for this test run
  const uniqueId = `test-${Date.now()}`;

  try {
    // Test 1: Insert a test external workout
    console.log("1. Testing externalWorkouts table...");
    const testWorkout = await db.insert(externalWorkouts).values({
      userId: 1,
      sourceType: 'apple_watch',
      externalId: `${uniqueId}-workout`,
      workoutType: 'HKWorkoutActivityTypeClimbing',
      startTime: new Date('2025-11-21T09:00:00Z'),
      endTime: new Date('2025-11-21T09:45:00Z'),
      durationMinutes: 45,
      heartRateAvg: 145,
      heartRateMax: 175,
      heartRateMin: 120,
      caloriesBurned: 350,
      metadata: { isIndoor: true }
    }).returning();
    console.log("✓ Successfully inserted external workout:", testWorkout[0].id);

    // Test 2: Insert a test climbing session
    console.log("\n2. Testing climbingSessions table...");
    const testSession = await db.insert(climbingSessions).values({
      userId: 1,
      sourceType: 'kilter_board',
      externalId: `${uniqueId}-session`,
      sessionDate: '2025-11-21',
      sessionStartTime: new Date('2025-11-21T14:00:00Z'),
      durationMinutes: 90,
      problemsAttempted: 12,
      problemsSent: 8,
      averageGrade: 'V4',
      maxGrade: 'V6',
      boardAngle: 40,
      climbs: [
        { climbId: 'climb1', grade: 'V4', sent: true, attempts: 2 },
        { climbId: 'climb2', grade: 'V6', sent: true, attempts: 5 }
      ]
    }).returning();
    console.log("✓ Successfully inserted climbing session:", testSession[0].id);

    // Test 3: Insert a test data source connection (use strava to avoid collision)
    console.log("\n3. Testing dataSourceConnections table...");
    const testConnection = await db.insert(dataSourceConnections).values({
      userId: 1,
      sourceType: `strava-${Date.now()}`, // Unique source type for test
      isActive: true,
      syncStatus: 'idle',
      syncFrequency: 'daily',
      autoCompleteHabits: true,
      credentials: { username: 'test_user', token: 'encrypted_token_here' }
    }).returning();
    console.log("✓ Successfully inserted data source connection:", testConnection[0].id);

    // Test 4: Query habitDataMappings table structure (skip insert to avoid FK issues with no habits)
    console.log("\n4. Testing habitDataMappings table structure...");
    const mappingColumns = await db.execute(sql`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'habit_data_mappings' ORDER BY ordinal_position
    `);
    console.log("✓ habitDataMappings table has", mappingColumns.rows.length, "columns");
    console.log("  Columns:", mappingColumns.rows.map((r: any) => r.column_name).join(", "));

    // Test 5: Query the data back
    console.log("\n5. Querying data back...");
    const workouts = await db.select().from(externalWorkouts).where(eq(externalWorkouts.userId, 1));
    const sessions = await db.select().from(climbingSessions).where(eq(climbingSessions.userId, 1));
    const connections = await db.select().from(dataSourceConnections).where(eq(dataSourceConnections.userId, 1));

    console.log(`✓ Found ${workouts.length} workout(s)`);
    console.log(`✓ Found ${sessions.length} session(s)`);
    console.log(`✓ Found ${connections.length} connection(s)`);

    // Test 6: Clean up test data
    console.log("\n6. Cleaning up test data...");
    await db.delete(externalWorkouts).where(eq(externalWorkouts.externalId, `${uniqueId}-workout`));
    await db.delete(climbingSessions).where(eq(climbingSessions.externalId, `${uniqueId}-session`));
    await db.delete(dataSourceConnections).where(eq(dataSourceConnections.id, testConnection[0].id));
    console.log("✓ Test data cleaned up");

    console.log("\n[test] ✅ All schema tests passed!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n[test] ❌ Schema test failed:");
    console.error(error);
    process.exit(1);
  }
}

testSchema();
