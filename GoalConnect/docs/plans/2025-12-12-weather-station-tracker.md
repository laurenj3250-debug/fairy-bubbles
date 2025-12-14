# Weather Station (Mood/Variable Tracker) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a flexible check-in tracker where users define custom variables (mood, energy, sleep quality, etc.), log them whenever they want, and see patterns/correlations over time.

**Architecture:** Three-layer design: (1) Database schema for variables, entries, and tags (2) Express API routes following existing patterns (3) React pages with TanStack Query for data fetching, featuring check-in flow, visualizations (year-in-pixels, calendar heatmap, line charts), and insights (correlations, experiments, summaries).

**Tech Stack:** Drizzle ORM, PostgreSQL, Express.js, React, TanStack Query, Recharts, Tailwind CSS, Radix UI

---

## Phase 1: Database Schema

### Task 1: Add Weather Station Schema to shared/schema.ts

**Files:**
- Modify: `shared/schema.ts` (append after line ~1204)

**Step 1: Add variable type enum**

```typescript
// ========== WEATHER STATION (MOOD/VARIABLE TRACKER) ==========
// Flexible check-in tracker with custom variables, visualizations, and insights

export const trackerVariableTypeEnum = pgEnum('tracker_variable_type', ['emoji', 'slider', 'quick_tap']);
```

**Step 2: Add tracker variables table**

