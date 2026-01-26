/**
 * Fix outdoor goal linkedJourneyKey configurations
 *
 * Run with: npx tsx scripts/fix-outdoor-goals.ts
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

const { Pool } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  const db = drizzle(pool);

  console.log("Fixing outdoor goal configurations...\n");

  // 1. Fix "12 outdoor climbing days" - should use outdoor_climbing_days (climbing only)
  const result1 = await db.execute(sql`
    UPDATE yearly_goals
    SET linked_journey_key = 'outdoor_climbing_days'
    WHERE title LIKE '%12 outdoor climbing days%'
      AND user_id = 1
    RETURNING id, title, linked_journey_key
  `);
  console.log("Updated '12 outdoor climbing days':");
  console.log(result1.rows);

  // 2. Fix "52 outdoor days" - should use outdoor_days (climbing + adventures)
  const result2 = await db.execute(sql`
    UPDATE yearly_goals
    SET linked_journey_key = 'outdoor_days'
    WHERE title LIKE '%52 outdoor days%'
      AND user_id = 1
    RETURNING id, title, linked_journey_key
  `);
  console.log("\nUpdated '52 outdoor days':");
  console.log(result2.rows);

  // Verify the changes
  const verify = await db.execute(sql`
    SELECT id, title, linked_journey_key
    FROM yearly_goals
    WHERE title LIKE '%outdoor%' AND user_id = 1
  `);
  console.log("\nVerification - all outdoor goals:");
  console.log(verify.rows);

  await pool.end();
  console.log("\nDone!");
}

main().catch(console.error);
