import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Habit, HabitLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { HabitCard } from "@/components/HabitCard";
import { HabitCreateDialog } from "@/components/HabitCreateDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Plus, Flame, BarChart3 } from "lucide-react";
import { getToday } from "@/lib/utils";
import { HabitContributionGraph } from "@/components/HabitContributionGraph";
import { SundownPageWrapper } from "@/components/sundown/SundownPageWrapper";
import { Link } from "wouter";

interface HabitWithData extends Habit {
  streak: { streak: number };
  weeklyCompletion: number;
  history: Array<{ date: string; completed: boolean }>;
}

export default function Habits() {
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [deletingHabit, setDeletingHabit] = useState<HabitWithData | null>(null);
  const today = getToday();
  const { toast } = useToast();

  // Fetch habits with data
  const { data: habitsRaw = [], isLoading } = useQuery<HabitWithData[]>({
    queryKey: ["/api/habits-with-data"],
  });

  // Sort habits by ID for stable ordering (prevents visual rearranging on toggle)
  const habits = useMemo(() =>
    [...habitsRaw].sort((a, b) => a.id - b.id),
    [habitsRaw]
  );

  // Fetch today's logs
  const { data: todayLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", today],
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/habit-logs/${today}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/habit-logs", today] });
    queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/all"] });
    queryClient.invalidateQueries({ predicate: (query) =>
      typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/api/habit-logs/range/')
    });
    queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
  };

  // Toggle habit completion for today (from big Check button)
  const toggleMutation = useMutation({
    mutationFn: (habitId: number) =>
      apiRequest("/api/habit-logs/toggle", "POST", { habitId, date: today }),
    onSuccess: invalidateAll,
    onError: () => toast({ title: "Couldn't save that", description: "Give it another tap.", variant: "destructive" }),
  });

  // Toggle habit for any date (from heatmap cell tap — replaces old backfill dialog)
  const toggleForDateMutation = useMutation({
    mutationFn: ({ habitId, date }: { habitId: number; date: string }) =>
      apiRequest("/api/habit-logs/toggle", "POST", { habitId, date }),
    onSuccess: invalidateAll,
    onError: () => toast({ title: "Couldn't save that", description: "Give it another tap.", variant: "destructive" }),
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
    <SundownPageWrapper title="Habits" subtitle={`${completedToday}/${totalHabits} completed today`}>
      <div className="px-5 md:px-8 pb-24">
        <div className="max-w-[900px] mx-auto space-y-5">

          {/* Header extras */}
          <header className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-[var(--sd-text-muted)] mt-1">
                {overallStreak > 0 && (
                  <span className="ml-3 inline-flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-[var(--sd-text-accent)]">{overallStreak}</span> day streak
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/habit-insights">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-3 py-2 text-[var(--text-muted)] hover:text-[var(--sd-text-accent)] transition-all"
                >
                  <BarChart3 className="w-4 h-4 mr-1.5" />
                  Insights
                </Button>
              </Link>
              <Button
                onClick={() => {
                  setEditingHabit(undefined);
                  setHabitDialogOpen(true);
                }}
                className="rounded-full px-5 py-2 bg-[rgba(225,164,92,0.8)] hover:bg-[rgba(200,131,73,0.9)] text-[var(--sd-text-primary)] transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Habit
              </Button>
            </div>
          </header>

          {/* Activity Overview — desktop inline, mobile collapsed */}
          {habits.length > 0 && contributionData.length > 0 && (
            <>
              <div className="sd-shell p-4 hidden md:block">
                <div className="mb-2">
                  <span className="card-title">Activity Overview</span>
                </div>
                <HabitContributionGraph
                  history={contributionData}
                  weeks={12}
                  title=""
                  showMonthLabels={true}
                />
              </div>
              <details className="sd-shell p-4 md:hidden">
                <summary className="card-title cursor-pointer select-none">
                  Activity overview (90 days)
                </summary>
                <div className="mt-3">
                  <HabitContributionGraph
                    history={contributionData}
                    weeks={12}
                    title=""
                    showMonthLabels={true}
                  />
                </div>
              </details>
            </>
          )}

          {/* Habits List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-white/20 border-t-peach-400 rounded-full animate-spin" />
            </div>
          ) : habits.length === 0 ? (
            <div className="sd-shell p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-xl font-semibold text-[var(--sd-text-primary)] mb-2">Nothing to track yet</h2>
              <p className="text-[var(--text-muted)] mb-6">
                Pick one thing — small — you'd like to do most days.
              </p>
              <Button
                onClick={() => {
                  setEditingHabit(undefined);
                  setHabitDialogOpen(true);
                }}
                className="rounded-full px-6 py-3 bg-[rgba(225,164,92,0.8)] hover:bg-[rgba(200,131,73,0.9)] text-[var(--sd-text-primary)]"
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
                  onDayClick={(date) => toggleForDateMutation.mutate({ habitId: habit.id, date })}
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

    </SundownPageWrapper>
  );
}
