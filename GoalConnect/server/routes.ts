import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ensureDatabaseInitialized } from "./init-db";
import {
  insertHabitSchema,
  insertHabitLogSchema,
  insertGoalSchema,
  insertGoalUpdateSchema,
  insertUserSettingsSchema,
  insertVirtualPetSchema,
  insertPointTransactionSchema,
  insertTodoSchema,
} from "@shared/schema";
import {
  calculatePetStats,
  calculateStreak,
  calculateWeeklyCompletion,
  calculateCoinsEarned,
  getStreakMultiplier,
} from "./pet-utils";
import { requireUser } from "./simple-auth";
import { RNGService } from "./rng-service";
import { CombatEngine } from "./combat-engine";
import multer from "multer";
import path from "path";
import AdmZip from "adm-zip";
import fs from "fs";

const getUserId = (req: Request) => requireUser(req).id;
const rngService = new RNGService(storage);
const combatEngine = new CombatEngine(storage);

// Configure multer for sprite uploads
const spriteStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'sprites', 'unsorted');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: spriteStorage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /png|jpg|jpeg|psd|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) ||
                     file.mimetype === 'image/vnd.adobe.photoshop' ||
                     file.mimetype === 'application/zip' ||
                     file.mimetype === 'application/x-zip-compressed';

    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, PSD, and ZIP files are allowed'));
    }
  }
});

