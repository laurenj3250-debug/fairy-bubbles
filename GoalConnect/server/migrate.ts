import { getDb } from './db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Run database migrations on startup
 * This ensures the database schema is up-to-date
 */
export async function runMigrations() {
  console.log('[migrate] Checking database schema...');

  try {
    const db = getDb();

    // Check if users table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    const usersTableExists = tableCheck.rows[0]?.exists;

    if (!usersTableExists) {
      // Fresh database - run full initial migration
      console.log('[migrate] Fresh database detected. Running initial migration...');

      const migrationPath = path.join(process.cwd(), 'migrations', '0000_initial_schema.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          await db.execute(sql.raw(statement));
        } catch (error: any) {
          if (!error.message?.includes('already exists')) {
            throw error;
          }
        }
      }

      console.log('[migrate] ✅ Initial migration complete');
    } else {
      // Table exists - check if password column exists (for Supabase → Railway migration)
      console.log('[migrate] Users table exists. Checking for password column...');

      const passwordColumnCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'password'
        );
      `);

      const passwordColumnExists = passwordColumnCheck.rows[0]?.exists;

      if (!passwordColumnExists) {
        console.log('[migrate] Password column missing. Adding it now...');

        // Add password column
        await db.execute(sql`ALTER TABLE users ADD COLUMN password TEXT`);

        // Drop supabase_user_id if it exists
        await db.execute(sql`ALTER TABLE users DROP COLUMN IF EXISTS supabase_user_id`);

        console.log('[migrate] ✅ Password column added');
      } else {
        console.log('[migrate] ✅ Schema is up-to-date');
      }

      // Ensure session table exists
      console.log('[migrate] Checking session table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS session (
          sid VARCHAR NOT NULL PRIMARY KEY,
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        );
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
      `);
      console.log('[migrate] ✅ Session table ready');
    }

    return { success: true };
  } catch (error) {
    console.error('[migrate] ❌ Migration failed:', error);
    throw error;
  }
}
