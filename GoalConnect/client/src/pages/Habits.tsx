import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { HabitCard } from "@/components/HabitCard";
import { HabitCreateDialog } from "@/components/HabitCreateDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Plus, Flame, Check, X, Calendar } from "lucide-react";
import { getToday, cn } from "@/lib/utils";
import { HabitContributionGraph } from "@/components/HabitContributionGraph";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HabitWithData extends Habit {
  streak: { streak: number };
  weeklyCompletion: number;
  history: Array<{ date: string; completed: boolean }>;
}

export default function Habits() {
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [deletingHabit, setDeletingHabit] = useState<HabitWithData | null>(null);
  const [backfillDate, setBackfillDate] = useState<string | null>(null);
  const today = getToday();

  // Fetch habits with data
  const { data: habits = [], isLoading } = useQuery<HabitWithData[]>({
    queryKey: ["/api/habits-with-data"],
  });

  // Fetch today's logs
  const { data: todayLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", today],
  });

  // Fetch logs for backfill date (when dialog is open)
  const { data: backfillLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", backfillDate],
    enabled: !!backfillDate,
  });

  // Toggle habit completion
  const toggleMutation = useMutation({
    mutationFn: async (habitId: number) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", {
        habitId,
        date: today,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs", today] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
    },
  });

  // Toggle habit for a specific date (backfill)
  const backfillMutation = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: number; date: string }) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", {
        habitId,
        date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs", backfillDate] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
    },
  });

  // Delete habit
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/habits/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
    },
  });

  const isCompletedToday = (habitId: number) => {
    return todayLogs.some(log => log.habitId === habitId && log.completed);
  };

  const isCompletedOnDate = (habitId: number, logs: HabitLog[]) => {
    return logs.some(log => log.habitId === habitId && log.completed);
  };

  // Format date for display
  const formatBackfillDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitDialogOpen(true);
  };

  const handleDelete = (habit: HabitWithData) => {
    setDeletingHabit(habit);
  };

  const confirmDelete = () => {
    if (deletingHabit) {
      deleteMutation.mutate(deletingHabit.id);
      setDeletingHabit(null);
    }
  };

  const handleCloseDialog = (open?: boolean) => {
    if (open === false || open === undefined) {
      setHabitDialogOpen(false);
      setEditingHabit(undefined);
    }
  };

  // Calculate overall stats
  const completedToday = habits.filter(h => isCompletedToday(h.id)).length;
  const totalHabits = habits.length;
  const overallStreak = habits.length > 0
    ? Math.min(...habits.map(h => h.streak?.streak || 0))
    : 0;

  // Aggregate all habit histories into combined contribution data
  const contributionData = useMemo(() => {
    if (habits.length === 0) return [];

    // Create a map of date -> count of completed habits
    const dateCountMap = new Map<string, number>();

    habits.forEach((habit) => {
      habit.history?.forEach((entry) => {
        if (entry.completed) {
          dateCountMap.set(entry.date, (dateCountMap.get(entry.date) || 0) + 1);
        } else if (!dateCountMap.has(entry.date)) {
          dateCountMap.set(entry.date, 0);
        }
      });
    });

    // Convert to array format expected by HabitContributionGraph
    return Array.from(dateCountMap.entries()).map(([date, count]) => ({
      date,
      completed: count > 0,
      count,
    }));
  }, [habits]);

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-6 mb-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle at top left, hsl(var(--primary) / 0.3), transparent 60%)`
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-3xl font-bold mb-2"
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Habits
                </h1>
                <p className="text-sm text-foreground/60">
                  {completedToday}/{totalHabits} completed today
                </p>
              </div>

              <Button
                onClick={() => {
                  setEditingHabit(undefined);
                  setHabitDialogOpen(true);
                }}
                className="rounded-full px-6 py-3 shadow-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  color: 'white'
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Habit
              </Button>
            </div>

            {/* Overall Streak */}
            {overallStreak > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-foreground/70">
                  Perfect streak: <span className="font-bold text-foreground">{overallStreak} days</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Contribution Graph - Interactive! Click to backfill */}
        {habits.length > 0 && contributionData.length > 0 && (
          <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-2xl p-4 mb-6">
            <HabitContributionGraph
              history={contributionData}
              weeks={12}
              title="Activity Overview"
              showMonthLabels={true}
              onDayClick={(date) => setBackfillDate(date)}
              selectedDate={backfillDate}
            />
            <p className="text-xs text-foreground/40 mt-2 text-center">
              Click any day to mark habits you missed
            </p>
          </div>
        )}

        {/* Habits List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-border border-t-foreground rounded-full animate-spin" />
          </div>
        ) : habits.length === 0 ? (
          <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No habits yet</h2>
            <p className="text-foreground/60 mb-6">
              Start building better habits today
            </p>
            <Button
              onClick={() => {
                setEditingHabit(undefined);
                setHabitDialogOpen(true);
              }}
              className="rounded-full px-6 py-3"
              style={{
                background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                color: 'white'
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Habit
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isCompletedToday={isCompletedToday(habit.id)}
                onToggle={() => toggleMutation.mutate(habit.id)}
                onEdit={() => handleEdit(habit)}
                onDelete={() => handleDelete(habit)}
                isToggling={toggleMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <HabitCreateDialog
        open={habitDialogOpen}
        onOpenChange={handleCloseDialog}
        editHabit={editingHabit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deletingHabit}
        onOpenChange={(open) => !open && setDeletingHabit(null)}
        onConfirm={confirmDelete}
        title="Delete Habit"
        itemName={deletingHabit?.title || ""}
        streak={deletingHabit?.streak?.streak}
        logCount={deletingHabit?.history?.length}
        itemType="habit"
      />

      {/* Backfill Dialog - Mark habits for past days */}
      <Dialog open={!!backfillDate} onOpenChange={(open) => !open && setBackfillDate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {backfillDate && formatBackfillDate(backfillDate)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto py-2">
            {habits.map((habit) => {
              const isCompleted = isCompletedOnDate(habit.id, backfillLogs);
              const isToggling = backfillMutation.isPending;

              return (
                <button
                  key={habit.id}
                  onClick={() => {
                    if (backfillDate && !isToggling) {
                      backfillMutation.mutate({ habitId: habit.id, date: backfillDate });
                    }
                  }}
                  disabled={isToggling}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                    "border border-foreground/10 hover:border-foreground/20",
                    isCompleted
                      ? "bg-primary/10 border-primary/30"
                      : "bg-foreground/5 hover:bg-foreground/10",
                    isToggling && "opacity-50 cursor-wait"
                  )}
                >
                  {/* Checkbox indicator */}
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-foreground/10"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-3 h-3 text-foreground/30" />
                    )}
                  </div>

                  {/* Habit info */}
                  <div className="flex-1 text-left">
                    <p className={cn(
                      "font-medium",
                      isCompleted ? "text-foreground" : "text-foreground/70"
                    )}>
                      {habit.title}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-foreground/10 text-foreground/50"
                  )}>
                    {isCompleted ? "Done" : "Missed"}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-foreground/50 text-center mt-2">
            Click a habit to toggle its completion for this day
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
