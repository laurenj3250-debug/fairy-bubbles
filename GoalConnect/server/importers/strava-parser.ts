/**
 * Strava Activity Parser
 *
 * Transforms Strava API activity data into the format expected by our database.
 */

import type { StravaActivity, StravaAthleteStats } from "./strava-client";

// ============================================================================
// Types
// ============================================================================

export interface ParsedStravaActivity {
  userId: number;
  sourceType: "strava";
  externalId: string;
  workoutType: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  heartRateMin?: number;
  caloriesBurned?: number;
  distanceKm: string;
  metadata: Record<string, unknown>;
}

export interface StravaStatsSummary {
  allTime: {
    runs: ActivityTotals;
    rides: ActivityTotals;
    swims: ActivityTotals;
  };
  ytd: {
    runs: ActivityTotals;
    rides: ActivityTotals;
    swims: ActivityTotals;
  };
  recent: {
    runs: ActivityTotals;
    rides: ActivityTotals;
    swims: ActivityTotals;
  };
}

interface ActivityTotals {
  count: number;
  distanceKm: number;
  durationHours: number;
  elevationGainM: number;
}

// ============================================================================
// Activity Type Mapping
// ============================================================================

// Maps Strava activity types to normalized types
const ACTIVITY_TYPE_MAP: Record<string, string> = {
  // Running
  Run: "Run",
  TrailRun: "Run",
  Treadmill: "Run",
  VirtualRun: "Run",

  // Cycling
  Ride: "Ride",
  VirtualRide: "Ride",
  EBikeRide: "Ride",
  Handcycle: "Ride",
  GravelRide: "Ride",
  MountainBikeRide: "Ride",

  // Swimming
  Swim: "Swim",

  // Walking/Hiking
  Walk: "Walk",
  Hike: "Hike",

  // Fitness
  Yoga: "Yoga",
  WeightTraining: "WeightTraining",
  Crossfit: "Crossfit",
  Workout: "Workout",

  // Water sports
  Rowing: "Rowing",
  Kayaking: "Kayaking",
  Surfing: "Surfing",
  StandUpPaddling: "StandUpPaddling",

  // Winter sports
  NordicSki: "NordicSki",
  AlpineSki: "AlpineSki",
  BackcountrySki: "BackcountrySki",
  Snowboard: "Snowboard",
  Snowshoe: "Snowshoe",
  IceSkate: "IceSkate",

  // Other
  RockClimbing: "RockClimbing",
  Golf: "Golf",
  Soccer: "Soccer",
  Tennis: "Tennis",
  Pickleball: "Pickleball",
};

/**
 * Map Strava activity type to a normalized type
 */
export function mapStravaActivityType(stravaType: string): string {
  return ACTIVITY_TYPE_MAP[stravaType] || stravaType;
}

// ============================================================================
// Activity Parsing
// ============================================================================

/**
 * Parse a Strava activity into our database format
 */
export function parseStravaActivity(
  activity: StravaActivity,
  userId: number
): ParsedStravaActivity {
  const startTime = new Date(activity.start_date);
  const endTime = new Date(startTime.getTime() + activity.elapsed_time * 1000);

  // Distance in km (Strava provides meters)
  const distanceKm = (activity.distance / 1000).toFixed(2);

  // Duration in minutes (Strava provides seconds)
  const durationMinutes = Math.round(activity.moving_time / 60);

  return {
    userId,
    sourceType: "strava",
    externalId: activity.id.toString(),
    workoutType: mapStravaActivityType(activity.type),
    startTime,
    endTime,
    durationMinutes,
    heartRateAvg: activity.average_heartrate ? Math.round(activity.average_heartrate) : undefined,
    heartRateMax: activity.max_heartrate ? Math.round(activity.max_heartrate) : undefined,
    caloriesBurned: activity.calories ? Math.round(activity.calories) : undefined,
    distanceKm,
    metadata: {
      name: activity.name,
      sport_type: activity.sport_type,
      timezone: activity.timezone,
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      suffer_score: activity.suffer_score,
      pr_count: activity.pr_count,
      achievement_count: activity.achievement_count,
    },
  };
}

/**
 * Parse multiple activities
 */
export function parseStravaActivities(
  activities: StravaActivity[],
  userId: number
): ParsedStravaActivity[] {
  return activities.map((activity) => parseStravaActivity(activity, userId));
}

// ============================================================================
// Pace/Speed Calculations
// ============================================================================

/**
 * Calculate pace or speed based on activity type
 * @param distanceMeters Distance in meters
 * @param timeSeconds Time in seconds
 * @param activityType The type of activity
 * @returns Formatted pace/speed string
 */
export function calculatePace(
  distanceMeters: number,
  timeSeconds: number,
  activityType: string
): string {
  if (distanceMeters === 0 || timeSeconds === 0) {
    return "--";
  }

  const normalizedType = mapStravaActivityType(activityType);

  // For cycling - return speed in km/h
  if (normalizedType === "Ride") {
    const speedKmH = (distanceMeters / 1000) / (timeSeconds / 3600);
    return `${speedKmH.toFixed(1)} km/h`;
  }

  // For swimming - return pace per 100m
  if (normalizedType === "Swim") {
    const pacePer100m = timeSeconds / (distanceMeters / 100);
    const minutes = Math.floor(pacePer100m / 60);
    const seconds = Math.round(pacePer100m % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  // For running/walking/hiking - return pace per km
  const pacePerKm = timeSeconds / (distanceMeters / 1000);
  const minutes = Math.floor(pacePerKm / 60);
  const seconds = Math.round(pacePerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ============================================================================
// Stats Parsing
// ============================================================================

/**
 * Parse Strava athlete stats into a summary format
 */
export function parseAthleteStats(stats: StravaAthleteStats): StravaStatsSummary {
  const parseTotals = (totals: {
    count: number;
    distance: number;
    moving_time: number;
    elevation_gain: number;
  }): ActivityTotals => ({
    count: totals.count,
    distanceKm: totals.distance / 1000,
    durationHours: totals.moving_time / 3600,
    elevationGainM: totals.elevation_gain,
  });

  return {
    allTime: {
      runs: parseTotals(stats.all_run_totals),
      rides: parseTotals(stats.all_ride_totals),
      swims: parseTotals(stats.all_swim_totals),
    },
    ytd: {
      runs: parseTotals(stats.ytd_run_totals),
      rides: parseTotals(stats.ytd_ride_totals),
      swims: parseTotals(stats.ytd_swim_totals),
    },
    recent: {
      runs: parseTotals(stats.recent_run_totals),
      rides: parseTotals(stats.recent_ride_totals),
      swims: parseTotals(stats.recent_swim_totals),
    },
  };
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}