// Helper function to update pet stats automatically
async function updatePetFromHabits(userId: number) {
  try {
    const habits = await storage.getHabits(userId);
    const allLogs = await storage.getAllHabitLogs(userId);
    let pet = await storage.getVirtualPet(userId);

    if (!pet) {
      // Create default pet if doesn't exist
      pet = await storage.createVirtualPet({
        userId,
        name: "Forest Friend",
        species: "Gremlin",
        happiness: 50,
        health: 100,
        level: 1,
        experience: 0,
        evolution: "seed",
      });
    }

    const stats = calculatePetStats(habits, allLogs, pet);

    // Update pet with new stats
    await storage.updateVirtualPet(pet.id, {
      experience: stats.experience,
      level: stats.level,
      happiness: stats.happiness,
      evolution: stats.evolution,
    });

    return { stats, leveledUp: stats.leveledUp, evolved: stats.evolved };
  } catch (error) {
    console.error("Failed to update pet stats:", error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    await ensureDatabaseInitialized();
  } catch (error) {
    console.error("[routes] Database initialization check failed:", error);
  }

  app.get("/api/habits", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getHabits(userId);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

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

  // Schedule adventure habit for a specific day
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
      const deleted = await storage.deleteHabit(id);
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

      // Calculate week boundaries once
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      const today = new Date().toISOString().split('T')[0];

      const habitsWithData = habits.map(habit => {
        const habitLogs = allLogs.filter(log => log.habitId === habit.id && log.completed);

        // Calculate streak
        let streak = 0;
        let checkDate = new Date();
        const sortedLogs = habitLogs.sort((a, b) => b.date.localeCompare(a.date));

        while (true) {
          const dateString = checkDate.toISOString().split('T')[0];
          const hasLog = sortedLogs.some(log => log.date === dateString);

          if (!hasLog) {
            if (streak === 0 && dateString === today) {
              checkDate.setDate(checkDate.getDate() - 1);
              continue;
            }
            break;
          }

          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          if (streak > 365) break;
        }

        // Calculate weekly progress
        let weeklyProgress = null;
        if (habit.cadence === 'weekly') {
          const weekLogs = allLogs.filter(log => {
            if (log.habitId !== habit.id || !log.completed) return false;
            const logDate = new Date(log.date);
            return logDate >= monday && logDate <= sunday;
          });
          const completedDates = weekLogs.map(log => log.date);
          const progress = completedDates.length;
          const target = habit.targetPerWeek || 7;

          weeklyProgress = {
            habitId: habit.id,
            weekStart: monday.toISOString().split('T')[0],
            weekEnd: sunday.toISOString().split('T')[0],
            targetPerWeek: target,
            completedDates,
            progress,
            isComplete: progress >= target,
          };
        }

        // Calculate 7-day history
        const history = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          const completed = habitLogs.some(log => log.date === dateString);
          history.push({
            date: dateString,
            completed,
            dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' })
          });
        }

        return {
          ...habit,
          streak: { habitId: habit.id, streak },
          weeklyProgress,
          history: { habitId: habit.id, history }
        };
      });

      res.json(habitsWithData);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get habits with data" });
    }
  });

  // GET weekly progress for a habit
  app.get("/api/habits/:habitId/weekly-progress", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habitId = parseInt(req.params.habitId);

      const habit = await storage.getHabit(habitId);
      if (!habit || habit.userId !== userId) {
        return res.status(404).json({ error: "Habit not found" });
      }

      // Get current week's logs (Monday to Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      // Get all logs for this user
      const allLogs = await storage.getAllHabitLogs(userId);
      const weekLogs = allLogs.filter(log => {
        if (log.habitId !== habitId || !log.completed) return false;
        const logDate = new Date(log.date);
        return logDate >= monday && logDate <= sunday;
      });

      const completedDates = weekLogs.map(log => log.date);
      const progress = completedDates.length;
      const target = habit.targetPerWeek || 7;

      res.json({
        habitId,
        weekStart: monday.toISOString().split('T')[0],
        weekEnd: sunday.toISOString().split('T')[0],
        targetPerWeek: target,
        completedDates,
        progress,
        isComplete: progress >= target,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get weekly progress" });
    }
  });

  // GET streak for a habit
  app.get("/api/habits/:habitId/streak", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habitId = parseInt(req.params.habitId);

      const habit = await storage.getHabit(habitId);
      if (!habit || habit.userId !== userId) {
        return res.status(404).json({ error: "Habit not found" });
      }

      const allLogs = await storage.getAllHabitLogs(userId);
      const habitLogs = allLogs
        .filter(log => log.habitId === habitId && log.completed)
        .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending

      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      let checkDate = new Date();

      // Calculate streak going backwards from today
      while (true) {
        const dateString = checkDate.toISOString().split('T')[0];
        const hasLog = habitLogs.some(log => log.date === dateString);

        if (!hasLog) {
          // If it's today and no log yet, keep checking
          if (streak === 0 && dateString === today) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
          break;
        }

        streak++;
        checkDate.setDate(checkDate.getDate() - 1);

        if (streak > 365) break; // Safety limit
      }

      res.json({ habitId, streak });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get streak" });
    }
  });

  // GET completion history for a habit (last 7 days)
  app.get("/api/habits/:habitId/history", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habitId = parseInt(req.params.habitId);

      const habit = await storage.getHabit(habitId);
      if (!habit || habit.userId !== userId) {
        return res.status(404).json({ error: "Habit not found" });
      }

      const allLogs = await storage.getAllHabitLogs(userId);
      const habitLogs = allLogs.filter(log => log.habitId === habitId && log.completed);

      // Get last 7 days (including today)
      const history = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        const completed = habitLogs.some(log => log.date === dateString);
        history.push({
          date: dateString,
          completed,
          dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' })
        });
      }

      res.json({ habitId, history });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get completion history" });
    }
  });

  // GET habit logs by date (path parameter) - for React Query default queryFn
  app.get("/api/habit-logs/:date", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { date } = req.params;
      const logs = await storage.getHabitLogsByDate(userId, date);
      res.json(logs);
    } catch (error: any) {
      console.error('Error fetching habit logs by date:', error);
      res.status(500).json({ error: error.message || "Failed to fetch habit logs by date" });
    }
  });

  app.get("/api/habit-logs", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { habitId, date } = req.query;

      if (date && typeof date === "string") {
        const logs = await storage.getHabitLogsByDate(userId, date);
        return res.json(logs);
      }
      
      if (habitId && typeof habitId === "string") {
        const logs = await storage.getHabitLogs(parseInt(habitId));
        return res.json(logs);
      }
      
      // Return all logs if no filter specified
      const allLogs = await storage.getAllHabitLogs(userId);
      res.json(allLogs);
    } catch (error: any) {
      console.error('Error fetching habit logs:', error);
      res.status(500).json({ error: error.message || "Failed to fetch habit logs" });
    }
  });

  app.post("/api/habit-logs", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertHabitLogSchema.parse({ ...req.body, userId });
      const log = await storage.createHabitLog(validated);

      // Award points for completing a habit
      const habit = await storage.getHabit(validated.habitId);
      if (habit && validated.completed) {
        // Calculate streak for bonus coins
        const allLogs = await storage.getAllHabitLogs(userId);
        const currentStreak = calculateStreak(allLogs);
        const coins = calculateCoinsEarned(habit, currentStreak);

        await storage.addPoints(
          userId,
          coins,
          "habit_complete",
          log.id,
          `Completed "${habit.title}"`
        );

        // Award RPG habit points for daily progress (unlocks runs)
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const habitPoints = 1; // 1 point per habit completion (could vary by difficulty)
        try {
          await storage.incrementHabitPoints(userId, today, habitPoints);
          console.log(`[RPG] Awarded ${habitPoints} habit point(s) for completing "${habit.title}"`);
        } catch (error) {
          console.error('[RPG] Failed to increment habit points:', error);
          // Don't fail the request if RPG system fails
        }
      }

      // Auto-update pet stats
      const petUpdate = await updatePetFromHabits(userId);

      res.status(201).json({
        ...log,
        petUpdate: petUpdate ? {
          leveledUp: petUpdate.leveledUp,
          evolved: petUpdate.evolved,
        } : null,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid habit log data" });
    }
  });

  app.patch("/api/habit-logs/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before update
      const existing = await storage.getHabitLog(id);
      if (!existing) {
        return res.status(404).json({ error: "Habit log not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const log = await storage.updateHabitLog(id, req.body);

      // Auto-update pet stats after changing a log
      const petUpdate = await updatePetFromHabits(userId);

      res.json({
        ...log,
        petUpdate: petUpdate ? {
          leveledUp: petUpdate.leveledUp,
          evolved: petUpdate.evolved,
        } : null,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update habit log" });
    }
  });

  app.delete("/api/habit-logs/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before delete
      const existing = await storage.getHabitLog(id);
      if (!existing) {
        return res.status(404).json({ error: "Habit log not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const deleted = await storage.deleteHabitLog(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit log" });
    }
  });

  // Toggle habit completion endpoint
  // Core loop: Toggle habit log + award/deduct tokens + award XP
  app.post("/api/habit-logs/toggle", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { habitId, date } = req.body;

      console.log('[toggle] Request:', { userId, habitId, date });

      if (!habitId || !date) {
        return res.status(400).json({ error: "habitId and date are required" });
      }

      // Find existing log for this habit on this date
      const existingLogs = await storage.getHabitLogsByDate(userId, date);
      console.log('[toggle] Existing logs for date:', existingLogs.length);
      const existingLog = existingLogs.find(log => log.habitId === habitId);
      console.log('[toggle] Existing log found:', existingLog ? 'yes' : 'no');

      let result;
      let xpAwarded = 0;

      if (existingLog) {
        // Toggle existing log
        const newCompleted = !existingLog.completed;
        console.log('[toggle] Toggling existing log from', existingLog.completed, 'to', newCompleted);

        result = await storage.updateHabitLog(existingLog.id, {
          completed: newCompleted
        });

        // Award or deduct points based on toggle direction
        if (newCompleted && !existingLog.completed) {
          // Completing: award 10 tokens
          await storage.addPoints(userId, 10, "habit_complete", result.id, `Completed habit`);
          console.log('[toggle] Awarded 10 tokens for completing habit');
          xpAwarded = 10;
        } else if (!newCompleted && existingLog.completed) {
          // Uncompleting: deduct 10 tokens
          await storage.spendPoints(userId, 10, `Uncompleted habit`);
          console.log('[toggle] Deducted 10 tokens for uncompleting habit');
          xpAwarded = -10;
        }
      } else {
        // Create new log as completed
        console.log('[toggle] Creating new completed log');
        const validated = insertHabitLogSchema.parse({
          habitId,
          userId,
          date,
          completed: true,
          note: null
        });
        result = await storage.createHabitLog(validated);

        // Award 10 tokens for completing the habit
        await storage.addPoints(userId, 10, "habit_complete", result.id, `Completed habit`);
        console.log('[toggle] Created log and awarded 10 tokens');
        xpAwarded = 10;
      }

      // Award or deduct XP (simple system: 10 XP per habit, 100 XP per level)
      try {
        let stats = await storage.getPlayerClimbingStats(userId);
        if (!stats) {
          // Initialize stats if they don't exist
          stats = { climbingLevel: 1, totalXp: 0 };
        }

        const newTotalXp = Math.max(0, (stats.totalXp || 0) + xpAwarded);
        const newLevel = Math.floor(newTotalXp / 100) + 1;
        const oldLevel = stats.climbingLevel || 1;

        await storage.updatePlayerClimbingStats(userId, {
          totalXp: newTotalXp,
          climbingLevel: newLevel
        });

        console.log('[toggle] XP updated:', { oldXp: stats.totalXp, newXp: newTotalXp, oldLevel, newLevel });
      } catch (xpError: any) {
        // Don't fail the entire request if XP update fails
        console.error('[toggle] XP update failed (non-fatal):', xpError.message);
      }

      // Check for linked goal/route and update progress
      let routeProgress = null;
      try {
        const habit = await storage.getHabit(habitId);

        if (habit?.linkedGoalId && result.completed) {
          // Habit is linked to a route and was just completed
          const goal = await storage.getGoal(habit.linkedGoalId);

          if (goal) {
            // Increment goal progress
            const newValue = (goal.currentValue || 0) + 1;
            await storage.updateGoal(habit.linkedGoalId, {
              currentValue: newValue
            });

            // Calculate pitch progress (12 pitches per route)
            const totalPitches = 12;
            const percentage = Math.round((newValue / goal.targetValue) * 100);
            const completedPitches = Math.floor((percentage / 100) * totalPitches);

            routeProgress = {
              routeName: goal.title,
              pitch: completedPitches,
              totalPitches,
              percentage: Math.min(percentage, 100)
            };

            console.log('[toggle] Route progress updated:', routeProgress);
          }
        }
      } catch (routeError: any) {
        // Don't fail the entire request if route update fails
        console.error('[toggle] Route update failed (non-fatal):', routeError.message);
      }

      console.log('[toggle] Success:', result);
      res.json({
        ...result,
        tokensAwarded: result.completed ? 10 : 0,
        routeProgress
      });
    } catch (error: any) {
      console.error('[toggle] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({ error: error.message || "Failed to toggle habit log" });
    }
  });

  /* TEMPORARILY DISABLED COMPLEX FEATURES - TO BE RE-ADDED AFTER CORE LOOP IS STABLE

  Features removed from toggle endpoint:
  - Combo stats (5-minute window multipliers)
  - XP/leveling system
  - Mountain unlocks
  - Pet stat updates
  - Daily quest progress
  - Linked goal increments/decrements
  - Reward details calculation
  - Streak multipliers

  These will be re-added one at a time after the core loop is working reliably.
  */

  app.get("/api/goals", async (req, res) => {
    try {
      const userId = getUserId(req);
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  // Get abandoned goals (no updates in 90+ days and not completed)
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
      const deleted = await storage.deleteGoal(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Reactivate an abandoned goal by adding a new update
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

  app.get("/api/goal-updates/:goalId", async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const updates = await storage.getGoalUpdates(goalId);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goal updates" });
    }
  });

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
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid settings data" });
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

  // Virtual Pet Routes
  app.get("/api/pet", async (req, res) => {
    try {
      const userId = getUserId(req);
      let pet = await storage.getVirtualPet(userId);
      if (!pet) {
        pet = await storage.createVirtualPet({
          userId,
          name: "Forest Friend",
          species: "Gremlin",
          happiness: 50,
          health: 100,
          level: 1,
          experience: 0,
          evolution: "seed",
        });
      }
      res.json(pet);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch virtual pet" });
    }
  });

  app.patch("/api/pet/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before update
      const existing = await storage.getVirtualPet(userId);
      if (!existing || existing.id !== id) {
        return res.status(404).json({ error: "Pet not found" });
      }
      const pet = await storage.updateVirtualPet(id, req.body);
      res.json(pet);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update pet" });
    }
  });

  // Costume Routes
  app.get("/api/costumes", async (req, res) => {
    try {
      const costumes = await storage.getAllCostumes();
      
      // Load custom costumes from JSON file
      const customCostumes: any[] = [];
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const customCostumesPath = path.join(process.cwd(), "attached_assets", "custom_costumes", "costumes.json");
        const customData = await fs.readFile(customCostumesPath, "utf-8");
        const customCostumesList = JSON.parse(customData);
        
        // Transform custom costumes to match the expected format
        // Use negative IDs to avoid conflicts with database IDs
        customCostumesList.forEach((custom: any, index: number) => {
          customCostumes.push({
            id: -(index + 1000), // Negative IDs for custom costumes
            name: custom.name,
            description: custom.description,
            category: custom.category,
            price: custom.price,
            imageUrl: `/attached_assets/custom_costumes/${custom.imageFile}`,
            rarity: custom.rarity,
            isCustom: true,
          });
        });
      } catch (err) {
        // Silently continue if custom costumes file doesn't exist or is invalid
        console.log("No custom costumes found or error loading them:", err);
      }
      
      // Combine database costumes with custom costumes
      res.json([...costumes, ...customCostumes]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch costumes" });
    }
  });

  app.get("/api/user-costumes", async (req, res) => {
    try {
      const userId = getUserId(req);
      const userCostumes = await storage.getUserCostumes(userId);
      res.json(userCostumes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user costumes" });
    }
  });

  app.post("/api/costumes/purchase", async (req, res) => {
    try {
      const { costumeId } = req.body;
      if (!costumeId || typeof costumeId !== "number") {
        return res.status(400).json({ error: "Costume ID required" });
      }

      // Check if it's a custom costume (negative ID)
      let costume: any = null;
      const isCustom = costumeId < 0;
      let actualCostumeId = costumeId;
      
      if (isCustom) {
        // Load custom costumes from JSON
        try {
          const fs = await import("fs/promises");
          const path = await import("path");
          const customCostumesPath = path.join(process.cwd(), "attached_assets", "custom_costumes", "costumes.json");
          const customData = await fs.readFile(customCostumesPath, "utf-8");
          const customCostumesList = JSON.parse(customData);
          
          const index = Math.abs(costumeId + 1000);
          const customCostume = customCostumesList[index];
          if (customCostume) {
            // Check if this custom costume was already imported to database
            const existingCostume = await storage.getCostumeByName(customCostume.name);
            if (existingCostume) {
              // Use existing database ID
              actualCostumeId = existingCostume.id;
              costume = existingCostume;
            } else {
              // Import custom costume into database
              const importedCostume = await storage.createCostume({
                name: customCostume.name,
                description: customCostume.description,
                category: customCostume.category,
                price: customCostume.price,
                imageUrl: `/attached_assets/custom_costumes/${customCostume.imageFile}`,
                rarity: customCostume.rarity,
              });
              actualCostumeId = importedCostume.id;
              costume = importedCostume;
            }
          }
        } catch (err) {
          return res.status(404).json({ error: "Custom costume not found" });
        }
      } else {
        costume = await storage.getCostume(costumeId);
      }

      if (!costume) {
        return res.status(404).json({ error: "Costume not found" });
      }

      // Check if user already owns it
      const userId = getUserId(req);
      const userCostumes = await storage.getUserCostumes(userId);
      if (userCostumes.some(uc => uc.costumeId === actualCostumeId)) {
        return res.status(400).json({ error: "You already own this costume" });
      }

      // Check if user has enough points
      const points = await storage.getUserPoints(userId);
      if (points.available < costume.price) {
        return res.status(400).json({ error: "Not enough points" });
      }

      // Purchase costume
      const success = await storage.spendPoints(userId, costume.price, `Purchased ${costume.name}`);
      if (!success) {
        return res.status(400).json({ error: "Failed to deduct points" });
      }

      const userCostume = await storage.purchaseCostume(userId, actualCostumeId);
      res.status(201).json(userCostume);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to purchase costume" });
    }
  });

  app.post("/api/costumes/equip", async (req, res) => {
    try {
      const { costumeId } = req.body;
      if (!costumeId || typeof costumeId !== "number") {
        return res.status(400).json({ error: "Costume ID required" });
      }

      const userId = getUserId(req);
      const userCostumes = await storage.getUserCostumes(userId);
      if (!userCostumes.some(uc => uc.costumeId === costumeId)) {
        return res.status(400).json({ error: "You don't own this costume" });
      }

      const equipped = await storage.equipCostume(userId, costumeId);
      res.json(equipped);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to equip costume" });
    }
  });

  app.post("/api/costumes/unequip", async (req, res) => {
    try {
      const { costumeId } = req.body;
      if (!costumeId || typeof costumeId !== "number") {
        return res.status(400).json({ error: "Costume ID required" });
      }

      const userId = getUserId(req);
      const unequipped = await storage.unequipCostume(userId, costumeId);
      res.json(unequipped);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to unequip costume" });
    }
  });

  app.get("/api/costumes/equipped", async (req, res) => {
    try {
      const userId = getUserId(req);
      const equipped = await storage.getEquippedCostumes(userId);
      res.json(equipped);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equipped costumes" });
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

  app.get("/api/todos", async (req, res) => {
    try {
      const userId = getUserId(req);
      const todos = await storage.getTodos(userId);
      res.json(todos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  });

  // Get abandoned todos (created 90+ days ago and not completed)
  app.get("/api/todos/abandoned", async (req, res) => {
    try {
      const userId = getUserId(req);
      const todos = await storage.getTodos(userId);

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Filter incomplete todos that are older than 90 days
      const abandonedTodos = todos.filter(todo => {
        if (todo.completed) return false;
        if (!todo.createdAt) return false;

        const createdDate = new Date(todo.createdAt);
        return createdDate < ninetyDaysAgo;
      });

      res.json(abandonedTodos);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch abandoned todos" });
    }
  });

  app.get("/api/todos/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const todo = await storage.getTodo(id);
      if (!todo) {
        return res.status(404).json({ error: "Todo not found" });
      }
      // Verify ownership
      if (todo.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(todo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch todo" });
    }
  });

  app.post("/api/todos", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertTodoSchema.parse({ ...req.body, userId });
      const todo = await storage.createTodo(validated);
      res.status(201).json(todo);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid todo data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create todo" });
    }
  });

  app.patch("/api/todos/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before update
      const existing = await storage.getTodo(id);
      if (!existing) {
        return res.status(404).json({ error: "Todo not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const updated = await storage.updateTodo(id, req.body);
      res.json(updated);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid todo data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update todo" });
    }
  });

  app.post("/api/todos/:id/complete", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before completing
      const existing = await storage.getTodo(id);
      if (!existing) {
        return res.status(404).json({ error: "Todo not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const completed = await storage.completeTodo(id);
      res.json(completed);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete todo" });
    }
  });

  app.delete("/api/todos/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before delete
      const existing = await storage.getTodo(id);
      if (!existing) {
        return res.status(404).json({ error: "Todo not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const deleted = await storage.deleteTodo(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete todo" });
    }
  });

  // ========== D&D RPG ROUTES ==========

  // Biomes
  app.get("/api/biomes", async (req, res) => {
    try {
      const biomes = await storage.getBiomes();
      res.json(biomes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch biomes" });
    }
  });

  app.get("/api/biomes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const biome = await storage.getBiome(id);
      if (!biome) {
        return res.status(404).json({ error: "Biome not found" });
      }
      res.json(biome);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch biome" });
    }
  });

  // Biome Level Objects
  app.get("/api/biomes/:id/level-objects", async (req, res) => {
    try {
      const biomeId = parseInt(req.params.id);
      const levelObjects = await storage.getBiomeLevelObjects(biomeId);
      res.json(levelObjects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch level objects" });
    }
  });

  app.post("/api/biomes/:id/level-objects/batch", async (req, res) => {
    try {
      const biomeId = parseInt(req.params.id);
      const levelObjects = req.body;

      // Validate that it's an array
      if (!Array.isArray(levelObjects)) {
        return res.status(400).json({ error: "Expected an array of level objects" });
      }

      // Delete all existing level objects for this biome
      await storage.deleteBiomeLevelObjects(biomeId);

      // Insert all new level objects
      const created = await storage.createBiomeLevelObjects(
        levelObjects.map((obj: any) => ({
          ...obj,
          biomeId,
        }))
      );

      res.json(created);
    } catch (error) {
      console.error("Failed to save level objects:", error);
      res.status(500).json({ error: "Failed to save level objects" });
    }
  });

  app.delete("/api/biomes/:id/level-objects/:objectId", async (req, res) => {
    try {
      const objectId = parseInt(req.params.objectId);
      await storage.deleteBiomeLevelObject(objectId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete level object" });
    }
  });

  // Creature Species (Compendium/Pokédex)
  app.get("/api/creatures/species", async (req, res) => {
    try {
      const species = await storage.getCreatureSpecies();
      res.json(species);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch species" });
    }
  });

  app.get("/api/creatures/species/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const species = await storage.getCreatureSpeciesById(id);
      if (!species) {
        return res.status(404).json({ error: "Species not found" });
      }
      res.json(species);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch species" });
    }
  });

  // User Creatures (Collection)
  app.get("/api/creatures", async (req, res) => {
    try {
      const userId = getUserId(req);
      const creatures = await storage.getUserCreatures(userId);
      res.json(creatures);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch creatures" });
    }
  });

  app.get("/api/creatures/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const creature = await storage.getUserCreature(id);
      if (!creature || creature.userId !== userId) {
        return res.status(404).json({ error: "Creature not found" });
      }
      res.json(creature);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch creature" });
    }
  });

  app.patch("/api/creatures/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);

      const existing = await storage.getUserCreature(id);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ error: "Creature not found" });
      }

      const creature = await storage.updateUserCreature(id, req.body);
      res.json(creature);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update creature" });
    }
  });

  // Party Management
  app.get("/api/party", async (req, res) => {
    try {
      const userId = getUserId(req);
      const party = await storage.getParty(userId);
      res.json(party);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch party" });
    }
  });

  app.post("/api/party/:creatureId", async (req, res) => {
    try {
      const userId = getUserId(req);
      const creatureId = parseInt(req.params.creatureId);
      const { position } = req.body;

      const creature = await storage.addToParty(userId, creatureId, position);
      if (!creature) {
        return res.status(404).json({ error: "Creature not found" });
      }

      res.json(creature);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to add to party" });
    }
  });

  app.delete("/api/party/:creatureId", async (req, res) => {
    try {
      const userId = getUserId(req);
      const creatureId = parseInt(req.params.creatureId);

      const creature = await storage.getUserCreature(creatureId);
      if (!creature || creature.userId !== userId) {
        return res.status(404).json({ error: "Creature not found" });
      }

      await storage.removeFromParty(creatureId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from party" });
    }
  });

  // Items & Inventory
  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.get("/api/inventory", async (req, res) => {
    try {
      const userId = getUserId(req);
      const inventory = await storage.getUserInventory(userId);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.post("/api/creatures/:id/equip", async (req, res) => {
    try {
      const userId = getUserId(req);
      const creatureId = parseInt(req.params.id);
      const { itemId } = req.body;

      // Verify ownership
      const creature = await storage.getUserCreature(creatureId);
      if (!creature || creature.userId !== userId) {
        return res.status(404).json({ error: "Creature not found" });
      }

      const equipped = await storage.equipItem(creatureId, itemId);
      res.json(equipped);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to equip item" });
    }
  });

  app.delete("/api/creatures/:id/equip", async (req, res) => {
    try {
      const userId = getUserId(req);
      const creatureId = parseInt(req.params.id);

      const creature = await storage.getUserCreature(creatureId);
      if (!creature || creature.userId !== userId) {
        return res.status(404).json({ error: "Creature not found" });
      }

      await storage.unequipItem(creatureId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to unequip item" });
    }
  });

  // Daily Progress & Threshold
  app.get("/api/daily-progress", async (req, res) => {
    try {
      const userId = getUserId(req);
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      let progress = await storage.getDailyProgress(userId, date);
      if (!progress) {
        progress = await storage.updateDailyProgress(userId, date, {
          habitPointsEarned: 0,
          threshold1Reached: false,
          threshold2Reached: false,
          threshold3Reached: false,
          runsAvailable: 999, // TESTING: infinite runs
          runsUsed: 0,
        });
      } else {
        // TESTING: Override runs available to 999
        progress = { ...progress, runsAvailable: 999 };
      }

      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily progress" });
    }
  });

  // Player Stats
  app.get("/api/player-stats", async (req, res) => {
    try {
      const userId = getUserId(req);

      let stats = await storage.getPlayerStats(userId);
      if (!stats) {
        stats = await storage.createPlayerStats(userId);
      }

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch player stats" });
    }
  });

  // Encounters
  app.get("/api/encounters", async (req, res) => {
    try {
      const userId = getUserId(req);
      const encounters = await storage.getEncounters(userId);
      res.json(encounters);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch encounters" });
    }
  });

  // Runs & Events (RNG System)
  app.get("/api/runs", async (req, res) => {
    try {
      const userId = getUserId(req);
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const runs = await rngService.getAvailableRuns(userId, date);
      res.json(runs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch runs" });
    }
  });

  app.post("/api/runs/use", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { biomeId } = req.body;
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      if (!biomeId) {
        return res.status(400).json({ error: "biomeId is required" });
      }

      const result = await rngService.useRun(userId, biomeId, date);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json(result.event);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to use run" });
    }
  });

  // Combat System
  app.post("/api/combat/start", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { encounterId } = req.body;

      if (!encounterId) {
        return res.status(400).json({ error: "encounterId is required" });
      }

      const state = await combatEngine.initializeCombat(userId, encounterId);
      res.json(state);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to start combat" });
    }
  });

  app.post("/api/combat/action", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { state, action } = req.body;

      if (!state || !action) {
        return res.status(400).json({ error: "state and action are required" });
      }

      const result = await combatEngine.executeAction(userId, state, action);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to execute combat action" });
    }
  });

  // Shards
  app.get("/api/shards", async (req, res) => {
    try {
      const userId = getUserId(req);
      const shards = await storage.getShards(userId);
      res.json(shards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shards" });
    }
  });

  // Sprite Upload (stores in database)
  app.post("/api/sprites/upload", upload.array('sprites', 500), async (req, res) => {
    console.log('[sprites] ========== UPLOAD REQUEST STARTED ==========');
    try {
      const files = req.files as Express.Multer.File[];
      console.log('[sprites] Files received:', files?.length || 0);

      if (!files || files.length === 0) {
        console.log('[sprites] ERROR: No files in request');
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedFiles: string[] = [];

      for (const file of files) {
        console.log(`[sprites] Processing file: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);
        const ext = path.extname(file.originalname).toLowerCase();

        if (ext === '.zip') {
          // Extract ZIP files
          console.log(`[sprites] Extracting ZIP: ${file.originalname}`);
          try {
            const zip = new AdmZip(file.path);
            const zipEntries = zip.getEntries();
            console.log(`[sprites] ZIP contains ${zipEntries.length} entries`);

            for (const entry of zipEntries) {
              // Skip directories and hidden files
              if (entry.isDirectory || entry.entryName.startsWith('__MACOSX') || path.basename(entry.entryName).startsWith('.')) {
                console.log(`[sprites] Skipping: ${entry.entryName}`);
                continue;
              }

              // Only extract image files
              const entryExt = path.extname(entry.entryName).toLowerCase();
              if (['.png', '.jpg', '.jpeg', '.psd'].includes(entryExt)) {
                const fileName = path.basename(entry.entryName);
                console.log(`[sprites] Extracting image: ${fileName}`);
                const imageData = entry.getData();
                const base64Data = imageData.toString('base64');
                console.log(`[sprites] Base64 data length: ${base64Data.length}`);

                // Determine MIME type
                let mimeType = 'image/png';
                if (entryExt === '.jpg' || entryExt === '.jpeg') mimeType = 'image/jpeg';
                else if (entryExt === '.psd') mimeType = 'image/vnd.adobe.photoshop';

                console.log(`[sprites] Attempting to store ${fileName} in database...`);
                // Store in database (upsert to handle duplicates)
                try {
                  await storage.upsertSprite({
                    filename: fileName,
                    category: 'uncategorized',
                    data: base64Data,
                    mimeType,
                  });
                  uploadedFiles.push(fileName);
                  console.log(`[sprites] ✓ Successfully stored in DB: ${fileName}`);
                } catch (dbError: any) {
                  console.error(`[sprites] ✗ Database error for ${fileName}:`, dbError.message);
                  throw dbError;
                }
              }
            }

            // Delete the ZIP file after extraction
            fs.unlinkSync(file.path);
            console.log(`[sprites] Deleted ZIP file: ${file.originalname}`);
          } catch (error: any) {
            console.error(`[sprites] Error extracting ZIP ${file.originalname}:`, error.message);
            throw error;
          }
        } else {
          // Non-ZIP image files
          console.log(`[sprites] Processing single image: ${file.originalname}`);
          const fileData = fs.readFileSync(file.path);
          const base64Data = fileData.toString('base64');
          console.log(`[sprites] Base64 data length: ${base64Data.length}`);

          // Determine MIME type
          let mimeType = file.mimetype;
          if (!mimeType || mimeType === 'application/octet-stream') {
            if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            else if (ext === '.psd') mimeType = 'image/vnd.adobe.photoshop';
          }
          console.log(`[sprites] MIME type: ${mimeType}`);

          console.log(`[sprites] Attempting to store ${file.originalname} in database...`);
          // Store in database (upsert to handle duplicates)
          try {
            await storage.upsertSprite({
              filename: file.originalname,
              category: 'uncategorized',
              data: base64Data,
              mimeType,
            });
            uploadedFiles.push(file.originalname);
            console.log(`[sprites] ✓ Successfully stored in DB: ${file.originalname}`);
          } catch (dbError: any) {
            console.error(`[sprites] ✗ Database error for ${file.originalname}:`, dbError.message);
            throw dbError;
          }

          // Delete temporary file
          fs.unlinkSync(file.path);
          console.log(`[sprites] Deleted temp file: ${file.originalname}`);
        }
      }

      console.log(`[sprites] ========== UPLOAD SUCCESS: ${uploadedFiles.length} files ==========`);
      res.json({
        success: true,
        files: uploadedFiles,
        count: uploadedFiles.length,
      });
    } catch (error: any) {
      console.error('[sprites] ========== UPLOAD FAILED ==========');
      console.error('[sprites] Error type:', error.constructor.name);
      console.error('[sprites] Error message:', error.message);
      console.error('[sprites] Error stack:', error.stack);
      res.status(500).json({ error: error.message || "Failed to upload sprites" });
    }
  });

  // List uploaded sprites (from database)
  app.get("/api/sprites/list", async (req, res) => {
    try {
      const sprites = await storage.getSprites();
      const spriteList = sprites.map(s => ({
        filename: s.filename,
        path: `/api/sprites/file/${s.filename}`,
        category: s.category,
        name: s.name,
      }));

      res.json(spriteList);
    } catch (error: any) {
      console.error('[sprites] List error:', error);
      res.status(500).json({ error: error.message || "Failed to list sprites" });
    }
  });

  // Serve sprite files (from database)
  app.get("/api/sprites/file/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const sprite = await storage.getSpriteByFilename(filename);

      if (!sprite) {
        return res.status(404).json({ error: "Sprite not found" });
      }

      // Decode base64 and send as image
      const imageBuffer = Buffer.from(sprite.data, 'base64');
      res.set('Content-Type', sprite.mimeType);
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(imageBuffer);
    } catch (error: any) {
      console.error('[sprites] File serve error:', error);
      res.status(500).json({ error: error.message || "Failed to serve sprite" });
    }
  });

  // Save sprite organization (updates database)
  app.post("/api/sprites/organize", async (req, res) => {
    try {
      const { sprites } = req.body;

      if (!sprites || !Array.isArray(sprites)) {
        return res.status(400).json({ error: "Invalid request" });
      }

      // Update each sprite in the database
      for (const sprite of sprites) {
        await storage.updateSprite(sprite.filename, {
          category: sprite.category,
          name: sprite.name || null,
          rarity: sprite.rarity || null,
        });
      }

      console.log('[sprites] Organization saved:', sprites.length, 'sprites');
      res.json({ success: true, count: sprites.length });
    } catch (error: any) {
      console.error('[sprites] Organize error:', error);
      res.status(500).json({ error: error.message || "Failed to save organization" });
    }
  });

  // Delete sprites (from database)
  app.post("/api/sprites/delete", async (req, res) => {
    try {
      const { filenames } = req.body;

      if (!filenames || !Array.isArray(filenames)) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const deleted: string[] = [];
      const failed: string[] = [];

      for (const filename of filenames) {
        try {
          await storage.deleteSprite(filename);
          deleted.push(filename);
          console.log(`[sprites] Deleted from DB: ${filename}`);
        } catch (error) {
          console.error(`[sprites] Failed to delete ${filename}:`, error);
          failed.push(filename);
        }
      }

      res.json({
        success: true,
        deleted: deleted.length,
        failed: failed.length,
        deletedFiles: deleted,
        failedFiles: failed,
      });
    } catch (error: any) {
      console.error('[sprites] Delete error:', error);
      res.status(500).json({ error: error.message || "Failed to delete sprites" });
    }
  });

  // Get sprite metadata (lightweight - no base64 data)
  app.get("/api/sprites/metadata", async (req, res) => {
    try {
      const metadata = await storage.getSpritesMetadata();
      res.json(metadata);
    } catch (error: any) {
      console.error('[sprites] Get metadata error:', error);
      res.status(500).json({ error: error.message || "Failed to get sprite metadata" });
    }
  });

  // Get individual sprite by ID (with full data)
  app.get("/api/sprites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid sprite ID" });
      }

      const sprite = await storage.getSpriteById(id);
      if (!sprite) {
        return res.status(404).json({ error: "Sprite not found" });
      }

      res.json({
        id: sprite.id,
        filename: sprite.filename,
        category: sprite.category,
        name: sprite.name,
        data: `data:${sprite.mimeType};base64,${sprite.data}`,
        mimeType: sprite.mimeType,
      });
    } catch (error: any) {
      console.error('[sprites] Get by ID error:', error);
      res.status(500).json({ error: error.message || "Failed to get sprite" });
    }
  });

  // Get all sprites (for admin panel) - with optional includeData parameter
  app.get("/api/sprites", async (req, res) => {
    try {
      const includeData = req.query.includeData !== 'false'; // Default to true for backward compatibility

      if (!includeData) {
        // Return metadata only
        const metadata = await storage.getSpritesMetadata();
        res.json(metadata);
      } else {
        // Return full sprite data (backward compatible)
        const sprites = await storage.getSprites();
        const spriteData = sprites.map(s => ({
          id: s.id,
          filename: s.filename,
          category: s.category,
          name: s.name,
          data: `data:${s.mimeType};base64,${s.data}`,
          mimeType: s.mimeType,
        }));
        res.json(spriteData);
      }
    } catch (error: any) {
      console.error('[sprites] Get all error:', error);
      res.status(500).json({ error: error.message || "Failed to get sprites" });
    }
  });

  // ========== GAME DATA ROUTES ==========

  // Get all biomes
  app.get("/api/game/biomes", async (req, res) => {
    try {
      const biomes = await storage.getBiomes();
      res.json(biomes);
    } catch (error: any) {
      console.error('[game] Get biomes error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create biome
  app.post("/api/game/biomes", async (req, res) => {
    try {
      const biome = await storage.createBiome(req.body);
      res.json(biome);
    } catch (error: any) {
      console.error('[game] Create biome error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all creature species
  app.get("/api/game/creatures", async (req, res) => {
    try {
      const creatures = await storage.getCreatureSpecies();
      res.json(creatures);
    } catch (error: any) {
      console.error('[game] Get creatures error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create creature species
  app.post("/api/game/creatures", async (req, res) => {
    try {
      const creature = await storage.createCreatureSpecies(req.body);
      res.json(creature);
    } catch (error: any) {
      console.error('[game] Create creature error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all items
  app.get("/api/game/items", async (req, res) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error: any) {
      console.error('[game] Get items error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create item
  app.post("/api/game/items", async (req, res) => {
    try {
      const item = await storage.createItem(req.body);
      res.json(item);
    } catch (error: any) {
      console.error('[game] Create item error:', error);
      res.status(500).json({ error: error.message });
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
    } catch (error: any) {
      console.error('[dream-scroll] Get items error:', error);
      res.status(500).json({ error: error.message });
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
    } catch (error: any) {
      console.error('[dream-scroll] Get by category error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new dream scroll item
  app.post("/api/dream-scroll", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const item = await storage.createDreamScrollItem({
        userId: req.user!.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        priority: req.body.priority || 'medium',
        cost: req.body.cost,
      });
      res.json(item);
    } catch (error: any) {
      console.error('[dream-scroll] Create error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update a dream scroll item
  app.patch("/api/dream-scroll/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateDreamScrollItem(id, req.body);

      if (!item) {
        return res.status(404).json({ error: "Dream scroll item not found" });
      }

      res.json(item);
    } catch (error: any) {
      console.error('[dream-scroll] Update error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle completion status
  app.post("/api/dream-scroll/:id/toggle", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      const item = await storage.toggleDreamScrollItemComplete(id);

      if (!item) {
        return res.status(404).json({ error: "Dream scroll item not found" });
      }

      res.json(item);
    } catch (error: any) {
      console.error('[dream-scroll] Toggle error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a dream scroll item
  app.delete("/api/dream-scroll/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      await storage.deleteDreamScrollItem(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[dream-scroll] Delete error:', error);
      res.status(500).json({ error: error.message });
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
    } catch (error: any) {
      console.error('[dream-scroll-tags] Get tags error:', error);
      res.status(500).json({ error: error.message });
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
    } catch (error: any) {
      console.error('[dream-scroll-tags] Create tag error:', error);
      res.status(500).json({ error: error.message });
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
    } catch (error: any) {
      console.error('[dream-scroll-tags] Delete tag error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========== COMBO SYSTEM ROUTES ==========

  // Get combo stats
  app.get("/api/combo/stats", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;

      // Get or create combo stats
      let stats = await storage.getComboStats(userId);

      if (!stats) {
        stats = await storage.createComboStats(userId);
      }

      // Check if combo has expired (5 minutes)
      const now = new Date();
      const comboExpiresAt = stats.comboExpiresAt ? new Date(stats.comboExpiresAt) : null;

      let currentCombo = stats.currentCombo;
      let expiresIn = 0;

      if (comboExpiresAt && now > comboExpiresAt) {
        // Combo expired, reset
        currentCombo = 0;
        await storage.updateComboStats(userId, {
          currentCombo: 0,
          comboExpiresAt: null,
        });
      } else if (comboExpiresAt) {
        expiresIn = Math.floor((comboExpiresAt.getTime() - now.getTime()) / 1000);
      }

      // Calculate multiplier
      const multiplier = currentCombo >= 4 ? 1.3 : currentCombo >= 3 ? 1.2 : currentCombo >= 2 ? 1.1 : 1.0;

      res.json({
        currentCombo,
        dailyHighScore: stats.dailyHighScore,
        multiplier,
        expiresIn,
      });
    } catch (error: any) {
      console.error('[combo] Get stats error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Register a habit completion for combo tracking
  app.post("/api/combo/register", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const now = new Date();

      // Get or create combo stats
      let stats = await storage.getComboStats(userId);

      if (!stats) {
        stats = await storage.createComboStats(userId);
      }

      // Check if previous combo is still valid (within 5 minutes)
      const comboExpiresAt = stats.comboExpiresAt ? new Date(stats.comboExpiresAt) : null;
      let currentCombo = stats.currentCombo;

      if (comboExpiresAt && now > comboExpiresAt) {
        // Previous combo expired, start new one
        currentCombo = 0;
      }

      // Increment combo
      currentCombo += 1;

      // Set new expiration (5 minutes from now)
      const newExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);

      // Update daily high score if needed
      const dailyHighScore = Math.max(stats.dailyHighScore, currentCombo);

      // Calculate multiplier
      const multiplier = currentCombo >= 4 ? 1.3 : currentCombo >= 3 ? 1.2 : currentCombo >= 2 ? 1.1 : 1.0;

      await storage.updateComboStats(userId, {
        currentCombo,
        dailyHighScore,
        lastCompletionTime: now.toISOString(),
        comboExpiresAt: newExpiresAt.toISOString(),
      });

      res.json({
        currentCombo,
        dailyHighScore,
        multiplier,
        expiresIn: 300, // 5 minutes in seconds
      });
    } catch (error: any) {
      console.error('[combo] Register error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========== DAILY QUEST SYSTEM ROUTES ==========

  // Get today's daily quests with progress
  app.get("/api/daily-quests", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const today = new Date().toISOString().split('T')[0];

      // Get all quest templates
      const questTemplates = await storage.getDailyQuestTemplates();

      // Deterministically select 3 quests for today based on date
      const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const selectedQuests = questTemplates
        .sort((a, b) => a.id - b.id)
        .filter((_, index) => (index + dayOfYear) % 3 < 3)
        .slice(0, 3);

      // Get or create user quest progress
      const userQuests = [];
      for (const quest of selectedQuests) {
        let userQuest = await storage.getUserDailyQuest(userId, today, quest.id);

        if (!userQuest) {
          userQuest = await storage.createUserDailyQuest({
            userId,
            questDate: today,
            questId: quest.id,
            progress: 0,
            completed: false,
            claimed: false,
          });
        }

        userQuests.push({
          id: userQuest.id,
          questId: quest.id,
          title: quest.title,
          description: quest.description,
          targetValue: quest.targetValue,
          rewardTokens: quest.rewardTokens,
          progress: userQuest.progress,
          completed: userQuest.completed,
          claimed: userQuest.claimed,
        });
      }

      res.json(userQuests);
    } catch (error: any) {
      console.error('[daily-quests] Get error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Claim quest reward
  app.post("/api/daily-quests/:id/claim", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const questId = parseInt(req.params.id);

      // Get user quest
      const userQuest = await storage.getUserDailyQuestById(questId);

      if (!userQuest || userQuest.userId !== userId) {
        return res.status(404).json({ error: "Quest not found" });
      }

      if (!userQuest.completed) {
        return res.status(400).json({ error: "Quest not completed yet" });
      }

      if (userQuest.claimed) {
        return res.status(400).json({ error: "Quest reward already claimed" });
      }

      // Get quest template for reward amount
      const questTemplate = await storage.getDailyQuestTemplate(userQuest.questId);

      if (!questTemplate) {
        return res.status(404).json({ error: "Quest template not found" });
      }

      // Award tokens
      await storage.addPoints(
        userId,
        questTemplate.rewardTokens,
        "daily_quest",
        questId,
        `Completed daily quest: ${questTemplate.title}`
      );

      // Mark as claimed
      await storage.updateUserDailyQuest(questId, { claimed: true });

      res.json({
        success: true,
        tokensEarned: questTemplate.rewardTokens,
      });
    } catch (error: any) {
      console.error('[daily-quests] Claim error:', error);
      res.status(500).json({ error: error.message });
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
      let freezeData = await storage.getStreakFreeze(userId);

      // Create if doesn't exist
      if (!freezeData) {
        freezeData = await storage.createStreakFreeze(userId);
      }

      // Check if user can earn a freeze (7-day streak)
      const habits = await storage.getHabits(userId);
      const allLogs = await storage.getAllHabitLogs(userId);

      // Calculate current streak (simplified - you may want to use a more robust streak calculation)
      const today = new Date();
      let currentStreak = 0;

      for (let i = 0; i < 90; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        const dayLogs = allLogs.filter(log => log.date === dateStr && log.completed);
        if (dayLogs.length > 0) {
          currentStreak++;
        } else {
          break;
        }
      }

      const canEarn = currentStreak >= 7 && freezeData.freezeCount < 3;

      res.json({
        freezeCount: freezeData.freezeCount,
        canEarn,
      });
    } catch (error: any) {
      console.error('[streak-freezes] Get error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Purchase a streak freeze
  app.post("/api/streak-freezes/purchase", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const FREEZE_COST = 100;

      // Get current points
      const points = await storage.getUserPoints(userId);
      if (!points || points.available < FREEZE_COST) {
        return res.status(400).json({ error: "Not enough tokens" });
      }

      // Get current freeze data
      let freezeData = await storage.getStreakFreeze(userId);
      if (!freezeData) {
        freezeData = await storage.createStreakFreeze(userId);
      }

      // Check if at max freezes
      if (freezeData.freezeCount >= 3) {
        return res.status(400).json({ error: "Already at maximum freezes (3)" });
      }

      // Deduct points
      await storage.addPoints(
        userId,
        -FREEZE_COST,
        "habit_complete",
        null,
        "Purchased streak freeze"
      );

      // Increment freeze count
      const updated = await storage.updateStreakFreeze(userId, {
        freezeCount: freezeData.freezeCount + 1,
      });

      res.json({
        success: true,
        freezeCount: updated.freezeCount,
      });
    } catch (error: any) {
      console.error('[streak-freezes] Purchase error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========== MOUNTAINEERING GAME ROUTES ==========

  // Get all alpine gear
  app.get("/api/alpine-gear", async (req, res) => {
    try {
      const gear = await storage.getAllAlpineGear();
      res.json(gear);
    } catch (error: any) {
      console.error('[alpine-gear] Get all gear error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get player's gear inventory
  app.get("/api/alpine-gear/inventory", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const inventory = await storage.getPlayerGearInventory(req.user!.id);
      res.json(inventory);
    } catch (error: any) {
      console.error('[alpine-gear] Get inventory error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Purchase gear
  app.post("/api/alpine-gear/purchase", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { gearId } = req.body;
      const result = await storage.purchaseGear(req.user!.id, gearId);
      res.json(result);
    } catch (error: any) {
      console.error('[alpine-gear] Purchase error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // ========== GEAR COLLECTION ROUTES ==========

  // Get gear collection stats (for GearCollectionPanel)
  app.get("/api/gear/stats", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;

      // Get all gear
      const allGear = await storage.getAllAlpineGear();

      // Get player's inventory
      const inventory = await storage.getPlayerGearInventory(userId);
      const ownedGearIds = new Set(inventory.map((item: any) => item.gearId));

      // Calculate stats by tier
      const stats = {
        totalGear: allGear.length,
        ownedGear: inventory.length,
        basicTier: allGear.filter((g: any) => g.tier === 'basic').length,
        intermediateTier: allGear.filter((g: any) => g.tier === 'intermediate').length,
        advancedTier: allGear.filter((g: any) => g.tier === 'advanced').length,
        eliteTier: allGear.filter((g: any) => g.tier === 'elite').length,
      };

      res.json(stats);
    } catch (error: any) {
      console.error('[gear] Get stats error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get gear collection with owned status (for GearCollectionPanel)
  app.get("/api/gear/collection", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;

      // Get all gear
      const allGear = await storage.getAllAlpineGear();

      // Get player's inventory
      const inventory = await storage.getPlayerGearInventory(userId);
      const ownedGearIds = new Set(inventory.map((item: any) => item.gearId));

      // Map gear with owned status
      const gearCollection = allGear.map((gear: any) => ({
        id: gear.id,
        name: gear.name,
        category: gear.category,
        tier: gear.tier,
        unlockLevel: gear.unlockLevel || 1,
        cost: gear.cost || 0,
        imageUrl: gear.imageUrl,
        owned: ownedGearIds.has(gear.id),
      }));

      res.json(gearCollection);
    } catch (error: any) {
      console.error('[gear] Get collection error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========== MOUNTAIN ROUTES ==========

  // Get all regions
  app.get("/api/mountains/regions", async (req, res) => {
    try {
      const regions = await storage.getAllRegions();
      res.json(regions);
    } catch (error: any) {
      console.error('[mountains] Get regions error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all mountains
  app.get("/api/mountains", async (req, res) => {
    try {
      const mountains = await storage.getAllMountains();
      res.json(mountains);
    } catch (error: any) {
      console.error('[mountains] Get all error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get mountains by region
  app.get("/api/mountains/region/:regionId", async (req, res) => {
    try {
      const regionId = parseInt(req.params.regionId);
      const mountains = await storage.getMountainsByRegion(regionId);
      res.json(mountains);
    } catch (error: any) {
      console.error('[mountains] Get by region error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get player climbing stats
  app.get("/api/climbing/stats", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const stats = await storage.getPlayerClimbingStats(req.user!.id);
      res.json(stats);
    } catch (error: any) {
      console.error('[climbing] Get stats error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get level progress (for XP bar)
  app.get("/api/user/level-progress", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      let stats = await storage.getPlayerClimbingStats(userId);

      if (!stats) {
        stats = {
          climbingLevel: 1,
          totalXp: 0,
        };
      }

      const currentLevel = stats.climbingLevel || 1;
      const totalXp = stats.totalXp || 0;
      const xpForCurrentLevel = (currentLevel - 1) * 100;
      const xpInCurrentLevel = totalXp - xpForCurrentLevel;
      const xpNeededForNextLevel = 100; // 100 XP per level

      // Calculate climbing grade based on level
      const gradeMap: Record<number, string> = {
        1: "5.5", 2: "5.6", 3: "5.7", 4: "5.8", 5: "5.9",
        6: "5.10a", 7: "5.10b", 8: "5.10c", 9: "5.10d",
        10: "5.11a", 11: "5.11b", 12: "5.11c", 13: "5.11d",
        14: "5.12a", 15: "5.12b", 16: "5.12c", 17: "5.12d",
        18: "5.13a", 19: "5.13b", 20: "5.13c",
      };
      const grade = gradeMap[currentLevel] || "5.13d";

      res.json({
        level: currentLevel,
        grade,
        totalXp,
        xpInCurrentLevel,
        xpNeededForNextLevel,
        progressPercent: Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100),
      });
    } catch (error: any) {
      console.error('[user] Get level progress error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // =============================================
  // EXPEDITION ROUTES
  // =============================================

  // POST /api/expeditions - Create and complete an expedition
  app.post("/api/expeditions", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const { routeId, mountainId, gearIds, teamSize } = req.body;

      if (!routeId) {
        return res.status(400).json({ error: "Route ID is required" });
      }

      // Get user's current climbing level
      const stats = await storage.getPlayerClimbingStats(userId);
      const userLevel = stats?.climbingLevel || 1;

      // Get mountain and route details
      const mountain = await db.query(
        `SELECT * FROM mountains WHERE id = $1`,
        [mountainId]
      );

      if (mountain.rows.length === 0) {
        return res.status(404).json({ error: "Mountain not found" });
      }

      const route = await db.query(
        `SELECT * FROM routes WHERE id = $1`,
        [routeId]
      );

      if (route.rows.length === 0) {
        return res.status(404).json({ error: "Route not found" });
      }

      const mountainData = mountain.rows[0];
      const routeData = route.rows[0];

      // Calculate success probability
      let successChance = 50; // Base 50%

      // Level bonus: +10% if level meets or exceeds requirement
      if (userLevel >= mountainData.required_climbing_level) {
        successChance += 10;
      }

      // Gear bonus: +5% per item (max 25%)
      const gearBonus = Math.min((gearIds?.length || 0) * 5, 25);
      successChance += gearBonus;

      // Team size bonus: +10% for larger teams
      if (teamSize >= 3) {
        successChance += 10;
      }

      // Cap at 90%
      successChance = Math.min(successChance, 90);

      // Determine success
      const success = Math.random() * 100 < successChance;

      // Calculate XP rewards based on difficulty tier
      const xpRewards: Record<string, number> = {
        beginner: 50,
        intermediate: 100,
        advanced: 200,
        expert: 250,
        elite: 300,
      };

      const baseXp = xpRewards[mountainData.difficulty_tier] || 100;
      const xpEarned = Math.round(baseXp * (success ? 1.5 : 0.5));

      // Create expedition record
      const expeditionResult = await db.query(
        `INSERT INTO player_expeditions
         (user_id, route_id, status, start_date, completion_date, summit_reached, experience_earned, current_progress, notes)
         VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, $6, $7)
         RETURNING *`,
        [
          userId,
          routeId,
          success ? 'completed' : 'failed',
          success,
          xpEarned,
          100,
          success ? 'Successfully reached the summit!' : 'Expedition failed, but learned valuable lessons.'
        ]
      );

      const expeditionId = expeditionResult.rows[0].id;

      // Save gear loadout if provided
      if (gearIds && gearIds.length > 0) {
        for (const gearId of gearIds) {
          await db.query(
            `INSERT INTO expedition_gear_loadout (expedition_id, gear_id)
             VALUES ($1, $2)`,
            [expeditionId, gearId]
          );
        }
      }

      // Award XP to player
      await db.query(
        `UPDATE player_climbing_stats
         SET total_xp = total_xp + $1,
             climbing_level = FLOOR((total_xp + $1) / 100) + 1
         WHERE user_id = $2`,
        [xpEarned, userId]
      );

      // Create expedition event
      await db.query(
        `INSERT INTO expedition_events
         (expedition_id, event_type, event_day, description, altitude, energy_change)
         VALUES ($1, $2, 1, $3, $4, 0)`,
        [
          expeditionId,
          success ? 'summit' : 'failure',
          success ? 'Reached the summit!' : 'Expedition unsuccessful',
          success ? mountainData.elevation : Math.floor(mountainData.elevation * 0.7)
        ]
      );

      res.json({
        success,
        expedition: expeditionResult.rows[0],
        xpEarned,
        successChance,
        mountain: {
          name: mountainData.name,
          elevation: mountainData.elevation,
          tier: mountainData.difficulty_tier
        },
        route: {
          name: routeData.name,
          grade: routeData.difficulty_grade
        }
      });
    } catch (error: any) {
      console.error('[expeditions] Create expedition error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/expeditions - Get user's expedition history
  app.get("/api/expeditions", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;

      const expeditions = await db.query(
        `SELECT
          e.*,
          r.name as route_name,
          r.difficulty_grade,
          m.name as mountain_name,
          m.elevation,
          m.difficulty_tier
         FROM player_expeditions e
         JOIN routes r ON e.route_id = r.id
         JOIN mountains m ON r.mountain_id = m.id
         WHERE e.user_id = $1
         ORDER BY e.start_date DESC
         LIMIT 50`,
        [userId]
      );

      res.json(expeditions.rows);
    } catch (error: any) {
      console.error('[expeditions] Get expeditions error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
