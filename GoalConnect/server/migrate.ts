import { getDb } from './db';
import { sql } from 'drizzle-orm';

/**
 * Run database migrations on startup for Railway PostgreSQL
 * DROPS all existing tables and recreates them fresh (clean slate)
 */
export async function runMigrations() {
  console.log('[migrate] Starting Railway database migration...');

  try {
    const db = getDb();

    // STEP 1: Drop all existing tables (clean slate - no more old Supabase data)
    console.log('[migrate] Dropping old tables...');
    await db.execute(sql`DROP TABLE IF EXISTS user_costumes CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS costumes CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS user_points CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS user_settings CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS virtual_pets CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS todos CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS goals CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS habit_logs CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS habits CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS session CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
    console.log('[migrate] ✅ Old tables dropped');

    // STEP 2: Create ALL tables directly
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
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Habit logs table
    await db.execute(sql`
      CREATE TABLE habit_logs (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        notes TEXT
      )
    `);

    // Goals table
    await db.execute(sql`
      CREATE TABLE goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        deadline TIMESTAMP,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
        progress INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Todos table
    await db.execute(sql`
      CREATE TABLE todos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        due_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Virtual pets table
    await db.execute(sql`
      CREATE TABLE virtual_pets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        name TEXT NOT NULL DEFAULT 'Gremlin',
        happiness INTEGER NOT NULL DEFAULT 50 CHECK (happiness >= 0 AND happiness <= 100),
        health INTEGER NOT NULL DEFAULT 50 CHECK (health >= 0 AND happiness <= 100),
        hunger INTEGER NOT NULL DEFAULT 50 CHECK (hunger >= 0 AND hunger <= 100),
        level INTEGER NOT NULL DEFAULT 1,
        experience INTEGER NOT NULL DEFAULT 0,
        last_fed TIMESTAMP,
        last_played TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // User settings table
    await db.execute(sql`
      CREATE TABLE user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
        notifications_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // User points table
    await db.execute(sql`
      CREATE TABLE user_points (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        total_points INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Costumes table
    await db.execute(sql`
      CREATE TABLE costumes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        cost INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // User costumes table
    await db.execute(sql`
      CREATE TABLE user_costumes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        costume_id INTEGER NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
        purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, costume_id)
      )
    `);

    // Create indexes
    await db.execute(sql`CREATE INDEX idx_habits_user_id ON habits(user_id)`);
    await db.execute(sql`CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id)`);
    await db.execute(sql`CREATE INDEX idx_habit_logs_user_id ON habit_logs(user_id)`);
    await db.execute(sql`CREATE INDEX idx_goals_user_id ON goals(user_id)`);
    await db.execute(sql`CREATE INDEX idx_todos_user_id ON todos(user_id)`);
    await db.execute(sql`CREATE INDEX idx_user_costumes_user_id ON user_costumes(user_id)`);

    console.log('[migrate] ✅ Fresh database schema created successfully');
    console.log('[migrate] ✅ Ready for new user signups');
    return { success: true };
  } catch (error) {
    console.error('[migrate] ❌ Migration failed:', error);
    throw error;
  }
}
