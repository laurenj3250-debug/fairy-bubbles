import { pgTable, serial, integer, text, boolean, timestamp, varchar, uniqueIndex, decimal, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Frequency type enum for flexible habit scheduling
export const frequencyTypeEnum = pgEnum('frequency_type', ['daily', 'weekly', 'custom']);

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
  // OLD FIELDS - Kept for backward compatibility during migration
  cadence: varchar("cadence", { length: 10 }).$type<"daily" | "weekly">(),
  targetPerWeek: integer("target_per_week"),
  // NEW FREQUENCY FIELDS - Flexible frequency model
  frequencyNumerator: integer("frequency_numerator"),
  frequencyDenominator: integer("frequency_denominator"),
  frequencyType: frequencyTypeEnum('frequency_type'),
  // NEW SCORING FIELDS - Habit strength tracking
  currentScore: decimal("current_score", { precision: 10, scale: 8 }).default('0').notNull(),
  scoreHistory: jsonb("score_history").$type<Array<{date: string, score: number, completed: boolean}>>().default([]).notNull(),
  difficulty: varchar("difficulty", { length: 10 }).notNull().default("medium").$type<"easy" | "medium" | "hard">(),
  linkedGoalId: integer("linked_goal_id").references(() => goals.id),
  // Weekly Hub fields
  category: varchar("category", { length: 20 }).default("training").$type<"training" | "mind" | "foundation" | "adventure">(),
  effort: varchar("effort", { length: 10 }).default("medium").$type<"light" | "medium" | "heavy">(),
  grade: text("grade").default("5.9"), // e.g., "5.9", "5.11"
  // Adventure scheduling
  scheduledDay: varchar("scheduled_day", { length: 10 }), // ISO date string (YYYY-MM-DD) for which day this week
  // CUMULATIVE GOALS - NEW
  goalType: varchar("goal_type", { length: 20 }).notNull().default("binary").$type<"binary" | "cumulative">(),
  targetValue: integer("target_value"), // "50 climbs by June"
  currentValue: integer("current_value").notNull().default(0), // Running total
  targetDate: varchar("target_date", { length: 10 }), // "2025-06-15"
  createdDate: varchar("created_date", { length: 10 }), // When goal was set (for external authority)
  isLocked: boolean("is_locked").notNull().default(false), // Prevent easy editing
  primaryGoalAchieved: boolean("primary_goal_achieved").notNull().default(false), // "Send 6b on kilter" achieved?
  primaryGoalAchievedDate: varchar("primary_goal_achieved_date", { length: 10 }), // When was it achieved
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
  // HYBRID LOGGING - Optional session details
  durationMinutes: integer("duration_minutes"), // "90 min session"
  quantityCompleted: integer("quantity_completed"), // "5 problems sent"
  sessionType: text("session_type"), // "outdoor", "gym", "home"
  incrementValue: integer("increment_value").notNull().default(1), // How much to add to currentValue
  // EXTERNAL DATA INTEGRATION - Track auto-completion source
  autoCompleteSource: varchar("auto_complete_source", { length: 20 }), // 'apple_watch', 'kilter_board', NULL
  linkedWorkoutId: integer("linked_workout_id").references(() => externalWorkouts.id, { onDelete: "set null" }),
  linkedSessionId: integer("linked_session_id").references(() => climbingSessions.id, { onDelete: "set null" }),
}, (table) => {
  return {
    habitUserDateIdx: uniqueIndex("habit_logs_habit_id_user_id_date_key").on(table.habitId, table.userId, table.date),
  };
});

