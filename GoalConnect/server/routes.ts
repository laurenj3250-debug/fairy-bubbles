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
  app.post("/api/habit-logs/toggle", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { habitId, date } = req.body;

      if (!habitId || !date) {
        return res.status(400).json({ error: "habitId and date are required" });
      }

      // Find existing log for this habit on this date
      const existingLogs = await storage.getHabitLogsByDate(userId, date);
      const existingLog = existingLogs.find(log => log.habitId === habitId);

      let result;

      if (existingLog) {
        // Toggle existing log
        const newCompleted = !existingLog.completed;
        result = await storage.updateHabitLog(existingLog.id, {
          completed: newCompleted
        });

        // If uncompleting, deduct points
        if (!newCompleted && existingLog.completed) {
          // Deduct the points that were awarded
          await storage.spendPoints(userId, 10, `Uncompleted habit`);
        }
        // If completing, points are awarded by the updateHabitLog logic
      } else {
        // Create new log as completed
        const validated = insertHabitLogSchema.parse({
          habitId,
          userId,
          date,
          completed: true,
          note: null
        });
        result = await storage.createHabitLog(validated);

        // Award points for completing a habit
        const habit = await storage.getHabit(habitId);
        if (habit) {
          const allLogs = await storage.getAllHabitLogs(userId);
          const currentStreak = calculateStreak(allLogs);
          const coins = calculateCoinsEarned(habit, currentStreak);

          await storage.addPoints(
            userId,
            coins,
            "habit_complete",
            result.id,
            `Completed "${habit.title}"`
          );

          // If habit is linked to a goal, increment goal progress
          if (habit.linkedGoalId) {
            const goal = await storage.getGoal(habit.linkedGoalId);
            if (goal && goal.userId === userId) {
              const newValue = goal.currentValue + 1;
              await storage.updateGoal(goal.id, {
                currentValue: newValue
              });

              // Create goal update record for tracking
              await storage.createGoalUpdate({
                goalId: goal.id,
                userId: userId,
                value: 1,
                date: date,
                note: `Auto-incremented from habit: ${habit.title}`
              });
            }
          }
        }
      }

      // Handle uncompleting and goal decrement
      if (existingLog && !existingLog.completed && result.completed === false) {
        const habit = await storage.getHabit(habitId);
        if (habit?.linkedGoalId) {
          const goal = await storage.getGoal(habit.linkedGoalId);
          if (goal && goal.userId === userId && goal.currentValue > 0) {
            await storage.updateGoal(goal.id, {
              currentValue: goal.currentValue - 1
            });
          }
        }
      }

      // Auto-update pet stats
      const petUpdate = await updatePetFromHabits(userId);

      // Calculate reward details for frontend
      let rewardDetails = null;
      if (result.completed && !existingLog) {
        const habit = await storage.getHabit(habitId);
        if (habit) {
          const allLogs = await storage.getAllHabitLogs(userId);
          const currentStreak = calculateStreak(allLogs);
          const coins = calculateCoinsEarned(habit, currentStreak);
          const streakMultiplier = getStreakMultiplier(currentStreak);

          rewardDetails = {
            coinsEarned: coins,
            baseCoins: habit.difficulty === 'easy' ? 5 : habit.difficulty === 'hard' ? 15 : 10,
            streak: currentStreak,
            streakMultiplier: streakMultiplier,
            habitTitle: habit.title,
          };
        }
      }

      res.json({
        ...result,
        petUpdate: petUpdate ? {
          leveledUp: petUpdate.leveledUp,
          evolved: petUpdate.evolved,
        } : null,
        rewardDetails,
      });
    } catch (error: any) {
      console.error('Error toggling habit log:', error);
      res.status(500).json({ error: error.message || "Failed to toggle habit log" });
    }
  });

  app.get("/api/goals", async (req, res) => {
    try {
      const userId = getUserId(req);
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
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
    if (!req.isAuthenticated()) {
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
    if (!req.isAuthenticated()) {
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
    if (!req.isAuthenticated()) {
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
    if (!req.isAuthenticated()) {
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
    if (!req.isAuthenticated()) {
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
    if (!req.isAuthenticated()) {
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
    if (!req.isAuthenticated()) {
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
    if (!req.isAuthenticated()) {
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
    if (!req.isAuthenticated()) {
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

  const httpServer = createServer(app);

  return httpServer;
}
