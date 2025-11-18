# GoalConnect Production Readiness Roadmap

**Timeline:** 6-8 weeks to production-ready state
**Last Updated:** 2025-01-18

## Overview

This document provides a comprehensive, step-by-step plan to take GoalConnect from its current 30% production readiness to a fully publishable, professional-grade application.

---

## Phase 1: Critical Blockers (Weeks 1-3)

**Goal:** Fix all issues that would cause immediate production failures
**Timeline:** 15 working days
**Priority:** MUST COMPLETE before any public launch

### Week 1: TypeScript & Testing Foundation

#### Day 1-2: Fix TypeScript Compilation Errors

**Objective:** Zero TypeScript errors, strict mode enabled

**Tasks:**

1. **Enable Strict Mode** (2 hours)
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true
     }
   }
   ```

2. **Fix Schema Type Issues** (4 hours)
   ```typescript
   // shared/schema.ts
   // Fix all Drizzle type mismatches
   // Ensure all table definitions have proper types
   // Add type exports for all schemas

   export type Habit = typeof habits.$inferSelect;
   export type HabitInsert = typeof habits.$inferInsert;
   export type Mission = typeof expeditionMissions.$inferSelect;
   // ... etc for all tables
   ```

3. **Fix Component Type Errors** (6 hours)
   - ActiveExpedition.tsx (Element vs string issues)
   - DailyFocusHero.tsx (missing 'completed' property)
   - Fix all 'any' types with proper interfaces
   - Add proper return types to all functions

4. **Fix Storage Layer Types** (4 hours)
   ```typescript
   // server/storage.ts
   // Fix MemStorage interface implementation
   // Add missing properties
   // Ensure DbStorage matches IStorage interface
   ```

**Verification:**
```bash
npx tsc --noEmit  # Must exit with 0 errors
```

#### Day 3-4: Set Up Testing Infrastructure

**Objective:** Working test suite with CI/CD integration

**Tasks:**

1. **Fix Existing Test Failures** (6 hours)
   ```typescript
   // tests/dashboard.spec.ts
   // Update to test correct routes:
   test.beforeEach(async ({ page }) => {
     await page.goto('/dashboard');  // NOT '/'
   });

   // Update selectors to match actual components
   // Add data-testid attributes to components
   ```

2. **Fix Authentication in Tests** (4 hours)
   ```typescript
   // tests/auth.setup.ts
   // Ensure session cookies persist correctly
   // Add debug logging for auth issues
   // Verify auth state before each test
   ```

3. **Add Expedition Missions Tests** (4 hours)
   ```typescript
   // tests/expedition-missions.spec.ts
   test('can start and complete mission', async ({ page }) => {
     await page.goto('/expedition-missions');
     await page.click('button:has-text("Start Mission")');
     // Verify mission started
     // Simulate progress
     // Complete mission
     // Verify rewards
   });
   ```

4. **Set Up Test Coverage** (2 hours)
   ```json
   // package.json
   {
     "scripts": {
       "test:coverage": "playwright test --reporter=html,json",
       "test:unit": "vitest",
       "test:e2e": "playwright test"
     }
   }
   ```

**Verification:**
```bash
npm test  # All tests pass
npm run test:coverage  # >60% coverage
```

#### Day 5: Security - Critical Vulnerabilities

**Objective:** Fix all HIGH severity security issues

**Tasks:**

1. **Remove TLS Certificate Bypass** (30 min)
   ```typescript
   // server/index.ts
   // REMOVE: NODE_TLS_REJECT_UNAUTHORIZED=0

   // Instead, use proper SSL certificates:
   // 1. For development: Use mkcert
   // 2. For production: Use Let's Encrypt

   // .env.development
   DATABASE_URL=postgres://...?sslmode=require

   // Use proper cert validation
   ```

2. **Add Input Validation with Zod** (4 hours)
   ```typescript
   // server/validation/schemas.ts
   import { z } from 'zod';

   export const startMissionSchema = z.object({
     mountainId: z.number().int().positive(),
   });

   export const checkProgressSchema = z.object({
     missionId: z.number().int().positive(),
     date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
   });

   // Apply to all endpoints:
   app.post('/api/expedition-missions/start', async (req, res) => {
     const validated = startMissionSchema.safeParse(req.body);
     if (!validated.success) {
       return res.status(400).json({
         error: 'Invalid input',
         details: validated.error.flatten()
       });
     }
     // ... use validated.data
   });
   ```

3. **Add Rate Limiting** (2 hours)
   ```typescript
   // server/middleware/rateLimiter.ts
   import rateLimit from 'express-rate-limit';

   export const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     message: 'Too many requests, please try again later.',
   });

   export const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5, // 5 login attempts per 15 minutes
     skipSuccessfulRequests: true,
   });

   // Apply to routes:
   app.use('/api/', apiLimiter);
   app.use('/api/auth/', authLimiter);
   ```

4. **Secure Session Configuration** (2 hours)
   ```typescript
   // server/index.ts
   app.use(session({
     secret: process.env.SESSION_SECRET, // Random 32+ char string
     resave: false,
     saveUninitialized: false,
     cookie: {
       secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
       httpOnly: true, // Prevent XSS
       maxAge: 24 * 60 * 60 * 1000, // 24 hours
       sameSite: 'lax', // CSRF protection
     },
     store: postgresSessionStore, // Already have this
   }));

   // Add CSRF protection
   import csrf from 'csurf';
   const csrfProtection = csrf({ cookie: false }); // Use session
   app.use(csrfProtection);
   ```

**Verification:**
```bash
# Run security audit
npm audit --production
# Should show 0 high/critical vulnerabilities

