import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const MIGRATION_SQL = `
-- Migration: Add sprites table and dream scroll wishlist
CREATE TABLE IF NOT EXISTS sprites (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  category VARCHAR(20) NOT NULL CHECK (category IN ('creature', 'biome', 'item', 'ui', 'uncategorized')),
  name TEXT,
  data TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dream_scroll_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('do', 'buy', 'see', 'visit', 'learn', 'experience')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  cost VARCHAR(10) CHECK (cost IN ('free', '$', '$$', '$$$')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dream_scroll_user_id ON dream_scroll_items(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_scroll_category ON dream_scroll_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_dream_scroll_completed ON dream_scroll_items(user_id, completed);
`;

async function runMigrations() {
  const db = getDb();

  console.log("[migrations] Running database migrations...");

  try {
    // Execute the migration
    await db.execute(sql.raw(MIGRATION_SQL));

    console.log("[migrations] ✓ Successfully applied sprites and dream_scroll_items tables");
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
