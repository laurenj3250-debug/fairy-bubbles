import { pgTable, serial, integer, text, boolean, timestamp, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  cadence: varchar("cadence", { length: 10 }).notNull().$type<"daily" | "weekly">(),
  targetPerWeek: integer("target_per_week"),
  difficulty: varchar("difficulty", { length: 10 }).notNull().default("medium").$type<"easy" | "medium" | "hard">(),
  linkedGoalId: integer("linked_goal_id").references(() => goals.id),
});

export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id),
  userId: integer("user_id").notNull().references(() => users.id),
  date: varchar("date", { length: 10 }).notNull(),
  completed: boolean("completed").notNull().default(false),
  note: text("note"),
  mood: integer("mood"), // 1-5 scale
  energyLevel: integer("energy_level"), // 1-5 scale
}, (table) => {
  return {
    habitUserDateIdx: uniqueIndex("habit_logs_habit_id_user_id_date_key").on(table.habitId, table.userId, table.date),
  };
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").notNull().default(0),
  unit: text("unit").notNull(),
  deadline: varchar("deadline", { length: 10 }).notNull(),
  category: text("category").notNull(),
  difficulty: varchar("difficulty", { length: 10 }).notNull().default("medium").$type<"easy" | "medium" | "hard">(),
  priority: varchar("priority", { length: 10 }).notNull().default("medium").$type<"high" | "medium" | "low">(),
});

export const goalUpdates = pgTable("goal_updates", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => goals.id),
  userId: integer("user_id").notNull().references(() => users.id),
  date: varchar("date", { length: 10 }).notNull(),
  value: integer("value").notNull(),
  note: text("note"),
});

export const userSettings = pgTable("user_settings", {
  userId: integer("user_id").primaryKey().references(() => users.id),
  darkMode: boolean("dark_mode").notNull().default(true),
  notifications: boolean("notifications").notNull().default(true),
});

export const virtualPets = pgTable("virtual_pets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  name: text("name").notNull().default("Forest Friend"),
  species: varchar("species", { length: 50 }).notNull().default("Gremlin").$type<"Gremlin">(),
  happiness: integer("happiness").notNull().default(50),
  health: integer("health").notNull().default(100),
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  evolution: varchar("evolution", { length: 20 }).notNull().default("seed").$type<"seed" | "sprout" | "sapling" | "tree" | "ancient">(),
  currentCostumeId: integer("current_costume_id").references(() => costumes.id),
  lastFed: timestamp("last_fed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const costumes = pgTable("costumes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: varchar("category", { length: 20 }).notNull().$type<"hat" | "outfit" | "accessory" | "background">(),
  price: integer("price").notNull(),
  imageUrl: text("image_url").notNull(),
  rarity: varchar("rarity", { length: 20 }).notNull().$type<"common" | "rare" | "epic" | "legendary">(),
  evolutionRequired: varchar("evolution_required", { length: 20 }).notNull().default("seed").$type<"seed" | "sprout" | "sapling" | "tree" | "ancient">(),
});

export const userCostumes = pgTable("user_costumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  costumeId: integer("costume_id").notNull().references(() => costumes.id),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  isEquipped: boolean("is_equipped").notNull().default(false),
});