# Test rate limiting
curl -X POST http://localhost:5001/api/auth/signin # 5 times quickly
# 6th should return 429 Too Many Requests
```

### Week 2: Error Handling & Database

#### Day 6-7: Implement Proper Error Handling

**Objective:** User-friendly errors, centralized error handling, logging

**Tasks:**

1. **Create Error Classes** (3 hours)
   ```typescript
   // server/errors/AppError.ts
   export enum ErrorCode {
     // Authentication
     INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
     SESSION_EXPIRED = 'SESSION_EXPIRED',

     // Authorization
     INSUFFICIENT_LEVEL = 'INSUFFICIENT_LEVEL',

     // Resources
     MISSION_NOT_FOUND = 'MISSION_NOT_FOUND',
     MOUNTAIN_NOT_FOUND = 'MOUNTAIN_NOT_FOUND',

     // Business Logic
     MISSION_ALREADY_ACTIVE = 'MISSION_ALREADY_ACTIVE',
     MISSION_NOT_COMPLETE = 'MISSION_NOT_COMPLETE',

     // Validation
     INVALID_INPUT = 'INVALID_INPUT',

     // Server
     DATABASE_ERROR = 'DATABASE_ERROR',
     INTERNAL_ERROR = 'INTERNAL_ERROR',
   }

   export class AppError extends Error {
     constructor(
       public code: ErrorCode,
       public statusCode: number,
       message: string,
       public isOperational = true,
       public details?: any
     ) {
       super(message);
       this.name = this.constructor.name;
       Error.captureStackTrace(this, this.constructor);
     }
   }

   // Convenience creators
   export const createError = {
     notFound: (resource: string, id: number) =>
       new AppError(
         ErrorCode.MISSION_NOT_FOUND,
         404,
         `${resource} with ID ${id} not found`
       ),

     unauthorized: (message: string) =>
       new AppError(
         ErrorCode.INVALID_CREDENTIALS,
         401,
         message
       ),

     badRequest: (message: string, details?: any) =>
       new AppError(
         ErrorCode.INVALID_INPUT,
         400,
         message,
         true,
         details
       ),

     insufficientLevel: (required: number, current: number) =>
       new AppError(
         ErrorCode.INSUFFICIENT_LEVEL,
         403,
         `You need to reach level ${required} to start this expedition. Current level: ${current}`,
         true,
         { required, current }
       ),
   };
   ```

2. **Create Error Handler Middleware** (2 hours)
   ```typescript
   // server/middleware/errorHandler.ts
   import { ErrorRequestHandler } from 'express';
   import { AppError, ErrorCode } from '../errors/AppError';
   import { logger } from '../utils/logger';

   // User-friendly error messages
   const ERROR_MESSAGES: Record<ErrorCode, string> = {
     [ErrorCode.INVALID_CREDENTIALS]: "Invalid email or password. Please try again.",
     [ErrorCode.SESSION_EXPIRED]: "Your session has expired. Please log in again.",
     [ErrorCode.INSUFFICIENT_LEVEL]: "You haven't reached the required level yet. Keep climbing!",
     [ErrorCode.MISSION_NOT_FOUND]: "We couldn't find that mission. It may have been completed or removed.",
     [ErrorCode.MOUNTAIN_NOT_FOUND]: "That mountain doesn't exist in our records.",
     [ErrorCode.MISSION_ALREADY_ACTIVE]: "You already have an active mission. Complete it before starting a new one.",
     [ErrorCode.MISSION_NOT_COMPLETE]: "This mission isn't ready to be completed yet. Keep going!",
     [ErrorCode.INVALID_INPUT]: "Some information you provided wasn't valid. Please check and try again.",
     [ErrorCode.DATABASE_ERROR]: "We're having trouble accessing our records. Please try again in a moment.",
     [ErrorCode.INTERNAL_ERROR]: "Something went wrong on our end. We've been notified and are looking into it.",
   };

   export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
     // Log error
     if (err.isOperational) {
       logger.warn('Operational error', {
         code: err.code,
         statusCode: err.statusCode,
         message: err.message,
         userId: req.session?.userId,
         path: req.path,
       });
     } else {
       logger.error('Unexpected error', {
         error: err,
         stack: err.stack,
         userId: req.session?.userId,
         path: req.path,
       });
     }

     // Send user-friendly response
     if (err instanceof AppError) {
       return res.status(err.statusCode).json({
         error: {
           code: err.code,
           message: ERROR_MESSAGES[err.code] || err.message,
           ...(process.env.NODE_ENV === 'development' && {
             details: err.details,
             stack: err.stack,
           }),
         },
       });
     }

     // Unknown error - don't leak details
     return res.status(500).json({
       error: {
         code: ErrorCode.INTERNAL_ERROR,
         message: ERROR_MESSAGES[ErrorCode.INTERNAL_ERROR],
       },
     });
   };
   ```

3. **Update All API Endpoints** (4 hours)
   ```typescript
   // Example: server/routes.ts expedition missions endpoints
   app.get('/api/expedition-missions/next', async (req, res, next) => {
     try {
       if (!req.session?.userId) {
         throw createError.unauthorized('Not authenticated');
       }

       const userId = req.session.userId;

       // ... existing logic ...

       if (!nextMountain) {
         throw createError.notFound('Mountain', currentMountainIndex);
       }

       return res.json(nextMountain);
     } catch (error) {
       next(error); // Pass to error handler
     }
   });

   // Do this for ALL endpoints
   ```

4. **Set Up Logging** (3 hours)
   ```typescript
   // server/utils/logger.ts
   import winston from 'winston';

   export const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.errors({ stack: true }),
       winston.format.json()
     ),
     defaultMeta: { service: 'goalconnect-api' },
     transports: [
       new winston.transports.File({
         filename: 'logs/error.log',
         level: 'error'
       }),
       new winston.transports.File({
         filename: 'logs/combined.log'
       }),
     ],
   });

   if (process.env.NODE_ENV !== 'production') {
     logger.add(new winston.transports.Console({
       format: winston.format.combine(
         winston.format.colorize(),
         winston.format.simple()
       ),
     }));
   }
   ```

**Verification:**
```bash
# Test error handling
curl -X POST http://localhost:5001/api/expedition-missions/start \
  -H "Content-Type: application/json" \
  -d '{"mountainId": 999999}'
# Should return user-friendly error message

# Check logs
tail -f logs/error.log
```

#### Day 8-9: Database Optimization

**Objective:** Proper migrations, indexes, backup strategy

**Tasks:**

1. **Set Up Drizzle Kit Migrations** (3 hours)
   ```typescript
   // drizzle.config.ts
   import type { Config } from 'drizzle-kit';

   export default {
     schema: './shared/schema.ts',
     out: './drizzle',
     driver: 'pg',
     dbCredentials: {
       connectionString: process.env.DATABASE_URL!,
     },
   } satisfies Config;

   // package.json scripts
   {
     "scripts": {
       "db:generate": "drizzle-kit generate:pg",
       "db:migrate": "drizzle-kit push:pg",
       "db:studio": "drizzle-kit studio",
       "db:drop": "drizzle-kit drop"
     }
   }
   ```

2. **Create Migration Files** (2 hours)
   ```bash
   # Generate migration from schema
   npm run db:generate

   # Creates: drizzle/0001_initial_schema.sql
   # Review and commit migration files
   ```

3. **Add Missing Indexes** (2 hours)
   ```typescript
   // shared/schema.ts

   // Composite indexes for common queries
   export const expeditionMissions = pgTable(
     "expedition_missions",
     { /* ... existing fields ... */ },
     (table) => ({
       // Existing indexes...
       userIdIdx: index("expedition_missions_user_id_idx").on(table.userId),

       // NEW: Composite index for finding active missions
       userStatusIdx: index("expedition_missions_user_status_idx")
         .on(table.userId, table.status),

       // NEW: Index for date-based queries
       statusDateIdx: index("expedition_missions_status_date_idx")
         .on(table.status, table.startDate),
     })
   );

   export const habitLogs = pgTable(
     "habit_logs",
     { /* ... existing fields ... */ },
     (table) => ({
       // NEW: Composite index for habit + date queries
       habitDateIdx: index("habit_logs_habit_date_idx")
         .on(table.habitId, table.date),

       // NEW: Index for user progress queries
       userDateIdx: index("habit_logs_user_date_idx")
         .on(table.userId, table.date),
     })
   );
   ```

4. **Set Up Database Backups** (3 hours)
   ```bash
   # scripts/backup-database.sh
   #!/bin/bash

   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="./backups"
   BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

   mkdir -p $BACKUP_DIR

   # Backup to file
   pg_dump $DATABASE_URL > $BACKUP_FILE

   # Compress
   gzip $BACKUP_FILE

   # Upload to S3 (or your storage)
   aws s3 cp $BACKUP_FILE.gz s3://your-bucket/backups/

   # Keep only last 30 days locally
   find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

   echo "Backup completed: $BACKUP_FILE.gz"
   ```

   ```bash
   # Set up daily cron job
   # crontab -e
   0 2 * * * /path/to/scripts/backup-database.sh
   ```

5. **Add Connection Pooling** (2 hours)
   ```typescript
   // server/db.ts
   import { drizzle } from 'drizzle-orm/node-postgres';
   import { Pool } from 'pg';
   import * as schema from '../shared/schema';

   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     max: 20, // Maximum connections in pool
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });

   // Handle pool errors
   pool.on('error', (err) => {
     logger.error('Unexpected error on idle client', err);
     process.exit(-1);
   });

   export const db = drizzle(pool, { schema });

   // Graceful shutdown
   process.on('SIGINT', async () => {
     await pool.end();
     process.exit(0);
   });
   ```

**Verification:**
```bash
# Check index usage
psql $DATABASE_URL -c "
  SELECT schemaname, tablename, indexname, idx_scan
  FROM pg_stat_user_indexes
  ORDER BY idx_scan DESC;
"

# Test backup
./scripts/backup-database.sh
# Verify backup file created and uploaded

