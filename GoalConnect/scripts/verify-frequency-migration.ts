// Quick verification script for frequency migration
import '../server/load-env';
import { getPool } from '../server/db';

async function verifyMigration() {
  const pool = getPool();

  try {
    console.log('Verifying frequency migration...\n');

    // Check all habits
    const result = await pool.query(`
      SELECT
        id,
        title,
        cadence,
        target_per_week,
        frequency_numerator,
        frequency_denominator,
        frequency_type,
        current_score,
        CASE
          WHEN score_history IS NULL THEN 'NULL'
          WHEN jsonb_array_length(score_history) = 0 THEN 'empty array'
          ELSE 'has data'
        END as score_history_status
      FROM habits
      ORDER BY id
    `);

    console.log(`Found ${result.rows.length} habits:\n`);
    console.table(result.rows);

    // Check for any inconsistencies
    const issues = result.rows.filter(habit =>
      !habit.frequency_numerator ||
      !habit.frequency_denominator ||
      !habit.frequency_type ||
      habit.current_score === null
    );

    if (issues.length > 0) {
      console.log('\n⚠ Issues found:');
      console.table(issues);
    } else {
      console.log('\n✅ All habits have valid frequency and scoring fields!');
    }

    // Verify data consistency
    console.log('\nData consistency checks:');

    // Daily habits should be 1/1
    const dailyCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM habits
      WHERE cadence = 'daily'
      AND (frequency_numerator != 1 OR frequency_denominator != 1 OR frequency_type != 'daily')
    `);
    console.log(`  Daily habits with incorrect frequency: ${dailyCheck.rows[0].count}`);

    // Weekly habits should match targetPerWeek/7
    const weeklyCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM habits
      WHERE cadence = 'weekly'
      AND (
        frequency_numerator != COALESCE(target_per_week, 1)
        OR frequency_denominator != 7
        OR frequency_type != 'weekly'
      )
    `);
    console.log(`  Weekly habits with incorrect frequency: ${weeklyCheck.rows[0].count}`);

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

verifyMigration();
