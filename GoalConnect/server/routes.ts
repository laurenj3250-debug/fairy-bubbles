import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ensureDatabaseInitialized } from "./init-db";
import { log } from "./lib/logger";
import { getDb } from "./db";
import { eq, and } from "drizzle-orm";
import * as schema from "@shared/schema";
import {
  insertUserSettingsSchema,
} from "@shared/schema";
import {
  calculateStreak,
  calculateWeeklyCompletion,
} from "./pet-utils";
import { requireUser } from "./simple-auth";
import { registerHabitRoutes } from "./routes/habits";
import { registerGoalRoutes } from "./routes/goals";
import { registerImportRoutes } from "./routes/import";
import { registerKilterBoardRoutes } from "./routes/kilter-board";
import { registerStravaRoutes } from "./routes/strava";
import { registerHabitMappingRoutes } from "./routes/habit-mappings";
import { registerPointRoutes } from "./routes/points";
import { registerJourneyGoalRoutes } from "./routes/journey-goals";
import { registerClimbingLogRoutes } from "./routes/climbing-log";
import { registerLiftingRoutes } from "./routes/lifting";
import { registerYearlyGoalRoutes } from "./routes/yearly-goals";
import { registerGoalCalendarRoutes } from "./routes/goal-calendar";
import { registerBrainDumpRoutes } from "./routes/brain-dump";
import { registerMediaLibraryRoutes } from "./routes/media-library";
import { registerAdventuresRoutes } from "./routes/adventures";
import { registerRecentActivitiesRoutes } from "./routes/recent-activities";
import { registerRewardRoutes } from "./routes/rewards";
import { registerWellnessWheelRoutes } from "./routes/wellness-wheel";
import {
  DatabaseError,
  getErrorMessage,
  formatErrorForLogging
} from "./errors";

