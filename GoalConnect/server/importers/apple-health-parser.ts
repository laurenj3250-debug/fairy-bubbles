/**
 * Apple Health XML Parser
 *
 * Parses Apple Health XML export files and extracts workout data.
 * Supports filtering by workout type, date range, and minimum duration.
 */

import { createHash } from "crypto";

// Supported workout types from Apple HealthKit
export const SUPPORTED_WORKOUT_TYPES = [
  "HKWorkoutActivityTypeClimbing",
  "HKWorkoutActivityTypeFunctionalStrengthTraining",
  "HKWorkoutActivityTypeTraditionalStrengthTraining",
  "HKWorkoutActivityTypeCrossTraining",
  "HKWorkoutActivityTypeRunning",
  "HKWorkoutActivityTypeWalking",
  "HKWorkoutActivityTypeCycling",
  "HKWorkoutActivityTypeSwimming",
  "HKWorkoutActivityTypeYoga",
  "HKWorkoutActivityTypeHiking",
  "HKWorkoutActivityTypeOther",
] as const;

export type SupportedWorkoutType = (typeof SUPPORTED_WORKOUT_TYPES)[number];

export interface ParsedWorkout {
  externalId: string;
  workoutType: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  caloriesBurned?: number;
  distanceKm?: number;
  heartRateAvg?: number;
  heartRateMin?: number;
  heartRateMax?: number;
  sourceName?: string;
  sourceVersion?: string;
  metadata: {
    isIndoor?: boolean;
    temperature?: string;
    [key: string]: any;
  };
}

export interface AppleHealthParserOptions {
  workoutTypes?: string[];
  startDate?: Date;
  endDate?: Date;
  minDurationMinutes?: number;
}

export interface AppleHealthParseResult {
  success: boolean;
  workouts: ParsedWorkout[];
  errors: string[];
  stats?: {
    totalWorkoutsFound: number;
    workoutsFiltered: number;
    workoutsSkipped: number;
  };
}

/**
 * Generate a unique external ID for deduplication
 */
export function generateExternalId(workout: {
  startTime: Date;
  endTime: Date;
  workoutType: string;
}): string {
  const data = `${workout.startTime.toISOString()}-${workout.endTime.toISOString()}-${workout.workoutType}`;
  return createHash("sha256").update(data).digest("hex").substring(0, 32);
}

/**
 * Parse an Apple Health date string
 * Format: "2025-11-20 09:00:00 -0800"
 */
function parseAppleHealthDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  try {
    // Apple Health format: "YYYY-MM-DD HH:MM:SS -HHMM"
    // Convert to ISO format
    const match = dateStr.match(
      /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+([+-]\d{4})$/
    );

    if (match) {
      const [, datePart, timePart, tzOffset] = match;
      // Convert timezone offset from -0800 to -08:00
      const tzFormatted = tzOffset.replace(/([+-]\d{2})(\d{2})/, "$1:$2");
      const isoString = `${datePart}T${timePart}${tzFormatted}`;
      return new Date(isoString);
    }

    // Fallback: try direct parsing
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Parse duration value with unit conversion
 */
function parseDuration(duration: string | undefined, unit: string | undefined): number {
  if (!duration) return 0;

  const value = parseFloat(duration);
  if (isNaN(value)) return 0;

  // Convert to minutes based on unit
  switch (unit?.toLowerCase()) {
    case "hr":
    case "hour":
    case "hours":
      return value * 60;
    case "sec":
    case "second":
    case "seconds":
      return value / 60;
    case "min":
    case "minute":
    case "minutes":
    default:
      return value;
  }
}

/**
 * Parse a numeric value, returning undefined for empty/invalid
 */
function parseNumericValue(value: string | undefined): number | undefined {
  if (!value || value === "") return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

/**
 * Extract workout attributes from XML element attributes string
 */
function parseWorkoutAttributes(
  attributesStr: string
): Record<string, string> {
  const attrs: Record<string, string> = {};
  // Match attribute="value" patterns, handling escaped quotes
  const attrRegex = /(\w+)="([^"]*?)"/g;
  let match;

  while ((match = attrRegex.exec(attributesStr)) !== null) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

/**
 * Main parser function - parses Apple Health XML and extracts workouts
 */
export async function parseAppleHealthXML(
  xmlContent: string,
  options: AppleHealthParserOptions = {}
): Promise<AppleHealthParseResult> {
  const workouts: ParsedWorkout[] = [];
  const errors: string[] = [];
  let totalFound = 0;
  let filtered = 0;
  let skipped = 0;

  try {
    // Extract all Workout elements using regex (faster than DOM parsing for large files)
    const workoutRegex = /<Workout\s+([\s\S]*?)(?:\/>|>([\s\S]*?)<\/Workout>)/g;
    let workoutMatch;

    while ((workoutMatch = workoutRegex.exec(xmlContent)) !== null) {
      totalFound++;
      const attributesStr = workoutMatch[1];
      const innerContent = workoutMatch[2] || "";

      const attrs = parseWorkoutAttributes(attributesStr);

      // Validate required fields
      if (!attrs.startDate || !attrs.endDate || !attrs.workoutActivityType) {
        skipped++;
        continue;
      }

      const startTime = parseAppleHealthDate(attrs.startDate);
      const endTime = parseAppleHealthDate(attrs.endDate);

      if (!startTime || !endTime) {
        skipped++;
        continue;
      }

      // Parse basic workout data
      const workoutType = attrs.workoutActivityType;
      const durationMinutes = parseDuration(attrs.duration, attrs.durationUnit);
      const caloriesBurned = parseNumericValue(attrs.totalEnergyBurned);
      const distanceKm = parseNumericValue(attrs.totalDistance);
      const sourceName = attrs.sourceName;
      const sourceVersion = attrs.sourceVersion;

      // Parse WorkoutStatistics for heart rate
      let heartRateAvg: number | undefined;
      let heartRateMin: number | undefined;
      let heartRateMax: number | undefined;

      const hrStatsRegex =
        /<WorkoutStatistics\s+type="HKQuantityTypeIdentifierHeartRate"[^>]*?(?:average="(\d+(?:\.\d+)?)")?[^>]*?(?:minimum="(\d+(?:\.\d+)?)")?[^>]*?(?:maximum="(\d+(?:\.\d+)?)")?[^>]*?\/>/;
      const hrMatch = innerContent.match(hrStatsRegex);

      if (hrMatch) {
        heartRateAvg = parseNumericValue(hrMatch[1]);
        heartRateMin = parseNumericValue(hrMatch[2]);
        heartRateMax = parseNumericValue(hrMatch[3]);
      }

      // Alternative pattern for different attribute ordering
      if (!heartRateAvg) {
        const hrStatsAltRegex =
          /<WorkoutStatistics[^>]*type="HKQuantityTypeIdentifierHeartRate"[^>]*>/;
        const hrAltMatch = innerContent.match(hrStatsAltRegex);
        if (hrAltMatch) {
          const statsStr = hrAltMatch[0];
          const avgMatch = statsStr.match(/average="(\d+(?:\.\d+)?)"/);
          const minMatch = statsStr.match(/minimum="(\d+(?:\.\d+)?)"/);
          const maxMatch = statsStr.match(/maximum="(\d+(?:\.\d+)?)"/);

          heartRateAvg = avgMatch ? parseNumericValue(avgMatch[1]) : undefined;
          heartRateMin = minMatch ? parseNumericValue(minMatch[1]) : undefined;
          heartRateMax = maxMatch ? parseNumericValue(maxMatch[1]) : undefined;
        }
      }

      // Parse MetadataEntry elements
      const metadata: ParsedWorkout["metadata"] = {};
      const metadataRegex = /<MetadataEntry\s+key="([^"]+)"\s+value="([^"]*)"\s*\/>/g;
      let metaMatch;

      while ((metaMatch = metadataRegex.exec(innerContent)) !== null) {
        const key = metaMatch[1];
        const value = metaMatch[2];

        switch (key) {
          case "HKIndoorWorkout":
            metadata.isIndoor = value === "1";
            break;
          case "HKWeatherTemperature":
            metadata.temperature = value;
            break;
          default:
            metadata[key] = value;
        }
      }

      // Apply filters
      if (options.workoutTypes && options.workoutTypes.length > 0) {
        if (!options.workoutTypes.includes(workoutType)) {
          filtered++;
          continue;
        }
      }

      if (options.startDate && startTime < options.startDate) {
        filtered++;
        continue;
      }

      if (options.endDate && startTime > options.endDate) {
        filtered++;
        continue;
      }

      if (
        options.minDurationMinutes &&
        durationMinutes < options.minDurationMinutes
      ) {
        filtered++;
        continue;
      }

      // Create parsed workout object
      const parsedWorkout: ParsedWorkout = {
        externalId: generateExternalId({ startTime, endTime, workoutType }),
        workoutType,
        startTime,
        endTime,
        durationMinutes,
        caloriesBurned,
        distanceKm,
        heartRateAvg,
        heartRateMin,
        heartRateMax,
        sourceName,
        sourceVersion,
        metadata,
      };

      workouts.push(parsedWorkout);
    }

    return {
      success: true,
      workouts,
      errors,
      stats: {
        totalWorkoutsFound: totalFound,
        workoutsFiltered: filtered,
        workoutsSkipped: skipped,
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown parsing error";
    errors.push(errorMessage);

    return {
      success: false,
      workouts,
      errors,
      stats: {
        totalWorkoutsFound: totalFound,
        workoutsFiltered: filtered,
        workoutsSkipped: skipped,
      },
    };
  }
}

/**
 * Parse a single workout element (exported for testing)
 */
export async function parseWorkoutElement(
  workoutXmlStr: string
): Promise<ParsedWorkout | null> {
  const result = await parseAppleHealthXML(
    `<?xml version="1.0"?><HealthData>${workoutXmlStr}</HealthData>`
  );
  return result.workouts[0] || null;
}

/**
 * Convert ParsedWorkout to format suitable for database insertion
 */
export function toExternalWorkoutInsert(
  workout: ParsedWorkout,
  userId: number
): {
  userId: number;
  sourceType: "apple_watch";
  externalId: string;
  workoutType: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  heartRateMin?: number;
  caloriesBurned?: number;
  distanceKm?: string;
  metadata: Record<string, any>;
} {
  return {
    userId,
    sourceType: "apple_watch",
    externalId: workout.externalId,
    workoutType: workout.workoutType,
    startTime: workout.startTime,
    endTime: workout.endTime,
    durationMinutes: Math.round(workout.durationMinutes),
    heartRateAvg: workout.heartRateAvg,
    heartRateMax: workout.heartRateMax,
    heartRateMin: workout.heartRateMin,
    caloriesBurned: workout.caloriesBurned
      ? Math.round(workout.caloriesBurned)
      : undefined,
    distanceKm: workout.distanceKm?.toFixed(2),
    metadata: {
      ...workout.metadata,
      sourceName: workout.sourceName,
      sourceVersion: workout.sourceVersion,
    },
  };
}