```typescript
// User-defined trackable variables (mood, energy, sleep quality, etc.)
export const trackerVariables = pgTable("tracker_variables", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Mood", "Energy", "Sleep Quality"
  type: trackerVariableTypeEnum("type").notNull(),
  // For emoji type: JSON array of emoji options like ["😊", "😐", "😢"]
  // For quick_tap type: JSON array of labels like ["Low", "Medium", "High"]
  // For slider type: { min: 1, max: 10, step: 1 }
  options: jsonb("options").notNull(),
  color: text("color").notNull().default("#3b82f6"), // For visualization
  icon: text("icon"), // Optional icon/emoji for the variable
  isArchived: boolean("is_archived").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Step 3: Add tracker entries table**

```typescript
// Individual check-in entries
export const trackerEntries = pgTable("tracker_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Values stored as JSON: { variableId: value, ... }
  // e.g., { "1": "😊", "2": 7, "3": "Medium" }
  values: jsonb("values").notNull().$type<Record<string, string | number>>(),
  // Tags as JSON array of strings
  tags: jsonb("tags").default([]).notNull().$type<string[]>(),
  note: text("note"), // Optional note
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Step 4: Add tracker experiments table**

```typescript
// Custom experiments to test if X affects Y
export const trackerExperiments = pgTable("tracker_experiments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Does caffeine affect my sleep?"
  factorType: varchar("factor_type", { length: 20 }).notNull().$type<"tag" | "variable">(),
  factorValue: text("factor_value").notNull(), // Tag name or variable ID
  targetVariableId: integer("target_variable_id").notNull().references(() => trackerVariables.id, { onDelete: "cascade" }),
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }),
  status: varchar("status", { length: 20 }).notNull().default("active").$type<"active" | "completed" | "cancelled">(),
  // Results calculated when enough data (JSON)
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Step 5: Add TypeScript types and insert schemas**

```typescript
// TypeScript types
export type TrackerVariable = typeof trackerVariables.$inferSelect;
export type TrackerEntry = typeof trackerEntries.$inferSelect;
export type TrackerExperiment = typeof trackerExperiments.$inferSelect;
export type InsertTrackerVariable = typeof trackerVariables.$inferInsert;
export type InsertTrackerEntry = typeof trackerEntries.$inferInsert;
export type InsertTrackerExperiment = typeof trackerExperiments.$inferInsert;

// Insert schemas
export const insertTrackerVariableSchema = createInsertSchema(trackerVariables).omit({
  id: true,
  createdAt: true,
});

export const insertTrackerEntrySchema = createInsertSchema(trackerEntries).omit({
  id: true,
  createdAt: true,
});

export const insertTrackerExperimentSchema = createInsertSchema(trackerExperiments).omit({
  id: true,
  createdAt: true,
});
```

**Step 6: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: add Weather Station tracker schema (variables, entries, experiments)"
```

---

### Task 2: Create Database Migration

**Files:**
- Create: `migrations/XXXX_add_weather_station.sql`

**Step 1: Generate migration with drizzle-kit**

Run: `npm run db:push`

This will apply the schema changes directly. If you need a migration file:

```sql
-- Create tracker variable type enum
CREATE TYPE tracker_variable_type AS ENUM ('emoji', 'slider', 'quick_tap');

-- Create tracker_variables table
CREATE TABLE IF NOT EXISTS tracker_variables (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type tracker_variable_type NOT NULL,
  options JSONB NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create tracker_entries table
CREATE TABLE IF NOT EXISTS tracker_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  values JSONB NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create tracker_experiments table
CREATE TABLE IF NOT EXISTS tracker_experiments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  factor_type VARCHAR(20) NOT NULL,
  factor_value TEXT NOT NULL,
  target_variable_id INTEGER NOT NULL REFERENCES tracker_variables(id) ON DELETE CASCADE,
  start_date VARCHAR(10) NOT NULL,
  end_date VARCHAR(10),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  results JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_tracker_variables_user ON tracker_variables(user_id);
CREATE INDEX idx_tracker_entries_user ON tracker_entries(user_id);
CREATE INDEX idx_tracker_entries_created ON tracker_entries(created_at);
CREATE INDEX idx_tracker_experiments_user ON tracker_experiments(user_id);
```

**Step 2: Run migration**

Run: `npm run db:push`

**Step 3: Verify tables exist**

Run: `psql $DATABASE_URL -c "\dt tracker_*"`
Expected: 3 tables listed

**Step 4: Commit**

```bash
git add migrations/
git commit -m "feat: add Weather Station database migration"
```

---

## Phase 2: Storage Layer

### Task 3: Add Storage Methods

**Files:**
- Modify: `server/storage.ts`

**Step 1: Add tracker variable CRUD methods**

Find the storage interface and add:

```typescript
// Weather Station (Tracker) methods
async createTrackerVariable(data: InsertTrackerVariable): Promise<TrackerVariable> {
  const db = getDb();
  const [variable] = await db.insert(schema.trackerVariables).values(data).returning();
  return variable;
}

async getTrackerVariables(userId: number): Promise<TrackerVariable[]> {
  const db = getDb();
  return db.select().from(schema.trackerVariables)
    .where(and(
      eq(schema.trackerVariables.userId, userId),
      eq(schema.trackerVariables.isArchived, false)
    ))
    .orderBy(schema.trackerVariables.position);
}

async updateTrackerVariable(id: number, userId: number, data: Partial<InsertTrackerVariable>): Promise<TrackerVariable | null> {
  const db = getDb();
  const [updated] = await db.update(schema.trackerVariables)
    .set(data)
    .where(and(
      eq(schema.trackerVariables.id, id),
      eq(schema.trackerVariables.userId, userId)
    ))
    .returning();
  return updated || null;
}

async deleteTrackerVariable(id: number, userId: number): Promise<boolean> {
  const db = getDb();
  const result = await db.delete(schema.trackerVariables)
    .where(and(
      eq(schema.trackerVariables.id, id),
      eq(schema.trackerVariables.userId, userId)
    ));
  return (result.rowCount ?? 0) > 0;
}
```

**Step 2: Add tracker entry methods**

```typescript
async createTrackerEntry(data: InsertTrackerEntry): Promise<TrackerEntry> {
  const db = getDb();
  const [entry] = await db.insert(schema.trackerEntries).values(data).returning();
  return entry;
}

async getTrackerEntries(userId: number, startDate?: string, endDate?: string): Promise<TrackerEntry[]> {
  const db = getDb();
  let query = db.select().from(schema.trackerEntries)
    .where(eq(schema.trackerEntries.userId, userId));

  if (startDate && endDate) {
    query = query.where(and(
      eq(schema.trackerEntries.userId, userId),
      sql`${schema.trackerEntries.createdAt} >= ${startDate}::timestamp`,
      sql`${schema.trackerEntries.createdAt} <= ${endDate}::timestamp + interval '1 day'`
    ));
  }

  return query.orderBy(sql`${schema.trackerEntries.createdAt} DESC`);
}

async getTrackerEntriesByDate(userId: number, date: string): Promise<TrackerEntry[]> {
  const db = getDb();
  return db.select().from(schema.trackerEntries)
    .where(and(
      eq(schema.trackerEntries.userId, userId),
      sql`DATE(${schema.trackerEntries.createdAt}) = ${date}::date`
    ))
    .orderBy(sql`${schema.trackerEntries.createdAt} DESC`);
}

async deleteTrackerEntry(id: number, userId: number): Promise<boolean> {
  const db = getDb();
  const result = await db.delete(schema.trackerEntries)
    .where(and(
      eq(schema.trackerEntries.id, id),
      eq(schema.trackerEntries.userId, userId)
    ));
  return (result.rowCount ?? 0) > 0;
}

async getTrackerTags(userId: number): Promise<string[]> {
  const db = getDb();
  const entries = await db.select({ tags: schema.trackerEntries.tags })
    .from(schema.trackerEntries)
    .where(eq(schema.trackerEntries.userId, userId));

  const allTags = new Set<string>();
  entries.forEach(e => {
    (e.tags as string[]).forEach(tag => allTags.add(tag));
  });
  return Array.from(allTags).sort();
}
```

**Step 3: Add tracker experiment methods**

```typescript
async createTrackerExperiment(data: InsertTrackerExperiment): Promise<TrackerExperiment> {
  const db = getDb();
  const [experiment] = await db.insert(schema.trackerExperiments).values(data).returning();
  return experiment;
}

async getTrackerExperiments(userId: number): Promise<TrackerExperiment[]> {
  const db = getDb();
  return db.select().from(schema.trackerExperiments)
    .where(eq(schema.trackerExperiments.userId, userId))
    .orderBy(sql`${schema.trackerExperiments.createdAt} DESC`);
}

async updateTrackerExperiment(id: number, userId: number, data: Partial<TrackerExperiment>): Promise<TrackerExperiment | null> {
  const db = getDb();
  const [updated] = await db.update(schema.trackerExperiments)
    .set(data)
    .where(and(
      eq(schema.trackerExperiments.id, id),
      eq(schema.trackerExperiments.userId, userId)
    ))
    .returning();
  return updated || null;
}
```

**Step 4: Commit**

```bash
git add server/storage.ts
git commit -m "feat: add Weather Station storage layer methods"
```

---

## Phase 3: API Routes

### Task 4: Create Tracker API Routes

**Files:**
- Create: `server/routes/tracker.ts`
- Modify: `server/routes.ts` (register routes)

**Step 1: Create tracker routes file**

```typescript
// server/routes/tracker.ts
import type { Express } from "express";
import { storage } from "../storage";
import { requireUser } from "../simple-auth";
import { insertTrackerVariableSchema, insertTrackerEntrySchema, insertTrackerExperimentSchema } from "@shared/schema";
import { z } from "zod";

function getUserId(req: any): number {
  return requireUser(req).id;
}

export function registerTrackerRoutes(app: Express) {
  // ========== VARIABLES ==========

  // GET /api/tracker/variables - Get user's tracker variables
  app.get("/api/tracker/variables", async (req, res) => {
    try {
      const userId = getUserId(req);
      const variables = await storage.getTrackerVariables(userId);
      res.json(variables);
    } catch (error) {
      console.error("Error fetching tracker variables:", error);
      res.status(500).json({ error: "Failed to fetch tracker variables" });
    }
  });

  // POST /api/tracker/variables - Create a new variable
  app.post("/api/tracker/variables", async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertTrackerVariableSchema.parse({ ...req.body, userId });
      const variable = await storage.createTrackerVariable(data);
      res.json(variable);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating tracker variable:", error);
      res.status(500).json({ error: "Failed to create tracker variable" });
    }
  });

  // PATCH /api/tracker/variables/:id - Update a variable
  app.patch("/api/tracker/variables/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const updated = await storage.updateTrackerVariable(id, userId, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Variable not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating tracker variable:", error);
      res.status(500).json({ error: "Failed to update tracker variable" });
    }
  });

  // DELETE /api/tracker/variables/:id - Delete (archive) a variable
  app.delete("/api/tracker/variables/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Soft delete by archiving
      const updated = await storage.updateTrackerVariable(id, userId, { isArchived: true });
      if (!updated) {
        return res.status(404).json({ error: "Variable not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tracker variable:", error);
      res.status(500).json({ error: "Failed to delete tracker variable" });
    }
  });

  // ========== ENTRIES ==========

  // GET /api/tracker/entries - Get entries (optional date range)
  app.get("/api/tracker/entries", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { startDate, endDate, date } = req.query;

      if (date) {
        const entries = await storage.getTrackerEntriesByDate(userId, date as string);
        return res.json(entries);
      }

      const entries = await storage.getTrackerEntries(
        userId,
        startDate as string | undefined,
        endDate as string | undefined
      );
      res.json(entries);
    } catch (error) {
      console.error("Error fetching tracker entries:", error);
      res.status(500).json({ error: "Failed to fetch tracker entries" });
    }
  });

  // POST /api/tracker/entries - Create a new entry
  app.post("/api/tracker/entries", async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertTrackerEntrySchema.parse({ ...req.body, userId });
      const entry = await storage.createTrackerEntry(data);
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating tracker entry:", error);
      res.status(500).json({ error: "Failed to create tracker entry" });
    }
  });

  // DELETE /api/tracker/entries/:id - Delete an entry
  app.delete("/api/tracker/entries/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTrackerEntry(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tracker entry:", error);
      res.status(500).json({ error: "Failed to delete tracker entry" });
    }
  });

  // GET /api/tracker/tags - Get user's previously used tags
  app.get("/api/tracker/tags", async (req, res) => {
    try {
      const userId = getUserId(req);
      const tags = await storage.getTrackerTags(userId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tracker tags:", error);
      res.status(500).json({ error: "Failed to fetch tracker tags" });
    }
  });

  // ========== EXPERIMENTS ==========

  // GET /api/tracker/experiments - Get user's experiments
  app.get("/api/tracker/experiments", async (req, res) => {
    try {
      const userId = getUserId(req);
      const experiments = await storage.getTrackerExperiments(userId);
      res.json(experiments);
    } catch (error) {
      console.error("Error fetching tracker experiments:", error);
      res.status(500).json({ error: "Failed to fetch tracker experiments" });
    }
  });

  // POST /api/tracker/experiments - Create a new experiment
  app.post("/api/tracker/experiments", async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertTrackerExperimentSchema.parse({ ...req.body, userId });
      const experiment = await storage.createTrackerExperiment(data);
      res.json(experiment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating tracker experiment:", error);
      res.status(500).json({ error: "Failed to create tracker experiment" });
    }
  });

  // PATCH /api/tracker/experiments/:id - Update an experiment
  app.patch("/api/tracker/experiments/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const updated = await storage.updateTrackerExperiment(id, userId, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Experiment not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating tracker experiment:", error);
      res.status(500).json({ error: "Failed to update tracker experiment" });
    }
  });

  // ========== INSIGHTS ==========

  // GET /api/tracker/insights/correlations - Calculate correlations
  app.get("/api/tracker/insights/correlations", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { variableId, days = "30" } = req.query;

      // Get entries for the time period
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000)
        .toISOString().split("T")[0];

      const entries = await storage.getTrackerEntries(userId, startDate, endDate);
      const variables = await storage.getTrackerVariables(userId);

      // Calculate correlations between variables and tags
      const correlations = calculateCorrelations(entries, variables, variableId as string | undefined);

      res.json(correlations);
    } catch (error) {
      console.error("Error calculating correlations:", error);
      res.status(500).json({ error: "Failed to calculate correlations" });
    }
  });

  // GET /api/tracker/insights/summary - Weekly/monthly summary
  app.get("/api/tracker/insights/summary", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { period = "week" } = req.query;

      const days = period === "month" ? 30 : 7;
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().split("T")[0];

      const entries = await storage.getTrackerEntries(userId, startDate, endDate);
      const variables = await storage.getTrackerVariables(userId);

      const summary = calculateSummary(entries, variables, period as string);

      res.json(summary);
    } catch (error) {
      console.error("Error calculating summary:", error);
      res.status(500).json({ error: "Failed to calculate summary" });
    }
  });
}

// Helper function to calculate correlations
function calculateCorrelations(
  entries: any[],
  variables: any[],
  targetVariableId?: string
) {
  // Group entries by date
  const entriesByDate = new Map<string, any[]>();
  entries.forEach(entry => {
    const date = new Date(entry.createdAt).toISOString().split("T")[0];
    if (!entriesByDate.has(date)) {
      entriesByDate.set(date, []);
    }
    entriesByDate.get(date)!.push(entry);
  });

  // Calculate tag correlations
  const tagCorrelations: Record<string, { withTag: number; withoutTag: number; count: number }> = {};
  const allTags = new Set<string>();
  entries.forEach(e => (e.tags as string[]).forEach(t => allTags.add(t)));

  // For each tag, calculate average value of target variable
  allTags.forEach(tag => {
    const withTag: number[] = [];
    const withoutTag: number[] = [];

    entriesByDate.forEach((dayEntries) => {
      const hasTag = dayEntries.some((e: any) => (e.tags as string[]).includes(tag));
      const values = dayEntries.flatMap((e: any) => {
        if (targetVariableId) {
          const val = e.values[targetVariableId];
          return typeof val === "number" ? [val] : [];
        }
        return Object.values(e.values).filter((v): v is number => typeof v === "number");
      });

      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        if (hasTag) {
          withTag.push(avg);
        } else {
          withoutTag.push(avg);
        }
      }
    });

    if (withTag.length >= 3 && withoutTag.length >= 3) {
      tagCorrelations[tag] = {
        withTag: withTag.reduce((a, b) => a + b, 0) / withTag.length,
        withoutTag: withoutTag.reduce((a, b) => a + b, 0) / withoutTag.length,
        count: withTag.length,
      };
    }
  });

  return {
    tagCorrelations,
    totalEntries: entries.length,
    daysTracked: entriesByDate.size,
  };
}

// Helper function to calculate summary
function calculateSummary(entries: any[], variables: any[], period: string) {
  const variableStats: Record<string, { avg: number; min: number; max: number; trend: string }> = {};

  variables.forEach(variable => {
    const values = entries.flatMap(e => {
      const val = e.values[variable.id.toString()];
      return typeof val === "number" ? [val] : [];
    });

    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));

      const firstAvg = firstHalf.length > 0
        ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        : avg;
      const secondAvg = secondHalf.length > 0
        ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
        : avg;

      let trend = "stable";
      if (secondAvg > firstAvg * 1.1) trend = "up";
      else if (secondAvg < firstAvg * 0.9) trend = "down";

      variableStats[variable.id] = {
        avg: Math.round(avg * 10) / 10,
        min: Math.min(...values),
        max: Math.max(...values),
        trend,
      };
    }
  });

  // Calculate top tags
  const tagCounts: Record<string, number> = {};
  entries.forEach(e => {
    (e.tags as string[]).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  return {
    period,
    totalEntries: entries.length,
    variableStats,
    topTags,
    entriesPerDay: entries.length / (period === "month" ? 30 : 7),
  };
}
```

**Step 2: Register routes in routes.ts**

Add import at top:
```typescript
import { registerTrackerRoutes } from "./routes/tracker";
```

Add registration in `registerRoutes` function:
```typescript
registerTrackerRoutes(app);
```

**Step 3: Test API endpoints**

Run: `npm run dev`

Test with curl:
```bash
# Get variables (should be empty)
curl http://localhost:5001/api/tracker/variables

# Create a variable
curl -X POST http://localhost:5001/api/tracker/variables \
  -H "Content-Type: application/json" \
  -d '{"name":"Mood","type":"emoji","options":["😊","😐","😢","😡","😴"],"color":"#3b82f6"}'
```

**Step 4: Commit**

```bash
git add server/routes/tracker.ts server/routes.ts
git commit -m "feat: add Weather Station API routes"
```

---

## Phase 4: React Hook

### Task 5: Create useTracker Hook

**Files:**
- Create: `client/src/hooks/useTracker.ts`

**Step 1: Create the hook**

```typescript
// client/src/hooks/useTracker.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TrackerVariable,
  TrackerEntry,
  TrackerExperiment,
  InsertTrackerVariable,
  InsertTrackerEntry,
  InsertTrackerExperiment
} from "@shared/schema";

const API_BASE = "/api/tracker";

// ========== Variables ==========

export function useTrackerVariables() {
  return useQuery<TrackerVariable[]>({
    queryKey: ["tracker", "variables"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/variables`);
      if (!res.ok) throw new Error("Failed to fetch variables");
      return res.json();
    },
  });
}

