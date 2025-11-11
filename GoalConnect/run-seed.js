// Quick script to run the seed SQL file
import { readFileSync } from 'fs';
import pkg from 'pg';
const { Client } = pkg;

async function runSeed() {
  // Use the Supabase DATABASE_URL from .env
  const DATABASE_URL = "postgres://postgres.ssvuyqtxwsidsfcdcpmo:R5zEX8ESLlTKJaF0@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('[seed] Connected to database');

    const sql = readFileSync('seed-all-data.sql', 'utf-8');

    console.log('[seed] Running seed script...');
    await client.query(sql);

    console.log('[seed] ✅ Seed completed successfully!');
  } catch (error) {
    console.error('[seed] ❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
