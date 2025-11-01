import type { Express, NextFunction, Request, Response } from "express";
import session from "express-session";
import memorystore from "memorystore";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

import { getDb } from "./db";
import { users } from "@shared/schema";

const MemoryStore = memorystore(session);

const FALLBACK_USERNAME = "demo";
const FALLBACK_PASSWORD = "demo1234";
const FALLBACK_SECRET = "goalconnect-session-secret";

const authDisabled = process.env.AUTH_DISABLED?.trim()?.toLowerCase() === "true";

const configuredUsername = process.env.APP_USERNAME?.trim() || FALLBACK_USERNAME;
const configuredPassword = process.env.APP_PASSWORD?.trim() || FALLBACK_PASSWORD;
const configuredName = process.env.APP_USER_NAME?.trim() || configuredUsername;
const configuredEmail =
  process.env.APP_USER_EMAIL?.trim() ||
  `${configuredUsername.toLowerCase().replace(/\s+/g, "") || "user"}@goalconnect.local`;

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

const DEFAULT_AUTHENTICATED_USER: AuthenticatedUser = {
  id: 1,
  email: configuredEmail,
  name: configuredName,
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

  await regenerateSession(req);

  const authenticatedUser: AuthenticatedUser = {
    ...DEFAULT_AUTHENTICATED_USER,
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

  const user = req.session?.user;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  req.user = user;
  return next();
}

export function configureAuth(app: Express) {
  if (authDisabled) {
    console.log(
      "[auth] AUTH_DISABLED=true – all API requests are treated as authenticated. Update your Supabase or .env credentials when you're ready to require sign-in.",
    );

    app.use((req, _res, next) => {
      req.user = DEFAULT_AUTHENTICATED_USER;
      next();
    });

    app.post("/api/auth/login", (_req, res) => {
      res.json({ authenticated: true, user: formatUserForResponse(DEFAULT_AUTHENTICATED_USER) });
    });

    app.post("/api/auth/logout", (_req, res) => {
      res.json({ authenticated: false });
    });

    app.get("/api/auth/session", (_req, res) => {
      res.json({ authenticated: true, user: formatUserForResponse(DEFAULT_AUTHENTICATED_USER) });
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
    if (!req.path.startsWith("/api") || req.path.startsWith("/api/auth")) {
      return next();
    }

    return authenticateRequest(req, res, next);
  });
}

export function requireUser(req: Request): AuthenticatedUser {
  if (authDisabled) {
    return DEFAULT_AUTHENTICATED_USER;
  }

  const user = req.session?.user ?? req.user;
  if (!user) {
    throw new Error("Missing authenticated user");
  }

  return user;
}
