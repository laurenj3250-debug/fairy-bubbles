/**
 * Link book goals to media_library for auto-counting
 *
 * Run with: npx tsx scripts/link-book-goals.ts
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

  console.log("Linking book goals to media_library...\n");

  // Link "6 audiobooks" goal
  const result1 = await db.execute(sql`
    UPDATE yearly_goals
    SET linked_journey_key = 'audiobooks_completed'
    WHERE title LIKE '%audiobook%'
      AND user_id = 1
    RETURNING id, title, linked_journey_key
  `);
  console.log("Updated audiobooks goal:");
  console.log(result1.rows);

  // Link "2 physical books" goal
  const result2 = await db.execute(sql`
    UPDATE yearly_goals
    SET linked_journey_key = 'books_completed'
    WHERE title LIKE '%physical book%'
      AND user_id = 1
    RETURNING id, title, linked_journey_key
  `);
  console.log("\nUpdated physical books goal:");
  console.log(result2.rows);

  // Verify
  const verify = await db.execute(sql`
    SELECT id, title, linked_journey_key
    FROM yearly_goals
    WHERE (title LIKE '%book%' OR title LIKE '%audiobook%') AND user_id = 1
  `);
  console.log("\nVerification - all book-related goals:");
  console.log(verify.rows);

  // Check how many completed books exist
  const completedBooks = await db.execute(sql`
    SELECT media_type, COUNT(*) as count
    FROM media_items
    WHERE user_id = 1
      AND status = 'done'
      AND EXTRACT(YEAR FROM completed_at) = 2026
    GROUP BY media_type
  `);
  console.log("\nCompleted media items in 2026:");
  console.log(completedBooks.rows);

  await pool.end();
  console.log("\nDone!");
}

main().catch(console.error);
