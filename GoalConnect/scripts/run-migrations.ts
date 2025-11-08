import { getDb } from "../server/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const db = getDb();

  console.log("[migrations] Running database migrations...");

  try {
    // Read the sprites and dream scroll migration file
    const migrationPath = path.join(__dirname, "../migrations/0007_add_sprites_and_dream_scroll.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Execute the migration
    await db.execute(sql.raw(migrationSQL));

    console.log("[migrations] ✓ Successfully applied migration 0007_add_sprites_and_dream_scroll.sql");
  } catch (error: any) {
    // If tables already exist, that's fine
    if (error.message?.includes("already exists")) {
      console.log("[migrations] Tables already exist, skipping");
    } else {
      console.error("[migrations] Error running migrations:", error);
      throw error;
    }
  }
}

runMigrations().catch(console.error);
