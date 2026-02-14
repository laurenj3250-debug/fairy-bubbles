/**
 * Centralized XP configuration — single source of truth for all point amounts.
 * Import from "@shared/xp-config" in server routes.
 *
 * Design: "1 XP ≈ 1 meaningful action" — small numbers that feel earned.
 * Inspired by Duolingo's 2025 deflation to make XP reflect real effort.
 */

export const XP_CONFIG = {
  habit: { easy: 1, medium: 2, hard: 3 } as Record<string, number>,
  todo: 1,
  goal: {
    progressPerMilestone: 1,
    completionBonus: 10,
    priorityMultiplier: { high: 1.5, medium: 1.0, low: 0.75 } as Record<string, number>,
  },
  adventure: { full: 3, quick: 2 },
  media: { complete: 2 },
  streakMilestone: { 7: 10, 30: 30, 100: 100 } as Record<number, number>,
  dailyBonus: { base: 1, week: 2, month: 3 },
  yearlyGoal: { subItem: 5, categoryBonus: 100 },
};

export const STREAK_MILESTONES = [7, 30, 100] as const;
