/**
 * Strava Import Routes
 *
 * Handles OAuth authentication and syncing activity data from Strava.
 */

import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "../db";
import { dataSourceConnections, externalWorkouts } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireUser } from "../simple-auth";
import {
  StravaClient,
  StravaError,
  type StravaTokenResponse,
} from "../importers/strava-client";
import {
  parseStravaActivity,
  parseAthleteStats,
} from "../importers/strava-parser";
import { log } from "../lib/logger";

const getUserId = (req: Request) => requireUser(req).id;

// Environment variables for Strava OAuth
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || "";
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || "";
const STRAVA_REDIRECT_URI =
  process.env.STRAVA_REDIRECT_URI ||
  `${process.env.APP_URL || "http://localhost:5001"}/api/import/strava/callback`;

// In-memory state store for OAuth (in production, use Redis or DB)
const oauthStateStore = new Map<
  string,
  { userId: number; createdAt: number }
>();

// Cleanup old states every 5 minutes
setInterval(
  () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    oauthStateStore.forEach((data, state) => {
      if (data.createdAt < fiveMinutesAgo) {
        oauthStateStore.delete(state);
      }
    });
  },
  5 * 60 * 1000
);

// Simple encryption for credentials
function encryptCredentials(credentials: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number;
}): string {
  return Buffer.from(JSON.stringify(credentials)).toString("base64");
}

function decryptCredentials(encrypted: string): {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number;
} {
  return JSON.parse(Buffer.from(encrypted, "base64").toString("utf-8"));
}

