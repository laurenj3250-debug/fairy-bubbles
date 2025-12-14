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
import { ForestBackground } from "@/components/ForestBackground";
import { Link } from "wouter";
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
      // Invalidate all habit-related queries for consistency across components
      queryClient.invalidateQueries({ queryKey: [`/api/habit-logs/${today}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs", today] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/all"] });
      queryClient.invalidateQueries({ predicate: (query) =>
        typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/api/habit-logs/range/')
      });
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
    <div className="min-h-screen relative">
      {/* Forest background */}
      <ForestBackground />

      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-[160px] z-20 flex flex-col justify-center pl-6">
        <div className="space-y-4">
          <Link href="/">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              dashboard
            </span>
          </Link>
          <Link href="/habits">
            <span className="block text-peach-400 text-sm font-heading cursor-pointer">
              habits
            </span>
          </Link>
          <Link href="/goals">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              goals
            </span>
          </Link>
          <Link href="/todos">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              todos
            </span>
          </Link>
          <Link href="/study">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              study
            </span>
          </Link>
          <Link href="/journey">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              journey
            </span>
          </Link>
          <Link href="/settings">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              settings
            </span>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 px-5 md:px-8 pb-24 pt-8">
        <div className="max-w-[900px] ml-[188px] space-y-5">

          {/* Header */}
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="logo-text tracking-wider text-2xl">HABITS</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {completedToday}/{totalHabits} completed today
                {overallStreak > 0 && (
                  <span className="ml-3 inline-flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-peach-400">{overallStreak}</span> day streak
                  </span>
                )}
              </p>
            </div>

            <Button
              onClick={() => {
                setEditingHabit(undefined);
                setHabitDialogOpen(true);
              }}
              className="rounded-full px-5 py-2 bg-peach-400 hover:bg-peach-500 text-white transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Habit
            </Button>
          </header>

          {/* Contribution Graph */}
          {habits.length > 0 && contributionData.length > 0 && (
            <div className="glass-card frost-accent p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="card-title">Activity Overview</span>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--text-muted)]">Log for date:</label>
                  <input
                    type="date"
                    max={today}
                    value={backfillDate || ""}
                    onChange={(e) => setBackfillDate(e.target.value || null)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-peach-400/50"
                  />
                </div>
              </div>
              <HabitContributionGraph
                history={contributionData}
                weeks={12}
                title=""
                showMonthLabels={true}
                onDayClick={(date) => setBackfillDate(date)}
                selectedDate={backfillDate}
              />
              <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
                Click any day or use the date picker above to mark habits
              </p>
            </div>
          )}

          {/* Habits List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-white/20 border-t-peach-400 rounded-full animate-spin" />
            </div>
          ) : habits.length === 0 ? (
            <div className="glass-card frost-accent p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-xl font-semibold text-white mb-2">No habits yet</h2>
              <p className="text-[var(--text-muted)] mb-6">
                Start building better habits today
              </p>
              <Button
                onClick={() => {
                  setEditingHabit(undefined);
                  setHabitDialogOpen(true);
                }}
                className="rounded-full px-6 py-3 bg-peach-400 hover:bg-peach-500 text-white"
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
