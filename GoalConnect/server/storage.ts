import {
  type User,
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
  // D&D RPG types
  type Biome,
  type InsertBiome,
  type CreatureSpecies,
  type InsertCreatureSpecies,
  type UserCreature,
  type InsertUserCreature,
  type Item,
  type InsertItem,
  type UserInventory,
  type EquippedItem,
  type Shard,
  type DailyProgress,
  type InsertDailyProgress,
  type Encounter,
  type InsertEncounter,
  type CombatLog,
  type PlayerStats,
  type InsertPlayerStats,
  // Sprite types
  type Sprite,
  type InsertSprite,
  // Dream Scroll types
  type DreamScrollItem,
  type InsertDreamScrollItem,
} from "@shared/schema";
import { DbStorage } from "./db-storage";

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
  getAllHabitLogs(userId: number): Promise<HabitLog[]>;
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
  equipCostume(userId: number, costumeId: number): Promise<UserCostume>;
  unequipCostume(userId: number, costumeId: number): Promise<UserCostume>;
  getEquippedCostumes(userId: number): Promise<Array<UserCostume & { costume: Costume }>>;
  
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

  // D&D RPG System - Biomes
  getBiomes(): Promise<Biome[]>;
  getBiome(id: number): Promise<Biome | undefined>;
  getBiomesByLevel(playerLevel: number): Promise<Biome[]>;
  createBiome(biome: InsertBiome): Promise<Biome>;

  // D&D RPG System - Creature Species
  getCreatureSpecies(): Promise<CreatureSpecies[]>;
  getCreatureSpeciesById(id: number): Promise<CreatureSpecies | undefined>;
  getCreatureSpeciesByBiome(biomeId: number): Promise<CreatureSpecies[]>;
  getCreatureSpeciesByRarity(rarity: string): Promise<CreatureSpecies[]>;
  createCreatureSpecies(species: InsertCreatureSpecies): Promise<CreatureSpecies>;

  // D&D RPG System - User Creatures (Party/Collection)
  getUserCreatures(userId: number): Promise<UserCreature[]>;
  getUserCreature(id: number): Promise<UserCreature | undefined>;
  getParty(userId: number): Promise<UserCreature[]>;
  createUserCreature(creature: InsertUserCreature): Promise<UserCreature>;
  updateUserCreature(id: number, updates: Partial<UserCreature>): Promise<UserCreature | undefined>;
  deleteUserCreature(id: number): Promise<boolean>;
  addToParty(userId: number, creatureId: number, position: number): Promise<UserCreature | undefined>;
  removeFromParty(creatureId: number): Promise<UserCreature | undefined>;

  // D&D RPG System - Items & Inventory
  getItems(): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  getUserInventory(userId: number): Promise<Array<UserInventory & { item: Item }>>;
  addItemToInventory(userId: number, itemId: number, quantity: number): Promise<void>;
  removeItemFromInventory(userId: number, itemId: number, quantity: number): Promise<boolean>;
  getEquippedItem(creatureId: number): Promise<(EquippedItem & { item: Item }) | undefined>;
  equipItem(creatureId: number, itemId: number): Promise<EquippedItem>;
  unequipItem(creatureId: number): Promise<boolean>;

  // D&D RPG System - Shards
  getShards(userId: number): Promise<Shard[]>;
  addShards(userId: number, speciesId: number, amount: number): Promise<void>;
  spendShards(userId: number, speciesId: number, amount: number): Promise<boolean>;

  // D&D RPG System - Daily Progress
  getDailyProgress(userId: number, date: string): Promise<DailyProgress | undefined>;
  updateDailyProgress(userId: number, date: string, updates: Partial<DailyProgress>): Promise<DailyProgress>;
  incrementHabitPoints(userId: number, date: string, points: number): Promise<DailyProgress>;
  useRun(userId: number, date: string): Promise<boolean>;

  // D&D RPG System - Encounters
  getEncounters(userId: number): Promise<Encounter[]>;
  getEncounter(id: number): Promise<Encounter | undefined>;
  createEncounter(encounter: InsertEncounter): Promise<Encounter>;
  updateEncounter(id: number, updates: Partial<Encounter>): Promise<Encounter | undefined>;

  // D&D RPG System - Combat Logs
  getCombatLog(encounterId: number): Promise<CombatLog | undefined>;
  createCombatLog(log: Omit<CombatLog, "id" | "createdAt">): Promise<CombatLog>;

  // D&D RPG System - Player Stats
  getPlayerStats(userId: number): Promise<PlayerStats | undefined>;
  createPlayerStats(userId: number): Promise<PlayerStats>;
  updatePlayerStats(userId: number, updates: Partial<PlayerStats>): Promise<PlayerStats>;
  addExperience(userId: number, xp: number): Promise<{ stats: PlayerStats; leveledUp: boolean }>;

  // Sprite Management
  createSprite(sprite: InsertSprite): Promise<Sprite>;
  upsertSprite(sprite: InsertSprite): Promise<Sprite>;
  getSprites(): Promise<Sprite[]>;
  getSpriteByFilename(filename: string): Promise<Sprite | undefined>;
  updateSprite(filename: string, updates: { category?: string; name?: string | null }): Promise<Sprite | undefined>;
  deleteSprite(filename: string): Promise<void>;

  // Dream Scroll Management
  createDreamScrollItem(item: InsertDreamScrollItem): Promise<DreamScrollItem>;
  getDreamScrollItems(userId: number): Promise<DreamScrollItem[]>;
  getDreamScrollItemsByCategory(userId: number, category: string): Promise<DreamScrollItem[]>;
  updateDreamScrollItem(id: number, updates: Partial<InsertDreamScrollItem>): Promise<DreamScrollItem | undefined>;
  deleteDreamScrollItem(id: number): Promise<void>;
  toggleDreamScrollItemComplete(id: number): Promise<DreamScrollItem | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
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
    // Create User (ID: 1)
    const configuredName = process.env.APP_USER_NAME?.trim() || process.env.APP_USERNAME?.trim();
    const userName = configuredName && configuredName.length > 0 ? configuredName : "Lauren";
    const userEmail =
      process.env.APP_USER_EMAIL?.trim() || `${userName.toLowerCase().replace(/\s+/g, "") || "user"}@goalconnect.local`;

    const user: User = {
      id: 1,
      name: userName,
      email: userEmail,
      createdAt: new Date(),
    };
    this.users.set(1, user);
    this.nextId = 2; // Start other IDs from 2

    // November 2025 Weekly Habits
    const habits = [
      { userId: 1, title: "Pimsleur (4 lessons/week)", description: "Complete 4 Pimsleur lessons this week (~1 full lesson + short sessions)", icon: "Languages", color: "#8B5CF6", cadence: "weekly" as const, targetPerWeek: 4 },
      { userId: 1, title: "Duolingo (5 sessions/week)", description: "Complete 5 Duolingo sessions of at least 10 minutes each", icon: "GraduationCap", color: "#10B981", cadence: "weekly" as const, targetPerWeek: 5 },
      { userId: 1, title: "Gym (4 sessions/week)", description: "Mon/Tue + pre-shift Wed-Fri workouts", icon: "Dumbbell", color: "#EF4444", cadence: "weekly" as const, targetPerWeek: 4 },
      { userId: 1, title: "Piano (3 sessions/week)", description: "20-30 minute practice sessions", icon: "Music", color: "#8B5CF6", cadence: "weekly" as const, targetPerWeek: 3 },
      { userId: 1, title: "Daylight (3 times/week)", description: "≥10 min outside, minimum 2 if busy week", icon: "Sun", color: "#F59E0B", cadence: "weekly" as const, targetPerWeek: 3 },
      { userId: 1, title: "RemNote Study (1 chapter/week)", description: "Wk 1 = Ch 6 • Wk 2 = Ch 7 + 2-3 papers per week", icon: "BookOpen", color: "#3B82F6", cadence: "weekly" as const, targetPerWeek: 1 },
      { userId: 1, title: "Create Flashcards (2-3 papers/week)", description: "Convert 2-3 papers to flashcards weekly (finish 10 by Nov 30)", icon: "FileText", color: "#06B6D4", cadence: "weekly" as const, targetPerWeek: 3 },
      { userId: 1, title: "MRI Video (Wks 2 & 3 only)", description: "Watch 1 MRI education video (Nov 10-23)", icon: "Video", color: "#EC4899", cadence: "weekly" as const, targetPerWeek: 1 },
      { userId: 1, title: "Outdoor Climbing (1 session/week)", description: "One outdoor climbing session (Week 2 overnight optional)", icon: "Mountain", color: "#059669", cadence: "weekly" as const, targetPerWeek: 1 },
      { userId: 1, title: "Run (1 time/week)", description: "One run per week on flexible day", icon: "Activity", color: "#F97316", cadence: "weekly" as const, targetPerWeek: 1 },
    ];

    habits.forEach(h => this.createHabit(h));

    // November 2025 Monthly Goals
    const goals = [
      { userId: 1, title: "Pimsleur: Complete 16 Lessons", description: "Finish Level 1 (27-30) + reach Level 2 Lesson 12", targetValue: 16, currentValue: 0, unit: "lessons", deadline: "2025-11-30", category: "Learning", difficulty: "medium" as const, priority: "high" as const },
      { userId: 1, title: "Duolingo: Finish Current Unit", description: "Complete approximately ¼ progress per week", targetValue: 1, currentValue: 0, unit: "unit", deadline: "2025-11-30", category: "Learning", difficulty: "easy" as const, priority: "medium" as const },
      { userId: 1, title: "RemNote: Complete Chapters 6 & 7", description: "Finish Chapters 6 and 7 (de Lahunta)", targetValue: 2, currentValue: 0, unit: "chapters", deadline: "2025-11-30", category: "Learning", difficulty: "hard" as const, priority: "high" as const },
      { userId: 1, title: "Convert 10 Papers to Flashcards", description: "Transform 10 academic papers into flashcards", targetValue: 10, currentValue: 0, unit: "papers", deadline: "2025-11-30", category: "Learning", difficulty: "medium" as const, priority: "medium" as const },
      { userId: 1, title: "Watch 2 MRI Education Videos", description: "Complete MRI education videos for Weeks 2 and 3", targetValue: 2, currentValue: 0, unit: "videos", deadline: "2025-11-30", category: "Learning", difficulty: "easy" as const, priority: "low" as const },
      { userId: 1, title: "Complete 1 Audiobook", description: "Finish one full audiobook this month", targetValue: 1, currentValue: 0, unit: "book", deadline: "2025-11-30", category: "Creative", difficulty: "easy" as const, priority: "low" as const },
      { userId: 1, title: "Play Piano 12 Times", description: "Practice piano at least 12 times (~3x per week)", targetValue: 12, currentValue: 0, unit: "sessions", deadline: "2025-11-30", category: "Creative", difficulty: "medium" as const, priority: "medium" as const },
      { userId: 1, title: "Complete 16 Gym Sessions", description: "Go to gym 16 times (~4x per week)", targetValue: 16, currentValue: 0, unit: "sessions", deadline: "2025-11-30", category: "Fitness", difficulty: "hard" as const, priority: "high" as const },
      { userId: 1, title: "4 Outdoor Climbing Sessions", description: "4 outdoor climbing sessions including 1 overnight trip", targetValue: 4, currentValue: 0, unit: "sessions", deadline: "2025-11-30", category: "Fitness", difficulty: "medium" as const, priority: "medium" as const },
      { userId: 1, title: "Complete 4 Runs", description: "Run once per week (4 total for the month)", targetValue: 4, currentValue: 0, unit: "runs", deadline: "2025-11-30", category: "Fitness", difficulty: "medium" as const, priority: "medium" as const },
      { userId: 1, title: "8+ Daylight Exposures", description: "≥10 min outside on 3 days each week (minimum 8 total)", targetValue: 8, currentValue: 0, unit: "sessions", deadline: "2025-11-30", category: "Outdoors", difficulty: "easy" as const, priority: "medium" as const },
      { userId: 1, title: "Ship 1 App Feature", description: "Deploy one concrete feature by Nov 30", targetValue: 1, currentValue: 0, unit: "feature", deadline: "2025-11-30", category: "Projects", difficulty: "hard" as const, priority: "high" as const },
      { userId: 1, title: "Play Video Game Once", description: "Enjoy one video game session this month", targetValue: 1, currentValue: 0, unit: "session", deadline: "2025-11-30", category: "Personal", difficulty: "easy" as const, priority: "low" as const },
      { userId: 1, title: "Hang Out with Coworker", description: "Spend social time with a coworker", targetValue: 1, currentValue: 0, unit: "meetup", deadline: "2025-11-30", category: "Personal", difficulty: "easy" as const, priority: "low" as const },
      { userId: 1, title: "Try 1 New Thing", description: "Experience something new and novel", targetValue: 1, currentValue: 0, unit: "experience", deadline: "2025-11-30", category: "Personal", difficulty: "medium" as const, priority: "low" as const },
    ];

    goals.forEach(g => this.createGoal(g));

    this.updateUserSettings({ userId: 1, darkMode: true, notifications: true });

    // Seed costumes
    const costumeData: Omit<Costume, 'id'>[] = [
      { name: "Party Hat", description: "A festive party hat", category: "hat", price: 50, imageUrl: "🎉", rarity: "common", evolutionRequired: "seed" },
      { name: "Crown", description: "Royal crown fit for a king", category: "hat", price: 200, imageUrl: "👑", rarity: "rare", evolutionRequired: "sprout" },
      { name: "Wizard Hat", description: "Magical wizard hat", category: "hat", price: 150, imageUrl: "🧙", rarity: "rare", evolutionRequired: "sprout" },
      { name: "Superhero Cape", description: "Feel like a superhero", category: "outfit", price: 100, imageUrl: "🦸", rarity: "common", evolutionRequired: "seed" },
      { name: "Ninja Outfit", description: "Stealth mode activated", category: "outfit", price: 250, imageUrl: "🥷", rarity: "epic", evolutionRequired: "sapling" },
      { name: "Sunglasses", description: "Cool shades", category: "accessory", price: 75, imageUrl: "😎", rarity: "common", evolutionRequired: "seed" },
      { name: "Gold Medal", description: "Achievement unlocked", category: "accessory", price: 300, imageUrl: "🏅", rarity: "epic", evolutionRequired: "sapling" },
      { name: "Space Background", description: "Explore the cosmos", category: "background", price: 400, imageUrl: "🌌", rarity: "legendary", evolutionRequired: "ancient" },
      { name: "Forest Background", description: "Nature vibes", category: "background", price: 150, imageUrl: "🌲", rarity: "rare", evolutionRequired: "sprout" },
      { name: "Rainbow Background", description: "Bright and cheerful", category: "background", price: 100, imageUrl: "🌈", rarity: "common", evolutionRequired: "seed" },
    ];

    costumeData.forEach(c => {
      const id = this.nextId++;
      this.costumes.set(id, { id, ...c });
    });

    // Create virtual pet for user 1
    this.createVirtualPet({
      userId: 1,
      name: "Forest Friend",
      species: "Gremlin",
      happiness: 85,
      health: 90,
      level: 1,
      experience: 0,
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
    const newHabit: Habit = {
      id,
      userId: habit.userId,
      title: habit.title,
      description: habit.description ?? "",
      icon: habit.icon,
      color: habit.color,
      cadence: habit.cadence as Habit['cadence'],
      targetPerWeek: habit.targetPerWeek ?? null,
    };
    this.habits.set(id, newHabit);
    return newHabit;
  }

  async updateHabit(id: number, habit: Partial<InsertHabit>): Promise<Habit | undefined> {
    const existing = this.habits.get(id);
    if (!existing) return undefined;

    const updated: Habit = {
      ...existing,
      ...habit,
      description: habit.description ?? existing.description,
      cadence: (habit.cadence ?? existing.cadence) as Habit['cadence'],
      targetPerWeek: habit.targetPerWeek !== undefined ? habit.targetPerWeek : existing.targetPerWeek,
    };
    this.habits.set(id, updated);
    return updated;
  }

  async deleteHabit(id: number): Promise<boolean> {
    return this.habits.delete(id);
  }

  async getHabitLogs(habitId: number): Promise<HabitLog[]> {
    return Array.from(this.habitLogs.values()).filter(log => log.habitId === habitId);
  }

  async getAllHabitLogs(userId: number): Promise<HabitLog[]> {
    return Array.from(this.habitLogs.values()).filter(log => log.userId === userId);
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
    const newLog: HabitLog = {
      id,
      habitId: log.habitId,
      userId: log.userId,
      date: log.date,
      completed: log.completed ?? false,
      note: log.note ?? null,
    };
    this.habitLogs.set(id, newLog);
    return newLog;
  }

  async updateHabitLog(id: number, log: Partial<InsertHabitLog>): Promise<HabitLog | undefined> {
    const existing = this.habitLogs.get(id);
    if (!existing) return undefined;

    const updated: HabitLog = {
      ...existing,
      ...log,
      completed: log.completed ?? existing.completed,
      note: log.note ?? existing.note,
    };
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
    const newGoal: Goal = {
      id,
      userId: goal.userId,
      title: goal.title,
      description: goal.description ?? "",
      targetValue: goal.targetValue,
      currentValue: goal.currentValue ?? 0,
      unit: goal.unit,
      deadline: goal.deadline,
      category: goal.category,
      difficulty: goal.difficulty ?? "medium",
      priority: goal.priority ?? "medium",
    };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const existing = this.goals.get(id);
    if (!existing) return undefined;

    const updated: Goal = {
      ...existing,
      ...goal,
      description: goal.description ?? existing.description,
      currentValue: goal.currentValue ?? existing.currentValue,
    };
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
    const newUpdate: GoalUpdate = {
      id,
      goalId: update.goalId,
      userId: update.userId,
      date: update.date,
      value: update.value,
      note: update.note ?? null,
    };
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
    const stored: UserSettings = {
      userId: settings.userId,
      darkMode: settings.darkMode ?? true,
      notifications: settings.notifications ?? true,
    };
    this.userSettings.set(settings.userId, stored);
    return stored;
  }

  async getVirtualPet(userId: number): Promise<VirtualPet | undefined> {
    return Array.from(this.virtualPets.values()).find(p => p.userId === userId);
  }

  async createVirtualPet(pet: InsertVirtualPet): Promise<VirtualPet> {
    const id = this.nextId++;
    const newPet: VirtualPet = {
      id,
      userId: pet.userId,
      name: pet.name ?? "Forest Friend",
      species: (pet.species ?? "Gremlin") as VirtualPet['species'],
      happiness: pet.happiness ?? 50,
      health: pet.health ?? 100,
      level: pet.level ?? 1,
      experience: pet.experience ?? 0,
      evolution: (pet.evolution ?? "seed") as VirtualPet['evolution'],
      currentCostumeId: pet.currentCostumeId ?? null,
      createdAt: pet.createdAt ?? new Date(),
      lastFed: pet.lastFed ?? null,
    };
    this.virtualPets.set(id, newPet);
    return newPet;
  }

  async updateVirtualPet(id: number, pet: Partial<VirtualPet>): Promise<VirtualPet | undefined> {
    const existing = this.virtualPets.get(id);
    if (!existing) return undefined;

    const updated: VirtualPet = {
      ...existing,
      ...pet,
      currentCostumeId: pet.currentCostumeId ?? existing.currentCostumeId,
      lastFed: pet.lastFed ?? existing.lastFed,
    };
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
      purchasedAt: new Date(),
      isEquipped: false,
    };
    this.userCostumes.set(id, newUserCostume);
    return newUserCostume;
  }

  async equipCostume(userId: number, costumeId: number): Promise<UserCostume> {
    const userCostume = Array.from(this.userCostumes.values()).find(
      uc => uc.userId === userId && uc.costumeId === costumeId
    );
    if (!userCostume) throw new Error("Costume not owned");
    const updated: UserCostume = { ...userCostume, isEquipped: true };
    this.userCostumes.set(userCostume.id, updated);
    return updated;
  }

  async unequipCostume(userId: number, costumeId: number): Promise<UserCostume> {
    const userCostume = Array.from(this.userCostumes.values()).find(
      uc => uc.userId === userId && uc.costumeId === costumeId
    );
    if (!userCostume) throw new Error("Costume not owned");
    const updated: UserCostume = { ...userCostume, isEquipped: false };
    this.userCostumes.set(userCostume.id, updated);
    return updated;
  }

  async getEquippedCostumes(userId: number): Promise<Array<UserCostume & { costume: Costume }>> {
    const userCostumes = await this.getUserCostumes(userId);
    return userCostumes.filter(uc => uc.isEquipped).map(uc => {
      const costume = this.costumes.get(uc.costumeId);
      return { ...uc, costume: costume! };
    }).filter(uc => uc.costume);
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
      createdAt: new Date(),
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
      createdAt: new Date(),
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
      userId: todo.userId,
      title: todo.title,
      dueDate: todo.dueDate ?? null,
      difficulty: todo.difficulty ?? "medium",
      subtasks: todo.subtasks ?? "[]",
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

    const updated: Todo = {
      ...todo,
      ...update,
      dueDate: update.dueDate ?? todo.dueDate,
      difficulty: update.difficulty ?? todo.difficulty,
      subtasks: update.subtasks ?? todo.subtasks,
      completedAt: update.completedAt ?? todo.completedAt,
    };
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

    // Calculate points from difficulty
    const points = todo.difficulty === "easy" ? 5 : todo.difficulty === "hard" ? 15 : 10;

    await this.addPoints(
      todo.userId,
      points,
      "todo_complete",
      id,
      `Completed: ${todo.title}`
    );

    return updated;
  }
}

// Simple storage selection: Use database if available, otherwise in-memory
// The pg Pool handles reconnections automatically - no need to test connection upfront
const storageImplementation: IStorage = process.env.DATABASE_URL
  ? (() => {
      console.log('[storage] Using DbStorage (PostgreSQL)');
      return new DbStorage();
    })()
  : (() => {
      console.log('[storage] Using MemStorage (in-memory)');
      return new MemStorage();
    })();

export const storage = storageImplementation;
