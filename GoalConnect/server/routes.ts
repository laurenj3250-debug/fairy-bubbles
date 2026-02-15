import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ensureDatabaseInitialized } from "./init-db";
import { log } from "./lib/logger";
import { getDb, getPool } from "./db";
import { eq, sql, and } from "drizzle-orm";
import * as schema from "@shared/schema";
import {
  insertHabitSchema,
  insertHabitLogSchema,
  insertGoalSchema,
  insertGoalUpdateSchema,
  insertUserSettingsSchema,
  insertPointTransactionSchema,
  insertTodoSchema,
} from "@shared/schema";
import {
  calculateStreak,
  calculateWeeklyCompletion,
} from "./pet-utils";
import { requireUser } from "./simple-auth";
import multer from "multer";
import path from "path";
import AdmZip from "adm-zip";
import fs from "fs";
import { calculateMissionParameters, calculateBaseXP, calculateBasePoints } from "./mission-calculator";
import { registerProjectRoutes } from "./routes/projects";
import { registerLabelRoutes } from "./routes/labels";
import { registerTodosEnhancedRoutes } from "./routes/todos-enhanced";
import { registerRecurrenceRoutes } from "./routes/recurrence";
import { registerHabitRoutes } from "./routes/habits";
import { registerGoalRoutes } from "./routes/goals";
import { registerImportRoutes } from "./routes/import";
import { registerKilterBoardRoutes } from "./routes/kilter-board";
import { registerStravaRoutes } from "./routes/strava";
import { registerHabitMappingRoutes } from "./routes/habit-mappings";
import { registerPointRoutes } from "./routes/points";
import { registerJourneyGoalRoutes } from "./routes/journey-goals";
import { registerClimbingLogRoutes } from "./routes/climbing-log";
import { registerLiftingRoutes } from "./routes/lifting";
import { registerMoodRoutes } from "./routes/mood";
import { registerResidencyRoutes } from "./routes/residency";
import { registerYearlyGoalRoutes } from "./routes/yearly-goals";
import { registerGoalCalendarRoutes } from "./routes/goal-calendar";
import { registerMediaLibraryRoutes } from "./routes/media-library";
import { registerAdventuresRoutes } from "./routes/adventures";
import { registerRecentActivitiesRoutes } from "./routes/recent-activities";
import { registerRewardRoutes } from "./routes/rewards";
import { XP_CONFIG } from "@shared/xp-config";
import {
  DatabaseError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  getErrorMessage,
  formatErrorForLogging
} from "./errors";
import { parseNumericId, validateNumericId } from "./validation";
import { sendError, asyncHandler } from "./error-handler";
import { awardDailyBonusIfNeeded } from "./services/dailyBonus";

const getUserId = (req: Request) => requireUser(req).id;

