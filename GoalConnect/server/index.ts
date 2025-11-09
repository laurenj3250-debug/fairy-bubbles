// CRITICAL: Set this BEFORE any imports
// Railway/Supabase PostgreSQL uses self-signed certificates
// This must be set before the pg library is loaded
// We set it for both production and development since Supabase requires it
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.com')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('[SSL] Disabled TLS verification for Supabase database');
} else if (process.env.NODE_ENV === 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('[SSL] Disabled TLS verification for production database');
}

import "./load-env";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { configureSimpleAuth } from "./simple-auth";
import { runMigrations } from "./migrate";
import { seedGameData } from "./seed-game-data";

// Global error handlers for uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

const app = express();

// CRITICAL: Trust proxy for Railway deployment
// Railway runs the app behind a proxy, and we need to trust it for:
// - Secure cookies to work correctly
// - req.ip to be accurate
// - req.protocol to be accurate (http vs https)
app.set('trust proxy', 1);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

configureSimpleAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run database migrations before starting the server
  if (process.env.DATABASE_URL) {
    try {
      await runMigrations();

      // Seed initial game data if needed
      try {
        await seedGameData();
      } catch (error) {
        console.error('[startup] Failed to seed game data:', error);
        // Continue anyway - seeding is optional
      }
    } catch (error) {
      console.error('[startup] Failed to run migrations:', error);
      // Continue anyway - the app might still work with existing schema
    }
  }

  const server = await registerRoutes(app);

  // Serve attached assets (costume images, etc.) as static files
  app.use("/attached_assets", express.static("attached_assets"));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Express error handler:', err);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);

  // Use localhost for development (macOS compatibility), 0.0.0.0 for production (Railway)
  const host = process.env.NODE_ENV === 'production' ? "0.0.0.0" : "localhost";

  server.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
  });
})();
