/**
 * useStudyPlanner Hook
 * Manages all study planner data fetching and mutations
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addWeeks } from "date-fns";
import type {
  StudyBook,
  StudyPaper,
  StudyMriLecture,
  EnhancedStudyStats,
  WeekData,
  StudyTaskType,
} from "@shared/types/study";

// Re-export types for convenience
export type {
  StudyBook,
  StudyChapter,
  StudyPaper,
  StudyMriLecture,
  StudyScheduleLog,
  StudyStats,
  EnhancedStudyStats,
  WeekData,
  StudyTaskType,
} from "@shared/types/study";

export { TASK_CONFIG, DEFAULT_WEEKLY_SCHEDULE } from "@shared/types/study";

interface UseStudyPlannerOptions {
  weekOffset?: number;
}

export function useStudyPlanner(options: UseStudyPlannerOptions = {}) {
  const { weekOffset = 0 } = options;
  const { toast } = useToast();

  // Calculate current week date
  const currentWeekStart = addWeeks(
    startOfWeek(new Date(), { weekStartsOn: 0 }),
    weekOffset
  );
  const weekDateParam = format(currentWeekStart, "yyyy-MM-dd");

  // ==================== QUERIES ====================

  // Weekly schedule data
  const weekQuery = useQuery<WeekData>({
    queryKey: ["/api/study/schedule/week", weekDateParam],
    queryFn: () =>
      apiRequest(`/api/study/schedule/week?date=${weekDateParam}`, "GET"),
  });

  // Books with chapters
  const booksQuery = useQuery<StudyBook[]>({
    queryKey: ["/api/study/books"],
  });

  // Papers
  const papersQuery = useQuery<StudyPaper[]>({
    queryKey: ["/api/study/papers"],
  });

  // MRI Lectures
  const lecturesQuery = useQuery<StudyMriLecture[]>({
    queryKey: ["/api/study/mri-lectures"],
  });

  // Stats (enhanced with streaks and trends)
  const statsQuery = useQuery<EnhancedStudyStats>({
    queryKey: ["/api/study/stats"],
  });

  // Schedule config
  interface ScheduleConfigResponse {
    hasCustomConfig: boolean;
    config: Array<{ dayOfWeek: number; tasks: string[] }>;
  }
  const scheduleConfigQuery = useQuery<ScheduleConfigResponse>({
    queryKey: ["/api/study/schedule/config"],
  });

  // ==================== MUTATIONS ====================

  // Toggle schedule task completion
  const toggleScheduleMutation = useMutation({
    mutationFn: async ({
      date,
      taskType,
      linkedItemId,
      linkedItemType,
    }: {
      date: string;
      taskType: StudyTaskType;
      linkedItemId?: number;
      linkedItemType?: string;
    }) => {
      return apiRequest("/api/study/schedule/log", "POST", {
        date,
        taskType,
        linkedItemId,
        linkedItemType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/schedule/week"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/stats"] });
    },
  });

  // Book mutations
  const createBookMutation = useMutation({
    mutationFn: async (data: { title: string; abbreviation?: string }) => {
      return apiRequest("/api/study/books", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/books"] });
      toast({ title: "Book added" });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      return apiRequest(`/api/study/books/${bookId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/stats"] });
      toast({ title: "Book deleted" });
    },
  });

  // Chapter mutations
  const createChapterMutation = useMutation({
    mutationFn: async ({
      bookId,
      title,
    }: {
      bookId: number;
      title: string;
    }) => {
      return apiRequest(`/api/study/books/${bookId}/chapters`, "POST", {
        title,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/books"] });
      toast({ title: "Chapter added" });
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async (chapterId: number) => {
      return apiRequest(`/api/study/chapters/${chapterId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/stats"] });
      toast({ title: "Chapter deleted" });
    },
  });

  const toggleImagesMutation = useMutation({
    mutationFn: async (chapterId: number) => {
      return apiRequest(`/api/study/chapters/${chapterId}/images`, "PATCH");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/stats"] });
    },
  });

  const toggleCardsMutation = useMutation({
    mutationFn: async (chapterId: number) => {
      return apiRequest(`/api/study/chapters/${chapterId}/cards`, "PATCH");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/stats"] });
    },
  });

  // Paper mutations
  const createPaperMutation = useMutation({
    mutationFn: async (data: { title: string; url?: string }) => {
      return apiRequest("/api/study/papers", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/papers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/stats"] });
      toast({ title: "Paper added" });
    },
  });

  const togglePaperMutation = useMutation({
    mutationFn: async (paperId: number) => {
      return apiRequest(`/api/study/papers/${paperId}/toggle`, "PATCH");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/papers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/stats"] });
    },
  });

  const deletePaperMutation = useMutation({
    mutationFn: async (paperId: number) => {
      return apiRequest(`/api/study/papers/${paperId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/papers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/stats"] });
      toast({ title: "Paper deleted" });
    },
  });

  // MRI Lecture mutations
  const createLectureMutation = useMutation({
    mutationFn: async (data: { title: string; url?: string }) => {
      return apiRequest("/api/study/mri-lectures", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/mri-lectures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/stats"] });
      toast({ title: "Lecture added" });
    },
  });

  const toggleLectureMutation = useMutation({
    mutationFn: async (lectureId: number) => {
      return apiRequest(
        `/api/study/mri-lectures/${lectureId}/toggle`,
        "PATCH"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/mri-lectures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/stats"] });
    },
  });

  const deleteLectureMutation = useMutation({
    mutationFn: async (lectureId: number) => {
      return apiRequest(`/api/study/mri-lectures/${lectureId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/mri-lectures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/stats"] });
      toast({ title: "Lecture deleted" });
    },
  });

  // Schedule config mutations
  const saveScheduleConfigMutation = useMutation({
    mutationFn: async (config: Array<{ dayOfWeek: number; tasks: string[] }>) => {
      return apiRequest("/api/study/schedule/config", "POST", { config });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/schedule/config"] });
      toast({ title: "Schedule saved" });
    },
  });

  const resetScheduleConfigMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/study/schedule/config/reset", "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/schedule/config"] });
      toast({ title: "Schedule reset to defaults" });
    },
  });

  // Reset week mutation (clear all logs for a week)
  const resetWeekMutation = useMutation({
    mutationFn: async ({ weekStart, weekEnd }: { weekStart: string; weekEnd: string }) => {
      return apiRequest("/api/study/schedule/reset-week", "POST", { weekStart, weekEnd });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/schedule/week"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/stats"] });
      toast({ title: "Week reset successfully" });
    },
  });

  // ==================== HELPERS ====================

  // Check if a task is completed for a given date
  const isTaskCompleted = (date: string, taskType: StudyTaskType): boolean => {
    if (!weekQuery.data?.logs) return false;
    return weekQuery.data.logs.some(
      (log) => log.date === date && log.taskType === taskType && log.completed
    );
  };

  // ==================== RETURN ====================

  return {
    // Week data
    currentWeekStart,
    weekDateParam,

    // Query data
    weekData: weekQuery.data,
    books: booksQuery.data ?? [],
    papers: papersQuery.data ?? [],
    lectures: lecturesQuery.data ?? [],
    stats: statsQuery.data,
    scheduleConfig: scheduleConfigQuery.data,

    // Loading states
    isLoading: {
      week: weekQuery.isLoading,
      books: booksQuery.isLoading,
      papers: papersQuery.isLoading,
      lectures: lecturesQuery.isLoading,
      stats: statsQuery.isLoading,
      scheduleConfig: scheduleConfigQuery.isLoading,
    },

    // Mutations
    toggleSchedule: toggleScheduleMutation.mutate,
    createBook: createBookMutation.mutate,
    deleteBook: deleteBookMutation.mutate,
    createChapter: createChapterMutation.mutate,
    deleteChapter: deleteChapterMutation.mutate,
    toggleImages: toggleImagesMutation.mutate,
    toggleCards: toggleCardsMutation.mutate,
    createPaper: createPaperMutation.mutate,
    togglePaper: togglePaperMutation.mutate,
    deletePaper: deletePaperMutation.mutate,
    createLecture: createLectureMutation.mutate,
    toggleLecture: toggleLectureMutation.mutate,
    deleteLecture: deleteLectureMutation.mutate,
    saveScheduleConfig: saveScheduleConfigMutation.mutate,
    resetScheduleConfig: resetScheduleConfigMutation.mutate,
    resetWeek: resetWeekMutation.mutate,

    // Mutation states (for disabling buttons, etc.)
    isPending: {
      toggleSchedule: toggleScheduleMutation.isPending,
      createBook: createBookMutation.isPending,
      deleteBook: deleteBookMutation.isPending,
      createChapter: createChapterMutation.isPending,
      deleteChapter: deleteChapterMutation.isPending,
      toggleImages: toggleImagesMutation.isPending,
      toggleCards: toggleCardsMutation.isPending,
      createPaper: createPaperMutation.isPending,
      togglePaper: togglePaperMutation.isPending,
      deletePaper: deletePaperMutation.isPending,
      createLecture: createLectureMutation.isPending,
      toggleLecture: toggleLectureMutation.isPending,
      deleteLecture: deleteLectureMutation.isPending,
      saveScheduleConfig: saveScheduleConfigMutation.isPending,
      resetScheduleConfig: resetScheduleConfigMutation.isPending,
      resetWeek: resetWeekMutation.isPending,
    },

    // Helpers
    isTaskCompleted,
  };
}
