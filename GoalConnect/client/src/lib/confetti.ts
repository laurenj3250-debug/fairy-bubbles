/**
 * Smart Confetti System
 * Only triggers on meaningful achievements to prevent dopamine fatigue
 */

import confetti from 'canvas-confetti';

type ConfettiReason =
  | 'streak_milestone'    // 7, 14, 30, 60, 100, 365 day streaks
  | 'goal_completed'      // Finished a yearly goal
  | 'all_habits_today'    // Completed all habits for the day
  | 'level_up'            // XP milestone
  | 'reward_claimed';     // Claimed XP reward

const STREAK_MILESTONES = [7, 14, 30, 60, 100, 200, 365];

// Track recent confetti to prevent spam (max once per 30 seconds)
let lastConfettiTime = 0;
const CONFETTI_COOLDOWN = 30000; // 30 seconds

export function triggerConfetti(reason?: ConfettiReason): void {
  const now = Date.now();

  // If no reason provided, check cooldown (legacy calls)
  if (!reason) {
    if (now - lastConfettiTime < CONFETTI_COOLDOWN) {
      return; // Skip - too recent
    }
  }

  lastConfettiTime = now;

  confetti({
    particleCount: reason === 'goal_completed' ? 150 : 80,
    spread: reason === 'goal_completed' ? 100 : 60,
    origin: { y: 0.7 },
    colors: ['#F97316', '#10B981', '#3B82F6', '#8B5CF6'],
  });
}

export function shouldCelebrateStreak(newStreak: number): boolean {
  return STREAK_MILESTONES.includes(newStreak);
}

export function checkAllHabitsComplete(
  completed: number,
  total: number
): boolean {
  return total > 0 && completed === total;
}
