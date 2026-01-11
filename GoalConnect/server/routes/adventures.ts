/**
 * Outdoor Adventures & Bird Sightings API Routes
 * Photo-centric tracking for outdoor days and bird life list
 */

import type { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Jimp } from "jimp";
import { getDb } from "../db";
import { outdoorAdventures, birdSightings } from "@shared/schema";
import { eq, and, desc, asc, sql, ilike } from "drizzle-orm";
import { requireUser } from "../simple-auth";
import { asyncHandler } from "../error-handler";
import { z } from "zod";

const getUserId = (req: Request) => requireUser(req).id;

// Validate and parse integer ID
function parseId(idStr: string): number | null {
  const id = parseInt(idStr, 10);
  return isNaN(id) || id < 1 ? null : id;
}

// Normalize species name to title case for consistent storage
function normalizeSpeciesName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// =============================================================================
// FILE UPLOAD CONFIGURATION
// =============================================================================

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const THUMB_WIDTH = 400;

// Ensure upload directories exist
function ensureUploadDirs(userId: number): { adventures: string; birds: string } {
  const adventuresDir = path.join(UPLOAD_DIR, String(userId), "adventures");
  const birdsDir = path.join(UPLOAD_DIR, String(userId), "birds");

  if (!fs.existsSync(adventuresDir)) {
    fs.mkdirSync(adventuresDir, { recursive: true });
  }
  if (!fs.existsSync(birdsDir)) {
    fs.mkdirSync(birdsDir, { recursive: true });
  }

  return { adventures: adventuresDir, birds: birdsDir };
}

// Configure multer for adventure/bird uploads
const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const userId = getUserId(req);
    const dirs = ensureUploadDirs(userId);
    const isBird = req.path.includes("/birds");
    cb(null, isBird ? dirs.birds : dirs.adventures);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${timestamp}-${random}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith("image/");

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed"));
    }
  },
});

// Generate thumbnail from uploaded image
async function generateThumbnail(originalPath: string): Promise<string> {
  const dir = path.dirname(originalPath);
  const ext = path.extname(originalPath);
  const base = path.basename(originalPath, ext);
  const thumbPath = path.join(dir, `${base}_thumb${ext}`);

  try {
    const image = await Jimp.read(originalPath);
    image.resize({ w: THUMB_WIDTH });
    await image.write(thumbPath as `${string}.${string}`);
    return thumbPath;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    // Return original path if thumbnail generation fails
    return originalPath;
  }
}

// Convert file path to URL path
function toUrlPath(filePath: string): string {
  // Normalize backslashes to forward slashes for Windows compatibility
  const normalized = filePath.replace(/\\/g, '/');

  const publicIndex = normalized.indexOf("/public/");
  if (publicIndex !== -1) {
    return normalized.substring(publicIndex + "/public".length);
  }
  // Fallback: get path relative to uploads
  const uploadsIndex = normalized.indexOf("/uploads/");
  if (uploadsIndex !== -1) {
    return normalized.substring(uploadsIndex);
  }
  return normalized;
}

