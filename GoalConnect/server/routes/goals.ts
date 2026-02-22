import type { Express } from "express";
import { storage } from "../storage";
import { requireUser } from "../simple-auth";
import { insertGoalSchema, insertGoalUpdateSchema, yearlyGoals, goals, YearlyGoalSubItem } from "@shared/schema";
import { getDb } from "../db";
import { eq, and, inArray } from "drizzle-orm";
import { log } from "../lib/logger";
import { XP_CONFIG } from "@shared/xp-config";
import { computeMonthlyProgress, computeWeeklyProgress, parseISOWeekRange } from "./yearly-goals";

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

// ============ SHARED HELPERS FOR PERIODIC GOAL GENERATION ============

/** Infer a human-readable unit from the yearly goal title */
function inferUnitFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("day")) return "days";
  if (t.includes("book") || t.includes("audiobook")) return "books";
  if (t.includes("visit") || t.includes("hangout")) return "times";
  if (t.includes("item") || t.includes("bucket")) return "items";
  if (t.includes("climb")) return "climbs";
  return "times";
}

interface PeriodConfig {
  type: "monthly" | "weekly";
  period: string;     // "2026-02" or "2026-W07"
  yearStr: string;
  periodNum: number;  // 1-12 or 1-53
  divisor: number;    // 12 or 52
  deadline: string;   // "YYYY-MM-DD"
}

/**
 * Generate periodic goals from COUNT yearly goals. Idempotent.
 * Shared by monthly and weekly generation endpoints.
 */
async function generatePeriodicGoals(userId: number, cfg: PeriodConfig, db: ReturnType<typeof getDb>) {
  const yearlyCountGoals = await db
    .select()
    .from(yearlyGoals)
    .where(and(eq(yearlyGoals.userId, userId), eq(yearlyGoals.year, cfg.yearStr), eq(yearlyGoals.goalType, "count")));

  const existingGoals = await storage.getGoals(userId);
  const existingLinked = new Map(
    existingGoals
      .filter((g) => {
        const match = cfg.type === "monthly" ? g.month === cfg.period : g.week === cfg.period;
        return match && g.linkedYearlyGoalId != null;
      })
      .map((g) => [g.linkedYearlyGoalId!, g])
  );

  const generated: any[] = [];

  for (const yGoal of yearlyCountGoals) {
    if (existingLinked.has(yGoal.id)) {
      generated.push(existingLinked.get(yGoal.id));
      continue;
    }

    const target = Math.ceil(yGoal.targetValue / cfg.divisor);

    // For small targets, only generate for evenly-spread periods
    if (yGoal.targetValue < cfg.divisor) {
      const interval = Math.floor(cfg.divisor / yGoal.targetValue);
      const activePeriods: number[] = [];
      for (let i = 0; i < yGoal.targetValue; i++) {
        activePeriods.push(1 + i * interval);
      }
      if (!activePeriods.includes(cfg.periodNum)) continue;
    }

    const newGoal = await storage.createGoal({
      userId,
      title: yGoal.title,
      description: `Auto-generated from yearly goal: ${yGoal.title}`,
      targetValue: target,
      currentValue: 0,
      unit: inferUnitFromTitle(yGoal.title),
      deadline: cfg.deadline,
      category: yGoal.category,
      difficulty: "medium",
      priority: "medium",
      month: cfg.type === "monthly" ? cfg.period : null,
      week: cfg.type === "weekly" ? cfg.period : null,
      archived: false,
      parentGoalId: null,
      linkedYearlyGoalId: yGoal.id,
    });

    generated.push(newGoal);
    log.info(`[goals] Generated ${cfg.type} goal "${yGoal.title}" (target: ${target}) for ${cfg.period} from yearly goal #${yGoal.id}`);
  }

  return generated;
}

/**
 * Sync progress for periodic goals linked to yearly goals.
 * Shared by monthly and weekly sync endpoints.
 */
async function syncPeriodicProgress(
  userId: number,
  periodType: "monthly" | "weekly",
  period: string,
  computeFn: (goal: any, period: string, userId: number, db: ReturnType<typeof getDb>) => Promise<number>,
  db: ReturnType<typeof getDb>
) {
  const allGoals = await storage.getGoals(userId);
  const linkedGoals = allGoals.filter((g) => {
    const match = periodType === "monthly" ? g.month === period : g.week === period;
    return match && g.linkedYearlyGoalId != null;
  });

  const yearlyGoalIds = linkedGoals.map((g) => g.linkedYearlyGoalId!);
  const yearlyGoalRows = yearlyGoalIds.length > 0
    ? await db.select().from(yearlyGoals).where(and(inArray(yearlyGoals.id, yearlyGoalIds), eq(yearlyGoals.userId, userId)))
    : [];
  const yearlyGoalMap = new Map(yearlyGoalRows.map((g) => [g.id, g]));

  const updated: any[] = [];

  for (const pGoal of linkedGoals) {
    const yGoal = yearlyGoalMap.get(pGoal.linkedYearlyGoalId!);
    if (!yGoal) continue;

    const isAutoTracked = !!(yGoal.linkedJourneyKey || yGoal.linkedHabitId || yGoal.linkedDreamScrollCategory);
    if (!isAutoTracked) continue;

    const rawValue = await computeFn(yGoal, period, userId, db);
    const value = Number.isFinite(rawValue) ? rawValue : 0;

    if (value !== pGoal.currentValue) {
      await storage.updateGoal(pGoal.id, { currentValue: value });
      updated.push({ id: pGoal.id, title: pGoal.title, previousValue: pGoal.currentValue, newValue: value });
    }
  }

  return updated;
}

