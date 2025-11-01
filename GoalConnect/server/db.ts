import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

type NeonDatabase = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: NeonDatabase | null = null;

export function getDb(): NeonDatabase {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  if (!cachedDb) {
    const pool = new Pool({ connectionString });
    cachedDb = drizzle(pool, { schema });
  }

  return cachedDb;
}
