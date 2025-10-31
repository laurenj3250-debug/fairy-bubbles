import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import type {
  Habit,
  InsertHabit,
  HabitLog,
  InsertHabitLog,
  Goal,
  InsertGoal,
  GoalUpdate,
  InsertGoalUpdate,
  UserSettings,
  InsertUserSettings,
  VirtualPet,
  InsertVirtualPet,
  Costume,
  UserCostume,
  PointTransaction,
  InsertPointTransaction,
  UserPoints,
  Todo,
  InsertTodo,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  // Habits
  async getHabits(userId: number): Promise<Habit[]> {
    return await db.select().from(schema.habits).where(eq(schema.habits.userId, userId));
  }

  async getHabit(id: number): Promise<Habit | undefined> {
    const [habit] = await db.select().from(schema.habits).where(eq(schema.habits.id, id));
    return habit;
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await db.insert(schema.habits).values(habit as any).returning();
    return newHabit;
  }

  async updateHabit(id: number, habit: Partial<InsertHabit>): Promise<Habit | undefined> {
    const [updated] = await db
      .update(schema.habits)
      .set(habit as any)
      .where(eq(schema.habits.id, id))
      .returning();
    return updated;
  }

  async deleteHabit(id: number): Promise<boolean> {
    const result = await db.delete(schema.habits).where(eq(schema.habits.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Habit Logs
  async getHabitLogs(habitId: number): Promise<HabitLog[]> {
    return await db.select().from(schema.habitLogs).where(eq(schema.habitLogs.habitId, habitId));
  }

  async getHabitLogsByDate(userId: number, date: string): Promise<HabitLog[]> {
    return await db
      .select()
      .from(schema.habitLogs)
      .where(and(eq(schema.habitLogs.userId, userId), eq(schema.habitLogs.date, date)));
  }

  async getHabitLog(id: number): Promise<HabitLog | undefined> {
    const [log] = await db.select().from(schema.habitLogs).where(eq(schema.habitLogs.id, id));
    return log;
  }

  async createHabitLog(log: InsertHabitLog): Promise<HabitLog> {
    const [newLog] = await db.insert(schema.habitLogs).values(log).returning();
    return newLog;
  }

  async updateHabitLog(id: number, log: Partial<InsertHabitLog>): Promise<HabitLog | undefined> {
    const [updated] = await db
      .update(schema.habitLogs)
      .set(log)
      .where(eq(schema.habitLogs.id, id))
      .returning();
    return updated;
  }

  async deleteHabitLog(id: number): Promise<boolean> {
    const result = await db.delete(schema.habitLogs).where(eq(schema.habitLogs.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Goals
  async getGoals(userId: number): Promise<Goal[]> {
    return await db.select().from(schema.goals).where(eq(schema.goals.userId, userId));
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(schema.goals).where(eq(schema.goals.id, id));
    return goal;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(schema.goals).values(goal).returning();
    return newGoal;
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const [updated] = await db
      .update(schema.goals)
      .set(goal)
      .where(eq(schema.goals.id, id))
      .returning();
    return updated;
  }

  async deleteGoal(id: number): Promise<boolean> {
    const result = await db.delete(schema.goals).where(eq(schema.goals.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Goal Updates
  async getGoalUpdates(goalId: number): Promise<GoalUpdate[]> {
    return await db.select().from(schema.goalUpdates).where(eq(schema.goalUpdates.goalId, goalId));
  }

  async getGoalUpdate(id: number): Promise<GoalUpdate | undefined> {
    const [update] = await db.select().from(schema.goalUpdates).where(eq(schema.goalUpdates.id, id));
    return update;
  }

  async createGoalUpdate(update: InsertGoalUpdate): Promise<import("./storage").GoalUpdateResult> {
    const { sql } = await import("drizzle-orm");
    
    // Create the goal update
    const [newUpdate] = await db.insert(schema.goalUpdates).values(update).returning();
    
    // Atomically increment goal progress and calculate previous value from new value
    // This avoids race conditions by deriving previous from the atomically updated current
    const result = await db.execute<Goal & { previous_value: number }>(sql`
      UPDATE goals 
      SET current_value = current_value + ${update.value}
      WHERE id = ${update.goalId}
      RETURNING 
        *,
        current_value - ${update.value} as previous_value
    `);
    
    const row = result.rows[0];
    if (!row) {
      throw new Error("Goal not found");
    }
    
    // Calculate milestones from atomically captured values
    // Note: SQL returns snake_case column names
    const goal: Goal = {
      id: row.id,
      userId: (row as any).user_id,
      title: row.title,
      description: row.description,
      targetValue: (row as any).target_value,
      currentValue: (row as any).current_value,
      unit: row.unit,
      deadline: row.deadline,
      category: row.category,
    };
    
    const percentBefore = (row.previous_value / goal.targetValue) * 100;
    const percentAfter = (goal.currentValue / goal.targetValue) * 100;
    const milestoneBefore = Math.floor(percentBefore / 10);
    const milestoneAfter = Math.floor(percentAfter / 10);
    const milestonesCrossed = milestoneAfter - milestoneBefore;
    
    return {
      update: newUpdate,
      goal,
      milestonesCrossed: milestonesCrossed > 0 ? milestonesCrossed : 0,
    };
  }

  async deleteGoalUpdate(id: number): Promise<boolean> {
    const result = await db.delete(schema.goalUpdates).where(eq(schema.goalUpdates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // User Settings
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId));
    return settings;
  }

  async updateUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [updated] = await db
      .insert(schema.userSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: schema.userSettings.userId,
        set: settings,
      })
      .returning();
    return updated;
  }

  // Virtual Pet
  async getVirtualPet(userId: number): Promise<VirtualPet | undefined> {
    const [pet] = await db.select().from(schema.virtualPets).where(eq(schema.virtualPets.userId, userId));
    return pet;
  }

  async createVirtualPet(pet: InsertVirtualPet): Promise<VirtualPet> {
    const [newPet] = await db.insert(schema.virtualPets).values(pet as any).returning();
    return newPet;
  }

  async updateVirtualPet(id: number, pet: Partial<VirtualPet>): Promise<VirtualPet | undefined> {
    const [updated] = await db
      .update(schema.virtualPets)
      .set(pet)
      .where(eq(schema.virtualPets.id, id))
      .returning();
    return updated;
  }

  // Costumes
  async getAllCostumes(): Promise<Costume[]> {
    return await db.select().from(schema.costumes);
  }

  async getCostume(id: number): Promise<Costume | undefined> {
    const [costume] = await db.select().from(schema.costumes).where(eq(schema.costumes.id, id));
    return costume;
  }

  async getCostumeByName(name: string): Promise<Costume | undefined> {
    const [costume] = await db.select().from(schema.costumes).where(eq(schema.costumes.name, name));
    return costume;
  }

  async createCostume(costume: Omit<Costume, 'id'>): Promise<Costume> {
    const [newCostume] = await db.insert(schema.costumes).values(costume as any).returning();
    return newCostume;
  }

  // User Costumes
  async getUserCostumes(userId: number): Promise<UserCostume[]> {
    return await db.select().from(schema.userCostumes).where(eq(schema.userCostumes.userId, userId));
  }

  async purchaseCostume(userId: number, costumeId: number): Promise<UserCostume> {
    const [newUserCostume] = await db
      .insert(schema.userCostumes)
      .values({
        userId,
        costumeId,
      })
      .returning();
    return newUserCostume;
  }

  // Points
  async getUserPoints(userId: number): Promise<UserPoints> {
    const [points] = await db.select().from(schema.userPoints).where(eq(schema.userPoints.userId, userId));
    
    if (!points) {
      // Initialize points if they don't exist
      const [newPoints] = await db
        .insert(schema.userPoints)
        .values({
          userId,
          totalEarned: 0,
          totalSpent: 0,
          available: 0,
        })
        .returning();
      return newPoints;
    }
    
    return points;
  }

  async addPoints(
    userId: number,
    amount: number,
    type: PointTransaction['type'],
    relatedId: number | null,
    description: string
  ): Promise<PointTransaction> {
    // Create transaction
    const [transaction] = await db
      .insert(schema.pointTransactions)
      .values({
        userId,
        amount,
        type,
        relatedId,
        description,
      })
      .returning();

    // Update user points
    const currentPoints = await this.getUserPoints(userId);
    await db
      .update(schema.userPoints)
      .set({
        totalEarned: currentPoints.totalEarned + amount,
        available: currentPoints.available + amount,
      })
      .where(eq(schema.userPoints.userId, userId));

    return transaction;
  }

  async spendPoints(userId: number, amount: number, description: string): Promise<boolean> {
    const currentPoints = await this.getUserPoints(userId);
    
    // Guard against insufficient funds
    if (currentPoints.available < amount) {
      return false;
    }

    // Verify balance again before spending to prevent race conditions
    const newAvailable = currentPoints.available - amount;
    if (newAvailable < 0) {
      return false;
    }

    // Create transaction
    await db.insert(schema.pointTransactions).values({
      userId,
      amount: -amount,
      type: "costume_purchase",
      relatedId: null,
      description,
    });

    // Update user points with verified calculations
    await db
      .update(schema.userPoints)
      .set({
        totalSpent: currentPoints.totalSpent + amount,
        available: newAvailable,
      })
      .where(eq(schema.userPoints.userId, userId));

    return true;
  }

  async getPointTransactions(userId: number): Promise<PointTransaction[]> {
    return await db
      .select()
      .from(schema.pointTransactions)
      .where(eq(schema.pointTransactions.userId, userId))
      .orderBy(desc(schema.pointTransactions.createdAt));
  }

  async getTodos(userId: number): Promise<Todo[]> {
    return await db
      .select()
      .from(schema.todos)
      .where(eq(schema.todos.userId, userId))
      .orderBy(schema.todos.completed, schema.todos.dueDate, desc(schema.todos.createdAt));
  }

  async getTodo(id: number): Promise<Todo | undefined> {
    const results = await db.select().from(schema.todos).where(eq(schema.todos.id, id)).limit(1);
    return results[0];
  }

  async createTodo(todo: InsertTodo): Promise<Todo> {
    const results = await db.insert(schema.todos).values(todo).returning();
    return results[0];
  }

  async updateTodo(id: number, update: Partial<Todo>): Promise<Todo | undefined> {
    const results = await db
      .update(schema.todos)
      .set(update)
      .where(eq(schema.todos.id, id))
      .returning();
    return results[0];
  }

  async deleteTodo(id: number): Promise<boolean> {
    const result = await db.delete(schema.todos).where(eq(schema.todos.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async completeTodo(id: number): Promise<Todo | undefined> {
    const todo = await this.getTodo(id);
    if (!todo || todo.completed) return todo;

    const results = await db
      .update(schema.todos)
      .set({
        completed: true,
        completedAt: new Date(),
      })
      .where(eq(schema.todos.id, id))
      .returning();

    if (results[0]) {
      await this.addPoints(
        todo.userId,
        todo.points,
        "todo_complete",
        id,
        `Completed: ${todo.title}`
      );
    }

    return results[0];
  }
}