// Delete photo files
function deletePhotoFiles(photoPath: string | null, thumbPath: string | null) {
  if (photoPath) {
    const fullPath = path.join(process.cwd(), "public", photoPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
  if (thumbPath && thumbPath !== photoPath) {
    const fullPath = path.join(process.cwd(), "public", thumbPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}

// Cleanup uploaded file on error (deletes file and any generated thumbnail)
function cleanupUploadedFile(file?: Express.Multer.File) {
  if (!file?.path) return;

  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    // Also try to delete thumbnail if it exists
    const ext = path.extname(file.path);
    const base = path.basename(file.path, ext);
    const dir = path.dirname(file.path);
    const thumbPath = path.join(dir, `${base}_thumb${ext}`);
    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
    }
  } catch (error) {
    console.error("Error cleaning up uploaded file:", error);
  }
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const createAdventureSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  activity: z.string().min(1, "Activity is required"),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const updateAdventureSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  activity: z.string().min(1).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const createBirdSchema = z.object({
  speciesName: z.string().min(1, "Species name is required"),
  firstSeenDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  firstSeenAdventureId: z.number().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const updateBirdSchema = z.object({
  speciesName: z.string().min(1).optional(),
  firstSeenDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  firstSeenAdventureId: z.number().nullable().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// =============================================================================
// REGISTER ROUTES
// =============================================================================

export function registerAdventuresRoutes(app: Express) {
  const db = getDb();

  // ==========================================================================
  // ADVENTURES ROUTES
  // ==========================================================================

  // GET /api/adventures - List all adventures (paginated, by date desc)
  app.get(
    "/api/adventures",
    asyncHandler(async (req: Request, res: Response) => {
      const userId = getUserId(req);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 24;
      const offset = (page - 1) * limit;
      const year = req.query.year as string;

      const conditions = [eq(outdoorAdventures.userId, userId)];
      if (year) {
        conditions.push(sql`${outdoorAdventures.date} LIKE ${year + '%'}`);
      }

      const [adventures, countResult] = await Promise.all([
        db
          .select()
          .from(outdoorAdventures)
          .where(and(...conditions))
          .orderBy(desc(outdoorAdventures.date), desc(outdoorAdventures.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(outdoorAdventures)
          .where(and(...conditions)),
      ]);

      const total = Number(countResult[0]?.count ?? 0);

      res.json({
        adventures,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    })
  );

  // GET /api/adventures/dates/:year - Get unique adventure dates for a year
  app.get(
    "/api/adventures/dates/:year",
    asyncHandler(async (req: Request, res: Response) => {
      const userId = getUserId(req);
      const year = req.params.year;

      const result = await db
        .selectDistinct({ date: outdoorAdventures.date })
        .from(outdoorAdventures)
        .where(
          and(
            eq(outdoorAdventures.userId, userId),
            sql`${outdoorAdventures.date} LIKE ${year + '%'}`
          )
        );

      res.json({ dates: result.map((r) => r.date) });
    })
  );

  // GET /api/adventures/:id - Get single adventure
  app.get(
    "/api/adventures/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const userId = getUserId(req);
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const [adventure] = await db
        .select()
        .from(outdoorAdventures)
        .where(and(eq(outdoorAdventures.id, id), eq(outdoorAdventures.userId, userId)));

      if (!adventure) {
        return res.status(404).json({ error: "Adventure not found" });
      }

      res.json(adventure);
    })
  );

  // POST /api/adventures - Create adventure with optional photo
  app.post(
    "/api/adventures",
    upload.single("photo"),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = getUserId(req);

      const parsed = createAdventureSchema.safeParse(req.body);
      if (!parsed.success) {
        cleanupUploadedFile(req.file);
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { date, activity, location, notes } = parsed.data;
      let photoPath: string | null = null;
      let thumbPath: string | null = null;

      // Handle photo upload
      if (req.file) {
        photoPath = toUrlPath(req.file.path);
        const thumbFullPath = await generateThumbnail(req.file.path);
        thumbPath = toUrlPath(thumbFullPath);
      }

      try {
        const [adventure] = await db
          .insert(outdoorAdventures)
          .values({
            userId,
            date,
            activity,
            location: location || null,
            photoPath,
            thumbPath,
            notes: notes || null,
          })
          .returning();

        res.status(201).json(adventure);
      } catch (error) {
        cleanupUploadedFile(req.file);
        throw error;
      }
    })
  );

  // PUT /api/adventures/:id - Update adventure (can replace photo)
  app.put(
    "/api/adventures/:id",
    upload.single("photo"),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = getUserId(req);
      const id = parseId(req.params.id);
      if (id === null) {
        cleanupUploadedFile(req.file);
        return res.status(400).json({ error: "Invalid ID" });
      }

      // Get existing adventure
      const [existing] = await db
        .select()
        .from(outdoorAdventures)
        .where(and(eq(outdoorAdventures.id, id), eq(outdoorAdventures.userId, userId)));

      if (!existing) {
        cleanupUploadedFile(req.file);
        return res.status(404).json({ error: "Adventure not found" });
      }

      const parsed = updateAdventureSchema.safeParse(req.body);
      if (!parsed.success) {
        cleanupUploadedFile(req.file);
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const updates: Record<string, unknown> = {
        ...parsed.data,
        updatedAt: new Date(),
      };

      // Handle photo replacement - track old paths for cleanup after DB success
      const oldPhotoPath = existing.photoPath;
      const oldThumbPath = existing.thumbPath;

      if (req.file) {
        updates.photoPath = toUrlPath(req.file.path);
        const thumbFullPath = await generateThumbnail(req.file.path);
        updates.thumbPath = toUrlPath(thumbFullPath);
      }

      try {
        const [updated] = await db
          .update(outdoorAdventures)
          .set(updates)
          .where(and(eq(outdoorAdventures.id, id), eq(outdoorAdventures.userId, userId)))
          .returning();

        // Only delete old photos AFTER successful DB update
        if (req.file) {
          deletePhotoFiles(oldPhotoPath, oldThumbPath);
        }

        res.json(updated);
      } catch (error) {
        cleanupUploadedFile(req.file);
        throw error;
      }
    })
  );

  // DELETE /api/adventures/:id - Delete adventure + files
  app.delete(
    "/api/adventures/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const userId = getUserId(req);
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      // Get existing adventure
      const [existing] = await db
        .select()
        .from(outdoorAdventures)
        .where(and(eq(outdoorAdventures.id, id), eq(outdoorAdventures.userId, userId)));

      if (!existing) {
        return res.status(404).json({ error: "Adventure not found" });
      }

      // Delete photo files
      deletePhotoFiles(existing.photoPath, existing.thumbPath);

      // Delete from database
      await db
        .delete(outdoorAdventures)
        .where(and(eq(outdoorAdventures.id, id), eq(outdoorAdventures.userId, userId)));

      res.json({ success: true });
    })
  );

  // ==========================================================================
  // BIRDS ROUTES
  // ==========================================================================

  // GET /api/birds - List life list (sortable, searchable)
  app.get(
    "/api/birds",
    asyncHandler(async (req: Request, res: Response) => {
      const userId = getUserId(req);

      const sort = (req.query.sort as string) || "alphabetical";
      const search = req.query.search as string;
      const year = req.query.year as string;

      const conditions = [eq(birdSightings.userId, userId)];
      if (search) {
        conditions.push(ilike(birdSightings.speciesName, `%${search}%`));
      }
      if (year) {
        conditions.push(sql`${birdSightings.firstSeenDate} LIKE ${year + '%'}`);
      }

      let orderBy;
      switch (sort) {
        case "date_desc":
          orderBy = desc(birdSightings.firstSeenDate);
          break;
        case "date_asc":
          orderBy = asc(birdSightings.firstSeenDate);
          break;
        case "recent":
          orderBy = desc(birdSightings.createdAt);
          break;
        case "alphabetical":
        default:
          orderBy = asc(birdSightings.speciesName);
      }

      const birds = await db
        .select()
        .from(birdSightings)
        .where(and(...conditions))
        .orderBy(orderBy);

      res.json({ birds, total: birds.length });
    })
  );

  // GET /api/birds/count/:year - Count species first seen in year
  app.get(
    "/api/birds/count/:year",
    asyncHandler(async (req: Request, res: Response) => {
      const userId = getUserId(req);
      const year = req.params.year;

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(birdSightings)
        .where(
          and(
            eq(birdSightings.userId, userId),
            sql`${birdSightings.firstSeenDate} LIKE ${year + '%'}`
          )
        );

      res.json({ count: Number(result[0]?.count ?? 0) });
    })
  );

  // GET /api/birds/:id - Get single species entry
  app.get(
    "/api/birds/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const userId = getUserId(req);
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const [bird] = await db
        .select()
        .from(birdSightings)
        .where(and(eq(birdSightings.id, id), eq(birdSightings.userId, userId)));

      if (!bird) {
        return res.status(404).json({ error: "Bird not found" });
      }

      res.json(bird);
    })
  );

  // POST /api/birds - Add species to life list
  app.post(
    "/api/birds",
    upload.single("photo"),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = getUserId(req);

      const parsed = createBirdSchema.safeParse({
        ...req.body,
        firstSeenAdventureId: req.body.firstSeenAdventureId
          ? parseInt(req.body.firstSeenAdventureId)
          : undefined,
      });
      if (!parsed.success) {
        cleanupUploadedFile(req.file);
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { firstSeenDate, firstSeenAdventureId, location, notes } = parsed.data;
      // Normalize species name to title case for consistent storage
      const normalizedSpeciesName = normalizeSpeciesName(parsed.data.speciesName);

      // Check for duplicate species (case-insensitive)
      const [existing] = await db
        .select()
        .from(birdSightings)
        .where(
          and(
            eq(birdSightings.userId, userId),
            sql`LOWER(${birdSightings.speciesName}) = LOWER(${normalizedSpeciesName})`
          )
        );

      if (existing) {
        cleanupUploadedFile(req.file);
        return res.status(409).json({ error: "Species already in your life list" });
      }

      let photoPath: string | null = null;
      let thumbPath: string | null = null;

      // Handle photo upload
      if (req.file) {
        photoPath = toUrlPath(req.file.path);
        const thumbFullPath = await generateThumbnail(req.file.path);
        thumbPath = toUrlPath(thumbFullPath);
      }

      try {
        const [bird] = await db
          .insert(birdSightings)
          .values({
            userId,
            speciesName: normalizedSpeciesName,
            firstSeenDate,
            firstSeenAdventureId: firstSeenAdventureId || null,
            location: location || null,
            photoPath,
            thumbPath,
            notes: notes || null,
          })
          .returning();

        res.status(201).json(bird);
      } catch (error) {
        cleanupUploadedFile(req.file);
        throw error;
      }
    })
  );

  // PUT /api/birds/:id - Update species (can replace photo)
  app.put(
    "/api/birds/:id",
    upload.single("photo"),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = getUserId(req);
      const id = parseId(req.params.id);
      if (id === null) {
        cleanupUploadedFile(req.file);
        return res.status(400).json({ error: "Invalid ID" });
      }

      // Get existing bird
      const [existing] = await db
        .select()
        .from(birdSightings)
        .where(and(eq(birdSightings.id, id), eq(birdSightings.userId, userId)));

      if (!existing) {
        cleanupUploadedFile(req.file);
        return res.status(404).json({ error: "Bird not found" });
      }

      const parsed = updateBirdSchema.safeParse({
        ...req.body,
        firstSeenAdventureId:
          req.body.firstSeenAdventureId === "null"
            ? null
            : req.body.firstSeenAdventureId
            ? parseInt(req.body.firstSeenAdventureId)
            : undefined,
      });
      if (!parsed.success) {
        cleanupUploadedFile(req.file);
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      // Normalize species name if provided
      const normalizedSpeciesName = parsed.data.speciesName
        ? normalizeSpeciesName(parsed.data.speciesName)
        : undefined;

      // If changing species name, check for duplicates (case-insensitive)
      if (normalizedSpeciesName && normalizedSpeciesName.toLowerCase() !== existing.speciesName.toLowerCase()) {
        const [duplicate] = await db
          .select()
          .from(birdSightings)
          .where(
            and(
              eq(birdSightings.userId, userId),
              sql`LOWER(${birdSightings.speciesName}) = LOWER(${normalizedSpeciesName})`
            )
          );

        if (duplicate) {
          cleanupUploadedFile(req.file);
          return res.status(409).json({ error: "Species already in your life list" });
        }
      }

      const updates: Record<string, unknown> = {
        ...parsed.data,
        updatedAt: new Date(),
      };
      // Use normalized species name if provided
      if (normalizedSpeciesName) {
        updates.speciesName = normalizedSpeciesName;
      }

      // Handle photo replacement - track old paths for cleanup after DB success
      const oldPhotoPath = existing.photoPath;
      const oldThumbPath = existing.thumbPath;

      if (req.file) {
        updates.photoPath = toUrlPath(req.file.path);
        const thumbFullPath = await generateThumbnail(req.file.path);
        updates.thumbPath = toUrlPath(thumbFullPath);
      }

      try {
        const [updated] = await db
          .update(birdSightings)
          .set(updates)
          .where(and(eq(birdSightings.id, id), eq(birdSightings.userId, userId)))
          .returning();

        // Only delete old photos AFTER successful DB update
        if (req.file) {
          deletePhotoFiles(oldPhotoPath, oldThumbPath);
        }

        res.json(updated);
      } catch (error) {
        cleanupUploadedFile(req.file);
        throw error;
      }
    })
  );

  // DELETE /api/birds/:id - Remove from life list
  app.delete(
    "/api/birds/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const userId = getUserId(req);
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      // Get existing bird
      const [existing] = await db
        .select()
        .from(birdSightings)
        .where(and(eq(birdSightings.id, id), eq(birdSightings.userId, userId)));

      if (!existing) {
        return res.status(404).json({ error: "Bird not found" });
      }

      // Delete photo files
      deletePhotoFiles(existing.photoPath, existing.thumbPath);

      // Delete from database
      await db
        .delete(birdSightings)
        .where(and(eq(birdSightings.id, id), eq(birdSightings.userId, userId)));

      res.json({ success: true });
    })
  );
}
