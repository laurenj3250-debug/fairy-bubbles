import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { storage } from '../server/storage';
import { initializeDatabase } from '../server/init-db';
import {
  insertHabitSchema,
  insertHabitLogSchema,
  insertGoalSchema,
  insertGoalUpdateSchema,
  insertUserSettingsSchema,
  insertTodoSchema,
} from '../shared/schema';
import {
  calculatePetStats,
  calculateStreak,
  calculateWeeklyCompletion,
  calculateCoinsEarned,
} from '../server/pet-utils';

const USER_ID = 1;

// Create Express app
const app = express();
app.use(express.json());

// Helper function to update pet stats
async function updatePetFromHabits(userId: number) {
  try {
    const habits = await storage.getHabits(userId);
    const allLogs = await storage.getAllHabitLogs(userId);
    let pet = await storage.getVirtualPet(userId);

    if (!pet) {
      pet = await storage.createVirtualPet({
        userId,
        name: 'Forest Friend',
        species: 'Gremlin',
        happiness: 50,
        health: 100,
        level: 1,
        experience: 0,
        evolution: 'seed',
      });
    }

    const stats = calculatePetStats(habits, allLogs, pet);
    await storage.updateVirtualPet(pet.id, {
      experience: stats.experience,
      level: stats.level,
      happiness: stats.happiness,
      evolution: stats.evolution,
    });

    return { stats, leveledUp: stats.leveledUp, evolved: stats.evolved };
  } catch (error) {
    console.error('Failed to update pet stats:', error);
    return null;
  }
}

// Database initialization routes
app.get('/init-database', async (req, res) => {
  try {
    const result = await initializeDatabase();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      error: error.message,
    });
  }
});

app.get('/database-status', async (req, res) => {
  try {
    const { isDatabaseSeeded } = await import('../server/init-db');
    const seeded = await isDatabaseSeeded();
    res.json({ seeded });
  } catch (error: any) {
    res.json({ seeded: false, error: error.message });
  }
});

// Habits routes
app.get('/habits', async (req, res) => {
  try {
    const habits = await storage.getHabits(USER_ID);
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

app.get('/habits/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const habit = await storage.getHabit(id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habit' });
  }
});

app.post('/habits', async (req, res) => {
  try {
    const validated = insertHabitSchema.parse({ ...req.body, userId: USER_ID });
    const habit = await storage.createHabit(validated);
    res.status(201).json(habit);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Invalid habit data' });
  }
});

app.patch('/habits/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const habit = await storage.updateHabit(id, req.body);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(habit);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update habit' });
  }
});