export function registerGoalRoutes(app: Express) {
  // GET all goals for user — linked periodic goals get fresh computed values
  // from the yearly goal's progress logs + auto-tracking (no sync needed).
  app.get("/api/goals", async (req, res) => {
    try {
      const userId = getUserId(req);
      const allGoals = await storage.getGoals(userId);
      const db = getDb();

      // Batch-fetch yearly goals for all linked periodic goals
      const linkedGoals = allGoals.filter((g) => g.linkedYearlyGoalId != null);
      const yearlyGoalIds = Array.from(new Set(linkedGoals.map((g) => g.linkedYearlyGoalId!)));

      let yearlyGoalMap = new Map<number, any>();
      if (yearlyGoalIds.length > 0) {
        const rows = await db
          .select()
          .from(yearlyGoals)
          .where(and(inArray(yearlyGoals.id, yearlyGoalIds), eq(yearlyGoals.userId, userId)));
        yearlyGoalMap = new Map(rows.map((g) => [g.id, g]));
      }

      // Compute fresh values for linked goals in parallel
      const enriched = await Promise.all(
        allGoals.map(async (g) => {
          if (g.linkedYearlyGoalId) {
            const yGoal = yearlyGoalMap.get(g.linkedYearlyGoalId);
            if (yGoal) {
              try {
                let freshValue = g.currentValue; // fallback
                if (g.week) {
                  freshValue = await computeWeeklyProgress(yGoal, g.week, userId, db);
                } else if (g.month) {
                  freshValue = await computeMonthlyProgress(yGoal, g.month, userId, db);
                }
                return cleanGoal({ ...g, currentValue: freshValue });
              } catch {
                // Fall back to stored value on error
              }
            }
          }
          return cleanGoal(g);
        })
      );

      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  // ============ PERIODIC GOAL GENERATION & SYNC ============
  // IMPORTANT: These must be registered BEFORE /api/goals/:id to avoid
  // Express matching "generate-monthly" etc. as :id params.

  app.post("/api/goals/generate-monthly", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { month } = req.body;
      if (!month || !/^\d{4}-\d{2}$/.test(month))
        return res.status(400).json({ error: "Invalid month format. Expected YYYY-MM" });

      const db = getDb();
      const [yearStr, monthStr] = month.split("-");
      const lastDay = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();

      const generated = await generatePeriodicGoals(userId, {
        type: "monthly", period: month, yearStr,
        periodNum: parseInt(monthStr), divisor: 12,
        deadline: `${month}-${String(lastDay).padStart(2, "0")}`,
      }, db);

      res.json({ generated, count: generated.length });
    } catch (error: any) {
      log.error("[goals] Error generating monthly goals:", error);
      res.status(500).json({ error: error.message || "Failed to generate monthly goals" });
    }
  });

  app.patch("/api/goals/sync-monthly-progress", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { month } = req.body;
      if (!month || !/^\d{4}-\d{2}$/.test(month))
        return res.status(400).json({ error: "Invalid month format. Expected YYYY-MM" });

      const updated = await syncPeriodicProgress(userId, "monthly", month, computeMonthlyProgress, getDb());
      res.json({ updated, count: updated.length });
    } catch (error: any) {
      log.error("[goals] Error syncing monthly progress:", error);
      res.status(500).json({ error: error.message || "Failed to sync monthly progress" });
    }
  });

  app.post("/api/goals/generate-weekly", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { week } = req.body;
      if (!week || !/^\d{4}-W\d{2}$/.test(week))
        return res.status(400).json({ error: "Invalid week format. Expected YYYY-Wnn" });

      const range = parseISOWeekRange(week);
      if (!range) return res.status(400).json({ error: "Invalid ISO week" });

      const generated = await generatePeriodicGoals(userId, {
        type: "weekly", period: week, yearStr: week.split("-")[0],
        periodNum: parseInt(week.split("-W")[1]), divisor: 52,
        deadline: range.sunday,
      }, getDb());

      res.json({ generated, count: generated.length });
    } catch (error: any) {
      log.error("[goals] Error generating weekly goals:", error);
      res.status(500).json({ error: error.message || "Failed to generate weekly goals" });
    }
  });

  app.patch("/api/goals/sync-weekly-progress", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { week } = req.body;
      if (!week || !/^\d{4}-W\d{2}$/.test(week))
        return res.status(400).json({ error: "Invalid week format. Expected YYYY-Wnn" });

      const updated = await syncPeriodicProgress(userId, "weekly", week, computeWeeklyProgress, getDb());
      res.json({ updated, count: updated.length });
    } catch (error: any) {
      log.error("[goals] Error syncing weekly progress:", error);
      res.status(500).json({ error: error.message || "Failed to sync weekly progress" });
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

      // Award one-time completion bonus (idempotent — checks for existing transaction)
      // Progress XP is handled by POST /api/goal-updates with milestone-based calculations
      let pointsEarned = 0;
      if (!wasCompleted && isNowCompleted) {
        try {
          const existingTx = await storage.getPointTransactionByTypeAndRelatedId(
            userId, 'goal_complete', id
          );
          if (!existingTx) {
            await storage.addPoints(
              userId,
              XP_CONFIG.goal.completionBonus,
              'goal_complete',
              id,
              `Goal completed: "${goal.title}"`
            );
            pointsEarned = XP_CONFIG.goal.completionBonus;
          }
        } catch (xpError) {
          log.error('[goals] PATCH completion bonus failed:', xpError);
        }
      }

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

      res.json({ ...cleanGoal(goal), pointsEarned });
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
