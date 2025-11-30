/**
 * useStravaClimbingActivities Hook
 * Fetches Strava activities and filters for climbing-related activities
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

// Strava activity types that are climbing-related
const CLIMBING_TYPES = [
  "RockClimbing",
  "Rock Climbing",
  "Indoor Climbing",
  "Bouldering",
  "Climbing",
];

// Keywords in activity names that indicate climbing (for "Workout" type activities)
const CLIMBING_NAME_KEYWORDS = [
  "climb",
  "boulder",
  "kilter",
  "moonboard",
  "tension board",
  "grasshopper",
  "movement",  // Movement climbing gym
  "sender one",
  "touchstone",
  "earth treks",
  "planet granite",
  "brooklyn boulders",
  "el cap",
  "crag",
  "send",
  "proj",  // project
  "redpoint",
  "onsight",
  "flash",
];

interface StravaActivity {
  id: number;
  externalId: string;
  workoutType: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  heartRateAvg: number | null;
  heartRateMax: number | null;
  caloriesBurned: number | null;
  distanceKm: string | null;
  metadata: {
    name?: string;
    location_city?: string;
    location_state?: string;
    total_elevation_gain?: number;
    [key: string]: unknown;
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

interface StravaConnectionStatus {
  connected: boolean;
  configured: boolean;
}

export interface ClimbingActivity {
  id: number;
  name: string;
  type: string;
  date: string;
  durationMinutes: number;
  calories: number;
  heartRate: number | null;
  location: string;
  elevationGain: number;
}

export interface StravaClimbingStats {
  isConnected: boolean;
  isConfigured: boolean;

  // Recent activities
  recentActivities: ClimbingActivity[];

  // This week stats
  thisWeek: {
    activities: number;
    timeHours: number;
    calories: number;
    elevationFt: number;
  };

  // This month stats
  thisMonth: {
    activities: number;
    timeHours: number;
    calories: number;
    elevationFt: number;
  };

  // All-time totals
  totalActivities: number;
  totalTimeHours: number;
  avgDurationMinutes: number;
  avgHeartRate: number | null;
}

// Convert meters to feet
const metersToFeet = (m: number): number => Math.round(m * 3.28084);

// Check if a date is within the past N days
const isWithinDays = (dateStr: string, days: number): boolean => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= days;
};

export function useStravaClimbingActivities() {
  // Check connection status first
  const {
    data: status,
    isLoading: isLoadingStatus,
  } = useQuery<StravaConnectionStatus>({
    queryKey: ["/api/import/strava/status"],
  });

  // Fetch activities (only if connected)
  const {
    data: activitiesResponse,
    isLoading: isLoadingActivities,
    error,
    refetch,
  } = useQuery<ActivitiesResponse>({
    queryKey: ["/api/import/strava/activities", { limit: 100 }],
    queryFn: async () => {
      const res = await fetch("/api/import/strava/activities?limit=100");
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
    enabled: status?.connected === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter and process climbing activities
  const stats = useMemo<StravaClimbingStats | null>(() => {
    if (!status) return null;

    // Not connected or not configured
    if (!status.connected || !status.configured) {
      return {
        isConnected: status.connected,
        isConfigured: status.configured,
        recentActivities: [],
        thisWeek: { activities: 0, timeHours: 0, calories: 0, elevationFt: 0 },
        thisMonth: { activities: 0, timeHours: 0, calories: 0, elevationFt: 0 },
        totalActivities: 0,
        totalTimeHours: 0,
        avgDurationMinutes: 0,
        avgHeartRate: null,
      };
    }

    // Filter for climbing activities by type OR by name keywords
    const allActivities = activitiesResponse?.activities ?? [];
    const climbingActivities = allActivities.filter(activity => {
      // Check if activity type is climbing-related
      const isClimbingType = CLIMBING_TYPES.some(type =>
        activity.workoutType?.toLowerCase().includes(type.toLowerCase())
      );
      if (isClimbingType) return true;

      // Check if activity name contains climbing keywords (for "Workout" type)
      const activityName = (activity.metadata?.name || "").toLowerCase();
      const hasClimbingKeyword = CLIMBING_NAME_KEYWORDS.some(keyword =>
        activityName.includes(keyword.toLowerCase())
      );
      return hasClimbingKeyword;
    });

    // Transform to ClimbingActivity format
    const recentActivities: ClimbingActivity[] = climbingActivities
      .slice(0, 10)
      .map(activity => ({
        id: activity.id,
        name: activity.metadata?.name || activity.workoutType,
        type: activity.workoutType,
        date: new Date(activity.startTime).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        durationMinutes: activity.durationMinutes,
        calories: activity.caloriesBurned || 0,
        heartRate: activity.heartRateAvg,
        location: [activity.metadata?.location_city, activity.metadata?.location_state]
          .filter(Boolean)
          .join(", ") || "Unknown",
        elevationGain: activity.metadata?.total_elevation_gain || 0,
      }));

    // This week stats (last 7 days)
    const thisWeekActivities = climbingActivities.filter(a => isWithinDays(a.startTime, 7));
    const thisWeek = {
      activities: thisWeekActivities.length,
      timeHours: Math.round(thisWeekActivities.reduce((sum, a) => sum + a.durationMinutes, 0) / 60 * 10) / 10,
      calories: thisWeekActivities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0),
      elevationFt: metersToFeet(thisWeekActivities.reduce((sum, a) => sum + (a.metadata?.total_elevation_gain || 0), 0)),
    };

    // This month stats (last 30 days)
    const thisMonthActivities = climbingActivities.filter(a => isWithinDays(a.startTime, 30));
    const thisMonth = {
      activities: thisMonthActivities.length,
      timeHours: Math.round(thisMonthActivities.reduce((sum, a) => sum + a.durationMinutes, 0) / 60 * 10) / 10,
      calories: thisMonthActivities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0),
      elevationFt: metersToFeet(thisMonthActivities.reduce((sum, a) => sum + (a.metadata?.total_elevation_gain || 0), 0)),
    };

    // All-time totals
    const totalActivities = climbingActivities.length;
    const totalMinutes = climbingActivities.reduce((sum, a) => sum + a.durationMinutes, 0);
    const totalTimeHours = Math.round(totalMinutes / 60 * 10) / 10;
    const avgDurationMinutes = totalActivities > 0 ? Math.round(totalMinutes / totalActivities) : 0;

    // Average heart rate (only from activities that have it)
    const activitiesWithHR = climbingActivities.filter(a => a.heartRateAvg);
    const avgHeartRate = activitiesWithHR.length > 0
      ? Math.round(activitiesWithHR.reduce((sum, a) => sum + (a.heartRateAvg || 0), 0) / activitiesWithHR.length)
      : null;

    return {
      isConnected: true,
      isConfigured: true,
      recentActivities,
      thisWeek,
      thisMonth,
      totalActivities,
      totalTimeHours,
      avgDurationMinutes,
      avgHeartRate,
    };
  }, [status, activitiesResponse]);

  return {
    stats,
    isLoading: isLoadingStatus || isLoadingActivities,
    error,
    refetch,
  };
}
