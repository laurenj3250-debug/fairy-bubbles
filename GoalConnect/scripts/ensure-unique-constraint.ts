#!/usr/bin/env tsx
/**
 * Ensure the UNIQUE constraint exists on habit_logs table
 * This script is safe to run multiple times - it only adds the constraint if missing
 */

import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function ensureUniqueConstraint() {
  console.log("🔍 Checking for UNIQUE constraint on habit_logs...");
  
  const db = getDb();
  
  try {
    // Check if the unique constraint already exists
    const constraintCheck = await db.execute(sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'habit_logs' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'habit_logs_habit_id_user_id_date_key';
    `);
    
    if (constraintCheck.rows.length > 0) {
      console.log("✅ UNIQUE constraint already exists - no action needed");
      return;
    }
    
    console.log("⚠️  UNIQUE constraint missing - adding it now...");
    
    // Add the unique constraint
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS habit_logs_habit_id_user_id_date_key 
      ON habit_logs(habit_id, user_id, date);
    `);
    
    console.log("✅ UNIQUE constraint added successfully!");
    console.log("   This ensures only one log per habit per user per date");
    
  } catch (error) {
    console.error("❌ Error ensuring unique constraint:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  ensureUniqueConstraint()
    .then(() => {
      console.log("\n✨ Database constraint verification complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Failed:", error);
      process.exit(1);
    });
}

export { ensureUniqueConstraint };
