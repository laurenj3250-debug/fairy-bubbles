import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Only use ws in Node.js environment (not in Vercel serverless)
if (typeof WebSocket === 'undefined') {
  const ws = await import("ws");
  neonConfig.webSocketConstructor = ws.default;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
