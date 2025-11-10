import { useQuery, useMutation } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check, Calendar } from "lucide-react";
import { DayPickerModal } from "./DayPickerModal";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RoutesPanelProps {
  className?: string;
}

interface RouteProgress {
  habit: Habit;
  completed: number;
  target: number;
  pitches: boolean[];
}

export function RoutesPanel({ className }: RoutesPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("routesPanelCollapsed");
    return saved === "true";
  });
  const [schedulingHabit, setSchedulingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    localStorage.setItem("routesPanelCollapsed", String(isCollapsed));
  }, [isCollapsed]);

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/all"],
    queryFn: async () => {
      if (habits.length === 0) return [];
      const logsPromises = habits.map((h) =>
        fetch(`/api/habit-logs?habitId=${h.id}`).then((res) => res.json())
      );
      const logsArrays = await Promise.all(logsPromises);
      return logsArrays.flat();
    },
    enabled: habits.length > 0,
  });

  const scheduleHabitMutation = useMutation({
    mutationFn: async ({ habitId, scheduledDay }: { habitId: number; scheduledDay: string | null }) => {
      return await apiRequest(`/api/habits/${habitId}/schedule`, "PATCH", { scheduledDay });
    },
    onMutate: async ({ habitId, scheduledDay }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/habits"] });
      const previousHabits = queryClient.getQueryData<Habit[]>(["/api/habits"]);

      queryClient.setQueryData<Habit[]>(["/api/habits"], (old = []) => {
        return old.map((habit) =>
          habit.id === habitId ? { ...habit, scheduledDay } : habit
        );
      });

      return { previousHabits };
    },
    onError: (err, variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(["/api/habits"], context.previousHabits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
    },
  });

  // Calculate this week's progress per habit
  const routeProgress = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const routes: RouteProgress[] = habits.map((habit) => {
      const target = habit.targetPerWeek || habit.cadence === "daily" ? 7 : 3;

      // Count completed logs this week
      const weekLogs = allLogs.filter((log) => {
        if (log.habitId !== habit.id || !log.completed) return false;
        const logDate = new Date(log.date);
        const weekStart = new Date(monday);
        const weekEnd = new Date(monday);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59);
        return logDate >= weekStart && logDate <= weekEnd;
      });

      const completed = weekLogs.length;

      // Create pitch array (filled vs empty circles)
      const pitches = Array.from({ length: target }, (_, i) => i < completed);

      return {
        habit,
        completed,
        target,
        pitches,
      };
    });

    return routes;
  }, [habits, allLogs]);

  const handleScheduleDay = (habitId: number, scheduledDay: string) => {
    scheduleHabitMutation.mutate({ habitId, scheduledDay });
  };

  const handleClearSchedule = (habitId: number) => {
    scheduleHabitMutation.mutate({ habitId, scheduledDay: null });
  };

  const getScheduledDayLabel = (scheduledDay: string | null | undefined) => {
    if (!scheduledDay) return null;
    const date = new Date(scheduledDay);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  if (isCollapsed) {
    return (
      <div className={cn("bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-4 shadow-lg topo-pattern", className)}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative z-10"
          aria-label="Expand Routes Panel"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl font-bold text-foreground">
          Routes
        </h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Collapse Routes Panel"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Route list */}
      <div className="space-y-4 relative z-10">
        {routeProgress.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              No routes yet.
              <br />
              Create habits to see your routes!
            </p>
          </div>
        )}

        {routeProgress.map(({ habit, completed, target, pitches }) => {
          const isComplete = completed >= target;
          const routeName = habit.title;
          const isAdventure = habit.category === "adventure";
          const scheduledDayLabel = getScheduledDayLabel(habit.scheduledDay);

          return (
            <div
              key={habit.id}
              className={cn(
                "route-item p-3 rounded-xl border transition-all duration-300",
                "bg-muted/10",
                isComplete
                  ? "border-[hsl(var(--accent))]/60 bg-[hsl(var(--accent))]/10"
                  : "border-border/50 hover:border-border"
              )}
            >
              {/* Route name */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{habit.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm truncate">{routeName}</div>
                  {habit.grade && (
                    <div className="text-xs text-muted-foreground">{habit.grade}</div>
                  )}
                </div>
                {isComplete && (
                  <div className="flex-shrink-0">
                    <div className="bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] text-xs px-2 py-1 rounded-full flex items-center gap-1 font-semibold border border-[hsl(var(--accent))]/30">
                      <Check className="w-3 h-3" />
                      Sent!
                    </div>
                  </div>
                )}
              </div>

              {/* Adventure Scheduling or Pitches */}
              {isAdventure ? (
                <div className="space-y-2">
                  {scheduledDayLabel ? (
                    <button
                      onClick={() => setSchedulingHabit(habit)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-muted/10 border border-border/50 hover:border-border transition-all"
                    >
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Scheduled: {scheduledDayLabel}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Change</div>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSchedulingHabit(habit)}
                      className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-primary/20 border border-primary/40 hover:bg-primary/30 transition-all text-foreground"
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-semibold">Choose Day</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Pitches visualization */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 flex-1">
                      {pitches.map((filled, i) => (
                        <span
                          key={i}
                          className={cn(
                            "text-lg transition-all duration-300",
                            filled ? "text-[hsl(var(--accent))] scale-110" : "text-muted-foreground/30"
                          )}
                          style={{
                            animation: filled ? `pitch-fill 0.3s ease-out ${i * 0.05}s backwards` : undefined,
                          }}
                        >
                          {filled ? "●" : "○"}
                        </span>
                      ))}
                    </div>

                    {/* Count */}
                    <div className="text-xs text-muted-foreground font-mono flex-shrink-0">
                      ({completed}/{target})
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        isComplete
                          ? "bg-[hsl(var(--accent))]"
                          : "bg-primary"
                      )}
                      style={{
                        width: `${Math.min((completed / target) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Celebration animation */}
      <style>{`
        @keyframes pitch-fill {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      {/* Day Picker Modal */}
      {schedulingHabit && (
        <DayPickerModal
          open={!!schedulingHabit}
          onOpenChange={(open) => !open && setSchedulingHabit(null)}
          currentScheduledDay={schedulingHabit.scheduledDay || null}
          onSelectDay={(date) => handleScheduleDay(schedulingHabit.id, date)}
          onClearSchedule={() => handleClearSchedule(schedulingHabit.id)}
          habitTitle={schedulingHabit.title}
        />
      )}
    </div>
  );
}
