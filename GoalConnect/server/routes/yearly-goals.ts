/**
 * Yearly Goals Routes
 *
 * API endpoints for yearly goal tracking with deep integration to:
 * - Habits (habit logs)
 * - Journey stats (lifting workouts, outdoor climbing, Kilter Board)
 * - Dream Scroll (bucket list items)
 */

import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { storage } from "../storage";
import {
  yearlyGoals,
  yearlyGoalProgressLogs,
  habitLogs,
  habits,
  externalWorkouts,
  outdoorClimbingTicks,
  climbingSessions,
  dreamScrollItems,
  studyChapters,
  insertYearlyGoalSchema,
  insertYearlyGoalProgressLogSchema,
  YEARLY_GOAL_CATEGORY_ORDER,
  YEARLY_GOAL_CATEGORY_LABELS,
  YearlyGoalSubItem,
  YearlyGoal,
} from "@shared/schema";
import { eq, and, sql, count, countDistinct, gte, lte, desc, sum } from "drizzle-orm";
import { requireUser } from "../simple-auth";
import { log } from "../lib/logger";
import { z } from "zod";
import { randomUUID } from "crypto";

const getUserId = (req: Request) => requireUser(req).id;

// Types for response
interface YearlyGoalWithProgress extends YearlyGoal {
  computedValue: number;
  source: "manual" | "auto";
  sourceLabel?: string;
  isCompleted: boolean;
  progressPercent: number;
}

// Validation schemas
const createYearlyGoalSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(YEARLY_GOAL_CATEGORY_ORDER as unknown as [string, ...string[]]),
  goalType: z.enum(["binary", "count", "compound"]).default("binary"),
  targetValue: z.number().int().min(1).max(10000).default(1),
  subItems: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(100),
    completed: z.boolean(),
    completedAt: z.string().optional(),
  })).max(20).default([]),
  linkedHabitId: z.number().int().optional(),
  linkedJourneyKey: z.string().max(50).optional(),
  linkedDreamScrollCategory: z.string().max(20).optional(),
  xpReward: z.number().int().min(0).max(1000).default(100),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),  // YYYY-MM-DD
});

const updateYearlyGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  targetValue: z.number().int().min(1).max(10000).optional(),
  position: z.number().int().min(0).optional(),
  xpReward: z.number().int().min(0).max(1000).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),  // YYYY-MM-DD or null to clear
});

/**
 * Compute progress for a single goal based on its linked source
 */
