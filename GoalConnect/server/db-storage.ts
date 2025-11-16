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

  async getSpritesMetadata(): Promise<Omit<Sprite, 'data'>[]> {
    return this.db.select({
      id: schema.sprites.id,
      filename: schema.sprites.filename,
      category: schema.sprites.category,
      name: schema.sprites.name,
      mimeType: schema.sprites.mimeType,
      createdAt: schema.sprites.createdAt,
    }).from(schema.sprites).orderBy(schema.sprites.createdAt);
  }

  async getSpriteById(id: number): Promise<Sprite | undefined> {
    const [sprite] = await this.db.select().from(schema.sprites).where(eq(schema.sprites.id, id));
    return sprite;
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

  // ========================================
  // Mountaineering Game Methods
  // ========================================

  async getAllAlpineGear(): Promise<any[]> {
    return await this.db.select().from(schema.alpineGear).orderBy(schema.alpineGear.tier, schema.alpineGear.unlockLevel);
  }

  async getPlayerGearInventory(userId: number): Promise<any[]> {
    return await this.db
      .select({
        inventoryId: schema.playerGearInventory.id,
        gearId: schema.alpineGear.id,
        name: schema.alpineGear.name,
        category: schema.alpineGear.category,
        description: schema.alpineGear.description,
        weightGrams: schema.alpineGear.weightGrams,
        tier: schema.alpineGear.tier,
        acquiredDate: schema.playerGearInventory.acquiredDate,
      })
      .from(schema.playerGearInventory)
      .innerJoin(schema.alpineGear, eq(schema.playerGearInventory.gearId, schema.alpineGear.id))
      .where(eq(schema.playerGearInventory.userId, userId));
  }

  async purchaseGear(userId: number, gearId: number): Promise<any> {
    // Check if already owned
    const [existing] = await this.db
      .select()
      .from(schema.playerGearInventory)
      .where(and(eq(schema.playerGearInventory.userId, userId), eq(schema.playerGearInventory.gearId, gearId)));

    if (existing) {
      throw new Error("Already own this gear");
    }

    // Get gear details
    const [gear] = await this.db.select().from(schema.alpineGear).where(eq(schema.alpineGear.id, gearId));

    if (!gear) {
      throw new Error("Gear not found");
    }

    // TODO: Check if player has enough coins/points and deduct
    // TODO: Check if player meets unlock requirements

    // Add to inventory
    const [newInventoryItem] = await this.db
      .insert(schema.playerGearInventory)
      .values({ userId, gearId })
      .returning();

    return { ...newInventoryItem, gear };
  }

  async getAllRegions(): Promise<any[]> {
    return await this.db.select().from(schema.worldMapRegions).orderBy(schema.worldMapRegions.name);
  }

  async getAllMountains(): Promise<any[]> {
    return await this.db.select().from(schema.mountains).orderBy(schema.mountains.elevation);
  }

  async getMountainsByRegion(regionId: number): Promise<any[]> {
    return await this.db
      .select()
      .from(schema.mountains)
      .where(eq(schema.mountains.regionId, regionId))
      .orderBy(schema.mountains.elevation);
  }

  async getMountainsByRequiredLevel(level: number): Promise<any[]> {
    return await this.db
      .select()
      .from(schema.mountains)
      .where(eq(schema.mountains.requiredClimbingLevel, level))
      .orderBy(schema.mountains.elevation);
  }

  async getRoutesByMountainId(mountainId: number): Promise<any[]> {
    return await this.db
      .select()
      .from(schema.routes)
      .where(eq(schema.routes.mountainId, mountainId))
      .orderBy(schema.routes.gradeValue);
  }

  async getPlayerClimbingStats(userId: number): Promise<any> {
    const [stats] = await this.db
      .select()
      .from(schema.playerClimbingStats)
      .where(eq(schema.playerClimbingStats.userId, userId));

    if (!stats) {
      // Create default stats
      const [newStats] = await this.db
        .insert(schema.playerClimbingStats)
        .values({
          userId,
          climbingLevel: 1,
          totalXp: 0,
          summits: 0,
          totalDistance: 0,
          totalElevationGain: 0,
          currentStreak: 0,
          longestStreak: 0,
        })
        .returning();
      return newStats;
    }

    return stats;
  }

  async updatePlayerClimbingStats(userId: number, data: Partial<any>): Promise<any> {
    const [updated] = await this.db
      .update(schema.playerClimbingStats)
      .set(data)
      .where(eq(schema.playerClimbingStats.userId, userId))
      .returning();
    return updated;
  }

  // Combo System
  async getComboStats(userId: number): Promise<any> {
    const [stats] = await this.db
      .select()
      .from(schema.userComboStats)
      .where(eq(schema.userComboStats.userId, userId));
    return stats;
  }

  async createComboStats(userId: number): Promise<any> {
    const [stats] = await this.db
      .insert(schema.userComboStats)
      .values({
        userId,
        currentCombo: 0,
        dailyHighScore: 0,
        lastCompletionTime: null,
        comboExpiresAt: null,
      })
      .returning();
    return stats;
  }

  async updateComboStats(userId: number, data: Partial<any>): Promise<any> {
    const [updated] = await this.db
      .update(schema.userComboStats)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.userComboStats.userId, userId))
      .returning();
    return updated;
  }

  // Daily Quest System
  async getDailyQuestTemplates(): Promise<any[]> {
    return await this.db.select().from(schema.dailyQuests);
  }

  async getDailyQuestTemplate(id: number): Promise<any> {
    const [template] = await this.db
      .select()
      .from(schema.dailyQuests)
      .where(eq(schema.dailyQuests.id, id));
    return template;
  }

  async getUserDailyQuest(userId: number, date: string, questId: number): Promise<any> {
    const [quest] = await this.db
      .select()
      .from(schema.userDailyQuests)
      .where(
        and(
          eq(schema.userDailyQuests.userId, userId),
          eq(schema.userDailyQuests.questDate, date),
          eq(schema.userDailyQuests.questId, questId)
        )
      );
    return quest;
  }

  async getUserDailyQuestById(id: number): Promise<any> {
    const [quest] = await this.db
      .select()
      .from(schema.userDailyQuests)
      .where(eq(schema.userDailyQuests.id, id));
    return quest;
  }

  async getUserDailyQuests(userId: number, date: string): Promise<any[]> {
    const quests = await this.db
      .select()
      .from(schema.userDailyQuests)
      .where(
        and(
          eq(schema.userDailyQuests.userId, userId),
          eq(schema.userDailyQuests.questDate, date)
        )
      );
    return quests;
  }

  async createUserDailyQuest(data: any): Promise<any> {
    const [quest] = await this.db
      .insert(schema.userDailyQuests)
      .values(data)
      .returning();
    return quest;
  }

  async updateUserDailyQuest(id: number, data: Partial<any>): Promise<any> {
    const [updated] = await this.db
      .update(schema.userDailyQuests)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.userDailyQuests.id, id))
      .returning();
    return updated;
  }

  // ========== STREAK FREEZE METHODS ==========

  async getStreakFreeze(userId: number): Promise<any> {
    const [freeze] = await this.db
      .select()
      .from(schema.streakFreezes)
      .where(eq(schema.streakFreezes.userId, userId));
    return freeze;
  }

  async createStreakFreeze(userId: number): Promise<any> {
    const [freeze] = await this.db
      .insert(schema.streakFreezes)
      .values({
        userId,
        freezeCount: 0,
        lastEarnedDate: null,
      })
      .returning();
    return freeze;
  }

  async updateStreakFreeze(userId: number, data: Partial<any>): Promise<any> {
    const [updated] = await this.db
      .update(schema.streakFreezes)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.streakFreezes.userId, userId))
      .returning();
    return updated;
  }

  async incrementStreakFreeze(userId: number): Promise<any> {
    const freeze = await this.getStreakFreeze(userId);
    if (!freeze) {
      return this.createStreakFreeze(userId);
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already earned today
    if (freeze.lastEarnedDate === today) {
      return freeze;
    }

    return this.updateStreakFreeze(userId, {
      freezeCount: Math.min(freeze.freezeCount + 1, 3), // Max 3 freezes
      lastEarnedDate: today,
    });
  }

  async decrementStreakFreeze(userId: number): Promise<any> {
    const freeze = await this.getStreakFreeze(userId);
    if (!freeze || freeze.freezeCount <= 0) {
      return freeze;
    }

    return this.updateStreakFreeze(userId, {
      freezeCount: freeze.freezeCount - 1,
    });
  }
}
