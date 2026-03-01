import type { Express } from "express";
import { requireUser } from "../simple-auth";
import { getDb } from "../db";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  wellnessWheelState,
  wellnessWheelHistory,
  wellnessWheelActivities,
} from "@shared/schema";
import { z } from "zod";
import { log } from "../lib/logger";

const getUserId = (req: any) => requireUser(req).id;

// Validation schemas
const stateSchema = z.object({
  cupLevels: z.array(z.number().int().min(0).max(5)).length(6).optional(),
  cupTimestamps: z.record(z.string()).optional(),
  checkedToday: z.string().max(10).optional(),
  settings: z.object({
    onboardingComplete: z.boolean().optional(),
    soundEnabled: z.boolean().optional(),
  }).optional(),
  customPresets: z.array(z.string().max(100)).optional(),
  activityFreq: z.record(z.number()).optional(),
});

const historySchema = z.object({
  cupLevels: z.array(z.number().int().min(0).max(5)).length(6),
});

const activitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().max(30),
  activity: z.string().min(1).max(100),
  cups: z.array(z.number().int().min(0).max(5)).optional(),
  notes: z.string().max(1000).optional(),
});

export function registerWellnessWheelRoutes(app: Express) {
  // GET /api/wellness-wheel/state — get user's wheel state (or defaults)
  app.get("/api/wellness-wheel/state", async (req, res) => {
    try {
      const userId = getUserId(req);
      const db = getDb();
      const [state] = await db
        .select()
        .from(wellnessWheelState)
        .where(eq(wellnessWheelState.userId, userId));

      if (!state) {
        // Return defaults (no row yet)
        return res.json({
          userId,
          cupLevels: [3, 3, 3, 3, 3, 3],
          cupTimestamps: {},
          checkedToday: "",
          settings: {},
          customPresets: [],
          activityFreq: {},
          updatedAt: new Date().toISOString(),
        });
      }
      res.json(state);
    } catch (error) {
      log.error("[wellness-wheel] GET state failed:", error);
      res.status(500).json({ error: "Failed to fetch wheel state" });
    }
  });

  // PUT /api/wellness-wheel/state — upsert wheel state
  app.put("/api/wellness-wheel/state", async (req, res) => {
    try {
      const userId = getUserId(req);
      const db = getDb();
      const validated = stateSchema.parse(req.body);

      const updates: Record<string, any> = { updatedAt: new Date() };
      if (validated.cupLevels !== undefined) updates.cupLevels = validated.cupLevels;
      if (validated.cupTimestamps !== undefined) updates.cupTimestamps = validated.cupTimestamps;
      if (validated.checkedToday !== undefined) updates.checkedToday = validated.checkedToday;
      if (validated.settings !== undefined) updates.settings = validated.settings;
      if (validated.customPresets !== undefined) updates.customPresets = validated.customPresets;
      if (validated.activityFreq !== undefined) updates.activityFreq = validated.activityFreq;

      const [state] = await db
        .insert(wellnessWheelState)
        .values({ userId, ...updates })
        .onConflictDoUpdate({
          target: wellnessWheelState.userId,
          set: updates,
        })
        .returning();

      res.json(state);
    } catch (error: any) {
      log.error("[wellness-wheel] PUT state failed:", error);
      res.status(400).json({ error: error.message || "Invalid state data" });
    }
  });

  // GET /api/wellness-wheel/history — get daily snapshots
  app.get("/api/wellness-wheel/history", async (req, res) => {
    try {
      const userId = getUserId(req);
      const db = getDb();
      const days = Math.min(parseInt(req.query.days as string) || 90, 365);

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      const rows = await db
        .select()
        .from(wellnessWheelHistory)
        .where(
          and(
            eq(wellnessWheelHistory.userId, userId),
            sql`${wellnessWheelHistory.date} >= ${cutoffStr}`
          )
        )
        .orderBy(desc(wellnessWheelHistory.date));

      res.json(rows);
    } catch (error) {
      log.error("[wellness-wheel] GET history failed:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // PUT /api/wellness-wheel/history/:date — upsert a day's snapshot
  app.put("/api/wellness-wheel/history/:date", async (req, res) => {
    try {
      const userId = getUserId(req);
      const db = getDb();
      const date = req.params.date;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Invalid date format (YYYY-MM-DD)" });
      }

      const validated = historySchema.parse(req.body);

      const [row] = await db
        .insert(wellnessWheelHistory)
        .values({ userId, date, cupLevels: validated.cupLevels })
        .onConflictDoUpdate({
          target: [wellnessWheelHistory.userId, wellnessWheelHistory.date],
          set: { cupLevels: validated.cupLevels },
        })
        .returning();

      res.json(row);
    } catch (error: any) {
      log.error("[wellness-wheel] PUT history failed:", error);
      res.status(400).json({ error: error.message || "Invalid history data" });
    }
  });

  // GET /api/wellness-wheel/activities — get activity log
  app.get("/api/wellness-wheel/activities", async (req, res) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      if (req.query.date) {
        const rows = await db
          .select()
          .from(wellnessWheelActivities)
          .where(
            and(
              eq(wellnessWheelActivities.userId, userId),
              eq(wellnessWheelActivities.date, req.query.date as string)
            )
          )
          .orderBy(desc(wellnessWheelActivities.time));
        return res.json(rows);
      }

      const days = Math.min(parseInt(req.query.days as string) || 90, 365);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      const rows = await db
        .select()
        .from(wellnessWheelActivities)
        .where(
          and(
            eq(wellnessWheelActivities.userId, userId),
            sql`${wellnessWheelActivities.date} >= ${cutoffStr}`
          )
        )
        .orderBy(desc(wellnessWheelActivities.time));

      res.json(rows);
    } catch (error) {
      log.error("[wellness-wheel] GET activities failed:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // POST /api/wellness-wheel/activities — log a new activity
  app.post("/api/wellness-wheel/activities", async (req, res) => {
    try {
      const userId = getUserId(req);
      const db = getDb();
      const validated = activitySchema.parse(req.body);

      const [row] = await db
        .insert(wellnessWheelActivities)
        .values({
          userId,
          date: validated.date,
          time: validated.time,
          activity: validated.activity,
          cups: validated.cups || [],
          notes: validated.notes || "",
        })
        .returning();

      res.status(201).json(row);
    } catch (error: any) {
      log.error("[wellness-wheel] POST activity failed:", error);
      res.status(400).json({ error: error.message || "Invalid activity data" });
    }
  });

  // DELETE /api/wellness-wheel/activities/:id — delete an activity
  app.delete("/api/wellness-wheel/activities/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const db = getDb();
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const [existing] = await db
        .select()
        .from(wellnessWheelActivities)
        .where(eq(wellnessWheelActivities.id, id));

      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ error: "Activity not found" });
      }

      await db
        .delete(wellnessWheelActivities)
        .where(eq(wellnessWheelActivities.id, id));

      res.status(204).send();
    } catch (error) {
      log.error("[wellness-wheel] DELETE activity failed:", error);
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  // GET /api/wellness-wheel/export — export all wheel data as JSON
  app.get("/api/wellness-wheel/export", async (req, res) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      const [state] = await db
        .select()
        .from(wellnessWheelState)
        .where(eq(wellnessWheelState.userId, userId));

      const history = await db
        .select()
        .from(wellnessWheelHistory)
        .where(eq(wellnessWheelHistory.userId, userId))
        .orderBy(desc(wellnessWheelHistory.date));

      const activities = await db
        .select()
        .from(wellnessWheelActivities)
        .where(eq(wellnessWheelActivities.userId, userId))
        .orderBy(desc(wellnessWheelActivities.time));

      res.json({
        exportedAt: new Date().toISOString(),
        state: state || null,
        history,
        activities,
      });
    } catch (error) {
      log.error("[wellness-wheel] Export failed:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });
}