// MULTI-METRICS - Track multiple dimensions of one habit
export const habitMetrics = pgTable("habit_metrics", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  metricType: varchar("metric_type", { length: 30 }).notNull().$type<"days" | "minutes" | "problems" | "trips" | "distance" | "lessons" | "cards" | "sessions" | "custom">(),
  label: text("label").notNull(), // "Days climbed", "Minutes", "Problems sent"
  unit: text("unit").notNull(), // "days", "min", "problems", "trips"
  targetValue: integer("target_value").notNull(), // 40 days, 2000 minutes, etc.
  currentValue: integer("current_value").notNull().default(0),
  color: text("color").notNull().default("#3b82f6"), // For progress bar
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

// Projects (organize tasks into projects/areas)
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  icon: text("icon").default("📁"),
  parentId: integer("parent_id").references((): any => projects.id, { onDelete: "set null" }),
  position: integer("position").notNull().default(0),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Labels (flexible tagging system)
export const labels = pgTable("labels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#gray"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Task-Label junction (many-to-many)
export const taskLabels = pgTable("task_labels", {
  taskId: integer("task_id").notNull().references(() => todos.id, { onDelete: "cascade" }),
  labelId: integer("label_id").notNull().references(() => labels.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: { name: "task_labels_pkey", columns: [table.taskId, table.labelId] }
}));

// Saved filters/views
export const savedFilters = pgTable("saved_filters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").default("🔍"),
  filterConfig: text("filter_config").notNull(), // JSON string
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Task comments
export const taskComments = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => todos.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Productivity stats
export const taskProductivityStats = pgTable("task_productivity_stats", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  karmaPoints: integer("karma_points").default(0).notNull(),
  tasksCompletedToday: integer("tasks_completed_today").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastCompletionDate: varchar("last_completion_date", { length: 10 }),
  totalCompleted: integer("total_completed").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  // New columns for Todoist-level features
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  priority: integer("priority").default(4).notNull(), // 1=P1 (urgent), 4=P4 (low)
  recurringPattern: text("recurring_pattern"), // cron-like pattern
  nextRecurrence: varchar("next_recurrence", { length: 10 }), // YYYY-MM-DD
  position: integer("position").default(0).notNull(),
  notes: text("notes"), // long-form notes
  parentTaskId: integer("parent_task_id").references((): any => todos.id, { onDelete: "cascade" }),
});

// TypeScript types inferred from tables
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Habit = typeof habits.$inferSelect;
export type HabitLog = typeof habitLogs.$inferSelect;
export type HabitMetric = typeof habitMetrics.$inferSelect;
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

export const insertHabitMetricSchema = createInsertSchema(habitMetrics).omit({ id: true, createdAt: true });
export type InsertHabitMetric = z.infer<typeof insertHabitMetricSchema>;

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

// Task Management types
export type Project = typeof projects.$inferSelect;
export type Label = typeof labels.$inferSelect;
export type TaskLabel = typeof taskLabels.$inferSelect;
export type SavedFilter = typeof savedFilters.$inferSelect;
export type TaskComment = typeof taskComments.$inferSelect;
export type TaskProductivityStats = typeof taskProductivityStats.$inferSelect;

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;

export const insertLabelSchema = createInsertSchema(labels).omit({ id: true, createdAt: true });
export type InsertLabel = z.infer<typeof insertLabelSchema>;

export const insertTaskLabelSchema = createInsertSchema(taskLabels).omit({ createdAt: true });
export type InsertTaskLabel = z.infer<typeof insertTaskLabelSchema>;

export const insertSavedFilterSchema = createInsertSchema(savedFilters).omit({ id: true, createdAt: true });
export type InsertSavedFilter = z.infer<typeof insertSavedFilterSchema>;

export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;


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
export type Sprite = typeof sprites.$inferSelect;
export type DreamScrollTag = typeof dreamScrollTags.$inferSelect;
export type DreamScrollItem = typeof dreamScrollItems.$inferSelect;

// Insert schemas
export const insertSpriteSchema = createInsertSchema(sprites).omit({ id: true, createdAt: true });
export const insertDreamScrollItemSchema = createInsertSchema(dreamScrollItems).omit({ id: true, createdAt: true, completedAt: true });

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
  currentMountainIndex: integer("current_mountain_index").notNull().default(1),

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

// Expedition Missions (Time-based habit challenges to unlock mountains)
export const expeditionMissions = pgTable("expedition_missions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mountainId: integer("mountain_id").notNull().references(() => mountains.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull()
    .$type<"active" | "completed" | "failed">(),

  // Mission parameters
  startDate: timestamp("start_date").defaultNow().notNull(),
  completionDate: timestamp("completion_date"),
  totalDays: integer("total_days").notNull(),
  currentDay: integer("current_day").notNull().default(1),
  requiredCompletionPercent: integer("required_completion_percent").notNull(), // 75, 80, 90, 100

  // Progress tracking
  daysCompleted: integer("days_completed").notNull().default(0),
  perfectDays: integer("perfect_days").notNull().default(0),
  totalHabitsCompleted: integer("total_habits_completed").notNull().default(0),
  totalHabitsPossible: integer("total_habits_possible").notNull().default(0),

  // Rewards earned (for completed missions)
  xpEarned: integer("xp_earned").default(0),
  pointsEarned: integer("points_earned").default(0),
  bonusesEarned: text("bonuses_earned").default("[]"), // JSON array of bonus types

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export type ExpeditionMission = typeof expeditionMissions.$inferSelect;

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

// ========== EXTERNAL DATA INTEGRATION ==========

// Source type enums
export const workoutSourceEnum = pgEnum('workout_source', ['apple_watch', 'strava', 'other']);
export const climbingSourceEnum = pgEnum('climbing_source', ['kilter_board', 'tension_board', 'moonboard']);
export const syncFrequencyEnum = pgEnum('sync_frequency', ['manual', 'daily', 'weekly']);
export const syncStatusEnum = pgEnum('sync_status', ['idle', 'syncing', 'error']);

// External Workouts - Imported from Apple Watch, Strava, etc.
export const externalWorkouts = pgTable("external_workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceType: workoutSourceEnum("source_type").notNull(),
  externalId: text("external_id").notNull(), // Unique ID from source for deduplication
  workoutType: text("workout_type").notNull(), // 'HKWorkoutActivityTypeClimbing', etc.
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  heartRateAvg: integer("heart_rate_avg"), // bpm
  heartRateMax: integer("heart_rate_max"), // bpm
  heartRateMin: integer("heart_rate_min"), // bpm
  caloriesBurned: integer("calories_burned"), // kcal
  distanceKm: decimal("distance_km", { precision: 10, scale: 2 }), // For cardio activities
  metadata: jsonb("metadata").default({}).notNull(), // Additional fields
  linkedHabitId: integer("linked_habit_id").references(() => habits.id, { onDelete: "set null" }),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Deduplication constraint
    userSourceExternalIdx: uniqueIndex("external_workouts_user_source_external_key").on(table.userId, table.sourceType, table.externalId),
  };
});