async function computeGoalProgress(
  goal: YearlyGoal,
  year: string,
  userId: number,
  db: ReturnType<typeof getDb>
): Promise<YearlyGoalWithProgress> {
  let computedValue = goal.currentValue;
  let source: "manual" | "auto" = "manual";
  let sourceLabel: string | undefined;

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // Journey integrations (externalWorkouts, outdoor ticks, Kilter)
  if (goal.linkedJourneyKey) {
    source = "auto";

    switch (goal.linkedJourneyKey) {
      case "lifting_workouts": {
        sourceLabel = "Apple Watch";
        const result = await db
          .select({ count: count() })
          .from(externalWorkouts)
          .where(
            and(
              eq(externalWorkouts.userId, userId),
              sql`${externalWorkouts.workoutType} IN ('HKWorkoutActivityTypeFunctionalStrengthTraining', 'HKWorkoutActivityTypeTraditionalStrengthTraining')`,
              gte(externalWorkouts.startTime, new Date(startDate)),
              lte(externalWorkouts.startTime, new Date(endDate))
            )
          );
        computedValue = Number(result[0]?.count ?? 0);
        break;
      }

      case "outdoor_days": {
        sourceLabel = "Climbing Log";
        const result = await db
          .select({ count: countDistinct(outdoorClimbingTicks.date) })
          .from(outdoorClimbingTicks)
          .where(
            and(
              eq(outdoorClimbingTicks.userId, userId),
              gte(outdoorClimbingTicks.date, startDate),
              lte(outdoorClimbingTicks.date, endDate)
            )
          );
        computedValue = Number(result[0]?.count ?? 0);
        break;
      }

      case "kilter_climbs": {
        sourceLabel = "Kilter Board";
        const result = await db
          .select({ total: sum(climbingSessions.problemsSent) })
          .from(climbingSessions)
          .where(
            and(
              eq(climbingSessions.userId, userId),
              gte(climbingSessions.sessionDate, startDate),
              lte(climbingSessions.sessionDate, endDate)
            )
          );
        computedValue = Number(result[0]?.total ?? 0);
        break;
      }

      case "kilter_max_grade": {
        sourceLabel = "Kilter Board";
        // Extract target grade from title (e.g., "V5 on Kilter" -> 5)
        const targetMatch = goal.title.match(/V(\d+)/i);
        const targetGrade = targetMatch ? parseInt(targetMatch[1]) : 5;

        const result = await db
          .select({ maxGrade: sql<number>`MAX(${climbingSessions.maxGrade})` })
          .from(climbingSessions)
          .where(
            and(
              eq(climbingSessions.userId, userId),
              gte(climbingSessions.sessionDate, startDate),
              lte(climbingSessions.sessionDate, endDate)
            )
          );
        const maxGrade = Number(result[0]?.maxGrade ?? 0);
        computedValue = maxGrade >= targetGrade ? 1 : 0;
        break;
      }

      default:
        log.warn(`[yearly-goals] Unknown linkedJourneyKey: ${goal.linkedJourneyKey}`);
    }
  }

  // Habit integration
  if (goal.linkedHabitId) {
    source = "auto";
    sourceLabel = "Habit";

    const result = await db
      .select({ count: count() })
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, goal.linkedHabitId),
          eq(habitLogs.completed, true),
          gte(habitLogs.date, startDate),
          lte(habitLogs.date, endDate)
        )
      );
    computedValue = Number(result[0]?.count ?? 0);
  }

  // Dream Scroll integration
  if (goal.linkedDreamScrollCategory) {
    source = "auto";
    sourceLabel = "Bucket List";

    const result = await db
      .select({ count: count() })
      .from(dreamScrollItems)
      .where(
        and(
          eq(dreamScrollItems.userId, userId),
          sql`${dreamScrollItems.category} = ${goal.linkedDreamScrollCategory}`,
          eq(dreamScrollItems.completed, true),
          sql`EXTRACT(YEAR FROM ${dreamScrollItems.completedAt}) = ${parseInt(year)}`
        )
      );
    computedValue = Number(result[0]?.count ?? 0);
  }

  // Study book integration - compute progress from study_chapters
  if (goal.linkedBookId) {
    source = "auto";
    sourceLabel = "Study Planner";

    const chapters = await db
      .select()
      .from(studyChapters)
      .where(eq(studyChapters.bookId, goal.linkedBookId))
      .orderBy(studyChapters.position);

    // Consider chapter complete if either images or cards completed
    const completedCount = chapters.filter(
      (ch) => ch.imagesCompleted || ch.cardsCompleted
    ).length;

    computedValue = completedCount;

    // Override subItems with computed chapters (for compound goals with linkedBookId)
    if (goal.goalType === "compound") {
      (goal as any).subItems = chapters.map((ch, i) => ({
        id: `ch-${ch.id}`,
        title: `${i + 1}. ${ch.title}`,
        completed: ch.imagesCompleted || ch.cardsCompleted,
        pageStart: ch.pageStart,
        pageEnd: ch.pageEnd,
        pageCount: ch.pageEnd && ch.pageStart ? ch.pageEnd - ch.pageStart + 1 : null,
      }));
    }
  }

  // Compound goals: compute from sub-items (only if not linked to a book)
  if (goal.goalType === "compound" && !goal.linkedBookId) {
    const subItems = goal.subItems as YearlyGoalSubItem[];
    computedValue = subItems.filter((item) => item.completed).length;
  }

  const isCompleted =
    goal.goalType === "binary"
      ? computedValue >= 1
      : computedValue >= goal.targetValue;

  const progressPercent = Math.min(
    100,
    Math.round((computedValue / goal.targetValue) * 100)
  );

  return {
    ...goal,
    computedValue,
    source,
    sourceLabel,
    isCompleted,
    progressPercent,
  };
}