# Test connection pool
# Run load test and verify connections stay within limit
```

#### Day 10: Monitoring & CI/CD

**Objective:** Error tracking, CI/CD pipeline, health checks

**Tasks:**

1. **Set Up Sentry** (2 hours)
   ```typescript
   // server/index.ts
   import * as Sentry from '@sentry/node';

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0,
   });

   // Add Sentry handlers
   app.use(Sentry.Handlers.requestHandler());
   app.use(Sentry.Handlers.tracingHandler());

   // ... routes ...

   app.use(Sentry.Handlers.errorHandler());
   ```

   ```typescript
   // client/src/main.tsx
   import * as Sentry from '@sentry/react';

   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     integrations: [
       new Sentry.BrowserTracing(),
       new Sentry.Replay(),
     ],
     tracesSampleRate: 1.0,
     replaysSessionSampleRate: 0.1,
     replaysOnErrorSampleRate: 1.0,
   });
   ```

2. **Create GitHub Actions CI/CD** (3 hours)
   ```yaml
   # .github/workflows/ci.yml
   name: CI

   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]

   jobs:
     test:
       runs-on: ubuntu-latest

       services:
         postgres:
           image: postgres:14
           env:
             POSTGRES_PASSWORD: postgres
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5

       steps:
         - uses: actions/checkout@v3

         - uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'npm'

         - name: Install dependencies
           run: npm ci

         - name: TypeScript check
           run: npx tsc --noEmit

         - name: Run linter
           run: npm run lint

         - name: Run tests
           run: npm test
           env:
             DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

         - name: Upload coverage
           uses: codecov/codecov-action@v3
   ```

   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy

   on:
     push:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       needs: test

       steps:
         - uses: actions/checkout@v3

         - name: Deploy to Railway
           run: |
             npm install -g @railway/cli
             railway up --service backend
           env:
             RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
   ```

3. **Add Health Checks** (2 hours)
   ```typescript
   // server/routes/health.ts
   app.get('/health', async (req, res) => {
     const checks = {
       uptime: process.uptime(),
       timestamp: Date.now(),
       database: 'unknown',
       memory: process.memoryUsage(),
     };

     // Check database
     try {
       await db.select().from(users).limit(1);
       checks.database = 'ok';
     } catch (error) {
       checks.database = 'error';
       return res.status(503).json({ status: 'unhealthy', checks });
     }

     res.json({ status: 'healthy', checks });
   });

   app.get('/ready', async (req, res) => {
     // Check if app is ready to receive traffic
     try {
       await db.select().from(users).limit(1);
       res.json({ ready: true });
     } catch (error) {
       res.status(503).json({ ready: false });
     }
   });
   ```

4. **Set Up Alerts** (1 hour)
   ```typescript
   // server/monitoring/alerts.ts
   import { logger } from '../utils/logger';

   // Monitor error rate
   let errorCount = 0;
   const ERROR_THRESHOLD = 10; // errors per minute

   setInterval(() => {
     if (errorCount > ERROR_THRESHOLD) {
       logger.error('High error rate detected', {
         errorCount,
         threshold: ERROR_THRESHOLD,
       });

       // Send alert (email, Slack, PagerDuty, etc.)
       sendAlert({
         severity: 'high',
         message: `Error rate exceeded threshold: ${errorCount}/min`,
       });
     }
     errorCount = 0;
   }, 60000);

   export const incrementErrorCount = () => {
     errorCount++;
   };
   ```

**Verification:**
```bash
# Test CI/CD
git push origin main
# Check GitHub Actions - all checks should pass

# Test health endpoint
curl http://localhost:5001/health
# Should return 200 with healthy status

# Test Sentry
# Trigger an error and verify it appears in Sentry dashboard
```

---

## Phase 2: Major Issues (Weeks 4-6)

**Goal:** Performance, accessibility, mobile optimization
**Timeline:** 15 working days

### Week 3-4: Performance Optimization

#### Day 11-12: Query Optimization & Caching

**Tasks:**

1. **Create Batch Endpoints** (4 hours)
   ```typescript
   // server/routes/api.ts

   // BEFORE: N+1 queries
   // Client makes 10 separate calls for 10 habits

   // AFTER: Batch endpoint
   app.get('/api/habit-logs/batch', async (req, res, next) => {
     try {
       const userId = req.session?.userId;
       if (!userId) throw createError.unauthorized('Not authenticated');

       const { habitIds, startDate, endDate } = req.query;

       // Parse and validate
       const ids = habitIds.split(',').map(Number);

       // Single query for all habits
       const logs = await db
         .select()
         .from(habitLogs)
         .where(
           and(
             eq(habitLogs.userId, userId),
             inArray(habitLogs.habitId, ids),
             gte(habitLogs.date, startDate),
             lte(habitLogs.date, endDate)
           )
         );

       // Group by habitId
       const grouped = logs.reduce((acc, log) => {
         if (!acc[log.habitId]) acc[log.habitId] = [];
         acc[log.habitId].push(log);
         return acc;
       }, {} as Record<number, HabitLog[]>);

       res.json(grouped);
     } catch (error) {
       next(error);
     }
   });
   ```

2. **Implement Redis Caching** (6 hours)
   ```typescript
   // server/cache/redis.ts
   import Redis from 'ioredis';

   const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

   export const cache = {
     async get<T>(key: string): Promise<T | null> {
       const data = await redis.get(key);
       return data ? JSON.parse(data) : null;
     },

     async set(key: string, value: any, ttl: number = 3600): Promise<void> {
       await redis.setex(key, ttl, JSON.stringify(value));
     },

     async del(key: string): Promise<void> {
       await redis.del(key);
     },

     async invalidatePattern(pattern: string): Promise<void> {
       const keys = await redis.keys(pattern);
       if (keys.length > 0) {
         await redis.del(...keys);
       }
     },
   };

   // Cache middleware
   export const cacheMiddleware = (ttl: number = 3600) => {
     return async (req: Request, res: Response, next: NextFunction) => {
       const key = `cache:${req.originalUrl}`;
       const cached = await cache.get(key);

       if (cached) {
         return res.json(cached);
       }

       // Override res.json to cache response
       const originalJson = res.json.bind(res);
       res.json = (body: any) => {
         cache.set(key, body, ttl);
         return originalJson(body);
       };

       next();
     };
   };
   ```

   ```typescript
   // Apply caching to expensive endpoints
   app.get('/api/mountains', cacheMiddleware(3600), async (req, res) => {
     // Mountains rarely change - cache for 1 hour
     const mountains = await db.select().from(mountains);
     res.json(mountains);
   });

   app.get('/api/expedition-missions/current', async (req, res, next) => {
     try {
       const userId = req.session?.userId;
       const cacheKey = `mission:current:${userId}`;

       // Try cache first
       const cached = await cache.get(cacheKey);
       if (cached) return res.json(cached);

       // Query database
       const mission = await db.query.expeditionMissions.findFirst({
         where: and(
           eq(expeditionMissions.userId, userId),
           eq(expeditionMissions.status, 'active')
         ),
         with: { mountain: true },
       });

       // Cache result for 5 minutes
       await cache.set(cacheKey, mission, 300);
       res.json(mission);
     } catch (error) {
       next(error);
     }
   });
   ```

3. **Cache Invalidation Strategy** (2 hours)
   ```typescript
   // server/cache/invalidation.ts

   // Invalidate user's mission cache when they start/complete a mission
   app.post('/api/expedition-missions/start', async (req, res, next) => {
     try {
       // ... existing logic ...

       // Invalidate cache
       await cache.invalidatePattern(`mission:*:${userId}`);
       await cache.invalidatePattern(`stats:*:${userId}`);

       res.json(newMission);
     } catch (error) {
       next(error);
     }
   });
   ```

**Verification:**
```bash
# Test caching
curl http://localhost:5001/api/mountains
# First call: slow (database query)
curl http://localhost:5001/api/mountains
# Second call: fast (from cache)

# Check Redis
redis-cli KEYS "*"
# Should show cached keys
```

