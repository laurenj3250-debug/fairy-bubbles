import type { Express } from "express";
import { requireUser } from "../simple-auth";
import { insertJourneyGoalSchema, DEFAULT_JOURNEY_GOALS, type JourneyGoal, type InsertJourneyGoal } from "@shared/schema";
import { DbStorage } from "../db-storage";

const storage = new DbStorage();
const getUserId = (req: any) => requireUser(req).id;

export function registerJourneyGoalRoutes(app: Express) {
  // GET all journey goals for user (initializes defaults if none exist)
  app.get("/api/journey-goals", async (req, res) => {
    try {
      const userId = getUserId(req);
      let goals = await storage.getJourneyGoals(userId);

      // If no goals exist, initialize with defaults
      if (goals.length === 0) {
        goals = await storage.initializeJourneyGoals(userId);
      }

      res.json(goals);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch journey goals" });
    }
  });

  // GET journey goals by category
  app.get("/api/journey-goals/:category", async (req, res) => {
    try {
      const userId = getUserId(req);
      const category = req.params.category as "cycling" | "lifting" | "climbing";

      if (!["cycling", "lifting", "climbing"].includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }

      const goals = await storage.getJourneyGoalsByCategory(userId, category);
      res.json(goals);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch journey goals" });
    }
  });

  // PATCH update a journey goal target
  app.patch("/api/journey-goals/:goalKey", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { goalKey } = req.params;
      const { targetValue } = req.body;

      if (typeof targetValue !== "number" || targetValue < 0) {
        return res.status(400).json({ error: "Invalid target value" });
      }

      const goal = await storage.updateJourneyGoal(userId, goalKey, targetValue);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }

      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update journey goal" });
    }
  });

  // POST reset journey goals to defaults
  app.post("/api/journey-goals/reset", async (req, res) => {
    try {
      const userId = getUserId(req);
      await storage.deleteJourneyGoals(userId);
      const goals = await storage.initializeJourneyGoals(userId);
      res.json(goals);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to reset journey goals" });
    }
  });

  // NOTE: Linking endpoints removed - Journey is source of truth, Goals page displays read-only
}
