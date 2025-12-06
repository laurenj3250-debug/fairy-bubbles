import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  await pool.query('ALTER TABLE todos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()');
  console.log('✅ created_at column added to todos table');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await pool.end();
}
