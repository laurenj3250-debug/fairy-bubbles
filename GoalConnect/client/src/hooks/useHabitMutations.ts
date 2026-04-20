import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Habit, HabitLog, InsertHabit } from "@shared/schema";

/**
 * Unified mutations hook for the habits surface.
 *
 * Single source of truth for: toggle/log, create, update, delete, archive.
 * Wraps each call with:
 *   - Optimistic week-cache update on toggle (instant visual feedback)
 *   - Automatic rollback on error
 *   - Lauren-voice destructive toasts when something fails
 *   - Cache invalidations so other surfaces (dashboard tiles, points,
 *     insights) catch up after every write
 *
 * NOTE (archive): the server does not yet expose a dedicated
 * `/api/habits/:id/archive` endpoint, and the `habits` table does not yet
 * carry an `archived` column. Per the Batch A plan, archive is wired to the
 * existing PATCH `/api/habits/:id` with body `{ archived: true }` so the UI
 * has a working target; the column/endpoint work is tracked separately.
 */

export interface ToggleInput {
  habitId: number;
  date: string; // YYYY-MM-DD, client-local
  localHour: number; // 0-23, client-local
  note?: string;
  mood?: number;
  energy?: number;
  quantityCompleted?: number;
  durationMinutes?: number;
  sessionType?: string;
  /** If omitted, server toggles completed true <-> false. If set, increments. */
  incrementValue?: number;
}

export interface ToggleResponse extends HabitLog {
  warnings?: string[];
}

export interface WeekHabit extends Habit {
  logs: Array<HabitLog | null>;
}

export interface WeekResponse {
  weekStart: string;
  weekDates: string[];
  habits: WeekHabit[];
}

interface ToggleContext {
  previous: WeekResponse | undefined;
}

const WEEK_KEY = ["/api/habits/week"] as const;
const HABITS_KEY = ["/api/habits"] as const;
const POINTS_KEY = ["/api/points"] as const;

/**
 * Pure helper — applies an optimistic toggle to a cached week response.
 *
 * Finds the habit by id and the target cell by `weekDates.indexOf(input.date)`.
 * If the existing log is complete, clears the cell (sets to null); otherwise
 * writes a synthetic completed log built from the input. Returns the original
 * shape unchanged if the habit or date is not in the window.
 *
 * Exported for unit tests.
 */
export function optimisticToggle(
  old: WeekResponse | undefined,
  input: ToggleInput,
): WeekResponse | undefined {
  if (!old) return old;
  const dateIdx = old.weekDates.indexOf(input.date);
  if (dateIdx === -1) return old;

  return {
    ...old,
    habits: old.habits.map((habit) => {
      if (habit.id !== input.habitId) return habit;

      const nextLogs = habit.logs.slice();
      const existing = nextLogs[dateIdx];
      const wasComplete = existing?.completed === true;

      if (wasComplete) {
        nextLogs[dateIdx] = null;
      } else {
        nextLogs[dateIdx] = buildSyntheticLog(habit, input, existing);
      }

      return { ...habit, logs: nextLogs };
    }),
  };
}

function buildSyntheticLog(
  habit: WeekHabit,
  input: ToggleInput,
  existing: HabitLog | null | undefined,
): HabitLog {
  // Keep the shape stable; unknown fields carry over from the existing log
  // (or sensible defaults) so consumers that destructure never blow up.
  const base: HabitLog = existing ?? {
    id: -1, // synthetic — server replaces on settle
    habitId: input.habitId,
    userId: habit.userId,
    date: input.date,
    completed: false,
    note: null,
    mood: null,
    energyLevel: null,
    durationMinutes: null,
    quantityCompleted: null,
    sessionType: null,
    incrementValue: 1,
    autoCompleteSource: null,
    linkedWorkoutId: null,
    linkedSessionId: null,
  };

  return {
    ...base,
    completed: true,
    note: input.note ?? base.note ?? null,
    mood: input.mood ?? base.mood ?? null,
    energyLevel: input.energy ?? base.energyLevel ?? null,
    durationMinutes: input.durationMinutes ?? base.durationMinutes ?? null,
    quantityCompleted: input.quantityCompleted ?? base.quantityCompleted ?? null,
    sessionType: input.sessionType ?? base.sessionType ?? null,
    incrementValue: input.incrementValue ?? base.incrementValue ?? 1,
  };
}

export function useHabitMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateHabitQueries = () => {
    queryClient.invalidateQueries({ queryKey: WEEK_KEY });
    queryClient.invalidateQueries({ queryKey: HABITS_KEY }); // legacy — remove in T17
    queryClient.invalidateQueries({ queryKey: POINTS_KEY });
  };

  const toggle = useMutation<ToggleResponse, Error, ToggleInput, ToggleContext>({
    mutationFn: (input) =>
      apiRequest("/api/habit-logs/toggle", "POST", input) as Promise<ToggleResponse>,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: WEEK_KEY });
      const previous = queryClient.getQueryData<WeekResponse>(WEEK_KEY);
      queryClient.setQueryData<WeekResponse | undefined>(WEEK_KEY, (old) =>
        optimisticToggle(old, input),
      );
      return { previous };
    },
    onError: (err, _input, ctx) => {
      if (ctx && ctx.previous !== undefined) {
        queryClient.setQueryData(WEEK_KEY, ctx.previous);
      }
      toast({
        title: "Couldn't save that",
        description: err.message || "Give it another tap.",
        variant: "destructive",
      });
    },
    onSuccess: (response) => {
      // T8 wiring — surface non-fatal server warnings as toasts.
      if (response && Array.isArray(response.warnings)) {
        response.warnings.forEach((w) => {
          toast({
            title: "Saved with a hiccup",
            description: w,
          });
        });
      }
    },
    onSettled: invalidateHabitQueries,
  });

  const create = useMutation<Habit, Error, InsertHabit>({
    mutationFn: (input) => apiRequest("/api/habits", "POST", input) as Promise<Habit>,
    onError: (err) => {
      toast({
        title: "Couldn't add that habit",
        description: err.message || "Give it another try.",
        variant: "destructive",
      });
    },
    onSettled: invalidateHabitQueries,
  });

  const update = useMutation<
    Habit,
    Error,
    { id: number; patch: Partial<Habit> }
  >({
    mutationFn: ({ id, patch }) =>
      apiRequest("/api/habits/" + id, "PATCH", patch) as Promise<Habit>,
    onError: (err) => {
      toast({
        title: "Couldn't save those changes",
        description: err.message || "Give it another try.",
        variant: "destructive",
      });
    },
    onSettled: invalidateHabitQueries,
  });

  const del = useMutation<void, Error, number>({
    mutationFn: (id) =>
      apiRequest("/api/habits/" + id, "DELETE") as Promise<void>,
    onError: (err) => {
      toast({
        title: "Couldn't delete that habit",
        description: err.message || "Give it another try.",
        variant: "destructive",
      });
    },
    onSettled: invalidateHabitQueries,
  });

  const archive = useMutation<Habit, Error, number>({
    // No /archive endpoint exists yet — fall back to the update path with
    // an `archived: true` flag. Cast is intentional (see note at top of file).
    mutationFn: (id) =>
      apiRequest(
        "/api/habits/" + id,
        "PATCH",
        { archived: true } as Partial<Habit>,
      ) as Promise<Habit>,
    onError: (err) => {
      toast({
        title: "Couldn't archive that habit",
        description: err.message || "Give it another try.",
        variant: "destructive",
      });
    },
    onSettled: invalidateHabitQueries,
  });

  return { toggle, create, update, delete: del, archive };
}
