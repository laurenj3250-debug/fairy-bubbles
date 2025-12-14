import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function addYearlyGoalsTables() {
  console.log("Creating yearly goals tables...");
  const db = getDb();

  try {
    // Create enum type (if not exists)
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'yearly_goal_type') THEN
          CREATE TYPE yearly_goal_type AS ENUM ('binary', 'count', 'compound');
        END IF;
      END
      $$;
    `);
    console.log("Created yearly_goal_type enum");

    // Create yearly_goals table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS yearly_goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        year VARCHAR(4) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category VARCHAR(30) NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        goal_type yearly_goal_type NOT NULL DEFAULT 'binary',
        target_value INTEGER NOT NULL DEFAULT 1,
        current_value INTEGER NOT NULL DEFAULT 0,
        linked_habit_id INTEGER REFERENCES habits(id) ON DELETE SET NULL,
        linked_journey_key VARCHAR(50),
        linked_dream_scroll_category VARCHAR(20),
        sub_items JSONB NOT NULL DEFAULT '[]',
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at TIMESTAMP,
        xp_reward INTEGER NOT NULL DEFAULT 100,
        reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Created yearly_goals table");

    // Create unique index
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS yearly_goals_user_year_title_key
      ON yearly_goals(user_id, year, title);
    `);
    console.log("Created unique index on yearly_goals");

    // Create index on user_id and year
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS yearly_goals_user_year_idx
      ON yearly_goals(user_id, year);
    `);
    console.log("Created index on user_id and year");

    // Create yearly_goal_progress_logs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS yearly_goal_progress_logs (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER NOT NULL REFERENCES yearly_goals(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        change_type VARCHAR(20) NOT NULL,
        previous_value INTEGER,
        new_value INTEGER,
        sub_item_id VARCHAR(50),
        source VARCHAR(30) NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Created yearly_goal_progress_logs table");

    // Create index on goal_id
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS yearly_goal_progress_logs_goal_idx
      ON yearly_goal_progress_logs(goal_id);
    `);
    console.log("Created index on yearly_goal_progress_logs.goal_id");

    console.log("\nAll yearly goals tables created successfully!");

  } catch (error) {
    console.error("Error creating tables:", error);
    process.exit(1);
  }

  process.exit(0);
}

addYearlyGoalsTables();
