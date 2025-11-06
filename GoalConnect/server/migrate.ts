import { getDb } from './db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Run database migrations on startup for Railway PostgreSQL
 * Creates all tables from the schema file
 */
export async function runMigrations() {
  console.log('[migrate] Starting Railway database migration...');

  try {
    const db = getDb();

    // Read the initial schema file
    const migrationPath = path.join(process.cwd(), 'migrations', '0000_initial_schema.sql');

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolon and filter out empty statements and comments
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    console.log(`[migrate] Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (const statement of statements) {
      try {
        await db.execute(sql.raw(statement));
      } catch (error: any) {
        // Ignore "already exists" errors - table/index might already be there
        if (!error.message?.includes('already exists') &&
            !error.message?.includes('duplicate key')) {
          console.error('[migrate] Failed statement:', statement.substring(0, 100));
          throw error;
        }
      }
    }

    console.log('[migrate] ✅ Database schema created successfully');
    return { success: true };
  } catch (error) {
    console.error('[migrate] ❌ Migration failed:', error);
    throw error;
  }
}
