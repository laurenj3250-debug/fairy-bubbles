/**
 * useGoalCalendar Hook
 * Fetches goals with due dates for calendar visualization
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, format, parseISO, isBefore, differenceInDays } from "date-fns";

export interface CalendarGoal {
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

export type GoalStatus = "completed" | "on-track" | "due-soon" | "overdue" | "behind";

export interface CalendarGoalWithStatus extends CalendarGoal {
  status: GoalStatus;
  progressPercent: number;
}

function calculateGoalStatus(goal: CalendarGoal): GoalStatus {
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

  return {
    goals: goalsWithStatus,
    goalsByDate,
    isLoading,
    error,
    refetch,
    startDate,
    endDate,
  };
}