#### Day 13-14: Frontend Performance

**Tasks:**

1. **Implement Code Splitting** (4 hours)
   ```typescript
   // client/src/App.tsx
   import { lazy, Suspense } from 'react';

   // Lazy load routes
   const DashboardNew = lazy(() => import('@/pages/DashboardNew'));
   const WeeklyHub = lazy(() => import('@/pages/WeeklyHub'));
   const ExpeditionMissions = lazy(() => import('@/pages/ExpeditionMissions'));
   const Goals = lazy(() => import('@/pages/Goals'));
   const Habits = lazy(() => import('@/pages/HabitsMountain'));
   const Settings = lazy(() => import('@/pages/Settings'));

   // Loading fallback
   const PageLoader = () => (
     <div className="min-h-screen flex items-center justify-center">
       <div className="text-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
         <p className="mt-4 text-muted-foreground">Loading...</p>
       </div>
     </div>
   );

   function AppRoutes() {
     return (
       <Suspense fallback={<PageLoader />}>
         <Switch>
           <Route path="/dashboard">
             <DashboardNew />
           </Route>
           {/* ... other routes ... */}
         </Switch>
       </Suspense>
     );
   }
   ```

2. **Optimize Bundle Size** (3 hours)
   ```typescript
   // vite.config.ts
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             'react-vendor': ['react', 'react-dom', 'react-router-dom'],
             'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
             'query-vendor': ['@tanstack/react-query'],
           },
         },
       },
       chunkSizeWarningLimit: 1000,
     },

     // Optimize deps
     optimizeDeps: {
       include: ['react', 'react-dom'],
     },
   });
   ```

3. **Add Loading Skeletons** (3 hours)
   ```typescript
   // client/src/components/LoadingSkeleton.tsx
   export function CardSkeleton() {
     return (
       <div className="animate-pulse">
         <div className="h-4 bg-muted rounded w-3/4 mb-2" />
         <div className="h-4 bg-muted rounded w-1/2" />
       </div>
     );
   }

   export function MissionCardSkeleton() {
     return (
       <div className="rounded-2xl border border-card-border p-6 animate-pulse">
         <div className="h-6 bg-muted rounded w-1/3 mb-4" />
         <div className="h-4 bg-muted rounded w-full mb-2" />
         <div className="h-4 bg-muted rounded w-2/3" />
       </div>
     );
   }
   ```

   ```typescript
   // Use in components
   export default function ExpeditionMissions() {
     const { data: mission, isLoading } = useQuery(...);

     if (isLoading) {
       return <MissionCardSkeleton />;
     }

     return <MissionCard mission={mission} />;
   }
   ```

4. **Implement Pagination** (4 hours)
   ```typescript
   // server/routes/api.ts
   app.get('/api/habit-logs/paginated', async (req, res, next) => {
     try {
       const { page = 1, limit = 20, habitId } = req.query;
       const offset = (Number(page) - 1) * Number(limit);

       const logs = await db
         .select()
         .from(habitLogs)
         .where(eq(habitLogs.habitId, Number(habitId)))
         .orderBy(desc(habitLogs.date))
         .limit(Number(limit))
         .offset(offset);

       const total = await db
         .select({ count: sql<number>`count(*)` })
         .from(habitLogs)
         .where(eq(habitLogs.habitId, Number(habitId)));

       res.json({
         data: logs,
         pagination: {
           page: Number(page),
           limit: Number(limit),
           total: total[0].count,
           pages: Math.ceil(total[0].count / Number(limit)),
         },
       });
     } catch (error) {
       next(error);
     }
   });
   ```

   ```typescript
   // client/src/components/PaginatedHabitLogs.tsx
   export function PaginatedHabitLogs({ habitId }: { habitId: number }) {
     const [page, setPage] = useState(1);

     const { data, isLoading } = useQuery({
       queryKey: ['/api/habit-logs/paginated', habitId, page],
       queryFn: async () => {
         const res = await fetch(
           `/api/habit-logs/paginated?habitId=${habitId}&page=${page}`
         );
         return res.json();
       },
     });

     return (
       <div>
         {data?.data.map(log => <LogItem key={log.id} log={log} />)}

         <Pagination
           currentPage={page}
           totalPages={data?.pagination.pages}
           onPageChange={setPage}
         />
       </div>
     );
   }
   ```

5. **Add Performance Monitoring** (2 hours)
   ```typescript
   // client/src/lib/performance.ts
   import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

   function sendToAnalytics(metric: any) {
     // Send to your analytics service
     console.log(metric);

     // Example: Send to Google Analytics
     if (window.gtag) {
       gtag('event', metric.name, {
         value: Math.round(metric.value),
         event_category: 'Web Vitals',
         event_label: metric.id,
         non_interaction: true,
       });
     }
   }

   // Initialize web vitals tracking
   onCLS(sendToAnalytics);
   onFID(sendToAnalytics);
   onFCP(sendToAnalytics);
   onLCP(sendToAnalytics);
   onTTFB(sendToAnalytics);
   ```

**Verification:**
```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer

# Test performance
npx lighthouse http://localhost:5001 --view
# Target scores:
# - Performance: >90
# - Accessibility: >90
# - Best Practices: >90
# - SEO: >90
```

### Week 5: Accessibility & Mobile

#### Day 15-17: Accessibility Audit & Fixes

**Tasks:**

1. **Install Accessibility Tools** (30 min)
   ```bash
   npm install --save-dev @axe-core/react eslint-plugin-jsx-a11y
   ```

   ```typescript
   // client/src/main.tsx (development only)
   if (process.env.NODE_ENV === 'development') {
     import('@axe-core/react').then((axe) => {
       axe.default(React, ReactDOM, 1000);
     });
   }
   ```

2. **Add ARIA Labels & Roles** (8 hours)
   ```typescript
   // Example: client/src/components/BottomNav.tsx
   export function BottomNav() {
     const [location] = useLocation();

     return (
       <nav
         role="navigation"
         aria-label="Main navigation"
         className="fixed bottom-0 left-0 right-0 ..."
       >
         {navItems.map(({ path, label, icon: Icon }) => {
           const isActive = location === path;

           return (
             <Link key={path} href={path} asChild>
               <button
                 aria-label={label}
                 aria-current={isActive ? 'page' : undefined}
                 className={cn(...)}
               >
                 <Icon aria-hidden="true" className="..." />
                 <span>{label}</span>
               </button>
             </Link>
           );
         })}
       </nav>
     );
   }
   ```

3. **Keyboard Navigation** (6 hours)
   ```typescript
   // Add keyboard shortcuts
   // client/src/hooks/useKeyboardShortcuts.ts
   export function useKeyboardShortcuts() {
     useEffect(() => {
       const handleKeyPress = (e: KeyboardEvent) => {
         // Alt+H: Go to Home
         if (e.altKey && e.key === 'h') {
           navigate('/');
         }

         // Alt+E: Go to Expeditions
         if (e.altKey && e.key === 'e') {
           navigate('/expedition-missions');
         }

         // Escape: Close modals
         if (e.key === 'Escape') {
           // Close any open modals
         }
       };

       window.addEventListener('keydown', handleKeyPress);
       return () => window.removeEventListener('keydown', handleKeyPress);
     }, []);
   }
   ```

   ```typescript
   // Ensure all interactive elements are keyboard accessible
   // Example: Modal
   export function Modal({ open, onClose, children }: ModalProps) {
     const modalRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
       if (open) {
         // Focus trap
         const focusableElements = modalRef.current?.querySelectorAll(
           'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
         );

         if (focusableElements?.length) {
           (focusableElements[0] as HTMLElement).focus();
         }

         // Close on Escape
         const handleEscape = (e: KeyboardEvent) => {
           if (e.key === 'Escape') onClose();
         };

         window.addEventListener('keydown', handleEscape);
         return () => window.removeEventListener('keydown', handleEscape);
       }
     }, [open, onClose]);

     return (
       <Dialog open={open} onOpenChange={onClose}>
         <DialogContent ref={modalRef} role="dialog" aria-modal="true">
           {children}
         </DialogContent>
       </Dialog>
     );
   }
   ```

