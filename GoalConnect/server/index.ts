import { log as logger } from "./lib/logger";

// CRITICAL: TLS Certificate Verification Configuration
// SECURITY NOTE: TLS verification should ONLY be disabled when absolutely necessary
// and only for specific known providers that use self-signed certificates.
// For production environments, ensure you understand the security implications.
//
// Railway and Supabase PostgreSQL use self-signed certificates
// This must be set before the pg library is loaded

// DEBUG: Log DATABASE_URL host for diagnostics
if (process.env.DATABASE_URL) {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    logger.info(`[TLS] Database host: ${dbUrl.hostname}`);
  } catch (e) {
    logger.warn('[TLS] Could not parse DATABASE_URL');
  }
}

if (process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('supabase.com') ||
  process.env.DATABASE_URL.includes('railway.app') ||
  process.env.DATABASE_URL.includes('railway.internal')
)) {
  // Disable TLS verification for known providers with self-signed certs
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const provider = process.env.DATABASE_URL.includes('supabase.com') ? 'Supabase' : 'Railway';
  logger.warn(`[SSL WARNING] TLS verification disabled for ${provider} database connection`);
  logger.warn('[SSL WARNING] This is required for providers using self-signed certificates');
  logger.warn('[SSL WARNING] Ensure DATABASE_URL is from a trusted source');
} else if (process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_TLS === 'true') {
  // In production, require explicit opt-in via environment variable
  // This ensures developers are aware of the security implications
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  logger.warn('[SSL WARNING] TLS verification disabled in production via ALLOW_INSECURE_TLS');
  logger.warn('[SSL WARNING] This should only be used with trusted database providers');
  logger.warn('[SSL WARNING] Consider using proper SSL certificates instead');
} else if (process.env.NODE_ENV === 'production') {
  // In production, default to secure TLS verification
  logger.info('[SSL] TLS verification enabled (secure mode)');
}

import "./load-env";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { configureSimpleAuth } from "./simple-auth";
import { configureGitHubAuth } from "./github-auth";
import { runMigrations } from "./migrate";
import { setupSwagger } from "./lib/swagger";
import cron from "node-cron";
import { processRecurringTasks } from "./lib/recurrenceScheduler";

// Global error handlers for uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', new Error(String(reason)), { promise });
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
configureGitHubAuth(app);

// Setup API documentation (Swagger UI)
setupSwagger(app);

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
    } catch (error) {
      logger.error('[startup] Failed to run migrations', error instanceof Error ? error : new Error(String(error)));
      // Continue anyway - the app might still work with existing schema
    }
  }

  const server = await registerRoutes(app);

  // Serve attached assets (costume images, etc.) as static files
  app.use("/attached_assets", express.static("attached_assets"));

  // Serve background images from client/public/backgrounds
  app.use("/backgrounds", express.static("client/public/backgrounds"));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error('Express error handler', err instanceof Error ? err : new Error(String(err)));
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

    // Set up recurrence scheduler - runs every hour
    cron.schedule('0 * * * *', async () => {
      logger.info('[Cron] Running recurrence scheduler...');
      try {
        const results = await processRecurringTasks();
        logger.info(`[Cron] Recurrence scheduler complete: ${results.created} tasks created`);
      } catch (error) {
        logger.error('[Cron] Error running recurrence scheduler', error instanceof Error ? error : new Error(String(error)));
      }
    });

    logger.info('[Cron] Recurrence scheduler initialized (runs every hour)');
  });
})();
