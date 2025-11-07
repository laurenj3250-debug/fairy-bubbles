import type { Habit, HabitLog, VirtualPet } from "@shared/schema";

/**
 * Calculate pet stats automatically from habit completion data
 */
export function calculatePetStats(
  habits: Habit[],
  allLogs: HabitLog[],
  currentPet: VirtualPet
) {
  // Total XP = all completed habits ever
  const totalXP = allLogs.filter(log => log.completed).length * 10; // 10 XP per completed habit

  // Level calculation: every 100 XP = 1 level
  const newLevel = Math.floor(totalXP / 100) + 1;

  // Check if leveled up
  const leveledUp = newLevel > currentPet.level;

  // Calculate happiness based on this week's completion rate
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
  startOfWeek.setHours(0, 0, 0, 0);

  const thisWeekLogs = allLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= startOfWeek;
  });

  const completedThisWeek = thisWeekLogs.filter(log => log.completed).length;
  const daysInWeek = Math.ceil((now.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalPossibleCompletions = habits.length * daysInWeek;

  let happiness = 50; // Default happiness
  if (totalPossibleCompletions > 0) {
    happiness = Math.round((completedThisWeek / totalPossibleCompletions) * 100);
    happiness = Math.max(0, Math.min(100, happiness)); // Clamp between 0-100
  }

  // Evolution stages based on level
  let evolution: 'seed' | 'sprout' | 'sapling' | 'tree' | 'ancient' = 'seed';
  if (newLevel >= 20) evolution = 'ancient';
  else if (newLevel >= 15) evolution = 'tree';
  else if (newLevel >= 10) evolution = 'sapling';
  else if (newLevel >= 5) evolution = 'sprout';

  // Check for evolution change
  const evolved = evolution !== currentPet.evolution;

  return {
    experience: totalXP,
    level: newLevel,
    happiness,
    evolution,
    leveledUp,
    evolved,
  };
}

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
  if (streak >= 30) return 3.0;      // 30+ days: 3x bonus! 🔥
  else if (streak >= 14) return 2.0; // 14+ days: 2x bonus
  else if (streak >= 7) return 1.5;  // 7+ days: 1.5x bonus
  else if (streak >= 3) return 1.2;  // 3+ days: 1.2x bonus
  return 1.0;
}

/**
 * Award coins for habit completion with difficulty and streak multipliers
 */
export function calculateCoinsEarned(habit: Habit, streak: number): number {
  // Base coins by difficulty
  const difficultyCoins: Record<string, number> = {
    'easy': 5,
    'medium': 10,
    'hard': 15
  };

  let baseCoins = difficultyCoins[habit.difficulty || 'medium'] || 10;

  // Streak multiplier
  const streakMultiplier = getStreakMultiplier(streak);

  const totalCoins = Math.round(baseCoins * streakMultiplier);

  return totalCoins;
}

/**
 * Get next evolution stage and XP required
 */
export function getNextEvolution(currentLevel: number): {
  next: string;
  levelRequired: number;
  xpRequired: number;
} {
  if (currentLevel >= 20) {
    return { next: 'Max Level!', levelRequired: 20, xpRequired: 2000 };
  } else if (currentLevel >= 15) {
    return { next: 'Ancient Guardian', levelRequired: 20, xpRequired: 2000 };
  } else if (currentLevel >= 10) {
    return { next: 'Majestic Tree', levelRequired: 15, xpRequired: 1500 };
  } else if (currentLevel >= 5) {
    return { next: 'Healthy Sapling', levelRequired: 10, xpRequired: 1000 };
  } else {
    return { next: 'Young Sprout', levelRequired: 5, xpRequired: 500 };
  }
}
