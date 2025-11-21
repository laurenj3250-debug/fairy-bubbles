import type { Express } from "express";
import { storage } from "../storage";
import { requireUser } from "../simple-auth";
import { insertGoalSchema, insertGoalUpdateSchema } from "@shared/schema";

const getUserId = (req: any) => requireUser(req).id;

export function registerGoalRoutes(app: Express) {
  // GET all goals for user
  app.get("/api/goals", async (req, res) => {
    try {
      const userId = getUserId(req);
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
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
          abandonedGoals.push({
            ...goal,
            lastUpdateDate: null,
            daysSinceUpdate: 999,
          });
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
          abandonedGoals.push({
            ...goal,
            lastUpdateDate: lastUpdate.date,
            daysSinceUpdate,
          });
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
      res.json(goal);
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
      const goal = await storage.updateGoal(id, req.body);
      res.json(goal);
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

      res.json({ success: true, goal: existing, update });
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
      if (result.milestonesCrossed && result.milestonesCrossed > 0 && result.goal) {
        // Base points per milestone
        let points = result.milestonesCrossed * 5; // 5 points per 10% milestone

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
        const priorityMultipliers = {
          high: 1.5,
          medium: 1.0,
          low: 0.75
        };
        const priorityMultiplier = priorityMultipliers[result.goal.priority] || 1.0;

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
      }

      res.status(201).json(result.update);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid goal update data" });
    }
  });
}