export function registerStravaRoutes(app: Express) {
  // Create client - will validate config on first use
  const getClient = () => {
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      throw new Error(
        "Strava OAuth not configured. Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET."
      );
    }
    return new StravaClient({
      clientId: STRAVA_CLIENT_ID,
      clientSecret: STRAVA_CLIENT_SECRET,
      redirectUri: STRAVA_REDIRECT_URI,
    });
  };

  /**
   * GET /api/import/strava/auth
   * Get the OAuth authorization URL to redirect the user
   */
  app.get("/api/import/strava/auth", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);

      // Generate a secure random state
      const state = crypto.randomBytes(32).toString("hex");

      // Store state with user ID for verification
      oauthStateStore.set(state, { userId, createdAt: Date.now() });

      const client = getClient();
      const authUrl = client.getAuthorizationUrl(state);

      res.json({
        authUrl,
        expiresIn: 300, // 5 minutes
      });
    } catch (error) {
      log.error("[strava] Auth URL error:", error);
      res.status(500).json({
        error: "Failed to generate authorization URL",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * GET /api/import/strava/callback
   * OAuth callback handler - exchanges code for tokens
   */
  app.get("/api/import/strava/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, error: oauthError } = req.query;

      // Check for OAuth errors
      if (oauthError) {
        log.warn("[strava] OAuth error:", oauthError);
        return res.redirect(
          `/settings/imports?error=${encodeURIComponent(oauthError as string)}`
        );
      }

      if (!code || !state) {
        return res.redirect("/settings/imports?error=missing_params");
      }

      // Verify state
      const stateData = oauthStateStore.get(state as string);
      if (!stateData) {
        return res.redirect("/settings/imports?error=invalid_state");
      }

      // Clean up state
      oauthStateStore.delete(state as string);

      // Check state expiration (5 minutes)
      if (Date.now() - stateData.createdAt > 5 * 60 * 1000) {
        return res.redirect("/settings/imports?error=state_expired");
      }

      const userId = stateData.userId;
      const client = getClient();

      // Exchange code for tokens
      let tokenResponse: StravaTokenResponse;
      try {
        tokenResponse = await client.exchangeCodeForTokens(code as string);
      } catch (error) {
        log.error("[strava] Token exchange error:", error);
        return res.redirect("/settings/imports?error=token_exchange_failed");
      }

      const db = getDb();

      // Check if connection already exists
      const [existing] = await db
        .select()
        .from(dataSourceConnections)
        .where(
          and(
            eq(dataSourceConnections.userId, userId),
            eq(dataSourceConnections.sourceType, "strava")
          )
        )
        .limit(1);

      // Encrypt and store credentials
      const encryptedCreds = encryptCredentials({
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: tokenResponse.expires_at,
        athleteId: tokenResponse.athlete.id,
      });

      if (existing) {
        // Update existing connection
        await db
          .update(dataSourceConnections)
          .set({
            isActive: true,
            credentials: { encrypted: encryptedCreds },
            syncStatus: "idle",
            syncError: null,
            updatedAt: new Date(),
          })
          .where(eq(dataSourceConnections.id, existing.id));
      } else {
        // Create new connection
        await db.insert(dataSourceConnections).values({
          userId,
          sourceType: "strava",
          isActive: true,
          credentials: { encrypted: encryptedCreds },
          syncFrequency: "manual",
          autoCompleteHabits: true,
          syncStatus: "idle",
        });
      }

      // Perform initial sync
      await performSync(db, client, userId, tokenResponse);

      // Redirect to success page
      res.redirect("/settings/imports?strava=connected");
    } catch (error) {
      log.error("[strava] Callback error:", error);
      res.redirect("/settings/imports?error=callback_failed");
    }
  });

  /**
   * POST /api/import/strava/sync
   * Manually trigger a sync with Strava
   */
  app.post("/api/import/strava/sync", async (req: Request, res: Response) => {
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
            eq(dataSourceConnections.sourceType, "strava")
          )
        )
        .limit(1);

      if (!connection || !connection.isActive) {
        return res.status(404).json({
          error: "No active Strava connection found",
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
        const client = getClient();
        const creds = decryptCredentials(
          (connection.credentials as { encrypted: string }).encrypted
        );

        // Check if token needs refresh
        let accessToken = creds.accessToken;
        if (client.isTokenExpired(creds.expiresAt, 300)) {
          // 5 min buffer
          const newTokens = await client.refreshAccessToken(creds.refreshToken);

          // Update stored credentials
          const newEncryptedCreds = encryptCredentials({
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token,
            expiresAt: newTokens.expires_at,
            athleteId: creds.athleteId,
          });

          await db
            .update(dataSourceConnections)
            .set({
              credentials: { encrypted: newEncryptedCreds },
              updatedAt: new Date(),
            })
            .where(eq(dataSourceConnections.id, connection.id));

          accessToken = newTokens.access_token;
        }

        // Perform sync
        const syncResult = await performSync(
          db,
          client,
          userId,
          {
            access_token: accessToken,
            athlete: { id: creds.athleteId },
          } as StravaTokenResponse,
          connection.lastSyncAt || undefined
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
              syncError instanceof Error ? syncError.message : "Sync failed",
            updatedAt: new Date(),
          })
          .where(eq(dataSourceConnections.id, connection.id));

        throw syncError;
      }
    } catch (error) {
      log.error("[strava] Sync error:", error);
      res.status(500).json({
        error: "Failed to sync with Strava",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * DELETE /api/import/strava/disconnect
   * Disconnect Strava account
   */
  app.delete(
    "/api/import/strava/disconnect",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        const db = getDb();

        // Get connection to revoke access
        const [connection] = await db
          .select()
          .from(dataSourceConnections)
          .where(
            and(
              eq(dataSourceConnections.userId, userId),
              eq(dataSourceConnections.sourceType, "strava")
            )
          )
          .limit(1);

        if (connection?.credentials) {
          try {
            const client = getClient();
            const creds = decryptCredentials(
              (connection.credentials as { encrypted: string }).encrypted
            );
            await client.revokeAccess(creds.accessToken);
          } catch (revokeError) {
            // Log but don't fail - we still want to remove local connection
            log.warn("[strava] Failed to revoke access:", revokeError);
          }
        }

        const result = await db
          .delete(dataSourceConnections)
          .where(
            and(
              eq(dataSourceConnections.userId, userId),
              eq(dataSourceConnections.sourceType, "strava")
            )
          )
          .returning({ id: dataSourceConnections.id });

        if (result.length === 0) {
          return res.status(404).json({
            error: "No Strava connection found",
          });
        }

        res.json({
          success: true,
          message: "Strava account disconnected",
        });
      } catch (error) {
        log.error("[strava] Disconnect error:", error);
        res.status(500).json({
          error: "Failed to disconnect Strava account",
        });
      }
    }
  );

  /**
   * GET /api/import/strava/status
   * Get Strava connection status
   */
  app.get("/api/import/strava/status", async (req: Request, res: Response) => {
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
            eq(dataSourceConnections.sourceType, "strava")
          )
        )
        .limit(1);

      if (!connection) {
        return res.json({
          connected: false,
          configured: Boolean(STRAVA_CLIENT_ID && STRAVA_CLIENT_SECRET),
        });
      }

      res.json({
        connected: connection.isActive,
        configured: true,
        ...connection,
      });
    } catch (error) {
      log.error("[strava] Status error:", error);
      res.status(500).json({
        error: "Failed to get Strava status",
      });
    }
  });

  /**
   * GET /api/import/strava/activities
   * Get imported Strava activities
   */
  app.get(
    "/api/import/strava/activities",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        const db = getDb();

        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const offset = parseInt(req.query.offset as string) || 0;

        const activities = await db
          .select()
          .from(externalWorkouts)
          .where(
            and(
              eq(externalWorkouts.userId, userId),
              eq(externalWorkouts.sourceType, "strava")
            )
          )
          .orderBy(desc(externalWorkouts.startTime))
          .limit(limit)
          .offset(offset);

        // Get total count
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(externalWorkouts)
          .where(
            and(
              eq(externalWorkouts.userId, userId),
              eq(externalWorkouts.sourceType, "strava")
            )
          );

        res.json({
          activities,
          pagination: {
            total: Number(countResult.count),
            limit,
            offset,
            hasMore: offset + activities.length < Number(countResult.count),
          },
        });
      } catch (error) {
        log.error("[strava] Error fetching activities:", error);
        res.status(500).json({
          error: "Failed to fetch activities",
        });
      }
    }
  );

  /**
   * GET /api/import/strava/stats
   * Get Strava athlete statistics
   */
  app.get("/api/import/strava/stats", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      // Get connection
      const [connection] = await db
        .select()
        .from(dataSourceConnections)
        .where(
          and(
            eq(dataSourceConnections.userId, userId),
            eq(dataSourceConnections.sourceType, "strava")
          )
        )
        .limit(1);

      if (!connection || !connection.isActive || !connection.credentials) {
        return res.status(404).json({
          error: "No active Strava connection",
        });
      }

      const client = getClient();
      const creds = decryptCredentials(
        (connection.credentials as { encrypted: string }).encrypted
      );

      // Check if token needs refresh
      let accessToken = creds.accessToken;
      if (client.isTokenExpired(creds.expiresAt, 300)) {
        const newTokens = await client.refreshAccessToken(creds.refreshToken);

        const newEncryptedCreds = encryptCredentials({
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          expiresAt: newTokens.expires_at,
          athleteId: creds.athleteId,
        });

        await db
          .update(dataSourceConnections)
          .set({
            credentials: { encrypted: newEncryptedCreds },
            updatedAt: new Date(),
          })
          .where(eq(dataSourceConnections.id, connection.id));

        accessToken = newTokens.access_token;
      }

      // Fetch athlete stats
      const rawStats = await client.getAthleteStats(accessToken, creds.athleteId);
      const stats = parseAthleteStats(rawStats);

      // Also get local stats from our database
      const localStats = await db
        .select({
          totalActivities: sql<number>`count(*)`,
          totalDuration: sql<number>`sum(${externalWorkouts.durationMinutes})`,
          totalCalories: sql<number>`sum(${externalWorkouts.caloriesBurned})`,
        })
        .from(externalWorkouts)
        .where(
          and(
            eq(externalWorkouts.userId, userId),
            eq(externalWorkouts.sourceType, "strava")
          )
        );

      res.json({
        strava: stats,
        local: localStats[0],
      });
    } catch (error) {
      log.error("[strava] Error fetching stats:", error);
      if (error instanceof StravaError && error.statusCode === 401) {
        return res.status(401).json({
          error: "Strava token expired. Please reconnect.",
        });
      }
      res.status(500).json({
        error: "Failed to fetch statistics",
      });
    }
  });
}

