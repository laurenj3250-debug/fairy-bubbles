import type { Express } from "express";
import { storage } from "../storage";
import { requireUser } from "../simple-auth";
import { insertHabitSchema, insertHabitLogSchema } from "@shared/schema";
import { calculateStreak, calculateWeeklyCompletion } from "../pet-utils";
import { getDb } from "../db";

const getUserId = (req: any) => requireUser(req).id;

export function registerHabitRoutes(app: Express) {
  // GET all habits for user
  app.get("/api/habits", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getHabits(userId);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

  // GET user-level streak (perfect days streak) - MUST come before /api/habits/:id
  app.get("/api/habits/streak", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getHabits(userId);
      const allLogs = await storage.getAllHabitLogs(userId);

      if (habits.length === 0) {
        return res.json({ currentStreak: 0, longestStreak: 0 });
      }

      const today = new Date().toISOString().split('T')[0];

      // Helper function to check if a day is "perfect" (all habits completed)
      const isPerfectDay = (dateString: string): boolean => {
        const logsForDay = allLogs.filter(log =>
          log.date === dateString && log.completed
        );
        return logsForDay.length === habits.length;
      };

      // Calculate current streak (going backwards from today)
      let currentStreak = 0;
      let checkDate = new Date();

      while (true) {
        const dateString = checkDate.toISOString().split('T')[0];

        if (!isPerfectDay(dateString)) {
          // If it's today and not perfect yet, check yesterday
          if (currentStreak === 0 && dateString === today) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
          break;
        }

        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);

        if (currentStreak > 365) break; // Safety limit
      }

      // Calculate longest streak ever
      let longestStreak = currentStreak;
      let tempStreak = 0;

      // Check each day going back
      let scanDate = new Date();
      scanDate.setDate(scanDate.getDate() - 365); // Scan last year
      const endDate = new Date();

      while (scanDate <= endDate) {
        const dateString = scanDate.toISOString().split('T')[0];

        if (isPerfectDay(dateString)) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }

        scanDate.setDate(scanDate.getDate() + 1);
      }

      res.json({ currentStreak, longestStreak });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get user streak" });
    }
  });

  // GET single habit by ID
  app.get("/api/habits/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const habit = await storage.getHabit(id);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      // Verify ownership
      if (habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit" });
    }
  });

  // POST create new habit
  app.post("/api/habits", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertHabitSchema.parse({ ...req.body, userId });
      const habit = await storage.createHabit(validated);
      res.status(201).json(habit);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid habit data" });
    }
  });

  // PATCH update habit
  app.patch("/api/habits/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before update
      const existing = await storage.getHabit(id);
      if (!existing) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const habit = await storage.updateHabit(id, req.body);
      res.json(habit);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update habit" });
    }
  });

  // PATCH schedule adventure habit for a specific day
  app.patch("/api/habits/:id/schedule", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const { scheduledDay } = req.body;

      // Verify ownership
      const existing = await storage.getHabit(id);
      if (!existing) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Validate that it's an adventure habit
      if (existing.category !== "adventure") {
        return res.status(400).json({ error: "Only adventure habits can be scheduled" });
      }

      // Update scheduledDay (can be null to clear schedule)
      const habit = await storage.updateHabit(id, { scheduledDay });
      res.json(habit);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to schedule habit" });
    }
  });

  // DELETE habit
  app.delete("/api/habits/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before delete
      const existing = await storage.getHabit(id);
      if (!existing) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteHabit(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });

  // GET all habits with enriched data (streak, weekly progress, history) - BATCH ENDPOINT
  app.get("/api/habits-with-data", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getHabits(userId);
      const allLogs = await storage.getAllHabitLogs(userId);

      const enrichedHabits = await Promise.all(
        habits.map(async (habit) => {
          const logs = allLogs.filter((log) => log.habitId === habit.id);
          const streak = calculateStreak(logs);
          const weeklyCompletion = calculateWeeklyCompletion([habit], logs);

          // Get last 30 days of logs for history
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const history = logs
            .filter((log) => new Date(log.date) >= thirtyDaysAgo)
            .sort((a, b) => a.date.localeCompare(b.date));

          return {
            ...habit,
            streak,
            weeklyCompletion,
            history,
          };
        })
      );

      res.json(enrichedHabits);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch habits with data" });
    }
  });

  // GET metrics for a specific habit
  app.get("/api/habits/:habitId/metrics", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habitId = parseInt(req.params.habitId);

      // Verify habit exists and user owns it
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get metrics from database using getDb
      const db = getDb();
      const metrics = await db.query.habitMetrics.findMany({
        where: (habitMetrics: any, { eq }: any) => eq(habitMetrics.habitId, habitId),
        orderBy: (habitMetrics: any, { asc }: any) => asc(habitMetrics.displayOrder),
      });

      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get habit metrics" });
    }
  });

  // GET weekly progress for a specific habit
  app.get("/api/habits/:habitId/weekly-progress", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habitId = parseInt(req.params.habitId);

      // Verify habit exists and user owns it
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const logs = await storage.getHabitLogs(habitId);
      const weeklyCompletion = calculateWeeklyCompletion([habit], logs);

      res.json({ habitId, weeklyCompletion });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get weekly progress" });
    }
  });

  // GET streak for a specific habit
  app.get("/api/habits/:habitId/streak", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habitId = parseInt(req.params.habitId);

      // Verify habit exists and user owns it
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const logs = await storage.getHabitLogs(habitId);
      const streak = calculateStreak(logs);

      res.json({ habitId, streak });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get habit streak" });
    }
  });

  // GET history for a specific habit
  app.get("/api/habits/:habitId/history", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habitId = parseInt(req.params.habitId);

      // Verify habit exists and user owns it
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const logs = await storage.getHabitLogs(habitId);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get habit history" });
    }
  });

  // ============ HABIT LOGS ============

  // GET habit logs for a date range (for heatmaps)
  app.get("/api/habit-logs/range/:startDate/:endDate", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { startDate, endDate } = req.params;
      const allLogs = await storage.getAllHabitLogs(userId);
      // Filter logs within date range
      const filteredLogs = allLogs.filter(log =>
        log.date >= startDate && log.date <= endDate
      );
      res.json(filteredLogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit logs range" });
    }
  });

  // GET habit logs for a specific date
  app.get("/api/habit-logs/:date", async (req, res) => {
    try {
      const userId = getUserId(req);
      const date = req.params.date;
      const logs = await storage.getHabitLogsByDate(userId, date);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit logs" });
    }
  });

  // GET habit logs (with optional habitId query param) - SUPPORTS BATCH QUERIES
  app.get("/api/habit-logs", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habitId = req.query.habitId ? parseInt(req.query.habitId as string) : undefined;

      // NEW: Support batch habitIds query param for N+1 fix
      const habitIds = req.query.habitIds
        ? (req.query.habitIds as string).split(',').map(id => parseInt(id))
        : undefined;

      if (habitIds && habitIds.length > 0) {
        // Batch fetch for multiple habits - FIX FOR N+1 QUERY PROBLEM
        const allLogs = await storage.getAllHabitLogs(userId);
        const filteredLogs = allLogs.filter(log => habitIds.includes(log.habitId));
        return res.json(filteredLogs);
      }

      if (habitId) {
        const logs = await storage.getHabitLogs(habitId);
        return res.json(logs);
      }

      const logs = await storage.getAllHabitLogs(userId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit logs" });
    }
  });

  // POST create habit log
  app.post("/api/habit-logs", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertHabitLogSchema.parse(req.body);

      // Verify habit exists and user owns it
      const habit = await storage.getHabit(validated.habitId);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const log = await storage.createHabitLog(validated);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid habit log data" });
    }
  });

  // PATCH update habit log
  app.patch("/api/habit-logs/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);

      // Get the log and verify ownership via habit
      const log = await storage.getHabitLog(id);
      if (!log) {
        return res.status(404).json({ error: "Habit log not found" });
      }

      const habit = await storage.getHabit(log.habitId);
      if (!habit || habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedLog = await storage.updateHabitLog(id, req.body);
      res.json(updatedLog);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update habit log" });
    }
  });

  // DELETE habit log
  app.delete("/api/habit-logs/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);

      // Get the log and verify ownership via habit
      const log = await storage.getHabitLog(id);
      if (!log) {
        return res.status(404).json({ error: "Habit log not found" });
      }

      const habit = await storage.getHabit(log.habitId);
      if (!habit || habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteHabitLog(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit log" });
    }
  });

  // POST toggle habit log completion (supports cumulative goals)
  app.post("/api/habit-logs/toggle", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { habitId, date, durationMinutes, quantityCompleted, sessionType, incrementValue } = req.body;

      if (!habitId || !date) {
        return res.status(400).json({ error: "habitId and date are required" });
      }

      // Verify habit exists and user owns it
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      if (habit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const db = getDb();
      const { habits } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      // Check if log already exists for this date
      const allLogs = await storage.getHabitLogs(habitId);
      const existingLog = allLogs.find((log) => log.date === date);

      let logResult;

      if (existingLog) {
        // Toggle the completion status
        const updatedLog = await storage.updateHabitLog(existingLog.id, {
          completed: !existingLog.completed,
          durationMinutes,
          quantityCompleted,
          sessionType,
          incrementValue: incrementValue || 1,
        });
        logResult = updatedLog;

        // For cumulative goals: update currentValue
        if (habit.goalType === "cumulative" && updatedLog) {
          const delta = updatedLog.completed ? (incrementValue || 1) : -(incrementValue || 1);
          await db.update(habits)
            .set({ currentValue: (habit.currentValue || 0) + delta })
            .where(eq(habits.id, habitId));
        }
      } else {
        // Create new log
        console.log('[DEBUG] Creating habit log with:', {
          habitId,
          userId,
          date,
          durationMinutes,
          quantityCompleted,
          sessionType,
          incrementValue: incrementValue || 1,
        });
        const newLog = await storage.createHabitLog({
          habitId,
          userId,
          date,
          completed: true,
          durationMinutes,
          quantityCompleted,
          sessionType,
          incrementValue: incrementValue || 1,
        });
        logResult = newLog;

        // For cumulative goals: increment currentValue
        if (habit.goalType === "cumulative") {
          await db.update(habits)
            .set({ currentValue: (habit.currentValue || 0) + (incrementValue || 1) })
            .where(eq(habits.id, habitId));
        }
      }

      // NEW: Update habit score after logging
      try {
        const { updateHabitScore } = await import("../services/habitScoring");
        const scoreResult = await updateHabitScore(habitId, date);

        // Return score info with log response
        return res.json({
          ...logResult,
          score: {
            current: scoreResult.newScore,
            change: scoreResult.scoreChange,
            percentage: Math.round(scoreResult.newScore * 100)
          }
        });
      } catch (scoreError: any) {
        console.error('Score update failed:', scoreError);
        // Don't fail the whole request if scoring fails (graceful degradation)
        return res.json(logResult);
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to toggle habit log" });
    }
  });
}
