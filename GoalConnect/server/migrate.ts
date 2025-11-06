import { getDb } from './db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

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
    const dropStatements = [
      'DROP TABLE IF EXISTS user_costumes CASCADE',
      'DROP TABLE IF EXISTS costumes CASCADE',
      'DROP TABLE IF EXISTS user_points CASCADE',
      'DROP TABLE IF EXISTS user_settings CASCADE',
      'DROP TABLE IF EXISTS virtual_pets CASCADE',
      'DROP TABLE IF EXISTS todos CASCADE',
      'DROP TABLE IF EXISTS goals CASCADE',
      'DROP TABLE IF EXISTS habit_logs CASCADE',
      'DROP TABLE IF EXISTS habits CASCADE',
      'DROP TABLE IF EXISTS session CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
    ];

    for (const statement of dropStatements) {
      await db.execute(sql.raw(statement));
    }
    console.log('[migrate] ✅ Old tables dropped');

    // STEP 2: Create fresh tables from schema file
    console.log('[migrate] Creating fresh tables...');
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
      await db.execute(sql.raw(statement));
    }

    console.log('[migrate] ✅ Fresh database schema created successfully');
    console.log('[migrate] ✅ Ready for new user signups');
    return { success: true };
  } catch (error) {
    console.error('[migrate] ❌ Migration failed:', error);
    throw error;
  }
}
