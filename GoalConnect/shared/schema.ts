import { pgTable, serial, integer, text, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  cadence: varchar("cadence", { length: 10 }).notNull().$type<"daily" | "weekly">(),
});

export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id),
  userId: integer("user_id").notNull().references(() => users.id),
  date: varchar("date", { length: 10 }).notNull(),
  completed: boolean("completed").notNull().default(false),
  note: text("note"),
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
  name: text("name").notNull(),
  species: varchar("species", { length: 50 }).notNull().$type<"Gremlin">(),
  happiness: integer("happiness").notNull().default(100),
  health: integer("health").notNull().default(100),
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  currentCostumeId: integer("current_costume_id").references(() => costumes.id),
});

export const costumes = pgTable("costumes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: varchar("category", { length: 20 }).notNull().$type<"hat" | "outfit" | "accessory" | "background">(),
  price: integer("price").notNull(),
  imageUrl: text("image_url").notNull(),
  rarity: varchar("rarity", { length: 20 }).notNull().$type<"common" | "rare" | "epic" | "legendary">(),
});

export const userCostumes = pgTable("user_costumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  costumeId: integer("costume_id").notNull().references(() => costumes.id),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
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
  description: text("description").notNull().default(""),
  dueDate: varchar("due_date", { length: 10 }),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  points: integer("points").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TypeScript types inferred from tables
export type User = typeof users.$inferSelect;
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

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true });
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
