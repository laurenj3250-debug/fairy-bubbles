import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
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
  // D&D RPG types
  Biome,
  InsertBiome,
  CreatureSpecies,
  InsertCreatureSpecies,
  UserCreature,
  InsertUserCreature,
  Item,
  InsertItem,
  UserInventory,
  EquippedItem,
  Shard,
  DailyProgress,
  Encounter,
  InsertEncounter,
  CombatLog,
  PlayerStats,
  Sprite,
  InsertSprite,
  // Dream Scroll types
  DreamScrollTag,
  DreamScrollItem,
  InsertDreamScrollItem,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  private readonly db = getDb();

  // Habits
  async getHabits(userId: number): Promise<Habit[]> {
    return await this.db.select().from(schema.habits).where(eq(schema.habits.userId, userId));
  }

  async getHabit(id: number): Promise<Habit | undefined> {
    const [habit] = await this.db.select().from(schema.habits).where(eq(schema.habits.id, id));
    return habit;
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await this.db.insert(schema.habits).values(habit as any).returning();
    return newHabit;
  }

  async updateHabit(id: number, habit: Partial<InsertHabit>): Promise<Habit | undefined> {
    const [updated] = await this.db
      .update(schema.habits)
      .set(habit as any)
      .where(eq(schema.habits.id, id))
      .returning();
    return updated;
  }

  async deleteHabit(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.habits).where(eq(schema.habits.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Habit Logs
  async getHabitLogs(habitId: number): Promise<HabitLog[]> {
    return await this.db.select().from(schema.habitLogs).where(eq(schema.habitLogs.habitId, habitId));
  }

  async getAllHabitLogs(userId: number): Promise<HabitLog[]> {
    return await this.db.select().from(schema.habitLogs).where(eq(schema.habitLogs.userId, userId));
  }

  async getHabitLogsByDate(userId: number, date: string): Promise<HabitLog[]> {
    return await this.db
      .select()
      .from(schema.habitLogs)
      .where(and(eq(schema.habitLogs.userId, userId), eq(schema.habitLogs.date, date)));
  }

  async getHabitLog(id: number): Promise<HabitLog | undefined> {
    const [log] = await this.db.select().from(schema.habitLogs).where(eq(schema.habitLogs.id, id));
    return log;
  }

  async createHabitLog(log: InsertHabitLog): Promise<HabitLog> {
    const [newLog] = await this.db.insert(schema.habitLogs).values(log).returning();
    return newLog;
  }

  async updateHabitLog(id: number, log: Partial<InsertHabitLog>): Promise<HabitLog | undefined> {
    const [updated] = await this.db
      .update(schema.habitLogs)
      .set(log)
      .where(eq(schema.habitLogs.id, id))
      .returning();
    return updated;
  }

  async deleteHabitLog(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.habitLogs).where(eq(schema.habitLogs.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Goals
  async getGoals(userId: number): Promise<Goal[]> {
    return await this.db.select().from(schema.goals).where(eq(schema.goals.userId, userId));
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await this.db.select().from(schema.goals).where(eq(schema.goals.id, id));
    return goal;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await this.db.insert(schema.goals).values(goal).returning();
    return newGoal;
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const [updated] = await this.db
      .update(schema.goals)
      .set(goal)
      .where(eq(schema.goals.id, id))
      .returning();
    return updated;
  }

  async deleteGoal(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.goals).where(eq(schema.goals.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Goal Updates
  async getGoalUpdates(goalId: number): Promise<GoalUpdate[]> {
    return await this.db.select().from(schema.goalUpdates).where(eq(schema.goalUpdates.goalId, goalId));
  }

  async getGoalUpdate(id: number): Promise<GoalUpdate | undefined> {
    const [update] = await this.db.select().from(schema.goalUpdates).where(eq(schema.goalUpdates.id, id));
    return update;
  }

  async createGoalUpdate(update: InsertGoalUpdate): Promise<import("./storage").GoalUpdateResult> {
    const { sql } = await import("drizzle-orm");
    
    // Create the goal update
    const [newUpdate] = await this.db.insert(schema.goalUpdates).values(update).returning();
    
    // Atomically increment goal progress and calculate previous value from new value
    // This avoids race conditions by deriving previous from the atomically updated current
    const result = await this.db.execute<Goal & { previous_value: number }>(sql`
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
    const result = await this.db.delete(schema.goalUpdates).where(eq(schema.goalUpdates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // User Settings
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await this.db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId));
    return settings;
  }

  async updateUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [updated] = await this.db
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
    const [pet] = await this.db.select().from(schema.virtualPets).where(eq(schema.virtualPets.userId, userId));
    return pet;
  }

  async createVirtualPet(pet: InsertVirtualPet): Promise<VirtualPet> {
    const [newPet] = await this.db.insert(schema.virtualPets).values(pet as any).returning();
    return newPet;
  }

  async updateVirtualPet(id: number, pet: Partial<VirtualPet>): Promise<VirtualPet | undefined> {
    const [updated] = await this.db
      .update(schema.virtualPets)
      .set(pet)
      .where(eq(schema.virtualPets.id, id))
      .returning();
    return updated;
  }

  // Costumes
  async getAllCostumes(): Promise<Costume[]> {
    return await this.db.select().from(schema.costumes);
  }

  async getCostume(id: number): Promise<Costume | undefined> {
    const [costume] = await this.db.select().from(schema.costumes).where(eq(schema.costumes.id, id));
    return costume;
  }

  async getCostumeByName(name: string): Promise<Costume | undefined> {
    const [costume] = await this.db.select().from(schema.costumes).where(eq(schema.costumes.name, name));
    return costume;
  }

  async createCostume(costume: Omit<Costume, 'id'>): Promise<Costume> {
    const [newCostume] = await this.db.insert(schema.costumes).values(costume as any).returning();
    return newCostume;
  }

  // User Costumes
  async getUserCostumes(userId: number): Promise<UserCostume[]> {
    return await this.db.select().from(schema.userCostumes).where(eq(schema.userCostumes.userId, userId));
  }

  async purchaseCostume(userId: number, costumeId: number): Promise<UserCostume> {
    const [newUserCostume] = await this.db
      .insert(schema.userCostumes)
      .values({
        userId,
        costumeId,
      })
      .returning();
    return newUserCostume;
  }

  async equipCostume(userId: number, costumeId: number): Promise<UserCostume> {
    const costume = await this.getCostume(costumeId);
    if (!costume) {
      throw new Error("Costume not found");
    }

    const costumeCategory = costume.category;
    
    const sameCategoryCostumes = await this.db
      .select()
      .from(schema.userCostumes)
      .innerJoin(schema.costumes, eq(schema.userCostumes.costumeId, schema.costumes.id))
      .where(
        and(
          eq(schema.userCostumes.userId, userId),
          eq(schema.costumes.category, costumeCategory),
          eq(schema.userCostumes.isEquipped, true)
        )
      );

    for (const uc of sameCategoryCostumes) {
      await this.db
        .update(schema.userCostumes)
        .set({ isEquipped: false })
        .where(eq(schema.userCostumes.id, uc.user_costumes.id));
    }

    const [equipped] = await this.db
      .update(schema.userCostumes)
      .set({ isEquipped: true })
      .where(
        and(
          eq(schema.userCostumes.userId, userId),
          eq(schema.userCostumes.costumeId, costumeId)
        )
      )
      .returning();

    return equipped;
  }

  async unequipCostume(userId: number, costumeId: number): Promise<UserCostume> {
    const [unequipped] = await this.db
      .update(schema.userCostumes)
      .set({ isEquipped: false })
      .where(
        and(
          eq(schema.userCostumes.userId, userId),
          eq(schema.userCostumes.costumeId, costumeId)
        )
      )
      .returning();

    return unequipped;
  }

  async getEquippedCostumes(userId: number): Promise<Array<UserCostume & { costume: Costume }>> {
    const result = await this.db
      .select()
      .from(schema.userCostumes)
      .innerJoin(schema.costumes, eq(schema.userCostumes.costumeId, schema.costumes.id))
      .where(
        and(
          eq(schema.userCostumes.userId, userId),
          eq(schema.userCostumes.isEquipped, true)
        )
      );

    return result.map((row) => ({
      ...row.user_costumes,
      costume: row.costumes,
    }));
  }

  // Points
  async getUserPoints(userId: number): Promise<UserPoints> {
    const [points] = await this.db.select().from(schema.userPoints).where(eq(schema.userPoints.userId, userId));
    
    if (!points) {
      // Initialize points if they don't exist
      const [newPoints] = await this.db
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
    const [transaction] = await this.db
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
    await this.db
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
    await this.db.insert(schema.pointTransactions).values({
      userId,
      amount: -amount,
      type: "costume_purchase",
      relatedId: null,
      description,
    });

    // Update user points with verified calculations
    await this.db
      .update(schema.userPoints)
      .set({
        totalSpent: currentPoints.totalSpent + amount,
        available: newAvailable,
      })
      .where(eq(schema.userPoints.userId, userId));

    return true;
  }

  async getPointTransactions(userId: number): Promise<PointTransaction[]> {
    return await this.db
      .select()
      .from(schema.pointTransactions)
      .where(eq(schema.pointTransactions.userId, userId))
      .orderBy(desc(schema.pointTransactions.createdAt));
  }

  async getTodos(userId: number): Promise<Todo[]> {
    return await this.db
      .select()
      .from(schema.todos)
      .where(eq(schema.todos.userId, userId))
      .orderBy(schema.todos.completed, schema.todos.dueDate, desc(schema.todos.createdAt));
  }

  async getTodo(id: number): Promise<Todo | undefined> {
    const results = await this.db.select().from(schema.todos).where(eq(schema.todos.id, id)).limit(1);
    return results[0];
  }

  async createTodo(todo: InsertTodo): Promise<Todo> {
    const results = await this.db.insert(schema.todos).values(todo).returning();
    return results[0];
  }

  async updateTodo(id: number, update: Partial<Todo>): Promise<Todo | undefined> {
    const results = await this.db
      .update(schema.todos)
      .set(update)
      .where(eq(schema.todos.id, id))
      .returning();
    return results[0];
  }

  async deleteTodo(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.todos).where(eq(schema.todos.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async completeTodo(id: number): Promise<Todo | undefined> {
    const todo = await this.getTodo(id);
    if (!todo || todo.completed) return todo;

    const results = await this.db
      .update(schema.todos)
      .set({
        completed: true,
        completedAt: new Date(),
      })
      .where(eq(schema.todos.id, id))
      .returning();

    if (results[0]) {
      // Calculate points from difficulty
      const points = todo.difficulty === "easy" ? 5 : todo.difficulty === "hard" ? 15 : 10;

      await this.addPoints(
        todo.userId,
        points,
        "todo_complete",
        id,
        `Completed: ${todo.title}`
      );
    }

    return results[0];
  }

  // ========== D&D RPG SYSTEM ==========

  // Biomes
  async getBiomes(): Promise<Biome[]> {
    return await this.db.select().from(schema.biomes);
  }

  async getBiome(id: number): Promise<Biome | undefined> {
    const [biome] = await this.db.select().from(schema.biomes).where(eq(schema.biomes.id, id));
    return biome;
  }

  async getBiomesByLevel(playerLevel: number): Promise<Biome[]> {
    return await this.db.select().from(schema.biomes).where(eq(schema.biomes.unlockPlayerLevel, playerLevel));
  }

  async createBiome(biome: InsertBiome): Promise<Biome> {
    const [created] = await this.db.insert(schema.biomes).values(biome).returning();
    return created;
  }

  // Creature Species
  async getCreatureSpecies(): Promise<CreatureSpecies[]> {
    return await this.db.select().from(schema.creatureSpecies);
  }

  async getCreatureSpeciesById(id: number): Promise<CreatureSpecies | undefined> {
    const [species] = await this.db.select().from(schema.creatureSpecies).where(eq(schema.creatureSpecies.id, id));
    return species;
  }

  async getCreatureSpeciesByBiome(biomeId: number): Promise<CreatureSpecies[]> {
    return await this.db.select().from(schema.creatureSpecies).where(eq(schema.creatureSpecies.biomeId, biomeId));
  }

  async getCreatureSpeciesByRarity(rarity: string): Promise<CreatureSpecies[]> {
    return await this.db.select().from(schema.creatureSpecies).where(eq(schema.creatureSpecies.rarity, rarity as any));
  }

  async createCreatureSpecies(species: InsertCreatureSpecies): Promise<CreatureSpecies> {
    const [created] = await this.db.insert(schema.creatureSpecies).values(species).returning();
    return created;
  }

  // User Creatures (Party/Collection)
  async getUserCreatures(userId: number): Promise<UserCreature[]> {
    return await this.db.select().from(schema.userCreatures).where(eq(schema.userCreatures.userId, userId));
  }

  async getUserCreature(id: number): Promise<UserCreature | undefined> {
    const [creature] = await this.db.select().from(schema.userCreatures).where(eq(schema.userCreatures.id, id));
    return creature;
  }

  async getParty(userId: number): Promise<UserCreature[]> {
    return await this.db
      .select()
      .from(schema.userCreatures)
      .where(and(eq(schema.userCreatures.userId, userId), eq(schema.userCreatures.inParty, true)))
      .orderBy(schema.userCreatures.partyPosition);
  }

  async createUserCreature(creature: InsertUserCreature): Promise<UserCreature> {
    const [created] = await this.db.insert(schema.userCreatures).values(creature).returning();
    return created;
  }

  async updateUserCreature(id: number, updates: Partial<UserCreature>): Promise<UserCreature | undefined> {
    const [updated] = await this.db
      .update(schema.userCreatures)
      .set(updates)
      .where(eq(schema.userCreatures.id, id))
      .returning();
    return updated;
  }

  async deleteUserCreature(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.userCreatures).where(eq(schema.userCreatures.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async addToParty(userId: number, creatureId: number, position: number): Promise<UserCreature | undefined> {
    const [updated] = await this.db
      .update(schema.userCreatures)
      .set({ inParty: true, partyPosition: position })
      .where(and(eq(schema.userCreatures.id, creatureId), eq(schema.userCreatures.userId, userId)))
      .returning();
    return updated;
  }

  async removeFromParty(creatureId: number): Promise<UserCreature | undefined> {
    const [updated] = await this.db
      .update(schema.userCreatures)
      .set({ inParty: false, partyPosition: null })
      .where(eq(schema.userCreatures.id, creatureId))
      .returning();
    return updated;
  }

  // Items & Inventory
  async getItems(): Promise<Item[]> {
    return await this.db.select().from(schema.items);
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await this.db.select().from(schema.items).where(eq(schema.items.id, id));
    return item;
  }

  async createItem(item: InsertItem): Promise<Item> {
    const [created] = await this.db.insert(schema.items).values(item).returning();
    return created;
  }

  async getUserInventory(userId: number): Promise<Array<UserInventory & { item: Item }>> {
    const inventory = await this.db
      .select()
      .from(schema.userInventory)
      .leftJoin(schema.items, eq(schema.userInventory.itemId, schema.items.id))
      .where(eq(schema.userInventory.userId, userId));

    return inventory.map(row => ({
      ...row.user_inventory,
      item: row.items!
    }));
  }

  async addItemToInventory(userId: number, itemId: number, quantity: number): Promise<void> {
    // Check if item exists in inventory
    const existing = await this.db
      .select()
      .from(schema.userInventory)
      .where(and(eq(schema.userInventory.userId, userId), eq(schema.userInventory.itemId, itemId)));

    if (existing.length > 0) {
      // Update quantity
      await this.db
        .update(schema.userInventory)
        .set({ quantity: existing[0].quantity + quantity })
        .where(and(eq(schema.userInventory.userId, userId), eq(schema.userInventory.itemId, itemId)));
    } else {
      // Insert new
      await this.db.insert(schema.userInventory).values({ userId, itemId, quantity });
    }
  }

  async removeItemFromInventory(userId: number, itemId: number, quantity: number): Promise<boolean> {
    const existing = await this.db
      .select()
      .from(schema.userInventory)
      .where(and(eq(schema.userInventory.userId, userId), eq(schema.userInventory.itemId, itemId)));

    if (existing.length === 0 || existing[0].quantity < quantity) {
      return false;
    }

    const newQuantity = existing[0].quantity - quantity;
    if (newQuantity === 0) {
      await this.db
        .delete(schema.userInventory)
        .where(and(eq(schema.userInventory.userId, userId), eq(schema.userInventory.itemId, itemId)));
    } else {
      await this.db
        .update(schema.userInventory)
        .set({ quantity: newQuantity })
        .where(and(eq(schema.userInventory.userId, userId), eq(schema.userInventory.itemId, itemId)));
    }

    return true;
  }

  async getEquippedItem(creatureId: number): Promise<(EquippedItem & { item: Item }) | undefined> {
    const equipped = await this.db
      .select()
      .from(schema.equippedItems)
      .leftJoin(schema.items, eq(schema.equippedItems.itemId, schema.items.id))
      .where(eq(schema.equippedItems.userCreatureId, creatureId));

    if (equipped.length === 0) return undefined;

    return {
      ...equipped[0].equipped_items,
      item: equipped[0].items!
    };
  }

  async equipItem(creatureId: number, itemId: number): Promise<EquippedItem> {
    // Unequip existing item first
    await this.db.delete(schema.equippedItems).where(eq(schema.equippedItems.userCreatureId, creatureId));

    // Equip new item
    const [equipped] = await this.db
      .insert(schema.equippedItems)
      .values({ userCreatureId: creatureId, itemId })
      .returning();
    return equipped;
  }

  async unequipItem(creatureId: number): Promise<boolean> {
    const result = await this.db.delete(schema.equippedItems).where(eq(schema.equippedItems.userCreatureId, creatureId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Shards
  async getShards(userId: number): Promise<Shard[]> {
    return await this.db.select().from(schema.shards).where(eq(schema.shards.userId, userId));
  }

  async addShards(userId: number, speciesId: number, amount: number): Promise<void> {
    const existing = await this.db
      .select()
      .from(schema.shards)
      .where(and(eq(schema.shards.userId, userId), eq(schema.shards.speciesId, speciesId)));

    if (existing.length > 0) {
      await this.db
        .update(schema.shards)
        .set({ amount: existing[0].amount + amount })
        .where(and(eq(schema.shards.userId, userId), eq(schema.shards.speciesId, speciesId)));
    } else {
      await this.db.insert(schema.shards).values({ userId, speciesId, amount });
    }
  }

  async spendShards(userId: number, speciesId: number, amount: number): Promise<boolean> {
    const existing = await this.db
      .select()
      .from(schema.shards)
      .where(and(eq(schema.shards.userId, userId), eq(schema.shards.speciesId, speciesId)));

    if (existing.length === 0 || existing[0].amount < amount) {
      return false;
    }

    await this.db
      .update(schema.shards)
      .set({ amount: existing[0].amount - amount })
      .where(and(eq(schema.shards.userId, userId), eq(schema.shards.speciesId, speciesId)));

    return true;
  }

  // Daily Progress
  async getDailyProgress(userId: number, date: string): Promise<DailyProgress | undefined> {
    const [progress] = await this.db
      .select()
      .from(schema.dailyProgress)
      .where(and(eq(schema.dailyProgress.userId, userId), eq(schema.dailyProgress.date, date)));
    return progress;
  }

  async updateDailyProgress(userId: number, date: string, updates: Partial<DailyProgress>): Promise<DailyProgress> {
    const existing = await this.getDailyProgress(userId, date);

    if (existing) {
      const [updated] = await this.db
        .update(schema.dailyProgress)
        .set(updates)
        .where(and(eq(schema.dailyProgress.userId, userId), eq(schema.dailyProgress.date, date)))
        .returning();
      return updated;
    } else {
      const [created] = await this.db
        .insert(schema.dailyProgress)
        .values({ userId, date, ...updates })
        .returning();
      return created;
    }
  }

  async incrementHabitPoints(userId: number, date: string, points: number): Promise<DailyProgress> {
    const existing = await this.getDailyProgress(userId, date);
    const currentPoints = existing?.habitPointsEarned || 0;
    const newPoints = currentPoints + points;

    // Calculate threshold flags (TESTING VALUES - normally 6/9/12)
    const threshold1 = newPoints >= 1;
    const threshold2 = newPoints >= 2;
    const threshold3 = newPoints >= 3;

    // Calculate runs (1-3 based on threshold)
    let runsAvailable = 0;
    if (threshold1) runsAvailable = 1;
    if (threshold2) runsAvailable = 2;
    if (threshold3) runsAvailable = 3;

    return await this.updateDailyProgress(userId, date, {
      habitPointsEarned: newPoints,
      threshold1Reached: threshold1,
      threshold2Reached: threshold2,
      threshold3Reached: threshold3,
      runsAvailable,
    });
  }

  async useRun(userId: number, date: string): Promise<boolean> {
    const progress = await this.getDailyProgress(userId, date);
    if (!progress || progress.runsUsed >= progress.runsAvailable) {
      return false;
    }

    await this.updateDailyProgress(userId, date, {
      runsUsed: progress.runsUsed + 1,
    });

    return true;
  }

  // Encounters
  async getEncounters(userId: number): Promise<Encounter[]> {
    return await this.db.select().from(schema.encounters).where(eq(schema.encounters.userId, userId)).orderBy(desc(schema.encounters.createdAt));
  }

  async createEncounter(encounter: InsertEncounter): Promise<Encounter> {
    const [created] = await this.db.insert(schema.encounters).values(encounter).returning();
    return created;
  }

  async getEncounter(id: number): Promise<Encounter | undefined> {
    const [encounter] = await this.db.select().from(schema.encounters).where(eq(schema.encounters.id, id)).limit(1);
    return encounter;
  }

  async updateEncounter(id: number, updates: Partial<Encounter>): Promise<Encounter | undefined> {
    const [updated] = await this.db.update(schema.encounters).set(updates).where(eq(schema.encounters.id, id)).returning();
    return updated;
  }

  // Combat Logs
  async getCombatLog(encounterId: number): Promise<CombatLog | undefined> {
    const [log] = await this.db.select().from(schema.combatLogs).where(eq(schema.combatLogs.encounterId, encounterId));
    return log;
  }

  async createCombatLog(log: Omit<CombatLog, "id" | "createdAt">): Promise<CombatLog> {
    const [created] = await this.db.insert(schema.combatLogs).values(log).returning();
    return created;
  }

  // Player Stats
  async getPlayerStats(userId: number): Promise<PlayerStats | undefined> {
    const [stats] = await this.db.select().from(schema.playerStats).where(eq(schema.playerStats.userId, userId));
    return stats;
  }

  async createPlayerStats(userId: number): Promise<PlayerStats> {
    const [stats] = await this.db
      .insert(schema.playerStats)
      .values({ userId, level: 1, experience: 0, maxPartySize: 1 })
      .returning();
    return stats;
  }

  async updatePlayerStats(userId: number, updates: Partial<PlayerStats>): Promise<PlayerStats> {
    const [updated] = await this.db
      .update(schema.playerStats)
      .set(updates)
      .where(eq(schema.playerStats.userId, userId))
      .returning();
    return updated;
  }

  async addExperience(userId: number, xp: number): Promise<{ stats: PlayerStats; leveledUp: boolean }> {
    const current = await this.getPlayerStats(userId);
    if (!current) {
      const stats = await this.createPlayerStats(userId);
      return { stats, leveledUp: false };
    }

    const newXp = current.experience + xp;
    const xpPerLevel = 10; // Simple: 10 XP per level
    const newLevel = Math.min(10, Math.floor(newXp / xpPerLevel) + 1);
    const leveledUp = newLevel > current.level;

    // Update max party size based on level
    let newMaxPartySize = current.maxPartySize;
    if (newLevel >= 3 && current.maxPartySize < 2) newMaxPartySize = 2;
    if (newLevel >= 5 && current.maxPartySize < 3) newMaxPartySize = 3;
    if (newLevel >= 7 && current.maxPartySize < 4) newMaxPartySize = 4;

    const stats = await this.updatePlayerStats(userId, {
      experience: newXp,
      level: newLevel,
      maxPartySize: newMaxPartySize,
    });

    return { stats, leveledUp };
  }

  // Sprite Management
  async createSprite(sprite: InsertSprite): Promise<Sprite> {
    const [created] = await this.db.insert(schema.sprites).values(sprite).returning();
    return created;
  }

  async upsertSprite(sprite: InsertSprite): Promise<Sprite> {
    const [upserted] = await this.db
      .insert(schema.sprites)
      .values(sprite)
      .onConflictDoUpdate({
        target: schema.sprites.filename,
        set: {
          data: sprite.data,
          mimeType: sprite.mimeType,
          category: sprite.category,
          name: sprite.name,
        },
      })
      .returning();
    return upserted;
  }

  async getSprites(): Promise<Sprite[]> {
    return this.db.select().from(schema.sprites).orderBy(schema.sprites.createdAt);
  }

  async getSpriteByFilename(filename: string): Promise<Sprite | undefined> {
    const [sprite] = await this.db.select().from(schema.sprites).where(eq(schema.sprites.filename, filename));
    return sprite;
  }

  async updateSprite(filename: string, updates: { category?: string; name?: string | null; rarity?: string | null }): Promise<Sprite | undefined> {
    const [updated] = await this.db
      .update(schema.sprites)
      .set(updates)
      .where(eq(schema.sprites.filename, filename))
      .returning();
    return updated;
  }

  async deleteSprite(filename: string): Promise<void> {
    await this.db.delete(schema.sprites).where(eq(schema.sprites.filename, filename));
  }

  // Dream Scroll Management
  async createDreamScrollItem(item: InsertDreamScrollItem): Promise<DreamScrollItem> {
    const [created] = await this.db.insert(schema.dreamScrollItems).values(item).returning();
    return created;
  }

  async getDreamScrollItems(userId: number): Promise<DreamScrollItem[]> {
    return this.db.select().from(schema.dreamScrollItems)
      .where(eq(schema.dreamScrollItems.userId, userId))
      .orderBy(desc(schema.dreamScrollItems.createdAt));
  }

  async getDreamScrollItemsByCategory(userId: number, category: string): Promise<DreamScrollItem[]> {
    return this.db.select().from(schema.dreamScrollItems)
      .where(and(
        eq(schema.dreamScrollItems.userId, userId),
        eq(schema.dreamScrollItems.category, category as any)
      ))
      .orderBy(desc(schema.dreamScrollItems.createdAt));
  }

  async updateDreamScrollItem(id: number, updates: Partial<InsertDreamScrollItem>): Promise<DreamScrollItem | undefined> {
    const [updated] = await this.db
      .update(schema.dreamScrollItems)
      .set(updates)
      .where(eq(schema.dreamScrollItems.id, id))
      .returning();
    return updated;
  }

  async deleteDreamScrollItem(id: number): Promise<void> {
    await this.db.delete(schema.dreamScrollItems).where(eq(schema.dreamScrollItems.id, id));
  }

  async toggleDreamScrollItemComplete(id: number): Promise<DreamScrollItem | undefined> {
    const [item] = await this.db.select().from(schema.dreamScrollItems)
      .where(eq(schema.dreamScrollItems.id, id));

    if (!item) return undefined;

    const [updated] = await this.db
      .update(schema.dreamScrollItems)
      .set({
        completed: !item.completed,
        completedAt: !item.completed ? new Date() : null,
      })
      .where(eq(schema.dreamScrollItems.id, id))
      .returning();
    return updated;
  }

  // Dream Scroll Tag Management
  async createDreamScrollTag(tag: { userId: number; category: string; name: string; color: string }): Promise<DreamScrollTag> {
    const [created] = await this.db.insert(schema.dreamScrollTags).values(tag).returning();
    return created;
  }

  async getDreamScrollTags(userId: number, category: string): Promise<DreamScrollTag[]> {
    return this.db.select().from(schema.dreamScrollTags)
      .where(and(
        eq(schema.dreamScrollTags.userId, userId),
        eq(schema.dreamScrollTags.category, category as any)
      ))
      .orderBy(desc(schema.dreamScrollTags.createdAt));
  }

  async deleteDreamScrollTag(id: number): Promise<void> {
    await this.db.delete(schema.dreamScrollTags)
      .where(eq(schema.dreamScrollTags.id, id));
  }
}
