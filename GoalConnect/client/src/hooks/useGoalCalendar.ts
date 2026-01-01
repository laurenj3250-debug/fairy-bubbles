/**
 * useGoalCalendar Hook
 * Fetches goals with due dates for calendar visualization,
 * including milestone checkpoints
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, format, parseISO, isBefore, differenceInDays } from "date-fns";

export interface CalendarGoal {
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

export type GoalStatus =
  | "completed"
  | "on-track"
  | "due-soon"
  | "overdue"
  | "behind"
  | "milestone-met"
  | "milestone-behind";

export interface CalendarGoalWithStatus extends CalendarGoal {
  status: GoalStatus;
  progressPercent: number;
}

export interface ConsolidatedGoal {
  goalId: number;
  title: string;
  source: "yearly" | "weekly" | "milestone";
  category: string;
  currentValue: number;
  targetValue: number;
  milestonesThisMonth: number;
  milestonesMet: number;
  nextDueDate: string | null;
  isCompleted: boolean;
  progressPercent: number;
}

function calculateGoalStatus(goal: CalendarGoal): GoalStatus {
  // Handle milestones differently
  if (goal.isMilestone || goal.source === "milestone") {
    const now = new Date();
    const dueDate = parseISO(goal.dueDate);
    const expectedValue = goal.expectedValue || goal.targetValue;

    // Check if milestone is met
    if (goal.currentValue >= expectedValue) {
      return "milestone-met";
    }

    // Check if milestone is overdue
    if (isBefore(dueDate, now)) {
      return "milestone-behind";
    }

    // Upcoming milestone - check if on track
    return "on-track";
  }

  // Regular goal status calculation
  if (goal.completed) return "completed";

  const now = new Date();
  const dueDate = parseISO(goal.dueDate);
  const daysUntilDue = differenceInDays(dueDate, now);

  // Overdue check
  if (isBefore(dueDate, now)) return "overdue";

  // Due soon (within 14 days)
  if (daysUntilDue <= 14) return "due-soon";

  // Progress check for count goals
  if (goal.targetValue > 1) {
    const progressPercent = (goal.currentValue / goal.targetValue) * 100;

    // Calculate expected progress based on time
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const totalDays = differenceInDays(dueDate, yearStart);
    const daysPassed = differenceInDays(now, yearStart);
    const expectedPercent = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

    // Behind if more than 15% under expected
    if (progressPercent < expectedPercent * 0.85) return "behind";
  }

  return "on-track";
}

export function useGoalCalendar(month: Date) {
  const startDate = format(startOfMonth(month), "yyyy-MM-dd");
  const endDate = format(endOfMonth(month), "yyyy-MM-dd");

  const { data, isLoading, error, refetch } = useQuery<{ goals: CalendarGoal[] }>({
    queryKey: [`/api/goal-calendar?startDate=${startDate}&endDate=${endDate}`],
    staleTime: 30 * 1000, // 30 seconds
  });

  // Process goals with status
  const goalsWithStatus = useMemo((): CalendarGoalWithStatus[] => {
    if (!data?.goals) return [];

    return data.goals.map((goal) => ({
      ...goal,
      status: calculateGoalStatus(goal),
      progressPercent: goal.targetValue > 0
        ? Math.round((goal.currentValue / goal.targetValue) * 100)
        : goal.completed ? 100 : 0,
    }));
  }, [data]);

  // Separate milestones from regular goals
  const { regularGoals, milestones } = useMemo(() => {
    const regular: CalendarGoalWithStatus[] = [];
    const miles: CalendarGoalWithStatus[] = [];

    goalsWithStatus.forEach((goal) => {
      if (goal.isMilestone || goal.source === "milestone") {
        miles.push(goal);
      } else {
        regular.push(goal);
      }
    });

    return { regularGoals: regular, milestones: miles };
  }, [goalsWithStatus]);

  // Group goals by date for calendar rendering
  const goalsByDate = useMemo(() => {
    const map = new Map<string, CalendarGoalWithStatus[]>();

    goalsWithStatus.forEach((goal) => {
      const existing = map.get(goal.dueDate) || [];
      existing.push(goal);
      map.set(goal.dueDate, existing);
    });

    return map;
  }, [goalsWithStatus]);

  // Get all goals for this month (for deadline summary)
  const goalsThisMonth = useMemo(() => {
    return goalsWithStatus
      .filter((g) => !g.isMilestone && g.source !== "milestone")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [goalsWithStatus]);

  // Consolidate goals - group milestones by parent goal
  const consolidatedGoals = useMemo((): ConsolidatedGoal[] => {
    const goalMap = new Map<number, ConsolidatedGoal>();

    goalsWithStatus.forEach((goal) => {
      // For milestones, use goalId; for regular goals, use id
      const parentId = goal.goalId || goal.id;

      const existing = goalMap.get(parentId);

      if (existing) {
        // Add to existing consolidated goal
        existing.milestonesThisMonth += 1;
        if (goal.status === "milestone-met" || goal.status === "completed") {
          existing.milestonesMet += 1;
        }
        // Track earliest unmet due date
        if (!existing.nextDueDate ||
            (goal.status !== "milestone-met" && goal.status !== "completed" &&
             goal.dueDate < existing.nextDueDate)) {
          existing.nextDueDate = goal.dueDate;
        }
      } else {
        // Create new consolidated goal entry
        const isMet = goal.status === "milestone-met" || goal.status === "completed";
        goalMap.set(parentId, {
          goalId: parentId,
          title: goal.title,
          source: goal.source,
          category: goal.category,
          currentValue: goal.currentValue,
          targetValue: goal.targetValue,
          milestonesThisMonth: 1,
          milestonesMet: isMet ? 1 : 0,
          nextDueDate: isMet ? null : goal.dueDate,
          isCompleted: goal.currentValue >= goal.targetValue,
          progressPercent: goal.targetValue > 0
            ? Math.round((goal.currentValue / goal.targetValue) * 100)
            : 0,
        });
      }
    });

    // Sort by next due date (nulls last = completed goals at end)
    return Array.from(goalMap.values()).sort((a, b) => {
      if (!a.nextDueDate && !b.nextDueDate) return 0;
      if (!a.nextDueDate) return 1;
      if (!b.nextDueDate) return -1;
      return a.nextDueDate.localeCompare(b.nextDueDate);
    });
  }, [goalsWithStatus]);

  return {
    goals: goalsWithStatus,
    consolidatedGoals,
    regularGoals,
    milestones,
    goalsByDate,
    goalsThisMonth,
    isLoading,
    error,
    refetch,
    startDate,
    endDate,
  };
}
