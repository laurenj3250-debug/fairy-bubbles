import '../server/load-env';
import { getPool } from '../server/db';

async function checkSchema() {
  const pool = getPool();

  const result = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'habits'
    ORDER BY ordinal_position;
  `);

  console.log('Habits table columns:');
  result.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  await pool.end();
}

checkSchema();
