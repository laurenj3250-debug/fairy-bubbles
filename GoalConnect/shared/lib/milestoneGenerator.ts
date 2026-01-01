/**
 * Milestone Generator
 * Generates recurring checkpoint milestones for yearly goals
 */

import {
  addDays,
  addWeeks,
  addMonths,
  endOfWeek,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  parseISO,
  isBefore,
  isAfter,
  isLeapYear,
} from "date-fns";

export type MilestoneCadence =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "semiannual";

export interface GoalMilestone {
  id: string;
  goalId: number;
  goalTitle: string;
  checkpointNumber: number;
  expectedValue: number;
  dueDate: string;
  isMilestone: true;
}

/**
 * Auto-detect cadence from target value
 * Common patterns: 365/366 = daily, 52/53 = weekly, 12 = monthly, etc.
 */
export function detectCadence(targetValue: number): MilestoneCadence | null {
  // Exact matches
  const exactMap: Record<number, MilestoneCadence> = {
    365: "daily",
    366: "daily",
    52: "weekly",
    53: "weekly",
    26: "biweekly",
    12: "monthly",
    6: "bimonthly",
    4: "quarterly",
    2: "semiannual",
  };

  if (exactMap[targetValue]) {
    return exactMap[targetValue];
  }

  // Fuzzy matches for near-values
  if (targetValue >= 350 && targetValue <= 370) return "daily";
  if (targetValue >= 48 && targetValue <= 56) return "weekly";
  if (targetValue >= 24 && targetValue <= 28) return "biweekly";
  if (targetValue >= 10 && targetValue <= 14) return "monthly";
  if (targetValue >= 5 && targetValue <= 7) return "bimonthly";
  if (targetValue === 3 || targetValue === 4) return "quarterly";

  return null;
}

/**
 * Get the number of checkpoints for a cadence in a year
 */
export function getCheckpointsPerYear(cadence: MilestoneCadence, year: number): number {
  const leapYear = isLeapYear(new Date(year, 0, 1));

  switch (cadence) {
    case "daily":
      return leapYear ? 366 : 365;
    case "weekly":
      return 52; // Sometimes 53, but 52 is standard
    case "biweekly":
      return 26;
    case "monthly":
      return 12;
    case "bimonthly":
      return 6;
    case "quarterly":
      return 4;
    case "semiannual":
      return 2;
    default:
      return 0;
  }
}

/**
 * Generate all milestones for a yearly count goal
 */
export function generateMilestones(
  goalId: number,
  goalTitle: string,
  year: string,
  targetValue: number,
  cadence: MilestoneCadence
): GoalMilestone[] {
  const yearNum = parseInt(year);
  const yearStart = startOfYear(new Date(yearNum, 0, 1));
  const yearEnd = endOfYear(yearStart);
  const milestones: GoalMilestone[] = [];

  const checkpointsPerYear = getCheckpointsPerYear(cadence, yearNum);

  // Calculate value increment per checkpoint
  // E.g., for 22 chapters with weekly cadence: each checkpoint expects ~0.42 chapters
  const valuePerCheckpoint = targetValue / checkpointsPerYear;

  let checkpointNumber = 1;
  let currentDate = yearStart;

  while (isBefore(currentDate, yearEnd) && checkpointNumber <= checkpointsPerYear) {
    let dueDate: Date;

    switch (cadence) {
      case "daily":
        dueDate = currentDate;
        currentDate = addDays(currentDate, 1);
        break;

      case "weekly":
        dueDate = endOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday end
        currentDate = addWeeks(currentDate, 1);
        break;

      case "biweekly":
        dueDate = endOfWeek(addWeeks(currentDate, 1), { weekStartsOn: 0 });
        currentDate = addWeeks(currentDate, 2);
        break;

      case "monthly":
        dueDate = endOfMonth(currentDate);
        currentDate = addMonths(currentDate, 1);
        break;

      case "bimonthly":
        // Every 2 months: Feb, Apr, Jun, Aug, Oct, Dec
        dueDate = endOfMonth(addMonths(currentDate, 1));
        currentDate = addMonths(currentDate, 2);
        break;

      case "quarterly":
        // Q1: Mar 31, Q2: Jun 30, Q3: Sep 30, Q4: Dec 31
        const quarterEndMonth = ((Math.ceil((currentDate.getMonth() + 1) / 3) * 3) - 1);
        dueDate = endOfMonth(new Date(yearNum, quarterEndMonth, 1));
        currentDate = addMonths(dueDate, 1);
        break;

      case "semiannual":
        // Jun 30, Dec 31
        if (checkpointNumber === 1) {
          dueDate = new Date(yearNum, 5, 30); // June 30
          currentDate = new Date(yearNum, 6, 1);
        } else {
          dueDate = endOfYear(yearStart);
          currentDate = addDays(yearEnd, 1);
        }
        break;
    }

    // Don't exceed year end
    if (isAfter(dueDate, yearEnd)) {
      dueDate = yearEnd;
    }

    // Calculate expected cumulative value at this checkpoint
    // Round to nearest integer for display
    const expectedValue = Math.min(
      Math.round(checkpointNumber * valuePerCheckpoint),
      targetValue
    );

    milestones.push({
      id: `yearly-goal-${goalId}-milestone-${checkpointNumber}`,
      goalId,
      goalTitle,
      checkpointNumber,
      expectedValue,
      dueDate: format(dueDate, "yyyy-MM-dd"),
      isMilestone: true,
    });

    checkpointNumber++;
  }

  return milestones;
}

/**
 * Filter milestones to a specific date range
 */
export function filterMilestonesToRange(
  milestones: GoalMilestone[],
  startDate: string,
  endDate: string
): GoalMilestone[] {
  return milestones.filter(
    (m) => m.dueDate >= startDate && m.dueDate <= endDate
  );
}

/**
 * Get human-readable label for cadence
 */
export function getCadenceLabel(cadence: MilestoneCadence): string {
  const labels: Record<MilestoneCadence, string> = {
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Every 2 weeks",
    monthly: "Monthly",
    bimonthly: "Every 2 months",
    quarterly: "Quarterly",
    semiannual: "Every 6 months",
  };
  return labels[cadence];
}
