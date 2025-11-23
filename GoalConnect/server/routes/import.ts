/**
 * External Data Import Routes
 *
 * Handles importing workout data from Apple Health and other sources.
 */

import type { Express, Request, Response } from "express";
import multer from "multer";
import { getDb } from "../db";
import { externalWorkouts } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireUser } from "../simple-auth";
import {
  parseAppleHealthXML,
  toExternalWorkoutInsert,
  SUPPORTED_WORKOUT_TYPES,
  type AppleHealthParserOptions,
} from "../importers/apple-health-parser";
import { log } from "../lib/logger";

const getUserId = (req: Request) => requireUser(req).id;

// Configure multer for XML file uploads (in memory)
const xmlUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/xml" ||
      file.mimetype === "application/xml" ||
      file.originalname.endsWith(".xml")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only XML files are allowed"));
    }
  },
});

export function registerImportRoutes(app: Express) {
  /**
   * GET /api/import/supported-workout-types
   * Returns list of supported Apple Health workout types
   */
  app.get("/api/import/supported-workout-types", (req, res) => {
    res.json({
      workoutTypes: SUPPORTED_WORKOUT_TYPES,
    });
  });

  /**
   * POST /api/import/apple-health
   * Upload and import Apple Health XML export file
   *
   * Body (multipart/form-data):
   *   - file: XML file
   *   - workoutTypes: Optional JSON array of workout types to filter
   *   - startDate: Optional ISO date string for start date filter
   *   - endDate: Optional ISO date string for end date filter
   *   - minDurationMinutes: Optional minimum workout duration
   */
  app.post(
    "/api/import/apple-health",
    xmlUpload.single("file"),
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const xmlContent = req.file.buffer.toString("utf-8");

        // Parse options from request body
        const options: AppleHealthParserOptions = {};

        if (req.body.workoutTypes) {
          try {
            options.workoutTypes = JSON.parse(req.body.workoutTypes);
          } catch {
            return res.status(400).json({ error: "Invalid workoutTypes format" });
          }
        }

        if (req.body.startDate) {
          const startDate = new Date(req.body.startDate);
          if (!isNaN(startDate.getTime())) {
            options.startDate = startDate;
          }
        }

        if (req.body.endDate) {
          const endDate = new Date(req.body.endDate);
          if (!isNaN(endDate.getTime())) {
            options.endDate = endDate;
          }
        }

        if (req.body.minDurationMinutes) {
          const minDuration = parseInt(req.body.minDurationMinutes, 10);
          if (!isNaN(minDuration)) {
            options.minDurationMinutes = minDuration;
          }
        }

        // Parse the XML file
        const parseResult = await parseAppleHealthXML(xmlContent, options);

        if (!parseResult.success) {
          return res.status(400).json({
            error: "Failed to parse Apple Health XML",
            details: parseResult.errors,
          });
        }

        // Insert workouts into database, skipping duplicates
        const db = getDb();
        let imported = 0;
        let skipped = 0;
        const importedWorkouts: any[] = [];

        for (const workout of parseResult.workouts) {
          try {
            // Check if workout already exists (deduplication)
            const existing = await db
              .select({ id: externalWorkouts.id })
              .from(externalWorkouts)
              .where(
                and(
                  eq(externalWorkouts.userId, userId),
                  eq(externalWorkouts.sourceType, "apple_watch"),
                  eq(externalWorkouts.externalId, workout.externalId)
                )
              )
              .limit(1);

            if (existing.length > 0) {
              skipped++;
              continue;
            }

            // Insert the workout
            const insertData = toExternalWorkoutInsert(workout, userId);
            const [inserted] = await db
              .insert(externalWorkouts)
              .values({
                userId: insertData.userId,
                sourceType: insertData.sourceType,
                externalId: insertData.externalId,
                workoutType: insertData.workoutType,
                startTime: insertData.startTime,
                endTime: insertData.endTime,
                durationMinutes: insertData.durationMinutes,
                heartRateAvg: insertData.heartRateAvg,
                heartRateMax: insertData.heartRateMax,
                heartRateMin: insertData.heartRateMin,
                caloriesBurned: insertData.caloriesBurned,
                distanceKm: insertData.distanceKm,
                metadata: insertData.metadata,
              })
              .returning();

            imported++;
            importedWorkouts.push(inserted);
          } catch (insertError) {
            // Log but continue with other workouts
            log.error("[import] Failed to insert workout:", insertError);
            skipped++;
          }
        }

        res.json({
          success: true,
          summary: {
            totalInFile: parseResult.stats?.totalWorkoutsFound || 0,
            filtered: parseResult.stats?.workoutsFiltered || 0,
            skippedInvalid: parseResult.stats?.workoutsSkipped || 0,
            imported,
            duplicatesSkipped: skipped,
          },
          workouts: importedWorkouts.map((w) => ({
            id: w.id,
            workoutType: w.workoutType,
            startTime: w.startTime,
            durationMinutes: w.durationMinutes,
          })),
        });
      } catch (error) {
        log.error("[import] Apple Health import error:", error);
        res.status(500).json({
          error: "Failed to import Apple Health data",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  /**
   * GET /api/import/workouts
   * Get all imported workouts for the current user
   *
   * Query params:
   *   - sourceType: Filter by source (apple_watch, strava, other)
   *   - workoutType: Filter by workout type (comma-separated for multiple)
   *   - startDate: ISO date string - filter startTime >= startDate
   *   - endDate: ISO date string - filter startTime <= endDate
   *   - countOnly: boolean - return just { count, totalMinutes } instead of records
   *   - limit: Number of results (default 50)
   *   - offset: Pagination offset (default 0)
   */
  app.get("/api/import/workouts", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      const countOnly = req.query.countOnly === "true";
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      // Build filter conditions
      const conditions: ReturnType<typeof eq>[] = [eq(externalWorkouts.userId, userId)];

      // Filter by source type
      if (req.query.sourceType) {
        conditions.push(eq(externalWorkouts.sourceType, req.query.sourceType as any));
      }

      // Filter by workout type(s) - comma-separated
      if (req.query.workoutType) {
        const types = (req.query.workoutType as string).split(",").map(t => t.trim());
        if (types.length === 1) {
          conditions.push(eq(externalWorkouts.workoutType, types[0]));
        } else {
          conditions.push(sql`${externalWorkouts.workoutType} IN (${sql.join(types.map(t => sql`${t}`), sql`, `)})`);
        }
      }

      // Filter by start date
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate as string);
        if (!isNaN(startDate.getTime())) {
          conditions.push(sql`${externalWorkouts.startTime} >= ${startDate}`);
        }
      }

      // Filter by end date
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate as string);
        if (!isNaN(endDate.getTime())) {
          conditions.push(sql`${externalWorkouts.startTime} <= ${endDate}`);
        }
      }

      const whereClause = and(...conditions);

      // Count-only mode: return aggregated stats without fetching all records
      if (countOnly) {
        const [result] = await db
          .select({
            count: sql<number>`count(*)`,
            totalMinutes: sql<number>`COALESCE(sum(${externalWorkouts.durationMinutes}), 0)`,
          })
          .from(externalWorkouts)
          .where(whereClause);

        return res.json({
          count: Number(result.count),
          totalMinutes: Number(result.totalMinutes),
        });
      }

      // Full query with pagination
      const workouts = await db
        .select()
        .from(externalWorkouts)
        .where(whereClause)
        .orderBy(desc(externalWorkouts.startTime))
        .limit(limit)
        .offset(offset);

      // Get total count with same filters
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(externalWorkouts)
        .where(whereClause);

      res.json({
        workouts,
        pagination: {
          total: Number(countResult.count),
          limit,
          offset,
          hasMore: offset + workouts.length < Number(countResult.count),
        },
      });
    } catch (error) {
      log.error("[import] Error fetching workouts:", error);
      res.status(500).json({ error: "Failed to fetch workouts" });
    }
  });

  /**
   * GET /api/import/workouts/:id
   * Get a single imported workout by ID
   */
  app.get("/api/import/workouts/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const workoutId = parseInt(req.params.id, 10);

      if (isNaN(workoutId)) {
        return res.status(400).json({ error: "Invalid workout ID" });
      }

      const db = getDb();
      const [workout] = await db
        .select()
        .from(externalWorkouts)
        .where(
          and(
            eq(externalWorkouts.id, workoutId),
            eq(externalWorkouts.userId, userId)
          )
        )
        .limit(1);

      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }

      res.json(workout);
    } catch (error) {
      log.error("[import] Error fetching workout:", error);
      res.status(500).json({ error: "Failed to fetch workout" });
    }
  });

  /**
   * DELETE /api/import/workouts/:id
   * Delete an imported workout
   */
  app.delete("/api/import/workouts/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const workoutId = parseInt(req.params.id, 10);

      if (isNaN(workoutId)) {
        return res.status(400).json({ error: "Invalid workout ID" });
      }

      const db = getDb();

      // Verify ownership before deleting
      const [existing] = await db
        .select({ id: externalWorkouts.id })
        .from(externalWorkouts)
        .where(
          and(
            eq(externalWorkouts.id, workoutId),
            eq(externalWorkouts.userId, userId)
          )
        )
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: "Workout not found" });
      }

      await db
        .delete(externalWorkouts)
        .where(eq(externalWorkouts.id, workoutId));

      res.json({ success: true, deleted: workoutId });
    } catch (error) {
      log.error("[import] Error deleting workout:", error);
      res.status(500).json({ error: "Failed to delete workout" });
    }
  });

  /**
   * DELETE /api/import/workouts
   * Delete all imported workouts for current user (with optional source filter)
   *
   * Query params:
   *   - sourceType: Only delete workouts from this source
   */
  app.delete("/api/import/workouts", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      let deleteCondition = eq(externalWorkouts.userId, userId);

      if (req.query.sourceType) {
        deleteCondition = and(
          eq(externalWorkouts.userId, userId),
          eq(externalWorkouts.sourceType, req.query.sourceType as any)
        )!;
      }

      const result = await db
        .delete(externalWorkouts)
        .where(deleteCondition)
        .returning({ id: externalWorkouts.id });

      res.json({
        success: true,
        deleted: result.length,
      });
    } catch (error) {
      log.error("[import] Error deleting workouts:", error);
      res.status(500).json({ error: "Failed to delete workouts" });
    }
  });

  /**
   * GET /api/import/stats
   * Get import statistics for current user
   */
  app.get("/api/import/stats", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      // Get counts by source type
      const stats = await db
        .select({
          sourceType: externalWorkouts.sourceType,
          count: sql<number>`count(*)`,
          totalDuration: sql<number>`sum(${externalWorkouts.durationMinutes})`,
          totalCalories: sql<number>`sum(${externalWorkouts.caloriesBurned})`,
        })
        .from(externalWorkouts)
        .where(eq(externalWorkouts.userId, userId))
        .groupBy(externalWorkouts.sourceType);

      // Get workout type breakdown
      const workoutTypes = await db
        .select({
          workoutType: externalWorkouts.workoutType,
          count: sql<number>`count(*)`,
        })
        .from(externalWorkouts)
        .where(eq(externalWorkouts.userId, userId))
        .groupBy(externalWorkouts.workoutType);

      res.json({
        bySource: stats,
        byWorkoutType: workoutTypes,
      });
    } catch (error) {
      log.error("[import] Error fetching import stats:", error);
      res.status(500).json({ error: "Failed to fetch import statistics" });
    }
  });
}
