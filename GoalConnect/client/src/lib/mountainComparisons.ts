/**
 * Mountain Comparisons - Compare climbing stats to real mountains
 * Uses famous peaks from the GoalConnect world map
 */

// Heights in feet (Kilter board is ~12ft per problem)
const KILTER_PROBLEM_HEIGHT_FT = 12;

// Mountain type
interface FamousMountain {
  name: string;
  heightFt: number;
  emoji: string;
  region: string;
}

// Famous mountains with their heights in feet
export const FAMOUS_MOUNTAINS: FamousMountain[] = [
  { name: "Mount Fuji", heightFt: 12388, emoji: "🗻", region: "Asia" },
  { name: "Kilimanjaro", heightFt: 19341, emoji: "🏔️", region: "Africa" },
  { name: "Mont Blanc", heightFt: 15774, emoji: "⛰️", region: "Europe" },
  { name: "Denali", heightFt: 20310, emoji: "🏔️", region: "North America" },
  { name: "El Capitan", heightFt: 3000, emoji: "🧗", region: "California" },
  { name: "Half Dome", heightFt: 4737, emoji: "🪨", region: "California" },
  { name: "Mount Rainier", heightFt: 14411, emoji: "🏔️", region: "Pacific Northwest" },
  { name: "Matterhorn", heightFt: 14692, emoji: "⛰️", region: "Europe" },
  { name: "Mount Everest", heightFt: 29032, emoji: "🏔️", region: "Himalayas" },
  { name: "K2", heightFt: 28251, emoji: "🏔️", region: "Karakoram" },
];

export interface MountainComparison {
  mountain: FamousMountain;
  timesClimbed: number;
  percentOfMountain: number;
  formatted: string;
}

/**
 * Calculate total vertical feet climbed
 */
export function calculateTotalVerticalFeet(totalSends: number): number {
  return totalSends * KILTER_PROBLEM_HEIGHT_FT;
}

/**
 * Find the best mountain comparison for a given vertical distance
 * Returns the mountain that gives the most impressive but believable comparison
 */
export function findBestMountainComparison(totalSends: number): MountainComparison {
  const totalFeet = calculateTotalVerticalFeet(totalSends);

  if (totalFeet === 0) {
    return {
      mountain: FAMOUS_MOUNTAINS[0],
      timesClimbed: 0,
      percentOfMountain: 0,
      formatted: "0 summits (yet!)",
    };
  }

  // Find a mountain where timesClimbed is between 0.1 and 10 ideally
  // This gives the most impressive numbers
  let bestMatch = FAMOUS_MOUNTAINS[0];
  let bestTimesClimbed = totalFeet / bestMatch.heightFt;

  for (const mountain of FAMOUS_MOUNTAINS) {
    const times = totalFeet / mountain.heightFt;

    // Prefer mountains where we've climbed it 0.5-5x
    // This gives the most impressive comparisons
    if (times >= 0.5 && times <= 5) {
      bestMatch = mountain;
      bestTimesClimbed = times;
      break;
    }

    // Fallback: use the mountain that gives closest to 1x
    if (Math.abs(times - 1) < Math.abs(bestTimesClimbed - 1)) {
      bestMatch = mountain;
      bestTimesClimbed = times;
    }
  }

  const percentOfMountain = (totalFeet / bestMatch.heightFt) * 100;

  return {
    mountain: bestMatch,
    timesClimbed: bestTimesClimbed,
    percentOfMountain,
    formatted: formatMountainComparison(bestTimesClimbed, bestMatch),
  };
}

/**
 * Format a mountain comparison for display
 */
function formatMountainComparison(
  times: number,
  mountain: FamousMountain
): string {
  if (times >= 1) {
    const rounded = times >= 10 ? Math.round(times) : Number(times.toFixed(1));
    return `${rounded}x ${mountain.name}`;
  } else {
    const percent = Math.round(times * 100);
    return `${percent}% of ${mountain.name}`;
  }
}

/**
 * Get multiple mountain comparisons for variety
 */
export function getMountainComparisons(totalSends: number): MountainComparison[] {
  const totalFeet = calculateTotalVerticalFeet(totalSends);

  return FAMOUS_MOUNTAINS.map((mountain) => {
    const times = totalFeet / mountain.heightFt;
    return {
      mountain,
      timesClimbed: times,
      percentOfMountain: (totalFeet / mountain.heightFt) * 100,
      formatted: formatMountainComparison(times, mountain),
    };
  }).filter((c) => c.timesClimbed >= 0.1); // Only show mountains where we've done at least 10%
}

/**
 * Get a fun comparison message based on climbing stats
 */
export function getClimbingMilestoneMessage(totalSends: number): string {
  const totalFeet = calculateTotalVerticalFeet(totalSends);

  if (totalFeet >= 29032) {
    return "You've conquered Everest's height!";
  } else if (totalFeet >= 20310) {
    return "You've matched Denali's mighty height!";
  } else if (totalFeet >= 14411) {
    return "You've reached Rainier's summit height!";
  } else if (totalFeet >= 4737) {
    return "You've climbed Half Dome's face!";
  } else if (totalFeet >= 3000) {
    return "You've scaled El Capitan!";
  } else if (totalFeet >= 1000) {
    return "Over 1000 feet of vertical!";
  } else {
    return "Every send counts!";
  }
}
