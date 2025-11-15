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
  // Weekly Hub fields
  category: varchar("category", { length: 20 }).default("training").$type<"training" | "mind" | "foundation" | "adventure">(),
  effort: varchar("effort", { length: 10 }).default("medium").$type<"light" | "medium" | "heavy">(),
  grade: text("grade").default("5.9"), // e.g., "5.9", "5.11"
  // Adventure scheduling
  scheduledDay: varchar("scheduled_day", { length: 10 }), // ISO date string (YYYY-MM-DD) for which day this week
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

// Biome Level Objects (platforms, obstacles, decorations)
export const biomeLevelObjects = pgTable("biome_level_objects", {
  id: serial("id").primaryKey(),
  biomeId: integer("biome_id").notNull().references(() => biomes.id),
  objectType: varchar("object_type", { length: 20 }).notNull().$type<"platform" | "obstacle" | "decoration">(),
  spriteFilename: text("sprite_filename").notNull(),
  xPosition: integer("x_position").notNull(),
  yPosition: integer("y_position").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  zIndex: integer("z_index").notNull().default(0),
  metadata: text("metadata").default("{}"), // JSON string for future properties
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sprites (stored in database for persistence)
export const sprites = pgTable("sprites", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  category: varchar("category", { length: 30 }).notNull().$type<"creature" | "biome" | "item" | "ui" | "biome-background" | "biome-platform" | "biome-obstacle" | "uncategorized">(),
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
export type BiomeLevelObject = typeof biomeLevelObjects.$inferSelect;
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
export const insertBiomeLevelObjectSchema = createInsertSchema(biomeLevelObjects).omit({ id: true, createdAt: true });
export const insertCreatureSpeciesSchema = createInsertSchema(creatureSpecies).omit({ id: true, createdAt: true });
export const insertUserCreatureSchema = createInsertSchema(userCreatures).omit({ id: true, discoveredAt: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true, createdAt: true });
export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({ id: true });
export const insertEncounterSchema = createInsertSchema(encounters).omit({ id: true, createdAt: true });
export const insertPlayerStatsSchema = createInsertSchema(playerStats);
export const insertSpriteSchema = createInsertSchema(sprites).omit({ id: true, createdAt: true });
export const insertDreamScrollItemSchema = createInsertSchema(dreamScrollItems).omit({ id: true, createdAt: true, completedAt: true });

export type InsertBiome = z.infer<typeof insertBiomeSchema>;
export type InsertBiomeLevelObject = z.infer<typeof insertBiomeLevelObjectSchema>;
export type InsertCreatureSpecies = z.infer<typeof insertCreatureSpeciesSchema>;
export type InsertUserCreature = z.infer<typeof insertUserCreatureSchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type InsertEncounter = z.infer<typeof insertEncounterSchema>;
export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type InsertSprite = z.infer<typeof insertSpriteSchema>;
export type InsertDreamScrollItem = z.infer<typeof insertDreamScrollItemSchema>;

// ========== MOUNTAINEERING EXPEDITION GAME ==========

// World Map Regions (Geographic organization of mountains)
export const worldMapRegions = pgTable("world_map_regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  continent: varchar("continent", { length: 50 }).notNull(),
  description: text("description").notNull().default(""),
  unlockLevel: integer("unlock_level").notNull().default(1),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mountains (Real-world peaks)
export const mountains = pgTable("mountains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  elevation: integer("elevation").notNull(), // meters
  country: text("country").notNull(),
  mountainRange: text("mountain_range").notNull(),
  continent: varchar("continent", { length: 50 }).notNull(),
  regionId: integer("region_id").references(() => worldMapRegions.id),

  // Geographic coordinates for map positioning
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),

  // Difficulty and progression
  difficultyTier: varchar("difficulty_tier", { length: 20 }).notNull()
    .$type<"novice" | "intermediate" | "advanced" | "expert" | "elite">(),
  requiredClimbingLevel: integer("required_climbing_level").notNull().default(1),

  // Metadata
  description: text("description").notNull().default(""),
  firstAscentYear: integer("first_ascent_year"),
  fatalityRate: text("fatality_rate"), // e.g., "3.5%" stored as text
  bestSeasonStart: varchar("best_season_start", { length: 20 }),
  bestSeasonEnd: varchar("best_season_end", { length: 20 }),

  // Unlock requirements (JSON: level, habits_completed, previous_climbs, etc.)
  unlockRequirements: text("unlock_requirements").notNull().default("{}"),

  // Display
  imageUrl: text("image_url"),
  mapPositionX: integer("map_position_x"),
  mapPositionY: integer("map_position_y"),

  // Theme/Background unlocked when summit reached
  backgroundImage: text("background_image"), // URL to mountain background
  themeColors: text("theme_colors").default("{}"), // JSON: {primary, secondary, accent, gradient}

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Routes (Multiple climbing routes per mountain)
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  mountainId: integer("mountain_id").notNull().references(() => mountains.id),
  routeName: text("route_name").notNull(),

  // Grading
  gradingSystem: varchar("grading_system", { length: 20 }).notNull(), // YDS, UIAA, French, etc.
  gradeValue: text("grade_value").notNull(), // e.g., "5.10a", "AD", "III"

  // Route characteristics
  elevationGain: integer("elevation_gain").notNull(), // meters
  estimatedDays: integer("estimated_days").notNull(),
  terrainTypes: text("terrain_types").notNull().default("[]"), // JSON array: ["glacier", "rock", "snow", "mixed"]
  hazards: text("hazards").notNull().default("[]"), // JSON array: ["avalanche", "crevasse", "rockfall", "altitude"]

  // Requirements
  requiresOxygen: boolean("requires_oxygen").notNull().default(false),
  requiresFixedRopes: boolean("requires_fixed_ropes").notNull().default(false),
  requiresTechnicalClimbing: boolean("requires_technical_climbing").notNull().default(false),

  // Description
  routeDescription: text("route_description").notNull().default(""),
  firstAscentYear: integer("first_ascent_year"),

  // Difficulty
  technicalDifficulty: integer("technical_difficulty").notNull().default(1), // 1-10 scale
  physicalDifficulty: integer("physical_difficulty").notNull().default(1), // 1-10 scale

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Alpine Gear (Equipment for mountaineering)
export const alpineGear = pgTable("alpine_gear", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: varchar("category", { length: 30 }).notNull()
    .$type<"boots" | "crampons" | "rope" | "tent" | "clothing" | "safety" | "oxygen" | "ice_axe" | "harness" | "backpack" | "sleeping_bag" | "stove" | "miscellaneous">(),
  description: text("description").notNull().default(""),

  // Physical properties
  weightGrams: integer("weight_grams").notNull().default(0),

  // Progression
  tier: varchar("tier", { length: 20 }).notNull()
    .$type<"basic" | "intermediate" | "advanced" | "elite">(),
  unlockLevel: integer("unlock_level").notNull().default(1),
  unlockHabitCount: integer("unlock_habit_count").notNull().default(0),

  // Acquisition
  cost: integer("cost").notNull().default(0), // In-game currency

  // Stats (JSON: warmth_rating, durability, technical_grade, oxygen_capacity, etc.)
  stats: text("stats").notNull().default("{}"),

  // Display
  imageUrl: text("image_url"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Route Gear Requirements (What gear is needed per route)
export const routeGearRequirements = pgTable("route_gear_requirements", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull().references(() => routes.id),
  gearId: integer("gear_id").notNull().references(() => alpineGear.id),
  isRequired: boolean("is_required").notNull().default(true),
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"),
});

// Player Gear Inventory (Gear owned by players)
export const playerGearInventory = pgTable("player_gear_inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gearId: integer("gear_id").notNull().references(() => alpineGear.id),
  acquiredDate: timestamp("acquired_date").defaultNow().notNull(),
  timesUsed: integer("times_used").notNull().default(0),
  condition: integer("condition").notNull().default(100), // 0-100%, degrades with use
});

// Player Climbing Stats (Overall progression and achievements)
export const playerClimbingStats = pgTable("player_climbing_stats", {
  userId: integer("user_id").primaryKey().references(() => users.id),

  // Progression
  climbingLevel: integer("climbing_level").notNull().default(1),
  totalExperience: integer("total_experience").notNull().default(0),

  // Achievements
  summitsReached: integer("summits_reached").notNull().default(0),
  totalElevationClimbed: integer("total_elevation_climbed").notNull().default(0), // meters
  continentsCompleted: text("continents_completed").notNull().default("[]"), // JSON array
  achievements: text("achievements").notNull().default("[]"), // JSON array of achievement IDs

  // Energy system
  currentEnergy: integer("current_energy").notNull().default(100),
  maxEnergy: integer("max_energy").notNull().default(100),
  trainingDaysCompleted: integer("training_days_completed").notNull().default(0),

  // Stats
  longestExpedition: integer("longest_expedition").notNull().default(0), // days
  highestPeakClimbed: integer("highest_peak_climbed").notNull().default(0), // meters

  // Last updated
  lastEnergyRefresh: timestamp("last_energy_refresh").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Player Expeditions (Climbing attempts/progress)
export const playerExpeditions = pgTable("player_expeditions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  routeId: integer("route_id").notNull().references(() => routes.id),

  // Status
  status: varchar("status", { length: 20 }).notNull()
    .$type<"planning" | "in_progress" | "completed" | "failed" | "abandoned">(),

  // Timeline
  startDate: timestamp("start_date").defaultNow().notNull(),
  completionDate: timestamp("completion_date"),

  // Progress tracking
  currentProgress: integer("current_progress").notNull().default(0), // 0-100%
  currentAltitude: integer("current_altitude").notNull().default(0), // meters
  currentDay: integer("current_day").notNull().default(1),

  // Resources
  energySpent: integer("energy_spent").notNull().default(0),
  habitsCompletedDuring: integer("habits_completed_during").notNull().default(0),

  // Outcome
  summitReached: boolean("summit_reached").notNull().default(false),
  experienceEarned: integer("experience_earned").notNull().default(0),

  // Player notes/journal
  notes: text("notes").default(""),

  // Metadata
  weatherCondition: varchar("weather_condition", { length: 20 }),
  teamMorale: integer("team_morale").notNull().default(100), // 0-100
  acclimatizationLevel: integer("acclimatization_level").notNull().default(0), // 0-100

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Expedition Events (Events during climbs)
export const expeditionEvents = pgTable("expedition_events", {
  id: serial("id").primaryKey(),
  expeditionId: integer("expedition_id").notNull().references(() => playerExpeditions.id),

  // Event details
  eventType: varchar("event_type", { length: 30 }).notNull()
    .$type<"weather_delay" | "storm" | "avalanche" | "crevasse" | "altitude_sickness" | "equipment_failure" | "success" | "rest_day" | "acclimatization" | "team_conflict" | "rescue">(),
  eventDay: integer("event_day").notNull(),
  eventDescription: text("event_description").notNull(),

  // Impact
  energyCost: integer("energy_cost").notNull().default(0),
  progressImpact: integer("progress_impact").notNull().default(0), // Can be negative
  moraleImpact: integer("morale_impact").notNull().default(0),

  // Player decision/response (JSON)
  playerChoice: text("player_choice").default("{}"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Expedition Gear Loadout (What gear was taken on each expedition)
export const expeditionGearLoadout = pgTable("expedition_gear_loadout", {
  id: serial("id").primaryKey(),
  expeditionId: integer("expedition_id").notNull().references(() => playerExpeditions.id),
  gearId: integer("gear_id").notNull().references(() => alpineGear.id),
  quantity: integer("quantity").notNull().default(1),
  conditionBefore: integer("condition_before").notNull().default(100),
  conditionAfter: integer("condition_after").notNull().default(100),
});

// Mountain Unlocks (Track which mountains are unlocked for each player)
export const mountainUnlocks = pgTable("mountain_unlocks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  mountainId: integer("mountain_id").notNull().references(() => mountains.id),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  unlockedBy: varchar("unlocked_by", { length: 50 }).notNull(), // "level", "achievement", "previous_climb", etc.
});

// Mountain Backgrounds (Unlocked when summit is reached)
export const mountainBackgrounds = pgTable("mountain_backgrounds", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  mountainId: integer("mountain_id").notNull().references(() => mountains.id),
  expeditionId: integer("expedition_id").references(() => playerExpeditions.id), // Which expedition unlocked it
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  isActive: boolean("is_active").notNull().default(false), // Currently selected background
});

// TypeScript types for mountaineering tables
export type WorldMapRegion = typeof worldMapRegions.$inferSelect;
export type Mountain = typeof mountains.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type AlpineGear = typeof alpineGear.$inferSelect;
export type RouteGearRequirement = typeof routeGearRequirements.$inferSelect;
export type PlayerGearInventory = typeof playerGearInventory.$inferSelect;
export type PlayerClimbingStats = typeof playerClimbingStats.$inferSelect;
export type PlayerExpedition = typeof playerExpeditions.$inferSelect;
export type ExpeditionEvent = typeof expeditionEvents.$inferSelect;
export type ExpeditionGearLoadout = typeof expeditionGearLoadout.$inferSelect;
export type MountainUnlock = typeof mountainUnlocks.$inferSelect;
export type MountainBackground = typeof mountainBackgrounds.$inferSelect;

// Insert schemas for mountaineering tables
export const insertWorldMapRegionSchema = createInsertSchema(worldMapRegions).omit({ id: true, createdAt: true });
export const insertMountainSchema = createInsertSchema(mountains).omit({ id: true, createdAt: true });
export const insertRouteSchema = createInsertSchema(routes).omit({ id: true, createdAt: true });
export const insertAlpineGearSchema = createInsertSchema(alpineGear).omit({ id: true, createdAt: true });
export const insertRouteGearRequirementSchema = createInsertSchema(routeGearRequirements).omit({ id: true });
export const insertPlayerGearInventorySchema = createInsertSchema(playerGearInventory).omit({ id: true, acquiredDate: true });
export const insertPlayerClimbingStatsSchema = createInsertSchema(playerClimbingStats);
export const insertPlayerExpeditionSchema = createInsertSchema(playerExpeditions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertExpeditionEventSchema = createInsertSchema(expeditionEvents).omit({ id: true, createdAt: true });
export const insertExpeditionGearLoadoutSchema = createInsertSchema(expeditionGearLoadout).omit({ id: true });
export const insertMountainUnlockSchema = createInsertSchema(mountainUnlocks).omit({ id: true, unlockedAt: true });

export type InsertWorldMapRegion = z.infer<typeof insertWorldMapRegionSchema>;
export type InsertMountain = z.infer<typeof insertMountainSchema>;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type InsertAlpineGear = z.infer<typeof insertAlpineGearSchema>;
export type InsertRouteGearRequirement = z.infer<typeof insertRouteGearRequirementSchema>;
export type InsertPlayerGearInventory = z.infer<typeof insertPlayerGearInventorySchema>;
export type InsertPlayerClimbingStats = z.infer<typeof insertPlayerClimbingStatsSchema>;
export type InsertPlayerExpedition = z.infer<typeof insertPlayerExpeditionSchema>;
export type InsertExpeditionEvent = z.infer<typeof insertExpeditionEventSchema>;
export type InsertExpeditionGearLoadout = z.infer<typeof insertExpeditionGearLoadoutSchema>;
export type InsertMountainUnlock = z.infer<typeof insertMountainUnlockSchema>;

// ========== COMBO SYSTEM ==========

export const userComboStats = pgTable("user_combo_stats", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  currentCombo: integer("current_combo").default(0).notNull(),
  dailyHighScore: integer("daily_high_score").default(0).notNull(),
  lastCompletionTime: timestamp("last_completion_time"),
  comboExpiresAt: timestamp("combo_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserComboStats = typeof userComboStats.$inferSelect;
export type InsertUserComboStats = typeof userComboStats.$inferInsert;

// ========== DAILY QUEST SYSTEM ==========

export const dailyQuests = pgTable("daily_quests", {
  id: serial("id").primaryKey(),
  questType: varchar("quest_type", { length: 50 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  targetValue: integer("target_value").notNull(),
  rewardTokens: integer("reward_tokens").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userDailyQuests = pgTable("user_daily_quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questDate: varchar("quest_date", { length: 10 }).notNull(), // YYYY-MM-DD
  questId: integer("quest_id").notNull().references(() => dailyQuests.id, { onDelete: "cascade" }),
  progress: integer("progress").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  claimed: boolean("claimed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DailyQuest = typeof dailyQuests.$inferSelect;
export type InsertDailyQuest = typeof dailyQuests.$inferInsert;
export type UserDailyQuest = typeof userDailyQuests.$inferSelect;
export type InsertUserDailyQuest = typeof userDailyQuests.$inferInsert;

// ========== STREAK FREEZE SYSTEM ==========

export const streakFreezes = pgTable("streak_freezes", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  freezeCount: integer("freeze_count").default(0).notNull(),
  lastEarnedDate: varchar("last_earned_date", { length: 10 }), // YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StreakFreeze = typeof streakFreezes.$inferSelect;
export type InsertStreakFreeze = typeof streakFreezes.$inferInsert;
