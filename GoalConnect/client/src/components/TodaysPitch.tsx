import { useQuery, useMutation } from "@tanstack/react-query";
import type { Habit, HabitLog, Goal } from "@shared/schema";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TodaysPitchProps {
  className?: string;
}

interface HabitWithCompletion extends Habit {
  completed: boolean;
}

const CATEGORY_LABELS = {
  mind: "MIND",
  foundation: "FOUNDATION",
  adventure: "ADVENTURE",
  training: "TRAINING",
} as const;

const CATEGORY_COLORS = {
  mind: "bg-muted/20 border-border/50",
  foundation: "bg-muted/20 border-border/50",
  adventure: "bg-muted/20 border-border/50",
  training: "bg-muted/20 border-border/50",
} as const;

function getEffortIcon(effort: string): string {
  switch (effort) {
    case "heavy":
      return "⚫"; // dark filled circle
    case "medium":
      return "●"; // medium filled circle
    case "light":
      return "○"; // light outlined circle
    default:
      return "●";
  }
}

export function TodaysPitch({ className }: TodaysPitchProps) {
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];

  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: todayLogs = [], isLoading: logsLoading } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", today],
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId }: { habitId: number }) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", {
        habitId,
        date: today,
      });
    },
    onMutate: async ({ habitId }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/habit-logs", today] });
      const previousLogs = queryClient.getQueryData<HabitLog[]>(["/api/habit-logs", today]);

      queryClient.setQueryData<HabitLog[]>(["/api/habit-logs", today], (old = []) => {
        const existingLog = old.find((log) => log.habitId === habitId);
        if (existingLog) {
          return old.map((log) =>
            log.habitId === habitId ? { ...log, completed: !log.completed } : log
          );
        } else {
          return [
            ...old,
            {
              id: Date.now(),
              habitId,
              userId: 1,
              date: today,
              completed: true,
              note: null,
            } as HabitLog,
          ];
        }
      });

      return { previousLogs };
    },
    onSuccess: (data: any) => {
      if (data.rewardDetails) {
        const { coinsEarned, habitTitle } = data.rewardDetails;
        toast({
          title: `+${coinsEarned} tokens! 💎`,
          description: `Completed "${habitTitle}"`,
          duration: 2000,
        });
      }
    },
    onError: (err, variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData(["/api/habit-logs", today], context.previousLogs);
      }
      toast({
        title: "Error",
        description: "Failed to update habit",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs", today] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
    },
  });

  const habitsWithCompletion = useMemo(() => {
    return habits.map((habit) => {
      const log = todayLogs.find((l) => l.habitId === habit.id);
      return { ...habit, completed: log?.completed || false };
    });
  }, [habits, todayLogs]);

  const groupedHabits = useMemo(() => {
    const groups: Record<string, HabitWithCompletion[]> = {
      mind: [],
      foundation: [],
      adventure: [],
      training: [],
    };

    habitsWithCompletion.forEach((habit) => {
      const category = habit.category || "training";

      // Filter Adventure habits: only show if scheduled for today
      if (category === "adventure") {
        if (habit.scheduledDay === today) {
          groups[category].push(habit);
        }
      } else {
        groups[category].push(habit);
      }
    });

    return groups;
  }, [habitsWithCompletion, today]);

  const incrementGoalMutation = useMutation({
    mutationFn: async ({ goalId }: { goalId: number }) => {
      return await apiRequest("/api/goal-updates", "POST", {
        goalId,
        value: 1,
        date: today,
      });
    },
    onSuccess: (data: any, variables) => {
      const goal = goals.find(g => g.id === variables.goalId);
      toast({
        title: `+1 ${goal?.unit || "progress"}! 🎯`,
        description: `Updated "${goal?.title}"`,
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update goal",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (habitId: number) => {
    toggleHabitMutation.mutate({ habitId });
  };

  const handleIncrementGoal = (event: React.MouseEvent, goalId: number) => {
    event.stopPropagation();
    incrementGoalMutation.mutate({ goalId });
  };

  if (habitsLoading || logsLoading) {
    return (
      <div className={cn("bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern", className)}>
        <div className="animate-pulse space-y-4 relative z-10">
          <div className="h-8 bg-muted/30 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/20 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalHabits = habitsWithCompletion.length;
  const completedHabits = habitsWithCompletion.filter((h) => h.completed).length;
  const totalGoals = goals.length;
  const totalItems = totalHabits + totalGoals;

  return (
    <div className={cn("bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern mountain-card-depth", className)}>
      {/* Header */}
      <div className="mb-6 relative z-10">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          Today's Pitch
          <span className="text-lg font-normal text-muted-foreground">
            ({totalHabits} habits, {totalGoals} routes)
          </span>
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          1-tap habits • +1 route progress
        </p>
      </div>

      {/* Habits grouped by category */}
      <div className="space-y-6 relative z-10">
        {Object.entries(groupedHabits).map(([category, categoryHabits]) => {
          if (categoryHabits.length === 0) return null;

          const categoryKey = category as keyof typeof CATEGORY_LABELS;
          const categoryColor = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.training;

          return (
            <div key={category}>
              {/* Category header */}
              <div className="mb-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {CATEGORY_LABELS[categoryKey]}
                </h3>
              </div>

              {/* Category habits */}
              <div className="space-y-2">
                {categoryHabits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => handleToggle(habit.id)}
                    className={cn(
                      "habit-row relative cursor-pointer transition-all duration-200",
                      "rounded-xl p-3 border",
                      categoryColor,
                      "ice-crystal-border",
                      "hover:scale-[1.01] active:scale-[0.99]",
                      habit.completed && "bg-[hsl(var(--accent))]/10 border-[hsl(var(--accent))]/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-transform group-hover:scale-110"
                        style={{ background: habit.color }}
                      >
                        {habit.icon}
                      </div>

                      {/* Habit info */}
                      <div className="flex-1">
                        <div className="text-foreground font-medium text-sm">
                          {habit.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {CATEGORY_LABELS[categoryKey]}
                        </div>
                      </div>

                      {/* Grade + Effort */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-bold text-foreground bg-muted/30 px-2 py-1 rounded">
                          {habit.grade || "5.9"}
                        </span>
                        <span className="text-base text-foreground" title={`${habit.effort || "medium"} effort`}>
                          {getEffortIcon(habit.effort || "medium")}
                        </span>
                      </div>

                      {/* Checkbox */}
                      <button
                        className={cn(
                          "w-10 h-10 rounded-lg border-2 transition-all font-bold text-lg hover:scale-110 active:scale-95",
                          habit.completed
                            ? "bg-[hsl(var(--accent))]/30 border-[hsl(var(--accent))] text-[hsl(var(--accent))]"
                            : "border-muted-foreground/30 hover:border-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/10 text-muted-foreground"
                        )}
                      >
                        {habit.completed ? "✓" : "○"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Goals Section */}
        {goals.length > 0 && (
          <div>
            <div className="mb-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                ROUTES (Goals)
              </h3>
            </div>
            <div className="space-y-2">
              {goals.map((goal) => {
                const percentage = Math.round((goal.currentValue / goal.targetValue) * 100);
                return (
                  <div
                    key={goal.id}
                    className={cn(
                      "relative cursor-pointer transition-all duration-200",
                      "rounded-xl p-3 border bg-muted/20 border-border/50",
                      "ice-crystal-border",
                      "hover:scale-[1.01] active:scale-[0.99]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Category icon */}
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-primary/20">
                        🎯
                      </div>

                      {/* Goal info */}
                      <div className="flex-1">
                        <div className="text-foreground font-medium text-sm">
                          {goal.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {goal.currentValue} / {goal.targetValue} {goal.unit} • {percentage}%
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="flex-shrink-0 w-24">
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-[hsl(var(--accent))] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* +1 Button */}
                      <button
                        onClick={(e) => handleIncrementGoal(e, goal.id)}
                        disabled={incrementGoalMutation.isPending}
                        className={cn(
                          "w-10 h-10 rounded-lg border-2 transition-all font-bold text-lg hover:scale-110 active:scale-95",
                          "border-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))]",
                          incrementGoalMutation.isPending && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        +1
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalItems === 0 && (
          <div className="text-center py-12 relative z-10">
            <p className="text-muted-foreground">
              No habits or routes yet.
              <br />
              Create one to start your training!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
