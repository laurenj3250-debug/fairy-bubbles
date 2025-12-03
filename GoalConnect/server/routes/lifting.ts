/**
 * Lifting Routes
 *
 * Manual workout logging - exercises, sets, workouts, PRs
 */

import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import {
  liftingExercises,
  liftingSets,
  liftingWorkouts,
  insertLiftingExerciseSchema,
  insertLiftingSetSchema,
  insertLiftingWorkoutSchema,
  DEFAULT_LIFTING_EXERCISES,
} from "@shared/schema";
import { eq, and, desc, sql, gte, count, max, sum } from "drizzle-orm";
import { requireUser } from "../simple-auth";
import { log } from "../lib/logger";
import { z } from "zod";

const getUserId = (req: Request) => requireUser(req).id;

export function registerLiftingRoutes(app: Express) {
  // ==================== EXERCISES ====================

  /**
   * GET /api/lifting/exercises
   * Get user's exercise library
   */
  app.get("/api/lifting/exercises", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      const exercises = await db
        .select()
        .from(liftingExercises)
        .where(eq(liftingExercises.userId, userId))
        .orderBy(liftingExercises.name);

      res.json({ exercises });
    } catch (error) {
      log.error("[lifting] Error fetching exercises:", error);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  /**
   * POST /api/lifting/exercises
   * Add a new exercise to the library
   */
  app.post("/api/lifting/exercises", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      const data = insertLiftingExerciseSchema.parse({
        ...req.body,
        userId,
        isCustom: true,
      });

      const [exercise] = await db
        .insert(liftingExercises)
        .values(data)
        .returning();

      res.status(201).json({ exercise });
    } catch (error) {
      log.error("[lifting] Error creating exercise:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid exercise data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create exercise" });
      }
    }
  });

  /**
   * POST /api/lifting/exercises/seed
   * Seed default exercises for user
   */
  app.post("/api/lifting/exercises/seed", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      // Check if user already has exercises
      const existing = await db
        .select({ count: count() })
        .from(liftingExercises)
        .where(eq(liftingExercises.userId, userId));

      if (Number(existing[0].count) > 0) {
        return res.status(400).json({ error: "User already has exercises" });
      }

      // Insert default exercises
      const exercises = await db
        .insert(liftingExercises)
        .values(
          DEFAULT_LIFTING_EXERCISES.map((e) => ({
            userId,
            name: e.name,
            category: e.category,
            equipment: e.equipment,
            primaryMuscle: e.primaryMuscle,
            isCustom: false,
          }))
        )
        .returning();

      res.status(201).json({ exercises });
    } catch (error) {
      log.error("[lifting] Error seeding exercises:", error);
      res.status(500).json({ error: "Failed to seed exercises" });
    }
  });

  // ==================== WORKOUTS ====================

  /**
   * GET /api/lifting/workouts
   * Get recent workouts with sets
   */
  app.get("/api/lifting/workouts", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const offset = parseInt(req.query.offset as string) || 0;

      // Get workouts
      const workouts = await db
        .select()
        .from(liftingWorkouts)
        .where(eq(liftingWorkouts.userId, userId))
        .orderBy(desc(liftingWorkouts.workoutDate))
        .limit(limit)
        .offset(offset);

      // Get sets for these workout dates
      const workoutDates = workouts.map((w) => w.workoutDate);

      if (workoutDates.length > 0) {
        const sets = await db
          .select({
            set: liftingSets,
            exercise: liftingExercises,
          })
          .from(liftingSets)
          .innerJoin(liftingExercises, eq(liftingSets.exerciseId, liftingExercises.id))
          .where(
            and(
              eq(liftingSets.userId, userId),
              sql`${liftingSets.workoutDate} = ANY(${workoutDates})`
            )
          )
          .orderBy(liftingSets.setNumber);

        // Group sets by workout date
        const setsByDate = sets.reduce((acc, { set, exercise }) => {
          const date = set.workoutDate;
          if (!acc[date]) acc[date] = [];
          acc[date].push({ ...set, exercise });
          return acc;
        }, {} as Record<string, any[]>);

        const workoutsWithSets = workouts.map((w) => ({
          ...w,
          sets: setsByDate[w.workoutDate] || [],
        }));

        return res.json({ workouts: workoutsWithSets });
      }

      res.json({ workouts: workouts.map((w) => ({ ...w, sets: [] })) });
    } catch (error) {
      log.error("[lifting] Error fetching workouts:", error);
      res.status(500).json({ error: "Failed to fetch workouts" });
    }
  });

  /**
   * POST /api/lifting/workouts
   * Create or update a workout for a date
   */
  app.post("/api/lifting/workouts", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      const data = insertLiftingWorkoutSchema.parse({
        ...req.body,
        userId,
      });

      // Upsert workout
      const [workout] = await db
        .insert(liftingWorkouts)
        .values(data)
        .onConflictDoUpdate({
          target: [liftingWorkouts.userId, liftingWorkouts.workoutDate],
          set: {
            name: data.name,
            durationMinutes: data.durationMinutes,
            notes: data.notes,
            updatedAt: new Date(),
          },
        })
        .returning();

      res.status(201).json({ workout });
    } catch (error) {
      log.error("[lifting] Error creating workout:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid workout data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create workout" });
      }
    }
  });

  // ==================== SETS ====================

  /**
   * POST /api/lifting/sets
   * Log a set
   */
  app.post("/api/lifting/sets", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      const data = insertLiftingSetSchema.parse({
        ...req.body,
        userId,
      });

      // Check if this is a PR
      const [maxWeight] = await db
        .select({ max: max(liftingSets.weightLbs) })
        .from(liftingSets)
        .where(
          and(
            eq(liftingSets.userId, userId),
            eq(liftingSets.exerciseId, data.exerciseId)
          )
        );

      const isPR = !maxWeight.max || Number(data.weightLbs) > Number(maxWeight.max);

      const [set] = await db
        .insert(liftingSets)
        .values({ ...data, isPR })
        .returning();

      // Update workout volume
      await updateWorkoutVolume(db, userId, data.workoutDate);

      res.status(201).json({ set });
    } catch (error) {
      log.error("[lifting] Error logging set:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid set data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to log set" });
      }
    }
  });

  /**
   * DELETE /api/lifting/sets/:id
   * Delete a set
   */
  app.delete("/api/lifting/sets/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();
      const setId = parseInt(req.params.id);

      // Get the set first to know the workout date
      const [setToDelete] = await db
        .select()
        .from(liftingSets)
        .where(and(eq(liftingSets.id, setId), eq(liftingSets.userId, userId)));

      if (!setToDelete) {
        return res.status(404).json({ error: "Set not found" });
      }

      await db
        .delete(liftingSets)
        .where(and(eq(liftingSets.id, setId), eq(liftingSets.userId, userId)));

      // Update workout volume
      await updateWorkoutVolume(db, userId, setToDelete.workoutDate);

      res.json({ success: true });
    } catch (error) {
      log.error("[lifting] Error deleting set:", error);
      res.status(500).json({ error: "Failed to delete set" });
    }
  });

  // ==================== STATS ====================

  /**
   * GET /api/lifting/stats
   * Get lifting stats and PRs
   */
  app.get("/api/lifting/stats", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();
      const currentYear = new Date().getFullYear();
      const ytdStart = `${currentYear}-01-01`;

      // Get this month's dates
      const now = new Date();
      const monthStart = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      // Get all workouts this year
      const workouts = await db
        .select()
        .from(liftingWorkouts)
        .where(
          and(
            eq(liftingWorkouts.userId, userId),
            gte(liftingWorkouts.workoutDate, ytdStart)
          )
        );

      const ytdWorkouts = workouts.length;
      const thisMonthWorkouts = workouts.filter((w) => w.workoutDate >= monthStart).length;
      const ytdVolume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
      const thisMonthVolume = workouts
        .filter((w) => w.workoutDate >= monthStart)
        .reduce((sum, w) => sum + (w.totalVolume || 0), 0);

      // Get PRs (distinct by exercise)
      const prs = await db
        .select({
          exerciseId: liftingSets.exerciseId,
          exerciseName: liftingExercises.name,
          weight: max(liftingSets.weightLbs),
        })
        .from(liftingSets)
        .innerJoin(liftingExercises, eq(liftingSets.exerciseId, liftingExercises.id))
        .where(eq(liftingSets.userId, userId))
        .groupBy(liftingSets.exerciseId, liftingExercises.name);

      // Get recent PRs (this month)
      const recentPRs = await db
        .select({
          set: liftingSets,
          exercise: liftingExercises,
        })
        .from(liftingSets)
        .innerJoin(liftingExercises, eq(liftingSets.exerciseId, liftingExercises.id))
        .where(
          and(
            eq(liftingSets.userId, userId),
            eq(liftingSets.isPR, true),
            gte(liftingSets.workoutDate, monthStart)
          )
        )
        .orderBy(desc(liftingSets.createdAt))
        .limit(5);

      res.json({
        ytdWorkouts,
        thisMonthWorkouts,
        ytdVolume,
        thisMonthVolume,
        prs: prs.map((p) => ({
          exerciseId: p.exerciseId,
          exerciseName: p.exerciseName,
          weight: Number(p.weight),
        })),
        recentPRs: recentPRs.map(({ set, exercise }) => ({
          ...set,
          exerciseName: exercise.name,
          weightLbs: Number(set.weightLbs),
        })),
      });
    } catch (error) {
      log.error("[lifting] Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
}

// Helper to update workout volume after set changes
async function updateWorkoutVolume(db: any, userId: number, workoutDate: string) {
  const [volumeResult] = await db
    .select({
      total: sql`SUM(${liftingSets.reps} * CAST(${liftingSets.weightLbs} AS INTEGER))`,
    })
    .from(liftingSets)
    .where(
      and(eq(liftingSets.userId, userId), eq(liftingSets.workoutDate, workoutDate))
    );

  await db
    .update(liftingWorkouts)
    .set({ totalVolume: Number(volumeResult.total) || 0 })
    .where(
      and(
        eq(liftingWorkouts.userId, userId),
        eq(liftingWorkouts.workoutDate, workoutDate)
      )
    );
}
