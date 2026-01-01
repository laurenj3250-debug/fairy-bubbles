/**
 * Goal Calendar Routes
 *
 * Provides goals with due dates for calendar visualization,
 * including generated milestone checkpoints.
 */

import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { yearlyGoals, goals } from "@shared/schema";
import { eq, and, isNotNull, gte, lte, or } from "drizzle-orm";
import { requireUser } from "../simple-auth";
import {
  generateMilestones,
  filterMilestonesToRange,
  detectCadence,
  type MilestoneCadence,
} from "@shared/lib/milestoneGenerator";

interface CalendarGoal {
  id: number;
  source: "yearly" | "weekly" | "milestone";
  title: string;
  dueDate: string;
  completed: boolean;
  currentValue: number;
  targetValue: number;
  category: string;
  goalType: string;
  // Milestone-specific fields
  isMilestone?: boolean;
  checkpointNumber?: number;
  expectedValue?: number;
  goalId?: number;
}

export function registerGoalCalendarRoutes(app: Express) {
  /**
   * GET /api/goal-calendar
   * Returns all goals with due dates within a date range,
   * plus generated milestone checkpoints for count-type goals
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

      // Extract year from date range for milestone generation
      const year = startDate.substring(0, 4);

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
          milestoneCadence: yearlyGoals.milestoneCadence,
          year: yearlyGoals.year,
        })
        .from(yearlyGoals)
        .where(
          and(
            eq(yearlyGoals.userId, user.id),
            eq(yearlyGoals.year, year)
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

      // Transform yearly goals (only those with due dates in range)
      const yearlyGoalsInRange = yearlyResults
        .filter((g) => g.dueDate && g.dueDate >= startDate && g.dueDate <= endDate)
        .map((g) => ({
          id: g.id,
          source: "yearly" as const,
          title: g.title,
          dueDate: g.dueDate!,
          completed: g.completed,
          currentValue: g.currentValue,
          targetValue: g.targetValue,
          category: g.category,
          goalType: g.goalType,
        }));

      // Transform weekly goals
      const weeklyGoalsInRange = weeklyResults.map((g) => ({
        id: g.id,
        source: "weekly" as const,
        title: g.title,
        dueDate: g.dueDate!,
        completed: g.currentValue >= g.targetValue,
        currentValue: g.currentValue,
        targetValue: g.targetValue,
        category: "weekly",
        goalType: "count",
      }));

      // Generate milestones for count-type goals with cadences
      const milestoneGoals: CalendarGoal[] = [];

      for (const goal of yearlyResults) {
        // Generate milestones for count and compound goals with target > 1
        if ((goal.goalType !== "count" && goal.goalType !== "compound") || goal.targetValue <= 1) continue;

        // Determine cadence (use stored value or auto-detect)
        const cadence: MilestoneCadence | null =
          (goal.milestoneCadence as MilestoneCadence) || detectCadence(goal.targetValue);

        if (!cadence) continue;

        // Generate all milestones for the year
        const allMilestones = generateMilestones(
          goal.id,
          goal.title,
          goal.year,
          goal.targetValue,
          cadence
        );

        // Filter to requested date range
        const rangeMilestones = filterMilestonesToRange(allMilestones, startDate, endDate);

        // Convert to CalendarGoal format
        for (const m of rangeMilestones) {
          milestoneGoals.push({
            id: goal.id * 1000 + m.checkpointNumber, // Unique ID
            source: "milestone",
            title: `${goal.title}`,
            dueDate: m.dueDate,
            completed: goal.currentValue >= m.expectedValue,
            currentValue: goal.currentValue,
            targetValue: m.expectedValue, // Expected value at this checkpoint
            category: goal.category,
            goalType: "milestone",
            isMilestone: true,
            checkpointNumber: m.checkpointNumber,
            expectedValue: m.expectedValue,
            goalId: goal.id,
          });
        }
      }

      // Combine all goals
      const calendarGoals: CalendarGoal[] = [
        ...yearlyGoalsInRange,
        ...weeklyGoalsInRange,
        ...milestoneGoals,
      ];

      res.json({ goals: calendarGoals });
    } catch (error) {
      console.error("[goal-calendar] Error:", error);
      res.status(500).json({ error: "Failed to fetch calendar goals" });
    }
  });
}
