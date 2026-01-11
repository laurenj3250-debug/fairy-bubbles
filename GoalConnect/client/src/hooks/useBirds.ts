/**
 * useBirds Hook
 * CRUD operations for bird life list with photo upload
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface BirdSighting {
  id: number;
  userId: number;
  speciesName: string;
  firstSeenDate: string;
  firstSeenAdventureId: number | null;
  location: string | null;
  photoPath: string | null;
  thumbPath: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BirdInput {
  speciesName: string;
  firstSeenDate: string;
  firstSeenAdventureId?: number;
  location?: string;
  notes?: string;
  photo?: File;
}

export interface BirdsResponse {
  birds: BirdSighting[];
  total: number;
}

export type BirdSort = "alphabetical" | "date_desc" | "date_asc" | "recent";

export interface UseBirdsOptions {
  sort?: BirdSort;
  search?: string;
  year?: string;
}

export function useBirds(options: UseBirdsOptions = {}) {
  const queryClient = useQueryClient();
  const { sort = "alphabetical", search, year } = options;

  // Build query params
  const queryParams = new URLSearchParams();
  if (sort) queryParams.set("sort", sort);
  if (search) queryParams.set("search", search);
  if (year) queryParams.set("year", year);

  // Fetch birds
  const {
    data,
    isLoading,
    error,
  } = useQuery<BirdsResponse>({
    queryKey: ["/api/birds", { sort, search, year }],
    queryFn: async () => {
      const res = await fetch(`/api/birds?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch birds");
      return res.json();
    },
  });

  // Create bird
  const createMutation = useMutation({
    mutationFn: async (input: BirdInput) => {
      const formData = new FormData();
      formData.append("speciesName", input.speciesName);
      formData.append("firstSeenDate", input.firstSeenDate);
      if (input.firstSeenAdventureId) formData.append("firstSeenAdventureId", String(input.firstSeenAdventureId));
      if (input.location) formData.append("location", input.location);
      if (input.notes) formData.append("notes", input.notes);
      if (input.photo) formData.append("photo", input.photo);

      const res = await fetch("/api/birds", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add bird");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/birds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals"] });
    },
  });

  // Update bird
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: BirdInput & { id: number }) => {
      const formData = new FormData();
      if (input.speciesName) formData.append("speciesName", input.speciesName);
      if (input.firstSeenDate) formData.append("firstSeenDate", input.firstSeenDate);
      if (input.firstSeenAdventureId !== undefined) {
        formData.append("firstSeenAdventureId", input.firstSeenAdventureId ? String(input.firstSeenAdventureId) : "null");
      }
      if (input.location) formData.append("location", input.location);
      if (input.notes) formData.append("notes", input.notes);
      if (input.photo) formData.append("photo", input.photo);

      const res = await fetch(`/api/birds/${id}`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update bird");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/birds"] });
    },
  });

  // Delete bird
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/birds/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete bird");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/birds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals"] });
    },
  });

  return {
    birds: data?.birds ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    createBird: createMutation.mutateAsync,
    updateBird: updateMutation.mutateAsync,
    deleteBird: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
