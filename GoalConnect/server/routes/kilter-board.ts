/**
 * Kilter Board Import Routes
 *
 * Handles connecting to Kilter Board accounts and importing climbing session data.
 */

import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { climbingSessions, dataSourceConnections } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireUser } from "../simple-auth";
import {
  KilterBoardClient,
  KilterBoardError,
} from "../importers/kilter-board-client";
import { log } from "../lib/logger";
import {
  groupIntoSessions,
  toClimbingSessionInsert,
} from "../importers/kilter-board-parser";

const getUserId = (req: Request) => requireUser(req).id;

// Simple encryption for credentials (in production, use proper encryption)
function encryptCredentials(credentials: { token: string; kilterUserId: number }): string {
  return Buffer.from(JSON.stringify(credentials)).toString("base64");
}

function decryptCredentials(encrypted: string): { token: string; kilterUserId: number } {
  return JSON.parse(Buffer.from(encrypted, "base64").toString("utf-8"));
}

export function registerKilterBoardRoutes(app: Express) {
  const client = new KilterBoardClient();

  /**
   * POST /api/import/kilter-board/connect
   * Connect a Kilter Board account and perform initial sync
   *
   * Body:
   *   - username: Kilter Board username/email
   *   - password: Kilter Board password
   *   - syncFrequency: 'manual' | 'daily' | 'weekly' (optional)
   *   - autoCompleteHabits: boolean (optional)
   */
  app.post(
    "/api/import/kilter-board/connect",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        const { username, password, syncFrequency, autoCompleteHabits } = req.body;

        if (!username || !password) {
          return res.status(400).json({
            error: "Username and password are required",
          });
        }

        // Authenticate with Kilter Board
        let loginResult;
        try {
          loginResult = await client.login(username, password);
        } catch (error) {
          if (error instanceof KilterBoardError) {
            // 401 or 422 = invalid credentials
            const isAuthError = error.statusCode === 401 || error.statusCode === 422;
            return res.status(isAuthError ? 401 : 400).json({
              error: "Invalid Kilter Board credentials",
              details: error.message,
            });
          }
          throw error;
        }

        const db = getDb();

        // Check if connection already exists
        const [existing] = await db
          .select()
          .from(dataSourceConnections)
          .where(
            and(
              eq(dataSourceConnections.userId, userId),
              eq(dataSourceConnections.sourceType, "kilter_board")
            )
          )
          .limit(1);

        // Encrypt and store credentials
        const encryptedCreds = encryptCredentials({
          token: loginResult.token,
          kilterUserId: loginResult.userId,
        });

        if (existing) {
          // Update existing connection
          await db
            .update(dataSourceConnections)
            .set({
              isActive: true,
              credentials: { encrypted: encryptedCreds },
              syncFrequency: syncFrequency || "manual",
              autoCompleteHabits: autoCompleteHabits ?? true,
              syncStatus: "idle",
              syncError: null,
              updatedAt: new Date(),
            })
            .where(eq(dataSourceConnections.id, existing.id));
        } else {
          // Create new connection
          await db.insert(dataSourceConnections).values({
            userId,
            sourceType: "kilter_board",
            isActive: true,
            credentials: { encrypted: encryptedCreds },
            syncFrequency: syncFrequency || "manual",
            autoCompleteHabits: autoCompleteHabits ?? true,
            syncStatus: "idle",
          });
        }

        // Perform initial sync
        const syncResult = await performSync(
          db,
          client,
          userId,
          loginResult.token,
          loginResult.userId
        );

        res.json({
          success: true,
          connection: {
            sourceType: "kilter_board",
            kilterUserId: loginResult.userId,
            username: loginResult.username,
          },
          initialSync: syncResult,
        });
      } catch (error) {
        log.error("[kilter-board] Connect error:", error);
        res.status(500).json({
          error: "Failed to connect Kilter Board account",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  /**
   * POST /api/import/kilter-board/sync
   * Manually trigger a sync with Kilter Board
   *
   * Query params:
   *   - since: ISO date string for incremental sync (optional)
   */
  app.post(
    "/api/import/kilter-board/sync",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        const db = getDb();

        // Get connection with credentials
        const [connection] = await db
          .select()
          .from(dataSourceConnections)
          .where(
            and(
              eq(dataSourceConnections.userId, userId),
              eq(dataSourceConnections.sourceType, "kilter_board")
            )
          )
          .limit(1);

        if (!connection || !connection.isActive) {
          return res.status(404).json({
            error: "No active Kilter Board connection found",
          });
        }

        if (!connection.credentials) {
          return res.status(400).json({
            error: "Connection credentials not found. Please reconnect.",
          });
        }

        // Update sync status
        await db
          .update(dataSourceConnections)
          .set({ syncStatus: "syncing", updatedAt: new Date() })
          .where(eq(dataSourceConnections.id, connection.id));

        try {
          const creds = decryptCredentials(
            (connection.credentials as { encrypted: string }).encrypted
          );

          // Validate token is still valid
          const isValid = await client.validateToken(creds.token);
          if (!isValid) {
            await db
              .update(dataSourceConnections)
              .set({
                syncStatus: "error",
                syncError: "Token expired. Please reconnect.",
                updatedAt: new Date(),
              })
              .where(eq(dataSourceConnections.id, connection.id));

            return res.status(401).json({
              error: "Kilter Board token expired. Please reconnect your account.",
            });
          }

          // Determine sync start date
          const since = req.query.since
            ? new Date(req.query.since as string)
            : connection.lastSyncAt || undefined;

          const syncResult = await performSync(
            db,
            client,
            userId,
            creds.token,
            creds.kilterUserId,
            since
          );

          // Update connection status
          await db
            .update(dataSourceConnections)
            .set({
              syncStatus: "idle",
              syncError: null,
              lastSyncAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(dataSourceConnections.id, connection.id));

          res.json({
            success: true,
            sync: syncResult,
          });
        } catch (syncError) {
          // Update connection with error
          await db
            .update(dataSourceConnections)
            .set({
              syncStatus: "error",
              syncError:
                syncError instanceof Error
                  ? syncError.message
                  : "Sync failed",
              updatedAt: new Date(),
            })
            .where(eq(dataSourceConnections.id, connection.id));

          throw syncError;
        }
      } catch (error) {
        log.error("[kilter-board] Sync error:", error);
        res.status(500).json({
          error: "Failed to sync with Kilter Board",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  /**
   * DELETE /api/import/kilter-board/disconnect
   * Disconnect Kilter Board account
   */
  app.delete(
    "/api/import/kilter-board/disconnect",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        const db = getDb();

        const result = await db
          .delete(dataSourceConnections)
          .where(
            and(
              eq(dataSourceConnections.userId, userId),
              eq(dataSourceConnections.sourceType, "kilter_board")
            )
          )
          .returning({ id: dataSourceConnections.id });

        if (result.length === 0) {
          return res.status(404).json({
            error: "No Kilter Board connection found",
          });
        }

        res.json({
          success: true,
          message: "Kilter Board account disconnected",
        });
      } catch (error) {
        log.error("[kilter-board] Disconnect error:", error);
        res.status(500).json({
          error: "Failed to disconnect Kilter Board account",
        });
      }
    }
  );

  /**
   * GET /api/import/kilter-board/status
   * Get Kilter Board connection status
   */
  app.get(
    "/api/import/kilter-board/status",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        const db = getDb();

        const [connection] = await db
          .select({
            id: dataSourceConnections.id,
            isActive: dataSourceConnections.isActive,
            lastSyncAt: dataSourceConnections.lastSyncAt,
            syncStatus: dataSourceConnections.syncStatus,
            syncError: dataSourceConnections.syncError,
            syncFrequency: dataSourceConnections.syncFrequency,
            autoCompleteHabits: dataSourceConnections.autoCompleteHabits,
            createdAt: dataSourceConnections.createdAt,
          })
          .from(dataSourceConnections)
          .where(
            and(
              eq(dataSourceConnections.userId, userId),
              eq(dataSourceConnections.sourceType, "kilter_board")
            )
          )
          .limit(1);

        if (!connection) {
          return res.json({
            connected: false,
          });
        }

        res.json({
          connected: connection.isActive,
          ...connection,
        });
      } catch (error) {
        log.error("[kilter-board] Status error:", error);
        res.status(500).json({
          error: "Failed to get Kilter Board status",
        });
      }
    }
  );

  /**
   * GET /api/import/kilter-board/sessions
   * Get imported climbing sessions
   *
   * Query params:
   *   - startDate: YYYY-MM-DD - filter sessionDate >= startDate
   *   - endDate: YYYY-MM-DD - filter sessionDate <= endDate
   *   - countOnly: boolean - return aggregated { totalSessions, totalProblemsSent } instead of records
   *   - limit: Number of results (default 50)
   *   - offset: Pagination offset (default 0)
   */
  app.get(
    "/api/import/kilter-board/sessions",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        const db = getDb();

        const countOnly = req.query.countOnly === "true";
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const offset = parseInt(req.query.offset as string) || 0;

        // Build filter conditions
        const conditions: ReturnType<typeof eq>[] = [
          eq(climbingSessions.userId, userId),
          eq(climbingSessions.sourceType, "kilter_board"),
        ];

        // Filter by start date (sessionDate is YYYY-MM-DD string)
        if (req.query.startDate) {
          conditions.push(sql`${climbingSessions.sessionDate} >= ${req.query.startDate}`);
        }

        // Filter by end date
        if (req.query.endDate) {
          conditions.push(sql`${climbingSessions.sessionDate} <= ${req.query.endDate}`);
        }

        const whereClause = and(...conditions);

        // Count-only mode: return aggregated stats
        if (countOnly) {
          const [result] = await db
            .select({
              totalSessions: sql<number>`count(*)`,
              totalProblemsSent: sql<number>`COALESCE(sum(${climbingSessions.problemsSent}), 0)`,
              totalProblemsAttempted: sql<number>`COALESCE(sum(${climbingSessions.problemsAttempted}), 0)`,
            })
            .from(climbingSessions)
            .where(whereClause);

          return res.json({
            totalSessions: Number(result.totalSessions),
            totalProblemsSent: Number(result.totalProblemsSent),
            totalProblemsAttempted: Number(result.totalProblemsAttempted),
          });
        }

        // Full query with pagination
        const sessions = await db
          .select()
          .from(climbingSessions)
          .where(whereClause)
          .orderBy(desc(climbingSessions.sessionDate))
          .limit(limit)
          .offset(offset);

        // Get total count with same filters
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(climbingSessions)
          .where(whereClause);

        res.json({
          sessions,
          pagination: {
            total: Number(countResult.count),
            limit,
            offset,
            hasMore: offset + sessions.length < Number(countResult.count),
          },
        });
      } catch (error) {
        log.error("[kilter-board] Error fetching sessions:", error);
        res.status(500).json({
          error: "Failed to fetch climbing sessions",
        });
      }
    }
  );

  /**
   * GET /api/import/kilter-board/sessions/:id
   * Get a single climbing session by ID
   */
  app.get(
    "/api/import/kilter-board/sessions/:id",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        const sessionId = parseInt(req.params.id, 10);

        if (isNaN(sessionId)) {
          return res.status(400).json({ error: "Invalid session ID" });
        }

        const db = getDb();
        const [session] = await db
          .select()
          .from(climbingSessions)
          .where(
            and(
              eq(climbingSessions.id, sessionId),
              eq(climbingSessions.userId, userId)
            )
          )
          .limit(1);

        if (!session) {
          return res.status(404).json({ error: "Session not found" });
        }

        res.json(session);
      } catch (error) {
        log.error("[kilter-board] Error fetching session:", error);
        res.status(500).json({ error: "Failed to fetch session" });
      }
    }
  );

  /**
   * GET /api/import/kilter-board/stats
   * Get Kilter Board climbing statistics
   */
  app.get(
    "/api/import/kilter-board/stats",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        const db = getDb();

        const stats = await db
          .select({
            totalSessions: sql<number>`count(*)`,
            totalProblemsSent: sql<number>`sum(${climbingSessions.problemsSent})`,
            totalProblemsAttempted: sql<number>`sum(${climbingSessions.problemsAttempted})`,
            avgProblemsPerSession: sql<number>`avg(${climbingSessions.problemsSent})`,
          })
          .from(climbingSessions)
          .where(
            and(
              eq(climbingSessions.userId, userId),
              eq(climbingSessions.sourceType, "kilter_board")
            )
          );

        // Get grade distribution
        const sessions = await db
          .select({
            maxGrade: climbingSessions.maxGrade,
          })
          .from(climbingSessions)
          .where(
            and(
              eq(climbingSessions.userId, userId),
              eq(climbingSessions.sourceType, "kilter_board")
            )
          );

        // Count grades
        const gradeDistribution: Record<string, number> = {};
        for (const session of sessions) {
          if (session.maxGrade) {
            gradeDistribution[session.maxGrade] =
              (gradeDistribution[session.maxGrade] || 0) + 1;
          }
        }

        res.json({
          summary: stats[0],
          gradeDistribution,
        });
      } catch (error) {
        log.error("[kilter-board] Error fetching stats:", error);
        res.status(500).json({
          error: "Failed to fetch statistics",
        });
      }
    }
  );
}

