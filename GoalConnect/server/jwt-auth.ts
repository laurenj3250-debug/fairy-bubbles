import type { Express, NextFunction, Request, Response } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users, NewUser } from "@shared/schema";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

let supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  console.log("[jwt-auth] Supabase admin client initialized");
} else {
  console.warn("[jwt-auth] Supabase not configured - missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  supabaseUserId: string;
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Extract JWT token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

/**
 * Verify Supabase JWT and get user info
 */
async function verifySupabaseToken(token: string): Promise<{ userId: string; email: string } | null> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not initialized");
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error("[jwt-auth] Token verification failed:", error?.message);
      return null;
    }

    return {
      userId: user.id,
      email: user.email || "",
    };
  } catch (error) {
    console.error("[jwt-auth] Error verifying token:", error);
    return null;
  }
}

/**
 * Find or create user in local database
 */
async function findOrCreateUser(supabaseUserId: string, email: string, name?: string): Promise<AuthenticatedUser> {
  const db = getDb();

  // Try to find existing user by Supabase ID
  let [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.supabaseUserId, supabaseUserId));

  if (existingUser) {
    return {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      supabaseUserId: existingUser.supabaseUserId || supabaseUserId,
    };
  }

  // Try to find by email (for migration scenarios)
  [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUser) {
    // Update with Supabase ID
    const [updated] = await db
      .update(users)
      .set({ supabaseUserId })
      .where(eq(users.id, existingUser.id))
      .returning();

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      supabaseUserId: updated.supabaseUserId || supabaseUserId,
    };
  }

  // Create new user
  const newUser: NewUser = {
    email,
    name: name || email.split("@")[0],
    supabaseUserId,
  };

  const [created] = await db.insert(users).values(newUser).returning();

  return {
    id: created.id,
    email: created.email,
    name: created.name,
    supabaseUserId: created.supabaseUserId || supabaseUserId,
  };
}

/**
 * Middleware to verify JWT and attach user to request
 */
export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: "No authentication token provided" });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Authentication service not configured" });
  }

  try {
    const userData = await verifySupabaseToken(token);

    if (!userData) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Find or create user in local database
    const user = await findOrCreateUser(userData.userId, userData.email);
    req.user = user;

    next();
  } catch (error) {
    console.error("[jwt-auth] Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Get the authenticated user from request (throws if not authenticated)
 */
export function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) {
    throw new Error("User not authenticated");
  }
  return req.user;
}

/**
 * User sync endpoint - creates/updates user in local DB
 */
export async function syncUser(req: Request, res: Response) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: "No authentication token provided" });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Authentication service not configured" });
  }

  try {
    const userData = await verifySupabaseToken(token);

    if (!userData) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { name } = req.body;
    const user = await findOrCreateUser(userData.userId, userData.email, name);

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("[jwt-auth] User sync error:", error);
    return res.status(500).json({ error: "Failed to sync user" });
  }
}

/**
 * Configure JWT-based authentication
 */
export function configureJWTAuth(app: Express) {
  console.log("[jwt-auth] Configuring JWT-based authentication");

  // User sync endpoint (public, but requires valid JWT)
  app.post("/api/auth/sync", syncUser);

  // Apply JWT authentication to all /api/* routes except public paths
  app.use((req, res, next) => {
    const publicPaths = ["/api/auth/sync", "/api/init-database", "/api/database-status"];
    const isPublicPath = publicPaths.some(path => req.path === path);

    // Skip auth for non-API routes and public paths
    if (!req.path.startsWith("/api") || isPublicPath) {
      return next();
    }

    return authenticateJWT(req, res, next);
  });
}
