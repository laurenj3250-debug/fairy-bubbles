import type { Express } from "express";
import { getDb } from "../db.js";
import { projects } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "../simple-auth";

export function registerProjectRoutes(app: Express) {
  // GET /api/projects - Get all projects for user
  app.get("/api/projects", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const userProjects = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.userId, user.id),
            eq(projects.archived, false)
          )
        )
        .orderBy(projects.position, projects.createdAt);

      res.json(userProjects);
    } catch (error) {
      console.error("[API] Error fetching projects:", error);
      res.status(500).send("Failed to fetch projects");
    }
  });

  // POST /api/projects - Create new project
  app.post("/api/projects", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const { name, color, icon, parentId } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).send("Project name is required");
      }

      const [newProject] = await db
        .insert(projects)
        .values({
          userId: user.id,
          name: name.trim(),
          color: color || "#3b82f6",
          icon: icon || "📁",
          parentId: parentId || null,
        })
        .returning();

      res.json(newProject);
    } catch (error) {
      console.error("[API] Error creating project:", error);
      res.status(500).send("Failed to create project");
    }
  });

  // PATCH /api/projects/:id - Update project
  app.patch("/api/projects/:id", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const projectId = parseInt(req.params.id);
      const updates = req.body;

      const [updatedProject] = await db
        .update(projects)
        .set({
          ...updates,
          ...(updates.name && { name: updates.name.trim() }),
        })
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.userId, user.id)
          )
        )
        .returning();

      if (!updatedProject) {
        return res.status(404).send("Project not found");
      }

      res.json(updatedProject);
    } catch (error) {
      console.error("[API] Error updating project:", error);
      res.status(500).send("Failed to update project");
    }
  });

  // DELETE /api/projects/:id - Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const projectId = parseInt(req.params.id);

      const [deletedProject] = await db
        .delete(projects)
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.userId, user.id)
          )
        )
        .returning();

      if (!deletedProject) {
        return res.status(404).send("Project not found");
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[API] Error deleting project:", error);
      res.status(500).send("Failed to delete project");
    }
  });

  // PATCH /api/projects/:id/archive - Archive/unarchive project
  app.patch("/api/projects/:id/archive", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const projectId = parseInt(req.params.id);
      const { archived } = req.body;

      const [updatedProject] = await db
        .update(projects)
        .set({ archived: archived ?? true })
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.userId, user.id)
          )
        )
        .returning();

      if (!updatedProject) {
        return res.status(404).send("Project not found");
      }

      res.json(updatedProject);
    } catch (error) {
      console.error("[API] Error archiving project:", error);
      res.status(500).send("Failed to archive project");
    }
  });
}
