import type { Express } from "express";
import { storage } from "../storage";
import { insertMoodLogSchema } from "@shared/schema";

// Helper to get user ID from request (assuming auth middleware sets req.user)
function getUserId(req: any): number {
  return req.user?.id || 1; // Default to 1 for dev
}

export function registerMoodRoutes(app: Express) {
  // POST /api/mood-logs - Create a new mood log
  app.post("/api/mood-logs", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { emoji, tag, note } = req.body;

      if (!emoji) {
        return res.status(400).json({ error: "Emoji is required" });
      }

      const moodLog = await storage.createMoodLog({
        userId,
        emoji,
        tag: tag || null,
        note: note || null,
      });

      res.json(moodLog);
    } catch (error) {
      console.error("Error creating mood log:", error);
      res.status(500).json({ error: "Failed to create mood log" });
    }
  });

  // GET /api/mood-logs - Get mood logs for a specific date
  app.get("/api/mood-logs", async (req, res) => {
    try {
      const userId = getUserId(req);
      const date = req.query.date as string;

      if (!date) {
        // Default to today
        const today = new Date().toISOString().split("T")[0];
        const logs = await storage.getMoodLogsByDate(userId, today);
        return res.json(logs);
      }

      const logs = await storage.getMoodLogsByDate(userId, date);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching mood logs:", error);
      res.status(500).json({ error: "Failed to fetch mood logs" });
    }
  });

  // GET /api/mood-logs/range/:startDate/:endDate - Get mood logs for a date range
  app.get("/api/mood-logs/range/:startDate/:endDate", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { startDate, endDate } = req.params;

      const logs = await storage.getMoodLogsByDateRange(userId, startDate, endDate);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching mood logs range:", error);
      res.status(500).json({ error: "Failed to fetch mood logs" });
    }
  });

  // GET /api/mood-logs/tags - Get user's previously used tags
  app.get("/api/mood-logs/tags", async (req, res) => {
    try {
      const userId = getUserId(req);
      const tags = await storage.getUserMoodTags(userId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching mood tags:", error);
      res.status(500).json({ error: "Failed to fetch mood tags" });
    }
  });
}
