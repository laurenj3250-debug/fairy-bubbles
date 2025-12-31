import type { Express } from "express";
import { storage } from "../storage";
import { insertResidencyEntrySchema, insertResidencyActivitySchema, insertResidencyConfounderSchema } from "@shared/schema";

// Helper to get user ID from request (assuming auth middleware sets req.user)
function getUserId(req: any): number {
  return req.user?.id || 1; // Default to 1 for dev
}

export function registerResidencyRoutes(app: Express) {
  // ============ ENTRIES ============

  // GET /api/residency/entries - Get all entries
  app.get("/api/residency/entries", async (req, res) => {
    try {
      const userId = getUserId(req);
      const entries = await storage.getResidencyEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching residency entries:", error);
      res.status(500).json({ error: "Failed to fetch entries" });
    }
  });

  // GET /api/residency/entries/range/:startDate/:endDate - Get entries by date range
  app.get("/api/residency/entries/range/:startDate/:endDate", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { startDate, endDate } = req.params;
      const entries = await storage.getResidencyEntriesByDateRange(userId, startDate, endDate);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching residency entries range:", error);
      res.status(500).json({ error: "Failed to fetch entries" });
    }
  });

  // POST /api/residency/entries - Create a new entry
  app.post("/api/residency/entries", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { mood, decision, activity, activityRating, confounders } = req.body;

      if (mood === undefined || mood === null) {
        return res.status(400).json({ error: "Mood is required" });
      }

      if (!decision || !["quit", "stay"].includes(decision)) {
        return res.status(400).json({ error: "Decision must be 'quit' or 'stay'" });
      }

      const entry = await storage.createResidencyEntry({
        userId,
        mood,
        decision,
        activity: activity || null,
        activityRating: activityRating || null,
        confounders: confounders || [],
      });

      res.json(entry);
    } catch (error) {
      console.error("Error creating residency entry:", error);
      res.status(500).json({ error: "Failed to create entry" });
    }
  });

  // DELETE /api/residency/entries/:id - Delete an entry
  app.delete("/api/residency/entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteResidencyEntry(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Entry not found" });
      }
    } catch (error) {
      console.error("Error deleting residency entry:", error);
      res.status(500).json({ error: "Failed to delete entry" });
    }
  });

  // ============ ACTIVITIES ============

  // GET /api/residency/activities - Get all activities
  app.get("/api/residency/activities", async (req, res) => {
    try {
      const userId = getUserId(req);
      const activities = await storage.getResidencyActivities(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching residency activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // POST /api/residency/activities - Create a new activity
  app.post("/api/residency/activities", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Activity name is required" });
      }

      // Get current max position
      const existing = await storage.getResidencyActivities(userId);
      const maxPosition = existing.length > 0
        ? Math.max(...existing.map(a => a.position)) + 1
        : 0;

      const activity = await storage.createResidencyActivity({
        userId,
        name: name.trim(),
        position: maxPosition,
      });

      res.json(activity);
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: "Activity already exists" });
      }
      console.error("Error creating residency activity:", error);
      res.status(500).json({ error: "Failed to create activity" });
    }
  });

  // DELETE /api/residency/activities/:id - Delete an activity
  app.delete("/api/residency/activities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteResidencyActivity(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Activity not found" });
      }
    } catch (error) {
      console.error("Error deleting residency activity:", error);
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  // ============ CONFOUNDERS ============

  // GET /api/residency/confounders - Get all confounders
  app.get("/api/residency/confounders", async (req, res) => {
    try {
      const userId = getUserId(req);
      const confounders = await storage.getResidencyConfounders(userId);
      res.json(confounders);
    } catch (error) {
      console.error("Error fetching residency confounders:", error);
      res.status(500).json({ error: "Failed to fetch confounders" });
    }
  });

  // POST /api/residency/confounders - Create a new confounder
  app.post("/api/residency/confounders", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Confounder name is required" });
      }

      // Get current max position
      const existing = await storage.getResidencyConfounders(userId);
      const maxPosition = existing.length > 0
        ? Math.max(...existing.map(c => c.position)) + 1
        : 0;

      const confounder = await storage.createResidencyConfounder({
        userId,
        name: name.trim(),
        position: maxPosition,
      });

      res.json(confounder);
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: "Confounder already exists" });
      }
      console.error("Error creating residency confounder:", error);
      res.status(500).json({ error: "Failed to create confounder" });
    }
  });

  // DELETE /api/residency/confounders/:id - Delete a confounder
  app.delete("/api/residency/confounders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteResidencyConfounder(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Confounder not found" });
      }
    } catch (error) {
      console.error("Error deleting residency confounder:", error);
      res.status(500).json({ error: "Failed to delete confounder" });
    }
  });

  // ============ CONFOUNDER STATE ============

  // GET /api/residency/confounder-state - Get current sticky confounder state
  app.get("/api/residency/confounder-state", async (req, res) => {
    try {
      const userId = getUserId(req);
      const state = await storage.getResidencyConfounderState(userId);
      res.json(state || { activeConfounders: [] });
    } catch (error) {
      console.error("Error fetching confounder state:", error);
      res.status(500).json({ error: "Failed to fetch confounder state" });
    }
  });

  // PUT /api/residency/confounder-state - Update sticky confounder state
  app.put("/api/residency/confounder-state", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { activeConfounders } = req.body;

      if (!Array.isArray(activeConfounders)) {
        return res.status(400).json({ error: "activeConfounders must be an array" });
      }

      const state = await storage.updateResidencyConfounderState(userId, activeConfounders);
      res.json(state);
    } catch (error) {
      console.error("Error updating confounder state:", error);
      res.status(500).json({ error: "Failed to update confounder state" });
    }
  });

  // ============ INITIALIZATION ============

  // POST /api/residency/initialize - Initialize default activities and confounders
  app.post("/api/residency/initialize", async (req, res) => {
    try {
      const userId = getUserId(req);
      await storage.initializeResidencyDefaults(userId);

      // Return the initialized data
      const [activities, confounders, state] = await Promise.all([
        storage.getResidencyActivities(userId),
        storage.getResidencyConfounders(userId),
        storage.getResidencyConfounderState(userId),
      ]);

      res.json({ activities, confounders, confounderState: state });
    } catch (error) {
      console.error("Error initializing residency defaults:", error);
      res.status(500).json({ error: "Failed to initialize defaults" });
    }
  });

  // ============ ANALYTICS ============

  // GET /api/residency/analytics - Get computed analytics
  app.get("/api/residency/analytics", async (req, res) => {
    try {
      const userId = getUserId(req);
      const entries = await storage.getResidencyEntries(userId);

      if (entries.length === 0) {
        return res.json({
          totalEntries: 0,
          overallMoodAvg: null,
          overallQuitRate: null,
          activityStats: [],
          confounderStats: [],
          trends: { last7Days: null, last30Days: null },
        });
      }

      // Calculate overall stats
      const totalEntries = entries.length;
      const overallMoodAvg = entries.reduce((sum, e) => sum + e.mood, 0) / totalEntries;
      const quitCount = entries.filter(e => e.decision === "quit").length;
      const overallQuitRate = (quitCount / totalEntries) * 100;

      // Activity stats
      const activityMap = new Map<string, { ratings: number[], moods: number[], decisions: string[] }>();
      for (const entry of entries) {
        if (entry.activity) {
          if (!activityMap.has(entry.activity)) {
            activityMap.set(entry.activity, { ratings: [], moods: [], decisions: [] });
          }
          const stats = activityMap.get(entry.activity)!;
          if (entry.activityRating !== null) {
            stats.ratings.push(entry.activityRating);
          }
          stats.moods.push(entry.mood);
          stats.decisions.push(entry.decision);
        }
      }

      const activityStats = Array.from(activityMap.entries()).map(([activity, stats]) => ({
        activity,
        count: stats.moods.length,
        avgRating: stats.ratings.length > 0
          ? stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length
          : null,
        avgMood: stats.moods.reduce((a, b) => a + b, 0) / stats.moods.length,
        quitRate: (stats.decisions.filter(d => d === "quit").length / stats.decisions.length) * 100,
      })).sort((a, b) => b.count - a.count);

      // Confounder stats
      const confounderMap = new Map<string, { moods: number[], decisions: string[] }>();
      const noConfounderEntries: { mood: number, decision: string }[] = [];

      for (const entry of entries) {
        const confounders = entry.confounders as string[];
        if (confounders.length === 0) {
          noConfounderEntries.push({ mood: entry.mood, decision: entry.decision });
        } else {
          for (const confounder of confounders) {
            if (!confounderMap.has(confounder)) {
              confounderMap.set(confounder, { moods: [], decisions: [] });
            }
            const stats = confounderMap.get(confounder)!;
            stats.moods.push(entry.mood);
            stats.decisions.push(entry.decision);
          }
        }
      }

      const baselineMood = noConfounderEntries.length > 0
        ? noConfounderEntries.reduce((sum, e) => sum + e.mood, 0) / noConfounderEntries.length
        : overallMoodAvg;

      const confounderStats = Array.from(confounderMap.entries()).map(([confounder, stats]) => ({
        confounder,
        count: stats.moods.length,
        avgMood: stats.moods.reduce((a, b) => a + b, 0) / stats.moods.length,
        moodImpact: (stats.moods.reduce((a, b) => a + b, 0) / stats.moods.length) - baselineMood,
        quitRate: (stats.decisions.filter(d => d === "quit").length / stats.decisions.length) * 100,
      })).sort((a, b) => a.moodImpact - b.moodImpact);

      // Trends (last 7 and 30 days)
      const now = new Date();
      const last7Days = entries.filter(e => {
        const entryDate = new Date(e.timestamp);
        const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      });

      const last30Days = entries.filter(e => {
        const entryDate = new Date(e.timestamp);
        const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
      });

      const trends = {
        last7Days: last7Days.length > 0 ? {
          avgMood: last7Days.reduce((sum, e) => sum + e.mood, 0) / last7Days.length,
          quitRate: (last7Days.filter(e => e.decision === "quit").length / last7Days.length) * 100,
          count: last7Days.length,
        } : null,
        last30Days: last30Days.length > 0 ? {
          avgMood: last30Days.reduce((sum, e) => sum + e.mood, 0) / last30Days.length,
          quitRate: (last30Days.filter(e => e.decision === "quit").length / last30Days.length) * 100,
          count: last30Days.length,
        } : null,
      };

      res.json({
        totalEntries,
        overallMoodAvg,
        overallQuitRate,
        baselineMood,
        activityStats,
        confounderStats,
        trends,
      });
    } catch (error) {
      console.error("Error computing analytics:", error);
      res.status(500).json({ error: "Failed to compute analytics" });
    }
  });
}