// Configure multer for sprite uploads
const spriteStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'sprites', 'unsorted');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: spriteStorage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /png|jpg|jpeg|psd|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) ||
                     file.mimetype === 'image/vnd.adobe.photoshop' ||
                     file.mimetype === 'application/zip' ||
                     file.mimetype === 'application/x-zip-compressed';

    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, PSD, and ZIP files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    await ensureDatabaseInitialized();
  } catch (error) {
    const errorLog = formatErrorForLogging(error);
    log.error("[routes] Database initialization check failed:", errorLog);
    throw new DatabaseError(getErrorMessage(error), "ensureDatabaseInitialized");
  }

  // Habit routes moved to routes/habits.ts
  app.get("/api/settings", async (req, res) => {
    try {
      const userId = getUserId(req);
      let settings = await storage.getUserSettings(userId);
      if (!settings) {
        settings = await storage.updateUserSettings({
          userId,
          darkMode: true,
          notifications: true,
        });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertUserSettingsSchema.parse({ ...req.body, userId });
      const settings = await storage.updateUserSettings(validated);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) || "Invalid settings data" });
    }
  });

  app.get("/api/export", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getHabits(userId);
      const goals = await storage.getGoals(userId);
      
      const allLogs = await Promise.all(
        habits.map(h => storage.getHabitLogs(h.id))
      );
      const habitLogs = allLogs.flat();
      
      const allUpdates = await Promise.all(
        goals.map(g => storage.getGoalUpdates(g.id))
      );
      const goalUpdates = allUpdates.flat();
      
      const exportData = {
        habits,
        habitLogs,
        goals,
        goalUpdates,
        exportedAt: new Date().toISOString(),
      };
      
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Stats endpoint for dashboard
  app.get("/api/stats", async (req, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getHabits(userId);
      const allLogs = await storage.getAllHabitLogs(userId);

      const currentStreak = calculateStreak(allLogs);
      const weeklyCompletion = calculateWeeklyCompletion(habits, allLogs);

      res.json({
        currentStreak,
        weeklyCompletion,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Points Routes
  app.get("/api/points", async (req, res) => {
    try {
      const userId = getUserId(req);
      const points = await storage.getUserPoints(userId);
      res.json(points);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch points" });
    }
  });

  // Alias for user points
  app.get("/api/user-points", async (req, res) => {
    try {
      const userId = getUserId(req);
      const points = await storage.getUserPoints(userId);
      res.json(points);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch points" });
    }
  });

  app.get("/api/points/transactions", async (req, res) => {
    try {
      const userId = getUserId(req);
      const transactions = await storage.getPointTransactions(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/todos", async (req, res) => {
    try {
      const userId = getUserId(req);
      const todos = await storage.getTodos(userId);
      res.json(todos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  });

  // Get abandoned todos (created 90+ days ago and not completed)
  app.get("/api/todos/abandoned", async (req, res) => {
    try {
      const userId = getUserId(req);
      const todos = await storage.getTodos(userId);

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Filter incomplete todos that are older than 90 days
      const abandonedTodos = todos.filter(todo => {
        if (todo.completed) return false;
        if (!todo.createdAt) return false;

        const createdDate = new Date(todo.createdAt);
        return createdDate < ninetyDaysAgo;
      });

      res.json(abandonedTodos);
    } catch (error) {
      res.status(500).json({ error: getErrorMessage(error) || "Failed to fetch abandoned todos" });
    }
  });

  app.get("/api/todos/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const todo = await storage.getTodo(id);
      if (!todo) {
        return res.status(404).json({ error: "Todo not found" });
      }
      // Verify ownership
      if (todo.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(todo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch todo" });
    }
  });

  app.post("/api/todos", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertTodoSchema.parse({ ...req.body, userId });
      const todo = await storage.createTodo(validated);
      res.status(201).json(todo);
    } catch (error) {
      console.error("[POST /api/todos] Error:", error);
      if (error instanceof Error) {
        if (error.message === "User not authenticated") {
          return res.status(401).json({ error: "Not authenticated" });
        }
        if (error.name === "ZodError") {
          return res.status(400).json({ error: "Invalid todo data", details: (error as any).errors });
        }
      }
      res.status(500).json({ error: "Failed to create todo" });
    }
  });

  app.patch("/api/todos/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before update
      const existing = await storage.getTodo(id);
      if (!existing) {
        return res.status(404).json({ error: "Todo not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const updated = await storage.updateTodo(id, req.body);

      // Auto-increment linked goal progress when task is toggled to completed
      const wasJustCompleted = req.body.completed === true && !existing.completed;
      if (wasJustCompleted && updated?.goalId) {
        try {
          const goal = await storage.getGoal(updated.goalId);
          if (goal && goal.currentValue < goal.targetValue) {
            await storage.updateGoal(updated.goalId, {
              currentValue: goal.currentValue + 1,
            });
            log.debug(`[todos] Auto-incremented goal ${updated.goalId} progress for task ${id}: ${goal.currentValue} -> ${goal.currentValue + 1}`);
          }
        } catch (goalError) {
          log.error('[todos] Failed to auto-increment goal progress:', goalError);
        }
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid todo data", details: (error as any).errors });
      }
      res.status(500).json({ error: "Failed to update todo" });
    }
  });

  app.post("/api/todos/:id/complete", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before completing
      const existing = await storage.getTodo(id);
      if (!existing) {
        return res.status(404).json({ error: "Todo not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const completed = await storage.completeTodo(id);

      // Auto-increment linked goal progress when task is completed
      if (completed?.goalId && !existing.completed) {
        try {
          const goal = await storage.getGoal(completed.goalId);
          if (goal && goal.currentValue < goal.targetValue) {
            await storage.updateGoal(completed.goalId, {
              currentValue: goal.currentValue + 1,
            });
            log.debug(`[todos] Auto-incremented goal ${completed.goalId} progress for task ${id}: ${goal.currentValue} -> ${goal.currentValue + 1}`);
          }
        } catch (goalError) {
          log.error('[todos] Failed to auto-increment goal progress:', goalError);
          // Don't fail the request, task was still completed
        }
      }

      // Award XP on todo completion (only if transitioning from incomplete → complete)
      let pointsEarned = 0;
      if (!existing.completed) {
        try {
          await storage.addPoints(userId, XP_CONFIG.todo, 'todo_complete', id,
            `Completed task: ${existing.title || 'Untitled'}`
          );
          pointsEarned = XP_CONFIG.todo;
        } catch (xpError) {
          log.error('[todos] Todo XP award failed:', xpError);
        }

        try {
          await awardDailyBonusIfNeeded(userId);
        } catch (bonusError) {
          log.error('[todos] Daily bonus failed:', bonusError);
        }
      }

      res.json({ ...completed, pointsEarned });
    } catch (error) {
      res.status(500).json({ error: "Failed to complete todo" });
    }
  });

  app.delete("/api/todos/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      // Verify ownership before delete
      const existing = await storage.getTodo(id);
      if (!existing) {
        return res.status(404).json({ error: "Todo not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const deleted = await storage.deleteTodo(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete todo" });
    }
  });

  // Reorder todos (drag & drop)
  app.patch("/api/todos/reorder", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { activeId, overId } = req.body;

      if (!activeId || !overId) {
        return res.status(400).json({ error: "Missing activeId or overId" });
      }

      const db = getDb();

      // Get all todos for this user, ordered by current position
      const userTodos = await db
        .select()
        .from(schema.todos)
        .where(eq(schema.todos.userId, userId))
        .orderBy(schema.todos.position);

      // Find the indices of the active and over items
      const activeIndex = userTodos.findIndex(t => t.id === activeId);
      const overIndex = userTodos.findIndex(t => t.id === overId);

      if (activeIndex === -1 || overIndex === -1) {
        return res.status(404).json({ error: "Todo not found" });
      }

      // Reorder the array
      const reorderedTodos = [...userTodos];
      const [movedItem] = reorderedTodos.splice(activeIndex, 1);
      reorderedTodos.splice(overIndex, 0, movedItem);

      // Update positions in database using a transaction
      await db.transaction(async (tx) => {
        for (let i = 0; i < reorderedTodos.length; i++) {
          await tx
            .update(schema.todos)
            .set({ position: i })
            .where(eq(schema.todos.id, reorderedTodos[i].id));
        }
      });

      res.json({ success: true });
    } catch (error) {
      log.error("[API] Error reordering todos:", error);
      res.status(500).json({ error: "Failed to reorder todos" });
    }
  });

  // Sprite Upload (stores in database)
  app.post("/api/sprites/upload", upload.array('sprites', 500), async (req, res) => {
    log.debug('[sprites] ========== UPLOAD REQUEST STARTED ==========');
    try {
      const files = req.files as Express.Multer.File[];
      log.debug('[sprites] Files received:', files?.length || 0);

      if (!files || files.length === 0) {
        log.debug('[sprites] ERROR: No files in request');
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedFiles: string[] = [];

      for (const file of files) {
        log.debug(`[sprites] Processing file: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);
        const ext = path.extname(file.originalname).toLowerCase();

        if (ext === '.zip') {
          // Extract ZIP files
          log.debug(`[sprites] Extracting ZIP: ${file.originalname}`);
          try {
            const zip = new AdmZip(file.path);
            const zipEntries = zip.getEntries();
            log.debug(`[sprites] ZIP contains ${zipEntries.length} entries`);

            for (const entry of zipEntries) {
              // Skip directories and hidden files
              if (entry.isDirectory || entry.entryName.startsWith('__MACOSX') || path.basename(entry.entryName).startsWith('.')) {
                log.debug(`[sprites] Skipping: ${entry.entryName}`);
                continue;
              }

              // Only extract image files
              const entryExt = path.extname(entry.entryName).toLowerCase();
              if (['.png', '.jpg', '.jpeg', '.psd'].includes(entryExt)) {
                const fileName = path.basename(entry.entryName);
                log.debug(`[sprites] Extracting image: ${fileName}`);
                const imageData = entry.getData();
                const base64Data = imageData.toString('base64');
                log.debug(`[sprites] Base64 data length: ${base64Data.length}`);

                // Determine MIME type
                let mimeType = 'image/png';
                if (entryExt === '.jpg' || entryExt === '.jpeg') mimeType = 'image/jpeg';
                else if (entryExt === '.psd') mimeType = 'image/vnd.adobe.photoshop';

                log.debug(`[sprites] Attempting to store ${fileName} in database...`);
                // Store in database (upsert to handle duplicates)
                try {
                  await storage.upsertSprite({
                    filename: fileName,
                    category: 'uncategorized',
                    data: base64Data,
                    mimeType,
                  });
                  uploadedFiles.push(fileName);
                  log.debug(`[sprites] Successfully stored in DB: ${fileName}`);
                } catch (dbError: any) {
                  log.error(`[sprites] Database error for ${fileName}:`, dbError);
                  throw dbError;
                }
              }
            }

            // Delete the ZIP file after extraction
            fs.unlinkSync(file.path);
            log.debug(`[sprites] Deleted ZIP file: ${file.originalname}`);
          } catch (error) {
            log.error(`[sprites] Error extracting ZIP ${file.originalname}:`, error);
            throw error;
          }
        } else {
          // Non-ZIP image files
          log.debug(`[sprites] Processing single image: ${file.originalname}`);
          const fileData = fs.readFileSync(file.path);
          const base64Data = fileData.toString('base64');
          log.debug(`[sprites] Base64 data length: ${base64Data.length}`);

          // Determine MIME type
          let mimeType = file.mimetype;
          if (!mimeType || mimeType === 'application/octet-stream') {
            if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            else if (ext === '.psd') mimeType = 'image/vnd.adobe.photoshop';
          }
          log.debug(`[sprites] MIME type: ${mimeType}`);

          log.debug(`[sprites] Attempting to store ${file.originalname} in database...`);
          // Store in database (upsert to handle duplicates)
          try {
            await storage.upsertSprite({
              filename: file.originalname,
              category: 'uncategorized',
              data: base64Data,
              mimeType,
            });
            uploadedFiles.push(file.originalname);
            log.debug(`[sprites] Successfully stored in DB: ${file.originalname}`);
          } catch (dbError: any) {
            log.error(`[sprites] Database error for ${file.originalname}:`, dbError);
            throw dbError;
          }

          // Delete temporary file
          fs.unlinkSync(file.path);
          log.debug(`[sprites] Deleted temp file: ${file.originalname}`);
        }
      }

      log.debug(`[sprites] ========== UPLOAD SUCCESS: ${uploadedFiles.length} files ==========`);
      res.json({
        success: true,
        files: uploadedFiles,
        count: uploadedFiles.length,
      });
    } catch (error) {
      log.error('[sprites] Upload failed', error);
      res.status(500).json({ error: getErrorMessage(error) || "Failed to upload sprites" });
    }
  });

  // List uploaded sprites (from database)
  app.get("/api/sprites/list", async (req, res) => {
    try {
      const sprites = await storage.getSprites();
      const spriteList = sprites.map(s => ({
        filename: s.filename,
        path: `/api/sprites/file/${s.filename}`,
        category: s.category,
        name: s.name,
      }));

      res.json(spriteList);
    } catch (error) {
      log.error('[sprites] List error:', error);
      res.status(500).json({ error: getErrorMessage(error) || "Failed to list sprites" });
    }
  });

  // Serve sprite files (from database)
  app.get("/api/sprites/file/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const sprite = await storage.getSpriteByFilename(filename);

      if (!sprite) {
        return res.status(404).json({ error: "Sprite not found" });
      }

      // Decode base64 and send as image
      const imageBuffer = Buffer.from(sprite.data, 'base64');
      res.set('Content-Type', sprite.mimeType);
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(imageBuffer);
    } catch (error) {
      log.error('[sprites] File serve error:', error);
      res.status(500).json({ error: getErrorMessage(error) || "Failed to serve sprite" });
    }
  });

  // Save sprite organization (updates database)
  app.post("/api/sprites/organize", async (req, res) => {
    try {
      const { sprites } = req.body;

      if (!sprites || !Array.isArray(sprites)) {
        return res.status(400).json({ error: "Invalid request" });
      }

      // Update each sprite in the database
      for (const sprite of sprites) {
        await storage.updateSprite(sprite.filename, {
          category: sprite.category,
          name: sprite.name || null,
          rarity: sprite.rarity || null,
        });
      }

      log.debug('[sprites] Organization saved:', sprites.length, 'sprites');
      res.json({ success: true, count: sprites.length });
    } catch (error) {
      log.error('[sprites] Organize error:', error);
      res.status(500).json({ error: getErrorMessage(error) || "Failed to save organization" });
    }
  });

  // Delete sprites (from database)
  app.post("/api/sprites/delete", async (req, res) => {
    try {
      const { filenames } = req.body;

      if (!filenames || !Array.isArray(filenames)) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const deleted: string[] = [];
      const failed: string[] = [];

      for (const filename of filenames) {
        try {
          await storage.deleteSprite(filename);
          deleted.push(filename);
          log.debug(`[sprites] Deleted from DB: ${filename}`);
        } catch (error) {
          log.error(`[sprites] Failed to delete ${filename}:`, error);
          failed.push(filename);
        }
      }

      res.json({
        success: true,
        deleted: deleted.length,
        failed: failed.length,
        deletedFiles: deleted,
        failedFiles: failed,
      });
    } catch (error) {
      log.error('[sprites] Delete error:', error);
      res.status(500).json({ error: getErrorMessage(error) || "Failed to delete sprites" });
    }
  });

  // Get sprite metadata (lightweight - no base64 data)
  app.get("/api/sprites/metadata", async (req, res) => {
    try {
      const metadata = await storage.getSpritesMetadata();
      res.json(metadata);
    } catch (error) {
      log.error('[sprites] Get metadata error:', error);
      res.status(500).json({ error: getErrorMessage(error) || "Failed to get sprite metadata" });
    }
  });

  // Get individual sprite by ID (with full data)
  app.get("/api/sprites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid sprite ID" });
      }

      const sprite = await storage.getSpriteById(id);
      if (!sprite) {
        return res.status(404).json({ error: "Sprite not found" });
      }

      res.json({
        id: sprite.id,
        filename: sprite.filename,
        category: sprite.category,
        name: sprite.name,
        data: `data:${sprite.mimeType};base64,${sprite.data}`,
        mimeType: sprite.mimeType,
      });
    } catch (error) {
      log.error('[sprites] Get by ID error:', error);
      res.status(500).json({ error: getErrorMessage(error) || "Failed to get sprite" });
    }
  });

  // Get all sprites (for admin panel) - with optional includeData parameter
  app.get("/api/sprites", async (req, res) => {
    try {
      const includeData = req.query.includeData !== 'false'; // Default to true for backward compatibility

      if (!includeData) {
        // Return metadata only
        const metadata = await storage.getSpritesMetadata();
        res.json(metadata);
      } else {
        // Return full sprite data (backward compatible)
        const sprites = await storage.getSprites();
        const spriteData = sprites.map(s => ({
          id: s.id,
          filename: s.filename,
          category: s.category,
          name: s.name,
          data: `data:${s.mimeType};base64,${s.data}`,
          mimeType: s.mimeType,
        }));
        res.json(spriteData);
      }
    } catch (error) {
      log.error('[sprites] Get all error:', error);
      res.status(500).json({ error: getErrorMessage(error) || "Failed to get sprites" });
    }
  });

  // ========== DREAM SCROLL ROUTES ==========

  // Get all dream scroll items for a user
  app.get("/api/dream-scroll", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const items = await storage.getDreamScrollItems(req.user!.id);
      res.json(items);
    } catch (error) {
      log.error('[dream-scroll] Get items error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get dream scroll items by category
  app.get("/api/dream-scroll/category/:category", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { category } = req.params;
      const items = await storage.getDreamScrollItemsByCategory(req.user!.id, category);
      res.json(items);
    } catch (error) {
      log.error('[dream-scroll] Get by category error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Create a new dream scroll item
  app.post("/api/dream-scroll", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const item = await storage.createDreamScrollItem({
        userId: req.user!.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        priority: req.body.priority || 'medium',
        cost: req.body.cost,
      });
      res.json(item);
    } catch (error) {
      log.error('[dream-scroll] Create error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Update a dream scroll item
  app.patch("/api/dream-scroll/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateDreamScrollItem(id, req.body);

      if (!item) {
        return res.status(404).json({ error: "Dream scroll item not found" });
      }

      res.json(item);
    } catch (error) {
      log.error('[dream-scroll] Update error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Toggle completion status
  app.post("/api/dream-scroll/:id/toggle", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      const item = await storage.toggleDreamScrollItemComplete(id);

      if (!item) {
        return res.status(404).json({ error: "Dream scroll item not found" });
      }

      res.json(item);
    } catch (error) {
      log.error('[dream-scroll] Toggle error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Delete a dream scroll item
  app.delete("/api/dream-scroll/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      await storage.deleteDreamScrollItem(id);
      res.json({ success: true });
    } catch (error) {
      log.error('[dream-scroll] Delete error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // ========== DREAM SCROLL TAG ROUTES ==========

  // Get all tags for a specific category
  app.get("/api/dream-scroll/tags/:category", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { category } = req.params;
      const tags = await storage.getDreamScrollTags(req.user!.id, category);
      res.json(tags);
    } catch (error) {
      log.error('[dream-scroll-tags] Get tags error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Create a new tag
  app.post("/api/dream-scroll/tags", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const tag = await storage.createDreamScrollTag({
        userId: req.user!.id,
        category: req.body.category,
        name: req.body.name,
        color: req.body.color || 'bg-gray-500/20 text-gray-300',
      });
      res.json(tag);
    } catch (error) {
      log.error('[dream-scroll-tags] Create tag error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Delete a tag
  app.delete("/api/dream-scroll/tags/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      await storage.deleteDreamScrollTag(id);
      res.json({ success: true });
    } catch (error) {
      log.error('[dream-scroll-tags] Delete tag error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // ========== STREAK FREEZE ROUTES ==========

  // Get user's streak freezes
  app.get("/api/streak-freezes", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const freezeData = await storage.getStreakFreeze(userId);
      res.json({
        freezeCount: freezeData?.freezeCount || 0,
        maxFreezes: 2,
      });
    } catch (error) {
      log.error('[streak-freezes] Get error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Purchase a streak freeze (costs 250 XP)
  app.post("/api/streak-freezes/purchase", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const freezeData = await storage.getStreakFreeze(userId);
      const currentCount = freezeData?.freezeCount || 0;

      if (currentCount >= 2) {
        return res.status(400).json({ error: "Already have maximum streak freezes (2)" });
      }

      const FREEZE_COST = 250;

      // spendPoints is atomic (WHERE available >= amount) — race-safe
      const success = await storage.spendPoints(userId, FREEZE_COST, "reward_redeem", "Streak freeze purchase");
      if (!success) {
        return res.status(400).json({ error: `Insufficient XP (need ${FREEZE_COST})` });
      }

      // incrementStreakFreeze uses SQL increment — safe for concurrent calls
      // Worst case: user ends up with 3 freezes from 2 concurrent requests,
      // but the points are already atomically spent so no economic exploit
      await storage.incrementStreakFreeze(userId);
      const updated = await storage.getStreakFreeze(userId);

      log.info(`[streak-freezes] User ${userId} purchased streak freeze (${FREEZE_COST} XP)`);

      res.json({
        freezeCount: updated?.freezeCount || currentCount + 1,
        pointsSpent: FREEZE_COST,
      });
    } catch (error) {
      log.error('[streak-freezes] Purchase error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Apply a streak freeze to a specific date
  app.post("/api/streak-freeze/apply", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const { frozenDate } = req.body;

      if (!frozenDate || !/^\d{4}-\d{2}-\d{2}$/.test(frozenDate)) {
        return res.status(400).json({ error: "Invalid date format (expected YYYY-MM-DD)" });
      }

      // Idempotency check
      const existing = await storage.getStreakFreezeApplication(userId, frozenDate);
      if (existing) {
        return res.json({ applied: true, message: "Already applied" });
      }

      // Check freeze inventory
      const freezeData = await storage.getStreakFreeze(userId);
      if (!freezeData || freezeData.freezeCount <= 0) {
        return res.status(400).json({ error: "No streak freezes available" });
      }

      // Apply: decrement inventory + record application
      await storage.decrementStreakFreeze(userId);
      await storage.createStreakFreezeApplication(userId, frozenDate);

      log.info(`[streak-freezes] User ${userId} applied freeze for ${frozenDate}`);

      res.json({
        applied: true,
        freezeCount: freezeData.freezeCount - 1,
      });
    } catch (error) {
      log.error('[streak-freezes] Apply error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // ========== MOUNTAINEERING GAME ROUTES ==========

  // Get all alpine gear
  app.get("/api/alpine-gear", async (req, res) => {
    try {
      const gear = await storage.getAllAlpineGear();
      res.json(gear);
    } catch (error) {
      log.error('[alpine-gear] Get all gear error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get player's gear inventory
  app.get("/api/alpine-gear/inventory", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const inventory = await storage.getPlayerGearInventory(req.user!.id);
      res.json(inventory);
    } catch (error) {
      log.error('[alpine-gear] Get inventory error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Purchase gear
  app.post("/api/alpine-gear/purchase", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { gearId } = req.body;
      const result = await storage.purchaseGear(req.user!.id, gearId);
      res.json(result);
    } catch (error) {
      log.error('[alpine-gear] Purchase error:', error);
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  // ========== GEAR COLLECTION ROUTES ==========

  // Get gear collection stats (for GearCollectionPanel)
  app.get("/api/gear/stats", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;

      // Get all gear
      const allGear = await storage.getAllAlpineGear();

      // Get player's inventory
      const inventory = await storage.getPlayerGearInventory(userId);
      const ownedGearIds = new Set(inventory.map((item: any) => item.gearId));

      // Calculate stats by tier
      const stats = {
        totalGear: allGear.length,
        ownedGear: inventory.length,
        basicTier: allGear.filter((g: any) => g.tier === 'basic').length,
        intermediateTier: allGear.filter((g: any) => g.tier === 'intermediate').length,
        advancedTier: allGear.filter((g: any) => g.tier === 'advanced').length,
        eliteTier: allGear.filter((g: any) => g.tier === 'elite').length,
      };

      res.json(stats);
    } catch (error) {
      log.error('[gear] Get stats error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get gear collection with owned status (for GearCollectionPanel)
  app.get("/api/gear/collection", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;

      // Get all gear
      const allGear = await storage.getAllAlpineGear();

      // Get player's inventory
      const inventory = await storage.getPlayerGearInventory(userId);
      const ownedGearIds = new Set(inventory.map((item: any) => item.gearId));

      // Map gear with owned status
      const gearCollection = allGear.map((gear: any) => ({
        id: gear.id,
        name: gear.name,
        category: gear.category,
        tier: gear.tier,
        unlockLevel: gear.unlockLevel || 1,
        cost: gear.cost || 0,
        imageUrl: gear.imageUrl,
        owned: ownedGearIds.has(gear.id),
      }));

      res.json(gearCollection);
    } catch (error) {
      log.error('[gear] Get collection error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // ========== MOUNTAIN ROUTES ==========

  // Get all regions
  app.get("/api/mountains/regions", async (req, res) => {
    try {
      const regions = await storage.getAllRegions();
      res.json(regions);
    } catch (error) {
      log.error('[mountains] Get regions error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get all mountains
  app.get("/api/mountains", async (req, res) => {
    try {
      const mountains = await storage.getAllMountains();
      res.json(mountains);
    } catch (error) {
      log.error('[mountains] Get all error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get mountains by region
  app.get("/api/mountains/region/:regionId", async (req, res) => {
    try {
      const regionId = parseInt(req.params.regionId);
      const mountains = await storage.getMountainsByRegion(regionId);
      res.json(mountains);
    } catch (error) {
      log.error('[mountains] Get by region error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get user's unlocked mountains (for background/theme progression)
  app.get("/api/mountains/unlocked", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const db = getDb();
      const unlocked = await db.query.mountainUnlocks.findMany({
        where: (mountainUnlocks: any, { eq }: any) => eq(mountainUnlocks.userId, req.user!.id),
        with: {
          mountain: true
        }
      });

      // Return with mountain names for easy lookup
      const formatted = unlocked.map((u: any) => ({
        id: u.id,
        mountainName: u.mountain.name,
        unlockedAt: u.unlockedAt.toISOString(),
        unlockedBy: u.unlockedBy
      }));

      res.json(formatted);
    } catch (error) {
      log.error('[mountains] Get unlocked error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get routes for a specific mountain
  app.get("/api/mountains/:mountainId/routes", async (req, res) => {
    try {
      const mountainId = parseInt(req.params.mountainId);
      // TODO: Implement getRoutesByMountainId
      res.json([]);
    } catch (error) {
      log.error('[routes] Get by mountain error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get user's backgrounds (unlocked and locked)
  app.get("/api/user/backgrounds", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const db = getDb();

      // Get all mountains with background images
      const allMountains = await db
        .select()
        .from(schema.mountains)
        .where(sql`${schema.mountains.backgroundImage} IS NOT NULL`)
        .orderBy(schema.mountains.elevation);

      // Get user's unlocked backgrounds
      const unlockedBackgrounds = await db
        .select()
        .from(schema.mountainBackgrounds)
        .where(eq(schema.mountainBackgrounds.userId, userId));

      // Combine the data
      const result = allMountains.map(mountain => {
        const userBackground = unlockedBackgrounds.find(ub => ub.mountainId === mountain.id);
        return {
          id: mountain.id,
          name: mountain.name,
          elevation: mountain.elevation,
          country: mountain.country,
          backgroundImage: mountain.backgroundImage,
          themeColors: mountain.themeColors,
          difficultyTier: mountain.difficultyTier,
          isActive: userBackground?.isActive || false,
          unlocked: !!userBackground,
          unlockedAt: userBackground?.unlockedAt || null
        };
      });

      res.json(result);
    } catch (error) {
      log.error('[backgrounds] Get user backgrounds error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Activate a background
  app.patch("/api/user/backgrounds/:mountainId/activate", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const mountainId = parseInt(req.params.mountainId);
      const db = getDb();

      // Check if user has unlocked this background
      const unlocked = await db
        .select()
        .from(schema.mountainBackgrounds)
        .where(
          sql`${schema.mountainBackgrounds.userId} = ${userId} AND ${schema.mountainBackgrounds.mountainId} = ${mountainId}`
        );

      if (unlocked.length === 0) {
        return res.status(403).json({ error: "Background not unlocked. Summit this mountain first!" });
      }

      // Deactivate all other backgrounds
      await db
        .update(schema.mountainBackgrounds)
        .set({ isActive: false })
        .where(eq(schema.mountainBackgrounds.userId, userId));

      // Activate the selected background
      await db
        .update(schema.mountainBackgrounds)
        .set({ isActive: true })
        .where(
          sql`${schema.mountainBackgrounds.userId} = ${userId} AND ${schema.mountainBackgrounds.mountainId} = ${mountainId}`
        );

      // Get the mountain data to return
      const mountain = await db
        .select()
        .from(schema.mountains)
        .where(eq(schema.mountains.id, mountainId));

      res.json({ ...mountain[0], unlocked: true, isActive: true });
    } catch (error) {
      log.error('[backgrounds] Activate background error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get player climbing stats
  app.get("/api/climbing/stats", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const stats = await storage.getPlayerClimbingStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      log.error('[climbing] Get stats error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Get level progress (for XP bar)
  app.get("/api/user/level-progress", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      let stats = await storage.getPlayerClimbingStats(userId);

      if (!stats) {
        stats = {
          climbingLevel: 1,
          totalXp: 0,
        };
      }

      const currentLevel = stats.climbingLevel || 1;
      const totalXp = stats.totalXp || 0;
      const xpForCurrentLevel = (currentLevel - 1) * 100;
      const xpInCurrentLevel = totalXp - xpForCurrentLevel;
      const xpNeededForNextLevel = 100; // 100 XP per level

      // Calculate climbing grade based on level
      const gradeMap: Record<number, string> = {
        1: "5.5", 2: "5.6", 3: "5.7", 4: "5.8", 5: "5.9",
        6: "5.10a", 7: "5.10b", 8: "5.10c", 9: "5.10d",
        10: "5.11a", 11: "5.11b", 12: "5.11c", 13: "5.11d",
        14: "5.12a", 15: "5.12b", 16: "5.12c", 17: "5.12d",
        18: "5.13a", 19: "5.13b", 20: "5.13c",
      };
      const grade = gradeMap[currentLevel] || "5.13d";

      res.json({
        level: currentLevel,
        grade,
        totalXp,
        xpInCurrentLevel,
        xpNeededForNextLevel,
        progressPercent: Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100),
      });
    } catch (error) {
      log.error('[user] Get level progress error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // =============================================
  // EXPEDITION ROUTES
  // =============================================

  // POST /api/expeditions - Start a new expedition (in_progress status)
  app.post("/api/expeditions", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const db = getDb();
      const pool = getPool();
      const userId = req.user!.id;
      const { routeId, mountainId, gearIds } = req.body;

      if (!routeId) {
        return res.status(400).json({ error: "Route ID is required" });
      }

      // Check for existing active expedition
      const activeExpedition = await getPool().query(
        `SELECT id FROM player_expeditions WHERE user_id = $1 AND status = 'in_progress'`,
        [userId]
      );

      if (activeExpedition.rows.length > 0) {
        return res.status(400).json({ error: "You already have an active expedition. Complete or retreat from it first." });
      }

      // Get user's current climbing stats
      let stats = await storage.getPlayerClimbingStats(userId);
      if (!stats) {
        stats = { climbingLevel: 1, totalXp: 0, currentEnergy: 100, maxEnergy: 100 };
      }

      // Validate energy (need at least 20 to start)
      const currentEnergy = stats.currentEnergy || 0;
      if (currentEnergy < 20) {
        return res.status(400).json({
          error: "Not enough energy to start expedition. Complete more habits to gain energy!",
          currentEnergy,
          required: 20
        });
      }

      // Get mountain and route details
      const mountain = await getPool().query(
        `SELECT * FROM mountains WHERE id = $1`,
        [mountainId]
      );

      if (mountain.rows.length === 0) {
        return res.status(404).json({ error: "Mountain not found" });
      }

      const route = await getPool().query(
        `SELECT * FROM routes WHERE id = $1 AND mountain_id = $2`,
        [routeId, mountainId]
      );

      if (route.rows.length === 0) {
        return res.status(404).json({ error: "Route not found for this mountain" });
      }

      const mountainData = mountain.rows[0];
      const routeData = route.rows[0];

      // Check required gear for this route
      const requiredGear = await getPool().query(
        `SELECT rg.gear_id, rg.is_required, g.name, g.category
         FROM route_gear_requirements rg
         JOIN alpine_gear g ON rg.gear_id = g.id
         WHERE rg.route_id = $1 AND rg.is_required = true`,
        [routeId]
      );

      if (requiredGear.rows.length > 0) {
        // Get user's gear inventory
        const userGear = await getPool().query(
          `SELECT gear_id FROM player_gear_inventory WHERE user_id = $1`,
          [userId]
        );

        const ownedGearIds = new Set(userGear.rows.map((g: any) => g.gear_id));
        const missingGear = requiredGear.rows.filter((gear: any) => !ownedGearIds.has(gear.gear_id));

        if (missingGear.length > 0) {
          const missingGearNames = missingGear.map((g: any) => g.name).join(', ');
          return res.status(400).json({
            error: "Missing required gear for this route",
            missingGear: missingGear.map((g: any) => ({
              id: g.gear_id,
              name: g.name,
              category: g.category
            })),
            message: `This route requires: ${missingGearNames}. Visit the Alpine Shop to purchase the necessary equipment.`
          });
        }

        // Validate that provided gearIds includes all required gear
        const providedGearSet = new Set(gearIds || []);
        const missingFromLoadout = requiredGear.rows.filter((gear: any) => !providedGearSet.has(gear.gear_id));

        if (missingFromLoadout.length > 0) {
          const missingNames = missingFromLoadout.map((g: any) => g.name).join(', ');
          return res.status(400).json({
            error: "Required gear not included in loadout",
            missingFromLoadout: missingFromLoadout.map((g: any) => ({
              id: g.gear_id,
              name: g.name,
              category: g.category
            })),
            message: `You own this gear but didn't include it in your loadout: ${missingNames}`
          });
        }
      }

      // Deduct starting energy (20 energy to begin expedition)
      const newEnergy = currentEnergy - 20;
      await storage.updatePlayerClimbingStats(userId, {
        currentEnergy: newEnergy
      });

      // Create expedition record (in_progress status)
      const expeditionResult = await getPool().query(
        `INSERT INTO player_expeditions
         (user_id, route_id, status, start_date, current_progress, current_altitude, current_day, energy_spent, summit_reached)
         VALUES ($1, $2, 'in_progress', NOW(), 0, 0, 0, 20, false)
         RETURNING *`,
        [userId, routeId]
      );

      const expeditionId = expeditionResult.rows[0].id;

      // Save gear loadout if provided
      if (gearIds && gearIds.length > 0) {
        for (const gearId of gearIds) {
          // Get gear condition from inventory
          const gearResult = await getPool().query(
            `SELECT condition FROM player_gear_inventory WHERE user_id = $1 AND gear_id = $2`,
            [userId, gearId]
          );

          const condition = gearResult.rows[0]?.condition || 100;

          await getPool().query(
            `INSERT INTO expedition_gear_loadout (expedition_id, gear_id, quantity, condition_before)
             VALUES ($1, $2, 1, $3)`,
            [expeditionId, gearId, condition]
          );
        }
      }

      // Create starting event
      await getPool().query(
        `INSERT INTO expedition_events
         (expedition_id, event_type, event_day, event_description)
         VALUES ($1, 'rest_day', 0, $2)`,
        [
          expeditionId,
          `Arrived at basecamp for ${mountainData.name} via ${routeData.route_name}. Preparing for the climb ahead.`
        ]
      );

      log.debug('[expeditions] Started expedition:', {
        expeditionId,
        userId,
        mountain: mountainData.name,
        route: routeData.route_name,
        energySpent: 20,
        newEnergy
      });

      res.json({
        expedition: expeditionResult.rows[0],
        energySpent: 20,
        newEnergy,
        mountain: {
          id: mountainData.id,
          name: mountainData.name,
          elevation: mountainData.elevation,
          tier: mountainData.difficulty_tier
        },
        route: {
          id: routeData.id,
          name: routeData.route_name,
          estimatedDays: routeData.estimated_days,
          elevationGain: routeData.elevation_gain
        }
      });
    } catch (error) {
      log.error('[expeditions] Create expedition error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // POST /api/expeditions/:id/advance - Advance expedition by one day
  app.post("/api/expeditions/:id/advance", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const db = getDb();
      const userId = req.user!.id;
      const expeditionId = parseInt(req.params.id);

      // Get expedition
      const expedition = await getPool().query(
        `SELECT e.*, r.estimated_days, r.elevation_gain, r.route_name, m.name as mountain_name, m.elevation as mountain_elevation
         FROM player_expeditions e
         JOIN routes r ON e.route_id = r.id
         JOIN mountains m ON r.mountain_id = m.id
         WHERE e.id = $1 AND e.user_id = $2`,
        [expeditionId, userId]
      );

      if (expedition.rows.length === 0) {
        return res.status(404).json({ error: "Expedition not found" });
      }

      const exp = expedition.rows[0];

      if (exp.status !== 'in_progress') {
        return res.status(400).json({ error: "Expedition is not in progress" });
      }

      // Check energy (need 5 to advance)
      const stats = await storage.getPlayerClimbingStats(userId);
      const currentEnergy = stats?.currentEnergy || 0;

      if (currentEnergy < 5) {
        return res.status(400).json({
          error: "Not enough energy to continue. Complete more habits or retreat from the expedition.",
          currentEnergy,
          required: 5
        });
      }

      // Deduct energy
      await storage.updatePlayerClimbingStats(userId, {
        currentEnergy: currentEnergy - 5
      });

      // Calculate progress increase (100% / estimated days)
      const progressPerDay = 100 / (exp.estimated_days || 5);
      const newProgress = Math.min(100, (exp.current_progress || 0) + progressPerDay);
      const newDay = (exp.current_day || 0) + 1;
      const newAltitude = Math.floor((newProgress / 100) * exp.elevation_gain);
      const newEnergySpent = (exp.energy_spent || 0) + 5;

      // Check if summit reached
      if (newProgress >= 100) {
        // Summit! Complete the expedition
        return res.redirect(307, `/api/expeditions/${expeditionId}/complete`);
      }

      // Update expedition
      await getPool().query(
        `UPDATE player_expeditions
         SET current_progress = $1, current_day = $2, current_altitude = $3, energy_spent = $4, updated_at = NOW()
         WHERE id = $5`,
        [newProgress, newDay, newAltitude, newEnergySpent, expeditionId]
      );

      // Create progress event
      const camp = Math.floor(newProgress / 25); // 0=basecamp, 1=camp1, 2=camp2, 3=camp3, 4=summit
      const campNames = ['Basecamp', 'Camp 1', 'Camp 2', 'Camp 3', 'High Camp'];
      await getPool().query(
        `INSERT INTO expedition_events
         (expedition_id, event_type, event_day, event_description)
         VALUES ($1, 'acclimatization', $2, $3)`,
        [
          expeditionId,
          newDay,
          `Advanced to ${campNames[camp]} at ${newAltitude}m. Progress: ${Math.round(newProgress)}%`
        ]
      );

      log.debug('[expeditions] Advanced expedition:', {
        expeditionId,
        newDay,
        newProgress: Math.round(newProgress),
        newAltitude,
        energySpent: 5
      });

      res.json({
        expedition: {
          id: expeditionId,
          currentDay: newDay,
          currentProgress: newProgress,
          currentAltitude: newAltitude,
          energySpent: newEnergySpent,
          status: 'in_progress'
        },
        energySpent: 5,
        newEnergy: currentEnergy - 5,
        progressIncrease: progressPerDay,
        message: `Day ${newDay}: Advanced to ${campNames[camp]}`
      });
    } catch (error) {
      log.error('[expeditions] Advance expedition error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // POST /api/expeditions/:id/complete - Complete expedition (summit reached)
  app.post("/api/expeditions/:id/complete", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const db = getDb();
      const userId = req.user!.id;
      const expeditionId = parseInt(req.params.id);

      // Get expedition with mountain/route details
      const expedition = await getPool().query(
        `SELECT e.*, r.technical_difficulty, r.physical_difficulty, r.elevation_gain, r.route_name,
                m.name as mountain_name, m.elevation as mountain_elevation, m.difficulty_tier
         FROM player_expeditions e
         JOIN routes r ON e.route_id = r.id
         JOIN mountains m ON r.mountain_id = m.id
         WHERE e.id = $1 AND e.user_id = $2`,
        [expeditionId, userId]
      );

      if (expedition.rows.length === 0) {
        return res.status(404).json({ error: "Expedition not found" });
      }

      const exp = expedition.rows[0];

      // Calculate XP reward based on difficulty
      const difficultyMultiplier: Record<string, number> = {
        novice: 50,
        intermediate: 100,
        advanced: 200,
        expert: 300,
        elite: 500
      };

      const baseXp = difficultyMultiplier[exp.difficulty_tier] || 100;
      const xpEarned = baseXp;

      // Calculate token reward
      const tokensEarned = Math.floor(baseXp / 2);

      // Update expedition to completed
      await getPool().query(
        `UPDATE player_expeditions
         SET status = 'completed', summit_reached = true, completion_date = NOW(),
             experience_earned = $1, current_progress = 100, updated_at = NOW()
         WHERE id = $2`,
        [xpEarned, expeditionId]
      );

      // Award XP and tokens
      const stats = await storage.getPlayerClimbingStats(userId);
      const newTotalXp = (stats?.totalXp || 0) + xpEarned;
      const newLevel = Math.floor(newTotalXp / 100) + 1;
      const summitsReached = (stats?.summitsReached || 0) + 1;

      await storage.updatePlayerClimbingStats(userId, {
        totalXp: newTotalXp,
        climbingLevel: newLevel,
        summitsReached: summitsReached,
        totalElevationClimbed: (stats?.totalElevationClimbed || 0) + exp.elevation_gain
      });

      await storage.addPoints(userId, tokensEarned, "goal_progress", expeditionId, `Summited ${exp.mountain_name}`);

      // Check for mountain unlocks based on new level and summit count
      const unlockedMountains = await getPool().query(
        `SELECT m.id, m.name, m.elevation, m.difficulty_tier, m.unlock_requirements
         FROM mountains m
         WHERE m.required_climbing_level <= $1
         AND NOT EXISTS (
           SELECT 1 FROM mountain_unlocks mu
           WHERE mu.user_id = $2 AND mu.mountain_id = m.id
         )`,
        [newLevel, userId]
      );

      const newUnlocks = [];
      for (const mountain of unlockedMountains.rows) {
        // Create unlock record
        await getPool().query(
          `INSERT INTO mountain_unlocks (user_id, mountain_id, unlocked_by)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, mountain_id) DO NOTHING`,
          [userId, mountain.id, newLevel > (stats?.climbingLevel || 1) ? 'level' : 'previous_climb']
        );

        newUnlocks.push({
          id: mountain.id,
          name: mountain.name,
          elevation: mountain.elevation,
          tier: mountain.difficulty_tier
        });
      }

      // Check for achievements
      const currentAchievements = JSON.parse(stats?.achievements || '[]');
      const newAchievements = [];

      // Achievement definitions
      const achievementChecks = [
        { id: 'first_summit', name: 'First Summit', condition: summitsReached === 1, description: 'Reached your first summit' },
        { id: 'five_summits', name: 'Mountain Veteran', condition: summitsReached === 5, description: 'Reached 5 summits' },
        { id: 'ten_summits', name: 'Peak Bagger', condition: summitsReached === 10, description: 'Reached 10 summits' },
        { id: 'twenty_summits', name: 'Mountaineer', condition: summitsReached === 20, description: 'Reached 20 summits' },
        { id: 'fifty_summits', name: 'Alpine Legend', condition: summitsReached === 50, description: 'Reached 50 summits' },
        { id: 'level_5', name: 'Intermediate Climber', condition: newLevel === 5, description: 'Reached level 5' },
        { id: 'level_10', name: 'Advanced Climber', condition: newLevel === 10, description: 'Reached level 10' },
        { id: 'level_15', name: 'Expert Climber', condition: newLevel === 15, description: 'Reached level 15' },
        { id: 'level_20', name: 'Elite Climber', condition: newLevel === 20, description: 'Reached level 20' },
        { id: 'elevation_10k', name: '10K Club', condition: (stats?.totalElevationClimbed || 0) + exp.elevation_gain >= 10000, description: 'Climbed 10,000m total elevation' },
        { id: 'elevation_50k', name: '50K Club', condition: (stats?.totalElevationClimbed || 0) + exp.elevation_gain >= 50000, description: 'Climbed 50,000m total elevation' },
        { id: 'elevation_100k', name: 'Everest×11', condition: (stats?.totalElevationClimbed || 0) + exp.elevation_gain >= 100000, description: 'Climbed 100,000m total elevation' },
      ];

      for (const achievement of achievementChecks) {
        if (achievement.condition && !currentAchievements.includes(achievement.id)) {
          currentAchievements.push(achievement.id);
          newAchievements.push({
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            unlockedAt: new Date().toISOString()
          });
        }
      }

      // Update achievements if any new ones were earned
      if (newAchievements.length > 0) {
        await getPool().query(
          `UPDATE player_climbing_stats SET achievements = $1 WHERE user_id = $2`,
          [JSON.stringify(currentAchievements), userId]
        );
      }

      // Unlock mountain background/theme (summit reward)
      const mountainResult = await getPool().query(
        `SELECT m.id, m.name, m.elevation, m.background_image, m.theme_colors
         FROM mountains m
         JOIN routes r ON m.id = r.mountain_id
         WHERE r.id = $1`,
        [exp.route_id]
      );

      let mountainBackground = null;
      if (mountainResult.rows.length > 0) {
        const mountain = mountainResult.rows[0];

        // Check if background already unlocked
        const existingBackground = await getPool().query(
          `SELECT id FROM mountain_backgrounds
           WHERE user_id = $1 AND mountain_id = $2`,
          [userId, mountain.id]
        );

        if (existingBackground.rows.length === 0) {
          // Unlock the background
          await getPool().query(
            `INSERT INTO mountain_backgrounds (user_id, mountain_id, expedition_id, is_active)
             VALUES ($1, $2, $3, false)
             ON CONFLICT DO NOTHING`,
            [userId, mountain.id, expeditionId]
          );

          mountainBackground = {
            id: mountain.id,
            name: mountain.name,
            elevation: mountain.elevation,
            backgroundImage: mountain.background_image,
            themeColors: mountain.theme_colors ? JSON.parse(mountain.theme_colors) : {}
          };
        }
      }

      // Create summit event
      await getPool().query(
        `INSERT INTO expedition_events
         (expedition_id, event_type, event_day, event_description)
         VALUES ($1, 'success', $2, $3)`,
        [
          expeditionId,
          exp.current_day + 1,
          `🏔️ SUMMIT! Reached the peak of ${exp.mountain_name} (${exp.mountain_elevation}m) via ${exp.route_name}!`
        ]
      );

      log.debug('[expeditions] Completed expedition:', {
        expeditionId,
        userId,
        mountain: exp.mountain_name,
        xpEarned,
        tokensEarned,
        newLevel
      });

      res.json({
        success: true,
        expedition: {
          id: expeditionId,
          status: 'completed',
          summitReached: true
        },
        rewards: {
          xp: xpEarned,
          tokens: tokensEarned,
          levelUp: newLevel > (stats?.climbingLevel || 1)
        },
        stats: {
          totalSummits: summitsReached,
          climbingLevel: newLevel,
          totalXp: newTotalXp
        },
        mountain: {
          name: exp.mountain_name,
          elevation: exp.mountain_elevation
        },
        unlockedMountains: newUnlocks,
        newAchievements: newAchievements,
        mountainBackground: mountainBackground  // New background/theme unlocked
      });
    } catch (error) {
      log.error('[expeditions] Complete expedition error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // POST /api/expeditions/:id/retreat - Retreat from expedition (failed)
  app.post("/api/expeditions/:id/retreat", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const db = getDb();
      const userId = req.user!.id;
      const expeditionId = parseInt(req.params.id);

      // Get expedition
      const expedition = await getPool().query(
        `SELECT e.*, r.route_name, m.name as mountain_name
         FROM player_expeditions e
         JOIN routes r ON e.route_id = r.id
         JOIN mountains m ON r.mountain_id = m.id
         WHERE e.id = $1 AND e.user_id = $2`,
        [expeditionId, userId]
      );

      if (expedition.rows.length === 0) {
        return res.status(404).json({ error: "Expedition not found" });
      }

      const exp = expedition.rows[0];

      // Calculate partial XP (30% of what would have been earned)
      const partialXp = Math.floor(((exp.current_progress || 0) / 100) * 50); // Max 50 XP for retreat

      // Refund 50% of energy spent
      const energyRefund = Math.floor((exp.energy_spent || 0) * 0.5);
      const stats = await storage.getPlayerClimbingStats(userId);
      const currentEnergy = stats?.currentEnergy || 0;
      const maxEnergy = stats?.maxEnergy || 100;
      const newEnergy = Math.min(maxEnergy, currentEnergy + energyRefund);

      // Update expedition to failed
      await getPool().query(
        `UPDATE player_expeditions
         SET status = 'failed', summit_reached = false, completion_date = NOW(),
             experience_earned = $1, updated_at = NOW()
         WHERE id = $2`,
        [partialXp, expeditionId]
      );

      // Award partial XP and refund energy
      if (partialXp > 0) {
        const newTotalXp = (stats?.totalXp || 0) + partialXp;
        const newLevel = Math.floor(newTotalXp / 100) + 1;

        await storage.updatePlayerClimbingStats(userId, {
          totalXp: newTotalXp,
          climbingLevel: newLevel,
          currentEnergy: newEnergy
        });
      } else {
        await storage.updatePlayerClimbingStats(userId, {
          currentEnergy: newEnergy
        });
      }

      // Create retreat event
      await getPool().query(
        `INSERT INTO expedition_events
         (expedition_id, event_type, event_day, event_description)
         VALUES ($1, 'rescue', $2, $3)`,
        [
          expeditionId,
          exp.current_day,
          `Retreated from ${exp.mountain_name} at ${Math.round(exp.current_progress || 0)}% progress. The mountain will be here when conditions improve.`
        ]
      );

      log.debug('[expeditions] Retreated from expedition:', {
        expeditionId,
        userId,
        mountain: exp.mountain_name,
        progress: exp.current_progress,
        partialXp,
        energyRefund
      });

      res.json({
        success: false,
        expedition: {
          id: expeditionId,
          status: 'failed',
          summitReached: false,
          progress: exp.current_progress
        },
        rewards: {
          xp: partialXp,
          energyRefund
        },
        newEnergy,
        message: "Weather conditions forced a retreat. The mountain will be here when you're ready to return."
      });
    } catch (error) {
      log.error('[expeditions] Retreat expedition error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // GET /api/expeditions - Get user's expedition history
  app.get("/api/expeditions", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const pool = getPool();
      const userId = req.user!.id;

      const expeditions = await getPool().query(
        `SELECT
          e.*,
          r.name as route_name,
          r.difficulty_grade,
          m.name as mountain_name,
          m.elevation,
          m.difficulty_tier
         FROM player_expeditions e
         JOIN routes r ON e.route_id = r.id
         JOIN mountains m ON r.mountain_id = m.id
         WHERE e.user_id = $1
         ORDER BY e.start_date DESC
         LIMIT 50`,
        [userId]
      );

      res.json(expeditions.rows);
    } catch (error) {
      log.error('[expeditions] Get expeditions error:', error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // =============================================
  // EXPEDITION MISSIONS ROUTES
  // =============================================

  // Get current active expedition mission
  app.get("/api/expedition-missions/current", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const db = getDb();

      const [activeMission] = await db
        .select()
        .from(schema.expeditionMissions)
        .where(
          and(
            eq(schema.expeditionMissions.userId, userId),
            eq(schema.expeditionMissions.status, "active")
          )
        )
        .limit(1);

      if (!activeMission) {
        return res.json(null);
      }

      // Get mountain details
      const [mountain] = await db
        .select()
        .from(schema.mountains)
        .where(eq(schema.mountains.id, activeMission.mountainId))
        .limit(1);

      res.json({
        ...activeMission,
        mountain,
      });
    } catch (error) {
      log.error("Error fetching current mission:", error);
      res.status(500).json({ error: "Failed to fetch current mission" });
    }
  });

  // Get next mountain to attempt
  app.get("/api/expedition-missions/next", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const db = getDb();

      // Get user's current mountain index from climbing stats
      let [climbingStats] = await db
        .select()
        .from(schema.playerClimbingStats)
        .where(eq(schema.playerClimbingStats.userId, userId))
        .limit(1);

      // Create climbing stats if they don't exist
      if (!climbingStats) {
        [climbingStats] = await db
          .insert(schema.playerClimbingStats)
          .values({ userId })
          .returning();
      }

      const currentIndex = climbingStats.currentMountainIndex || 1;

      // Get all mountains ordered by id (sequential progression)
      const allMountains = await db
        .select()
        .from(schema.mountains)
        .orderBy(schema.mountains.id);

      // Get the mountain at current index (1-based)
      const nextMountain = allMountains[currentIndex - 1];

      if (!nextMountain) {
        return res.status(404).json({ error: "No more mountains available" });
      }

      // Check if user meets level requirement
      const meetsLevelRequirement = climbingStats.climbingLevel >= nextMountain.requiredClimbingLevel;

      // Calculate mission parameters
      const missionParams = calculateMissionParameters(nextMountain);

      res.json({
        mountain: nextMountain,
        missionParams,
        meetsLevelRequirement,
        userLevel: climbingStats.climbingLevel,
        requiredLevel: nextMountain.requiredClimbingLevel,
      });
    } catch (error) {
      log.error("Error fetching next mountain:", error);
      res.status(500).json({ error: "Failed to fetch next mountain" });
    }
  });

  // Start a new expedition mission
  app.post("/api/expedition-missions/start", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const { mountainId } = req.body;
      const db = getDb();

      if (!mountainId) {
        return res.status(400).json({ error: "Mountain ID required" });
      }

      // Check if user already has an active mission
      const [existingMission] = await db
        .select()
        .from(schema.expeditionMissions)
        .where(
          and(
            eq(schema.expeditionMissions.userId, userId),
            eq(schema.expeditionMissions.status, "active")
          )
        )
        .limit(1);

      if (existingMission) {
        return res.status(400).json({ error: "Already have an active mission" });
      }

      // Get mountain details
      const [mountain] = await db
        .select()
        .from(schema.mountains)
        .where(eq(schema.mountains.id, mountainId))
        .limit(1);

      if (!mountain) {
        return res.status(404).json({ error: "Mountain not found" });
      }

      // Check user level requirement
      let [climbingStats] = await db
        .select()
        .from(schema.playerClimbingStats)
        .where(eq(schema.playerClimbingStats.userId, userId))
        .limit(1);

      // Create climbing stats if they don't exist (consistent with /next endpoint)
      if (!climbingStats) {
        [climbingStats] = await db
          .insert(schema.playerClimbingStats)
          .values({ userId })
          .returning();
      }

      if (climbingStats.climbingLevel < mountain.requiredClimbingLevel) {
        return res.status(403).json({
          error: "Level too low",
          required: mountain.requiredClimbingLevel,
          current: climbingStats.climbingLevel,
        });
      }

      // Calculate mission parameters
      const missionParams = calculateMissionParameters(mountain);

      // Create mission
      const [newMission] = await db
        .insert(schema.expeditionMissions)
        .values({
          userId,
          mountainId,
          status: "active",
          totalDays: missionParams.totalDays,
          requiredCompletionPercent: missionParams.requiredCompletionPercent,
        })
        .returning();

      res.json({
        mission: newMission,
        mountain,
      });
    } catch (error) {
      log.error("Error starting mission:", error);
      res.status(500).json({ error: "Failed to start mission" });
    }
  });

  // Check daily progress for active mission
  app.post("/api/expedition-missions/check-progress", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const { date } = req.body; // Format: YYYY-MM-DD
      const db = getDb();

      if (!date) {
        return res.status(400).json({ error: "Date required" });
      }

      // Get active mission
      const [mission] = await db
        .select()
        .from(schema.expeditionMissions)
        .where(
          and(
            eq(schema.expeditionMissions.userId, userId),
            eq(schema.expeditionMissions.status, "active")
          )
        )
        .limit(1);

      if (!mission) {
        return res.status(404).json({ error: "No active mission" });
      }

      // Get user's habits
      const userHabits = await db
        .select()
        .from(schema.habits)
        .where(eq(schema.habits.userId, userId));

      // Get completed habits for the date
      const completedLogs = await db
        .select()
        .from(schema.habitLogs)
        .where(
          and(
            eq(schema.habitLogs.userId, userId),
            eq(schema.habitLogs.date, date),
            eq(schema.habitLogs.completed, true)
          )
        );

      const totalHabits = userHabits.length;
      const completedHabits = completedLogs.length;
      const completionPercent = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
      const meetsGoal = completionPercent >= mission.requiredCompletionPercent;

      // Update mission progress
      if (meetsGoal) {
        const isPerfectDay = completionPercent === 100;

        await db
          .update(schema.expeditionMissions)
          .set({
            daysCompleted: mission.daysCompleted + 1,
            currentDay: mission.currentDay + 1,
            perfectDays: isPerfectDay ? mission.perfectDays + 1 : mission.perfectDays,
            totalHabitsCompleted: mission.totalHabitsCompleted + completedHabits,
            totalHabitsPossible: mission.totalHabitsPossible + totalHabits,
            updatedAt: new Date(),
          })
          .where(eq(schema.expeditionMissions.id, mission.id));

        // Check if mission is complete (just finished the final day)
        if (mission.currentDay + 1 > mission.totalDays) {
          return res.json({
            status: "mission_complete",
            completionPercent,
            meetsGoal: true,
          });
        }

        return res.json({
          status: "day_complete",
          completionPercent,
          meetsGoal: true,
          daysRemaining: mission.totalDays - (mission.currentDay + 1),
        });
      } else {
        // Failed mission
        await db
          .update(schema.expeditionMissions)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(schema.expeditionMissions.id, mission.id));

        return res.json({
          status: "mission_failed",
          completionPercent,
          meetsGoal: false,
          required: mission.requiredCompletionPercent,
        });
      }
    } catch (error) {
      log.error("Error checking progress:", error);
      res.status(500).json({ error: "Failed to check progress" });
    }
  });

  // Complete an expedition mission and award rewards
  app.post("/api/expedition-missions/complete", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user!.id;
      const db = getDb();

      // Get active mission
      const [mission] = await db
        .select()
        .from(schema.expeditionMissions)
        .where(
          and(
            eq(schema.expeditionMissions.userId, userId),
            eq(schema.expeditionMissions.status, "active")
          )
        )
        .limit(1);

      if (!mission) {
        return res.status(404).json({ error: "No active mission to complete" });
      }

      // Get mountain details
      const [mountain] = await db
        .select()
        .from(schema.mountains)
        .where(eq(schema.mountains.id, mission.mountainId))
        .limit(1);

      if (!mountain) {
        return res.status(404).json({ error: "Mountain not found" });
      }

      // Validate mission is actually complete
      const daysCompleted = mission.daysCompleted || 0;
      const requiredDays = Math.ceil(mission.totalDays * mission.requiredCompletionPercent / 100);
      if (daysCompleted < requiredDays) {
        return res.status(400).json({
          error: "Mission not yet complete",
          daysCompleted,
          requiredDays,
        });
      }

      // Calculate rewards
      const baseXP = calculateBaseXP(mountain.difficultyTier);
      const basePoints = calculateBasePoints(mountain.difficultyTier);

      // Calculate bonus multipliers
      let xpMultiplier = 1.0;
      let pointsMultiplier = 1.0;
      const bonuses: string[] = [];

      // Speed bonus: First attempt (no previous failed missions for this mountain)
      const previousAttempts = await db
        .select()
        .from(schema.expeditionMissions)
        .where(
          and(
            eq(schema.expeditionMissions.userId, userId),
            eq(schema.expeditionMissions.mountainId, mission.mountainId),
            eq(schema.expeditionMissions.status, "failed")
          )
        );

      if (previousAttempts.length === 0) {
        xpMultiplier += 0.25;
        pointsMultiplier += 0.25;
        bonuses.push("speed");
      }

      // Perfection bonus: 100% completion every day
      const perfectDays = mission.perfectDays || 0;
      if (perfectDays === mission.totalDays) {
        xpMultiplier += 0.50;
        pointsMultiplier += 0.50;
        bonuses.push("perfection");
      }

      // Streak bonus: Check if user maintained their overall streak during mission
      // For now, we'll award this bonus if they have any active streak
      // (In future, could check if streak was maintained throughout mission duration)
      const [latestHabitData] = await db
        .select()
        .from(schema.habits)
        .where(eq(schema.habits.userId, userId))
        .limit(1);

      if (latestHabitData) {
        // User has habits and completed the mission, award streak bonus
        xpMultiplier += 0.25;
        pointsMultiplier += 0.25;
        bonuses.push("streak");
      }

      const xpEarned = Math.floor(baseXP * xpMultiplier);
      const pointsEarned = Math.floor(basePoints * pointsMultiplier);

      // Update player climbing stats
      let [climbingStats] = await db
        .select()
        .from(schema.playerClimbingStats)
        .where(eq(schema.playerClimbingStats.userId, userId))
        .limit(1);

      // Create climbing stats if they don't exist (consistent with /next and /start endpoints)
      if (!climbingStats) {
        [climbingStats] = await db
          .insert(schema.playerClimbingStats)
          .values({ userId })
          .returning();
      }

      if (climbingStats) {
        const newXP = climbingStats.totalExperience + xpEarned;
        const newLevel = Math.floor(newXP / 100) + 1; // Simple leveling formula

        await db
          .update(schema.playerClimbingStats)
          .set({
            totalExperience: newXP,
            climbingLevel: newLevel,
            summitsReached: climbingStats.summitsReached + 1,
            totalElevationClimbed: climbingStats.totalElevationClimbed + mountain.elevation,
            currentMountainIndex: climbingStats.currentMountainIndex + 1,
            updatedAt: new Date(),
          })
          .where(eq(schema.playerClimbingStats.userId, userId));
      }

      // Award points
      let [userPoints] = await db
        .select()
        .from(schema.userPoints)
        .where(eq(schema.userPoints.userId, userId))
        .limit(1);

      // Create user points if they don't exist (consistent with getUserPoints in db-storage.ts)
      if (!userPoints) {
        [userPoints] = await db
          .insert(schema.userPoints)
          .values({
            userId,
            totalEarned: 0,
            totalSpent: 0,
            available: 0,
          })
          .returning();
      }

      if (userPoints) {
        await db
          .update(schema.userPoints)
          .set({
            totalEarned: userPoints.totalEarned + pointsEarned,
            available: userPoints.available + pointsEarned,
          })
          .where(eq(schema.userPoints.userId, userId));
      }

      // Unlock mountain background (check for duplicates first)
      const [existingBackground] = await db
        .select()
        .from(schema.mountainBackgrounds)
        .where(
          and(
            eq(schema.mountainBackgrounds.userId, userId),
            eq(schema.mountainBackgrounds.mountainId, mountain.id)
          )
        )
        .limit(1);

      if (!existingBackground) {
        await db.insert(schema.mountainBackgrounds).values({
          userId,
          mountainId: mountain.id,
          unlockedAt: new Date(),
          isActive: false,
        });
      }

      // Mark mission as completed
      await db
        .update(schema.expeditionMissions)
        .set({
          status: "completed",
          completionDate: new Date(),
          xpEarned,
          pointsEarned,
          bonusesEarned: JSON.stringify(bonuses),
          updatedAt: new Date(),
        })
        .where(eq(schema.expeditionMissions.id, mission.id));

      res.json({
        rewards: {
          xp: xpEarned,
          points: pointsEarned,
          baseXP,
          basePoints,
          bonuses,
          multiplier: xpMultiplier,
          mountain: mountain.name,
          mountainId: mountain.id,
          elevation: mountain.elevation,
          backgroundUnlocked: true,
          themeUnlocked: true,
          daysCompleted: mission.daysCompleted,
          perfectDays: mission.perfectDays,
          totalDays: mission.totalDays,
        },
      });
    } catch (error) {
      log.error("Error completing mission:", error);
      res.status(500).json({ error: "Failed to complete mission" });
    }
  });

  // Register modular routes
  registerHabitRoutes(app);
  registerGoalRoutes(app);
  registerImportRoutes(app);
  registerKilterBoardRoutes(app);
  registerStravaRoutes(app);
  registerHabitMappingRoutes(app);
  registerPointRoutes(app);
  registerJourneyGoalRoutes(app);
  registerClimbingLogRoutes(app);
  registerLiftingRoutes(app);
  registerMoodRoutes(app);
  registerResidencyRoutes(app);

  // Register task management routes
  registerProjectRoutes(app);
  registerLabelRoutes(app);
  registerTodosEnhancedRoutes(app);
  registerRecurrenceRoutes(app);

  // Register yearly goals routes
  registerYearlyGoalRoutes(app);

  // Register goal calendar routes
  registerGoalCalendarRoutes(app);

  // Register media library routes
  registerMediaLibraryRoutes(app);

  // Register adventures & birds routes
  registerAdventuresRoutes(app);

  // Register unified recent outdoor activities
  registerRecentActivitiesRoutes(app);

  // Register reward shop routes
  registerRewardRoutes(app);

  // Seed de Lahunta reading schedule (one-time use)
  app.post("/api/seed/reading-schedule", async (req, res) => {
    try {
      const userId = getUserId(req);
      const db = getDb();
      const { randomUUID } = await import("crypto");

      // Reading schedule data
      const READING_SCHEDULE = [
        { week: 1, startDate: "2024-12-30", endDate: "2025-01-05", startPage: 1, endPage: 23, content: "Ch 1 + Ch 2" },
        { week: 2, startDate: "2025-01-06", endDate: "2025-01-12", startPage: 24, endPage: 46, content: "Ch 2 + Ch 3" },
        { week: 3, startDate: "2025-01-13", endDate: "2025-01-19", startPage: 47, endPage: 69, content: "Ch 3" },
        { week: 4, startDate: "2025-01-20", endDate: "2025-01-26", startPage: 70, endPage: 92, content: "Ch 3 + Ch 4" },
        { week: 5, startDate: "2025-01-27", endDate: "2025-02-02", startPage: 93, endPage: 115, content: "Ch 4 + Ch 5" },
        { week: 6, startDate: "2025-02-03", endDate: "2025-02-09", startPage: 116, endPage: 138, content: "Ch 5" },
        { week: 7, startDate: "2025-02-10", endDate: "2025-02-16", startPage: 139, endPage: 161, content: "Ch 5" },
        { week: 8, startDate: "2025-02-17", endDate: "2025-02-23", startPage: 162, endPage: 184, content: "Ch 5 + Ch 6" },
        { week: 9, startDate: "2025-02-24", endDate: "2025-03-02", startPage: 185, endPage: 207, content: "Ch 6 + Ch 7" },
        { week: 10, startDate: "2025-03-03", endDate: "2025-03-09", startPage: 208, endPage: 229, content: "Ch 7" },
        { week: 11, startDate: "2025-03-10", endDate: "2025-03-16", startPage: 246, endPage: 268, content: "Ch 9 + Ch 10" },
        { week: 12, startDate: "2025-03-17", endDate: "2025-03-23", startPage: 269, endPage: 291, content: "Ch 10" },
        { week: 13, startDate: "2025-03-24", endDate: "2025-03-30", startPage: 292, endPage: 314, content: "Ch 10 + Ch 11" },
        { week: 14, startDate: "2025-03-31", endDate: "2025-04-06", startPage: 315, endPage: 337, content: "Ch 11" },
        { week: 15, startDate: "2025-04-07", endDate: "2025-04-13", startPage: 338, endPage: 360, content: "Ch 11 + Ch 12" },
        { week: 16, startDate: "2025-04-14", endDate: "2025-04-20", startPage: 361, endPage: 383, content: "Ch 12 + Ch 13" },
        { week: 17, startDate: "2025-04-21", endDate: "2025-04-27", startPage: 384, endPage: 406, content: "Ch 13" },
        { week: 18, startDate: "2025-04-28", endDate: "2025-05-04", startPage: 407, endPage: 429, content: "Ch 13 + Ch 14" },
        { week: 19, startDate: "2025-05-05", endDate: "2025-05-11", startPage: 430, endPage: 452, content: "Ch 14" },
        { week: 20, startDate: "2025-05-12", endDate: "2025-05-18", startPage: 453, endPage: 475, content: "Ch 14 + Ch 15 + Ch 16 + Ch 17" },
        { week: 21, startDate: "2025-05-19", endDate: "2025-05-25", startPage: 476, endPage: 498, content: "Ch 17 + Ch 18" },
        { week: 22, startDate: "2025-05-26", endDate: "2025-06-01", startPage: 499, endPage: 521, content: "Ch 18 + Ch 19 + Ch 20" },
        { week: 23, startDate: "2025-06-02", endDate: "2025-06-08", startPage: 522, endPage: 544, content: "Ch 20 + Ch 21" },
        { week: 24, startDate: "2025-06-09", endDate: "2025-06-15", startPage: 545, endPage: 567, content: "Ch 21 + Ch 22" },
        { week: 25, startDate: "2025-06-16", endDate: "2025-06-22", startPage: 568, endPage: 590, content: "Ch 22" },
        { week: 26, startDate: "2025-06-23", endDate: "2025-06-29", startPage: 591, endPage: 621, content: "Ch 22" },
      ];

      // Helper to get ISO week string
      const getISOWeekString = (dateStr: string): string => {
        const date = new Date(dateStr);
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
      };

      // Check if yearly goal already exists
      const existingYearlyGoal = await db
        .select()
        .from(schema.yearlyGoals)
        .where(
          and(
            eq(schema.yearlyGoals.userId, userId),
            eq(schema.yearlyGoals.year, "2025"),
            eq(schema.yearlyGoals.title, "Complete de Lahunta")
          )
        );

      // Generate sub-items with IDs upfront so we can link them to weekly goals
      const subItemsWithIds: Array<{ id: string; weekNumber: number; title: string; completed: boolean }> = READING_SCHEDULE.map((week) => ({
        id: randomUUID(),
        weekNumber: week.week,
        title: `Week ${week.week}: pp. ${week.startPage}–${week.endPage} (${week.content})`,
        completed: false,
      }));

      let yearlyGoalId: number;
      let yearlyGoalCreated = false;

      if (existingYearlyGoal.length === 0) {
        // Create compound yearly goal with 26 sub-items
        const subItems = subItemsWithIds.map(({ id, title, completed }) => ({ id, title, completed }));

        const [newYearlyGoal] = await db.insert(schema.yearlyGoals).values({
          userId,
          year: "2025",
          title: "Complete de Lahunta",
          description: "Read de Lahunta's Veterinary Neuroanatomy and Clinical Neurology (~23 pages/week, done June 29)",
          category: "books",
          goalType: "compound",
          targetValue: 26,
          currentValue: 0,
          subItems,
          xpReward: 500,
        }).returning();
        yearlyGoalId = newYearlyGoal.id;
        yearlyGoalCreated = true;
      } else {
        yearlyGoalId = existingYearlyGoal[0].id;
        // Use existing sub-items for linking
        const existingSubItems = existingYearlyGoal[0].subItems as Array<{ id: string; title: string; completed: boolean }>;
        existingSubItems.forEach((item, idx) => {
          if (idx < subItemsWithIds.length) {
            subItemsWithIds[idx].id = item.id;
          }
        });
      }

      // Create weekly goals linked to yearly goal sub-items
      let weeklyGoalsCreated = 0;
      for (let i = 0; i < READING_SCHEDULE.length; i++) {
        const week = READING_SCHEDULE[i];
        const subItem = subItemsWithIds[i];
        const isoWeek = getISOWeekString(week.startDate);
        const title = `Read de Lahunta pp. ${week.startPage}–${week.endPage}`;

        const existingWeeklyGoal = await db
          .select()
          .from(schema.goals)
          .where(
            and(
              eq(schema.goals.userId, userId),
              eq(schema.goals.week, isoWeek),
              eq(schema.goals.title, title)
            )
          );

        if (existingWeeklyGoal.length === 0) {
          // Store link to yearly goal sub-item in description field as JSON suffix
          const linkData = JSON.stringify({
            linkedYearlyGoalId: yearlyGoalId,
            linkedSubItemId: subItem.id,
          });

          await db.insert(schema.goals).values({
            userId,
            title,
            description: `${week.content}|||${linkData}`,
            targetValue: 1,
            currentValue: 0,
            unit: "complete",
            deadline: week.endDate,
            category: "reading",
            difficulty: "medium",
            priority: "high",
            week: isoWeek,
          });
          weeklyGoalsCreated++;
        }
      }

      res.json({
        success: true,
        yearlyGoalCreated,
        yearlyGoalId,
        weeklyGoalsCreated,
        message: `Created yearly goal: ${yearlyGoalCreated}, weekly goals: ${weeklyGoalsCreated}/26 (linked to yearly goal #${yearlyGoalId})`,
      });
    } catch (error) {
      log.error("[seed] Error seeding reading schedule:", error);
      res.status(500).json({ error: "Failed to seed reading schedule" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
