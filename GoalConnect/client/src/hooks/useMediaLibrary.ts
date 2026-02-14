/**
 * useMediaLibrary Hook
 * CRUD operations for tracking books, TV shows, movies, audiobooks, and podcasts
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export type MediaType = "book" | "tv_show" | "movie" | "audiobook" | "podcast";
export type MediaStatus = "want" | "current" | "paused" | "done" | "abandoned";

export interface MediaItem {
  id: number;
  userId: number;
  title: string;
  mediaType: MediaType;
  status: MediaStatus;
  author: string | null;
  year: number | null;
  imageUrl: string | null;
  currentProgress: string | null;
  totalProgress: string | null;
  rating: number | null;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItemInput {
  title: string;
  mediaType: MediaType;
  status?: MediaStatus;
  author?: string;
  year?: number;
  imageUrl?: string;
  currentProgress?: string;
  totalProgress?: string;
  rating?: number;
  notes?: string;
}

export interface UseMediaLibraryOptions {
  type?: MediaType;
  status?: MediaStatus;
  sort?: "recent" | "rating" | "title" | "year";
}

export function useMediaLibrary(options: UseMediaLibraryOptions = {}) {
  const queryClient = useQueryClient();
  const { type, status, sort = "recent" } = options;

  // Build query params
  const queryParams = new URLSearchParams();
  if (type) queryParams.set("type", type);
  if (status) queryParams.set("status", status);
  if (sort) queryParams.set("sort", sort);

  // Fetch all items with filters
  const {
    data: items,
    isLoading,
    error,
  } = useQuery<MediaItem[]>({
    queryKey: ["/api/media-library", { type, status, sort }],
    queryFn: async () => {
      const res = await fetch(`/api/media-library?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch media items");
      return res.json();
    },
  });

  // Fetch current items only (for widget - status="current")
  const {
    data: currentItems,
    isLoading: isLoadingCurrent,
  } = useQuery<MediaItem[]>({
    queryKey: ["/api/media-library/current"],
    queryFn: async () => {
      const res = await fetch("/api/media-library/current");
      if (!res.ok) throw new Error("Failed to fetch current media items");
      return res.json();
    },
  });

  // Fetch recent items (for widget fallback when no "current" items)
  const {
    data: recentItems,
    isLoading: isLoadingRecent,
  } = useQuery<MediaItem[]>({
    queryKey: ["/api/media-library/recent"],
    queryFn: async () => {
      const res = await fetch("/api/media-library?sort=recent&limit=5");
      if (!res.ok) throw new Error("Failed to fetch recent media items");
      return res.json();
    },
  });

  // For widget: show current items if any, otherwise show recent
  const widgetItems = useMemo(() => {
    if (currentItems && currentItems.length > 0) return currentItems;
    return recentItems ?? [];
  }, [currentItems, recentItems]);

  // Widget mode: "current" if showing active items, "recent" if fallback
  const widgetMode = (currentItems && currentItems.length > 0) ? "current" : "recent";

  // Group items by type
  const itemsByType = useMemo(() => {
    if (!items) return {};
    return items.reduce((acc, item) => {
      const key = item.mediaType;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<MediaType, MediaItem[]>);
  }, [items]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (item: MediaItemInput) => {
      const res = await fetch("/api/media-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create item");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media-library/current"] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...item }: Partial<MediaItemInput> & { id: number }) => {
      const res = await fetch(`/api/media-library/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update item");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media-library/current"] });
    },
  });

  // Update progress mutation (quick update)
  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, currentProgress }: { id: number; currentProgress: string }) => {
      const res = await fetch(`/api/media-library/${id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentProgress }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update progress");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media-library/current"] });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: MediaStatus }) => {
      const res = await fetch(`/api/media-library/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media-library/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media-library/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points/transactions"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/media-library/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media-library/current"] });
    },
  });

  return {
    // Data
    items: items ?? [],
    currentItems: currentItems ?? [],
    recentItems: recentItems ?? [],
    widgetItems,
    widgetMode,
    itemsByType,

    // Loading states
    isLoading,
    isLoadingCurrent,
    isLoadingWidget: isLoadingCurrent || isLoadingRecent,

    // Errors
    error,

    // Mutations
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    updateProgress: updateProgressMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUpdatingProgress: updateProgressMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Status display helpers
export const STATUS_LABELS: Record<MediaStatus, string> = {
  want: "Want",
  current: "Current",
  paused: "Paused",
  done: "Done",
  abandoned: "Dropped",
};

export const STATUS_COLORS: Record<MediaStatus, string> = {
  want: "text-slate-400",
  current: "text-blue-400",
  paused: "text-amber-400",
  done: "text-emerald-400",
  abandoned: "text-rose-400",
};

export const STATUS_BG_COLORS: Record<MediaStatus, string> = {
  want: "bg-slate-400/20",
  current: "bg-blue-400/20",
  paused: "bg-amber-400/20",
  done: "bg-emerald-400/20",
  abandoned: "bg-rose-400/20",
};

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  book: "Books",
  tv_show: "Shows",
  movie: "Movies",
  audiobook: "Audiobooks",
  podcast: "Podcasts",
};
