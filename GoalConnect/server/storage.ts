import {
  type Habit,
  type InsertHabit,
  type HabitLog,
  type InsertHabitLog,
  type Goal,
  type InsertGoal,
  type GoalUpdate,
  type InsertGoalUpdate,
  type UserSettings,
  type InsertUserSettings,
  type VirtualPet,
  type InsertVirtualPet,
  type Costume,
  type UserCostume,
  type PointTransaction,
  type InsertPointTransaction,
  type UserPoints,
  type Todo,
  type InsertTodo,
} from "@shared/schema";

export interface GoalUpdateResult {
  update: GoalUpdate;
  goal?: Goal;
  milestonesCrossed?: number;
}

export interface IStorage {
  getHabits(userId: number): Promise<Habit[]>;
  getHabit(id: number): Promise<Habit | undefined>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: number, habit: Partial<InsertHabit>): Promise<Habit | undefined>;
  deleteHabit(id: number): Promise<boolean>;
  
  getHabitLogs(habitId: number): Promise<HabitLog[]>;
  getHabitLogsByDate(userId: number, date: string): Promise<HabitLog[]>;
  getHabitLog(id: number): Promise<HabitLog | undefined>;
  createHabitLog(log: InsertHabitLog): Promise<HabitLog>;
  updateHabitLog(id: number, log: Partial<InsertHabitLog>): Promise<HabitLog | undefined>;
  deleteHabitLog(id: number): Promise<boolean>;
  
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  getGoalUpdates(goalId: number): Promise<GoalUpdate[]>;
  getGoalUpdate(id: number): Promise<GoalUpdate | undefined>;
  createGoalUpdate(update: InsertGoalUpdate): Promise<GoalUpdateResult>;
  deleteGoalUpdate(id: number): Promise<boolean>;
  
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  updateUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  
  getVirtualPet(userId: number): Promise<VirtualPet | undefined>;
  createVirtualPet(pet: InsertVirtualPet): Promise<VirtualPet>;
  updateVirtualPet(id: number, pet: Partial<VirtualPet>): Promise<VirtualPet | undefined>;
  
  getAllCostumes(): Promise<Costume[]>;
  getCostume(id: number): Promise<Costume | undefined>;
  getCostumeByName(name: string): Promise<Costume | undefined>;
  createCostume(costume: Omit<Costume, 'id'>): Promise<Costume>;
  
  getUserCostumes(userId: number): Promise<UserCostume[]>;
  purchaseCostume(userId: number, costumeId: number): Promise<UserCostume>;
  
  getUserPoints(userId: number): Promise<UserPoints>;
  addPoints(userId: number, amount: number, type: PointTransaction['type'], relatedId: number | null, description: string): Promise<PointTransaction>;
  spendPoints(userId: number, amount: number, description: string): Promise<boolean>;
  getPointTransactions(userId: number): Promise<PointTransaction[]>;
  
  getTodos(userId: number): Promise<Todo[]>;
  getTodo(id: number): Promise<Todo | undefined>;
  createTodo(todo: InsertTodo): Promise<Todo>;
  updateTodo(id: number, todo: Partial<Todo>): Promise<Todo | undefined>;
  deleteTodo(id: number): Promise<boolean>;
  completeTodo(id: number): Promise<Todo | undefined>;
}

export class MemStorage implements IStorage {
  private habits: Map<number, Habit> = new Map();
  private habitLogs: Map<number, HabitLog> = new Map();
  private goals: Map<number, Goal> = new Map();
  private goalUpdates: Map<number, GoalUpdate> = new Map();
  private userSettings: Map<number, UserSettings> = new Map();
  private virtualPets: Map<number, VirtualPet> = new Map();
  private costumes: Map<number, Costume> = new Map();
  private userCostumes: Map<number, UserCostume> = new Map();
  private pointTransactions: Map<number, PointTransaction> = new Map();
  private userPoints: Map<number, UserPoints> = new Map();
  private todos: Map<number, Todo> = new Map();
  
