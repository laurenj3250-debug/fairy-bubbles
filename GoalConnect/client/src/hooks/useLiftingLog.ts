/**
 * useLiftingLog Hook
 * Manages lifting data - exercises, workouts, sets, PRs
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface LiftingExercise {
  id: number;
  userId: number;
  name: string;
  category: string;
  equipment: string;
  primaryMuscle: string | null;
  isCustom: boolean;
  createdAt: string;
}

export interface LiftingSet {
  id: number;
  userId: number;
  exerciseId: number;
  workoutDate: string;
  setNumber: number;
  reps: number;
  weightLbs: string;
  rpe: number | null;
  isPR: boolean;
  notes: string | null;
  createdAt: string;
  exercise?: LiftingExercise;
  exerciseName?: string;
}

export interface LiftingWorkout {
  id: number;
  userId: number;
  workoutDate: string;
  name: string | null;
  durationMinutes: number | null;
  totalVolume: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  sets?: LiftingSet[];
}

export interface LiftingStats {
  ytdWorkouts: number;
  thisMonthWorkouts: number;
  ytdVolume: number;
  thisMonthVolume: number;
  prs: Array<{
    exerciseId: number;
    exerciseName: string;
    weight: number;
  }>;
  recentPRs: Array<LiftingSet & { exerciseName: string }>;
}

export function useLiftingLog() {
  const queryClient = useQueryClient();

  // Fetch exercises
  const {
    data: exercisesData,
    isLoading: isLoadingExercises,
  } = useQuery<{ exercises: LiftingExercise[] }>({
    queryKey: ["/api/lifting/exercises"],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch recent workouts
  const {
    data: workoutsData,
    isLoading: isLoadingWorkouts,
  } = useQuery<{ workouts: LiftingWorkout[] }>({
    queryKey: ["/api/lifting/workouts", { limit: 10 }],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch stats
  const {
    data: statsData,
    isLoading: isLoadingStats,
  } = useQuery<LiftingStats>({
    queryKey: ["/api/lifting/stats"],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Seed default exercises
  const seedExercisesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/lifting/exercises/seed", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to seed exercises");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lifting/exercises"] });
    },
  });

  // Add exercise
  const addExerciseMutation = useMutation({
    mutationFn: async (exercise: { name: string; category: string; equipment: string; primaryMuscle?: string }) => {
      const response = await fetch("/api/lifting/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(exercise),
      });
      if (!response.ok) throw new Error("Failed to add exercise");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lifting/exercises"] });
    },
  });

  // Create/update workout
  const saveWorkoutMutation = useMutation({
    mutationFn: async (workout: { workoutDate: string; name?: string; durationMinutes?: number; notes?: string }) => {
      const response = await fetch("/api/lifting/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(workout),
      });
      if (!response.ok) throw new Error("Failed to save workout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lifting/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lifting/stats"] });
    },
  });

  // Log a set
  const logSetMutation = useMutation({
    mutationFn: async (set: { exerciseId: number; workoutDate: string; setNumber: number; reps: number; weightLbs: number; rpe?: number; notes?: string }) => {
      const response = await fetch("/api/lifting/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(set),
      });
      if (!response.ok) throw new Error("Failed to log set");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lifting/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lifting/stats"] });
    },
  });

  // Delete a set
  const deleteSetMutation = useMutation({
    mutationFn: async (setId: number) => {
      const response = await fetch(`/api/lifting/sets/${setId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete set");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lifting/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lifting/stats"] });
    },
  });

  const exercises = exercisesData?.exercises || [];
  const workouts = workoutsData?.workouts || [];
  const stats = statsData || null;

  return {
    // Data
    exercises,
    workouts,
    stats,

    // Loading states
    isLoading: isLoadingExercises || isLoadingWorkouts || isLoadingStats,
    isLoadingExercises,
    isLoadingWorkouts,
    isLoadingStats,

    // Mutations
    seedExercises: seedExercisesMutation.mutate,
    addExercise: addExerciseMutation.mutate,
    saveWorkout: saveWorkoutMutation.mutate,
    logSet: logSetMutation.mutate,
    deleteSet: deleteSetMutation.mutate,

    // Mutation states
    isSeedingExercises: seedExercisesMutation.isPending,
    isAddingExercise: addExerciseMutation.isPending,
    isSavingWorkout: saveWorkoutMutation.isPending,
    isLoggingSet: logSetMutation.isPending,
    isDeletingSet: deleteSetMutation.isPending,
  };
}
