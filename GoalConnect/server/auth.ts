import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import memorystore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

const MemoryStore = memorystore(session);

const FALLBACK_USERNAME = "laurenj3250";
const FALLBACK_PASSWORD = "Crumpet11!!";
const FALLBACK_SECRET = "goalconnect-session-secret";

const rawAuthDisabled = process.env.AUTH_DISABLED ?? "true";
const authDisabled = rawAuthDisabled.trim().toLowerCase() === "true";

const configuredUsername = process.env.APP_USERNAME?.trim() || FALLBACK_USERNAME;
const configuredPassword = process.env.APP_PASSWORD?.trim() || FALLBACK_PASSWORD;

const sessionSecret = process.env.SESSION_SECRET?.trim() || FALLBACK_SECRET;

const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

type AuthenticatedUser = {
  id: number;
  username: string;
};

const AUTHENTICATED_USER: AuthenticatedUser = {
  id: 1,
  username: configuredUsername,
};

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}

passport.use(
  new LocalStrategy((username, password, done) => {
    if (username !== configuredUsername || password !== configuredPassword) {
      return done(null, false, { message: "Invalid username or password" });
    }

    return done(null, AUTHENTICATED_USER);
  }),
);

passport.serializeUser((user: AuthenticatedUser, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: number, done) => {
  if (id === AUTHENTICATED_USER.id) {
    return done(null, AUTHENTICATED_USER);
  }

  return done(null, false);
});

function authenticateRequest(req: Request, res: Response, next: NextFunction) {
  if (authDisabled) {
    return next();
  }

  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return next();
}

export function configureAuth(app: Express) {
  if (authDisabled) {
    console.log(
      "[auth] AUTH_DISABLED=true – all API requests are treated as authenticated. Update APP_USERNAME/APP_PASSWORD and set AUTH_DISABLED=false when you're ready to require sign-in.",
    );

    app.use((req, _res, next) => {
      req.user = AUTHENTICATED_USER;
      next();
    });

    app.post("/api/auth/login", (_req, res) => {
      res.json({ authenticated: true, user: { username: configuredUsername } });
    });

    app.post("/api/auth/logout", (_req, res) => {
      res.json({ authenticated: false });
    });

    app.get("/api/auth/session", (_req, res) => {
      res.json({ authenticated: true, user: { username: configuredUsername } });
    });

    return;
  }

  console.log(
    `[auth] Using APP_USERNAME='${configuredUsername}'. Change APP_USERNAME/APP_PASSWORD in your .env and set AUTH_DISABLED=false to require the login.`,
  );

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

  app.use(passport.initialize());
  app.use(passport.session());

  app.post(
    "/api/auth/login",
    (req, res, next) => {
      passport.authenticate("local", (err: Error | null, user: Express.User | false, info: any) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(401).json({ error: info?.message || "Invalid username or password" });
        }

        req.logIn(user, loginError => {
          if (loginError) {
            return next(loginError);
          }

          req.session.userId = user.id;
          return res.json({ authenticated: true, user: { username: user.username } });
        });
      })(req, res, next);
    },
  );

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout(logoutError => {
      if (logoutError) {
        return next(logoutError);
      }

      req.session.destroy(() => {
        res.json({ authenticated: false });
      });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      return res.json({ authenticated: true, user: { username: req.user.username } });
    }

    return res.json({ authenticated: false });
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
    return AUTHENTICATED_USER;
  }

  if (!req.user || !req.isAuthenticated()) {
    throw new Error("Missing authenticated user");
  }

  return req.user;
}
