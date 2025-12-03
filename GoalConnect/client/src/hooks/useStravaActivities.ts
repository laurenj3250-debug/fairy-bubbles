/**
 * useStravaActivities Hook
 * Fetches recent Strava activities with detailed data
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface StravaActivity {
  id: number;
  externalId: string;
  workoutType: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  caloriesBurned?: number;
  distanceKm?: number;
  metadata?: {
    name?: string;
    sport_type?: string;
    average_speed?: number;
    max_speed?: number;
    total_elevation_gain?: number;
    elev_high?: number;
    elev_low?: number;
    average_watts?: number;
    max_watts?: number;
    average_cadence?: number;
    location_city?: string;
    location_state?: string;
    location_country?: string;
    suffer_score?: number;
    pr_count?: number;
  };
}

interface ActivitiesResponse {
  activities: StravaActivity[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Convert km to miles
const kmToMiles = (km: number): number => Math.round(km * 0.621371 * 10) / 10;

// Convert m/s to mph
const msToMph = (ms: number): number => Math.round(ms * 2.237 * 10) / 10;

// Convert meters to feet
const metersToFeet = (m: number): number => Math.round(m * 3.28084);

export interface FormattedActivity {
  id: number;
  name: string;
  type: string;
  date: Date;
  dateFormatted: string;
  timeFormatted: string;
  distanceMiles: number;
  durationMinutes: number;
  durationFormatted: string;
  avgSpeedMph: number;
  maxSpeedMph: number;
  elevationFt: number;
  calories: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  isPR: boolean;
  location?: string;
}

export interface CyclingStats {
  // This week
  thisWeekMiles: number;
  thisWeekRides: number;
  thisWeekTime: number;
  thisWeekElevation: number;

  // This month
  thisMonthMiles: number;
  thisMonthRides: number;
  thisMonthTime: number;
  thisMonthElevation: number;

  // Personal bests from recent activities
  longestRide: number;
  fastestAvgSpeed: number;
  mostElevation: number;

  // Streak
  activeWeeksStreak: number;

  // Recent activities
  recentActivities: FormattedActivity[];
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

export function useStravaActivities() {
  // Fetch recent activities
  const {
    data: activitiesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery<ActivitiesResponse>({
    queryKey: ["/api/import/strava/activities", { limit: 50 }],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const stats = useMemo<CyclingStats | null>(() => {
    if (!activitiesResponse) return null;

    const activities = activitiesResponse.activities || [];

    // Filter to cycling activities only
    const cyclingActivities = activities.filter(a =>
      a.workoutType?.toLowerCase().includes("ride") ||
      a.workoutType?.toLowerCase().includes("cycling") ||
      a.metadata?.sport_type?.toLowerCase().includes("ride") ||
      a.metadata?.sport_type?.toLowerCase().includes("cycling")
    );

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate this week stats
    const thisWeekActivities = cyclingActivities.filter(a =>
      new Date(a.startTime) >= startOfWeek
    );
    const thisWeekMiles = thisWeekActivities.reduce((sum, a) =>
      sum + kmToMiles(a.distanceKm || 0), 0
    );
    const thisWeekTime = thisWeekActivities.reduce((sum, a) =>
      sum + (a.durationMinutes || 0), 0
    );
    const thisWeekElevation = thisWeekActivities.reduce((sum, a) =>
      sum + metersToFeet(a.metadata?.total_elevation_gain || 0), 0
    );

    // Calculate this month stats
    const thisMonthActivities = cyclingActivities.filter(a =>
      new Date(a.startTime) >= startOfMonth
    );
    const thisMonthMiles = thisMonthActivities.reduce((sum, a) =>
      sum + kmToMiles(a.distanceKm || 0), 0
    );
    const thisMonthTime = thisMonthActivities.reduce((sum, a) =>
      sum + (a.durationMinutes || 0), 0
    );
    const thisMonthElevation = thisMonthActivities.reduce((sum, a) =>
      sum + metersToFeet(a.metadata?.total_elevation_gain || 0), 0
    );

    // Calculate personal bests from this year
    const thisYear = now.getFullYear();
    const thisYearActivities = cyclingActivities.filter(a =>
      new Date(a.startTime).getFullYear() === thisYear
    );

    const longestRide = Math.max(
      ...thisYearActivities.map(a => kmToMiles(a.distanceKm || 0)),
      0
    );
    const fastestAvgSpeed = Math.max(
      ...thisYearActivities.map(a => msToMph(a.metadata?.average_speed || 0)),
      0
    );
    const mostElevation = Math.max(
      ...thisYearActivities.map(a => metersToFeet(a.metadata?.total_elevation_gain || 0)),
      0
    );

    // Calculate active weeks streak
    let streak = 0;
    const currentWeek = getWeekNumber(now);
    const weeksCovered = new Set<string>();

    // Group activities by year-week
    for (const activity of cyclingActivities) {
      const date = new Date(activity.startTime);
      const weekKey = `${date.getFullYear()}-${getWeekNumber(date)}`;
      weeksCovered.add(weekKey);
    }

    // Count consecutive weeks backward from current
    for (let i = 0; i < 52; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - (i * 7));
      const weekKey = `${checkDate.getFullYear()}-${getWeekNumber(checkDate)}`;

      if (weeksCovered.has(weekKey)) {
        streak++;
      } else if (i > 0) {
        // Allow current week to be empty (in progress)
        break;
      }
    }

    // Format recent activities
    const recentActivities: FormattedActivity[] = cyclingActivities.slice(0, 10).map(a => {
      const date = new Date(a.startTime);
      const location = [
        a.metadata?.location_city,
        a.metadata?.location_state
      ].filter(Boolean).join(", ") || undefined;

      return {
        id: a.id,
        name: a.metadata?.name || "Ride",
        type: a.workoutType || "Ride",
        date,
        dateFormatted: formatDate(date),
        timeFormatted: date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }),
        distanceMiles: kmToMiles(a.distanceKm || 0),
        durationMinutes: a.durationMinutes || 0,
        durationFormatted: formatDuration(a.durationMinutes || 0),
        avgSpeedMph: msToMph(a.metadata?.average_speed || 0),
        maxSpeedMph: msToMph(a.metadata?.max_speed || 0),
        elevationFt: metersToFeet(a.metadata?.total_elevation_gain || 0),
        calories: a.caloriesBurned || 0,
        heartRateAvg: a.heartRateAvg,
        heartRateMax: a.heartRateMax,
        isPR: (a.metadata?.pr_count || 0) > 0,
        location,
      };
    });

    return {
      thisWeekMiles: Math.round(thisWeekMiles * 10) / 10,
      thisWeekRides: thisWeekActivities.length,
      thisWeekTime: Math.round(thisWeekTime),
      thisWeekElevation: Math.round(thisWeekElevation),

      thisMonthMiles: Math.round(thisMonthMiles * 10) / 10,
      thisMonthRides: thisMonthActivities.length,
      thisMonthTime: Math.round(thisMonthTime),
      thisMonthElevation: Math.round(thisMonthElevation),

      longestRide: Math.round(longestRide * 10) / 10,
      fastestAvgSpeed: Math.round(fastestAvgSpeed * 10) / 10,
      mostElevation: Math.round(mostElevation),

      activeWeeksStreak: streak,

      recentActivities,
    };
  }, [activitiesResponse]);

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}
