import type { Express } from "express";
import { eq, and, desc, asc } from "drizzle-orm";
import { getDb } from "../db";
import * as schema from "@shared/schema";
import { z } from "zod";
import { storage } from "../storage";
import { awardDailyBonusIfNeeded } from "../services/dailyBonus";
import { log } from "../lib/logger";
import { XP_CONFIG } from "@shared/xp-config";

function getUserId(req: any): number {
  return req.user?.id || 1;
}

// Validation schemas
const createMediaItemSchema = z.object({
  title: z.string().min(1).max(200),
  mediaType: z.enum(["book", "tv_show", "movie", "audiobook", "podcast"]),
  status: z.enum(["want", "current", "paused", "done", "abandoned"]).default("want"),
  author: z.string().max(100).optional().nullable(),
  year: z.number().int().min(1800).max(2100).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  currentProgress: z.string().max(50).optional().nullable(),
  totalProgress: z.string().max(50).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

const updateMediaItemSchema = createMediaItemSchema.partial();

const updateProgressSchema = z.object({
  currentProgress: z.string().max(50),
});

const updateStatusSchema = z.object({
  status: z.enum(["want", "current", "paused", "done", "abandoned"]),
});

export function registerMediaLibraryRoutes(app: Express) {
  const db = getDb();

  // GET /api/media-library - Get all items with optional filters
  app.get("/api/media-library", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { type, status, sort } = req.query;

      let query = db
        .select()
        .from(schema.mediaItems)
        .where(eq(schema.mediaItems.userId, userId));

      // Apply filters
      const conditions = [eq(schema.mediaItems.userId, userId)];

      if (type && typeof type === "string") {
        conditions.push(eq(schema.mediaItems.mediaType, type as any));
      }

      if (status && typeof status === "string") {
        conditions.push(eq(schema.mediaItems.status, status as any));
      }

      const items = await db
        .select()
        .from(schema.mediaItems)
        .where(and(...conditions))
        .orderBy(
          sort === "rating" ? desc(schema.mediaItems.rating) :
          sort === "title" ? asc(schema.mediaItems.title) :
          sort === "year" ? desc(schema.mediaItems.year) :
          desc(schema.mediaItems.updatedAt)
        );

      res.json(items);
    } catch (error) {
      console.error("Error fetching media items:", error);
      res.status(500).json({ error: "Failed to fetch media items" });
    }
  });

  // GET /api/media-library/current - Get only "current" status items (for widget)
  app.get("/api/media-library/current", async (req, res) => {
    try {
      const userId = getUserId(req);

      const items = await db
        .select()
        .from(schema.mediaItems)
        .where(
          and(
            eq(schema.mediaItems.userId, userId),
            eq(schema.mediaItems.status, "current")
          )
        )
        .orderBy(desc(schema.mediaItems.updatedAt))
        .limit(4);

      res.json(items);
    } catch (error) {
      console.error("Error fetching current media items:", error);
      res.status(500).json({ error: "Failed to fetch current media items" });
    }
  });

  // GET /api/media-library/:id - Get single item
  app.get("/api/media-library/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      const [item] = await db
        .select()
        .from(schema.mediaItems)
        .where(
          and(
            eq(schema.mediaItems.id, id),
            eq(schema.mediaItems.userId, userId)
          )
        );

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.json(item);
    } catch (error) {
      console.error("Error fetching media item:", error);
      res.status(500).json({ error: "Failed to fetch media item" });
    }
  });

  // POST /api/media-library - Create item
  app.post("/api/media-library", async (req, res) => {
    try {
      const userId = getUserId(req);
      const result = createMediaItemSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ error: result.error.errors });
      }

      const data = result.data;

      // Set startedAt if status is "current"
      const startedAt = data.status === "current" ? new Date() : null;
      // Set completedAt if status is "done"
      const completedAt = data.status === "done" ? new Date() : null;

      const [item] = await db
        .insert(schema.mediaItems)
        .values({
          userId,
          title: data.title,
          mediaType: data.mediaType,
          status: data.status,
          author: data.author || null,
          year: data.year || null,
          imageUrl: data.imageUrl || null,
          currentProgress: data.currentProgress || null,
          totalProgress: data.totalProgress || null,
          rating: data.rating || null,
          notes: data.notes || null,
          startedAt,
          completedAt,
        })
        .returning();

      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating media item:", error);
      res.status(500).json({ error: "Failed to create media item" });
    }
  });

  // PATCH /api/media-library/:id - Update item
  app.patch("/api/media-library/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      const result = updateMediaItemSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ error: result.error.errors });
      }

      const data = result.data;

      // Get current item to check ownership and handle status changes
      const [currentItem] = await db
        .select()
        .from(schema.mediaItems)
        .where(
          and(
            eq(schema.mediaItems.id, id),
            eq(schema.mediaItems.userId, userId)
          )
        );

      if (!currentItem) {
        return res.status(404).json({ error: "Item not found" });
      }

      // Handle status-related timestamp updates
      const updates: any = { ...data, updatedAt: new Date() };

      if (data.status) {
        // If moving to "current" and not already current, set startedAt
        if (data.status === "current" && currentItem.status !== "current" && !currentItem.startedAt) {
          updates.startedAt = new Date();
        }
        // If moving to "done", set completedAt
        if (data.status === "done" && currentItem.status !== "done") {
          updates.completedAt = new Date();
        }
        // If moving away from "done", clear completedAt
        if (data.status !== "done" && currentItem.status === "done") {
          updates.completedAt = null;
        }
      }

      const [item] = await db
        .update(schema.mediaItems)
        .set(updates)
        .where(eq(schema.mediaItems.id, id))
        .returning();

      res.json(item);
    } catch (error) {
      console.error("Error updating media item:", error);
      res.status(500).json({ error: "Failed to update media item" });
    }
  });

  // PATCH /api/media-library/:id/progress - Quick update progress only
  app.patch("/api/media-library/:id/progress", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      const result = updateProgressSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ error: result.error.errors });
      }

      // Verify ownership
      const [currentItem] = await db
        .select()
        .from(schema.mediaItems)
        .where(
          and(
            eq(schema.mediaItems.id, id),
            eq(schema.mediaItems.userId, userId)
          )
        );

      if (!currentItem) {
        return res.status(404).json({ error: "Item not found" });
      }

      const [item] = await db
        .update(schema.mediaItems)
        .set({
          currentProgress: result.data.currentProgress,
          updatedAt: new Date(),
        })
        .where(eq(schema.mediaItems.id, id))
        .returning();

      res.json(item);
    } catch (error) {
      console.error("Error updating media progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  // PATCH /api/media-library/:id/status - Cycle or set status
  app.patch("/api/media-library/:id/status", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      const result = updateStatusSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ error: result.error.errors });
      }

      // Verify ownership and get current item
      const [currentItem] = await db
        .select()
        .from(schema.mediaItems)
        .where(
          and(
            eq(schema.mediaItems.id, id),
            eq(schema.mediaItems.userId, userId)
          )
        );

      if (!currentItem) {
        return res.status(404).json({ error: "Item not found" });
      }

      const newStatus = result.data.status;
      const updates: any = { status: newStatus, updatedAt: new Date() };

      // Handle timestamp updates
      if (newStatus === "current" && currentItem.status !== "current" && !currentItem.startedAt) {
        updates.startedAt = new Date();
      }
      if (newStatus === "done" && currentItem.status !== "done") {
        updates.completedAt = new Date();
      }
      if (newStatus !== "done" && currentItem.status === "done") {
        updates.completedAt = null;
      }

      const [item] = await db
        .update(schema.mediaItems)
        .set(updates)
        .where(eq(schema.mediaItems.id, id))
        .returning();

      // Award XP for completing media item (transitioning TO "done")
      let pointsEarned = 0;
      if (newStatus === "done" && currentItem.status !== "done") {
        try {
          const existingTx = await storage.getPointTransactionByTypeAndRelatedId(
            userId, 'media_complete', id
          );
          if (!existingTx) {
            await storage.addPoints(
              userId,
              XP_CONFIG.media.complete,
              'media_complete',
              id,
              `Finished: ${currentItem.title}`
            );
            pointsEarned = XP_CONFIG.media.complete;
            await awardDailyBonusIfNeeded(userId);
          }
        } catch (xpError) {
          log.error('[media-library] XP award failed:', xpError);
        }
      }

      res.json({ ...item, pointsEarned });
    } catch (error) {
      log.error("Error updating media status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // DELETE /api/media-library/:id - Delete item
  app.delete("/api/media-library/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }

      // Verify ownership before deleting
      const [currentItem] = await db
        .select()
        .from(schema.mediaItems)
        .where(
          and(
            eq(schema.mediaItems.id, id),
            eq(schema.mediaItems.userId, userId)
          )
        );

      if (!currentItem) {
        return res.status(404).json({ error: "Item not found" });
      }

      await db
        .delete(schema.mediaItems)
        .where(eq(schema.mediaItems.id, id));

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting media item:", error);
      res.status(500).json({ error: "Failed to delete media item" });
    }
  });
}
