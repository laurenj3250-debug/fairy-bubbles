/**
 * Absurd Comparison Calculations
 * Turn boring stats into fun, shareable facts
 */

// Constants for calculations
const ELEPHANT_WEIGHT_LBS = 13000; // Average African elephant
const EIFFEL_TOWER_HEIGHT_FT = 1063; // Height to top
const AVG_PROBLEM_HEIGHT_FT = 12; // Standard Kilter board height
const OFFICE_EPISODE_MINUTES = 22;
const BANANA_CALORIES = 105;
const CALORIES_PER_ATTEMPT = 50; // Rough estimate for bouldering

const DEFAULT_BODY_WEIGHT_LBS = 150;

/**
 * Calculate how many elephants worth of weight you've lifted
 * Formula: (bodyWeight * totalAttempts) / elephantWeight
 */
export function calculateElephantsLifted(
  totalAttempts: number,
  bodyWeightLbs: number = DEFAULT_BODY_WEIGHT_LBS
): number {
  if (totalAttempts === 0) return 0;
  const totalWeight = bodyWeightLbs * totalAttempts;
  return totalWeight / ELEPHANT_WEIGHT_LBS;
}

/**
 * Calculate how many Eiffel Towers you've climbed
 * Formula: (totalSends * avgProblemHeight) / eiffelTowerHeight
 */
export function calculateEiffelTowers(totalSends: number): number {
  if (totalSends === 0) return 0;
  const totalHeight = totalSends * AVG_PROBLEM_HEIGHT_FT;
  return totalHeight / EIFFEL_TOWER_HEIGHT_FT;
}

/**
 * Calculate how many Office episodes you could have watched
 * Formula: totalMinutes / episodeLength
 */
export function calculateOfficeEpisodes(totalMinutes: number): number {
  if (totalMinutes === 0) return 0;
  return totalMinutes / OFFICE_EPISODE_MINUTES;
}

/**
 * Calculate energy expended in bananas
 * Formula: (totalAttempts * caloriesPerAttempt) / caloriesPerBanana
 */
export function calculateBananasOfEnergy(totalAttempts: number): number {
  if (totalAttempts === 0) return 0;
  const totalCalories = totalAttempts * CALORIES_PER_ATTEMPT;
  return totalCalories / BANANA_CALORIES;
}

/**
 * Format a number for display with appropriate precision
 */
function formatNumber(num: number): string {
  if (num === 0) return '0';

  // For large numbers, add comma separators
  if (num >= 1000) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    });
  }

  // For small numbers, show one decimal if needed
  if (num < 10) {
    return num % 1 === 0 ? num.toString() : num.toFixed(1);
  }

  return num.toFixed(1);
}

/**
 * Pluralize a word based on count
 */
function pluralize(count: number, singular: string): string {
  // Handle special cases
  if (singular.includes('Tower')) {
    return count === 1 ? singular : singular + 's';
  }
  if (singular.endsWith('s')) {
    return singular; // Already plural
  }
  return count === 1 ? singular : singular + 's';
}

/**
 * Format an absurd comparison for display
 */
export function formatAbsurdComparison(value: number, unit: string): string {
  const formattedNum = formatNumber(value);
  const pluralizedUnit = pluralize(value, unit);
  return `${formattedNum} ${pluralizedUnit}`;
}

/**
 * All absurd comparisons bundled together
 */
export interface AbsurdComparisons {
  elephantsLifted: { value: number; formatted: string };
  eiffelTowers: { value: number; formatted: string };
  officeEpisodes: { value: number; formatted: string };
  bananasOfEnergy: { value: number; formatted: string };
}

export function calculateAllAbsurdComparisons(
  totalAttempts: number,
  totalSends: number,
  totalMinutes: number,
  bodyWeightLbs: number = DEFAULT_BODY_WEIGHT_LBS
): AbsurdComparisons {
  const elephants = calculateElephantsLifted(totalAttempts, bodyWeightLbs);
  const towers = calculateEiffelTowers(totalSends);
  const episodes = calculateOfficeEpisodes(totalMinutes);
  const bananas = calculateBananasOfEnergy(totalAttempts);

  return {
    elephantsLifted: {
      value: elephants,
      formatted: formatAbsurdComparison(elephants, 'elephant'),
    },
    eiffelTowers: {
      value: towers,
      formatted: formatAbsurdComparison(towers, 'Eiffel Tower'),
    },
    officeEpisodes: {
      value: episodes,
      formatted: formatAbsurdComparison(episodes, 'episode'),
    },
    bananasOfEnergy: {
      value: bananas,
      formatted: formatAbsurdComparison(bananas, 'banana'),
    },
  };
}
