import { useQuery, useMutation } from "@tanstack/react-query";
import type { Habit, HabitLog, Goal } from "@shared/schema";
import { useState, useMemo, useEffect } from "react";
import { cn, getToday } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sparkles, Mountain, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface TodaysPitchProps {
  className?: string;
}

interface HabitWithCompletion extends Habit {
  completed: boolean;
}

const CATEGORY_LABELS = {
  mind: "ALPINE OBJECTIVES",
  foundation: "BASE CAMP",
  adventure: "EXPEDITION DAYS",
  training: "GYM SESSIONS",
} as const;

const CATEGORY_COLORS = {
  mind: "bg-blue-500/10 border-blue-400/40",           // Alpine blue/ice
  foundation: "bg-amber-600/10 border-amber-500/40",   // Earth tones/base camp
  adventure: "bg-orange-500/10 border-orange-400/40",  // Sunset orange/expedition
  training: "bg-slate-500/10 border-slate-400/40",     // Chalk gray/gym
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

function getProgressMessage(percentage: number, totalHabits: number): string {
  if (totalHabits === 0) return "No pitches scheduled today";
  if (percentage === 0) return "First pitch of the day—let's go!";
  if (percentage < 50) return "Building momentum...";
  if (percentage < 100) return "Almost to the summit!";
  return "Summit reached! 🏔️";
}

export function TodaysPitch({ className }: TodaysPitchProps) {
  const { toast } = useToast();
  const today = getToday();
  const [showSummitCelebration, setShowSummitCelebration] = useState(false);
  const [todayTokens, setTodayTokens] = useState(0);

  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: todayLogs = [], isLoading: logsLoading } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", today],
  });

  const { data: goals = [] } = useQuery<Goal[]>({
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
      // Update today's XP count
      const xpEarned = data.xpAwarded || 10;
      if (data.completed) {
        setTodayTokens((prev) => prev + xpEarned);  // TODO: Rename setTodayTokens to setTodayXp
      }

      // Build toast message
      let toastTitle = `+${xpEarned} XP earned!`;
      let toastDescription = "Training complete";

      // If route progress exists, show pitch information
      if (data.routeProgress) {
        const { routeName, pitch, totalPitches, percentage } = data.routeProgress;
        toastTitle = `⛰️ Pitch sent on route!`;
        toastDescription = `${routeName}: ${pitch}/${totalPitches} pitches (${percentage}%) | +${xpEarned} XP`;
      }

      toast({
        title: toastTitle,
        description: toastDescription,
        duration: 3000,
      });
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

  // Check for summit celebration (all habits completed)
  useEffect(() => {
    const totalHabitsForToday = habitsWithCompletion.filter((h) => {
      if (h.category === "adventure") {
        return h.scheduledDay === today;
      }
      return true;
    }).length;

    const completedCount = habitsWithCompletion.filter((h) => {
      if (h.category === "adventure" && h.scheduledDay !== today) {
        return false;
      }
      return h.completed;
    }).length;

    if (totalHabitsForToday > 0 && completedCount === totalHabitsForToday && completedCount > 0) {
      const wasAlreadyShown = sessionStorage.getItem(`summit-${today}`);
      if (!wasAlreadyShown) {
        setShowSummitCelebration(true);
        sessionStorage.setItem(`summit-${today}`, "true");
        setTimeout(() => setShowSummitCelebration(false), 4000);
      }
    }
  }, [habitsWithCompletion, today]);

  // Calculate today's earned tokens from completed logs
  useEffect(() => {
    const completedToday = todayLogs.filter((log) => log.completed);
    const tokensFromLogs = completedToday.reduce((sum, log) => {
      // Default XP per habit is 10
      return sum + 10;
    }, 0);
    setTodayTokens(tokensFromLogs);
  }, [todayLogs, habits]);

  const handleToggle = (habitId: number) => {
    toggleHabitMutation.mutate({ habitId });
  };

  if (habitsLoading || logsLoading) {
    return (
      <div className={cn("bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern", className)}>
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

  const totalHabitsForToday = habitsWithCompletion.filter((h) => {
    if (h.category === "adventure") {
      return h.scheduledDay === today;
    }
    return true;
  }).length;

  const completedHabits = habitsWithCompletion.filter((h) => {
    if (h.category === "adventure" && h.scheduledDay !== today) {
      return false;
    }
    return h.completed;
  }).length;

  const completionPercentage = totalHabitsForToday > 0 ? (completedHabits / totalHabitsForToday) * 100 : 0;

  return (
    <div className={cn("bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern", className)}>
      {/* Summit Celebration Overlay */}
      {showSummitCelebration && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl animate-in fade-in duration-300">
          <div className="text-center space-y-2 px-6 py-8 bg-[hsl(var(--accent))]/20 border-2 border-[hsl(var(--accent))] rounded-xl">
            <Sparkles className="w-12 h-12 mx-auto text-[hsl(var(--accent))] animate-pulse" />
            <h3 className="text-2xl font-bold text-foreground">Summit Reached!</h3>
            <p className="text-muted-foreground">All pitches sent today.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">
              Today's Pitch
            </h2>
            <Link href="/habits">
              <button className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border/50 rounded-md hover:bg-muted/20">
                <Settings className="w-3 h-3" />
                Manage
              </button>
            </Link>
          </div>
          {todayTokens > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-mountain-glacier-ice/20 border border-mountain-glacier-ice/40 rounded-full">
              <span className="text-sm font-technical font-bold text-foreground">+{todayTokens} XP</span>
              <span className="text-lg">⚡</span>
            </div>
          )}
        </div>

        {/* Progress bar - topo line style */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Daily Progress
            </span>
            <span className="text-xs font-mono text-foreground">
              {completedHabits}/{totalHabitsForToday}
            </span>
          </div>
          <div className="h-3 bg-muted/30 rounded-full overflow-hidden border border-border/30">
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                completionPercentage === 100
                  ? "bg-gradient-to-r from-[hsl(var(--accent))] to-primary"
                  : "bg-gradient-to-r from-muted-foreground/40 to-primary"
              )}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {/* Progress message */}
          <div className="mt-2 text-center">
            <span className="text-sm font-medium text-foreground/80 italic">
              {getProgressMessage(completionPercentage, totalHabitsForToday)}
            </span>
          </div>
        </div>
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
                {categoryHabits.map((habit) => {
                  const linkedGoal = habit.linkedGoalId ? goals.find((g) => g.id === habit.linkedGoalId) : null;

                  return (
                    <div
                      key={habit.id}
                      onClick={() => handleToggle(habit.id)}
                      className={cn(
                        "habit-row relative cursor-pointer transition-all duration-300",
                        "p-3",
                        habit.completed ? "card-ice-shelf ice-crystal-border" : "card-stone-cliff",
                        "hover:scale-[1.02] active:scale-[0.98]"
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
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {CATEGORY_LABELS[categoryKey]}
                            </span>
                            {linkedGoal && (
                              <>
                                <span className="text-muted-foreground/30">•</span>
                                <span className="flex items-center gap-1 text-xs text-[hsl(var(--accent))] font-semibold">
                                  <Mountain className="w-3 h-3" />
                                  {linkedGoal.title}
                                </span>
                              </>
                            )}
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
                  );
                })}
              </div>
            </div>
          );
        })}

        {totalHabitsForToday === 0 && (
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