  private nextId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    const habits = [
      { userId: 1, title: "Morning Exercise", description: "30 minutes cardio or strength training", icon: "Dumbbell", color: "#8B5CF6", cadence: "daily" as const },
      { userId: 1, title: "Read 30 minutes", description: "Read books, articles, or learning materials", icon: "BookOpen", color: "#3B82F6", cadence: "daily" as const },
      { userId: 1, title: "Meditate", description: "10 minutes mindfulness meditation", icon: "Brain", color: "#10B981", cadence: "daily" as const },
      { userId: 1, title: "Weekly Review", description: "Review goals and plan next week", icon: "ClipboardCheck", color: "#F59E0B", cadence: "weekly" as const },
    ];

    habits.forEach(h => this.createHabit(h));

    const today = new Date();
    const getLast7Days = () => {
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.unshift(date.toISOString().split('T')[0]);
      }
      return dates;
    };

    const last7Days = getLast7Days();
    last7Days.forEach((date, i) => {
      this.createHabitLog({ habitId: 1, userId: 1, date, completed: true, note: null });
      this.createHabitLog({ habitId: 2, userId: 1, date, completed: i % 3 !== 0, note: null });
      this.createHabitLog({ habitId: 3, userId: 1, date, completed: i % 2 === 0, note: null });
    });

    const goals = [
      { userId: 1, title: "Complete 30 Day Meditation Streak", description: "Meditate every day for 30 consecutive days", targetValue: 30, currentValue: 22, unit: "days", deadline: "2025-11-10", category: "Health" },
      { userId: 1, title: "Read 12 Books This Year", description: "Read at least one book per month", targetValue: 12, currentValue: 7, unit: "books", deadline: "2025-12-31", category: "Learning" },
      { userId: 1, title: "Save $5000", description: "Build emergency fund", targetValue: 5000, currentValue: 2800, unit: "$", deadline: "2025-12-31", category: "Finance" },
      { userId: 1, title: "Run 100 Miles", description: "Run 100 miles in Q4", targetValue: 100, currentValue: 42, unit: "miles", deadline: "2025-12-31", category: "Fitness" },
    ];

    goals.forEach(g => this.createGoal(g));

    this.updateUserSettings({ userId: 1, darkMode: true, notifications: true });

    // Seed costumes
    const costumeData: Omit<Costume, 'id'>[] = [
      { name: "Party Hat", description: "A festive party hat", category: "hat", price: 50, imageUrl: "🎉", rarity: "common" },
      { name: "Crown", description: "Royal crown fit for a king", category: "hat", price: 200, imageUrl: "👑", rarity: "rare" },
      { name: "Wizard Hat", description: "Magical wizard hat", category: "hat", price: 150, imageUrl: "🧙", rarity: "rare" },
      { name: "Superhero Cape", description: "Feel like a superhero", category: "outfit", price: 100, imageUrl: "🦸", rarity: "common" },
      { name: "Ninja Outfit", description: "Stealth mode activated", category: "outfit", price: 250, imageUrl: "🥷", rarity: "epic" },
      { name: "Sunglasses", description: "Cool shades", category: "accessory", price: 75, imageUrl: "😎", rarity: "common" },
      { name: "Gold Medal", description: "Achievement unlocked", category: "accessory", price: 300, imageUrl: "🏅", rarity: "epic" },
      { name: "Space Background", description: "Explore the cosmos", category: "background", price: 400, imageUrl: "🌌", rarity: "legendary" },
      { name: "Forest Background", description: "Nature vibes", category: "background", price: 150, imageUrl: "🌲", rarity: "rare" },
      { name: "Rainbow Background", description: "Bright and cheerful", category: "background", price: 100, imageUrl: "🌈", rarity: "common" },
    ];
    
    costumeData.forEach(c => {
      const id = this.nextId++;
      this.costumes.set(id, { id, ...c });
    });

    // Create virtual pet for user 1
    this.createVirtualPet({
      userId: 1,
      name: "Gizmo",
      species: "Gremlin",
      happiness: 85,
      health: 90,
      level: 3,
      experience: 150,
      currentCostumeId: null,
    });

    // Initialize user points
    this.userPoints.set(1, { userId: 1, totalEarned: 250, totalSpent: 0, available: 250 });
  }

  async getHabits(userId: number): Promise<Habit[]> {
    return Array.from(this.habits.values()).filter(h => h.userId === userId);
  }

  async getHabit(id: number): Promise<Habit | undefined> {
    return this.habits.get(id);
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const id = this.nextId++;
    const newHabit: Habit = { id, ...habit };
    this.habits.set(id, newHabit);
    return newHabit;
  }

  async updateHabit(id: number, habit: Partial<InsertHabit>): Promise<Habit | undefined> {
    const existing = this.habits.get(id);
    if (!existing) return undefined;
    
    const updated: Habit = { ...existing, ...habit };
    this.habits.set(id, updated);
    return updated;
  }

  async deleteHabit(id: number): Promise<boolean> {
    return this.habits.delete(id);
  }

  async getHabitLogs(habitId: number): Promise<HabitLog[]> {
    return Array.from(this.habitLogs.values()).filter(log => log.habitId === habitId);
  }

  async getHabitLogsByDate(userId: number, date: string): Promise<HabitLog[]> {
    return Array.from(this.habitLogs.values()).filter(
      log => log.userId === userId && log.date === date
    );
  }

  async getHabitLog(id: number): Promise<HabitLog | undefined> {
    return this.habitLogs.get(id);
  }

  async createHabitLog(log: InsertHabitLog): Promise<HabitLog> {
    const id = this.nextId++;
    const newLog: HabitLog = { id, ...log, note: log.note || null };
    this.habitLogs.set(id, newLog);
    return newLog;
  }

  async updateHabitLog(id: number, log: Partial<InsertHabitLog>): Promise<HabitLog | undefined> {
    const existing = this.habitLogs.get(id);
    if (!existing) return undefined;
    
    const updated: HabitLog = { ...existing, ...log };
    this.habitLogs.set(id, updated);
    return updated;
  }

  async deleteHabitLog(id: number): Promise<boolean> {
    return this.habitLogs.delete(id);
  }

  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(g => g.userId === userId);
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = this.nextId++;
    const newGoal: Goal = { id, ...goal };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const existing = this.goals.get(id);
    if (!existing) return undefined;
    
    const updated: Goal = { ...existing, ...goal };
    this.goals.set(id, updated);
    return updated;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }

  async getGoalUpdates(goalId: number): Promise<GoalUpdate[]> {
    return Array.from(this.goalUpdates.values()).filter(u => u.goalId === goalId);
  }

  async getGoalUpdate(id: number): Promise<GoalUpdate | undefined> {
    return this.goalUpdates.get(id);
  }

  async createGoalUpdate(update: InsertGoalUpdate): Promise<GoalUpdateResult> {
    const id = this.nextId++;
    const newUpdate: GoalUpdate = { id, ...update, note: update.note || null };
    this.goalUpdates.set(id, newUpdate);
    
    const goal = this.goals.get(update.goalId);
    let milestonesCrossed = 0;
    
    if (goal) {
      // Calculate milestones before update
      const percentBefore = (goal.currentValue / goal.targetValue) * 100;
      const milestoneBefore = Math.floor(percentBefore / 10);
      
      // Goal updates represent deltas - add the new value to existing progress
      goal.currentValue += update.value;
      this.goals.set(goal.id, goal);
      
      // Calculate milestones after update
      const percentAfter = (goal.currentValue / goal.targetValue) * 100;
      const milestoneAfter = Math.floor(percentAfter / 10);
      
      milestonesCrossed = milestoneAfter - milestoneBefore;
    }
    
    return {
      update: newUpdate,
      goal,
      milestonesCrossed: milestonesCrossed > 0 ? milestonesCrossed : 0,
    };
  }

  async deleteGoalUpdate(id: number): Promise<boolean> {
    return this.goalUpdates.delete(id);
  }

  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return this.userSettings.get(userId);
  }

  async updateUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    this.userSettings.set(settings.userId, settings);
    return settings;
  }

  async getVirtualPet(userId: number): Promise<VirtualPet | undefined> {
    return Array.from(this.virtualPets.values()).find(p => p.userId === userId);
  }

  async createVirtualPet(pet: InsertVirtualPet): Promise<VirtualPet> {
    const id = this.nextId++;
    const newPet: VirtualPet = { 
      id, 
      ...pet,
      currentCostumeId: pet.currentCostumeId || null,
    };
    this.virtualPets.set(id, newPet);
    return newPet;
  }

  async updateVirtualPet(id: number, pet: Partial<VirtualPet>): Promise<VirtualPet | undefined> {
    const existing = this.virtualPets.get(id);
    if (!existing) return undefined;
    
    const updated: VirtualPet = { ...existing, ...pet };
    this.virtualPets.set(id, updated);
    return updated;
  }

  async getAllCostumes(): Promise<Costume[]> {
    return Array.from(this.costumes.values());
  }

  async getCostume(id: number): Promise<Costume | undefined> {
    return this.costumes.get(id);
  }

  async getCostumeByName(name: string): Promise<Costume | undefined> {
    return Array.from(this.costumes.values()).find(c => c.name === name);
  }

  async createCostume(costume: Omit<Costume, 'id'>): Promise<Costume> {
    const id = this.nextId++;
    const newCostume: Costume = {
      id,
      ...costume,
    };
    this.costumes.set(id, newCostume);
    return newCostume;
  }

  async getUserCostumes(userId: number): Promise<UserCostume[]> {
    return Array.from(this.userCostumes.values()).filter(uc => uc.userId === userId);
  }

  async purchaseCostume(userId: number, costumeId: number): Promise<UserCostume> {
    const id = this.nextId++;
    const newUserCostume: UserCostume = {
      id,
      userId,
      costumeId,
      purchasedAt: new Date().toISOString(),
    };
    this.userCostumes.set(id, newUserCostume);
    return newUserCostume;
  }

  async getUserPoints(userId: number): Promise<UserPoints> {
    const points = this.userPoints.get(userId);
    if (points) return points;
    
    const newPoints: UserPoints = { userId, totalEarned: 0, totalSpent: 0, available: 0 };
    this.userPoints.set(userId, newPoints);
    return newPoints;
  }

  async addPoints(userId: number, amount: number, type: PointTransaction['type'], relatedId: number | null, description: string): Promise<PointTransaction> {
    const id = this.nextId++;
    const transaction: PointTransaction = {
      id,
      userId,
      amount,
      type,
      relatedId,
      description,
      createdAt: new Date().toISOString(),
    };
    this.pointTransactions.set(id, transaction);

    const points = await this.getUserPoints(userId);
    points.totalEarned += amount;
    points.available += amount;
    this.userPoints.set(userId, points);

    return transaction;
  }

  async spendPoints(userId: number, amount: number, description: string): Promise<boolean> {
    const points = await this.getUserPoints(userId);
    if (points.available < amount) return false;

    const id = this.nextId++;
    const transaction: PointTransaction = {
      id,
      userId,
      amount: -amount,
      type: "costume_purchase",
      relatedId: null,
      description,
      createdAt: new Date().toISOString(),
    };
    this.pointTransactions.set(id, transaction);

    points.totalSpent += amount;
    points.available -= amount;
    this.userPoints.set(userId, points);

    return true;
  }

  async getPointTransactions(userId: number): Promise<PointTransaction[]> {
    return Array.from(this.pointTransactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTodos(userId: number): Promise<Todo[]> {
    return Array.from(this.todos.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getTodo(id: number): Promise<Todo | undefined> {
    return this.todos.get(id);
  }

  async createTodo(todo: InsertTodo): Promise<Todo> {
    const id = this.nextId++;
    const newTodo: Todo = {
      id,
      ...todo,
      completed: false,
      completedAt: null,
      createdAt: new Date(),
    };
    this.todos.set(id, newTodo);
    return newTodo;
  }

  async updateTodo(id: number, update: Partial<Todo>): Promise<Todo | undefined> {
    const todo = this.todos.get(id);
    if (!todo) return undefined;

    const updated = { ...todo, ...update };
    this.todos.set(id, updated);
    return updated;
  }

  async deleteTodo(id: number): Promise<boolean> {
    return this.todos.delete(id);
  }

  async completeTodo(id: number): Promise<Todo | undefined> {
    const todo = this.todos.get(id);
    if (!todo) return undefined;

    const updated: Todo = {
      ...todo,
      completed: true,
      completedAt: new Date(),
    };
    this.todos.set(id, updated);

    await this.addPoints(
      todo.userId,
      todo.points,
      "todo_complete",
      id,
      `Completed: ${todo.title}`
    );

    return updated;
  }
}

import { DbStorage } from "./db-storage";

// Use database storage instead of in-memory storage
export const storage = new DbStorage();