export function useCreateTrackerVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<InsertTrackerVariable, "userId">) => {
      const res = await fetch(`${API_BASE}/variables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create variable");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracker", "variables"] });
    },
  });
}

export function useUpdateTrackerVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<TrackerVariable>) => {
      const res = await fetch(`${API_BASE}/variables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update variable");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracker", "variables"] });
    },
  });
}

export function useDeleteTrackerVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/variables/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete variable");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracker", "variables"] });
    },
  });
}

// ========== Entries ==========

export function useTrackerEntries(options?: { startDate?: string; endDate?: string; date?: string }) {
  const params = new URLSearchParams();
  if (options?.startDate) params.set("startDate", options.startDate);
  if (options?.endDate) params.set("endDate", options.endDate);
  if (options?.date) params.set("date", options.date);

  return useQuery<TrackerEntry[]>({
    queryKey: ["tracker", "entries", options],
    queryFn: async () => {
      const url = params.toString()
        ? `${API_BASE}/entries?${params}`
        : `${API_BASE}/entries`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch entries");
      return res.json();
    },
  });
}

export function useCreateTrackerEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<InsertTrackerEntry, "userId">) => {
      const res = await fetch(`${API_BASE}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracker", "entries"] });
      queryClient.invalidateQueries({ queryKey: ["tracker", "insights"] });
    },
  });
}

export function useDeleteTrackerEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/entries/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracker", "entries"] });
      queryClient.invalidateQueries({ queryKey: ["tracker", "insights"] });
    },
  });
}

// ========== Tags ==========

export function useTrackerTags() {
  return useQuery<string[]>({
    queryKey: ["tracker", "tags"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/tags`);
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json();
    },
  });
}

