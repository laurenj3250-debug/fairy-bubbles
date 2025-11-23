/**
 * useJourneyGoals Hook
 * Fetches and manages Journey dashboard goals (cycling, lifting, climbing)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

// Types matching the schema
export interface JourneyGoal {
  id: number;
  userId: number;
  category: "cycling" | "lifting" | "climbing";
  goalKey: string;
  targetValue: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

// Organized goals by category and key for easy access
export interface OrganizedGoals {
  cycling: {
    yearly_miles?: JourneyGoal;
  };
  lifting: {
    yearly_workouts?: JourneyGoal;
    total_lift?: JourneyGoal;
  };
  climbing: {
    yearly_climbs?: JourneyGoal;
  };
}

// Default values if goals haven't been set
export const DEFAULT_TARGETS = {
  cycling: { yearly_miles: 4000 },
  lifting: { yearly_workouts: 200, total_lift: 1000 },
  climbing: { yearly_climbs: 300 },
} as const;

export function useJourneyGoals() {
  const queryClient = useQueryClient();

  // Fetch all journey goals
  const {
    data: goals,
    isLoading,
    error,
    refetch,
  } = useQuery<JourneyGoal[]>({
    queryKey: ["/api/journey-goals"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({
      goalKey,
      targetValue,
    }: {
      goalKey: string;
      targetValue: number;
    }) => {
      const response = await fetch(`/api/journey-goals/${goalKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetValue }),
      });
      if (!response.ok) throw new Error("Failed to update goal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journey-goals"] });
    },
  });

  // Reset goals mutation
  const resetGoalsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/journey-goals/reset", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reset goals");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journey-goals"] });
    },
  });

  // NOTE: Linking mutations removed - Journey is source of truth

  // Organize goals by category and key
  const organizedGoals = useMemo<OrganizedGoals>(() => {
    const result: OrganizedGoals = {
      cycling: {},
      lifting: {},
      climbing: {},
    };

    if (!goals) return result;

    for (const goal of goals) {
      if (goal.category === "cycling" && goal.goalKey === "yearly_miles") {
        result.cycling.yearly_miles = goal;
      } else if (goal.category === "lifting") {
        if (goal.goalKey === "yearly_workouts") {
          result.lifting.yearly_workouts = goal;
        } else if (goal.goalKey === "total_lift") {
          result.lifting.total_lift = goal;
        }
      } else if (goal.category === "climbing" && goal.goalKey === "yearly_climbs") {
        result.climbing.yearly_climbs = goal;
      }
    }

    return result;
  }, [goals]);

  // Helper to get target value with fallback to defaults
  const getTarget = (
    category: "cycling" | "lifting" | "climbing",
    goalKey: string
  ): number => {
    const goal = (organizedGoals[category] as Record<string, JourneyGoal | undefined>)[goalKey];
    if (goal) return goal.targetValue;
    return (DEFAULT_TARGETS[category] as Record<string, number>)[goalKey] ?? 0;
  };

  // Convenience accessors
  const targets = {
    cyclingMiles: getTarget("cycling", "yearly_miles"),
    liftingWorkouts: getTarget("lifting", "yearly_workouts"),
    liftingTotal: getTarget("lifting", "total_lift"),
    climbingTicks: getTarget("climbing", "yearly_climbs"),
  };

  return {
    goals,
    organizedGoals,
    targets,
    isLoading,
    error,
    refetch,
    updateGoal: updateGoalMutation.mutateAsync,
    resetGoals: resetGoalsMutation.mutateAsync,
    isUpdating: updateGoalMutation.isPending,
    isResetting: resetGoalsMutation.isPending,
  };
}
