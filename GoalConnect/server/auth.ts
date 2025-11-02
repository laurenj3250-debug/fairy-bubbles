import type { Express, NextFunction, Request, Response } from "express";
import session from "express-session";
import memorystore from "memorystore";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

import { getDb } from "./db";
import { users } from "@shared/schema";

const MemoryStore = memorystore(session);

const FALLBACK_USERNAME = "laurenj3250";
const FALLBACK_PASSWORD = "demo1234";
const FALLBACK_NAME = "Lauren";
const FALLBACK_EMAIL = `${FALLBACK_USERNAME.toLowerCase()}@goalconnect.local`;
const FALLBACK_SECRET = "goalconnect-session-secret";

const authDisabledEnv = process.env.AUTH_DISABLED?.trim()?.toLowerCase();
const authDisabled = authDisabledEnv !== "false" && authDisabledEnv !== "0";

const configuredUsername = process.env.APP_USERNAME?.trim() || FALLBACK_USERNAME;
const configuredPassword = process.env.APP_PASSWORD?.trim() || FALLBACK_PASSWORD;
const configuredName = process.env.APP_USER_NAME?.trim() || FALLBACK_NAME;
const configuredEmail = process.env.APP_USER_EMAIL?.trim() || FALLBACK_EMAIL;

const sessionSecret = process.env.SESSION_SECRET?.trim() || FALLBACK_SECRET;

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

type AuthenticatedUser = {
  id: number;
  email: string;
  name: string;
  supabaseUserId?: string;
};

type SupabaseSessionTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
};

