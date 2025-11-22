/**
 * Habit Matching Engine
 *
 * Matches imported workout/climbing data to user habits and
 * handles auto-completion and cumulative goal increments.
 */

import type { ExternalWorkout, ClimbingSession, HabitDataMapping } from "@shared/schema";

// Match criteria interface for flexible matching rules
export interface MatchCriteria {
  // For Apple Watch workouts
  workoutType?: string | string[];
  minDuration?: number; // minutes
  maxDuration?: number;
  minCalories?: number;

  // For Kilter Board sessions
  minProblems?: number;
  minGrade?: string; // 'V4'
  boardAngle?: number;

  // Common
  keywords?: string[];
}

// Result of matching process
export interface MatchResult {
  habitId: number;
  mappingId: number;
  action: "complete" | "increment";
  date: string;
  incrementValue?: number;
  sourceType: string;
  linkedId: number;
}

// Grade to numeric mapping for comparison
const GRADE_TO_NUMERIC: Record<string, number> = {
  "V0": 0,
  "V1": 1,
  "V2": 2,
  "V3": 3,
  "V4": 4,
  "V5": 5,
  "V6": 6,
  "V7": 7,
  "V8": 8,
  "V9": 9,
  "V10": 10,
  "V11": 11,
  "V12+": 12,
};

/**
 * Convert V-grade string to numeric value for comparison
 */
function gradeToNumeric(grade: string): number {
  return GRADE_TO_NUMERIC[grade] ?? -1;
}

/**
 * Check if a workout matches the given criteria
 */
export function checkWorkoutMatchCriteria(
  workout: ExternalWorkout,
  criteria: MatchCriteria
): boolean {
  // Empty criteria matches everything
  if (Object.keys(criteria).length === 0) {
    return true;
  }

  // Check workout type
  if (criteria.workoutType) {
    const types = Array.isArray(criteria.workoutType)
      ? criteria.workoutType
      : [criteria.workoutType];

    if (!types.includes(workout.workoutType)) {
      return false;
    }
  }

  // Check minimum duration
  if (criteria.minDuration !== undefined) {
    if (workout.durationMinutes < criteria.minDuration) {
      return false;
    }
  }

  // Check maximum duration
  if (criteria.maxDuration !== undefined) {
    if (workout.durationMinutes > criteria.maxDuration) {
      return false;
    }
  }

  // Check minimum calories
  if (criteria.minCalories !== undefined) {
    if (!workout.caloriesBurned || workout.caloriesBurned < criteria.minCalories) {
      return false;
    }
  }

  // Check keywords (case-insensitive match in workout type)
  if (criteria.keywords && criteria.keywords.length > 0) {
    const workoutTypeLower = workout.workoutType.toLowerCase();
    const hasMatch = criteria.keywords.some((keyword) =>
      workoutTypeLower.includes(keyword.toLowerCase())
    );
    if (!hasMatch) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a climbing session matches the given criteria
 */
export function checkSessionMatchCriteria(
  session: ClimbingSession,
  criteria: MatchCriteria
): boolean {
  // Empty criteria matches everything
  if (Object.keys(criteria).length === 0) {
    return true;
  }

  // Check minimum problems sent
  if (criteria.minProblems !== undefined) {
    if (session.problemsSent < criteria.minProblems) {
      return false;
    }
  }

  // Check minimum grade
  if (criteria.minGrade !== undefined) {
    if (!session.maxGrade) {
      return false;
    }
    const sessionGradeNum = gradeToNumeric(session.maxGrade);
    const criteriaGradeNum = gradeToNumeric(criteria.minGrade);

    if (sessionGradeNum < criteriaGradeNum) {
      return false;
    }
  }

  // Check specific board angle
  if (criteria.boardAngle !== undefined) {
    if (session.boardAngle !== criteria.boardAngle) {
      return false;
    }
  }

  // Check keywords (in session metadata if available)
  if (criteria.keywords && criteria.keywords.length > 0) {
    // For sessions, we could check climb names but for now skip
    // as sessions don't have a clear text field to search
  }

  return true;
}

/**
 * Find all habit mappings that match a workout
 */
export function findMatchingMappingsForWorkout(
  workout: ExternalWorkout,
  mappings: HabitDataMapping[]
): HabitDataMapping[] {
  return mappings.filter((mapping) => {
    // Must be same source type
    if (mapping.sourceType !== workout.sourceType) {
      return false;
    }

    // Check if criteria matches
    const criteria = mapping.matchCriteria as MatchCriteria;
    return checkWorkoutMatchCriteria(workout, criteria);
  });
}

/**
 * Find all habit mappings that match a climbing session
 */
export function findMatchingMappingsForSession(
  session: ClimbingSession,
  mappings: HabitDataMapping[]
): HabitDataMapping[] {
  return mappings.filter((mapping) => {
    // Must be same source type
    if (mapping.sourceType !== session.sourceType) {
      return false;
    }

    // Check if criteria matches
    const criteria = mapping.matchCriteria as MatchCriteria;
    return checkSessionMatchCriteria(session, criteria);
  });
}

/**
 * Process matches and generate habit actions
 */
export function processHabitMatches(
  data: ExternalWorkout | ClimbingSession,
  mappings: HabitDataMapping[],
  date: string,
  options: { incrementValue?: number } = {}
): MatchResult[] {
  const results: MatchResult[] = [];

  // Determine if this is a workout or session
  const isWorkout = "workoutType" in data;
  const sourceType = data.sourceType;

  // Find matching mappings
  const matchingMappings = isWorkout
    ? findMatchingMappingsForWorkout(data as ExternalWorkout, mappings)
    : findMatchingMappingsForSession(data as ClimbingSession, mappings);

  for (const mapping of matchingMappings) {
    // Skip if auto-complete is disabled
    if (!mapping.autoComplete) {
      continue;
    }

    const result: MatchResult = {
      habitId: mapping.habitId,
      mappingId: mapping.id,
      action: mapping.autoIncrement ? "increment" : "complete",
      date,
      sourceType,
      linkedId: data.id,
    };

    // Add increment value for cumulative habits
    if (mapping.autoIncrement && options.incrementValue !== undefined) {
      result.incrementValue = options.incrementValue;
    }

    results.push(result);
  }

  return results;
}

/**
 * Get the date string from a workout or session
 */
export function getDateFromData(data: ExternalWorkout | ClimbingSession): string {
  if ("sessionDate" in data) {
    return data.sessionDate;
  }
  // For workouts, extract date from startTime
  return data.startTime.toISOString().split("T")[0];
}
