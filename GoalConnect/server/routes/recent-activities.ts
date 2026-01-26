/**
 * Recent Outdoor Activities API
 * Combines outdoor_adventures and outdoor_climbing_ticks into unified feed
 */

import type { Express } from "express";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export interface RecentActivity {
  id: number;
  date: string;
  type: "adventure" | "climbing_day";
  activity: string;
  location: string | null;
  photoPath: string | null;
  thumbPath: string | null;
  notes: string | null;
}

/**
 * Register recent outdoor activities routes
 */
export function registerRecentActivitiesRoutes(app: Express) {
  /**
   * GET /api/recent-outdoor-activities
   * Returns combined list of adventures and climbing days, sorted by date desc
   */
  app.get("/api/recent-outdoor-activities", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit as string) || 4, 20);
      const db = getDb();

      // Combine outdoor_adventures and outdoor_climbing_ticks
      const result = await db.execute(sql`
        SELECT * FROM (
          SELECT
            id,
            date::text,
            'adventure' as type,
            activity,
            location,
            photo_path as "photoPath",
            thumb_path as "thumbPath",
            notes
          FROM outdoor_adventures
          WHERE user_id = ${userId}

          UNION ALL

          SELECT
            id,
            date::text,
            'climbing_day' as type,
            COALESCE(notes, 'Outdoor climbing day') as activity,
            location,
            NULL as "photoPath",
            NULL as "thumbPath",
            notes
          FROM outdoor_climbing_ticks
          WHERE user_id = ${userId}
        ) combined
        ORDER BY date DESC
        LIMIT ${limit}
      `);

      res.json(result.rows as unknown as RecentActivity[]);
    } catch (error) {
      next(error);
    }
  });
}
