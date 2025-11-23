import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Habit, Goal, Todo } from "@shared/schema";

interface HabitWithData extends Habit {
  streak: { streak: number };
  weeklyCompletion: number;
  history: Array<{ date: string; completed: boolean }>;
}

interface ConqueredItem {
  id: number;
  type: "goal" | "habit" | "task";
  title: string;
  icon: string;
  badge: string;
  badgeType: "goal" | "habit" | "task";
  completedAt?: string;
}

interface FocusArea {
  type: "habit" | "goal";
  title: string;
  message: string;
  percentDrop?: number;
}

interface Comparison {
  overall: number;
  habits: number;
  goalsCompleted: number;
  vsMonth: string;
}

export interface SummitLogData {
  month: string;
  monthName: string;
  daysElapsed: number;
  daysRemaining: number;
  daysTotal: number;
  conquered: ConqueredItem[];
  focusArea: FocusArea | null;
  comparison: Comparison | null;
  isLoading: boolean;
}

function getMonthInfo(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysTotal = lastDay.getDate();
  const daysElapsed = Math.min(today.getDate(), daysTotal);
  const daysRemaining = Math.max(0, daysTotal - daysElapsed);

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthName = date.toLocaleDateString("en-US", { month: "long" });

  // Previous month for comparison
  const prevMonth = new Date(year, month - 1, 1);
  const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthName = prevMonth.toLocaleDateString("en-US", { month: "long" });

  return {
    monthStr,
    monthName,
    daysTotal,
    daysElapsed,
    daysRemaining,
    prevMonthStr,
    prevMonthName,
  };
}