const getUserId = (req: Request) => requireUser(req).id;

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    await ensureDatabaseInitialized();
  } catch (error) {
    const errorLog = formatErrorForLogging(error);
    log.error("[routes] Database initialization check failed:", errorLog);
    throw new DatabaseError(getErrorMessage(error), "ensureDatabaseInitialized");
  }

  // Habit routes moved to routes/habits.ts
  app.get("/api/settings", async (req, res) => {
    try {
      const userId = getUserId(req);
      let settings = await storage.getUserSettings(userId);
      if (!settings) {
        settings = await storage.updateUserSettings({
          userId,
          darkMode: true,
          notifications: true,
        });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertUserSettingsSchema.parse({ ...req.body, userId });
      const settings = await storage.updateUserSettings(validated);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) || "Invalid settings data" });
    }
  });

  app.get("/api/export", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getHabits(userId);
      const goals = await storage.getGoals(userId);
      
      const allLogs = await Promise.all(
        habits.map(h => storage.getHabitLogs(h.id))
      );
      const habitLogs = allLogs.flat();
      
      const allUpdates = await Promise.all(
        goals.map(g => storage.getGoalUpdates(g.id))
      );
      const goalUpdates = allUpdates.flat();
      
      const exportData = {
        habits,
        habitLogs,
        goals,
        goalUpdates,
        exportedAt: new Date().toISOString(),
      };
      
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Stats endpoint for dashboard
  app.get("/api/stats", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getHabits(userId);
      const allLogs = await storage.getAllHabitLogs(userId);

      const currentStreak = calculateStreak(allLogs);
      const weeklyCompletion = calculateWeeklyCompletion(habits, allLogs);

      res.json({
        currentStreak,
        weeklyCompletion,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Points Routes
  app.get("/api/points", async (req, res) => {
    try {
      const userId = getUserId(req);
      const points = await storage.getUserPoints(userId);
      res.json(points);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch points" });
    }
  });

  // Alias for user points
  app.get("/api/user-points", async (req, res) => {
    try {
      const userId = getUserId(req);
      const points = await storage.getUserPoints(userId);
      res.json(points);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch points" });
    }
  });

  app.get("/api/points/transactions", async (req, res) => {
    try {
      const userId = getUserId(req);
      const transactions = await storage.getPointTransactions(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // ========== DREAM SCROLL ROUTES ==========

  // Get all dream scroll items for a user
  app.get("/api/dream-scroll", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const items = await storage.getDreamScrollItems(req.user!.id);
      res.json(items);
    } catch (error) {
      log.error('[dream-scroll] Get items error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get dream scroll items by category
  app.get("/api/dream-scroll/category/:category", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { category } = req.params;
      const items = await storage.getDreamScrollItemsByCategory(req.user!.id, category);
      res.json(items);
    } catch (error) {
      log.error('[dream-scroll] Get by category error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Create a new dream scroll item
  app.post("/api/dream-scroll", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      if (!req.body.title || typeof req.body.title !== 'string') {
        return res.status(400).json({ error: "title is required" });
      }
      const cups = req.body.cups || [];
      if (!Array.isArray(cups) || !cups.every((c: unknown) => typeof c === 'number' && c >= 0 && c < 6)) {
        return res.status(400).json({ error: "cups must be an array of integers 0-5" });
      }

      const item = await storage.createDreamScrollItem({
        userId: req.user!.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category || 'do',
        priority: req.body.priority || 'medium',
        cost: req.body.cost,
        cups,
      });
      res.json(item);
    } catch (error) {
      log.error('[dream-scroll] Create error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Update a dream scroll item
  app.patch("/api/dream-scroll/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

      // Validate cups if provided
      if (req.body.cups !== undefined) {
        if (!Array.isArray(req.body.cups) || !req.body.cups.every((c: unknown) => typeof c === 'number' && c >= 0 && c < 6)) {
          return res.status(400).json({ error: "cups must be an array of integers 0-5" });
        }
      }

      const item = await storage.updateDreamScrollItem(id, req.user!.id, req.body);

      if (!item) {
        return res.status(404).json({ error: "Dream scroll item not found" });
      }

      res.json(item);
    } catch (error) {
      log.error('[dream-scroll] Update error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Toggle completion status
  app.post("/api/dream-scroll/:id/toggle", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

      const item = await storage.toggleDreamScrollItemComplete(id, req.user!.id);

      if (!item) {
        return res.status(404).json({ error: "Dream scroll item not found" });
      }

      res.json(item);
    } catch (error) {
      log.error('[dream-scroll] Toggle error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Delete a dream scroll item
  app.delete("/api/dream-scroll/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

      await storage.deleteDreamScrollItem(id, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      log.error('[dream-scroll] Delete error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // ========== DREAM SCROLL TAG ROUTES ==========

  // Get all tags for a specific category
  app.get("/api/dream-scroll/tags/:category", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { category } = req.params;
      const tags = await storage.getDreamScrollTags(req.user!.id, category);
      res.json(tags);
    } catch (error) {
      log.error('[dream-scroll-tags] Get tags error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Create a new tag
  app.post("/api/dream-scroll/tags", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const tag = await storage.createDreamScrollTag({
        userId: req.user!.id,
        category: req.body.category,
        name: req.body.name,
        color: req.body.color || 'bg-gray-500/20 text-gray-300',
      });
      res.json(tag);
    } catch (error) {
      log.error('[dream-scroll-tags] Create tag error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Delete a tag
  app.delete("/api/dream-scroll/tags/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      await storage.deleteDreamScrollTag(id);
      res.json({ success: true });
    } catch (error) {
      log.error('[dream-scroll-tags] Delete tag error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // ========== STREAK FREEZE ROUTES ==========

  // Get user's streak freezes
  app.get("/api/streak-freezes", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const freezeData = await storage.getStreakFreeze(userId);
      res.json({
        freezeCount: freezeData?.freezeCount || 0,
        maxFreezes: 2,
      });
    } catch (error) {
      log.error('[streak-freezes] Get error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Purchase a streak freeze (costs 250 XP)
  app.post("/api/streak-freezes/purchase", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const freezeData = await storage.getStreakFreeze(userId);
      const currentCount = freezeData?.freezeCount || 0;

      if (currentCount >= 2) {
        return res.status(400).json({ error: "Already have maximum streak freezes (2)" });
      }

      const FREEZE_COST = 250;

      // spendPoints is atomic (WHERE available >= amount) — race-safe
      const success = await storage.spendPoints(userId, FREEZE_COST, "reward_redeem", "Streak freeze purchase");
      if (!success) {
        return res.status(400).json({ error: `Insufficient XP (need ${FREEZE_COST})` });
      }

      // incrementStreakFreeze uses SQL increment — safe for concurrent calls
      // Worst case: user ends up with 3 freezes from 2 concurrent requests,
      // but the points are already atomically spent so no economic exploit
      await storage.incrementStreakFreeze(userId);
      const updated = await storage.getStreakFreeze(userId);

      log.info(`[streak-freezes] User ${userId} purchased streak freeze (${FREEZE_COST} XP)`);

      res.json({
        freezeCount: updated?.freezeCount || currentCount + 1,
        pointsSpent: FREEZE_COST,
      });
    } catch (error) {
      log.error('[streak-freezes] Purchase error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Apply a streak freeze to a specific date
  app.post("/api/streak-freeze/apply", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const { frozenDate } = req.body;

      if (!frozenDate || !/^\d{4}-\d{2}-\d{2}$/.test(frozenDate)) {
        return res.status(400).json({ error: "Invalid date format (expected YYYY-MM-DD)" });
      }

      // Idempotency check
      const existing = await storage.getStreakFreezeApplication(userId, frozenDate);
      if (existing) {
        return res.json({ applied: true, message: "Already applied" });
      }

      // Check freeze inventory
      const freezeData = await storage.getStreakFreeze(userId);
      if (!freezeData || freezeData.freezeCount <= 0) {
        return res.status(400).json({ error: "No streak freezes available" });
      }

      // Apply: decrement inventory + record application
      await storage.decrementStreakFreeze(userId);
      await storage.createStreakFreezeApplication(userId, frozenDate);

      log.info(`[streak-freezes] User ${userId} applied freeze for ${frozenDate}`);

      res.json({
        applied: true,
        freezeCount: freezeData.freezeCount - 1,
      });
    } catch (error) {
      log.error('[streak-freezes] Apply error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Register modular routes
  registerHabitRoutes(app);
  registerGoalRoutes(app);
  registerImportRoutes(app);
  registerKilterBoardRoutes(app);
  registerStravaRoutes(app);
  registerHabitMappingRoutes(app);
  registerPointRoutes(app);
  registerJourneyGoalRoutes(app);
  registerClimbingLogRoutes(app);
  registerLiftingRoutes(app);

  // Register yearly goals routes
  registerYearlyGoalRoutes(app);

  // Register goal calendar routes
  registerGoalCalendarRoutes(app);

  // Register brain dump (Airtable proxy)
  registerBrainDumpRoutes(app);

  // Register media library routes
  registerMediaLibraryRoutes(app);

  // Register adventures & birds routes
  registerAdventuresRoutes(app);

  // Register unified recent outdoor activities
  registerRecentActivitiesRoutes(app);

  // Register reward shop routes
  registerRewardRoutes(app);

  // Register wellness wheel routes
  registerWellnessWheelRoutes(app);

  // Seed de Lahunta reading schedule (one-time use)
  app.post("/api/seed/reading-schedule", async (req, res) => {
    try {
      const userId = getUserId(req);
      const db = getDb();
      const { randomUUID } = await import("crypto");

      // Reading schedule data
      const READING_SCHEDULE = [
        { week: 1, startDate: "2024-12-30", endDate: "2025-01-05", startPage: 1, endPage: 23, content: "Ch 1 + Ch 2" },
        { week: 2, startDate: "2025-01-06", endDate: "2025-01-12", startPage: 24, endPage: 46, content: "Ch 2 + Ch 3" },
        { week: 3, startDate: "2025-01-13", endDate: "2025-01-19", startPage: 47, endPage: 69, content: "Ch 3" },
        { week: 4, startDate: "2025-01-20", endDate: "2025-01-26", startPage: 70, endPage: 92, content: "Ch 3 + Ch 4" },
        { week: 5, startDate: "2025-01-27", endDate: "2025-02-02", startPage: 93, endPage: 115, content: "Ch 4 + Ch 5" },
        { week: 6, startDate: "2025-02-03", endDate: "2025-02-09", startPage: 116, endPage: 138, content: "Ch 5" },
        { week: 7, startDate: "2025-02-10", endDate: "2025-02-16", startPage: 139, endPage: 161, content: "Ch 5" },
        { week: 8, startDate: "2025-02-17", endDate: "2025-02-23", startPage: 162, endPage: 184, content: "Ch 5 + Ch 6" },
        { week: 9, startDate: "2025-02-24", endDate: "2025-03-02", startPage: 185, endPage: 207, content: "Ch 6 + Ch 7" },
        { week: 10, startDate: "2025-03-03", endDate: "2025-03-09", startPage: 208, endPage: 229, content: "Ch 7" },
        { week: 11, startDate: "2025-03-10", endDate: "2025-03-16", startPage: 246, endPage: 268, content: "Ch 9 + Ch 10" },
        { week: 12, startDate: "2025-03-17", endDate: "2025-03-23", startPage: 269, endPage: 291, content: "Ch 10" },
        { week: 13, startDate: "2025-03-24", endDate: "2025-03-30", startPage: 292, endPage: 314, content: "Ch 10 + Ch 11" },
        { week: 14, startDate: "2025-03-31", endDate: "2025-04-06", startPage: 315, endPage: 337, content: "Ch 11" },
        { week: 15, startDate: "2025-04-07", endDate: "2025-04-13", startPage: 338, endPage: 360, content: "Ch 11 + Ch 12" },
        { week: 16, startDate: "2025-04-14", endDate: "2025-04-20", startPage: 361, endPage: 383, content: "Ch 12 + Ch 13" },
        { week: 17, startDate: "2025-04-21", endDate: "2025-04-27", startPage: 384, endPage: 406, content: "Ch 13" },
        { week: 18, startDate: "2025-04-28", endDate: "2025-05-04", startPage: 407, endPage: 429, content: "Ch 13 + Ch 14" },
        { week: 19, startDate: "2025-05-05", endDate: "2025-05-11", startPage: 430, endPage: 452, content: "Ch 14" },
        { week: 20, startDate: "2025-05-12", endDate: "2025-05-18", startPage: 453, endPage: 475, content: "Ch 14 + Ch 15 + Ch 16 + Ch 17" },
        { week: 21, startDate: "2025-05-19", endDate: "2025-05-25", startPage: 476, endPage: 498, content: "Ch 17 + Ch 18" },
        { week: 22, startDate: "2025-05-26", endDate: "2025-06-01", startPage: 499, endPage: 521, content: "Ch 18 + Ch 19 + Ch 20" },
        { week: 23, startDate: "2025-06-02", endDate: "2025-06-08", startPage: 522, endPage: 544, content: "Ch 20 + Ch 21" },
        { week: 24, startDate: "2025-06-09", endDate: "2025-06-15", startPage: 545, endPage: 567, content: "Ch 21 + Ch 22" },
        { week: 25, startDate: "2025-06-16", endDate: "2025-06-22", startPage: 568, endPage: 590, content: "Ch 22" },
        { week: 26, startDate: "2025-06-23", endDate: "2025-06-29", startPage: 591, endPage: 621, content: "Ch 22" },
      ];

      // Helper to get ISO week string
      const getISOWeekString = (dateStr: string): string => {
        const date = new Date(dateStr);
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
      };

      // Check if yearly goal already exists
      const existingYearlyGoal = await db
        .select()
        .from(schema.yearlyGoals)
        .where(
          and(
            eq(schema.yearlyGoals.userId, userId),
            eq(schema.yearlyGoals.year, "2025"),
            eq(schema.yearlyGoals.title, "Complete de Lahunta")
          )
        );

      // Generate sub-items with IDs upfront so we can link them to weekly goals
      const subItemsWithIds: Array<{ id: string; weekNumber: number; title: string; completed: boolean }> = READING_SCHEDULE.map((week) => ({
        id: randomUUID(),
        weekNumber: week.week,
        title: `Week ${week.week}: pp. ${week.startPage}–${week.endPage} (${week.content})`,
        completed: false,
      }));

      let yearlyGoalId: number;
      let yearlyGoalCreated = false;

      if (existingYearlyGoal.length === 0) {
        // Create compound yearly goal with 26 sub-items
        const subItems = subItemsWithIds.map(({ id, title, completed }) => ({ id, title, completed }));

        const [newYearlyGoal] = await db.insert(schema.yearlyGoals).values({
          userId,
          year: "2025",
          title: "Complete de Lahunta",
          description: "Read de Lahunta's Veterinary Neuroanatomy and Clinical Neurology (~23 pages/week, done June 29)",
          category: "books",
          goalType: "compound",
          targetValue: 26,
          currentValue: 0,
          subItems,
          xpReward: 500,
        }).returning();
        yearlyGoalId = newYearlyGoal.id;
        yearlyGoalCreated = true;
      } else {
        yearlyGoalId = existingYearlyGoal[0].id;
        // Use existing sub-items for linking
        const existingSubItems = existingYearlyGoal[0].subItems as Array<{ id: string; title: string; completed: boolean }>;
        existingSubItems.forEach((item, idx) => {
          if (idx < subItemsWithIds.length) {
            subItemsWithIds[idx].id = item.id;
          }
        });
      }

      // Create weekly goals linked to yearly goal sub-items
      let weeklyGoalsCreated = 0;
      for (let i = 0; i < READING_SCHEDULE.length; i++) {
        const week = READING_SCHEDULE[i];
        const subItem = subItemsWithIds[i];
        const isoWeek = getISOWeekString(week.startDate);
        const title = `Read de Lahunta pp. ${week.startPage}–${week.endPage}`;

        const existingWeeklyGoal = await db
          .select()
          .from(schema.goals)
          .where(
            and(
              eq(schema.goals.userId, userId),
              eq(schema.goals.week, isoWeek),
              eq(schema.goals.title, title)
            )
          );

        if (existingWeeklyGoal.length === 0) {
          // Store link to yearly goal sub-item in description field as JSON suffix
          const linkData = JSON.stringify({
            linkedYearlyGoalId: yearlyGoalId,
            linkedSubItemId: subItem.id,
          });

          await db.insert(schema.goals).values({
            userId,
            title,
            description: `${week.content}|||${linkData}`,
            targetValue: 1,
            currentValue: 0,
            unit: "complete",
            deadline: week.endDate,
            category: "reading",
            difficulty: "medium",
            priority: "high",
            week: isoWeek,
          });
          weeklyGoalsCreated++;
        }
      }

      res.json({
        success: true,
        yearlyGoalCreated,
        yearlyGoalId,
        weeklyGoalsCreated,
        message: `Created yearly goal: ${yearlyGoalCreated}, weekly goals: ${weeklyGoalsCreated}/26 (linked to yearly goal #${yearlyGoalId})`,
      });
    } catch (error) {
      log.error("[seed] Error seeding reading schedule:", error);
      res.status(500).json({ error: "Failed to seed reading schedule" });
    }
  });

  // Weather proxy (Open-Meteo has no CORS headers for browser requests)
  app.get("/api/weather", async (_req, res) => {
    try {
      const url = "https://api.open-meteo.com/v1/forecast?latitude=55.86&longitude=-4.25&current=temperature_2m,weather_code&temperature_unit=fahrenheit";
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch {
      res.json({ current: { temperature_2m: null, weather_code: null } });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