4. **Color Contrast Fixes** (4 hours)
   ```css
   /* Check all color combinations meet WCAG AA standards */
   /* Use tools like https://contrast-ratio.com/ */

   /* Bad - insufficient contrast */
   .text-muted { color: #888; } /* on white background = 3.95:1 */

   /* Good - meets WCAG AA */
   .text-muted { color: #666; } /* on white background = 5.74:1 */
   ```

   ```typescript
   // Update theme colors
   // client/src/styles/theme.css
   :root {
     /* Ensure all colors meet 4.5:1 contrast ratio minimum */
     --muted-foreground: 0 0% 40%; /* Was 45% */
     --accent-foreground: 0 0% 9%; /* Ensure readable on accent background */
   }
   ```

5. **Screen Reader Testing** (2 hours)
   ```typescript
   // Add visually hidden text for context
   export function VisuallyHidden({ children }: { children: React.ReactNode }) {
     return (
       <span className="sr-only">
         {children}
       </span>
     );
   }

   // Use in components
   <button onClick={handleDelete}>
     <TrashIcon aria-hidden="true" />
     <VisuallyHidden>Delete mission</VisuallyHidden>
   </button>
   ```

**Verification:**
```bash
# Run axe accessibility tests
npx @axe-core/cli http://localhost:5001

# Test with screen reader
# macOS: VoiceOver (Cmd+F5)
# Windows: NVDA (free)

# Test keyboard navigation
# Tab through entire app
# Ensure all interactive elements are reachable
# Ensure focus is visible
```

#### Day 18-19: Mobile Optimization

**Tasks:**

1. **Mobile-First Responsive Design** (8 hours)
   ```typescript
   // Review and fix all pages for mobile
   // Example: ExpeditionMissions.tsx

   export default function ExpeditionMissions() {
     return (
       <div className="min-h-screen pb-20 px-4 md:px-6 lg:px-8">
         {/* Mobile: Full width, Desktop: Max width */}
         <div className="max-w-7xl mx-auto">
           {/* Mobile: Stack vertically, Desktop: Grid */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
             <ActiveMissionCard />
             <NextMountainCard />
           </div>
         </div>
       </div>
     );
   }
   ```

2. **Touch Optimization** (4 hours)
   ```css
   /* Ensure touch targets are at least 44x44px */
   button, a {
     min-height: 44px;
     min-width: 44px;
     padding: 12px 16px;
   }

   /* Add touch feedback */
   button:active {
     transform: scale(0.98);
     transition: transform 0.1s;
   }
   ```

3. **Mobile Navigation** (4 hours)
   ```typescript
   // Ensure bottom nav doesn't overlap content
   // Add safe area insets for notched devices

   // client/src/index.css
   :root {
     --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
   }

   .bottom-nav {
     padding-bottom: var(--safe-area-inset-bottom);
   }

   .content-wrapper {
     padding-bottom: calc(64px + var(--safe-area-inset-bottom));
   }
   ```

4. **Mobile Testing** (2 hours)
   ```bash
   # Test on real devices or emulators
   # - iOS Safari
   # - Chrome Android
   # - Samsung Internet

   # Test different screen sizes:
   # - iPhone SE (375px)
   # - iPhone 12/13 (390px)
   # - iPhone 14 Pro Max (430px)
   # - iPad (768px)
   # - Desktop (1440px)
   ```

**Verification:**
```bash
# Run Lighthouse mobile audit
npx lighthouse http://localhost:5001 --preset=mobile --view

# Test with Chrome DevTools device emulation
# Test with BrowserStack or similar service
```

### Week 6: Code Quality Refactoring

#### Day 20-21: Extract Reusable Components

**Tasks:**

1. **Create Component Library** (8 hours)
   ```typescript
   // client/src/components/ui/Card.tsx
   interface CardProps {
     title: string;
     description?: string;
     children: React.ReactNode;
     className?: string;
     headerActions?: React.ReactNode;
   }

   export function Card({
     title,
     description,
     children,
     className,
     headerActions
   }: CardProps) {
     return (
       <div className={cn(
         "relative bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg overflow-hidden",
         className
       )}>
         {/* Noise texture background */}
         <div className="absolute inset-0 pointer-events-none opacity-30 topo-pattern" />

         <div className="relative z-10">
           <div className="flex items-center justify-between mb-4">
             <div>
               <h2 className="text-xl font-bold text-foreground">
                 {title}
               </h2>
               {description && (
                 <p className="text-xs text-muted-foreground mt-0.5">
                   {description}
                 </p>
               )}
             </div>
             {headerActions}
           </div>

           {children}
         </div>
       </div>
     );
   }
   ```

2. **Extract Duplicate Logic** (6 hours)
   ```typescript
   // client/src/lib/calculations/streaks.ts
   export function calculateLongestStreak(logs: HabitLog[]): number {
     const sortedDates = Array.from(
       new Set(logs.filter(log => log.completed).map(log => log.date))
     ).sort();

     if (sortedDates.length === 0) return 0;

     let maxStreak = 1;
     let currentStreak = 1;

     for (let i = 1; i < sortedDates.length; i++) {
       const prev = new Date(sortedDates[i - 1]);
       const curr = new Date(sortedDates[i]);
       const diffDays = Math.floor(
         (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
       );

       if (diffDays === 1) {
         currentStreak++;
         maxStreak = Math.max(maxStreak, currentStreak);
       } else {
         currentStreak = 1;
       }
     }

     return maxStreak;
   }

   // Use everywhere instead of duplicating
   ```

3. **Create Constants File** (2 hours)
   ```typescript
   // shared/constants.ts

   // Mission parameters
   export const MISSION_CONSTANTS = {
     MIN_DAYS: 3,
     MAX_DAYS: 30,
     ELEVATION_THRESHOLDS: {
       VERY_SHORT: 4000,
       SHORT: 5500,
       MEDIUM: 7000,
       LONG: 8000,
     },
     DIFFICULTY_MULTIPLIERS: {
       novice: 0.8,
       intermediate: 1.0,
       advanced: 1.2,
       expert: 1.4,
       elite: 1.5,
     },
     COMPLETION_REQUIREMENTS: {
       LOW_FATALITY: 75,
       MEDIUM_FATALITY: 80,
       HIGH_FATALITY: 90,
       EXTREME_FATALITY: 100,
     },
     XP_REWARDS: {
       novice: 75,
       intermediate: 150,
       advanced: 450,
       expert: 1200,
       elite: 2250,
     },
   };

   // Use in mission calculator
   import { MISSION_CONSTANTS } from '@shared/constants';

   const baseDays = elevation < MISSION_CONSTANTS.ELEVATION_THRESHOLDS.VERY_SHORT
     ? MISSION_CONSTANTS.MIN_DAYS
     : // ... etc
   ```

4. **Break Down God Components** (6 hours)
   ```typescript
   // Split DashboardNew.tsx (345 lines) into smaller components

   // client/src/pages/DashboardNew.tsx
   export default function DashboardNew() {
     return (
       <div className="min-h-screen pb-24">
         <DashboardHeader />
         <DashboardContent />
         <ComboTracker />
       </div>
     );
   }

   // client/src/components/dashboard/DashboardHeader.tsx
   export function DashboardHeader() {
     // Extract header logic
   }

   // client/src/components/dashboard/DashboardContent.tsx
   export function DashboardContent() {
     return (
       <div className="max-w-[1440px] mx-auto px-6 py-6">
         <ActiveExpeditionSection />
         <MainContentGrid />
         <RidgeTraverseSection />
       </div>
     );
   }
   ```

