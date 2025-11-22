/**
 * Habit Data Mapping Routes
 *
 * CRUD operations for user-configured habit matching rules.
 */

import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { habitDataMappings, habits } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "../simple-auth";
import { z } from "zod";

const getUserId = (req: Request) => requireUser(req).id;

// Validation schema for match criteria
const matchCriteriaSchema = z.object({
  workoutType: z.union([z.string(), z.array(z.string())]).optional(),
  minDuration: z.number().positive().optional(),
  maxDuration: z.number().positive().optional(),
  minCalories: z.number().positive().optional(),
  minProblems: z.number().nonnegative().optional(),
  minGrade: z.string().optional(),
  boardAngle: z.number().optional(),
  keywords: z.array(z.string()).optional(),
});

// Validation schema for creating/updating mappings
const mappingSchema = z.object({
  habitId: z.number().positive(),
  sourceType: z.enum(["apple_watch", "kilter_board", "strava"]),
  matchCriteria: matchCriteriaSchema,
  autoComplete: z.boolean().default(true),
  autoIncrement: z.boolean().default(false),
});

export function registerHabitMappingRoutes(app: Express) {
  /**
   * GET /api/habit-mappings
   * Get all habit mappings for the current user
   */
  app.get("/api/habit-mappings", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      const mappings = await db
        .select({
          id: habitDataMappings.id,
          userId: habitDataMappings.userId,
          habitId: habitDataMappings.habitId,
          sourceType: habitDataMappings.sourceType,
          matchCriteria: habitDataMappings.matchCriteria,
          autoComplete: habitDataMappings.autoComplete,
          autoIncrement: habitDataMappings.autoIncrement,
          createdAt: habitDataMappings.createdAt,
          updatedAt: habitDataMappings.updatedAt,
          // Join habit info
          habitTitle: habits.title,
          habitIcon: habits.icon,
          habitColor: habits.color,
        })
        .from(habitDataMappings)
        .leftJoin(habits, eq(habitDataMappings.habitId, habits.id))
        .where(eq(habitDataMappings.userId, userId));

      res.json({ mappings });
    } catch (error) {
      console.error("Error fetching habit mappings:", error);
      res.status(500).json({ error: "Failed to fetch habit mappings" });
    }
  });

  /**
   * GET /api/habit-mappings/:id
   * Get a single habit mapping by ID
   */
  app.get("/api/habit-mappings/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const mappingId = parseInt(req.params.id, 10);

      if (isNaN(mappingId)) {
        return res.status(400).json({ error: "Invalid mapping ID" });
      }

      const db = getDb();
      const [mapping] = await db
        .select()
        .from(habitDataMappings)
        .where(
          and(
            eq(habitDataMappings.id, mappingId),
            eq(habitDataMappings.userId, userId)
          )
        )
        .limit(1);

      if (!mapping) {
        return res.status(404).json({ error: "Mapping not found" });
      }

      res.json(mapping);
    } catch (error) {
      console.error("Error fetching habit mapping:", error);
      res.status(500).json({ error: "Failed to fetch habit mapping" });
    }
  });

  /**
   * POST /api/habit-mappings
   * Create a new habit mapping
   */
  app.post("/api/habit-mappings", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);

      // Validate request body
      const parseResult = mappingSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid mapping data",
          details: parseResult.error.errors,
        });
      }

      const { habitId, sourceType, matchCriteria, autoComplete, autoIncrement } =
        parseResult.data;

      const db = getDb();

      // Verify habit belongs to user
      const [habit] = await db
        .select({ id: habits.id })
        .from(habits)
        .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
        .limit(1);

      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }

      // Check if mapping already exists for this habit/source combination
      const [existing] = await db
        .select({ id: habitDataMappings.id })
        .from(habitDataMappings)
        .where(
          and(
            eq(habitDataMappings.habitId, habitId),
            eq(habitDataMappings.sourceType, sourceType)
          )
        )
        .limit(1);

      if (existing) {
        return res.status(409).json({
          error: "A mapping already exists for this habit and source",
          existingId: existing.id,
        });
      }

      // Create mapping
      const [mapping] = await db
        .insert(habitDataMappings)
        .values({
          userId,
          habitId,
          sourceType,
          matchCriteria,
          autoComplete,
          autoIncrement,
        })
        .returning();

      res.status(201).json(mapping);
    } catch (error) {
      console.error("Error creating habit mapping:", error);
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
      const mappingId = parseInt(req.params.id, 10);

      if (isNaN(mappingId)) {
        return res.status(400).json({ error: "Invalid mapping ID" });
      }

      // Validate request body (partial update allowed)
      const updateSchema = mappingSchema.partial();
      const parseResult = updateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid mapping data",
          details: parseResult.error.errors,
        });
      }

      const db = getDb();

      // Verify mapping exists and belongs to user
      const [existing] = await db
        .select({ id: habitDataMappings.id })
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

      // Update mapping
      const [updated] = await db
        .update(habitDataMappings)
        .set({
          ...parseResult.data,
          updatedAt: new Date(),
        })
        .where(eq(habitDataMappings.id, mappingId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating habit mapping:", error);
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
      const mappingId = parseInt(req.params.id, 10);

      if (isNaN(mappingId)) {
        return res.status(400).json({ error: "Invalid mapping ID" });
      }

      const db = getDb();

      // Verify ownership and delete
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

      res.json({ success: true, deleted: mappingId });
    } catch (error) {
      console.error("Error deleting habit mapping:", error);
      res.status(500).json({ error: "Failed to delete habit mapping" });
    }
  });

  /**
   * GET /api/habit-mappings/for-habit/:habitId
   * Get all mappings for a specific habit
   */
  app.get(
    "/api/habit-mappings/for-habit/:habitId",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        const habitId = parseInt(req.params.habitId, 10);

        if (isNaN(habitId)) {
          return res.status(400).json({ error: "Invalid habit ID" });
        }

        const db = getDb();

        const mappings = await db
          .select()
          .from(habitDataMappings)
          .where(
            and(
              eq(habitDataMappings.habitId, habitId),
              eq(habitDataMappings.userId, userId)
            )
          );

        res.json({ mappings });
      } catch (error) {
        console.error("Error fetching habit mappings:", error);
        res.status(500).json({ error: "Failed to fetch habit mappings" });
      }
    }
  );
}
