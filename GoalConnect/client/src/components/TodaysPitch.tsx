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
  mind: "from-purple-500/30 to-indigo-500/30 border-purple-400/40",
  foundation: "from-orange-500/30 to-amber-500/30 border-orange-400/40",
  adventure: "from-green-500/30 to-emerald-500/30 border-green-400/40",
  training: "from-blue-500/30 to-cyan-500/30 border-blue-400/40",
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
      groups[category].push(habit);
    });

    return groups;
  }, [habitsWithCompletion]);

  const handleToggle = (habitId: number) => {
    toggleHabitMutation.mutate({ habitId });
  };

  if (habitsLoading || logsLoading) {
    return (
      <div className={cn("glass-card rounded-3xl p-8", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalHabits = habitsWithCompletion.length;
  const completedHabits = habitsWithCompletion.filter((h) => h.completed).length;

  return (
    <div className={cn("glass-card rounded-3xl p-8 alpine-glow", className)}>
      {/* Header */}
      <div className="mb-6">
        <h2
          className="text-2xl font-bold text-white flex items-center gap-3"
          style={{
            fontFamily: "'Comfortaa', cursive",
            textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
          }}
        >
          Today's Pitch
          <span className="text-lg font-normal text-white/80">
            ({completedHabits}/{totalHabits})
          </span>
        </h2>
        <p className="text-white/70 text-sm mt-1" style={{ fontFamily: "'Quicksand', sans-serif" }}>
          1-tap to log your training
        </p>
      </div>

      {/* Habits grouped by category */}
      <div className="space-y-6">
        {Object.entries(groupedHabits).map(([category, categoryHabits]) => {
          if (categoryHabits.length === 0) return null;

          const categoryKey = category as keyof typeof CATEGORY_LABELS;
          const categoryColor = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.training;

          return (
            <div key={category}>
              {/* Category header */}
              <div className="mb-3">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">
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
                      "rounded-xl p-4 border-2",
                      "bg-gradient-to-r backdrop-blur-xl",
                      categoryColor,
                      "hover:scale-[1.02] active:scale-[0.98]",
                      habit.completed && "opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <div
                        className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          habit.completed
                            ? "bg-white border-white"
                            : "border-white/50 hover:border-white"
                        )}
                      >
                        {habit.completed && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>

                      {/* Habit info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{habit.icon}</span>
                          <span
                            className={cn(
                              "font-semibold text-white",
                              habit.completed && "line-through"
                            )}
                          >
                            {habit.title}
                          </span>
                        </div>
                        <div className="text-xs text-white/70 mt-0.5">
                          {CATEGORY_LABELS[categoryKey]}
                        </div>
                      </div>

                      {/* Grade + Effort */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-bold text-white/90 bg-white/10 px-2 py-1 rounded">
                          {habit.grade || "5.9"}
                        </span>
                        <span className="text-lg" title={`${habit.effort || "medium"} effort`}>
                          {getEffortIcon(habit.effort || "medium")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {totalHabits === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60" style={{ fontFamily: "'Quicksand', sans-serif" }}>
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
