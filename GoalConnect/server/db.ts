import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: Database | null = null;
let pool: pkg.Pool | null = null;

export function getDb(): Database {
  // Use unpooled connection for persistent connections
  // Supabase's pooler (port 6543) terminates connections after transactions
  // Direct connection (port 5432) allows persistent connection pooling
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED environment variable is required");
  }

  if (!cachedDb || !pool) {
    const needsSSL =
      !/localhost|127\.0\.0\.1/.test(connectionString) &&
      !connectionString.toLowerCase().includes("sslmode=disable");

    // Close existing pool if it exists
    if (pool) {
      pool.end().catch(() => {});
    }

    pool = new Pool({
      connectionString,
      ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {}),
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
      maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
      // Reset the cached db so it will be recreated on next request
      cachedDb = null;
    });

    cachedDb = drizzle(pool, { schema });
  }

  return cachedDb;
}
