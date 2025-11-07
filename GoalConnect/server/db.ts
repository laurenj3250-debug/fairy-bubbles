import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: Database | null = null;
let pool: pkg.Pool | null = null;

// Detect if running in serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

export function getDb(): Database {
  // For serverless: use transaction pooler (port 6543)
  // For traditional servers: use direct connection (port 5432)
  const connectionString = isServerless
    ? process.env.DATABASE_URL  // Transaction pooler for serverless
    : (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL); // Direct for servers

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  if (!cachedDb || !pool) {
    // Close existing pool if it exists
    if (pool) {
      pool.end().catch(() => {});
    }

    // Determine if we need SSL
    // SSL is required for remote databases but not localhost
    const isLocalhost = /localhost|127\.0\.0\.1/.test(connectionString);
    const hasSSLDisabled = connectionString.toLowerCase().includes("sslmode=disable");
    const needsSSL = !isLocalhost && !hasSSLDisabled;

    // Railway-optimized connection settings
    const isRailway = connectionString.includes('railway.internal');

    pool = new Pool({
      connectionString,
      // SSL configuration
      ssl: needsSSL ? { rejectUnauthorized: false } : false,
      // Connection pool settings optimized for Railway
      max: isServerless ? 1 : (isRailway ? 10 : 10),
      min: isRailway ? 2 : 0, // Keep 2 connections alive for Railway
      idleTimeoutMillis: 30000, // Keep idle connections for 30 seconds
      connectionTimeoutMillis: 10000, // 10 seconds to establish new connection
      statement_timeout: 30000, // 30 seconds for queries
      query_timeout: 30000, // 30 seconds for queries
      allowExitOnIdle: false, // Don't exit while connections exist
      // Keep connections alive
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
    });

    // Handle pool errors gracefully
    pool.on('error', (err) => {
      console.error('Database pool error:', err.message);
      // Reset the cached db so it will be recreated on next request
      cachedDb = null;
      pool = null;
    });

    cachedDb = drizzle(pool, { schema });
  }

  return cachedDb;
}
