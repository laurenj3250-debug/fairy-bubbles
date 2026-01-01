/**
 * useYearlyGoals Hook
 * Fetches yearly goals with computed progress from all integrated sources
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  YEARLY_GOAL_CATEGORY_ORDER,
  YEARLY_GOAL_CATEGORY_LABELS,
  YearlyGoalSubItem,
} from "@shared/schema";

// Types matching the API response
export interface YearlyGoalWithProgress {
  id: number;
  userId: number;
  year: string;
  title: string;
  description: string | null;
  category: string;
  position: number;
  goalType: "binary" | "count" | "compound";
  targetValue: number;
  currentValue: number;
  linkedHabitId: number | null;
  linkedJourneyKey: string | null;
  linkedDreamScrollCategory: string | null;
  linkedBookId: number | null;
  subItems: YearlyGoalSubItem[];
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  xpReward: number;
  rewardClaimed: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed fields from server
  computedValue: number;
  source: "manual" | "auto";
  sourceLabel?: string;
  isCompleted: boolean;
  progressPercent: number;
}

export interface YearlyGoalsStats {
  totalGoals: number;
  completedGoals: number;
  progressPercent: number;
  byCategory: Record<string, { total: number; completed: number; progressPercent: number }>;
}

export interface CreateYearlyGoalInput {
  year: string;
  title: string;
  description?: string;
  category: string;
  goalType?: "binary" | "count" | "compound";
  targetValue?: number;
  subItems?: { id: string; title: string; completed: boolean }[];
  linkedHabitId?: number;
  linkedJourneyKey?: string;
  linkedDreamScrollCategory?: string;
  xpReward?: number;
}

export interface UpdateYearlyGoalInput {
  title?: string;
  description?: string | null;
  targetValue?: number;
  position?: number;
  xpReward?: number;
}

export function useYearlyGoals(year: string = new Date().getFullYear().toString()) {
  const queryClient = useQueryClient();

  // Main query - fetch all goals with computed progress
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<{ goals: YearlyGoalWithProgress[] }>({
    queryKey: ["/api/yearly-goals/with-progress", { year }],
    queryFn: async () => {
      const res = await fetch(`/api/yearly-goals/with-progress?year=${encodeURIComponent(year)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const goals = data?.goals ?? [];

  // Group goals by category in display order
  const goalsByCategory = useMemo(() => {
    const grouped: Record<string, YearlyGoalWithProgress[]> = {};

    for (const category of YEARLY_GOAL_CATEGORY_ORDER) {
      const categoryGoals = goals.filter((g) => g.category === category);
      if (categoryGoals.length > 0) {
        grouped[category] = categoryGoals.sort((a, b) => a.position - b.position);
      }
    }

    return grouped;
  }, [goals]);

  // Stats
  const stats = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.isCompleted).length;
    const progressPercent =
      totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    // Overall weighted progress (average of all goal percentages)
    const avgProgress =
      totalGoals > 0
        ? Math.round(goals.reduce((sum, g) => sum + g.progressPercent, 0) / totalGoals)
        : 0;

    return {
      totalGoals,
      completedGoals,
      completionPercent: progressPercent,
      avgProgress,
    };
  }, [goals]);

  // ============ MUTATIONS ============

  // Create goal
  const createGoalMutation = useMutation({
    mutationFn: async (input: CreateYearlyGoalInput) => {
      const response = await fetch("/api/yearly-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create goal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
    },
  });

  // Update goal
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, ...input }: UpdateYearlyGoalInput & { id: number }) => {
      const response = await fetch(`/api/yearly-goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update goal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
    },
  });

  // Delete goal
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/yearly-goals/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete goal");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
    },
  });

  // Increment count goal
  const incrementGoalMutation = useMutation({
    mutationFn: async ({ id, amount = 1, note }: { id: number; amount?: number; note?: string }) => {
      const response = await fetch(`/api/yearly-goals/${id}/increment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, note }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to increment goal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
    },
  });

  // Toggle binary goal
  const toggleGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/yearly-goals/${id}/toggle`, {
        method: "POST",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to toggle goal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
    },
  });

  // Toggle sub-item in compound goal
  const toggleSubItemMutation = useMutation({
    mutationFn: async ({ goalId, subItemId }: { goalId: number; subItemId: string }) => {
      const response = await fetch(`/api/yearly-goals/${goalId}/sub-item/${subItemId}/toggle`, {
        method: "POST",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to toggle sub-item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
      // Also invalidate points since sub-items award XP
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
    },
  });

  // Claim reward
  const claimRewardMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/yearly-goals/${id}/claim-reward`, {
        method: "POST",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to claim reward");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
    },
  });

  // Copy year
  const copyYearMutation = useMutation({
    mutationFn: async ({ fromYear, toYear }: { fromYear: string; toYear: string }) => {
      const response = await fetch("/api/yearly-goals/copy-year", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromYear, toYear }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to copy goals");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
    },
  });

  return {
    // Data
    goals,
    goalsByCategory,
    categories: Object.keys(goalsByCategory),
    stats,
    year,

    // Loading states
    isLoading,
    error,
    refetch,

    // Mutations
    createGoal: createGoalMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    deleteGoal: deleteGoalMutation.mutateAsync,
    incrementGoal: incrementGoalMutation.mutateAsync,
    toggleGoal: toggleGoalMutation.mutateAsync,
    toggleSubItem: toggleSubItemMutation.mutateAsync,
    claimReward: claimRewardMutation.mutateAsync,
    copyYear: copyYearMutation.mutateAsync,

    // Mutation loading states
    isCreating: createGoalMutation.isPending,
    isUpdating: updateGoalMutation.isPending,
    isDeleting: deleteGoalMutation.isPending,
    isIncrementing: incrementGoalMutation.isPending,
    isToggling: toggleGoalMutation.isPending,
    isTogglingSubItem: toggleSubItemMutation.isPending,
    isClaimingReward: claimRewardMutation.isPending,
    isCopyingYear: copyYearMutation.isPending,

    // Constants
    categoryLabels: YEARLY_GOAL_CATEGORY_LABELS,
    categoryOrder: YEARLY_GOAL_CATEGORY_ORDER,
  };
}
