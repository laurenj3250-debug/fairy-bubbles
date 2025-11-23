/**
 * useStravaStats Hook
 * Fetches Strava cycling/activity statistics
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

// Types matching the API response
interface ActivityTotals {
  count: number;
  distanceKm: number;
  durationHours: number;
  elevationGainM: number;
}

interface StravaStatsSummary {
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

interface StravaStatsResponse {
  strava: StravaStatsSummary;
  local: {
    totalActivities: number;
    totalDuration: number;
    totalCalories: number;
  };
}

interface StravaConnectionStatus {
  connected: boolean;
  athleteId?: string;
  lastSyncAt?: string;
}

// Convert km to miles
const kmToMiles = (km: number): number => km * 0.621371;

// Convert meters to feet
const metersToFeet = (m: number): number => m * 3.28084;

export interface StravaStats {
  isConnected: boolean;

  // Year-to-date cycling
  ytdMiles: number;
  ytdRides: number;
  ytdElevationFt: number;
  ytdHours: number;

  // All-time cycling
  allTimeMiles: number;
  allTimeRides: number;
  allTimeElevationFt: number;
  allTimeHours: number;

  // Recent cycling (last 4 weeks)
  recentMiles: number;
  recentRides: number;
  recentHours: number;

  // Calculated stats
  avgMilesPerRide: number;
  avgHoursPerRide: number;

  // Local database stats
  localActivities: number;
  localDurationMinutes: number;
  localCalories: number;

  // Raw data for advanced use
  raw?: StravaStatsSummary;
}

export function useStravaStats() {
  // Check connection status first
  const {
    data: status,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useQuery<StravaConnectionStatus>({
    queryKey: ["/api/import/strava/status"],
  });

  // Fetch stats (only if connected)
  const {
    data: statsResponse,
    isLoading: isLoadingStats,
    error: statsError,
    refetch,
  } = useQuery<StravaStatsResponse>({
    queryKey: ["/api/import/strava/stats"],
    enabled: status?.connected === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process and format stats
  const stats = useMemo<StravaStats | null>(() => {
    if (!status) return null;

    // Not connected - return zeros
    if (!status.connected) {
      return {
        isConnected: false,
        ytdMiles: 0,
        ytdRides: 0,
        ytdElevationFt: 0,
        ytdHours: 0,
        allTimeMiles: 0,
        allTimeRides: 0,
        allTimeElevationFt: 0,
        allTimeHours: 0,
        recentMiles: 0,
        recentRides: 0,
        recentHours: 0,
        avgMilesPerRide: 0,
        avgHoursPerRide: 0,
        localActivities: 0,
        localDurationMinutes: 0,
        localCalories: 0,
      };
    }

    // Connected but still loading stats
    if (!statsResponse) {
      return {
        isConnected: true,
        ytdMiles: 0,
        ytdRides: 0,
        ytdElevationFt: 0,
        ytdHours: 0,
        allTimeMiles: 0,
        allTimeRides: 0,
        allTimeElevationFt: 0,
        allTimeHours: 0,
        recentMiles: 0,
        recentRides: 0,
        recentHours: 0,
        avgMilesPerRide: 0,
        avgHoursPerRide: 0,
        localActivities: 0,
        localDurationMinutes: 0,
        localCalories: 0,
      };
    }

    const { strava, local } = statsResponse;

    // YTD cycling stats
    const ytdRides = strava.ytd.rides;
    const ytdMiles = kmToMiles(ytdRides.distanceKm);

    // All-time cycling stats
    const allTimeRides = strava.allTime.rides;
    const allTimeMiles = kmToMiles(allTimeRides.distanceKm);

    // Recent cycling stats
    const recentRides = strava.recent.rides;
    const recentMiles = kmToMiles(recentRides.distanceKm);

    return {
      isConnected: true,

      // YTD
      ytdMiles: Math.round(ytdMiles),
      ytdRides: ytdRides.count,
      ytdElevationFt: Math.round(metersToFeet(ytdRides.elevationGainM)),
      ytdHours: Math.round(ytdRides.durationHours * 10) / 10,

      // All-time
      allTimeMiles: Math.round(allTimeMiles),
      allTimeRides: allTimeRides.count,
      allTimeElevationFt: Math.round(metersToFeet(allTimeRides.elevationGainM)),
      allTimeHours: Math.round(allTimeRides.durationHours * 10) / 10,

      // Recent
      recentMiles: Math.round(recentMiles),
      recentRides: recentRides.count,
      recentHours: Math.round(recentRides.durationHours * 10) / 10,

      // Calculated
      avgMilesPerRide: ytdRides.count > 0
        ? Math.round((ytdMiles / ytdRides.count) * 10) / 10
        : 0,
      avgHoursPerRide: ytdRides.count > 0
        ? Math.round((ytdRides.durationHours / ytdRides.count) * 10) / 10
        : 0,

      // Local
      localActivities: local.totalActivities || 0,
      localDurationMinutes: local.totalDuration || 0,
      localCalories: local.totalCalories || 0,

      // Raw for advanced use
      raw: strava,
    };
  }, [status, statsResponse]);

  return {
    stats,
    isLoading: isLoadingStatus || isLoadingStats,
    error: statusError || statsError,
    refetch,
  };
}