/**
 * Perform a sync and import activities
 */
async function performSync(
  db: ReturnType<typeof getDb>,
  client: StravaClient,
  userId: number,
  tokens: StravaTokenResponse | { access_token: string; athlete: { id: number } },
  since?: Date
): Promise<{
  activitiesImported: number;
  activitiesSkipped: number;
  totalFetched: number;
}> {
  const accessToken = tokens.access_token;

  // Fetch activities from Strava
  const activities = await client.getActivities(accessToken, {
    after: since,
    perPage: 100,
  });

  let imported = 0;
  let skipped = 0;

  for (const activity of activities) {
    const parsed = parseStravaActivity(activity, userId);

    // Check if activity already exists (deduplication)
    const [existing] = await db
      .select({ id: externalWorkouts.id })
      .from(externalWorkouts)
      .where(
        and(
          eq(externalWorkouts.userId, userId),
          eq(externalWorkouts.sourceType, "strava"),
          eq(externalWorkouts.externalId, parsed.externalId)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing activity
      await db
        .update(externalWorkouts)
        .set({
          workoutType: parsed.workoutType,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          durationMinutes: parsed.durationMinutes,
          heartRateAvg: parsed.heartRateAvg,
          heartRateMax: parsed.heartRateMax,
          caloriesBurned: parsed.caloriesBurned,
          distanceKm: parsed.distanceKm,
          metadata: parsed.metadata,
        })
        .where(eq(externalWorkouts.id, existing.id));
      skipped++;
    } else {
      // Insert new activity
      await db.insert(externalWorkouts).values({
        userId: parsed.userId,
        sourceType: parsed.sourceType,
        externalId: parsed.externalId,
        workoutType: parsed.workoutType,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        durationMinutes: parsed.durationMinutes,
        heartRateAvg: parsed.heartRateAvg,
        heartRateMax: parsed.heartRateMax,
        caloriesBurned: parsed.caloriesBurned,
        distanceKm: parsed.distanceKm,
        metadata: parsed.metadata,
      });
      imported++;
    }
  }

  return {
    activitiesImported: imported,
    activitiesSkipped: skipped,
    totalFetched: activities.length,
  };
}
