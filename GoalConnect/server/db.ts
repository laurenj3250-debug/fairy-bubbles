import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: Database | null = null;

export function getDb(): Database {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  if (!cachedDb) {
    const needsSSL =
      !/localhost|127\.0\.0\.1/.test(connectionString) &&
      !connectionString.toLowerCase().includes("sslmode=disable");

    const pool = new Pool({
      connectionString,
      ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {}),
    });

    cachedDb = drizzle(pool, { schema });
  }

  return cachedDb;
}
