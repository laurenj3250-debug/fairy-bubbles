import { mountains } from "../shared/schema";
import { CLIMBING, GAMIFICATION } from "../shared/constants";

export interface MissionParameters {
  totalDays: number;
  requiredCompletionPercent: number;
}

/**
 * Calculate mission parameters based on mountain characteristics
 * Uses: elevation, difficulty tier, fatality rate
 */
export function calculateMissionParameters(mountain: typeof mountains.$inferSelect): MissionParameters {
  const { elevation, difficultyTier, fatalityRate } = mountain;

  // Base duration from elevation (scaled for habit tracking)
  let baseDays: number;
  if (elevation < CLIMBING.MISSION_DURATIONS.SINGLE_DAY_THRESHOLD) {
    baseDays = CLIMBING.MISSION_DURATIONS.SINGLE_DAY_DURATION; // Single-day climbs
  } else if (elevation < CLIMBING.MISSION_DURATIONS.WEEK_LONG_THRESHOLD) {
    baseDays = CLIMBING.MISSION_DURATIONS.WEEK_LONG_DURATION; // Week-long expeditions
  } else if (elevation < CLIMBING.MISSION_DURATIONS.MULTI_WEEK_THRESHOLD) {
    baseDays = CLIMBING.MISSION_DURATIONS.MULTI_WEEK_DURATION; // Multi-week climbs
  } else if (elevation < CLIMBING.MISSION_DURATIONS.MAJOR_EXPEDITION_THRESHOLD) {
    baseDays = CLIMBING.MISSION_DURATIONS.MAJOR_EXPEDITION_DURATION; // Major expeditions
  } else {
    baseDays = CLIMBING.MISSION_DURATIONS.EIGHT_THOUSANDER_DURATION; // 8000m peaks
  }

  // Difficulty tier multiplier
  const multiplier = CLIMBING.DIFFICULTY_MULTIPLIERS[difficultyTier as keyof typeof CLIMBING.DIFFICULTY_MULTIPLIERS] || 1.0;
  const totalDays = Math.round(baseDays * multiplier);

  // Completion requirement based on fatality rate
  let requiredCompletionPercent: number;
  const fatalityNum = fatalityRate ? parseFloat(fatalityRate) : 0;

  if (fatalityNum === 0 || fatalityNum < CLIMBING.COMPLETION_REQUIREMENTS.EASY_THRESHOLD) {
    requiredCompletionPercent = CLIMBING.COMPLETION_REQUIREMENTS.EASY_COMPLETION; // Easy
  } else if (fatalityNum < CLIMBING.COMPLETION_REQUIREMENTS.MODERATE_THRESHOLD) {
    requiredCompletionPercent = CLIMBING.COMPLETION_REQUIREMENTS.MODERATE_COMPLETION; // Moderate
  } else if (fatalityNum < CLIMBING.COMPLETION_REQUIREMENTS.CHALLENGING_THRESHOLD) {
    requiredCompletionPercent = CLIMBING.COMPLETION_REQUIREMENTS.CHALLENGING_COMPLETION; // Challenging
  } else {
    requiredCompletionPercent = CLIMBING.COMPLETION_REQUIREMENTS.DANGEROUS_COMPLETION; // Dangerous - perfection required
  }

  return {
    totalDays,
    requiredCompletionPercent,
  };
}

/**
 * Calculate base XP reward for completing a mountain
 */
export function calculateBaseXP(difficultyTier: string): number {
  const tierUpper = difficultyTier.toUpperCase() as keyof typeof GAMIFICATION.XP_REWARDS;
  return GAMIFICATION.XP_REWARDS[tierUpper] || GAMIFICATION.DEFAULT_XP;
}

/**
 * Calculate base points reward for completing a mountain
 */
export function calculateBasePoints(difficultyTier: string): number {
  const tierUpper = difficultyTier.toUpperCase() as keyof typeof GAMIFICATION.POINTS_REWARDS;
  return GAMIFICATION.POINTS_REWARDS[tierUpper] || GAMIFICATION.DEFAULT_POINTS;
}
