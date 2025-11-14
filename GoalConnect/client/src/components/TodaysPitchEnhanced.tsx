import { useQuery, useMutation } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GraniteTexture } from "./GraniteTexture";
import { DayPickerModal } from "./DayPickerModal";

interface TodaysPitchEnhancedProps {
  className?: string;
  selectedDate?: string;
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

function getEffortIcon(effort: string): string {
  switch (effort) {
    case "heavy":
      return "⚫";
    case "medium":
      return "●";
    case "light":
      return "○";
    default:
      return "●";
  }
}

export function TodaysPitchEnhanced({ className, selectedDate }: TodaysPitchEnhancedProps) {
  const { toast } = useToast();
  const today = selectedDate || new Date().toISOString().split("T")[0];
  const [schedulingHabit, setSchedulingHabit] = useState<Habit | null>(null);

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
          title: `+${coinsEarned} tokens!`,
          description: `Route sent - "${habitTitle}"`,
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

  const scheduleHabitMutation = useMutation({
    mutationFn: async ({ habitId, scheduledDay }: { habitId: number; scheduledDay: string | null }) => {
      return await apiRequest(`/api/habits/${habitId}/schedule`, "PATCH", { scheduledDay });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setSchedulingHabit(null);
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

  const hasAdventureUnscheduled = useMemo(() => {
    return habits.some((h) => h.category === "adventure" && !h.scheduledDay);
  }, [habits]);

  const adventureHabit = useMemo(() => {
    return habits.find((h) => h.category === "adventure" && !h.scheduledDay);
  }, [habits]);

  const dateLabel = useMemo(() => {
    const date = new Date(today + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }, [today]);

  if (habitsLoading || logsLoading) {
    return (
      <div className={cn("relative bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg overflow-hidden", className)}>
        <GraniteTexture />
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

  const totalHabits = habitsWithCompletion.filter(h =>
    h.category !== "adventure" || h.scheduledDay === today
  ).length;
  const completedHabits = habitsWithCompletion.filter((h) => h.completed).length;

  // Check if empty
  const isEmpty = totalHabits === 0;

  return (
    <>
      <div className={cn("relative bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg overflow-hidden", className)}>
        {/* Granite texture overlay */}
        <GraniteTexture />

        {/* Header */}
        <div className="mb-6 relative z-10">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            Today's Pitch
            <span className="text-sm font-normal text-muted-foreground">
              {dateLabel}
            </span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {completedHabits}/{totalHabits} complete
          </p>
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div className="text-center py-12 relative z-10">
            <p className="text-muted-foreground text-lg mb-2">
              Basecamp quiet. Bolt your core habits.
            </p>
            <button
              onClick={() => window.location.href = "/habits"}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-all border border-primary/30"
            >
              <Plus className="w-4 h-4" />
              Add a core habit
            </button>
          </div>
        )}

        {/* Habits grouped by category */}
        {!isEmpty && (
          <div className="space-y-6 relative z-10">
            {Object.entries(groupedHabits).map(([category, categoryHabits]) => {
              if (categoryHabits.length === 0) return null;

              const categoryKey = category as keyof typeof CATEGORY_LABELS;

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
                          "rounded-xl p-4 border",
                          "bg-muted/10 border-border/50",
                          "hover:scale-[1.01] active:scale-[0.99]",
                          "hover:shadow-md",
                          habit.completed && "bg-[#46B3A9]/10 border-[#46B3A9]/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* Checkbox - large tap target */}
                          <button
                            className={cn(
                              "w-12 h-12 rounded-lg border-2 transition-all font-bold text-xl flex items-center justify-center flex-shrink-0",
                              habit.completed
                                ? "bg-[#46B3A9]/30 border-[#46B3A9] text-[#46B3A9]"
                                : "border-muted-foreground/30 hover:border-[#46B3A9] hover:bg-[#46B3A9]/10 text-muted-foreground"
                            )}
                          >
                            {habit.completed ? "✓" : " "}
                          </button>

                          {/* Habit info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-foreground font-semibold text-base">
                              {habit.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {CATEGORY_LABELS[categoryKey]}
                            </div>
                          </div>

                          {/* Grade + Effort */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-bold text-foreground bg-muted/30 px-3 py-1 rounded-lg">
                              {habit.grade || "5.9"}
                            </span>
                            <span className="text-lg text-foreground" title={`${habit.effort || "medium"} effort`}>
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

            {/* Adventure CTA if unscheduled */}
            {hasAdventureUnscheduled && adventureHabit && (
              <div className="relative z-10">
                <div className="mb-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    ADVENTURE
                  </h3>
                </div>
                <button
                  onClick={() => setSchedulingHabit(adventureHabit)}
                  className="w-full p-4 rounded-xl bg-primary/20 border border-primary/40 hover:bg-primary/30 transition-all text-left flex items-center justify-between"
                >
                  <div>
                    <div className="text-foreground font-semibold text-base">
                      {adventureHabit.title}
                    </div>
                    <div className="text-sm text-primary mt-1">
                      Adventure day not scheduled - Choose Adventure Day
                    </div>
                  </div>
                  <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Day Picker Modal */}
      {schedulingHabit && (
        <DayPickerModal
          open={!!schedulingHabit}
          onOpenChange={(open) => !open && setSchedulingHabit(null)}
          currentScheduledDay={schedulingHabit.scheduledDay || null}
          onSelectDay={(date) => scheduleHabitMutation.mutate({ habitId: schedulingHabit.id, scheduledDay: date })}
          onClearSchedule={() => scheduleHabitMutation.mutate({ habitId: schedulingHabit.id, scheduledDay: null })}
          habitTitle={schedulingHabit.title}
        />
      )}
    </>
  );
}
