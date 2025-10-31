import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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

const USER_ID = 1;

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
  app.get("/api/habits", async (req, res) => {
    try {
      const habits = await storage.getHabits(USER_ID);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

  app.get("/api/habits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const habit = await storage.getHabit(id);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      res.json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit" });
    }
  });

  app.post("/api/habits", async (req, res) => {
    try {
      const validated = insertHabitSchema.parse({ ...req.body, userId: USER_ID });
      const habit = await storage.createHabit(validated);
      res.status(201).json(habit);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid habit data" });
    }
  });

  app.patch("/api/habits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const habit = await storage.updateHabit(id, req.body);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      res.json(habit);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update habit" });
    }
  });

  app.delete("/api/habits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHabit(id);
      if (!deleted) {
        return res.status(404).json({ error: "Habit not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });

  app.get("/api/habit-logs", async (req, res) => {
    try {
      const { habitId, date } = req.query;
      
      if (date && typeof date === "string") {
        const logs = await storage.getHabitLogsByDate(USER_ID, date);
        return res.json(logs);
      }
      
      if (habitId && typeof habitId === "string") {
        const logs = await storage.getHabitLogs(parseInt(habitId));
        return res.json(logs);
      }
      
      res.status(400).json({ error: "habitId or date parameter required" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit logs" });
    }
  });

  app.post("/api/habit-logs", async (req, res) => {
    try {
      const validated = insertHabitLogSchema.parse({ ...req.body, userId: USER_ID });
      const log = await storage.createHabitLog(validated);

      // Award points for completing a habit
      const habit = await storage.getHabit(validated.habitId);
      if (habit && validated.completed) {
        // Calculate streak for bonus coins
        const allLogs = await storage.getAllHabitLogs(USER_ID);
        const currentStreak = calculateStreak(allLogs);
        const coins = calculateCoinsEarned(habit, currentStreak);

        await storage.addPoints(
          USER_ID,
          coins,
          "habit_complete",
          log.id,
          `Completed "${habit.title}"`
        );
      }

      // Auto-update pet stats
      const petUpdate = await updatePetFromHabits(USER_ID);

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
      const id = parseInt(req.params.id);
      const log = await storage.updateHabitLog(id, req.body);
      if (!log) {
        return res.status(404).json({ error: "Habit log not found" });
      }

      // Auto-update pet stats after changing a log
      const petUpdate = await updatePetFromHabits(USER_ID);

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
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHabitLog(id);
      if (!deleted) {
        return res.status(404).json({ error: "Habit log not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit log" });
    }
  });

  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals(USER_ID);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.get("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const goal = await storage.getGoal(id);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goal" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const validated = insertGoalSchema.parse({ ...req.body, userId: USER_ID });
      const goal = await storage.createGoal(validated);
      res.status(201).json(goal);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid goal data" });
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const goal = await storage.updateGoal(id, req.body);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGoal(id);
      if (!deleted) {
        return res.status(404).json({ error: "Goal not found" });
      }
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
      const validated = insertGoalUpdateSchema.parse({ ...req.body, userId: USER_ID });
      
      // Create update and get milestone info in a single atomic operation
      const result = await storage.createGoalUpdate(validated);
      
      // Check if milestones were crossed and award points
      if (result.milestonesCrossed && result.milestonesCrossed > 0 && result.goal) {
        const points = result.milestonesCrossed * 5; // 5 points per 10% milestone
        await storage.addPoints(
          USER_ID,
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
      let settings = await storage.getUserSettings(USER_ID);
      if (!settings) {
        settings = await storage.updateUserSettings({
          userId: USER_ID,
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
      const validated = insertUserSettingsSchema.parse({ ...req.body, userId: USER_ID });
      const settings = await storage.updateUserSettings(validated);
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid settings data" });
    }
  });

  app.get("/api/export", async (req, res) => {
    try {
      const habits = await storage.getHabits(USER_ID);
      const goals = await storage.getGoals(USER_ID);
      
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
      const habits = await storage.getHabits(USER_ID);
      const allLogs = await storage.getAllHabitLogs(USER_ID);

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
      let pet = await storage.getVirtualPet(USER_ID);
      if (!pet) {
        pet = await storage.createVirtualPet({
          userId: USER_ID,
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
      const id = parseInt(req.params.id);
      const pet = await storage.updateVirtualPet(id, req.body);
      if (!pet) {
        return res.status(404).json({ error: "Pet not found" });
      }
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
      const userCostumes = await storage.getUserCostumes(USER_ID);
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
      const userCostumes = await storage.getUserCostumes(USER_ID);
      if (userCostumes.some(uc => uc.costumeId === actualCostumeId)) {
        return res.status(400).json({ error: "You already own this costume" });
      }

      // Check if user has enough points
      const points = await storage.getUserPoints(USER_ID);
      if (points.available < costume.price) {
        return res.status(400).json({ error: "Not enough points" });
      }

      // Purchase costume
      const success = await storage.spendPoints(USER_ID, costume.price, `Purchased ${costume.name}`);
      if (!success) {
        return res.status(400).json({ error: "Failed to deduct points" });
      }

      const userCostume = await storage.purchaseCostume(USER_ID, actualCostumeId);
      res.status(201).json(userCostume);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to purchase costume" });
    }
  });

  // Points Routes
  app.get("/api/points", async (req, res) => {
    try {
      const points = await storage.getUserPoints(USER_ID);
      res.json(points);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch points" });
    }
  });

  app.get("/api/points/transactions", async (req, res) => {
    try {
      const transactions = await storage.getPointTransactions(USER_ID);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/todos", async (req, res) => {
    try {
      const todos = await storage.getTodos(USER_ID);
      res.json(todos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  });

  app.get("/api/todos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const todo = await storage.getTodo(id);
      if (!todo) {
        return res.status(404).json({ error: "Todo not found" });
      }
      res.json(todo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch todo" });
    }
  });

  app.post("/api/todos", async (req, res) => {
    try {
      const validated = insertTodoSchema.parse({ ...req.body, userId: USER_ID });
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
      const id = parseInt(req.params.id);
      const updated = await storage.updateTodo(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Todo not found" });
      }
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
      const id = parseInt(req.params.id);
      const completed = await storage.completeTodo(id);
      if (!completed) {
        return res.status(404).json({ error: "Todo not found" });
      }
      res.json(completed);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete todo" });
    }
  });

  app.delete("/api/todos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTodo(id);
      if (!deleted) {
        return res.status(404).json({ error: "Todo not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete todo" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