export function useSummitLogData(): SummitLogData {
  const { data: habits = [], isLoading: habitsLoading } = useQuery<HabitWithData[]>({
    queryKey: ["/api/habits-with-data"],
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: todos = [], isLoading: todosLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const isLoading = habitsLoading || goalsLoading || todosLoading;

  const monthInfo = useMemo(() => getMonthInfo(), []);

  const data = useMemo(() => {
    if (isLoading) {
      return {
        conquered: [],
        focusArea: null,
        comparison: null,
      };
    }

    const { monthStr, prevMonthStr, prevMonthName, daysElapsed } = monthInfo;
    const conquered: ConqueredItem[] = [];

    // --- CONQUERED GOALS (100% complete) ---
    goals.forEach((goal) => {
      if (goal.currentValue >= goal.targetValue) {
        conquered.push({
          id: goal.id,
          type: "goal",
          title: `${goal.title}: ${goal.currentValue}/${goal.targetValue} ${goal.unit}`,
          icon: "mountain",
          badge: "Goal 100%",
          badgeType: "goal",
        });
      }
    });

    // --- CONQUERED HABITS (80%+ this month) ---
    const habitStats: Array<{ habit: HabitWithData; thisMonth: number; prevMonth: number }> = [];

    habits.forEach((habit) => {
      const thisMonthDays = habit.history?.filter((d) => d.date.startsWith(monthStr)) || [];
      const completedDays = thisMonthDays.filter((d) => d.completed).length;
      const percentage = daysElapsed > 0 ? (completedDays / daysElapsed) * 100 : 0;

      // Previous month stats for comparison
      const prevMonthDays = habit.history?.filter((d) => d.date.startsWith(prevMonthStr)) || [];
      const prevCompleted = prevMonthDays.filter((d) => d.completed).length;
      const prevPercentage = prevMonthDays.length > 0 ? (prevCompleted / prevMonthDays.length) * 100 : 0;

      habitStats.push({
        habit,
        thisMonth: percentage,
        prevMonth: prevPercentage,
      });

      if (percentage >= 80) {
        conquered.push({
          id: habit.id,
          type: "habit",
          title: `${habit.title}: ${completedDays}/${daysElapsed} days`,
          icon: habit.icon || "target",
          badge: `Habit ${Math.round(percentage)}%`,
          badgeType: "habit",
        });
      }
    });

    // --- CONQUERED HARD TASKS ---
    todos.forEach((todo) => {
      const completedDate = todo.completedAt ? new Date(todo.completedAt) : null;
      const completedMonthStr = completedDate
        ? `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, "0")}`
        : null;

      // Priority: 1=P1 (urgent), 2=P2, 3=P3, 4=P4 (low)
      // Consider priority 1 or 2 as "hard" tasks
      if (
        todo.completed &&
        todo.priority <= 2 &&
        completedMonthStr === monthStr
      ) {
        conquered.push({
          id: todo.id,
          type: "task",
          title: todo.title,
          icon: "check",
          badge: "HARD",
          badgeType: "task",
          completedAt: completedDate?.toISOString(),
        });
      }
    });

    // --- FOCUS AREA (weakest link) ---
    let focusArea: FocusArea | null = null;

    // Find habit with biggest drop from last month
    const droppedHabits = habitStats
      .filter((h) => h.thisMonth < h.prevMonth && h.prevMonth > 0)
      .sort((a, b) => (b.prevMonth - b.thisMonth) - (a.prevMonth - a.thisMonth));

    if (droppedHabits.length > 0) {
      const worst = droppedHabits[0];
      const drop = Math.round(worst.prevMonth - worst.thisMonth);
      focusArea = {
        type: "habit",
        title: worst.habit.title,
        message: `${worst.habit.title} dropped ${drop}% from ${prevMonthName} (${Math.round(worst.thisMonth)}% this month)`,
        percentDrop: drop,
      };
    } else {
      // Find lowest performing habit
      const lowestHabit = habitStats
        .filter((h) => h.thisMonth < 80)
        .sort((a, b) => a.thisMonth - b.thisMonth)[0];

      if (lowestHabit) {
        focusArea = {
          type: "habit",
          title: lowestHabit.habit.title,
          message: `${lowestHabit.habit.title} at ${Math.round(lowestHabit.thisMonth)}% this month`,
        };
      }
    }

    // Check goals behind schedule
    if (!focusArea) {
      const behindGoals = goals.filter((g) => {
        const progress = (g.currentValue / g.targetValue) * 100;
        const deadline = new Date(g.deadline);
        const today = new Date();
        const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return progress < 50 && daysUntil <= 14 && daysUntil > 0;
      });

      if (behindGoals.length > 0) {
        const goal = behindGoals[0];
        const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
        const deadline = new Date(goal.deadline);
        const daysUntil = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        focusArea = {
          type: "goal",
          title: goal.title,
          message: `${goal.title} at ${progress}% with ${daysUntil} days left`,
        };
      }
    }

    // --- COMPARISON ---
    const thisMonthAvg = habitStats.length > 0
      ? habitStats.reduce((sum, h) => sum + h.thisMonth, 0) / habitStats.length
      : 0;
    const prevMonthAvg = habitStats.length > 0
      ? habitStats.reduce((sum, h) => sum + h.prevMonth, 0) / habitStats.length
      : 0;

    const thisMonthGoals = goals.filter((g) => g.currentValue >= g.targetValue).length;
    // For previous month goals, we'd need historical data - approximate with 0 for now
    const prevMonthGoals = 0;

    const comparison: Comparison = {
      overall: Math.round(thisMonthAvg - prevMonthAvg),
      habits: Math.round(thisMonthAvg - prevMonthAvg),
      goalsCompleted: thisMonthGoals - prevMonthGoals,
      vsMonth: prevMonthName,
    };

    return {
      conquered: conquered.slice(0, 5), // Limit to 5
      focusArea,
      comparison: prevMonthAvg > 0 ? comparison : null,
    };
  }, [habits, goals, todos, monthInfo, isLoading]);

  return {
    month: monthInfo.monthStr,
    monthName: monthInfo.monthName,
    daysElapsed: monthInfo.daysElapsed,
    daysRemaining: monthInfo.daysRemaining,
    daysTotal: monthInfo.daysTotal,
    conquered: data.conquered,
    focusArea: data.focusArea,
    comparison: data.comparison,
    isLoading,
  };
}
