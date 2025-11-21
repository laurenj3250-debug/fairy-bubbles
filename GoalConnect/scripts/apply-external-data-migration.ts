// Script to apply the external data integration migration
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  const db = getDb();

  // Read the migration file
  const migrationPath = path.join(__dirname, "../migrations/0002_remarkable_rockslide.sql");
  const migrationContent = fs.readFileSync(migrationPath, "utf-8");

  // Split by statement breakpoint marker
  const statements = migrationContent
    .split("--> statement-breakpoint")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`[migration] Applying ${statements.length} statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      console.log(`[${i + 1}/${statements.length}] Executing statement...`);
      await db.execute(sql.raw(statement));
      console.log(`  ✓ Success`);
    } catch (error: any) {
      // Some statements might fail if objects already exist
      if (error.message?.includes("already exists") ||
          error.message?.includes("duplicate key") ||
          error.code === "42710") {
        console.log(`  ⚠ Skipped (already exists)`);
      } else {
        console.error(`  ✗ Failed:`, error.message);
        throw error;
      }
    }
  }

  console.log("\n[migration] ✅ Migration complete!");
  process.exit(0);
}

applyMigration().catch((error) => {
  console.error("\n[migration] ❌ Migration failed:", error);
  process.exit(1);
});
