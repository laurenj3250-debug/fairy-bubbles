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

    const tablesExist = tableCheck.rows[0]?.exists;

    if (!tablesExist) {
      console.log('[migrate] Tables do not exist. Running initial migration...');

      // Read and execute the initial migration
      const migrationPath = path.join(process.cwd(), 'migrations', '0000_initial_schema.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

      // Split by semicolon and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          await db.execute(sql.raw(statement));
        } catch (error: any) {
          // Ignore "already exists" errors
          if (!error.message?.includes('already exists')) {
            throw error;
          }
        }
      }

      console.log('[migrate] ✅ Initial migration complete');
    } else {
      console.log('[migrate] ✅ Database schema is up-to-date');
    }

    return { success: true };
  } catch (error) {
    console.error('[migrate] ❌ Migration failed:', error);
    throw error;
  }
}