export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: varchar("type", { length: 30 }).notNull().$type<"habit_complete" | "goal_progress" | "costume_purchase" | "daily_login" | "todo_complete">(),
  relatedId: integer("related_id"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPoints = pgTable("user_points", {
  userId: integer("user_id").primaryKey().references(() => users.id),
  totalEarned: integer("total_earned").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  available: integer("available").notNull().default(0),
});

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  dueDate: varchar("due_date", { length: 10 }),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  difficulty: varchar("difficulty", { length: 10 }).notNull().default("medium").$type<"easy" | "medium" | "hard">(),
  subtasks: text("subtasks").notNull().default("[]"), // JSON string of subtasks
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TypeScript types inferred from tables
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Habit = typeof habits.$inferSelect;
export type HabitLog = typeof habitLogs.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type GoalUpdate = typeof goalUpdates.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type VirtualPet = typeof virtualPets.$inferSelect;
export type Costume = typeof costumes.$inferSelect;
export type UserCostume = typeof userCostumes.$inferSelect;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type UserPoints = typeof userPoints.$inferSelect;
export type Todo = typeof todos.$inferSelect;

// Insert schemas using drizzle-zod
export const insertHabitSchema = createInsertSchema(habits).omit({ id: true });
export type InsertHabit = z.infer<typeof insertHabitSchema>;

export const insertHabitLogSchema = createInsertSchema(habitLogs).omit({ id: true });
export type InsertHabitLog = z.infer<typeof insertHabitLogSchema>;

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true }).extend({
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export const insertGoalUpdateSchema = createInsertSchema(goalUpdates).omit({ id: true });
export type InsertGoalUpdate = z.infer<typeof insertGoalUpdateSchema>;

export const insertUserSettingsSchema = createInsertSchema(userSettings);
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export const insertVirtualPetSchema = createInsertSchema(virtualPets).omit({ id: true });
export type InsertVirtualPet = z.infer<typeof insertVirtualPetSchema>;

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).omit({ id: true });
export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;

export const insertTodoSchema = createInsertSchema(todos).omit({ id: true, createdAt: true, completedAt: true });
export type InsertTodo = z.infer<typeof insertTodoSchema>;

// ========== D&D RPG SYSTEM ==========

// Biomes (Worlds)
export const biomes = pgTable("biomes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  unlockPlayerLevel: integer("unlock_player_level").notNull().default(1),

  // Event weights
  lootWeight: integer("loot_weight").notNull().default(70),
  encounterWeight: integer("encounter_weight").notNull().default(30),

  // Party gates
  minPartySize: integer("min_party_size").notNull().default(0),
  requiredTag: text("required_tag"),
  requiredStatSum: integer("required_stat_sum").default(0),
  requiredStatType: varchar("required_stat_type", { length: 10 }),

  backgroundSprite: text("background_sprite"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Creature Species
export const creatureSpecies = pgTable("creature_species", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),

  // D&D-style stats
  baseHp: integer("base_hp").notNull().default(8),
  baseStr: integer("base_str").notNull().default(1),
  baseDex: integer("base_dex").notNull().default(1),
  baseWis: integer("base_wis").notNull().default(1),

  // Tags & rarity
  tag: varchar("tag", { length: 20 }).notNull(),
  rarity: varchar("rarity", { length: 20 }).notNull().$type<"common" | "uncommon" | "rare" | "epic">(),
  captureDc: integer("capture_dc").notNull().default(10),

  // Skills
  skill1Name: text("skill_1_name"),
  skill1Effect: text("skill_1_effect"),
  skill2Name: text("skill_2_name"),
  skill2Effect: text("skill_2_effect"),

  biomeId: integer("biome_id").references(() => biomes.id),
  spriteUrl: text("sprite_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Creatures (Party/Collection)
export const userCreatures = pgTable("user_creatures", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  speciesId: integer("species_id").notNull().references(() => creatureSpecies.id),

  nickname: text("nickname"),

  // Stats
  currentHp: integer("current_hp").notNull(),
  maxHp: integer("max_hp").notNull(),
  str: integer("str").notNull(),
  dex: integer("dex").notNull(),
  wis: integer("wis").notNull(),

  // Party
  inParty: boolean("in_party").notNull().default(false),
  partyPosition: integer("party_position"),

  evolutionStage: integer("evolution_stage").notNull().default(1),
  discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
});

// Items (Loot)
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),

  type: varchar("type", { length: 20 }).notNull().$type<"net" | "charm" | "snack" | "gear" | "cloak" | "brace">(),
  rarity: varchar("rarity", { length: 20 }).notNull().$type<"common" | "uncommon" | "rare">(),

  effectType: varchar("effect_type", { length: 20 }),
  effectValue: integer("effect_value"),
  effectStat: varchar("effect_stat", { length: 10 }),

  consumable: boolean("consumable").notNull().default(true),
  equippable: boolean("equippable").notNull().default(false),

  spriteUrl: text("sprite_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Inventory
export const userInventory = pgTable("user_inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  quantity: integer("quantity").notNull().default(1),
});

// Equipped Items
export const equippedItems = pgTable("equipped_items", {
  id: serial("id").primaryKey(),
  userCreatureId: integer("user_creature_id").notNull().references(() => userCreatures.id),
  itemId: integer("item_id").notNull().references(() => items.id),
});

// Shards (Duplicates)
export const shards = pgTable("shards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  speciesId: integer("species_id").notNull().references(() => creatureSpecies.id),
  amount: integer("amount").notNull().default(0),
});

// Daily Progress
export const dailyProgress = pgTable("daily_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: varchar("date", { length: 10 }).notNull(),

  habitPointsEarned: integer("habit_points_earned").notNull().default(0),
  threshold1Reached: boolean("threshold_1_reached").notNull().default(false),
  threshold2Reached: boolean("threshold_2_reached").notNull().default(false),
  threshold3Reached: boolean("threshold_3_reached").notNull().default(false),

  runsAvailable: integer("runs_available").notNull().default(0),
  runsUsed: integer("runs_used").notNull().default(0),
});

