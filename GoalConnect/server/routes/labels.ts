import type { Express } from "express";
import { db } from "@db";
import { labels, taskLabels, todos } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export function registerLabelRoutes(app: Express) {
  // GET /api/labels - Get all labels for user
  app.get("/api/labels", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const userLabels = await db
        .select()
        .from(labels)
        .where(eq(labels.userId, req.user.id))
        .orderBy(labels.name);

      res.json(userLabels);
    } catch (error) {
      console.error("[API] Error fetching labels:", error);
      res.status(500).send("Failed to fetch labels");
    }
  });

  // POST /api/labels - Create new label
  app.post("/api/labels", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { name, color } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).send("Label name is required");
      }

      // Check if label with same name already exists
      const existing = await db
        .select()
        .from(labels)
        .where(
          and(
            eq(labels.userId, req.user.id),
            eq(labels.name, name.trim())
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).send("Label with this name already exists");
      }

      const [newLabel] = await db
        .insert(labels)
        .values({
          userId: req.user.id,
          name: name.trim(),
          color: color || "#gray",
        })
        .returning();

      res.json(newLabel);
    } catch (error) {
      console.error("[API] Error creating label:", error);
      res.status(500).send("Failed to create label");
    }
  });

  // PATCH /api/labels/:id - Update label
  app.patch("/api/labels/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const labelId = parseInt(req.params.id);
      const { name, color } = req.body;

      const [updatedLabel] = await db
        .update(labels)
        .set({
          ...(name && { name: name.trim() }),
          ...(color && { color }),
        })
        .where(
          and(
            eq(labels.id, labelId),
            eq(labels.userId, req.user.id)
          )
        )
        .returning();

      if (!updatedLabel) {
        return res.status(404).send("Label not found");
      }

      res.json(updatedLabel);
    } catch (error) {
      console.error("[API] Error updating label:", error);
      res.status(500).send("Failed to update label");
    }
  });

  // DELETE /api/labels/:id - Delete label
  app.delete("/api/labels/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const labelId = parseInt(req.params.id);

      const [deletedLabel] = await db
        .delete(labels)
        .where(
          and(
            eq(labels.id, labelId),
            eq(labels.userId, req.user.id)
          )
        )
        .returning();

      if (!deletedLabel) {
        return res.status(404).send("Label not found");
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[API] Error deleting label:", error);
      res.status(500).send("Failed to delete label");
    }
  });

  // GET /api/tasks/:taskId/labels - Get labels for a task
  app.get("/api/tasks/:taskId/labels", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const taskId = parseInt(req.params.taskId);

      // Verify task belongs to user
      const [task] = await db
        .select()
        .from(todos)
        .where(
          and(
            eq(todos.id, taskId),
            eq(todos.userId, req.user.id)
          )
        )
        .limit(1);

      if (!task) {
        return res.status(404).send("Task not found");
      }

      // Get task labels
      const taskLabelRelations = await db
        .select()
        .from(taskLabels)
        .where(eq(taskLabels.taskId, taskId));

      if (taskLabelRelations.length === 0) {
        return res.json([]);
      }

      const labelIds = taskLabelRelations.map(tl => tl.labelId);
      const taskLabelsData = await db
        .select()
        .from(labels)
        .where(inArray(labels.id, labelIds));

      res.json(taskLabelsData);
    } catch (error) {
      console.error("[API] Error fetching task labels:", error);
      res.status(500).send("Failed to fetch task labels");
    }
  });

  // POST /api/tasks/:taskId/labels - Add label to task
  app.post("/api/tasks/:taskId/labels", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const taskId = parseInt(req.params.taskId);
      const { labelId } = req.body;

      if (!labelId) {
        return res.status(400).send("Label ID is required");
      }

      // Verify task belongs to user
      const [task] = await db
        .select()
        .from(todos)
        .where(
          and(
            eq(todos.id, taskId),
            eq(todos.userId, req.user.id)
          )
        )
        .limit(1);

      if (!task) {
        return res.status(404).send("Task not found");
      }

      // Verify label belongs to user
      const [label] = await db
        .select()
        .from(labels)
        .where(
          and(
            eq(labels.id, labelId),
            eq(labels.userId, req.user.id)
          )
        )
        .limit(1);

      if (!label) {
        return res.status(404).send("Label not found");
      }

      // Insert task-label relationship (ignore if already exists)
      try {
        const [newTaskLabel] = await db
          .insert(taskLabels)
          .values({
            taskId,
            labelId,
          })
          .returning();

        res.json(newTaskLabel);
      } catch (error: any) {
        // If duplicate key, just return success
        if (error.code === '23505') {
          res.json({ success: true, message: "Label already applied" });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("[API] Error adding label to task:", error);
      res.status(500).send("Failed to add label to task");
    }
  });

  // DELETE /api/tasks/:taskId/labels/:labelId - Remove label from task
  app.delete("/api/tasks/:taskId/labels/:labelId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const taskId = parseInt(req.params.taskId);
      const labelId = parseInt(req.params.labelId);

      // Verify task belongs to user
      const [task] = await db
        .select()
        .from(todos)
        .where(
          and(
            eq(todos.id, taskId),
            eq(todos.userId, req.user.id)
          )
        )
        .limit(1);

      if (!task) {
        return res.status(404).send("Task not found");
      }

      await db
        .delete(taskLabels)
        .where(
          and(
            eq(taskLabels.taskId, taskId),
            eq(taskLabels.labelId, labelId)
          )
        );

      res.json({ success: true });
    } catch (error) {
      console.error("[API] Error removing label from task:", error);
      res.status(500).send("Failed to remove label from task");
    }
  });
}
