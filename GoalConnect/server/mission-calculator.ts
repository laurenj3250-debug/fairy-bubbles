import { mountains } from "../shared/schema";

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
  if (elevation < 4000) {
    baseDays = 3; // Single-day climbs
  } else if (elevation < 5500) {
    baseDays = 7; // Week-long expeditions
  } else if (elevation < 7000) {
    baseDays = 14; // Multi-week climbs
  } else if (elevation < 8000) {
    baseDays = 21; // Major expeditions
  } else {
    baseDays = 30; // 8000m peaks
  }

  // Difficulty tier multiplier
  const tierMultiplier: Record<string, number> = {
    novice: 0.8,
    intermediate: 1.0,
    advanced: 1.2,
    expert: 1.4,
    elite: 1.5,
  };

  const multiplier = tierMultiplier[difficultyTier] || 1.0;
  const totalDays = Math.round(baseDays * multiplier);

  // Completion requirement based on fatality rate
  let requiredCompletionPercent: number;
  const fatalityNum = fatalityRate ? parseFloat(fatalityRate) : 0;

  if (fatalityNum === 0 || fatalityNum < 0.01) {
    requiredCompletionPercent = 75; // Easy
  } else if (fatalityNum < 0.03) {
    requiredCompletionPercent = 80; // Moderate
  } else if (fatalityNum < 0.05) {
    requiredCompletionPercent = 90; // Challenging
  } else {
    requiredCompletionPercent = 100; // Dangerous - perfection required
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
  const xpMap: Record<string, number> = {
    novice: 75,
    intermediate: 225,
    advanced: 550,
    expert: 1000,
    elite: 2250,
  };
  return xpMap[difficultyTier] || 100;
}

/**
 * Calculate base points reward for completing a mountain
 */
export function calculateBasePoints(difficultyTier: string): number {
  const pointsMap: Record<string, number> = {
    novice: 100,
    intermediate: 300,
    advanced: 650,
    expert: 1200,
    elite: 3000,
  };
  return pointsMap[difficultyTier] || 150;
}