declare module "express-session" {
  interface SessionData {
    user?: AuthenticatedUser;
    supabaseTokens?: SupabaseSessionTokens;
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

function formatUserForResponse(user: AuthenticatedUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

async function findUserByEmail(email: string) {
  const db = getDb();
  const [dbUser] = await db.select().from(users).where(eq(users.email, email));
  return dbUser;
}

let cachedDefaultUser: AuthenticatedUser | null = null;

async function resolveDefaultUser(): Promise<AuthenticatedUser> {
  if (cachedDefaultUser) {
    return cachedDefaultUser;
  }

  try {
    const dbUser = await findUserByEmail(configuredEmail);
    if (dbUser) {
      cachedDefaultUser = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      };
      return cachedDefaultUser;
    }
  } catch (error) {
    console.error("[auth] Failed to look up default user by email:", error);
  }

  try {
    const db = getDb();
    const [firstUser] = await db.select().from(users).limit(1);
    if (firstUser) {
      if (firstUser.email.toLowerCase() !== configuredEmail.toLowerCase()) {
        console.warn(
          `[auth] Default email ${configuredEmail} not found. Using ${firstUser.email} instead.`,
        );
      }

      cachedDefaultUser = {
        id: firstUser.id,
        email: firstUser.email,
        name: firstUser.name,
      };
      return cachedDefaultUser;
    }
  } catch (error) {
    console.error("[auth] Failed to load fallback user:", error);
  }

  throw new Error(
    "No default user available. Seed the database or configure APP_USER_EMAIL/APP_USER_NAME.",
  );
}

function getCachedDefaultUser(): AuthenticatedUser {
  if (!cachedDefaultUser) {
    throw new Error("Default user has not been resolved yet");
  }

  return cachedDefaultUser;
}

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate(err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function handleSupabaseLogin(req: Request, res: Response): Promise<void> {
  if (!supabaseEnabled || !supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase login requested but SUPABASE_URL/SUPABASE_ANON_KEY are not configured");
  }

  const emailInput = (req.body?.email ?? req.body?.username ?? "").toString().trim().toLowerCase();
  const password = (req.body?.password ?? "").toString();

  if (!emailInput || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  if (!emailInput.includes("@")) {
    res.status(400).json({ error: "Please sign in with your email address" });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput,
    password,
  });

  if (error || !data.session || !data.user) {
    const message = error?.message || "Invalid email or password";
    res.status(401).json({ error: message });
    return;
  }

  const dbUser = await findUserByEmail(data.user.email ?? emailInput);
  if (!dbUser) {
    res.status(403).json({ error: "No GoalConnect account is linked to this email" });
    return;
  }

  const authenticatedUser: AuthenticatedUser = {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    supabaseUserId: data.user.id,
  };

  await regenerateSession(req);

  req.session.user = authenticatedUser;
  req.session.supabaseTokens = {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token ?? null,
    expiresAt: data.session.expires_in ? Date.now() + data.session.expires_in * 1000 : null,
  };
  req.user = authenticatedUser;

  res.json({
    authenticated: true,
    user: formatUserForResponse(authenticatedUser),
  });
}

async function handleLocalLogin(req: Request, res: Response): Promise<void> {
  const identifier = (req.body?.username ?? req.body?.email ?? "").toString().trim();
  const password = (req.body?.password ?? "").toString();

  if (identifier !== configuredUsername || password !== configuredPassword) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const defaultUser = await resolveDefaultUser();

  await regenerateSession(req);

  const authenticatedUser: AuthenticatedUser = {
    ...defaultUser,
    supabaseUserId: undefined,
  };

  req.session.user = authenticatedUser;
  req.session.supabaseTokens = undefined;
  req.user = authenticatedUser;

  res.json({
    authenticated: true,
    user: formatUserForResponse(authenticatedUser),
  });
}

function handleLogout(req: Request, res: Response, next: NextFunction) {
  const finish = () => res.json({ authenticated: false });

  if (!req.session) {
    finish();
    return;
  }

  req.session.user = undefined;
  req.session.supabaseTokens = undefined;

  req.session.destroy(err => {
    if (err) {
      next(err);
      return;
    }

    if (typeof res.clearCookie === "function") {
      res.clearCookie("connect.sid");
    }

    finish();
  });
}

function authenticateRequest(req: Request, res: Response, next: NextFunction) {
  if (authDisabled) {
    return next();
  }

  const user = req.user ?? req.session?.user;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  req.user = user;
  return next();
}

export function configureAuth(app: Express) {
  if (authDisabled) {
    console.log(
      "[auth] Authentication is disabled – all API requests will use the configured fallback user.",
    );

    void resolveDefaultUser()
      .then(user => {
        console.log(`[auth] Defaulting all requests to ${user.email} (userId=${user.id}).`);
      })
      .catch(error => {
        console.error("[auth] Unable to resolve default user during startup:", error);
      });

    app.use(async (req, _res, next) => {
      try {
        const defaultUser = await resolveDefaultUser();
        req.user = defaultUser;
        next();
      } catch (error) {
        next(error);
      }
    });

    app.post("/api/auth/login", async (_req, res, next) => {
      try {
        const defaultUser = await resolveDefaultUser();
        res.json({ authenticated: true, user: formatUserForResponse(defaultUser) });
      } catch (error) {
        next(error);
      }
    });

    app.post("/api/auth/logout", (_req, res) => {
      res.json({ authenticated: false });
    });

    app.get("/api/auth/session", async (_req, res, next) => {
      try {
        const defaultUser = await resolveDefaultUser();
        res.json({ authenticated: true, user: formatUserForResponse(defaultUser) });
      } catch (error) {
        next(error);
      }
    });

    return;
  }

  if (supabaseEnabled) {
    console.log("[auth] Supabase login enabled. Users must exist in Supabase Auth and the GoalConnect database.");
  } else {
    console.log("[auth] Supabase not configured – falling back to APP_USERNAME/APP_PASSWORD login.");
  }

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: SESSION_MAX_AGE }),
      cookie: {
        maxAge: SESSION_MAX_AGE,
        sameSite: "lax",
        httpOnly: true,
      },
    }),
  );

  app.use((req, _res, next) => {
    if (req.session?.user) {
      req.user = req.session.user;
    }

    next();
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      if (supabaseEnabled) {
        await handleSupabaseLogin(req, res);
      } else {
        await handleLocalLogin(req, res);
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", handleLogout);

  app.get("/api/auth/session", (req, res) => {
    const user = req.session?.user;
    if (!user) {
      return res.json({ authenticated: false });
    }

    return res.json({ authenticated: true, user: formatUserForResponse(user) });
  });

  app.use((req, res, next) => {
    // Allow these paths without authentication
    const publicPaths = ["/api/auth", "/api/init-database", "/api/database-status"];
    const isPublicPath = publicPaths.some(path => req.path.startsWith(path));

    if (!req.path.startsWith("/api") || isPublicPath) {
      return next();
    }

    return authenticateRequest(req, res, next);
  });
}

export function requireUser(req: Request): AuthenticatedUser {
  if (authDisabled) {
    if (req.user) {
      return req.user;
    }

    return getCachedDefaultUser();
  }

  const user = req.user ?? req.session?.user;
  if (!user) {
    throw new Error("Missing authenticated user");
  }

  return user;
}