/**
 * Perform a sync and import sessions
 */
async function performSync(
  db: ReturnType<typeof getDb>,
  client: KilterBoardClient,
  userId: number,
  token: string,
  kilterUserId: number,
  since?: Date
): Promise<{
  sessionsImported: number;
  sessionsSkipped: number;
  totalAscents: number;
  totalAttempts: number;
}> {
  // Fetch data from Kilter Board
  const data = await client.getUserClimbingData(token, kilterUserId, {
    since,
  });

  // Group into sessions
  const sessions = groupIntoSessions(
    data.ascents,
    data.attempts,
    data.climbs,
    kilterUserId
  );

  let imported = 0;
  let skipped = 0;

  for (const session of sessions) {
    const insertData = toClimbingSessionInsert(session, userId);

    // Check if session already exists (deduplication)
    const [existing] = await db
      .select({ id: climbingSessions.id })
      .from(climbingSessions)
      .where(
        and(
          eq(climbingSessions.userId, userId),
          eq(climbingSessions.sourceType, "kilter_board"),
          eq(climbingSessions.externalId, insertData.externalId)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing session with new data
      await db
        .update(climbingSessions)
        .set({
          problemsAttempted: insertData.problemsAttempted,
          problemsSent: insertData.problemsSent,
          averageGrade: insertData.averageGrade,
          maxGrade: insertData.maxGrade,
          boardAngle: insertData.boardAngle,
          climbs: insertData.climbs,
          durationMinutes: insertData.durationMinutes,
        })
        .where(eq(climbingSessions.id, existing.id));
      skipped++;
    } else {
      // Insert new session
      await db.insert(climbingSessions).values({
        userId: insertData.userId,
        sourceType: insertData.sourceType,
        externalId: insertData.externalId,
        sessionDate: insertData.sessionDate,
        sessionStartTime: insertData.sessionStartTime,
        durationMinutes: insertData.durationMinutes,
        problemsAttempted: insertData.problemsAttempted,
        problemsSent: insertData.problemsSent,
        averageGrade: insertData.averageGrade,
        maxGrade: insertData.maxGrade,
        boardAngle: insertData.boardAngle,
        climbs: insertData.climbs,
      });
      imported++;
    }
  }

  return {
    sessionsImported: imported,
    sessionsSkipped: skipped,
    totalAscents: data.ascents.length,
    totalAttempts: data.attempts.length,
  };
}
