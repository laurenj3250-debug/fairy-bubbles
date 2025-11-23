/**
 * useLiftingStats Hook
 * Fetches lifting workout stats using server-side filtering
 */

import { useQuery } from "@tanstack/react-query";

// Workout types that count as "lifting"
const LIFTING_WORKOUT_TYPES = [
  "HKWorkoutActivityTypeFunctionalStrengthTraining",
  "HKWorkoutActivityTypeTraditionalStrengthTraining",
];

interface LiftingStatsResponse {
  count: number;
  totalMinutes: number;
}

export interface LiftingStats {
  ytdWorkouts: number;
  totalMinutes: number;
}

export function useLiftingStats() {
  const currentYear = new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;
  const workoutTypes = LIFTING_WORKOUT_TYPES.join(",");

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<LiftingStatsResponse>({
    queryKey: ["/api/import/workouts", { workoutTypes, startDate, countOnly: true }],
    queryFn: async () => {
      const params = new URLSearchParams({
        workoutType: workoutTypes,
        startDate,
        countOnly: "true",
      });
      const res = await fetch(`/api/import/workouts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch lifting stats");
      return res.json();
    },
  });

  const stats: LiftingStats | null = data
    ? {
        ytdWorkouts: data.count,
        totalMinutes: data.totalMinutes,
      }
    : null;

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}
