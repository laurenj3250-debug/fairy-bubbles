import '../server/load-env';
import { getPool } from '../server/db';

async function addCumulativeColumns() {
  const pool = getPool();

  try {
    console.log('Adding cumulative goals columns to habits table...\n');

    // Add columns one by one to handle existing columns gracefully
    const alterations = [
      {
        name: 'goal_type',
        sql: `ALTER TABLE habits ADD COLUMN IF NOT EXISTS goal_type VARCHAR(20) NOT NULL DEFAULT 'binary';`
      },
      {
        name: 'target_value',
        sql: `ALTER TABLE habits ADD COLUMN IF NOT EXISTS target_value INTEGER;`
      },
      {
        name: 'current_value',
        sql: `ALTER TABLE habits ADD COLUMN IF NOT EXISTS current_value INTEGER NOT NULL DEFAULT 0;`
      },
      {
        name: 'target_date',
        sql: `ALTER TABLE habits ADD COLUMN IF NOT EXISTS target_date VARCHAR(10);`
      },
      {
        name: 'created_date',
        sql: `ALTER TABLE habits ADD COLUMN IF NOT EXISTS created_date VARCHAR(10);`
      },
      {
        name: 'is_locked',
        sql: `ALTER TABLE habits ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;`
      },
      {
        name: 'primary_goal_achieved',
        sql: `ALTER TABLE habits ADD COLUMN IF NOT EXISTS primary_goal_achieved BOOLEAN NOT NULL DEFAULT false;`
      },
      {
        name: 'primary_goal_achieved_date',
        sql: `ALTER TABLE habits ADD COLUMN IF NOT EXISTS primary_goal_achieved_date VARCHAR(10);`
      },
    ];

    for (const alteration of alterations) {
      try {
        await pool.query(alteration.sql);
        console.log(`✅ Added ${alteration.name}`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  ${alteration.name} already exists`);
        } else {
          console.error(`❌ Error adding ${alteration.name}:`, error.message);
        }
      }
    }

    // Create habit_metrics table if it doesn't exist
    console.log('\nCreating habit_metrics table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS habit_metrics (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        metric_type VARCHAR(30) NOT NULL,
        label TEXT NOT NULL,
        unit TEXT NOT NULL,
        target_value INTEGER NOT NULL,
        current_value INTEGER NOT NULL DEFAULT 0,
        color TEXT NOT NULL DEFAULT '#3b82f6',
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ habit_metrics table created or already exists');

    // Update habit_logs table to support cumulative logging
    console.log('\nAdding cumulative logging fields to habit_logs...');
    const habitLogAlterations = [
      {
        name: 'duration_minutes',
        sql: `ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;`
      },
      {
        name: 'quantity_completed',
        sql: `ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS quantity_completed INTEGER;`
      },
      {
        name: 'session_type',
        sql: `ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS session_type TEXT;`
      },
      {
        name: 'increment_value',
        sql: `ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS increment_value INTEGER NOT NULL DEFAULT 1;`
      },
    ];

    for (const alteration of habitLogAlterations) {
      try {
        await pool.query(alteration.sql);
        console.log(`✅ Added ${alteration.name}`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  ${alteration.name} already exists`);
        } else {
          console.error(`❌ Error adding ${alteration.name}:`, error.message);
        }
      }
    }

    console.log('\n✅ All cumulative goals columns added successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addCumulativeColumns();
