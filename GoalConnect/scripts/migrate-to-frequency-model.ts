// GoalConnect/scripts/migrate-to-frequency-model.ts

/**
 * Migration script to add habit frequency and scoring fields
 *
 * This script:
 * 1. Creates frequency_type enum
 * 2. Adds new columns for flexible frequency model
 * 3. Adds scoring fields for habit strength tracking
 * 4. Migrates existing habits from cadence to frequency model
 * 5. Initializes scoring fields with defaults
 *
 * Safe to run multiple times (uses IF NOT EXISTS checks)
 */

import '../server/load-env';
import { getDb, getPool } from '../server/db';
import { habits } from '../shared/schema';
import { sql } from 'drizzle-orm';
import { FrequencyType } from '../shared/lib/habitFrequency';

async function migrateToFrequencyModel() {
  console.log('Starting migration to frequency model...\n');

  const db = getDb();
  const pool = getPool();

  try {
    // Step 1: Create enum type if it doesn't exist
    console.log('Step 1: Creating frequency_type enum...');
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE frequency_type AS ENUM ('daily', 'weekly', 'custom');
      EXCEPTION
        WHEN duplicate_object THEN
          RAISE NOTICE 'frequency_type enum already exists, skipping...';
      END $$;
    `);
    console.log('✓ Enum type ready\n');

    // Step 2: Add new columns
    console.log('Step 2: Adding new columns...');

    // Add frequency fields
    await pool.query(`
      ALTER TABLE habits
      ADD COLUMN IF NOT EXISTS frequency_numerator INTEGER;
    `);
    console.log('  ✓ Added frequency_numerator');

    await pool.query(`
      ALTER TABLE habits
      ADD COLUMN IF NOT EXISTS frequency_denominator INTEGER;
    `);
    console.log('  ✓ Added frequency_denominator');

    await pool.query(`
      ALTER TABLE habits
      ADD COLUMN IF NOT EXISTS frequency_type frequency_type;
    `);
    console.log('  ✓ Added frequency_type');

    // Add scoring fields
    await pool.query(`
      ALTER TABLE habits
      ADD COLUMN IF NOT EXISTS current_score DECIMAL(10, 8) DEFAULT 0 NOT NULL;
    `);
    console.log('  ✓ Added current_score');

    await pool.query(`
      ALTER TABLE habits
      ADD COLUMN IF NOT EXISTS score_history JSONB DEFAULT '[]'::jsonb NOT NULL;
    `);
    console.log('  ✓ Added score_history\n');

    // Step 3: Migrate existing data
    console.log('Step 3: Migrating existing habits...');

    const allHabits = await db.select().from(habits);
    console.log(`  Found ${allHabits.length} habits to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const habit of allHabits) {
      // Skip if already migrated (has frequencyNumerator set)
      if (habit.frequencyNumerator !== null && habit.frequencyNumerator !== undefined) {
        skippedCount++;
        continue;
      }

      // Determine frequency values based on old cadence field
      let numerator = 1;
      let denominator = 1;
      let type = FrequencyType.DAILY;

      if (habit.cadence === 'weekly') {
        numerator = habit.targetPerWeek || 1;
        denominator = 7;
        type = FrequencyType.WEEKLY;
      } else if (habit.cadence === 'daily') {
        numerator = 1;
        denominator = 1;
        type = FrequencyType.DAILY;
      }

      // Update habit with new frequency model
      await pool.query(`
        UPDATE habits
        SET
          frequency_numerator = $1,
          frequency_denominator = $2,
          frequency_type = $3,
          current_score = 0,
          score_history = '[]'::jsonb
        WHERE id = $4
      `, [numerator, denominator, type, habit.id]);

      migratedCount++;
    }

    console.log(`  ✓ Migrated ${migratedCount} habits`);
    console.log(`  ⊙ Skipped ${skippedCount} already-migrated habits\n`);

    // Step 4: Verify migration
    console.log('Step 4: Verifying migration...');

    const verifyResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(frequency_numerator) as has_numerator,
        COUNT(frequency_denominator) as has_denominator,
        COUNT(frequency_type) as has_type,
        COUNT(CASE WHEN current_score IS NOT NULL THEN 1 END) as has_score,
        COUNT(CASE WHEN score_history IS NOT NULL THEN 1 END) as has_history
      FROM habits
    `);

    const stats = verifyResult.rows[0];
    console.log(`  Total habits: ${stats.total}`);
    console.log(`  With frequency_numerator: ${stats.has_numerator}`);
    console.log(`  With frequency_denominator: ${stats.has_denominator}`);
    console.log(`  With frequency_type: ${stats.has_type}`);
    console.log(`  With current_score: ${stats.has_score}`);
    console.log(`  With score_history: ${stats.has_history}\n`);

    if (stats.total === stats.has_numerator &&
        stats.total === stats.has_denominator &&
        stats.total === stats.has_type) {
      console.log('✓ Migration successful! All habits have frequency fields.\n');
    } else {
      console.log('⚠ Warning: Some habits are missing frequency fields.\n');
    }

    // Step 5: Show sample migrated habits
    console.log('Step 5: Sample migrated habits:');
    const sampleHabits = await pool.query(`
      SELECT
        id,
        title,
        cadence,
        target_per_week,
        frequency_numerator,
        frequency_denominator,
        frequency_type,
        current_score
      FROM habits
      LIMIT 5
    `);

    console.table(sampleHabits.rows);

    console.log('\n✅ Migration complete!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run migration
migrateToFrequencyModel()
  .then(() => {
    console.log('Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });

export { migrateToFrequencyModel };
