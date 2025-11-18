import type { Express, NextFunction, Request, Response } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import createMemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "@shared/schema";
import { storage } from "./storage";

const PgSession = connectPgSimple(session);
const MemoryStore = createMemoryStore(session);

const SESSION_SECRET = process.env.SESSION_SECRET || "railway-goalconnect-secret-change-in-production";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
}

declare module "express-session" {
  interface SessionData {
    user?: AuthenticatedUser;
  }
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
 * Hash a password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a password with a hash
 */
async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Find user by email
 */
async function findUserByEmail(email: string) {
  try {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  } catch (error) {
    console.error('[auth] Database error in findUserByEmail:', error);
    throw new Error('Database unavailable');
  }
}

/**
 * Handle user registration
 */
async function handleRegister(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Validate email format
    if (!email.includes("@")) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const db = getDb();
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      })
      .returning();

    // Initialize RPG data for new user
    // TODO: Re-enable when creature system is fully implemented
    // try {
    //   // 1. Create player stats
    //   await storage.createPlayerStats(newUser.id);
    //   console.log('[auth] ✅ Player stats initialized');

    //   // 2. Give starter creature
    //   const allSpecies = await storage.getCreatureSpecies();
    //   if (allSpecies.length > 0) {
    //     const starterSpecies = allSpecies[0]; // First species in database

    //     // Calculate starter HP (level 1)
    //     const wisMod = Math.floor((starterSpecies.baseWis - 10) / 2);
    //     const maxHp = (1 * 5) + (1 * Math.max(0, wisMod));

    //     await storage.createUserCreature({
    //       userId: newUser.id,
    //       speciesId: starterSpecies.id,
    //       level: 1,
    //       experience: 0,
    //       hp: maxHp,
    //       currentHp: maxHp,
    //       str: starterSpecies.baseStr,
    //       dex: starterSpecies.baseDex,
    //       wis: starterSpecies.baseWis,
    //       isInParty: true,
    //       partyPosition: 1,
    //     });
    //     console.log('[auth] ✅ Starter creature given:', starterSpecies.name);
    //   }
    // } catch (error) {
    //   console.error('[auth] ⚠️  Failed to initialize RPG data:', error);
    //   // Don't fail registration if RPG init fails
    // }

    // Create session
    req.session.user = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    };
    req.user = req.session.user;

    console.log('[auth] ✅ User registered successfully:', newUser.email);
    console.log('[auth] Session ID:', req.sessionID);
    console.log('[auth] Session user:', req.session.user);

    return res.status(201).json({
      authenticated: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    console.error("[auth] Registration error:", error);
    return res.status(500).json({ error: "Failed to create account" });
  }
}

/**
 * Handle user login
 */
async function handleLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await findUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    req.user = req.session.user;

    console.log('[auth] ✅ User logged in successfully:', user.email);
    console.log('[auth] Session ID:', req.sessionID);
    console.log('[auth] Session user:', req.session.user);

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("[auth] Login error:", error);
    return res.status(500).json({ error: "Failed to log in" });
  }
}

/**
 * Handle user logout
 */
function handleLogout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      console.error("[auth] Logout error:", err);
      return res.status(500).json({ error: "Failed to log out" });
    }

    res.clearCookie("connect.sid");
    return res.json({ authenticated: false });
  });
}

/**
 * Get current session
 */
function handleSession(req: Request, res: Response) {
  console.log('[auth] Session check - Session ID:', req.sessionID);
  console.log('[auth] Session check - Session user:', req.session.user);
  console.log('[auth] Session check - Cookie:', req.headers.cookie);

  if (!req.session.user) {
    console.log('[auth] ❌ No user in session');
    return res.json({ authenticated: false });
  }

  console.log('[auth] ✅ User authenticated:', req.session.user.email);
  return res.json({
    authenticated: true,
    user: req.session.user,
  });
}

/**
 * Middleware to require authentication
 */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  req.user = req.session.user;
  next();
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
 * Configure simple session-based authentication
 */
export function configureSimpleAuth(app: Express) {
  console.log("[auth] Configuring simple session-based authentication");

  // Set up session middleware with appropriate store
  let sessionConfig: any = {
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  };

  // Use PostgreSQL session store if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    try {
      console.log("[auth] Attempting PostgreSQL session store");
      const db = getDb();
      sessionConfig.store = new PgSession({
        pool: (db as any).pool,
        tableName: "session",
        createTableIfMissing: true,
      });
      console.log("[auth] ✅ PostgreSQL session store configured");
    } catch (error) {
      console.error("[auth] ⚠️  PostgreSQL session store failed, using memory store:", error instanceof Error ? error.message : error);
      // Fall back to memory store if PG fails
      sessionConfig.store = new MemoryStore({
        checkPeriod: 86400000,
      });
    }
  } else {
    // Fall back to in-memory session store for development
    console.log("[auth] Using in-memory session store (development mode)");
    // MemoryStore is already imported and created at the top of the file
    sessionConfig.store = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  app.use(session(sessionConfig));

  // Attach user to request if session exists
  app.use((req, _res, next) => {
    if (req.session.user) {
      req.user = req.session.user;
    }
    next();
  });

  // Auth routes
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/session", handleSession);

  // Protect all /api/* routes except auth endpoints
  app.use((req, res, next) => {
    const publicPaths = [
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/logout",
      "/api/auth/session",
      "/api/init-database",
      "/api/database-status",
    ];

    const isPublicPath = publicPaths.some((path) => req.path === path);

    // Skip auth for non-API routes and public paths
    if (!req.path.startsWith("/api") || isPublicPath) {
      return next();
    }

    return requireAuth(req, res, next);
  });

  console.log("[auth] ✅ Simple authentication configured");
}