// Climbing Sessions - Kilter Board, Tension Board, etc.
export const climbingSessions = pgTable("climbing_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceType: climbingSourceEnum("source_type").notNull(),
  externalId: text("external_id").notNull(), // Composite of session date + source
  sessionDate: varchar("session_date", { length: 10 }).notNull(), // YYYY-MM-DD
  sessionStartTime: timestamp("session_start_time"),
  durationMinutes: integer("duration_minutes"),
  problemsAttempted: integer("problems_attempted").notNull().default(0),
  problemsSent: integer("problems_sent").notNull().default(0),
  averageGrade: varchar("average_grade", { length: 10 }), // 'V4', '6b', etc.
  maxGrade: varchar("max_grade", { length: 10 }), // Hardest send
  boardAngle: integer("board_angle"), // Degrees of overhang
  climbs: jsonb("climbs").default([]).notNull(), // Array of climb objects
  linkedHabitId: integer("linked_habit_id").references(() => habits.id, { onDelete: "set null" }),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Deduplication constraint
    userSourceExternalIdx: uniqueIndex("climbing_sessions_user_source_external_key").on(table.userId, table.sourceType, table.externalId),
  };
});

// Data Source Connections - Manage API credentials and sync config
export const dataSourceConnections = pgTable("data_source_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceType: varchar("source_type", { length: 20 }).notNull(), // 'kilter_board', 'apple_watch', 'strava'
  isActive: boolean("is_active").notNull().default(true),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: syncStatusEnum("sync_status").notNull().default("idle"),
  syncError: text("sync_error"), // Last error message if any
  credentials: jsonb("credentials"), // ENCRYPTED credentials
  syncFrequency: syncFrequencyEnum("sync_frequency").notNull().default("manual"),
  autoCompleteHabits: boolean("auto_complete_habits").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // One connection per source per user
    userSourceIdx: uniqueIndex("data_source_connections_user_source_key").on(table.userId, table.sourceType),
  };
});

// Habit Data Mappings - User-configured rules for matching external data to habits
export const habitDataMappings = pgTable("habit_data_mappings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  sourceType: varchar("source_type", { length: 20 }).notNull(), // 'apple_watch', 'kilter_board'
  matchCriteria: jsonb("match_criteria").notNull(), // { workoutType: 'Climbing', minDuration: 20 }
  autoComplete: boolean("auto_complete").notNull().default(true),
  autoIncrement: boolean("auto_increment").notNull().default(false), // For cumulative goals
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // One mapping per habit per source
    habitSourceIdx: uniqueIndex("habit_data_mappings_habit_source_key").on(table.habitId, table.sourceType),
  };
});

// TypeScript types for external data tables
export type ExternalWorkout = typeof externalWorkouts.$inferSelect;
export type ClimbingSession = typeof climbingSessions.$inferSelect;
export type DataSourceConnection = typeof dataSourceConnections.$inferSelect;
export type HabitDataMapping = typeof habitDataMappings.$inferSelect;

// Insert schemas
export const insertExternalWorkoutSchema = createInsertSchema(externalWorkouts).omit({ id: true, importedAt: true, createdAt: true });
export const insertClimbingSessionSchema = createInsertSchema(climbingSessions).omit({ id: true, importedAt: true, createdAt: true });
export const insertDataSourceConnectionSchema = createInsertSchema(dataSourceConnections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHabitDataMappingSchema = createInsertSchema(habitDataMappings).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertExternalWorkout = z.infer<typeof insertExternalWorkoutSchema>;
export type InsertClimbingSession = z.infer<typeof insertClimbingSessionSchema>;
export type InsertDataSourceConnection = z.infer<typeof insertDataSourceConnectionSchema>;
export type InsertHabitDataMapping = z.infer<typeof insertHabitDataMappingSchema>;
