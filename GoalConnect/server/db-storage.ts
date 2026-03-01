import { eq, and, desc, asc, gte, lte, isNotNull, sql } from "drizzle-orm";
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
  PointTransaction,
  InsertPointTransaction,
  UserPoints,
  Todo,
  InsertTodo,
  // Mood types
  MoodLog,
  InsertMoodLog,
  // Sprite types
  Sprite,
  InsertSprite,
  // Dream Scroll types
  DreamScrollTag,
  DreamScrollItem,
  InsertDreamScrollItem,
  // Journey Goals
  JourneyGoal,
  InsertJourneyGoal,
  // Residency Tracker
  ResidencyEntry,
  InsertResidencyEntry,
  ResidencyActivity,
  InsertResidencyActivity,
  ResidencyConfounder,
  InsertResidencyConfounder,
  ResidencyConfounderState,
  CustomReward,
  InsertCustomReward,
  StreakFreezeApplication,
} from "@shared/schema";
import { DEFAULT_JOURNEY_GOALS, DEFAULT_RESIDENCY_ACTIVITIES, DEFAULT_RESIDENCY_CONFOUNDERS } from "@shared/schema";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  // Lazy-load database to avoid calling getDb() at module initialization time
  private get db() {
    return getDb();
  }

  // Habits
  async getHabits(userId: number): Promise<Habit[]> {
    return await this.db
      .select()
      .from(schema.habits)
      .where(eq(schema.habits.userId, userId))
      .orderBy(asc(schema.habits.id)); // Stable ordering by ID to prevent reordering on refetch
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
    // First delete all goal updates (foreign key constraint)
    await this.db.delete(schema.goalUpdates).where(eq(schema.goalUpdates.goalId, id));
    // Then delete the goal itself
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
      difficulty: row.difficulty || "medium",
      priority: row.priority || "medium",
      month: row.month || null,
      week: row.week || null,
      archived: row.archived || false,
      parentGoalId: (row as any).parent_goal_id || null,
      linkedYearlyGoalId: (row as any).linked_yearly_goal_id || null,
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

  async spendPoints(userId: number, amount: number, type: PointTransaction['type'] = "reward_redeem", description: string): Promise<boolean> {
    // Wrap in DB transaction so balance deduction + audit record are atomic
    return await this.db.transaction(async (tx) => {
      // Atomic spend: UPDATE ... WHERE available >= amount prevents race conditions
      const result = await tx
        .update(schema.userPoints)
        .set({
          totalSpent: sql`${schema.userPoints.totalSpent} + ${amount}`,
          available: sql`${schema.userPoints.available} - ${amount}`,
        })
        .where(
          and(
            eq(schema.userPoints.userId, userId),
            gte(schema.userPoints.available, amount)
          )
        )
        .returning();

      if (result.length === 0) {
        return false; // Insufficient funds (or user not found)
      }

      // Record the transaction (same DB transaction — rolls back if this fails)
      await tx.insert(schema.pointTransactions).values({
        userId,
        amount: -amount,
        type,
        relatedId: null,
        description,
      });

      return true;
    });
  }

  async getPointTransactions(userId: number): Promise<PointTransaction[]> {
    return await this.db
      .select()
      .from(schema.pointTransactions)
      .where(eq(schema.pointTransactions.userId, userId))
      .orderBy(desc(schema.pointTransactions.createdAt));
  }

  async getPointTransactionsByDateRange(userId: number, since: string): Promise<PointTransaction[]> {
    return await this.db
      .select()
      .from(schema.pointTransactions)
      .where(
        and(
          eq(schema.pointTransactions.userId, userId),
          gte(schema.pointTransactions.createdAt, new Date(since))
        )
      )
      .orderBy(desc(schema.pointTransactions.createdAt));
  }

  async getPointTransactionByTypeAndRelatedId(
    userId: number,
    type: PointTransaction['type'],
    relatedId: number
  ): Promise<PointTransaction | undefined> {
    const [tx] = await this.db
      .select()
      .from(schema.pointTransactions)
      .where(
        and(
          eq(schema.pointTransactions.userId, userId),
          eq(schema.pointTransactions.type, type),
          eq(schema.pointTransactions.relatedId, relatedId)
        )
      )
      .limit(1);
    return tx;
  }

  async getPointTransactionByTypeAndDate(
    userId: number,
    type: PointTransaction['type'],
    date: string
  ): Promise<PointTransaction | undefined> {
    const dayStart = new Date(date + 'T00:00:00.000Z');
    const dayEnd = new Date(date + 'T23:59:59.999Z');
    const [tx] = await this.db
      .select()
      .from(schema.pointTransactions)
      .where(
        and(
          eq(schema.pointTransactions.userId, userId),
          eq(schema.pointTransactions.type, type),
          gte(schema.pointTransactions.createdAt, dayStart),
          lte(schema.pointTransactions.createdAt, dayEnd)
        )
      )
      .limit(1);
    return tx;
  }

  // ========== CUSTOM REWARDS ==========

  async getRewards(userId: number): Promise<CustomReward[]> {
    return await this.db
      .select()
      .from(schema.customRewards)
      .where(eq(schema.customRewards.userId, userId))
      .orderBy(desc(schema.customRewards.createdAt));
  }

  async getReward(id: number): Promise<CustomReward | undefined> {
    const [reward] = await this.db
      .select()
      .from(schema.customRewards)
      .where(eq(schema.customRewards.id, id))
      .limit(1);
    return reward;
  }

  async createReward(data: InsertCustomReward): Promise<CustomReward> {
    const [reward] = await this.db
      .insert(schema.customRewards)
      .values(data as any)
      .returning();
    return reward;
  }

  async updateReward(id: number, data: Partial<CustomReward>): Promise<CustomReward | undefined> {
    const [reward] = await this.db
      .update(schema.customRewards)
      .set(data as any)
      .where(eq(schema.customRewards.id, id))
      .returning();
    return reward;
  }

  async deleteReward(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.customRewards)
      .where(eq(schema.customRewards.id, id));
    return true;
  }

  // ========== STREAK FREEZE APPLICATIONS ==========

  async getStreakFreezeApplication(userId: number, frozenDate: string): Promise<StreakFreezeApplication | undefined> {
    const [app] = await this.db
      .select()
      .from(schema.streakFreezeApplications)
      .where(
        and(
          eq(schema.streakFreezeApplications.userId, userId),
          eq(schema.streakFreezeApplications.frozenDate, frozenDate)
        )
      )
      .limit(1);
    return app;
  }

  async createStreakFreezeApplication(userId: number, frozenDate: string): Promise<StreakFreezeApplication> {
    const [app] = await this.db
      .insert(schema.streakFreezeApplications)
      .values({ userId, frozenDate })
      .returning();
    return app;
  }

  async getStreakFreezeApplications(userId: number): Promise<StreakFreezeApplication[]> {
    return await this.db
      .select()
      .from(schema.streakFreezeApplications)
      .where(eq(schema.streakFreezeApplications.userId, userId));
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
    const results = await this.db.insert(schema.todos).values(todo as any).returning();
    return results[0];
  }

  async updateTodo(id: number, update: Partial<Todo>): Promise<Todo | undefined> {
    const results = await this.db
      .update(schema.todos)
      .set(update as any)
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

  // Mood Tracking
  async getMoodLogsByDate(userId: number, date: string): Promise<MoodLog[]> {
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);

    return this.db
      .select()
      .from(schema.moodLogs)
      .where(
        and(
          eq(schema.moodLogs.userId, userId),
          gte(schema.moodLogs.createdAt, startOfDay),
          lte(schema.moodLogs.createdAt, endOfDay)
        )
      )
      .orderBy(schema.moodLogs.createdAt);
  }

  async getMoodLogsByDateRange(userId: number, startDate: string, endDate: string): Promise<MoodLog[]> {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    return this.db
      .select()
      .from(schema.moodLogs)
      .where(
        and(
          eq(schema.moodLogs.userId, userId),
          gte(schema.moodLogs.createdAt, start),
          lte(schema.moodLogs.createdAt, end)
        )
      )
      .orderBy(schema.moodLogs.createdAt);
  }

  async createMoodLog(log: InsertMoodLog): Promise<MoodLog> {
    const [created] = await this.db.insert(schema.moodLogs).values(log).returning();
    return created;
  }

  async getUserMoodTags(userId: number): Promise<string[]> {
    const results = await this.db
      .selectDistinct({ tag: schema.moodLogs.tag })
      .from(schema.moodLogs)
      .where(
        and(
          eq(schema.moodLogs.userId, userId),
          isNotNull(schema.moodLogs.tag)
        )
      );

    return results.map(r => r.tag).filter((tag): tag is string => tag !== null);
  }

  // Sprite Management
  async createSprite(sprite: InsertSprite): Promise<Sprite> {
    const [created] = await this.db.insert(schema.sprites).values(sprite as any).returning();
    return created;
  }

  async upsertSprite(sprite: InsertSprite): Promise<Sprite> {
    const [upserted] = await this.db
      .insert(schema.sprites)
      .values(sprite as any)
      .onConflictDoUpdate({
        target: schema.sprites.filename,
        set: {
          data: sprite.data,
          mimeType: sprite.mimeType,
          category: sprite.category as any,
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
      .set(updates as any)
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

  async updateDreamScrollItem(id: number, userId: number, updates: Partial<InsertDreamScrollItem>): Promise<DreamScrollItem | undefined> {
    const [updated] = await this.db
      .update(schema.dreamScrollItems)
      .set(updates)
      .where(and(eq(schema.dreamScrollItems.id, id), eq(schema.dreamScrollItems.userId, userId)))
      .returning();
    return updated;
  }

  async deleteDreamScrollItem(id: number, userId: number): Promise<void> {
    await this.db.delete(schema.dreamScrollItems)
      .where(and(eq(schema.dreamScrollItems.id, id), eq(schema.dreamScrollItems.userId, userId)));
  }

  async toggleDreamScrollItemComplete(id: number, userId: number): Promise<DreamScrollItem | undefined> {
    const [updated] = await this.db
      .update(schema.dreamScrollItems)
      .set({
        completed: sql`NOT ${schema.dreamScrollItems.completed}`,
        completedAt: sql`CASE WHEN ${schema.dreamScrollItems.completed} THEN NULL ELSE NOW() END`,
      })
      .where(and(eq(schema.dreamScrollItems.id, id), eq(schema.dreamScrollItems.userId, userId)))
      .returning();
    return updated;
  }

  // Dream Scroll Tag Management
  async createDreamScrollTag(tag: { userId: number; category: string; name: string; color: string }): Promise<DreamScrollTag> {
    const [created] = await this.db.insert(schema.dreamScrollTags).values(tag as any).returning();
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
          totalExperience: 0,
          summitsReached: 0,
          totalElevationClimbed: 0,
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
      .set({ ...data, updatedAt: new Date() } as any)
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

  // ============ JOURNEY GOALS ============

  async getJourneyGoals(userId: number): Promise<JourneyGoal[]> {
    return await this.db
      .select()
      .from(schema.journeyGoals)
      .where(eq(schema.journeyGoals.userId, userId));
  }

  async getJourneyGoalsByCategory(userId: number, category: "cycling" | "lifting" | "climbing"): Promise<JourneyGoal[]> {
    return await this.db
      .select()
      .from(schema.journeyGoals)
      .where(
        and(
          eq(schema.journeyGoals.userId, userId),
          eq(schema.journeyGoals.category, category)
        )
      );
  }

  async getJourneyGoalByKey(userId: number, goalKey: string): Promise<JourneyGoal | undefined> {
    const [goal] = await this.db
      .select()
      .from(schema.journeyGoals)
      .where(
        and(
          eq(schema.journeyGoals.userId, userId),
          eq(schema.journeyGoals.goalKey, goalKey)
        )
      );
    return goal;
  }

  async createJourneyGoal(goal: InsertJourneyGoal): Promise<JourneyGoal> {
    const [newGoal] = await this.db
      .insert(schema.journeyGoals)
      .values(goal as any)
      .returning();
    return newGoal;
  }

  async updateJourneyGoal(userId: number, goalKey: string, targetValue: number): Promise<JourneyGoal | undefined> {
    const [updated] = await this.db
      .update(schema.journeyGoals)
      .set({ targetValue, updatedAt: new Date() })
      .where(
        and(
          eq(schema.journeyGoals.userId, userId),
          eq(schema.journeyGoals.goalKey, goalKey)
        )
      )
      .returning();
    return updated;
  }

  async deleteJourneyGoals(userId: number): Promise<boolean> {
    await this.db
      .delete(schema.journeyGoals)
      .where(eq(schema.journeyGoals.userId, userId));
    return true;
  }

  async initializeJourneyGoals(userId: number): Promise<JourneyGoal[]> {
    const goals: JourneyGoal[] = [];

    // Create goals from defaults
    for (const [category, categoryGoals] of Object.entries(DEFAULT_JOURNEY_GOALS)) {
      for (const [goalKey, goalData] of Object.entries(categoryGoals)) {
        const goal = await this.createJourneyGoal({
          userId,
          category: category as "cycling" | "lifting" | "climbing",
          goalKey,
          targetValue: goalData.targetValue,
          unit: goalData.unit,
        });
        goals.push(goal);
      }
    }

    return goals;
  }

  // NOTE: Linking methods removed - Journey is source of truth, Goals page displays read-only

  // ============ RESIDENCY TRACKER ============

  async getResidencyEntries(userId: number): Promise<ResidencyEntry[]> {
    return await this.db
      .select()
      .from(schema.residencyEntries)
      .where(eq(schema.residencyEntries.userId, userId))
      .orderBy(desc(schema.residencyEntries.timestamp));
  }

  async getResidencyEntriesByDateRange(userId: number, startDate: string, endDate: string): Promise<ResidencyEntry[]> {
    const startTimestamp = new Date(startDate);
    const endTimestamp = new Date(endDate + 'T23:59:59.999Z');

    return await this.db
      .select()
      .from(schema.residencyEntries)
      .where(
        and(
          eq(schema.residencyEntries.userId, userId),
          gte(schema.residencyEntries.timestamp, startTimestamp),
          lte(schema.residencyEntries.timestamp, endTimestamp)
        )
      )
      .orderBy(desc(schema.residencyEntries.timestamp));
  }

  async createResidencyEntry(entry: InsertResidencyEntry): Promise<ResidencyEntry> {
    const [newEntry] = await this.db
      .insert(schema.residencyEntries)
      .values(entry as any)
      .returning();
    return newEntry;
  }

  async deleteResidencyEntry(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.residencyEntries)
      .where(eq(schema.residencyEntries.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getResidencyActivities(userId: number): Promise<ResidencyActivity[]> {
    return await this.db
      .select()
      .from(schema.residencyActivities)
      .where(eq(schema.residencyActivities.userId, userId))
      .orderBy(schema.residencyActivities.position);
  }

  async createResidencyActivity(activity: InsertResidencyActivity): Promise<ResidencyActivity> {
    const [newActivity] = await this.db
      .insert(schema.residencyActivities)
      .values(activity as any)
      .returning();
    return newActivity;
  }

  async deleteResidencyActivity(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.residencyActivities)
      .where(eq(schema.residencyActivities.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getResidencyConfounders(userId: number): Promise<ResidencyConfounder[]> {
    return await this.db
      .select()
      .from(schema.residencyConfounders)
      .where(eq(schema.residencyConfounders.userId, userId))
      .orderBy(schema.residencyConfounders.position);
  }

  async createResidencyConfounder(confounder: InsertResidencyConfounder): Promise<ResidencyConfounder> {
    const [newConfounder] = await this.db
      .insert(schema.residencyConfounders)
      .values(confounder as any)
      .returning();
    return newConfounder;
  }

  async deleteResidencyConfounder(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.residencyConfounders)
      .where(eq(schema.residencyConfounders.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getResidencyConfounderState(userId: number): Promise<ResidencyConfounderState | undefined> {
    const [state] = await this.db
      .select()
      .from(schema.residencyConfounderState)
      .where(eq(schema.residencyConfounderState.userId, userId));
    return state;
  }

  async updateResidencyConfounderState(userId: number, activeConfounders: string[]): Promise<ResidencyConfounderState> {
    // Upsert - insert if not exists, update if exists
    const existing = await this.getResidencyConfounderState(userId);

    if (existing) {
      const [updated] = await this.db
        .update(schema.residencyConfounderState)
        .set({ activeConfounders, updatedAt: new Date() })
        .where(eq(schema.residencyConfounderState.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await this.db
        .insert(schema.residencyConfounderState)
        .values({ userId, activeConfounders } as any)
        .returning();
      return created;
    }
  }

  async initializeResidencyDefaults(userId: number): Promise<void> {
    // Check if activities already exist
    const existingActivities = await this.getResidencyActivities(userId);
    if (existingActivities.length === 0) {
      // Add default activities
      for (let i = 0; i < DEFAULT_RESIDENCY_ACTIVITIES.length; i++) {
        await this.createResidencyActivity({
          userId,
          name: DEFAULT_RESIDENCY_ACTIVITIES[i],
          position: i,
        });
      }
    }

    // Check if confounders already exist
    const existingConfounders = await this.getResidencyConfounders(userId);
    if (existingConfounders.length === 0) {
      // Add default confounders
      for (let i = 0; i < DEFAULT_RESIDENCY_CONFOUNDERS.length; i++) {
        await this.createResidencyConfounder({
          userId,
          name: DEFAULT_RESIDENCY_CONFOUNDERS[i],
          position: i,
        });
      }
    }

    // Initialize confounder state if not exists
    const state = await this.getResidencyConfounderState(userId);
    if (!state) {
      await this.updateResidencyConfounderState(userId, []);
    }
  }
}