// ========== Experiments ==========

export function useTrackerExperiments() {
  return useQuery<TrackerExperiment[]>({
    queryKey: ["tracker", "experiments"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/experiments`);
      if (!res.ok) throw new Error("Failed to fetch experiments");
      return res.json();
    },
  });
}

export function useCreateTrackerExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<InsertTrackerExperiment, "userId">) => {
      const res = await fetch(`${API_BASE}/experiments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create experiment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracker", "experiments"] });
    },
  });
}

// ========== Insights ==========

export function useTrackerCorrelations(variableId?: number, days = 30) {
  const params = new URLSearchParams({ days: days.toString() });
  if (variableId) params.set("variableId", variableId.toString());

  return useQuery({
    queryKey: ["tracker", "insights", "correlations", variableId, days],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/insights/correlations?${params}`);
      if (!res.ok) throw new Error("Failed to fetch correlations");
      return res.json();
    },
  });
}

export function useTrackerSummary(period: "week" | "month" = "week") {
  return useQuery({
    queryKey: ["tracker", "insights", "summary", period],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/insights/summary?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });
}
```

**Step 2: Commit**

```bash
git add client/src/hooks/useTracker.ts
git commit -m "feat: add useTracker React hook for Weather Station"
```

---

## Phase 5: UI Components

### Task 6: Create Check-in Components

**Files:**
- Create: `client/src/components/tracker/TrackerCheckIn.tsx`
- Create: `client/src/components/tracker/VariableInput.tsx`
- Create: `client/src/components/tracker/TagInput.tsx`

(This task will be detailed in the frontend-design skill phase)

### Task 7: Create Visualization Components

**Files:**
- Create: `client/src/components/tracker/YearInPixels.tsx`
- Create: `client/src/components/tracker/CalendarHeatmap.tsx`
- Create: `client/src/components/tracker/TrackerLineChart.tsx`
- Create: `client/src/components/tracker/WeekdayBreakdown.tsx`

(This task will be detailed in the frontend-design skill phase)

### Task 8: Create Insights Components

**Files:**
- Create: `client/src/components/tracker/CorrelationInsights.tsx`
- Create: `client/src/components/tracker/WeeklySummary.tsx`
- Create: `client/src/components/tracker/ExperimentCard.tsx`

(This task will be detailed in the frontend-design skill phase)

---

## Phase 6: Pages

### Task 9: Create Weather Station Page

**Files:**
- Create: `client/src/pages/WeatherStation.tsx`
- Modify: `client/src/App.tsx` (add route)

(This task will be detailed in the frontend-design skill phase)

### Task 10: Create Variable Settings Page

**Files:**
- Create: `client/src/pages/TrackerSettings.tsx`

(This task will be detailed in the frontend-design skill phase)

---

## Phase 7: Navigation

### Task 11: Add Navigation Link

**Files:**
- Modify: Navigation component (location TBD based on existing nav)

Add "Weather Station" link to main navigation with climbing-themed icon.

---

## Summary

**Total Tasks:** 11 (5 backend, 6 frontend)

**Phases:**
1. Database Schema (Tasks 1-2)
2. Storage Layer (Task 3)
3. API Routes (Task 4)
4. React Hook (Task 5)
5. UI Components (Tasks 6-8) - requires frontend-design skill
6. Pages (Tasks 9-10) - requires frontend-design skill
7. Navigation (Task 11)

**Backend First Approach:**
- Tasks 1-5 can be completed immediately
- Tasks 6-11 require the frontend-design skill for proper UI design

---

## Implementation Order

1. **Immediate** (backend): Tasks 1-5
2. **Then** (frontend-design skill): Tasks 6-10
3. **Finally**: Task 11 + code-review
