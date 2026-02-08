/**
 * Centralized XP configuration — single source of truth for all point amounts.
 * Import from "@shared/xp-config" in server routes.
 */

export const XP_CONFIG = {
  habit: { easy: 5, medium: 10, hard: 15 } as Record<string, number>,
  todo: 5,
  goal: {
    progressPerMilestone: 5,
    completionBonus: 50,
    priorityMultiplier: { high: 1.5, medium: 1.0, low: 0.75 } as Record<string, number>,
  },
  adventure: { full: 15, quick: 10 },
  media: { complete: 10 },
  streakMilestone: { 7: 50, 30: 150, 100: 500 } as Record<number, number>,
  dailyBonus: { base: 5, week: 10, month: 15 },
  yearlyGoal: { subItem: 25, categoryBonus: 500 },
};

export const STREAK_MILESTONES = [7, 30, 100] as const;
