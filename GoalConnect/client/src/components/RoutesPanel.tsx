import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

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

  if (isCollapsed) {
    return (
      <div className={cn("glass-card rounded-3xl p-4 alpine-glow", className)}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
          aria-label="Expand Routes Panel"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("glass-card rounded-3xl p-6 alpine-glow", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-xl font-bold text-white"
          style={{
            fontFamily: "'Comfortaa', cursive",
            textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
          }}
        >
          Routes
        </h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-white/70 hover:text-white transition-colors"
          aria-label="Collapse Routes Panel"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Route list */}
      <div className="space-y-4">
        {routeProgress.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/60 text-sm" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              No routes yet.
              <br />
              Create habits to see your routes!
            </p>
          </div>
        )}

        {routeProgress.map(({ habit, completed, target, pitches }) => {
          const isComplete = completed >= target;
          const routeName = habit.title;

          return (
            <div
              key={habit.id}
              className={cn(
                "route-item p-4 rounded-xl border-2 transition-all duration-300",
                "bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl",
                isComplete
                  ? "border-green-400/60 bg-green-500/20"
                  : "border-white/20 hover:border-white/40"
              )}
            >
              {/* Route name */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{habit.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">{routeName}</div>
                  {habit.grade && (
                    <div className="text-xs text-white/60">{habit.grade}</div>
                  )}
                </div>
                {isComplete && (
                  <div className="flex-shrink-0">
                    <div className="bg-green-500/30 text-green-200 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-semibold">
                      <Check className="w-3 h-3" />
                      Sent!
                    </div>
                  </div>
                )}
              </div>

              {/* Pitches visualization */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 flex-1">
                  {pitches.map((filled, i) => (
                    <span
                      key={i}
                      className={cn(
                        "text-lg transition-all duration-300",
                        filled ? "text-green-400 scale-110" : "text-white/30"
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
                <div className="text-xs text-white/70 font-mono flex-shrink-0">
                  ({completed}/{target})
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    isComplete
                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                      : "bg-gradient-to-r from-blue-400 to-cyan-500"
                  )}
                  style={{
                    width: `${Math.min((completed / target) * 100, 100)}%`,
                  }}
                />
              </div>
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
    </div>
  );
}
