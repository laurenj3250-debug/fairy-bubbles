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
      max: isServerless ? 1 : (isRailway ? 5 : 10), // Reduced max for Railway
      min: 0, // Don't maintain minimum connections - let pool scale naturally
      idleTimeoutMillis: 10000, // Release idle connections faster
      connectionTimeoutMillis: 15000, // Increased timeout for slow connections
      statement_timeout: 30000, // 30 seconds for queries
      query_timeout: 30000, // 30 seconds for queries
      allowExitOnIdle: true, // Allow process to exit when idle
      // Keep connections alive with more frequent checks
      keepAlive: true,
      keepAliveInitialDelayMillis: 3000,
    });

    // Handle pool errors gracefully
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
      // Don't immediately reset - let the pool try to recover
      // Only reset if we get repeated errors
    });

    // Handle client errors
    pool.on('connect', (client) => {
      client.on('error', (err) => {
        console.error('Database client error:', err);
      });
    });

    cachedDb = drizzle(pool, { schema });
  }

  return cachedDb;
}

// Export raw pool for executing raw SQL queries
export function getPool(): pkg.Pool {
  if (!pool) {
    // Initialize db first to ensure pool exists
    getDb();
  }
  return pool!;
}
