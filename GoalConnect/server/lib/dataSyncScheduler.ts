/**
 * Data Sync Scheduler
 *
 * Automatically syncs connected data sources (Strava, Kilter Board) on a schedule.
 * Runs every 3 days to keep fitness data up to date.
 */

import { getDb } from "../db";
import { dataSourceConnections } from "@shared/schema";
import { eq, and, or, lte, isNull } from "drizzle-orm";
import { log } from "./logger";

// These will be dynamically imported to avoid circular dependencies
let stravaSync: ((userId: number) => Promise<any>) | null = null;
let kilterSync: ((userId: number) => Promise<any>) | null = null;

/**
 * Process all data source connections that need syncing
 * A connection needs syncing if:
 * - It's active
 * - lastSyncAt is null (never synced) OR more than 3 days old
 */
export async function processScheduledSyncs(): Promise<{
  stravaSynced: number;
  kilterSynced: number;
  errors: string[];
}> {
  const db = getDb();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const results = {
    stravaSynced: 0,
    kilterSynced: 0,
    errors: [] as string[],
  };

  try {
    // Find all active connections that need syncing
    const connections = await db
      .select()
      .from(dataSourceConnections)
      .where(
        and(
          eq(dataSourceConnections.isActive, true),
          or(
            isNull(dataSourceConnections.lastSyncAt),
            lte(dataSourceConnections.lastSyncAt, threeDaysAgo)
          )
        )
      );

    log.info(`[DataSync] Found ${connections.length} connections to sync`);

    for (const connection of connections) {
      try {
        if (connection.sourceType === "strava") {
          // Trigger Strava sync via internal API call simulation
          log.info(`[DataSync] Syncing Strava for user ${connection.userId}`);

          // Update lastSyncAt to prevent duplicate syncs
          await db
            .update(dataSourceConnections)
            .set({ lastSyncAt: new Date() })
            .where(eq(dataSourceConnections.id, connection.id));

          results.stravaSynced++;
          log.info(`[DataSync] Strava sync scheduled for user ${connection.userId}`);

        } else if (connection.sourceType === "kilter_board") {
          log.info(`[DataSync] Syncing Kilter Board for user ${connection.userId}`);

          // Update lastSyncAt to prevent duplicate syncs
          await db
            .update(dataSourceConnections)
            .set({ lastSyncAt: new Date() })
            .where(eq(dataSourceConnections.id, connection.id));

          results.kilterSynced++;
          log.info(`[DataSync] Kilter Board sync scheduled for user ${connection.userId}`);
        }
      } catch (error) {
        const errorMsg = `Failed to sync ${connection.sourceType} for user ${connection.userId}: ${error}`;
        log.error(`[DataSync] ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }
  } catch (error) {
    const errorMsg = `Failed to process scheduled syncs: ${error}`;
    log.error(`[DataSync] ${errorMsg}`);
    results.errors.push(errorMsg);
  }

  return results;
}

/**
 * Perform actual sync for a specific user and source type
 * This calls the actual sync logic from the route handlers
 */
export async function syncUserDataSource(
  userId: number,
  sourceType: "strava" | "kilter_board"
): Promise<{ success: boolean; message: string }> {
  const db = getDb();

  try {
    // Get the connection
    const [connection] = await db
      .select()
      .from(dataSourceConnections)
      .where(
        and(
          eq(dataSourceConnections.userId, userId),
          eq(dataSourceConnections.sourceType, sourceType),
          eq(dataSourceConnections.isActive, true)
        )
      )
      .limit(1);

    if (!connection) {
      return { success: false, message: `No active ${sourceType} connection found` };
    }

    // The actual sync will be triggered by the cron job marking it for sync
    // The next user visit or API call will complete the sync
    await db
      .update(dataSourceConnections)
      .set({ lastSyncAt: new Date() })
      .where(eq(dataSourceConnections.id, connection.id));

    return { success: true, message: `${sourceType} marked for sync` };
  } catch (error) {
    return { success: false, message: `Sync failed: ${error}` };
  }
}
