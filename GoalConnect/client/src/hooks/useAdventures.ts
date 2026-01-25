/**
 * useAdventures Hook
 * CRUD operations for outdoor adventures with photo upload
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Adventure {
  id: number;
  userId: number;
  date: string;
  activity: string;
  location: string | null;
  photoPath: string | null;
  thumbPath: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdventureInput {
  date: string;
  activity: string;
  location?: string;
  notes?: string;
  photo?: File;
}

export interface AdventuresResponse {
  adventures: Adventure[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UseAdventuresOptions {
  year?: string;
  page?: number;
  limit?: number;
}

export function useAdventures(options: UseAdventuresOptions = {}) {
  const queryClient = useQueryClient();
  const { year, page = 1, limit = 24 } = options;

  // Build query params
  const queryParams = new URLSearchParams();
  if (year) queryParams.set("year", year);
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));

  // Fetch adventures
  const {
    data,
    isLoading,
    error,
  } = useQuery<AdventuresResponse>({
    queryKey: ["/api/adventures", { year, page, limit }],
    queryFn: async () => {
      const res = await fetch(`/api/adventures?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch adventures");
      return res.json();
    },
  });

  // Create adventure
  const createMutation = useMutation({
    mutationFn: async (input: AdventureInput) => {
      const formData = new FormData();
      formData.append("date", input.date);
      formData.append("activity", input.activity);
      if (input.location) formData.append("location", input.location);
      if (input.notes) formData.append("notes", input.notes);
      if (input.photo) formData.append("photo", input.photo);

      const res = await fetch("/api/adventures", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create adventure");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adventures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
    },
  });

  // Update adventure
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: AdventureInput & { id: number }) => {
      const formData = new FormData();
      if (input.date) formData.append("date", input.date);
      if (input.activity) formData.append("activity", input.activity);
      if (input.location) formData.append("location", input.location);
      if (input.notes) formData.append("notes", input.notes);
      if (input.photo) formData.append("photo", input.photo);

      const res = await fetch(`/api/adventures/${id}`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update adventure");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adventures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
    },
  });

  // Delete adventure
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/adventures/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete adventure");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adventures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
    },
  });

  return {
    adventures: data?.adventures ?? [],
    pagination: data?.pagination,
    isLoading,
    error,
    createAdventure: createMutation.mutateAsync,
    updateAdventure: updateMutation.mutateAsync,
    deleteAdventure: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
