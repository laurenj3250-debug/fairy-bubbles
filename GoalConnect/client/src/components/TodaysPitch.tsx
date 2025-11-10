import { useQuery, useMutation } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2 } from "lucide-react";
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

  const handleToggle = (habitId: number) => {
    toggleHabitMutation.mutate({ habitId });
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

  return (
    <div className={cn("bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern mountain-card-depth", className)}>
      {/* Header */}
      <div className="mb-6 relative z-10">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          Today's Pitch
          <span className="text-lg font-normal text-muted-foreground">
            ({completedHabits}/{totalHabits})
          </span>
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          1-tap to log your training
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

        {totalHabits === 0 && (
          <div className="text-center py-12 relative z-10">
            <p className="text-muted-foreground">
              No habits scheduled for today.
              <br />
              Create one to start your training!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