**Verification:**
```bash
# Check file sizes
find client/src -name "*.tsx" -exec wc -l {} + | sort -rn | head -20
# No file should be >200 lines

# Check for duplicate code
npx jscpd client/src
# Should show <5% duplication
```

#### Day 22: ESLint & Prettier Setup

**Tasks:**

1. **Configure ESLint** (2 hours)
   ```json
   // .eslintrc.json
   {
     "extends": [
       "eslint:recommended",
       "plugin:@typescript-eslint/recommended",
       "plugin:react/recommended",
       "plugin:react-hooks/recommended",
       "plugin:jsx-a11y/recommended"
     ],
     "rules": {
       "no-console": ["warn", { "allow": ["warn", "error"] }],
       "no-unused-vars": "off",
       "@typescript-eslint/no-unused-vars": ["error", {
         "argsIgnorePattern": "^_"
       }],
       "@typescript-eslint/explicit-function-return-type": "off",
       "react/prop-types": "off",
       "react/react-in-jsx-scope": "off",
       "jsx-a11y/click-events-have-key-events": "error",
       "jsx-a11y/no-static-element-interactions": "error"
     }
   }
   ```

2. **Configure Prettier** (1 hour)
   ```json
   // .prettierrc
   {
     "semi": true,
     "trailingComma": "es5",
     "singleQuote": true,
     "printWidth": 100,
     "tabWidth": 2,
     "arrowParens": "always"
   }
   ```

3. **Add Pre-commit Hooks** (1 hour)
   ```bash
   npm install --save-dev husky lint-staged
   npx husky init
   ```

   ```json
   // package.json
   {
     "lint-staged": {
       "*.{ts,tsx}": [
         "eslint --fix",
         "prettier --write"
       ],
       "*.{json,md}": [
         "prettier --write"
       ]
     }
   }
   ```

   ```bash
   # .husky/pre-commit
   #!/bin/sh
   . "$(dirname "$0")/_/husky.sh"

   npx lint-staged
   npx tsc --noEmit
   ```

4. **Format Entire Codebase** (2 hours)
   ```bash
   npx prettier --write "**/*.{ts,tsx,json,md}"
   npx eslint --fix "**/*.{ts,tsx}"
   ```

**Verification:**
```bash
# All files should be formatted
# Pre-commit hook should prevent commits with errors

git add .
git commit -m "test"
# Should run linting and type checking
```

---

## Phase 3: Polish (Weeks 7-8)

**Goal:** Professional UX, documentation, analytics
**Timeline:** 10 working days

### Week 7: UX Polish & Analytics

#### Day 23-24: Improved Loading & Empty States

**Tasks:**

1. **Design Better Empty States** (6 hours)
   ```typescript
   // client/src/components/EmptyState.tsx
   interface EmptyStateProps {
     icon: React.ComponentType<{ className?: string }>;
     title: string;
     description: string;
     action?: {
       label: string;
       onClick: () => void;
     };
   }

   export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
     return (
       <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
         <div className="rounded-full bg-muted p-6 mb-4">
           <Icon className="w-12 h-12 text-muted-foreground" />
         </div>

         <h3 className="text-lg font-semibold text-foreground mb-2">
           {title}
         </h3>

         <p className="text-sm text-muted-foreground max-w-md mb-6">
           {description}
         </p>

         {action && (
           <Button onClick={action.onClick}>
             {action.label}
           </Button>
         )}
       </div>
     );
   }

   // Use in pages
   export function ExpeditionMissions() {
     const { data: missions } = useQuery(...);

     if (!missions?.length) {
       return (
         <EmptyState
           icon={MountainIcon}
           title="No Expeditions Yet"
           description="Start your first expedition to unlock new mountains and earn rewards!"
           action={{
             label: "View Available Mountains",
             onClick: () => navigate('/expedition-missions')
           }}
         />
       );
     }

     // ... rest of component
   }
   ```

2. **Add Progress Indicators** (4 hours)
   ```typescript
   // client/src/components/ProgressIndicator.tsx
   export function ProgressIndicator({
     current,
     total,
     label,
     showPercentage = true
   }: ProgressIndicatorProps) {
     const percentage = Math.round((current / total) * 100);

     return (
       <div className="space-y-2">
         <div className="flex items-center justify-between text-sm">
           <span className="text-muted-foreground">{label}</span>
           {showPercentage && (
             <span className="font-semibold text-foreground">
               {percentage}%
             </span>
           )}
         </div>

         <div className="relative h-2 bg-muted rounded-full overflow-hidden">
           <motion.div
             className="absolute inset-y-0 left-0 bg-primary rounded-full"
             initial={{ width: 0 }}
             animate={{ width: `${percentage}%` }}
             transition={{ duration: 0.5, ease: "easeOut" }}
           />
         </div>

         <div className="flex items-center justify-between text-xs text-muted-foreground">
           <span>{current} completed</span>
           <span>{total - current} remaining</span>
         </div>
       </div>
     );
   }
   ```

3. **Add Transitions & Animations** (6 hours)
   ```typescript
   // client/src/lib/animations.ts
   import { Variants } from 'framer-motion';

   export const fadeIn: Variants = {
     initial: { opacity: 0 },
     animate: { opacity: 1 },
     exit: { opacity: 0 },
   };

   export const slideUp: Variants = {
     initial: { y: 20, opacity: 0 },
     animate: { y: 0, opacity: 1 },
     exit: { y: -20, opacity: 0 },
   };

   export const scaleIn: Variants = {
     initial: { scale: 0.9, opacity: 0 },
     animate: { scale: 1, opacity: 1 },
     exit: { scale: 0.9, opacity: 0 },
   };

   // Use in components
   import { motion } from 'framer-motion';
   import { fadeIn } from '@/lib/animations';

   export function MissionCard({ mission }: { mission: Mission }) {
     return (
       <motion.div
         variants={fadeIn}
         initial="initial"
         animate="animate"
         exit="exit"
         transition={{ duration: 0.3 }}
       >
         {/* Card content */}
       </motion.div>
     );
   }
   ```

**Verification:**
```bash
# Visual review of all pages
# Check all empty states
# Test all animations
# Ensure smooth transitions
```

#### Day 25: Analytics Integration

**Tasks:**

1. **Set Up PostHog** (3 hours)
   ```typescript
   // client/src/lib/analytics.ts
   import posthog from 'posthog-js';

   export const initAnalytics = () => {
     posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
       api_host: 'https://app.posthog.com',
       capture_pageview: true,
       capture_pageleave: true,
     });
   };

   export const analytics = {
     // Track events
     track: (event: string, properties?: Record<string, any>) => {
       posthog.capture(event, properties);
     },

     // Track page views
     page: (path: string) => {
       posthog.capture('$pageview', { path });
     },

     // Identify user
     identify: (userId: number, traits?: Record<string, any>) => {
       posthog.identify(userId.toString(), traits);
     },

     // Reset on logout
     reset: () => {
       posthog.reset();
     },
   };
   ```

2. **Add Event Tracking** (3 hours)
   ```typescript
   // Track key user actions

   // Mission started
   analytics.track('mission_started', {
     mountainId: mission.mountainId,
     mountainName: mission.mountain.name,
     difficulty: mission.mountain.difficultyTier,
     duration: mission.totalDays,
   });

   // Mission completed
   analytics.track('mission_completed', {
     missionId: mission.id,
     mountainName: mission.mountain.name,
     daysCompleted: mission.daysCompleted,
     perfectDays: mission.perfectDays,
     xpEarned: rewards.xp,
     pointsEarned: rewards.points,
   });

   // Habit completed
   analytics.track('habit_completed', {
     habitId: habit.id,
     habitName: habit.title,
     streak: habit.currentStreak,
   });
   ```

