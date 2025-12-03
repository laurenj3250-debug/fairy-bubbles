import type { Express, NextFunction, Request, Response } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import createMemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, getPool } from "./db";
import { users } from "@shared/schema";
import { storage } from "./storage";
import { log } from "./lib/logger";
import {
  loginRateLimiter,
  registerRateLimiter,
  recordFailedLogin,
  resetFailedLogins,
  checkAccountLock,
  getFailedAttempts
} from "./security/rate-limiter";

const PgSession = connectPgSimple(session);
const MemoryStore = createMemoryStore(session);

// SECURITY: Validate session secret in production
// A cryptographically strong session secret is critical for session security
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  // In production, fail hard if no secure secret is provided
  if (process.env.NODE_ENV === 'production') {
    if (!secret) {
      throw new Error(
        'CRITICAL SECURITY ERROR: SESSION_SECRET environment variable must be set in production. ' +
        'Generate a secure secret using: openssl rand -base64 32'
      );
    }

    // Validate secret strength in production
    if (secret.length < 32) {
      throw new Error(
        'CRITICAL SECURITY ERROR: SESSION_SECRET must be at least 32 characters long in production. ' +
        'Current length: ' + secret.length + '. Generate a secure secret using: openssl rand -base64 32'
      );
    }

    log.info('[auth] Session secret validated (length: ' + secret.length + ' chars)');
    return secret;
  }

  // In development, allow a default but warn
  if (!secret) {
    log.warn('[auth] WARNING: Using default SESSION_SECRET in development mode');
    log.warn('[auth] For production, set SESSION_SECRET environment variable');
    return "dev-secret-change-in-production-" + Math.random().toString(36);
  }

  return secret;
}

const SESSION_SECRET = getSessionSecret();
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
 * Validate password strength
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
interface PasswordValidation {
  valid: boolean;
  errors: string[];
  entropy: number;
}

function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&*()_+-=[]{}etc.)");
  }

  // Calculate password entropy (bits)
  // Entropy = log2(characterSet^length)
  let charSet = 0;
  if (/[a-z]/.test(password)) charSet += 26;
  if (/[A-Z]/.test(password)) charSet += 26;
  if (/[0-9]/.test(password)) charSet += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) charSet += 32;

  const entropy = Math.floor(Math.log2(Math.pow(charSet, password.length)));

  return {
    valid: errors.length === 0,
    errors,
    entropy
  };
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
    log.error('[auth] Database error in findUserByEmail:', error);
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

    // Validate password strength (SECURITY: Strong password requirements)
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      log.debug('[auth] Password validation failed:', passwordValidation.errors);
      return res.status(400).json({
        error: "Password does not meet security requirements",
        details: passwordValidation.errors
      });
    }

    log.debug('[auth] Password validation passed (entropy: ' + passwordValidation.entropy + ' bits)');

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

    log.info('[auth] User registered successfully:', newUser.email);
    log.debug('[auth] Session ID:', req.sessionID);
    log.debug('[auth] Session user:', req.session.user);

    return res.status(201).json({
      authenticated: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    log.error("[auth] Registration error:", error);
    return res.status(500).json({ error: "Failed to create account" });
  }
}

/**
 * Handle user login
 * SECURITY: Implements account lockout after failed attempts
 */
async function handleLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase();

    // SECURITY: Check if account is locked
    const lockedUntil = checkAccountLock(normalizedEmail);
    if (lockedUntil) {
      const remainingMinutes = Math.ceil((lockedUntil.getTime() - Date.now()) / (60 * 1000));
      const attemptCount = getFailedAttempts(normalizedEmail);
      log.warn(`[security] Login attempt blocked for locked account: ${normalizedEmail} (${attemptCount} failed attempts)`);

      return res.status(423).json({
        error: "Account temporarily locked due to too many failed login attempts",
        lockedUntil: lockedUntil.toISOString(),
        retryAfterMinutes: remainingMinutes,
        message: `Please try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
      });
    }

    // Find user
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      // SECURITY: Record failed attempt even if user doesn't exist
      // This prevents timing attacks to enumerate valid emails
      recordFailedLogin(normalizedEmail);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      // SECURITY: Record failed login attempt
      recordFailedLogin(normalizedEmail);
      const attempts = getFailedAttempts(normalizedEmail);

      log.warn(`[security] Failed login for ${normalizedEmail} (${attempts} attempts)`);

      // Provide helpful feedback about impending lockout
      let errorMessage = "Invalid email or password";
      if (attempts >= 4) {
        errorMessage += ". Warning: Account will be locked after 5 failed attempts.";
      }

      return res.status(401).json({ error: errorMessage });
    }

    // SECURITY: Reset failed attempts on successful login
    resetFailedLogins(normalizedEmail);

    // Create session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    req.user = req.session.user;

    log.info('[auth] User logged in successfully:', user.email);
    log.debug('[auth] Session ID:', req.sessionID);
    log.debug('[auth] Session user:', req.session.user);

    // Explicitly save session before sending response to prevent race conditions
    req.session.save((err) => {
      if (err) {
        log.error('[auth] Failed to save session:', err);
        return res.status(500).json({ error: "Failed to create session" });
      }

      log.debug('[auth] Session saved successfully');
      return res.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    });
  } catch (error) {
    log.error("[auth] Login error:", error);
    return res.status(500).json({ error: "Failed to log in" });
  }
}

/**
 * Handle user logout
 */
function handleLogout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      log.error("[auth] Logout error:", err);
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
  log.debug('[auth] Session check - Session ID:', req.sessionID);
  log.debug('[auth] Session check - Session user:', req.session.user);
  log.debug('[auth] Session check - Cookie:', req.headers.cookie);

  if (!req.session.user) {
    log.debug('[auth] No user in session');
    return res.json({ authenticated: false });
  }

  log.debug('[auth] User authenticated:', req.session.user.email);
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
  log.info("[auth] Configuring simple session-based authentication");

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
      log.debug("[auth] Attempting PostgreSQL session store");
      // Use getPool() to get the actual pg Pool instance
      const pool = getPool();
      sessionConfig.store = new PgSession({
        pool,
        tableName: "session",
        createTableIfMissing: true,
      });
      log.info("[auth] PostgreSQL session store configured");
    } catch (error) {
      log.warn("[auth] PostgreSQL session store failed, using memory store:", error instanceof Error ? error.message : error);
      // Fall back to memory store if PG fails
      sessionConfig.store = new MemoryStore({
        checkPeriod: 86400000,
      });
    }
  } else {
    // Fall back to in-memory session store for development
    log.info("[auth] Using in-memory session store (development mode)");
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

  // Auth routes with rate limiting
  // SECURITY: Apply rate limiting to prevent brute force attacks
  app.post("/api/auth/register", registerRateLimiter, handleRegister);
  app.post("/api/auth/login", loginRateLimiter, handleLogin);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/session", handleSession);

  log.info("[auth] Rate limiting enabled on auth endpoints");
  log.info("[auth]    - Login: 5 attempts per 15 minutes per IP");
  log.info("[auth]    - Register: 3 attempts per hour per IP");
  log.info("[auth]    - Account lockout: Progressive (5/10/20 failed attempts)");

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

  log.info("[auth] Simple authentication configured");
}
