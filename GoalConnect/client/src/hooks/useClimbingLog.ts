/**
 * useClimbingLog Hook
 * CRUD operations and stats for manual climbing tick log
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type RouteType = "sport" | "trad" | "boulder" | "alpine" | "ice";
export type AscentStyle = "onsight" | "flash" | "redpoint" | "pinkpoint" | "send" | "attempt" | "toprope";

export interface ClimbingTick {
  id: number;
  userId: number;
  routeName: string;
  grade: string;
  routeType: RouteType;
  ascentStyle: AscentStyle;
  date: string;
  location: string | null;
  area: string | null;
  pitches: number;
  stars: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClimbingTickInput {
  routeName: string;
  grade: string;
  routeType: RouteType;
  ascentStyle: AscentStyle;
  date: string;
  location?: string;
  area?: string;
  pitches?: number;
  stars?: number;
  notes?: string;
}

interface TicksResponse {
  ticks: ClimbingTick[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ClimbingLogStats {
  totalTicks: number;
  ytdTicks: number;
  outdoorDays: number;
  gradeDistribution: Record<string, number>;
  styleDistribution: Record<string, number>;
  routeTypeDistribution: Record<string, number>;
  recentTicks: ClimbingTick[];
  // Computed server-side for proper sorting
  highestRouteGrade?: string;
  highestBoulderGrade?: string;
}

interface UseClimbingLogOptions {
  limit?: number;
  offset?: number;
  year?: number;
}

export function useClimbingLog(options: UseClimbingLogOptions = {}) {
  const queryClient = useQueryClient();
  const { limit = 50, offset = 0, year } = options;

  // Fetch ticks
  const queryParams = new URLSearchParams();
  queryParams.set("limit", String(limit));
  queryParams.set("offset", String(offset));
  if (year) queryParams.set("year", String(year));

  const {
    data: ticksResponse,
    isLoading: isLoadingTicks,
    error: ticksError,
  } = useQuery<TicksResponse>({
    queryKey: ["/api/climbing-log", { limit, offset, year }],
    queryFn: async () => {
      const res = await fetch(`/api/climbing-log?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch climbing ticks");
      return res.json();
    },
  });

  // Fetch stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<ClimbingLogStats>({
    queryKey: ["/api/climbing-log/stats"],
    queryFn: async () => {
      const res = await fetch("/api/climbing-log/stats");
      if (!res.ok) throw new Error("Failed to fetch climbing stats");
      return res.json();
    },
  });

  // Create tick mutation
  const createMutation = useMutation({
    mutationFn: async (tick: ClimbingTickInput) => {
      const res = await fetch("/api/climbing-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tick),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create tick");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/climbing-log"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
    },
  });

  // Quick log mutation - just date, location, notes
  const quickLogMutation = useMutation({
    mutationFn: async (data: { date: string; location?: string; notes?: string }) => {
      const res = await fetch("/api/climbing-log/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to log climbing day");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/climbing-log"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
    },
  });

  // Update tick mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...tick }: Partial<ClimbingTickInput> & { id: number }) => {
      const res = await fetch(`/api/climbing-log/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tick),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update tick");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/climbing-log"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
    },
  });

  // Delete tick mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/climbing-log/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete tick");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/climbing-log"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
    },
  });

  return {
    // Data
    ticks: ticksResponse?.ticks ?? [],
    pagination: ticksResponse?.pagination,
    stats,

    // Loading states
    isLoading: isLoadingTicks || isLoadingStats,
    isLoadingTicks,
    isLoadingStats,

    // Errors
    error: ticksError || statsError,

    // Mutations
    createTick: createMutation.mutateAsync,
    quickLogDay: quickLogMutation.mutateAsync,
    updateTick: updateMutation.mutateAsync,
    deleteTick: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isQuickLogging: quickLogMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
