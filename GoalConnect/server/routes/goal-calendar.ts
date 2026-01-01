/**
 * Goal Calendar Routes
 *
 * Provides goals with due dates for calendar visualization.
 */

import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { yearlyGoals, goals } from "@shared/schema";
import { eq, and, isNotNull, gte, lte } from "drizzle-orm";
import { requireUser } from "../simple-auth";

interface CalendarGoal {
  id: number;
  source: "yearly" | "weekly";
  title: string;
  dueDate: string;
  completed: boolean;
  currentValue: number;
  targetValue: number;
  category: string;
  goalType: string;
}

export function registerGoalCalendarRoutes(app: Express) {
  /**
   * GET /api/goal-calendar
   * Returns all goals with due dates within a date range
   * Query params: startDate, endDate (YYYY-MM-DD format)
   */
  app.get("/api/goal-calendar", async (req: Request, res: Response) => {
    try {
      const user = requireUser(req);
      const db = getDb();

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      // Fetch yearly goals with due dates in range
      const yearlyResults = await db
        .select({
          id: yearlyGoals.id,
          title: yearlyGoals.title,
          dueDate: yearlyGoals.dueDate,
          completed: yearlyGoals.completed,
          currentValue: yearlyGoals.currentValue,
          targetValue: yearlyGoals.targetValue,
          category: yearlyGoals.category,
          goalType: yearlyGoals.goalType,
        })
        .from(yearlyGoals)
        .where(
          and(
            eq(yearlyGoals.userId, user.id),
            isNotNull(yearlyGoals.dueDate),
            gte(yearlyGoals.dueDate, startDate),
            lte(yearlyGoals.dueDate, endDate)
          )
        );

      // Fetch weekly/monthly goals with deadlines in range
      const weeklyResults = await db
        .select({
          id: goals.id,
          title: goals.title,
          dueDate: goals.deadline,
          currentValue: goals.currentValue,
          targetValue: goals.targetValue,
        })
        .from(goals)
        .where(
          and(
            eq(goals.userId, user.id),
            isNotNull(goals.deadline),
            gte(goals.deadline, startDate),
            lte(goals.deadline, endDate)
          )
        );

      // Transform and combine results
      const calendarGoals: CalendarGoal[] = [
        ...yearlyResults.map((g) => ({
          id: g.id,
          source: "yearly" as const,
          title: g.title,
          dueDate: g.dueDate!,
          completed: g.completed,
          currentValue: g.currentValue,
          targetValue: g.targetValue,
          category: g.category,
          goalType: g.goalType,
        })),
        ...weeklyResults.map((g) => ({
          id: g.id,
          source: "weekly" as const,
          title: g.title,
          dueDate: g.dueDate!,
          completed: g.currentValue >= g.targetValue,
          currentValue: g.currentValue,
          targetValue: g.targetValue,
          category: "weekly",
          goalType: "count",
        })),
      ];

      res.json({ goals: calendarGoals });
    } catch (error) {
      console.error("[goal-calendar] Error:", error);
      res.status(500).json({ error: "Failed to fetch calendar goals" });
    }
  });
}
