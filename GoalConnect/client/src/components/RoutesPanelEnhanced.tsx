import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useMemo, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { GraniteTexture } from "./GraniteTexture";
import { useParticleSystem } from "@/utils/particles";
import { motion } from "framer-motion";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystem = useParticleSystem(canvasRef);

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

  // Check if all routes are complete for golden glow
  const allRoutesComplete = useMemo(() => {
    return routeProgress.length > 0 && routeProgress.every((r) => r.completed >= r.target);
  }, [routeProgress]);

  if (habits.length === 0) {
    return null;
  }

  return (
    <div className={cn("relative bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg overflow-hidden", className)}>
      <GraniteTexture />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-20"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl font-bold text-foreground">Active Routes</h2>
        <div className="text-xs text-muted-foreground">
          {routeProgress.filter((r) => r.completed >= r.target).length}/{routeProgress.length} sent
        </div>
      </div>

      {/* Route list - Rope Ladder */}
      <div className="relative z-10">
        {routeProgress.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              No routes yet.
              <br />
              Create habits to see your routes!
            </p>
          </div>
        )}

        {routeProgress.length > 0 && (
          <div className={cn("rope-ladder relative", allRoutesComplete && "all-complete")}>
            {/* Rope line */}
            <div
              className={cn(
                "absolute left-8 top-0 bottom-0 w-1 rounded-full transition-all duration-500",
                allRoutesComplete
                  ? "bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 shadow-[0_0_20px_rgba(250,204,21,0.6)]"
                  : "bg-gradient-to-b from-muted-foreground/30 to-muted-foreground/20"
              )}
            />

            {/* Ladder rungs */}
            <div className="space-y-4 relative">
              {routeProgress.map(({ habit, completed, target, pitches }, index) => {
                const isComplete = completed >= target;
                const isExpanded = expandedRouteId === habit.id;

                return (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pl-16"
                  >
                    {/* Rung */}
                    <div
                      className={cn(
                        "ladder-rung rounded-lg p-4 transition-all duration-300",
                        isComplete && "completed"
                      )}
                    >
                      {/* Rung connection to rope */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-1 bg-gradient-to-r from-muted-foreground/40 to-transparent" />

                      <div className="flex items-center gap-3">
                        {/* Habit icon and status */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-2xl">{habit.icon}</span>
                          {isComplete && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-[#46B3A9] text-white flex items-center justify-center"
                            >
                              <Check className="w-4 h-4" />
                            </motion.div>
                          )}
                        </div>

                        {/* Habit info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-foreground text-base">
                            {habit.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                            {habit.grade && <span>{habit.grade}</span>}
                            <span>•</span>
                            <span>{habit.category || "Training"}</span>
                          </div>
                        </div>

                        {/* Progress indicator */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-0.5">
                            {pitches.map((filled, i) => (
                              <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: filled ? 1.2 : 1 }}
                                className={cn(
                                  "w-2 h-2 rounded-full transition-all",
                                  filled
                                    ? "bg-[#46B3A9] shadow-[0_0_8px_rgba(70,179,169,0.6)]"
                                    : "bg-muted-foreground/20"
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">
                            {completed}/{target}
                          </span>
                          <button
                            onClick={() => handleToggleExpand(habit.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 pt-3 border-t border-border/30"
                        >
                          <div className="text-xs text-muted-foreground space-y-1">
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
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* All routes complete celebration */}
            {allRoutesComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-center p-4 rounded-xl bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-500/30"
              >
                <div className="text-2xl mb-2">🏆</div>
                <div className="text-foreground font-bold">All Routes Sent!</div>
                <div className="text-sm text-muted-foreground mt-1">This week's climbing crushed!</div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
