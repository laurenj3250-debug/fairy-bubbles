import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";
import * as tls from "tls";

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
    const isLocalhost = /localhost|127\.0\.0\.1/.test(connectionString);
    const hasSSLDisabled = connectionString.toLowerCase().includes("sslmode=disable");

    // Railway and most cloud providers require SSL with self-signed certs
    const needsSSL = !isLocalhost && !hasSSLDisabled;

    // Close existing pool if it exists
    if (pool) {
      pool.end().catch(() => {});
    }

    // SSL configuration for Railway
    let sslConfig: any = false;
    if (needsSSL) {
      sslConfig = {
        rejectUnauthorized: false
      };
    }

    pool = new Pool({
      connectionString,
      ssl: sslConfig,
      // Serverless-optimized settings
      max: isServerless ? 1 : 10, // 1 connection for serverless, 10 for traditional
      idleTimeoutMillis: isServerless ? 0 : 30000, // Close immediately in serverless
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true, // Allow process to exit when connections are idle
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
