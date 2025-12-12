/**
 * Lifting Absurd Comparisons
 * Turn lifting stats into genuinely absurd facts
 */

// Real-world reference weights and values
const TOYOTA_COROLLA_LBS = 3000;
const GOLDEN_RETRIEVER_LBS = 70;
const MOON_GRAVITY_FACTOR = 6; // You can lift 6x more on moon
const HOUSE_CAT_LBS = 10;

export interface LiftingAbsurdComparisons {
  corollas: { value: number; formatted: string };
  moonLift: { value: number; formatted: string };
  goldenRetrievers: { value: number; formatted: string };
  catLaunches: { value: number; formatted: string };
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  if (num < 1) return num.toFixed(2);
  if (num < 10) return num.toFixed(1);
  return Math.round(num).toLocaleString();
}

export function calculateLiftingAbsurdComparisons(
  totalVolumeLbs: number,
  bestLiftLbs: number
): LiftingAbsurdComparisons {
  // Volume = how many Toyota Corollas you've lifted total
  const corollas = totalVolumeLbs / TOYOTA_COROLLA_LBS;

  // On the moon, you could lift 6x your best lift
  const moonLift = bestLiftLbs * MOON_GRAVITY_FACTOR;

  // Volume in golden retrievers
  const goldenRetrievers = totalVolumeLbs / GOLDEN_RETRIEVER_LBS;

  // "Your hip thrust could launch X cats into low orbit"
  const catLaunches = Math.floor(bestLiftLbs / HOUSE_CAT_LBS);

  return {
    corollas: {
      value: corollas,
      formatted: `${formatNumber(corollas)} Toyota Corollas`,
    },
    moonLift: {
      value: moonLift,
      formatted: `${formatNumber(moonLift)} lbs on the Moon`,
    },
    goldenRetrievers: {
      value: goldenRetrievers,
      formatted: `${formatNumber(goldenRetrievers)} Golden Retrievers`,
    },
    catLaunches: {
      value: catLaunches,
      formatted: `${catLaunches} cats into orbit`,
    },
  };
}
