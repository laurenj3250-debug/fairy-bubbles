import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { HabitCard } from "@/components/HabitCard";
import { HabitCreateDialog } from "@/components/HabitCreateDialog";
import { Plus, Flame } from "lucide-react";
import { getToday } from "@/lib/utils";

interface HabitWithData extends Habit {
  streak: { streak: number };
  weeklyCompletion: number;
  history: Array<{ date: string; completed: boolean }>;
}

export default function Habits() {
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const today = getToday();

  // Fetch habits with data
  const { data: habits = [], isLoading } = useQuery<HabitWithData[]>({
    queryKey: ["/api/habits-with-data"],
  });

  // Fetch today's logs
  const { data: todayLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", today],
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

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this habit? This cannot be undone.")) {
      deleteMutation.mutate(id);
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
                onDelete={() => handleDelete(habit.id)}
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
    </div>
  );
}
