import type { Express, Request } from "express";
import { getDb } from "../db.js";
import { projects, labels, taskLabels } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { requireUser } from "../simple-auth";
import { log } from "../lib/logger";
import { storage } from "../storage";

export function registerTodosEnhancedRoutes(app: Express) {
  // GET /api/todos-with-metadata - Get todos with projects and labels
  app.get("/api/todos-with-metadata", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      // Get all todos for user using storage (handles schema compatibility)
      const userTodos = await storage.getTodos(user.id);

      // Get all projects for user
      const userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, user.id));

      // Get all task-label relationships for user's tasks
      const todoIds = userTodos.map(t => t.id);
      const taskLabelRelations = todoIds.length > 0
        ? await db
            .select()
            .from(taskLabels)
            .where(inArray(taskLabels.taskId, todoIds))
        : [];

      // Get all labels for user
      const userLabels = await db
        .select()
        .from(labels)
        .where(eq(labels.userId, user.id));

      // Enhance todos with project and label data
      const enhancedTodos = userTodos.map(todo => {
        const todoProject = todo.projectId
          ? userProjects.find(p => p.id === todo.projectId)
          : null;

        const todoLabelIds = taskLabelRelations
          .filter(tl => tl.taskId === todo.id)
          .map(tl => tl.labelId);

        const todoLabels = userLabels.filter(l => todoLabelIds.includes(l.id));

        return {
          ...todo,
          project: todoProject || null,
          labels: todoLabels,
        };
      });

      res.json(enhancedTodos);
    } catch (error) {
      log.error("[API] Error fetching todos with metadata:", error);
      res.status(500).send("Failed to fetch todos");
    }
  });
}