export function registerYearlyGoalRoutes(app: Express) {
  // ==================== MAIN AGGREGATED ENDPOINT ====================

  /**
   * GET /api/yearly-goals/with-progress?year=2026
   * Returns all goals with computed progress from all sources
   */
  app.get("/api/yearly-goals/with-progress", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const year = (req.query.year as string) || new Date().getFullYear().toString();
      const db = getDb();

      // Fetch all goals for this user and year
      const goals = await db
        .select()
        .from(yearlyGoals)
        .where(and(eq(yearlyGoals.userId, userId), eq(yearlyGoals.year, year)))
        .orderBy(yearlyGoals.position, yearlyGoals.id);

      // Compute progress for each goal
      const goalsWithProgress: YearlyGoalWithProgress[] = await Promise.all(
        goals.map((goal) => computeGoalProgress(goal, year, userId, db))
      );

      res.json({ goals: goalsWithProgress });
    } catch (error) {
      log.error("[yearly-goals] Error fetching goals with progress:", error);
      res.status(500).json({ error: "Failed to fetch yearly goals" });
    }
  });

  /**
   * GET /api/yearly-goals/stats?year=2026
   * Returns stats summary for dashboard widget
   */
  app.get("/api/yearly-goals/stats", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const year = (req.query.year as string) || new Date().getFullYear().toString();
      const db = getDb();

      const goals = await db
        .select()
        .from(yearlyGoals)
        .where(and(eq(yearlyGoals.userId, userId), eq(yearlyGoals.year, year)));

      const goalsWithProgress = await Promise.all(
        goals.map((goal) => computeGoalProgress(goal, year, userId, db))
      );

      const totalGoals = goalsWithProgress.length;
      const completedGoals = goalsWithProgress.filter((g) => g.isCompleted).length;
      const progressPercent =
        totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      // Group by category
      const byCategory: Record<string, { total: number; completed: number; progressPercent: number }> = {};
      for (const goal of goalsWithProgress) {
        if (!byCategory[goal.category]) {
          byCategory[goal.category] = { total: 0, completed: 0, progressPercent: 0 };
        }
        byCategory[goal.category].total++;
        if (goal.isCompleted) {
          byCategory[goal.category].completed++;
        }
      }
      // Calculate per-category progress
      for (const cat of Object.keys(byCategory)) {
        byCategory[cat].progressPercent =
          byCategory[cat].total > 0
            ? Math.round((byCategory[cat].completed / byCategory[cat].total) * 100)
            : 0;
      }

      res.json({
        totalGoals,
        completedGoals,
        progressPercent,
        byCategory,
      });
    } catch (error) {
      log.error("[yearly-goals] Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch yearly goals stats" });
    }
  });

  // ==================== CRUD ENDPOINTS ====================

  /**
   * POST /api/yearly-goals
   * Create new yearly goal
   */
  app.post("/api/yearly-goals", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const db = getDb();

      const data = createYearlyGoalSchema.parse(req.body);

      // Assign UUIDs to sub-items if not provided
      const subItems = data.subItems.map((item) => ({
        ...item,
        id: item.id || randomUUID(),
      }));

      const [goal] = await db
        .insert(yearlyGoals)
        .values({
          userId,
          year: data.year,
          title: data.title,
          description: data.description,
          category: data.category,
          goalType: data.goalType,
          targetValue: data.targetValue,
          subItems,
          linkedHabitId: data.linkedHabitId,
          linkedJourneyKey: data.linkedJourneyKey,
          linkedDreamScrollCategory: data.linkedDreamScrollCategory,
          xpReward: data.xpReward,
          dueDate: data.dueDate,
        })
        .returning();

      res.status(201).json({ goal });
    } catch (error) {
      log.error("[yearly-goals] Error creating goal:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid goal data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create goal" });
      }
    }
  });

  /**
   * PATCH /api/yearly-goals/:id
   * Update goal properties (cannot change goalType or subItems structure)
   */
  app.patch("/api/yearly-goals/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const goalId = parseInt(req.params.id);
      const db = getDb();

      // Verify ownership
      const [existing] = await db
        .select()
        .from(yearlyGoals)
        .where(and(eq(yearlyGoals.id, goalId), eq(yearlyGoals.userId, userId)));

      if (!existing) {
        return res.status(404).json({ error: "Goal not found" });
      }

      const data = updateYearlyGoalSchema.parse(req.body);

      const [updated] = await db
        .update(yearlyGoals)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(yearlyGoals.id, goalId))
        .returning();

      res.json({ goal: updated });
    } catch (error) {
      log.error("[yearly-goals] Error updating goal:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid update data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update goal" });
      }
    }
  });

  /**
   * DELETE /api/yearly-goals/:id
   */
  app.delete("/api/yearly-goals/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const goalId = parseInt(req.params.id);
      const db = getDb();

      // Verify ownership
      const [existing] = await db
        .select()
        .from(yearlyGoals)
        .where(and(eq(yearlyGoals.id, goalId), eq(yearlyGoals.userId, userId)));

      if (!existing) {
        return res.status(404).json({ error: "Goal not found" });
      }

      await db.delete(yearlyGoals).where(eq(yearlyGoals.id, goalId));

      res.status(204).send();
    } catch (error) {
      log.error("[yearly-goals] Error deleting goal:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // ==================== PROGRESS TRACKING ENDPOINTS ====================

  /**
   * POST /api/yearly-goals/:id/increment
   * Manual +1 (or custom amount) for count goals
   */
  app.post("/api/yearly-goals/:id/increment", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const goalId = parseInt(req.params.id);
      const amount = req.body.amount ?? 1;
      const note = req.body.note;
      const db = getDb();

      const [goal] = await db
        .select()
        .from(yearlyGoals)
        .where(and(eq(yearlyGoals.id, goalId), eq(yearlyGoals.userId, userId)));

      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }

      if (goal.goalType !== "count") {
        return res.status(400).json({ error: "Only count goals can be incremented" });
      }

      // Check if it's auto-tracked
      if (goal.linkedHabitId || goal.linkedJourneyKey || goal.linkedDreamScrollCategory) {
        return res.status(400).json({ error: "Cannot manually increment auto-tracked goals" });
      }

      const previousValue = goal.currentValue;
      const newValue = Math.max(0, previousValue + amount);

      // Update goal
      const [updated] = await db
        .update(yearlyGoals)
        .set({
          currentValue: newValue,
          updatedAt: new Date(),
        })
        .where(eq(yearlyGoals.id, goalId))
        .returning();

      // Log progress
      await db.insert(yearlyGoalProgressLogs).values({
        goalId,
        userId,
        changeType: amount > 0 ? "increment" : "decrement",
        previousValue,
        newValue,
        source: "manual",
        note,
      });

      // Check if goal was just completed
      const wasCompleted = previousValue >= goal.targetValue;
      const isNowCompleted = newValue >= goal.targetValue;

      if (!wasCompleted && isNowCompleted) {
        await db
          .update(yearlyGoals)
          .set({
            completed: true,
            completedAt: new Date(),
          })
          .where(eq(yearlyGoals.id, goalId));
      } else if (wasCompleted && !isNowCompleted) {
        await db
          .update(yearlyGoals)
          .set({
            completed: false,
            completedAt: null,
          })
          .where(eq(yearlyGoals.id, goalId));
      }

      res.json({
        goal: updated,
        previousValue,
        newValue,
        isCompleted: isNowCompleted,
      });
    } catch (error) {
      log.error("[yearly-goals] Error incrementing goal:", error);
      res.status(500).json({ error: "Failed to increment goal" });
    }
  });

  /**
   * POST /api/yearly-goals/:id/toggle
   * Toggle binary goal completion
   */
  app.post("/api/yearly-goals/:id/toggle", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const goalId = parseInt(req.params.id);
      const db = getDb();

      const [goal] = await db
        .select()
        .from(yearlyGoals)
        .where(and(eq(yearlyGoals.id, goalId), eq(yearlyGoals.userId, userId)));

      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }

      if (goal.goalType !== "binary") {
        return res.status(400).json({ error: "Only binary goals can be toggled" });
      }

      // Check if it's auto-tracked
      if (goal.linkedHabitId || goal.linkedJourneyKey || goal.linkedDreamScrollCategory) {
        return res.status(400).json({ error: "Cannot manually toggle auto-tracked goals" });
      }

      const previousValue = goal.currentValue;
      const newValue = previousValue === 0 ? 1 : 0;
      const isCompleted = newValue === 1;

      const [updated] = await db
        .update(yearlyGoals)
        .set({
          currentValue: newValue,
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(yearlyGoals.id, goalId))
        .returning();

      // Log progress
      await db.insert(yearlyGoalProgressLogs).values({
        goalId,
        userId,
        changeType: isCompleted ? "complete" : "uncomplete",
        previousValue,
        newValue,
        source: "manual",
      });

      res.json({ goal: updated, isCompleted });
    } catch (error) {
      log.error("[yearly-goals] Error toggling goal:", error);
      res.status(500).json({ error: "Failed to toggle goal" });
    }
  });

  /**
   * POST /api/yearly-goals/:id/sub-item/:subItemId/toggle
   * Toggle compound goal sub-item (handles both manual subItems and book-linked chapters)
   */
  app.post(
    "/api/yearly-goals/:id/sub-item/:subItemId/toggle",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserId(req);
        const goalId = parseInt(req.params.id);
        const subItemId = req.params.subItemId;
        const db = getDb();

        const [goal] = await db
          .select()
          .from(yearlyGoals)
          .where(and(eq(yearlyGoals.id, goalId), eq(yearlyGoals.userId, userId)));

        if (!goal) {
          return res.status(404).json({ error: "Goal not found" });
        }

        if (goal.goalType !== "compound") {
          return res.status(400).json({ error: "Only compound goals have sub-items" });
        }

        // Handle book-linked goals - toggle study chapter completion
        if (goal.linkedBookId && subItemId.startsWith("ch-")) {
          const chapterId = parseInt(subItemId.replace("ch-", ""));

          const [chapter] = await db
            .select()
            .from(studyChapters)
            .where(and(
              eq(studyChapters.id, chapterId),
              eq(studyChapters.bookId, goal.linkedBookId)
            ));

          if (!chapter) {
            return res.status(404).json({ error: "Chapter not found" });
          }

          // Toggle imagesCompleted (primary completion flag for yearly goals)
          const wasCompleted = chapter.imagesCompleted;
          const nowCompleted = !wasCompleted;

          await db
            .update(studyChapters)
            .set({
              imagesCompleted: nowCompleted,
              imagesCompletedAt: nowCompleted ? new Date() : null,
            })
            .where(eq(studyChapters.id, chapterId));

          // Recompute progress
          const allChapters = await db
            .select()
            .from(studyChapters)
            .where(eq(studyChapters.bookId, goal.linkedBookId));

          const completedCount = allChapters.filter(
            (ch) => ch.id === chapterId ? nowCompleted : (ch.imagesCompleted || ch.cardsCompleted)
          ).length;
          const isGoalCompleted = completedCount >= goal.targetValue;

          // Log progress
          await db.insert(yearlyGoalProgressLogs).values({
            goalId,
            userId,
            changeType: "toggle_sub_item",
            previousValue: wasCompleted ? 1 : 0,
            newValue: nowCompleted ? 1 : 0,
            subItemId,
            source: "study_chapter",
          });

          // Award 25 XP for completing a chapter
          if (nowCompleted) {
            await storage.addPoints(
              userId,
              25,
              "goal_progress",
              goalId,
              `Chapter completed: ${chapter.title}`
            );
          }

          return res.json({
            goal,
            subItem: {
              id: subItemId,
              title: chapter.title,
              completed: nowCompleted,
            },
            isGoalCompleted,
            completedCount,
          });
        }

        // Handle manual subItems (original logic)
        const subItems = goal.subItems as YearlyGoalSubItem[];
        const itemIndex = subItems.findIndex((item) => item.id === subItemId);

        if (itemIndex === -1) {
          return res.status(404).json({ error: "Sub-item not found" });
        }

        const previousCompleted = subItems[itemIndex].completed;
        subItems[itemIndex].completed = !previousCompleted;
        subItems[itemIndex].completedAt = subItems[itemIndex].completed
          ? new Date().toISOString()
          : undefined;

        const completedCount = subItems.filter((item) => item.completed).length;
        const isGoalCompleted = completedCount >= goal.targetValue;

        const [updated] = await db
          .update(yearlyGoals)
          .set({
            subItems,
            currentValue: completedCount,
            completed: isGoalCompleted,
            completedAt: isGoalCompleted ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(yearlyGoals.id, goalId))
          .returning();

        // Log progress
        await db.insert(yearlyGoalProgressLogs).values({
          goalId,
          userId,
          changeType: "toggle_sub_item",
          previousValue: previousCompleted ? 1 : 0,
          newValue: subItems[itemIndex].completed ? 1 : 0,
          subItemId,
          source: "sub_item",
        });

        // Award 25 XP for completing a sub-item (but not for uncompleting)
        if (subItems[itemIndex].completed) {
          await storage.addPoints(
            userId,
            25,
            "goal_progress",
            goalId,
            `Sub-item completed: ${subItems[itemIndex].title}`
          );
        }

        res.json({
          goal: updated,
          subItem: subItems[itemIndex],
          isGoalCompleted,
          completedCount,
        });
      } catch (error) {
        log.error("[yearly-goals] Error toggling sub-item:", error);
        res.status(500).json({ error: "Failed to toggle sub-item" });
      }
    }
  );

  // ==================== REWARDS ENDPOINT ====================

  /**
   * POST /api/yearly-goals/:id/claim-reward
   * Claim XP reward for completed goal
   */
  app.post("/api/yearly-goals/:id/claim-reward", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const goalId = parseInt(req.params.id);
      const db = getDb();

      const [goal] = await db
        .select()
        .from(yearlyGoals)
        .where(and(eq(yearlyGoals.id, goalId), eq(yearlyGoals.userId, userId)));

      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }

      // Compute actual progress to verify completion
      const goalWithProgress = await computeGoalProgress(goal, goal.year, userId, db);

      if (!goalWithProgress.isCompleted) {
        return res.status(400).json({ error: "Goal is not completed yet" });
      }

      if (goal.rewardClaimed) {
        return res.status(400).json({ error: "Reward already claimed" });
      }

      // Award XP
      await storage.addPoints(
        userId,
        goal.xpReward,
        "goal_progress",
        goalId,
        `Yearly goal completed: ${goal.title}`
      );

      // Mark reward as claimed and goal as completed
      await db
        .update(yearlyGoals)
        .set({
          rewardClaimed: true,
          completed: true,
          completedAt: goal.completedAt || new Date(),
          updatedAt: new Date(),
        })
        .where(eq(yearlyGoals.id, goalId));

      // Check for category completion bonus
      const categoryGoals = await db
        .select()
        .from(yearlyGoals)
        .where(
          and(
            eq(yearlyGoals.userId, userId),
            eq(yearlyGoals.year, goal.year),
            eq(yearlyGoals.category, goal.category)
          )
        );

      // Compute progress for all category goals
      const categoryGoalsWithProgress = await Promise.all(
        categoryGoals.map((g) => computeGoalProgress(g, goal.year, userId, db))
      );

      const allCategoryCompleted = categoryGoalsWithProgress.every((g) => g.isCompleted);
      const categoryBonusClaimed = categoryGoals.some(
        (g) => g.rewardClaimed && g.id !== goalId
      );

      let categoryBonus = 0;
      if (allCategoryCompleted && !categoryBonusClaimed && categoryGoals.length > 1) {
        categoryBonus = 500;
        await storage.addPoints(
          userId,
          categoryBonus,
          "goal_progress",
          goalId,
          `Category complete: ${YEARLY_GOAL_CATEGORY_LABELS[goal.category] || goal.category}!`
        );
      }

      res.json({
        success: true,
        pointsAwarded: goal.xpReward,
        categoryBonus,
        totalAwarded: goal.xpReward + categoryBonus,
      });
    } catch (error) {
      log.error("[yearly-goals] Error claiming reward:", error);
      res.status(500).json({ error: "Failed to claim reward" });
    }
  });

  // ==================== COPY YEAR ENDPOINT ====================

  /**
   * POST /api/yearly-goals/copy-year
   * Copy goals from one year to another
   */
  app.post("/api/yearly-goals/copy-year", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { fromYear, toYear } = req.body;

      if (!fromYear || !toYear || fromYear === toYear) {
        return res.status(400).json({ error: "Invalid year parameters" });
      }

      const db = getDb();

      // Check if target year already has goals
      const existingGoals = await db
        .select({ count: count() })
        .from(yearlyGoals)
        .where(and(eq(yearlyGoals.userId, userId), eq(yearlyGoals.year, toYear)));

      if (Number(existingGoals[0]?.count) > 0) {
        return res.status(400).json({
          error: "Target year already has goals. Delete them first or choose a different year.",
        });
      }

      // Fetch source year goals
      const sourceGoals = await db
        .select()
        .from(yearlyGoals)
        .where(and(eq(yearlyGoals.userId, userId), eq(yearlyGoals.year, fromYear)));

      if (sourceGoals.length === 0) {
        return res.status(404).json({ error: "No goals found in source year" });
      }

      // Copy goals with reset values
      const newGoals = await Promise.all(
        sourceGoals.map(async (goal) => {
          // Reset sub-items if compound goal
          const subItems =
            goal.goalType === "compound"
              ? (goal.subItems as YearlyGoalSubItem[]).map((item) => ({
                  ...item,
                  id: randomUUID(),
                  completed: false,
                  completedAt: undefined,
                }))
              : [];

          const [newGoal] = await db
            .insert(yearlyGoals)
            .values({
              userId,
              year: toYear,
              title: goal.title,
              description: goal.description,
              category: goal.category,
              position: goal.position,
              goalType: goal.goalType,
              targetValue: goal.targetValue,
              currentValue: 0,
              linkedHabitId: goal.linkedHabitId,
              linkedJourneyKey: goal.linkedJourneyKey,
              linkedDreamScrollCategory: goal.linkedDreamScrollCategory,
              subItems,
              completed: false,
              completedAt: null,
              xpReward: goal.xpReward,
              rewardClaimed: false,
            })
            .returning();

          return newGoal;
        })
      );

      res.json({
        success: true,
        copiedCount: newGoals.length,
        fromYear,
        toYear,
      });
    } catch (error) {
      log.error("[yearly-goals] Error copying year:", error);
      res.status(500).json({ error: "Failed to copy goals" });
    }
  });
}