3. **Set Up Funnels** (2 hours)
   ```typescript
   // Define key user funnels

   // Onboarding funnel
   analytics.track('signup_started');
   analytics.track('signup_completed');
   analytics.track('first_habit_created');
   analytics.track('first_habit_completed');

   // Expedition funnel
   analytics.track('expedition_page_viewed');
   analytics.track('mountain_details_viewed');
   analytics.track('mission_started');
   analytics.track('first_day_completed');
   analytics.track('mission_completed');
   ```

**Verification:**
```bash
# Check PostHog dashboard
# Verify events are being tracked
# Set up key metrics dashboard
```

#### Day 26: User Onboarding

**Tasks:**

1. **Create Welcome Flow** (6 hours)
   ```typescript
   // client/src/components/Onboarding.tsx
   export function OnboardingFlow() {
     const [step, setStep] = useState(0);

     const steps = [
       {
         title: "Welcome to GoalConnect!",
         description: "Track your habits, climb mountains, and achieve your goals.",
         icon: MountainIcon,
       },
       {
         title: "Create Your First Habit",
         description: "Start with one small habit you want to build.",
         component: <HabitCreator onCreated={() => setStep(2)} />,
       },
       {
         title: "Start Your First Expedition",
         description: "Complete daily habits to summit your first mountain.",
         component: <ExpeditionIntro onStart={() => setStep(3)} />,
       },
       {
         title: "You're All Set!",
         description: "Let's start climbing!",
         action: () => navigate('/dashboard'),
       },
     ];

     return (
       <Dialog open={true}>
         <DialogContent>
           <OnboardingStep
             step={steps[step]}
             currentStep={step}
             totalSteps={steps.length}
             onNext={() => setStep(step + 1)}
             onSkip={() => navigate('/dashboard')}
           />
         </DialogContent>
       </Dialog>
     );
   }
   ```

2. **Add Tooltips & Hints** (4 hours)
   ```typescript
   // client/src/components/FeatureTooltip.tsx
   import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

   export function FeatureTooltip({
     children,
     content,
     side = 'top'
   }: FeatureTooltipProps) {
     return (
       <Tooltip>
         <TooltipTrigger asChild>
           {children}
         </TooltipTrigger>
         <TooltipContent side={side}>
           <p className="text-sm">{content}</p>
         </TooltipContent>
       </Tooltip>
     );
   }

   // Use throughout app
   <FeatureTooltip content="Your current climbing level. Complete missions to level up!">
     <div className="flex items-center gap-2">
       <TrendingUpIcon className="w-4 h-4" />
       <span>Level {climbingLevel}</span>
     </div>
   </FeatureTooltip>
   ```

3. **Add Contextual Help** (2 hours)
   ```typescript
   // client/src/components/HelpButton.tsx
   export function HelpButton({ topic }: { topic: string }) {
     const [open, setOpen] = useState(false);

     return (
       <>
         <Button
           variant="ghost"
           size="icon"
           onClick={() => setOpen(true)}
           aria-label="Help"
         >
           <HelpCircleIcon className="w-4 h-4" />
         </Button>

         <Dialog open={open} onOpenChange={setOpen}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>How it works</DialogTitle>
             </DialogHeader>
             <HelpContent topic={topic} />
           </DialogContent>
         </Dialog>
       </>
     );
   }
   ```

**Verification:**
```bash
# Test onboarding flow with new user
# Verify all tooltips are helpful
# Check help content is clear
```

### Week 8: Documentation & Final Polish

#### Day 27-28: Comprehensive Documentation

**Tasks:**

1. **API Documentation** (6 hours)
   ```yaml
   # docs/api/openapi.yaml
   openapi: 3.0.0
   info:
     title: GoalConnect API
     version: 1.0.0
     description: API for habit tracking and expedition missions

   paths:
     /api/expedition-missions/current:
       get:
         summary: Get current active mission
         tags: [Expedition Missions]
         security:
           - sessionAuth: []
         responses:
           200:
             description: Current mission or null
             content:
               application/json:
                 schema:
                   $ref: '#/components/schemas/Mission'
           401:
             $ref: '#/components/responses/Unauthorized'

     /api/expedition-missions/start:
       post:
         summary: Start a new expedition mission
         tags: [Expedition Missions]
         security:
           - sessionAuth: []
         requestBody:
           required: true
           content:
             application/json:
               schema:
                 type: object
                 required: [mountainId]
                 properties:
                   mountainId:
                     type: integer
                     description: ID of the mountain to climb
         responses:
           201:
             description: Mission started successfully
             content:
               application/json:
                 schema:
                   $ref: '#/components/schemas/Mission'
           400:
             $ref: '#/components/responses/BadRequest'

   components:
     schemas:
       Mission:
         type: object
         properties:
           id:
             type: integer
           mountainId:
             type: integer
           status:
             type: string
             enum: [active, completed, failed]
           # ... etc
   ```

   ```bash
   # Generate API docs site
   npx @redocly/cli build-docs docs/api/openapi.yaml \
     --output docs/api-reference.html
   ```

2. **Component Documentation with Storybook** (6 hours)
   ```bash
   npx storybook@latest init
   ```

   ```typescript
   // client/src/components/Card.stories.tsx
   import type { Meta, StoryObj } from '@storybook/react';
   import { Card } from './Card';

   const meta: Meta<typeof Card> = {
     title: 'Components/Card',
     component: Card,
     tags: ['autodocs'],
   };

   export default meta;
   type Story = StoryObj<typeof Card>;

   export const Default: Story = {
     args: {
       title: 'Mission Progress',
       description: 'Track your expedition',
       children: <div>Card content</div>,
     },
   };

   export const WithActions: Story = {
     args: {
       title: 'Mission Progress',
       headerActions: <Button size="sm">View Details</Button>,
       children: <div>Card content</div>,
     },
   };
   ```

3. **Architecture Documentation** (4 hours)
   ```markdown
   # docs/architecture.md

   # GoalConnect Architecture

   ## Overview

   GoalConnect is a full-stack habit tracking application with expedition-themed gamification.

   ## Technology Stack

   ### Frontend
   - **Framework**: React 18 with TypeScript
   - **Routing**: Wouter (lightweight React Router alternative)
   - **State Management**: TanStack Query (React Query)
   - **Styling**: Tailwind CSS + shadcn/ui components
   - **Animations**: Framer Motion
   - **Build Tool**: Vite

   ### Backend
   - **Runtime**: Node.js with Express
   - **Database**: PostgreSQL via Drizzle ORM
   - **Authentication**: Express Session
   - **Validation**: Zod

   ## Architecture Patterns

   ### Frontend Architecture

   ```
   client/
   ├── src/
   │   ├── components/      # Reusable UI components
   │   │   ├── ui/         # Base UI components (shadcn/ui)
   │   │   ├── dashboard/  # Dashboard-specific components
   │   │   └── expedition/ # Expedition-specific components
   │   ├── pages/          # Route components
   │   ├── hooks/          # Custom React hooks
   │   ├── lib/            # Utilities and helpers
   │   └── contexts/       # React contexts
   ```

   ### Backend Architecture

   ```
   server/
   ├── routes/          # API endpoints
   ├── middleware/      # Express middleware
   ├── errors/          # Error classes and handlers
   ├── cache/           # Redis caching layer
   ├── utils/           # Utility functions
   └── validation/      # Zod schemas
   ```

   ### Database Schema

   [Include ER diagram]

   ### Data Flow

   1. User interacts with React component
   2. Component triggers React Query mutation
   3. API call to Express endpoint
   4. Middleware validates input (Zod)
   5. Middleware checks authentication
   6. Route handler processes request
   7. Database query via Drizzle ORM
   8. Response sent back to client
   9. React Query updates cache
   10. Component re-renders with new data

   ## Security

   - Input validation on all endpoints
   - Session-based authentication
   - CSRF protection
   - Rate limiting
   - SQL injection prevention (parameterized queries)
   - XSS prevention (React auto-escaping)

   ## Performance Optimizations

   - Redis caching for expensive queries
   - Database indexes on frequently queried fields
   - Code splitting by route
   - Lazy loading of heavy components
   - Optimized bundle size
   - CDN for static assets
   ```

