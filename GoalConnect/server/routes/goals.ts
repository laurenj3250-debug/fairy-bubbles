import type { Express } from "express";
import { storage } from "../storage";
import { requireUser } from "../simple-auth";
import { insertGoalSchema, insertGoalUpdateSchema, yearlyGoals, goals, YearlyGoalSubItem } from "@shared/schema";
import { getDb } from "../db";
import { eq, and, inArray } from "drizzle-orm";
import { log } from "../lib/logger";
import { XP_CONFIG } from "@shared/xp-config";
import { computeMonthlyProgress } from "./yearly-goals";

const getUserId = (req: any) => requireUser(req).id;

// Strip internal link metadata from description before sending to client
const cleanDescription = (description: string): string => {
  if (description && description.includes("|||")) {
    return description.split("|||")[0];
  }
  return description;
};

const cleanGoal = <T extends { description: string }>(goal: T): T => ({
  ...goal,
  description: cleanDescription(goal.description),
});

export function registerGoalRoutes(app: Express) {
  // GET all goals for user
  app.get("/api/goals", async (req, res) => {
    try {
      const userId = getUserId(req);
      const goals = await storage.getGoals(userId);
      res.json(goals.map(cleanGoal));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  // ============ MONTHLY GOAL GENERATION ============
  // IMPORTANT: These must be registered BEFORE /api/goals/:id to avoid
  // Express matching "generate-monthly" and "sync-monthly-progress" as :id params.

  /**
   * POST /api/goals/generate-monthly
   * Auto-generate monthly goals from COUNT yearly goals.
   * Idempotent: calling twice won't duplicate goals.
   */
  app.post("/api/goals/generate-monthly", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { month } = req.body; // e.g. "2026-02"

      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: "Invalid month format. Expected YYYY-MM" });
      }

      const db = getDb();
      const [yearStr, monthStr] = month.split("-");

      // Fetch all COUNT yearly goals for this user and year
      const yearlyCountGoals = await db
        .select()
        .from(yearlyGoals)
        .where(
          and(
            eq(yearlyGoals.userId, userId),
            eq(yearlyGoals.year, yearStr),
            eq(yearlyGoals.goalType, "count")
          )
        );

      // Fetch existing monthly goals for this user and month
      const existingMonthlyGoals = await storage.getGoals(userId);
      const existingLinked = new Map(
        existingMonthlyGoals
          .filter((g) => g.month === month && g.linkedYearlyGoalId != null)
          .map((g) => [g.linkedYearlyGoalId!, g])
      );

      const lastDay = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
      const deadline = `${month}-${String(lastDay).padStart(2, "0")}`;
      const monthNum = parseInt(monthStr);

      const generated: any[] = [];

      for (const yGoal of yearlyCountGoals) {
        // Skip if monthly goal already exists for this yearly goal + month
        if (existingLinked.has(yGoal.id)) {
          generated.push(existingLinked.get(yGoal.id));
          continue;
        }

        const monthlyTarget = Math.ceil(yGoal.targetValue / 12);

        // For goals with small targets (< 12), only generate for spread months
        if (yGoal.targetValue < 12) {
          const interval = Math.floor(12 / yGoal.targetValue);
          const activeMonths: number[] = [];
          for (let i = 0; i < yGoal.targetValue; i++) {
            activeMonths.push(1 + i * interval);
          }
          if (!activeMonths.includes(monthNum)) {
            continue;
          }
        }

        // Infer unit from yearly goal title
        let unit = "times";
        const titleLower = yGoal.title.toLowerCase();
        if (titleLower.includes("day")) unit = "days";
        else if (titleLower.includes("book") || titleLower.includes("audiobook")) unit = "books";
        else if (titleLower.includes("visit") || titleLower.includes("hangout")) unit = "times";
        else if (titleLower.includes("item") || titleLower.includes("bucket")) unit = "items";
        else if (titleLower.includes("climb")) unit = "climbs";

        const newGoal = await storage.createGoal({
          userId,
          title: yGoal.title,
          description: `Auto-generated from yearly goal: ${yGoal.title}`,
          targetValue: monthlyTarget,
          currentValue: 0,
          unit,
          deadline,
          category: yGoal.category,
          difficulty: "medium",
          priority: "medium",
          month,
          week: null,
          archived: false,
          parentGoalId: null,
          linkedYearlyGoalId: yGoal.id,
        });

        generated.push(newGoal);
        log.info(`[goals] Generated monthly goal "${yGoal.title}" (target: ${monthlyTarget}) for ${month} from yearly goal #${yGoal.id}`);
      }

      res.json({ generated, count: generated.length });
    } catch (error: any) {
      log.error("[goals] Error generating monthly goals:", error);
      res.status(500).json({ error: error.message || "Failed to generate monthly goals" });
    }
  });

  /**
   * PATCH /api/goals/sync-monthly-progress
   * Recalculate currentValue for auto-tracked monthly goals using month-scoped date ranges.
   */
  app.patch("/api/goals/sync-monthly-progress", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { month } = req.body; // e.g. "2026-02"

      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: "Invalid month format. Expected YYYY-MM" });
      }

      const db = getDb();

      // Find all monthly goals with linkedYearlyGoalId for this month
      const allGoals = await storage.getGoals(userId);
      const monthlyLinkedGoals = allGoals.filter(
        (g) => g.month === month && g.linkedYearlyGoalId != null
      );

      // Batch-fetch all linked yearly goals in one query (avoid N+1)
      const yearlyGoalIds = monthlyLinkedGoals.map((g) => g.linkedYearlyGoalId!);
      const yearlyGoalRows = yearlyGoalIds.length > 0
        ? await db
            .select()
            .from(yearlyGoals)
            .where(
              and(
                inArray(yearlyGoals.id, yearlyGoalIds),
                eq(yearlyGoals.userId, userId)
              )
            )
        : [];
      const yearlyGoalMap = new Map(yearlyGoalRows.map((g) => [g.id, g]));

      const updated: any[] = [];

      for (const mGoal of monthlyLinkedGoals) {
        const yGoal = yearlyGoalMap.get(mGoal.linkedYearlyGoalId!);
        if (!yGoal) continue;

        // Only sync auto-tracked goals (those with linked integrations)
        const isAutoTracked = !!(yGoal.linkedJourneyKey || yGoal.linkedHabitId || yGoal.linkedDreamScrollCategory);
        if (!isAutoTracked) continue;

        const rawValue = await computeMonthlyProgress(yGoal, month, userId, db);
        const monthlyValue = Number.isFinite(rawValue) ? rawValue : 0;

        if (monthlyValue !== mGoal.currentValue) {
          await storage.updateGoal(mGoal.id, { currentValue: monthlyValue });
          updated.push({ id: mGoal.id, title: mGoal.title, previousValue: mGoal.currentValue, newValue: monthlyValue });
        }
      }

      res.json({ updated, count: updated.length });
    } catch (error: any) {
      log.error("[goals] Error syncing monthly progress:", error);
      res.status(500).json({ error: error.message || "Failed to sync monthly progress" });
    }
  });

  // GET abandoned goals (no updates in 90+ days and not completed)
  app.get("/api/goals/abandoned", async (req, res) => {
    try {
      const userId = getUserId(req);
      const goals = await storage.getGoals(userId);

      // Filter incomplete goals
      const incompleteGoals = goals.filter(
        goal => goal.currentValue < goal.targetValue
      );

      // For each incomplete goal, get the most recent update
      const abandonedGoals = [];
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      for (const goal of incompleteGoals) {
        const updates = await storage.getGoalUpdates(goal.id);

        // If no updates, use a very old date to consider it abandoned
        if (updates.length === 0) {
          abandonedGoals.push(cleanGoal({
            ...goal,
            lastUpdateDate: null,
            daysSinceUpdate: 999,
          }));
          continue;
        }

        // Get the most recent update
        const sortedUpdates = updates.sort((a, b) => b.date.localeCompare(a.date));
        const lastUpdate = sortedUpdates[0];
        const lastUpdateDate = new Date(lastUpdate.date);
        const daysSinceUpdate = Math.floor(
          (Date.now() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Include if last update was more than 90 days ago
        if (daysSinceUpdate >= 90) {
          abandonedGoals.push(cleanGoal({
            ...goal,
            lastUpdateDate: lastUpdate.date,
            daysSinceUpdate,
          }));
        }
      }

      res.json(abandonedGoals);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch abandoned goals" });
    }
  });

  // GET single goal by ID
  app.get("/api/goals/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const goal = await storage.getGoal(id);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      // Verify ownership
      if (goal.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(cleanGoal(goal));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goal" });
    }
  });

  // POST create new goal
  app.post("/api/goals", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertGoalSchema.parse({ ...req.body, userId });
      const goal = await storage.createGoal(validated);
      res.status(201).json(goal);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid goal data" });
    }
  });

  // PATCH update goal
  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before update
      const existing = await storage.getGoal(id);
      if (!existing) {
        return res.status(404).json({ error: "Goal not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const wasCompleted = existing.currentValue >= existing.targetValue;
      const goal = await storage.updateGoal(id, req.body);
      if (!goal) {
        return res.status(500).json({ error: "Failed to update goal" });
      }
      const isNowCompleted = goal.currentValue >= goal.targetValue;

      // Sync with linked yearly goal sub-item if completion status changed
      // Link data is stored in description field after "|||" separator
      if (goal.description && goal.description.includes("|||") && wasCompleted !== isNowCompleted) {
        try {
          const linkDataStr = goal.description.split("|||")[1];
          const linkData = JSON.parse(linkDataStr);
          if (linkData.linkedYearlyGoalId && linkData.linkedSubItemId) {
            const db = getDb();
            const [yearlyGoal] = await db
              .select()
              .from(yearlyGoals)
              .where(
                and(
                  eq(yearlyGoals.id, linkData.linkedYearlyGoalId),
                  eq(yearlyGoals.userId, userId)
                )
              );

            if (yearlyGoal && yearlyGoal.goalType === "compound") {
              const subItems = yearlyGoal.subItems as YearlyGoalSubItem[];
              const itemIndex = subItems.findIndex((item) => item.id === linkData.linkedSubItemId);

              if (itemIndex !== -1) {
                subItems[itemIndex].completed = isNowCompleted;
                subItems[itemIndex].completedAt = isNowCompleted ? new Date().toISOString() : undefined;

                const completedCount = subItems.filter((item) => item.completed).length;
                const isGoalCompleted = completedCount >= yearlyGoal.targetValue;

                await db
                  .update(yearlyGoals)
                  .set({
                    subItems,
                    currentValue: completedCount,
                    completed: isGoalCompleted,
                    completedAt: isGoalCompleted ? new Date() : null,
                    updatedAt: new Date(),
                  })
                  .where(eq(yearlyGoals.id, linkData.linkedYearlyGoalId));

                log.info(`[goals] Synced weekly goal #${id} -> yearly goal #${linkData.linkedYearlyGoalId} sub-item ${linkData.linkedSubItemId} (completed: ${isNowCompleted})`);
              }
            }
          }
        } catch (parseError) {
          // Notes field doesn't contain valid JSON link data, skip sync
        }
      }

      res.json(cleanGoal(goal));
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update goal" });
    }
  });

  // DELETE goal
  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before delete
      const existing = await storage.getGoal(id);
      if (!existing) {
        return res.status(404).json({ error: "Goal not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteGoal(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // POST reactivate an abandoned goal by adding a new update
  app.post("/api/goals/:id/reactivate", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);

      // Verify ownership
      const existing = await storage.getGoal(id);
      if (!existing) {
        return res.status(404).json({ error: "Goal not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Add a new update with current value to "reactivate" the goal
      const today = new Date().toISOString().split('T')[0];
      const update = await storage.createGoalUpdate({
        goalId: id,
        userId,
        date: today,
        value: existing.currentValue,
        note: "Goal reactivated from abandoned gear",
      });

      res.json({ success: true, goal: cleanGoal(existing), update });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to reactivate goal" });
    }
  });

  // ============ GOAL UPDATES ============

  // GET goal updates for a goal
  app.get("/api/goal-updates/:goalId", async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const updates = await storage.getGoalUpdates(goalId);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goal updates" });
    }
  });

  // POST create goal update
  app.post("/api/goal-updates", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertGoalUpdateSchema.parse({ ...req.body, userId });

      // Create update and get milestone info in a single atomic operation
      const result = await storage.createGoalUpdate(validated);

      // Check if milestones were crossed and award points
      let pointsEarned = 0;
      if (result.milestonesCrossed && result.milestonesCrossed > 0 && result.goal) {
        // Base points per milestone
        let points = result.milestonesCrossed * XP_CONFIG.goal.progressPerMilestone;

        // Calculate urgency multiplier based on days until deadline
        const today = new Date();
        const deadline = new Date(result.goal.deadline);
        const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let urgencyMultiplier = 1.0;
        if (daysUntil <= 3) {
          urgencyMultiplier = 2.5; // Last 3 days
        } else if (daysUntil <= 7) {
          urgencyMultiplier = 2.0; // Last week
        } else if (daysUntil <= 14) {
          urgencyMultiplier = 1.5; // Last 2 weeks
        }

        // Calculate priority multiplier
        const priorityMultiplier = XP_CONFIG.goal.priorityMultiplier[result.goal.priority] || 1.0;

        // Apply both multipliers
        points = Math.round(points * urgencyMultiplier * priorityMultiplier);

        // Build description with multiplier info
        let description = `Progress on "${result.goal.title}": ${result.goal.currentValue}/${result.goal.targetValue} ${result.goal.unit}`;
        if (urgencyMultiplier > 1.0 || priorityMultiplier !== 1.0) {
          const multipliers = [];
          if (urgencyMultiplier > 1.0) multipliers.push(`${urgencyMultiplier}x urgency`);
          if (priorityMultiplier !== 1.0) multipliers.push(`${priorityMultiplier}x priority`);
          description += ` (${multipliers.join(", ")})`;
        }

        await storage.addPoints(
          userId,
          points,
          "goal_progress",
          result.update.id,
          description
        );
        pointsEarned += points;
      }

      // Goal completion bonus — one-time award when goal hits 100%
      if (result.goal && result.goal.currentValue >= result.goal.targetValue) {
        try {
          const existingCompletion = await storage.getPointTransactionByTypeAndRelatedId(
            userId, 'goal_complete', result.goal.id
          );
          if (!existingCompletion) {
            await storage.addPoints(
              userId,
              XP_CONFIG.goal.completionBonus,
              'goal_complete',
              result.goal.id,
              `Goal completed: "${result.goal.title}"`
            );
            pointsEarned += XP_CONFIG.goal.completionBonus;
          }
        } catch (completionError) {
          log.error('[goals] Goal completion bonus failed:', completionError);
        }
      }

      res.status(201).json({ ...result.update, pointsEarned });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid goal update data" });
    }
  });
}
