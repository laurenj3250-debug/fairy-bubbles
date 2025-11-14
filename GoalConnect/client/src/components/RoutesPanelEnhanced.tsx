import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { GraniteTexture } from "./GraniteTexture";

interface RoutesPanelEnhancedProps {
  className?: string;
}

interface RouteProgress {
  habit: Habit;
  completed: number;
  target: number;
  pitches: boolean[];
}

export function RoutesPanelEnhanced({ className }: RoutesPanelEnhancedProps) {
  const [expandedRouteId, setExpandedRouteId] = useState<number | null>(null);

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

  const routeProgress = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const routes: RouteProgress[] = habits
      .filter((h) => h.category !== "adventure") // Filter out adventure habits
      .map((habit) => {
        const target = habit.targetPerWeek || (habit.cadence === "daily" ? 7 : 3);

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

  const handleToggleExpand = (routeId: number) => {
    setExpandedRouteId(expandedRouteId === routeId ? null : routeId);
  };

  if (habits.length === 0) {
    return null;
  }

  return (
    <div className={cn("relative bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg overflow-hidden", className)}>
      <GraniteTexture />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl font-bold text-foreground">This Week's Routes</h2>
        <div className="text-xs text-muted-foreground">
          {routeProgress.filter((r) => r.completed >= r.target).length}/{routeProgress.length} sent
        </div>
      </div>

      {/* Route list */}
      <div className="space-y-3 relative z-10">
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
          const isExpanded = expandedRouteId === habit.id;

          return (
            <div
              key={habit.id}
              className={cn(
                "route-item rounded-xl border transition-all duration-300",
                "bg-muted/10",
                isComplete
                  ? "border-[#46B3A9]/60 bg-[#46B3A9]/10"
                  : "border-border/50 hover:border-border"
              )}
            >
              {/* Route header - always visible */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-lg">{habit.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm truncate">
                      {habit.title}
                    </div>
                    {habit.grade && (
                      <div className="text-xs text-muted-foreground">{habit.grade}</div>
                    )}
                  </div>
                  {isComplete && (
                    <div className="flex-shrink-0">
                      <div className="bg-[#46B3A9]/20 text-[#46B3A9] text-xs px-2 py-1 rounded-full flex items-center gap-1 font-semibold border border-[#46B3A9]/30">
                        <Check className="w-3 h-3" />
                        Sent!
                      </div>
                    </div>
                  )}
                </div>

                {/* Pitches visualization */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 flex-1">
                    {pitches.map((filled, i) => (
                      <span
                        key={i}
                        className={cn(
                          "text-base transition-all duration-300",
                          filled ? "text-[#46B3A9] scale-110" : "text-muted-foreground/30"
                        )}
                      >
                        {filled ? "●" : "○"}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground font-mono">
                    ({completed}/{target})
                  </div>

                  <button
                    onClick={() => handleToggleExpand(habit.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 rounded-full",
                      isComplete ? "bg-[#46B3A9]" : "bg-primary"
                    )}
                    style={{
                      width: `${Math.min((completed / target) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-border/30">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span className="text-foreground font-medium">{habit.category || "Training"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cadence:</span>
                      <span className="text-foreground font-medium">{habit.cadence || "Daily"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Effort:</span>
                      <span className="text-foreground font-medium">{habit.effort || "Medium"}</span>
                    </div>
                    {habit.description && (
                      <div className="mt-2 pt-2 border-t border-border/20">
                        <p className="text-foreground">{habit.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