4. **User Documentation** (4 hours)
   ```markdown
   # docs/user-guide.md

   # GoalConnect User Guide

   ## Getting Started

   ### Creating Your First Habit

   1. Navigate to the Habits page
   2. Click "Add Habit"
   3. Fill in the habit details:
      - **Title**: What you want to do
      - **Description**: Why it matters
      - **Cadence**: Daily or weekly
      - **Category**: Mind, Foundation, or Adventure
   4. Click "Save"

   ### Starting an Expedition

   1. Navigate to the Expeditions page
   2. View the next available mountain
   3. Check the requirements:
      - Climbing level required
      - Mission duration
      - Completion percentage needed
   4. Click "Start Mission"
   5. Complete your daily habits to make progress

   ## Features

   ### Expedition Missions

   Expedition missions are time-based challenges where you climb virtual mountains by completing your daily habits.

   **How it works:**
   - Each mountain has a mission duration (3-30 days)
   - Complete a certain percentage of your habits each day
   - Earn XP, points, and unlock rewards
   - Progress to harder mountains

   **Rewards:**
   - XP: Increases your climbing level
   - Points: Spend in the Alpine Shop
   - Backgrounds: Unlock new app themes
   - Badges: Show your achievements

   ### Streak Tracking

   Build momentum by completing habits consecutively.

   - **Current Streak**: Days in a row you've completed this habit
   - **Longest Streak**: Your personal best
   - **Streak Freeze**: Use to protect your streak if you miss a day
   ```

**Verification:**
```bash
# Review all documentation
# Ensure API docs are accurate
# Test Storybook components
# Proofread user guide
```

#### Day 29-30: Final Review & Launch Prep

**Tasks:**

1. **Security Audit** (4 hours)
   ```bash
   # Run security checks
   npm audit

   # Check for common vulnerabilities
   npx snyk test

   # Review authentication flows
   # Review authorization checks
   # Review input validation
   # Review error handling
   ```

2. **Performance Audit** (3 hours)
   ```bash
   # Run Lighthouse on all pages
   npx lighthouse http://localhost:5001/ --view
   npx lighthouse http://localhost:5001/expedition-missions --view
   npx lighthouse http://localhost:5001/dashboard --view

   # Target scores: All >90

   # Check bundle sizes
   npm run build
   npx vite-bundle-visualizer

   # Target: Main bundle <200KB gzipped
   ```

3. **Cross-Browser Testing** (3 hours)
   ```bash
   # Test on:
   # - Chrome (latest)
   # - Firefox (latest)
   # - Safari (latest)
   # - Edge (latest)
   # - Mobile Safari
   # - Mobile Chrome

   # Check for:
   # - Visual inconsistencies
   # - JavaScript errors
   # - Feature compatibility
   # - Performance
   ```

4. **Load Testing** (2 hours)
   ```bash
   # Install k6
   brew install k6

   # Create load test script
   # tests/load/mission-flow.js
   import http from 'k6/http';
   import { check, sleep } from 'k6';

   export const options = {
     stages: [
       { duration: '2m', target: 10 },  // Ramp up to 10 users
       { duration: '5m', target: 10 },  // Stay at 10 users
       { duration: '2m', target: 50 },  // Ramp up to 50 users
       { duration: '5m', target: 50 },  // Stay at 50 users
       { duration: '2m', target: 0 },   // Ramp down
     ],
   };

   export default function () {
     // Test mission endpoints
     const res = http.get('http://localhost:5001/api/expedition-missions/next');

     check(res, {
       'status is 200': (r) => r.status === 200,
       'response time < 500ms': (r) => r.timings.duration < 500,
     });

     sleep(1);
   }

   # Run load test
   k6 run tests/load/mission-flow.js
   ```

5. **Create Launch Checklist** (2 hours)
   ```markdown
   # docs/launch-checklist.md

   # GoalConnect Launch Checklist

   ## Pre-Launch (1 Week Before)

   - [ ] All tests passing
   - [ ] Zero TypeScript errors
   - [ ] Zero ESLint errors
   - [ ] Security audit completed
   - [ ] Performance audit completed (all pages >90)
   - [ ] Cross-browser testing completed
   - [ ] Load testing completed
   - [ ] Backups configured and tested
   - [ ] Monitoring configured (Sentry)
   - [ ] Analytics configured (PostHog)
   - [ ] Documentation completed
   - [ ] API documentation published
   - [ ] User guide published

   ## Environment Setup

   - [ ] Production database created
   - [ ] Environment variables configured
   - [ ] SSL certificates installed
   - [ ] CDN configured
   - [ ] Backups scheduled
   - [ ] Alerts configured

   ## Launch Day

   - [ ] Run database migrations
   - [ ] Deploy application
   - [ ] Verify all endpoints working
   - [ ] Check error tracking
   - [ ] Monitor performance
   - [ ] Test critical user flows
   - [ ] Announce launch

   ## Post-Launch (Week 1)

   - [ ] Monitor error rates
   - [ ] Monitor performance metrics
   - [ ] Review user feedback
   - [ ] Check analytics
   - [ ] Fix any critical bugs
   - [ ] Plan next iteration
   ```

6. **Final Code Review** (2 hours)
   ```bash
   # Review all changes since start of roadmap
   git log --oneline --since="6 weeks ago"

   # Ensure:
   # - No console.logs in production code
   # - No commented out code
   # - No TODO comments
   # - All functions documented
   # - All components have proper TypeScript types
   ```

**Verification:**
```bash
# Run full test suite
npm test

# Check TypeScript
npx tsc --noEmit

# Check linting
npm run lint

# Build for production
npm run build

# Verify build output
# Check bundle sizes
# Test production build locally
```

---

## Summary Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Critical Blockers** | 3 weeks | Zero TS errors, passing tests, security fixes, error handling, DB optimization, monitoring |
| **Phase 2: Major Issues** | 3 weeks | Performance optimization, accessibility, mobile responsiveness, code quality |
| **Phase 3: Polish** | 2 weeks | UX polish, analytics, onboarding, documentation |

**Total: 8 weeks**

## Success Metrics

### Code Quality
- ✅ 0 TypeScript errors
- ✅ >80% test coverage
- ✅ <5% code duplication
- ✅ All ESLint rules passing

### Security
- ✅ 0 high/critical vulnerabilities
- ✅ Input validation on all endpoints
- ✅ Rate limiting configured
- ✅ CSRF protection enabled

### Performance
- ✅ Lighthouse score >90 (all categories)
- ✅ Main bundle <200KB gzipped
- ✅ API response time <500ms (p95)
- ✅ Database queries <100ms (p95)

### Accessibility
- ✅ WCAG 2.1 AA compliant
- ✅ Keyboard navigation working
- ✅ Screen reader compatible
- ✅ Color contrast >4.5:1

### User Experience
- ✅ Mobile responsive (all screen sizes)
- ✅ Loading states everywhere
- ✅ Empty states designed
- ✅ Error messages user-friendly
- ✅ Onboarding flow complete

### DevOps
- ✅ CI/CD pipeline working
- ✅ Automated backups
- ✅ Error tracking configured
- ✅ Performance monitoring
- ✅ Health checks implemented

## Next Steps After Launch

1. **Week 1**: Monitor closely, fix critical bugs
2. **Week 2-4**: Gather user feedback, iterate on UX
3. **Month 2**: Implement Phase 2 features from design doc
4. **Month 3**: Scale infrastructure as needed

---

**Remember**: This roadmap is ambitious but achievable. Prioritize ruthlessly, ask for help when needed, and don't be afraid to cut scope if timelines slip. The goal is a solid, professional product - not perfection.

Good luck! 🚀
