import { getDb } from './db';
import { sql } from 'drizzle-orm';

/**
 * Run database migrations on startup for Railway PostgreSQL
 * Creates tables if they don't exist (preserves existing data)
 */
export async function runMigrations() {
  console.log('[migrate] Starting Railway database migration...');

  try {
    const db = getDb();

    // Add retry logic for Railway's slow startup
    let retries = 10;
    let checkResult;

    while (retries > 0) {
      try {
        // Check if tables already exist
        checkResult = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'users'
          ) as users_exists
        `);
        console.log('[migrate] ✅ Database connection successful');
        break; // Success, exit retry loop
      } catch (error: any) {
        retries--;
        console.error(`[migrate] ⚠️  Database connection failed:`, error?.message || error);
        if (retries === 0) {
          console.error('[migrate] ❌ Failed to connect to database after all retries');
          throw error;
        }
        console.log(`[migrate] Database not ready, retrying in 3 seconds... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      }
    }

    const tablesExist = checkResult?.rows[0]?.users_exists;

    if (tablesExist) {
      console.log('[migrate] ✅ Tables already exist, checking critical tables...');

      // Always ensure session table exists (critical for authentication)
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS session (
            sid VARCHAR NOT NULL PRIMARY KEY,
            sess JSON NOT NULL,
            expire TIMESTAMP(6) NOT NULL
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire)`);
        console.log('[migrate] ✅ Session table verified/created');
      } catch (error) {
        console.error('[migrate] ⚠️  Failed to ensure session table:', error);
      }

      // Run incremental migrations
      try {
        // Add difficulty column to habits if it doesn't exist
        await db.execute(sql`
          ALTER TABLE habits
          ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) NOT NULL DEFAULT 'medium'
        `);
        console.log('[migrate] ✅ Difficulty column added/verified in habits table');
      } catch (error) {
        console.error('[migrate] ⚠️  Failed to add difficulty column to habits:', error);
      }

      try {
        // Add difficulty column to goals if it doesn't exist
        await db.execute(sql`
          ALTER TABLE goals
          ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) NOT NULL DEFAULT 'medium'
        `);
        console.log('[migrate] ✅ Difficulty column added/verified in goals table');
      } catch (error) {
        console.error('[migrate] ⚠️  Failed to add difficulty column to goals:', error);
      }

      try {
        // Add difficulty column to todos if it doesn't exist
        await db.execute(sql`
          ALTER TABLE todos
          ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) NOT NULL DEFAULT 'medium'
        `);
        console.log('[migrate] ✅ Difficulty column added/verified in todos table');

        // Remove old points column from todos if it exists
        await db.execute(sql`ALTER TABLE todos DROP COLUMN IF EXISTS points`);
        console.log('[migrate] ✅ Old points column removed from todos table');

        // Add subtasks column if it doesn't exist
        await db.execute(sql`
          ALTER TABLE todos
          ADD COLUMN IF NOT EXISTS subtasks TEXT NOT NULL DEFAULT '[]'
        `);
        console.log('[migrate] ✅ Subtasks column added/verified in todos table');

        // Remove old description column from todos if it exists
        await db.execute(sql`ALTER TABLE todos DROP COLUMN IF EXISTS description`);
        console.log('[migrate] ✅ Old description column removed from todos table');
      } catch (error) {
        console.error('[migrate] ⚠️  Failed to migrate todos table:', error);
      }

      try {
        // Add priority column to goals if it doesn't exist
        await db.execute(sql`
          ALTER TABLE goals
          ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium'
        `);
        console.log('[migrate] ✅ Priority column added/verified in goals table');
      } catch (error) {
        console.error('[migrate] ⚠️  Failed to add priority column to goals:', error);
      }

      try {
        // Add evolutionRequired column to costumes if it doesn't exist
        await db.execute(sql`
          ALTER TABLE costumes
          ADD COLUMN IF NOT EXISTS evolution_required VARCHAR(20) NOT NULL DEFAULT 'seed'
        `);
        console.log('[migrate] ✅ Evolution required column added/verified in costumes table');
      } catch (error) {
        console.error('[migrate] ⚠️  Failed to add evolution_required column to costumes:', error);
      }

      console.log('[migrate] ℹ️  User data preserved');
      return { success: true, skipped: true };
    }

    console.log('[migrate] Creating fresh tables...');

    // Users table
    await db.execute(sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Session table
    await db.execute(sql`
      CREATE TABLE session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);
    await db.execute(sql`CREATE INDEX IDX_session_expire ON session (expire)`);

    // Habits table
    await db.execute(sql`
      CREATE TABLE habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        icon TEXT NOT NULL,
        color VARCHAR(7) NOT NULL,
        cadence VARCHAR(10) NOT NULL CHECK (cadence IN ('daily', 'weekly')),
        target_per_week INTEGER,
        difficulty VARCHAR(10) NOT NULL DEFAULT 'medium',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Habit logs table
    await db.execute(sql`
      CREATE TABLE habit_logs (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date VARCHAR(10) NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT false,
        note TEXT,
        mood INTEGER,
        energy_level INTEGER
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX habit_logs_habit_id_user_id_date_key ON habit_logs(habit_id, user_id, date)`);

    // Goals table
    await db.execute(sql`
      CREATE TABLE goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        target_value INTEGER NOT NULL,
        current_value INTEGER NOT NULL DEFAULT 0,
        unit TEXT NOT NULL,
        deadline VARCHAR(10) NOT NULL,
        category TEXT NOT NULL,
        difficulty VARCHAR(10) NOT NULL DEFAULT 'medium',
        priority VARCHAR(10) NOT NULL DEFAULT 'medium'
      )
    `);

    // Goal updates table
    await db.execute(sql`
      CREATE TABLE goal_updates (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date VARCHAR(10) NOT NULL,
        value INTEGER NOT NULL,
        note TEXT
      )
    `);

    // Todos table
    await db.execute(sql`
      CREATE TABLE todos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        due_date VARCHAR(10),
        completed BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMP,
        difficulty VARCHAR(10) NOT NULL DEFAULT 'medium',
        subtasks TEXT NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Virtual pets table
    await db.execute(sql`
      CREATE TABLE virtual_pets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        name TEXT NOT NULL DEFAULT 'Forest Friend',
        species VARCHAR(50) NOT NULL DEFAULT 'Gremlin',
        happiness INTEGER NOT NULL DEFAULT 50 CHECK (happiness >= 0 AND happiness <= 100),
        health INTEGER NOT NULL DEFAULT 100 CHECK (health >= 0 AND health <= 100),
        level INTEGER NOT NULL DEFAULT 1,
        experience INTEGER NOT NULL DEFAULT 0,
        evolution VARCHAR(20) NOT NULL DEFAULT 'seed' CHECK (evolution IN ('seed', 'sprout', 'sapling', 'tree', 'ancient')),
        current_costume_id INTEGER,
        last_fed TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // User settings table
    await db.execute(sql`
      CREATE TABLE user_settings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        dark_mode BOOLEAN NOT NULL DEFAULT true,
        notifications BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // User points table
    await db.execute(sql`
      CREATE TABLE user_points (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        total_earned INTEGER NOT NULL DEFAULT 0,
        total_spent INTEGER NOT NULL DEFAULT 0,
        available INTEGER NOT NULL DEFAULT 0
      )
    `);

    // Point transactions table
    await db.execute(sql`
      CREATE TABLE point_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        type VARCHAR(30) NOT NULL CHECK (type IN ('habit_complete', 'goal_progress', 'costume_purchase', 'daily_login', 'todo_complete')),
        related_id INTEGER,
        description TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Costumes table (must be created before virtual_pets foreign key)
    await db.execute(sql`
      CREATE TABLE costumes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        category VARCHAR(20) NOT NULL CHECK (category IN ('hat', 'outfit', 'accessory', 'background')),
        price INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
        evolution_required VARCHAR(20) NOT NULL DEFAULT 'seed' CHECK (evolution_required IN ('seed', 'sprout', 'sapling', 'tree', 'ancient'))
      )
    `);

    // User costumes table
    await db.execute(sql`
      CREATE TABLE user_costumes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        costume_id INTEGER NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
        purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_equipped BOOLEAN NOT NULL DEFAULT false,
        UNIQUE(user_id, costume_id)
      )
    `);

    // Now add the foreign key constraint for virtual_pets.current_costume_id
    await db.execute(sql`
      ALTER TABLE virtual_pets
      ADD CONSTRAINT fk_virtual_pets_costume
      FOREIGN KEY (current_costume_id) REFERENCES costumes(id)
    `);

    // Create indexes
    await db.execute(sql`CREATE INDEX idx_habits_user_id ON habits(user_id)`);
    await db.execute(sql`CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id)`);
    await db.execute(sql`CREATE INDEX idx_habit_logs_user_id ON habit_logs(user_id)`);
    await db.execute(sql`CREATE INDEX idx_goals_user_id ON goals(user_id)`);
    await db.execute(sql`CREATE INDEX idx_goal_updates_goal_id ON goal_updates(goal_id)`);
    await db.execute(sql`CREATE INDEX idx_todos_user_id ON todos(user_id)`);
    await db.execute(sql`CREATE INDEX idx_user_costumes_user_id ON user_costumes(user_id)`);
    await db.execute(sql`CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id)`);

    console.log('[migrate] ✅ Fresh database schema created successfully');
    console.log('[migrate] ✅ Ready for new user signups');
    return { success: true, skipped: false };
  } catch (error) {
    console.error('[migrate] ❌ Migration failed:', error);
    throw error;
  }
}
