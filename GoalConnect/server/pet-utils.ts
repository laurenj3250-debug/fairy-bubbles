import type { Habit, HabitLog } from "@shared/schema";

/**
 * Calculate current streak (consecutive days with at least 1 habit completed)
 */
export function calculateStreak(logs: HabitLog[]): number {
  if (logs.length === 0) return 0;

  // Get all unique dates with completed habits
  const completedDates = new Set(
    logs
      .filter(log => log.completed)
      .map(log => log.date)
  );

  const sortedDates = Array.from(completedDates).sort((a, b) => b.localeCompare(a)); // Descending order

  if (sortedDates.length === 0) return 0;

  // Check if today or yesterday has completion (streak is still active)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0; // Streak broken
  }

  // Count consecutive days
  let streak = 1;
  let currentDate = new Date(sortedDates[0]);

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i]);
    const diffTime = currentDate.getTime() - prevDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
      currentDate = prevDate;
    } else {
      break; // Streak broken
    }
  }

  return streak;
}

/**
 * Calculate weekly completion percentage
 */
export function calculateWeeklyCompletion(
  habits: Habit[],
  logs: HabitLog[]
): number {
  if (habits.length === 0) return 0;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const thisWeekLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= startOfWeek;
  });

  const completedThisWeek = thisWeekLogs.filter(log => log.completed).length;
  const daysInWeek = Math.ceil((now.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalPossible = habits.length * daysInWeek;

  if (totalPossible === 0) return 0;

  return Math.round((completedThisWeek / totalPossible) * 100);
}

/**
 * Get streak multiplier for a given streak length
 */
export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 3.0;
  else if (streak >= 14) return 2.0;
  else if (streak >= 7) return 1.5;
  else if (streak >= 3) return 1.2;
  return 1.0;
}