app.delete('/habits/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteHabit(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Habit logs routes
app.get('/habit-logs', async (req, res) => {
  try {
    const { habitId, date } = req.query;
    if (date && typeof date === 'string') {
      const logs = await storage.getHabitLogsByDate(USER_ID, date);
      return res.json(logs);
    }
    if (habitId && typeof habitId === 'string') {
      const logs = await storage.getHabitLogs(parseInt(habitId));
      return res.json(logs);
    }
    res.status(400).json({ error: 'habitId or date parameter required' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habit logs' });
  }
});

app.post('/habit-logs', async (req, res) => {
  try {
    const validated = insertHabitLogSchema.parse({ ...req.body, userId: USER_ID });
    const log = await storage.createHabitLog(validated);

    const habit = await storage.getHabit(validated.habitId);
    if (habit && validated.completed) {
      const allLogs = await storage.getAllHabitLogs(USER_ID);
      const currentStreak = calculateStreak(allLogs);
      const coins = calculateCoinsEarned(habit, currentStreak);

      await storage.addPoints(
        USER_ID,
        coins,
        'habit_complete',
        log.id,
        `Completed "${habit.title}"`
      );
    }

    const petUpdate = await updatePetFromHabits(USER_ID);
    res.status(201).json({
      ...log,
      petUpdate: petUpdate
        ? {
            leveledUp: petUpdate.leveledUp,
            evolved: petUpdate.evolved,
          }
        : null,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Invalid habit log data' });
  }
});

app.patch('/habit-logs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const log = await storage.updateHabitLog(id, req.body);
    if (!log) {
      return res.status(404).json({ error: 'Habit log not found' });
    }
    const petUpdate = await updatePetFromHabits(USER_ID);
    res.json({
      ...log,
      petUpdate: petUpdate
        ? {
            leveledUp: petUpdate.leveledUp,
            evolved: petUpdate.evolved,
          }
        : null,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update habit log' });
  }
});

app.delete('/habit-logs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteHabitLog(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Habit log not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete habit log' });
  }
});

// Goals routes
app.get('/goals', async (req, res) => {
  try {
    const goals = await storage.getGoals(USER_ID);
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

app.get('/goals/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const goal = await storage.getGoal(id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

app.post('/goals', async (req, res) => {
  try {
    const validated = insertGoalSchema.parse({ ...req.body, userId: USER_ID });
    const goal = await storage.createGoal(validated);
    res.status(201).json(goal);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Invalid goal data' });
  }
});

app.patch('/goals/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const goal = await storage.updateGoal(id, req.body);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update goal' });
  }
});

app.delete('/goals/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteGoal(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Goal updates routes
app.get('/goal-updates/:goalId', async (req, res) => {
  try {
    const goalId = parseInt(req.params.goalId);
    const updates = await storage.getGoalUpdates(goalId);
    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goal updates' });
  }
});

app.post('/goal-updates', async (req, res) => {
  try {
    const validated = insertGoalUpdateSchema.parse({ ...req.body, userId: USER_ID });
    const result = await storage.createGoalUpdate(validated);

    if (result.milestonesCrossed && result.milestonesCrossed > 0 && result.goal) {
      const points = result.milestonesCrossed * 5;
      await storage.addPoints(
        USER_ID,
        points,
        'goal_progress',
        result.update.id,
        `Progress on "${result.goal.title}": ${result.goal.currentValue}/${result.goal.targetValue} ${result.goal.unit}`
      );
    }

    res.status(201).json(result.update);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Invalid goal update data' });
  }
});

// Settings routes
app.get('/settings', async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/settings', async (req, res) => {
  try {
    const validated = insertUserSettingsSchema.parse({ ...req.body, userId: USER_ID });
    const settings = await storage.updateUserSettings(validated);
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Invalid settings data' });
  }
});

// Stats route
app.get('/stats', async (req, res) => {
  try {
    const habits = await storage.getHabits(USER_ID);
    const allLogs = await storage.getAllHabitLogs(USER_ID);
    const currentStreak = calculateStreak(allLogs);
    const weeklyCompletion = calculateWeeklyCompletion(habits, allLogs);
    res.json({ currentStreak, weeklyCompletion });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Export route
app.get('/export', async (req, res) => {
  try {
    const habits = await storage.getHabits(USER_ID);
    const goals = await storage.getGoals(USER_ID);
    const allLogs = await Promise.all(habits.map((h) => storage.getHabitLogs(h.id)));
    const habitLogs = allLogs.flat();
    const allUpdates = await Promise.all(goals.map((g) => storage.getGoalUpdates(g.id)));
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
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Pet routes
app.get('/pet', async (req, res) => {
  try {
    let pet = await storage.getVirtualPet(USER_ID);
    if (!pet) {
      pet = await storage.createVirtualPet({
        userId: USER_ID,
        name: 'Forest Friend',
        species: 'Gremlin',
        happiness: 50,
        health: 100,
        level: 1,
        experience: 0,
        evolution: 'seed',
      });
    }
    res.json(pet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch virtual pet' });
  }
});

app.patch('/pet/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pet = await storage.updateVirtualPet(id, req.body);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    res.json(pet);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update pet' });
  }
});

// Costumes routes
app.get('/costumes', async (req, res) => {
  try {
    const costumes = await storage.getAllCostumes();
    const customCostumes: any[] = [];
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const customCostumesPath = path.join(
        process.cwd(),
        'attached_assets',
        'custom_costumes',
        'costumes.json'
      );
      const customData = await fs.readFile(customCostumesPath, 'utf-8');
      const customCostumesList = JSON.parse(customData);

      customCostumesList.forEach((custom: any, index: number) => {
        customCostumes.push({
          id: -(index + 1000),
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
      console.log('No custom costumes found:', err);
    }

    res.json([...costumes, ...customCostumes]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch costumes' });
  }
});

app.get('/user-costumes', async (req, res) => {
  try {
    const userCostumes = await storage.getUserCostumes(USER_ID);
    res.json(userCostumes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user costumes' });
  }
});

app.post('/costumes/purchase', async (req, res) => {
  try {
    const { costumeId } = req.body;
    if (!costumeId || typeof costumeId !== 'number') {
      return res.status(400).json({ error: 'Costume ID required' });
    }

    let costume: any = null;
    const isCustom = costumeId < 0;
    let actualCostumeId = costumeId;

    if (isCustom) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const customCostumesPath = path.join(
          process.cwd(),
          'attached_assets',
          'custom_costumes',
          'costumes.json'
        );
        const customData = await fs.readFile(customCostumesPath, 'utf-8');
        const customCostumesList = JSON.parse(customData);

        const index = Math.abs(costumeId + 1000);
        const customCostume = customCostumesList[index];
        if (customCostume) {
          const existingCostume = await storage.getCostumeByName(customCostume.name);
          if (existingCostume) {
            actualCostumeId = existingCostume.id;
            costume = existingCostume;
          } else {
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
        return res.status(404).json({ error: 'Custom costume not found' });
      }
    } else {
      costume = await storage.getCostume(costumeId);
    }

    if (!costume) {
      return res.status(404).json({ error: 'Costume not found' });
    }

    const userCostumes = await storage.getUserCostumes(USER_ID);
    if (userCostumes.some((uc) => uc.costumeId === actualCostumeId)) {
      return res.status(400).json({ error: 'You already own this costume' });
    }

    const points = await storage.getUserPoints(USER_ID);
    if (points.available < costume.price) {
      return res.status(400).json({ error: 'Not enough points' });
    }

    const success = await storage.spendPoints(USER_ID, costume.price, `Purchased ${costume.name}`);
    if (!success) {
      return res.status(400).json({ error: 'Failed to deduct points' });
    }

    const userCostume = await storage.purchaseCostume(USER_ID, actualCostumeId);
    res.status(201).json(userCostume);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to purchase costume' });
  }
});

app.post('/costumes/equip', async (req, res) => {
  try {
    const { costumeId } = req.body;
    if (!costumeId || typeof costumeId !== 'number') {
      return res.status(400).json({ error: 'Costume ID required' });
    }
    const userCostumes = await storage.getUserCostumes(USER_ID);
    if (!userCostumes.some((uc) => uc.costumeId === costumeId)) {
      return res.status(400).json({ error: "You don't own this costume" });
    }
    const equipped = await storage.equipCostume(USER_ID, costumeId);
    res.json(equipped);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to equip costume' });
  }
});

app.post('/costumes/unequip', async (req, res) => {
  try {
    const { costumeId } = req.body;
    if (!costumeId || typeof costumeId !== 'number') {
      return res.status(400).json({ error: 'Costume ID required' });
    }
    const unequipped = await storage.unequipCostume(USER_ID, costumeId);
    res.json(unequipped);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to unequip costume' });
  }
});

app.get('/costumes/equipped', async (req, res) => {
  try {
    const equipped = await storage.getEquippedCostumes(USER_ID);
    res.json(equipped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipped costumes' });
  }
});

// Points routes
app.get('/points', async (req, res) => {
  try {
    const points = await storage.getUserPoints(USER_ID);
    res.json(points);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch points' });
  }
});

app.get('/user-points', async (req, res) => {
  try {
    const points = await storage.getUserPoints(USER_ID);
    res.json(points);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch points' });
  }
});

app.get('/points/transactions', async (req, res) => {
  try {
    const transactions = await storage.getPointTransactions(USER_ID);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Todos routes
app.get('/todos', async (req, res) => {
  try {
    const todos = await storage.getTodos(USER_ID);
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

app.get('/todos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const todo = await storage.getTodo(id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

app.post('/todos', async (req, res) => {
  try {
    const validated = insertTodoSchema.parse({ ...req.body, userId: USER_ID });
    const todo = await storage.createTodo(validated);
    res.status(201).json(todo);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid todo data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.patch('/todos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await storage.updateTodo(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid todo data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.post('/todos/:id/complete', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const completed = await storage.completeTodo(id);
    if (!completed) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(completed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete todo' });
  }
});

app.delete('/todos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteTodo(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Export the Express app as a Vercel serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Remove '/api' prefix from the path
  const path = req.url?.replace(/^\/api/, '') || '/';
  req.url = path;

  return app(req as any, res as any);
}