// Encounters
export const encounters = pgTable("encounters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  biomeId: integer("biome_id").notNull().references(() => biomes.id),
  speciesId: integer("species_id").references(() => creatureSpecies.id),

  eventType: varchar("event_type", { length: 10 }).notNull().$type<"loot" | "encounter">(),
  combatWon: boolean("combat_won"),
  captured: boolean("captured"),
  shardsEarned: integer("shards_earned").notNull().default(0),

  lootItemId: integer("loot_item_id").references(() => items.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Combat Logs
export const combatLogs = pgTable("combat_logs", {
  id: serial("id").primaryKey(),
  encounterId: integer("encounter_id").notNull().references(() => encounters.id),

  partyCreatures: text("party_creatures").notNull(), // JSON array of IDs
  enemySpeciesId: integer("enemy_species_id").notNull().references(() => creatureSpecies.id),
  enemyHp: integer("enemy_hp").notNull(),

  turnLog: text("turn_log").notNull().default("[]"), // JSON turn history
  roundsFought: integer("rounds_fought").notNull(),
  victory: boolean("victory").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Player Stats
export const playerStats = pgTable("player_stats", {
  userId: integer("user_id").primaryKey().references(() => users.id),

  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  maxPartySize: integer("max_party_size").notNull().default(1),
});

// Sprites (stored in database for persistence)
export const sprites = pgTable("sprites", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  category: varchar("category", { length: 20 }).notNull().$type<"creature" | "biome" | "item" | "ui" | "uncategorized">(),
  name: text("name"), // Optional name for creatures
  data: text("data").notNull(), // Base64-encoded image data
  mimeType: text("mime_type").notNull(), // image/png, image/jpeg, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Dream Scroll Tags (user-created tags per category)
export const dreamScrollTags = pgTable("dream_scroll_tags", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  category: varchar("category", { length: 20 }).notNull().$type<"do" | "buy" | "see" | "visit" | "learn" | "experience" | "music">(),
  name: text("name").notNull(),
  color: varchar("color", { length: 50 }).notNull().default("bg-gray-500/20 text-gray-300"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Dream Scroll (magical wishlist)
export const dreamScrollItems = pgTable("dream_scroll_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 20 }).notNull().$type<"do" | "buy" | "see" | "visit" | "learn" | "experience" | "music">(),
  priority: varchar("priority", { length: 10 }).notNull().default("medium").$type<"low" | "medium" | "high">(),
  cost: varchar("cost", { length: 10 }).$type<"free" | "$" | "$$" | "$$$">(),
  tags: text("tags"), // JSON array of tag IDs
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TypeScript types
export type Biome = typeof biomes.$inferSelect;
export type CreatureSpecies = typeof creatureSpecies.$inferSelect;
export type UserCreature = typeof userCreatures.$inferSelect;
export type Item = typeof items.$inferSelect;
export type UserInventory = typeof userInventory.$inferSelect;
export type EquippedItem = typeof equippedItems.$inferSelect;
export type Shard = typeof shards.$inferSelect;
export type DailyProgress = typeof dailyProgress.$inferSelect;
export type Encounter = typeof encounters.$inferSelect;
export type CombatLog = typeof combatLogs.$inferSelect;
export type PlayerStats = typeof playerStats.$inferSelect;
export type Sprite = typeof sprites.$inferSelect;
export type DreamScrollTag = typeof dreamScrollTags.$inferSelect;
export type DreamScrollItem = typeof dreamScrollItems.$inferSelect;

// Insert schemas
export const insertBiomeSchema = createInsertSchema(biomes).omit({ id: true, createdAt: true });
export const insertCreatureSpeciesSchema = createInsertSchema(creatureSpecies).omit({ id: true, createdAt: true });
export const insertUserCreatureSchema = createInsertSchema(userCreatures).omit({ id: true, discoveredAt: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true, createdAt: true });
export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({ id: true });
export const insertEncounterSchema = createInsertSchema(encounters).omit({ id: true, createdAt: true });
export const insertPlayerStatsSchema = createInsertSchema(playerStats);
export const insertSpriteSchema = createInsertSchema(sprites).omit({ id: true, createdAt: true });
export const insertDreamScrollItemSchema = createInsertSchema(dreamScrollItems).omit({ id: true, createdAt: true, completedAt: true });

export type InsertBiome = z.infer<typeof insertBiomeSchema>;
export type InsertCreatureSpecies = z.infer<typeof insertCreatureSpeciesSchema>;
export type InsertUserCreature = z.infer<typeof insertUserCreatureSchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type InsertEncounter = z.infer<typeof insertEncounterSchema>;
export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type InsertSprite = z.infer<typeof insertSpriteSchema>;
export type InsertDreamScrollItem = z.infer<typeof insertDreamScrollItemSchema>;
