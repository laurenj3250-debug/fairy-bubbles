/**
 * Climbing Log Routes
 *
 * Manual outdoor climbing tick log - CRUD operations and stats
 */

import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import {
  outdoorClimbingTicks,
  insertOutdoorClimbingTickSchema,
} from "@shared/schema";
import { eq, and, desc, sql, gte, count } from "drizzle-orm";
import { requireUser } from "../simple-auth";
import { log } from "../lib/logger";
import { z } from "zod";

const getUserId = (req: Request) => requireUser(req).id;

export function registerClimbingLogRoutes(app: Express) {
  /**
   * GET /api/climbing-log
   * List climbing ticks with pagination and filters
   */
  app.get("/api/climbing-log", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;

      // Build query conditions
      const conditions = [eq(outdoorClimbingTicks.userId, userId)];

      if (year) {
        conditions.push(gte(outdoorClimbingTicks.date, `${year}-01-01`));
        conditions.push(sql`${outdoorClimbingTicks.date} < ${`${year + 1}-01-01`}`);
      }

      const ticks = await db
        .select()
        .from(outdoorClimbingTicks)
        .where(and(...conditions))
        .orderBy(desc(outdoorClimbingTicks.date))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [countResult] = await db
        .select({ count: count() })
        .from(outdoorClimbingTicks)
        .where(and(...conditions));

      res.json({
        ticks,
        pagination: {
          total: Number(countResult.count),
          limit,
          offset,
          hasMore: offset + ticks.length < Number(countResult.count),
        },
      });
    } catch (error) {
      log.error("[climbing-log] Error fetching ticks:", error);
      res.status(500).json({ error: "Failed to fetch climbing ticks" });
    }
  });

  /**
   * GET /api/climbing-log/stats
   * Get aggregated climbing stats - optimized single query + in-memory aggregation
   */
  app.get("/api/climbing-log/stats", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();
      const currentYear = new Date().getFullYear();
      const ytdStart = `${currentYear}-01-01`;

      // Single query to get all ticks - compute aggregations in JS
      const allTicks = await db
        .select()
        .from(outdoorClimbingTicks)
        .where(eq(outdoorClimbingTicks.userId, userId))
        .orderBy(desc(outdoorClimbingTicks.date));

      // Compute all stats from the single result set
      const totalTicks = allTicks.length;
      const ytdTicks = allTicks.filter(t => t.date >= ytdStart).length;
      const uniqueDates = new Set(allTicks.map(t => t.date));
      const outdoorDays = uniqueDates.size;

      // Grade distribution
      const gradeDistribution: Record<string, number> = {};
      for (const tick of allTicks) {
        gradeDistribution[tick.grade] = (gradeDistribution[tick.grade] || 0) + 1;
      }

      // Style distribution
      const styleDistribution: Record<string, number> = {};
      for (const tick of allTicks) {
        styleDistribution[tick.ascentStyle] = (styleDistribution[tick.ascentStyle] || 0) + 1;
      }

      // Route type distribution (counts, not percentages - let frontend handle display)
      const routeTypeDistribution: Record<string, number> = {};
      for (const tick of allTicks) {
        routeTypeDistribution[tick.routeType] = (routeTypeDistribution[tick.routeType] || 0) + 1;
      }

      // Compute highest grades server-side using proper grade comparison
      const allGrades = allTicks.map(t => t.grade);

      // Parse YDS grades (5.10a, 5.12d, etc.)
      const parseYds = (g: string): number => {
        const match = g.match(/5\.(\d+)([a-d])?/i);
        if (!match) return 0;
        return parseInt(match[1], 10) * 10 + (match[2] ? "abcd".indexOf(match[2].toLowerCase()) : 0);
      };

      // Parse V grades (V5, V10, etc.)
      const parseV = (g: string): number => {
        const match = g.match(/v(\d+)/i);
        return match ? parseInt(match[1], 10) : -1;
      };

      const routeGrades = allGrades.filter(g => /^5\.\d+[a-d]?$/i.test(g));
      const boulderGrades = allGrades.filter(g => /^v\d+$/i.test(g));

      const highestRouteGrade = routeGrades.length > 0
        ? routeGrades.sort((a, b) => parseYds(b) - parseYds(a))[0]
        : undefined;

      const highestBoulderGrade = boulderGrades.length > 0
        ? boulderGrades.sort((a, b) => parseV(b) - parseV(a))[0]
        : undefined;

      // Recent ticks (already sorted by date desc)
      const recentTicks = allTicks.slice(0, 5);

      res.json({
        totalTicks,
        ytdTicks,
        outdoorDays,
        gradeDistribution,
        styleDistribution,
        routeTypeDistribution,
        highestRouteGrade,
        highestBoulderGrade,
        recentTicks,
      });
    } catch (error) {
      log.error("[climbing-log] Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch climbing stats" });
    }
  });

  /**
   * POST /api/climbing-log
   * Create a new climbing tick
   */
  app.post("/api/climbing-log", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      // Validate input
      const validationResult = insertOutdoorClimbingTickSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: validationResult.error.flatten(),
        });
      }

      const [tick] = await db
        .insert(outdoorClimbingTicks)
        .values(validationResult.data)
        .returning();

      res.status(201).json(tick);
    } catch (error) {
      log.error("[climbing-log] Error creating tick:", error);
      res.status(500).json({ error: "Failed to create climbing tick" });
    }
  });

  /**
   * PUT /api/climbing-log/:id
   * Update a climbing tick
   */
  app.put("/api/climbing-log/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const tickId = parseInt(req.params.id);
      const db = getDb();

      if (isNaN(tickId)) {
        return res.status(400).json({ error: "Invalid tick ID" });
      }

      // Verify ownership
      const [existing] = await db
        .select()
        .from(outdoorClimbingTicks)
        .where(
          and(
            eq(outdoorClimbingTicks.id, tickId),
            eq(outdoorClimbingTicks.userId, userId)
          )
        )
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: "Tick not found" });
      }

      // Update fields
      const updateSchema = z.object({
        routeName: z.string().optional(),
        grade: z.string().optional(),
        routeType: z.enum(["sport", "trad", "boulder", "alpine", "ice"]).optional(),
        ascentStyle: z.enum(["onsight", "flash", "redpoint", "pinkpoint", "send", "attempt", "toprope"]).optional(),
        date: z.string().optional(),
        location: z.string().optional(),
        area: z.string().optional(),
        pitches: z.number().optional(),
        stars: z.number().min(1).max(5).optional(),
        notes: z.string().optional(),
      });

      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: validationResult.error.flatten(),
        });
      }

      const [updated] = await db
        .update(outdoorClimbingTicks)
        .set({
          ...validationResult.data,
          updatedAt: new Date(),
        })
        .where(eq(outdoorClimbingTicks.id, tickId))
        .returning();

      res.json(updated);
    } catch (error) {
      log.error("[climbing-log] Error updating tick:", error);
      res.status(500).json({ error: "Failed to update climbing tick" });
    }
  });

  /**
   * DELETE /api/climbing-log/:id
   * Delete a climbing tick
   */
  app.delete("/api/climbing-log/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const tickId = parseInt(req.params.id);
      const db = getDb();

      if (isNaN(tickId)) {
        return res.status(400).json({ error: "Invalid tick ID" });
      }

      const result = await db
        .delete(outdoorClimbingTicks)
        .where(
          and(
            eq(outdoorClimbingTicks.id, tickId),
            eq(outdoorClimbingTicks.userId, userId)
          )
        )
        .returning({ id: outdoorClimbingTicks.id });

      if (result.length === 0) {
        return res.status(404).json({ error: "Tick not found" });
      }

      res.json({ success: true, deletedId: tickId });
    } catch (error) {
      log.error("[climbing-log] Error deleting tick:", error);
      res.status(500).json({ error: "Failed to delete climbing tick" });
    }
  });
}
