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
} from "./pet-utils";
import { requireUser } from "./simple-auth";

const getUserId = (req: Request) => requireUser(req).id;

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
        }
      }

      // Auto-update pet stats
      const petUpdate = await updatePetFromHabits(userId);

      res.json({
        ...result,
        petUpdate: petUpdate ? {
          leveledUp: petUpdate.leveledUp,
          evolved: petUpdate.evolved,
        } : null,
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
        const points = result.milestonesCrossed * 5; // 5 points per 10% milestone
        await storage.addPoints(
          userId,
          points,
          "goal_progress",
          result.update.id,
          `Progress on "${result.goal.title}": ${result.goal.currentValue}/${result.goal.targetValue} ${result.goal.unit}`
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

  const httpServer = createServer(app);

  return httpServer;
}
