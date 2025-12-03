/**
 * useHabitMappings Hook
 * CRUD operations for habit auto-complete mapping rules
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface MatchCriteria {
  activityTypes?: string[];
  minDurationMinutes?: number;
  keywords?: string[];
}

export interface HabitMapping {
  id: number;
  habitId: number;
  sourceType: string;
  matchCriteria: MatchCriteria;
  autoComplete: boolean;
  autoIncrement: boolean;
  createdAt: string;
  habitTitle: string;
  habitIcon: string;
}

export interface CreateMappingInput {
  habitId: number;
  sourceType: "strava" | "apple_watch" | "kilter_board";
  matchCriteria: MatchCriteria;
  autoComplete?: boolean;
  autoIncrement?: boolean;
}

interface MappingsResponse {
  mappings: HabitMapping[];
}

interface ActivityTypesResponse {
  activityTypes: string[];
}

export function useHabitMappings() {
  const queryClient = useQueryClient();

  // Fetch all mappings
  const {
    data: mappingsResponse,
    isLoading: isLoadingMappings,
    error: mappingsError,
  } = useQuery<MappingsResponse>({
    queryKey: ["/api/habit-mappings"],
    queryFn: async () => {
      const res = await fetch("/api/habit-mappings");
      if (!res.ok) throw new Error("Failed to fetch habit mappings");
      return res.json();
    },
  });

  // Fetch available activity types
  const {
    data: activityTypesResponse,
    isLoading: isLoadingActivityTypes,
  } = useQuery<ActivityTypesResponse>({
    queryKey: ["/api/habit-mappings/activity-types"],
    queryFn: async () => {
      const res = await fetch("/api/habit-mappings/activity-types");
      if (!res.ok) throw new Error("Failed to fetch activity types");
      return res.json();
    },
  });

  // Create mapping mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateMappingInput) => {
      const res = await fetch("/api/habit-mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create mapping");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-mappings"] });
    },
  });

  // Update mapping mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<CreateMappingInput>) => {
      const res = await fetch(`/api/habit-mappings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update mapping");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-mappings"] });
    },
  });

  // Delete mapping mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/habit-mappings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete mapping");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-mappings"] });
    },
  });

  return {
    // Data
    mappings: mappingsResponse?.mappings ?? [],
    activityTypes: activityTypesResponse?.activityTypes ?? [],

    // Loading states
    isLoading: isLoadingMappings || isLoadingActivityTypes,
    isLoadingMappings,
    isLoadingActivityTypes,

    // Errors
    error: mappingsError,

    // Mutations
    createMapping: createMutation.mutateAsync,
    updateMapping: updateMutation.mutateAsync,
    deleteMapping: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
