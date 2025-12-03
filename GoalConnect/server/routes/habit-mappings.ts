/**
 * Habit Data Mappings Routes
 *
 * Configure rules for auto-completing habits from external data sources
 */

import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { habitDataMappings, habits } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "../simple-auth";
import { log } from "../lib/logger";
import { z } from "zod";

const getUserId = (req: Request) => requireUser(req).id;

// Available Strava activity types for matching
export const STRAVA_ACTIVITY_TYPES = [
  "Ride",
  "Run",
  "Walk",
  "Hike",
  "RockClimbing",
  "Bouldering",
  "Yoga",
  "WeightTraining",
  "Crossfit",
  "Swim",
  "VirtualRide",
  "VirtualRun",
  "Workout",
  "EBikeRide",
  "MountainBikeRide",
  "GravelRide",
  "TrailRun",
  "Rowing",
  "Kayaking",
  "AlpineSki",
  "NordicSki",
  "Snowboard",
];

// Match criteria schema
const matchCriteriaSchema = z.object({
  activityTypes: z.array(z.string()).optional(),
  minDurationMinutes: z.number().min(1).optional(),
  keywords: z.array(z.string()).optional(),
});

export function registerHabitMappingRoutes(app: Express) {
  /**
   * GET /api/habit-mappings
   * List all habit mappings for the user
   */
  app.get("/api/habit-mappings", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      const mappings = await db
        .select({
          id: habitDataMappings.id,
          habitId: habitDataMappings.habitId,
          sourceType: habitDataMappings.sourceType,
          matchCriteria: habitDataMappings.matchCriteria,
          autoComplete: habitDataMappings.autoComplete,
          autoIncrement: habitDataMappings.autoIncrement,
          createdAt: habitDataMappings.createdAt,
          habitTitle: habits.title,
          habitIcon: habits.icon,
        })
        .from(habitDataMappings)
        .innerJoin(habits, eq(habits.id, habitDataMappings.habitId))
        .where(eq(habitDataMappings.userId, userId));

      res.json({ mappings });
    } catch (error) {
      log.error("[habit-mappings] Error fetching mappings:", error);
      res.status(500).json({ error: "Failed to fetch habit mappings" });
    }
  });

  /**
   * POST /api/habit-mappings
   * Create a new habit mapping
   */
  app.post("/api/habit-mappings", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      // Validate request body
      const createSchema = z.object({
        habitId: z.number(),
        sourceType: z.enum(["strava", "apple_watch", "kilter_board"]),
        matchCriteria: matchCriteriaSchema,
        autoComplete: z.boolean().default(true),
        autoIncrement: z.boolean().default(false),
      });

      const validationResult = createSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: validationResult.error.flatten(),
        });
      }

      const data = validationResult.data;

      // Verify habit belongs to user
      const [habit] = await db
        .select()
        .from(habits)
        .where(and(eq(habits.id, data.habitId), eq(habits.userId, userId)))
        .limit(1);

      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }

      // Check if mapping already exists for this habit and source
      const [existing] = await db
        .select()
        .from(habitDataMappings)
        .where(
          and(
            eq(habitDataMappings.habitId, data.habitId),
            eq(habitDataMappings.sourceType, data.sourceType)
          )
        )
        .limit(1);

      if (existing) {
        return res.status(409).json({
          error: "Mapping already exists for this habit and source",
        });
      }

      // Create mapping
      const [mapping] = await db
        .insert(habitDataMappings)
        .values({
          userId,
          habitId: data.habitId,
          sourceType: data.sourceType,
          matchCriteria: data.matchCriteria,
          autoComplete: data.autoComplete,
          autoIncrement: data.autoIncrement,
        })
        .returning();

      res.status(201).json(mapping);
    } catch (error) {
      log.error("[habit-mappings] Error creating mapping:", error);
      res.status(500).json({ error: "Failed to create habit mapping" });
    }
  });

  /**
   * PUT /api/habit-mappings/:id
   * Update an existing habit mapping
   */
  app.put("/api/habit-mappings/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const mappingId = parseInt(req.params.id);
      const db = getDb();

      if (isNaN(mappingId)) {
        return res.status(400).json({ error: "Invalid mapping ID" });
      }

      // Verify ownership
      const [existing] = await db
        .select()
        .from(habitDataMappings)
        .where(
          and(
            eq(habitDataMappings.id, mappingId),
            eq(habitDataMappings.userId, userId)
          )
        )
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: "Mapping not found" });
      }

      // Validate update data
      const updateSchema = z.object({
        matchCriteria: matchCriteriaSchema.optional(),
        autoComplete: z.boolean().optional(),
        autoIncrement: z.boolean().optional(),
      });

      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: validationResult.error.flatten(),
        });
      }

      const [updated] = await db
        .update(habitDataMappings)
        .set({
          ...validationResult.data,
          updatedAt: new Date(),
        })
        .where(eq(habitDataMappings.id, mappingId))
        .returning();

      res.json(updated);
    } catch (error) {
      log.error("[habit-mappings] Error updating mapping:", error);
      res.status(500).json({ error: "Failed to update habit mapping" });
    }
  });

  /**
   * DELETE /api/habit-mappings/:id
   * Delete a habit mapping
   */
  app.delete("/api/habit-mappings/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const mappingId = parseInt(req.params.id);
      const db = getDb();

      if (isNaN(mappingId)) {
        return res.status(400).json({ error: "Invalid mapping ID" });
      }

      const result = await db
        .delete(habitDataMappings)
        .where(
          and(
            eq(habitDataMappings.id, mappingId),
            eq(habitDataMappings.userId, userId)
          )
        )
        .returning({ id: habitDataMappings.id });

      if (result.length === 0) {
        return res.status(404).json({ error: "Mapping not found" });
      }

      res.json({ success: true, deletedId: mappingId });
    } catch (error) {
      log.error("[habit-mappings] Error deleting mapping:", error);
      res.status(500).json({ error: "Failed to delete habit mapping" });
    }
  });

  /**
   * GET /api/habit-mappings/activity-types
   * Get list of available activity types for Strava
   */
  app.get("/api/habit-mappings/activity-types", async (_req: Request, res: Response) => {
    res.json({ activityTypes: STRAVA_ACTIVITY_TYPES });
  });
}
