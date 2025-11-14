import { useQuery, useMutation } from "@tanstack/react-query";
import type { Goal } from "@shared/schema";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check, Target, Mountain } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RoutesPanelProps {
  className?: string;
}

interface RouteProgress {
  goal: Goal;
  percentage: number;
  totalPitches: number;
  completedPitches: number;
  grade: string;
}

export function RoutesPanel({ className }: RoutesPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("routesPanelCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("routesPanelCollapsed", String(isCollapsed));
  }, [isCollapsed]);

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  // Calculate route progress with pitches
  const activeRoutes = useMemo(() => {
    const routes: RouteProgress[] = goals
      .filter((goal) => {
        const percentage = (goal.currentValue / goal.targetValue) * 100;
        return percentage < 100; // Only show incomplete goals
      })
      .slice(0, 3) // Limit to 3 active routes
      .map((goal) => {
        const percentage = Math.round((goal.currentValue / goal.targetValue) * 100);

        // Calculate pitches (each goal gets 12 pitches)
        const totalPitches = 12;
        const completedPitches = Math.floor((percentage / 100) * totalPitches);

        // Assign climbing grade based on goal difficulty/size
        const grades = ["5.9", "5.10a", "5.10c", "5.11a", "5.11c", "5.12a"];
        const gradeIndex = Math.min(Math.floor(goal.targetValue / 20), grades.length - 1);
        const grade = grades[gradeIndex] || "5.9";

        return {
          goal,
          percentage: Math.min(percentage, 100),
          totalPitches,
          completedPitches,
          grade,
        };
      });

    return routes;
  }, [goals]);

  const incrementGoalMutation = useMutation({
    mutationFn: async ({ goalId, currentValue }: { goalId: number; currentValue: number }) => {
      return await apiRequest(`/api/goals/${goalId}`, "PATCH", {
        currentValue: currentValue + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
    onError: (error: any) => {
      console.error("[RoutesPanel] Failed to increment goal:", error);
      // Could add a toast here if you want to show errors to user
    },
  });

  const handleIncrementGoal = (event: React.MouseEvent, goalId: number, currentValue: number) => {
    event.stopPropagation();
    incrementGoalMutation.mutate({ goalId, currentValue });
  };

  if (isCollapsed) {
    return (
      <div className={cn("bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-4 shadow-lg topo-pattern", className)}>
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
    <div className={cn("bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Mountain className="w-5 h-5" />
            Active Routes
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your multi-pitch projects
          </p>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Collapse Routes Panel"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Active Routes */}
      <div className="space-y-5 relative z-10">
        {activeRoutes.length === 0 && (
          <div className="text-center py-8">
            <Mountain className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              No active routes yet.
              <br />
              Create goals to start your multi-pitch climbs!
            </p>
          </div>
        )}

        {activeRoutes.map(({ goal, percentage, totalPitches, completedPitches, grade }) => {
          return (
            <div
              key={goal.id}
              className="route-card p-4 card-stone-cliff granite-overlay transition-all duration-300"
            >
              {/* Route Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-sm mb-1">{goal.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-technical bg-mountain-glacier-ice/20 px-2 py-0.5 rounded font-bold text-mountain-glacier-ice border border-mountain-glacier-ice/30">
                      {grade}
                    </span>
                    <span>•</span>
                    <span>{completedPitches}/{totalPitches} pitches sent</span>
                  </div>
                </div>
              </div>

              {/* Climbing Topo Visualization */}
              <div className="flex gap-4 mb-4">
                {/* Vertical pitch line */}
                <div className="flex flex-col items-center gap-1 py-2">
                  <div className="text-xs text-muted-foreground font-semibold mb-1">Summit</div>
                  {Array.from({ length: totalPitches }).reverse().map((_, i) => {
                    const pitchNumber = totalPitches - i;
                    const isCompleted = pitchNumber <= completedPitches;
                    const isCurrent = pitchNumber === completedPitches + 1;

                    return (
                      <div key={i} className="flex flex-col items-center">
                        {/* Pitch dot */}
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full border-2 transition-all duration-300",
                            isCompleted
                              ? "bg-[hsl(var(--accent))] border-[hsl(var(--accent))] shadow-[0_0_8px_hsl(var(--accent))]"
                              : isCurrent
                              ? "bg-background border-[hsl(var(--accent))]/60 animate-pulse"
                              : "bg-background border-muted-foreground/30"
                          )}
                        />
                        {/* Connecting line */}
                        {i < totalPitches - 1 && (
                          <div
                            className={cn(
                              "w-0.5 h-4 transition-all duration-300",
                              isCompleted
                                ? "bg-[hsl(var(--accent))]"
                                : "bg-muted-foreground/20"
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                  <div className="text-xs text-muted-foreground font-semibold mt-1">Base</div>
                </div>

                {/* Route Info */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span className="font-semibold text-foreground">{percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Actual:</span>
                      <span className="font-semibold text-foreground">{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={(e) => handleIncrementGoal(e, goal.id, goal.currentValue)}
                disabled={incrementGoalMutation.isPending}
                className={cn(
                  "w-full py-2 px-3 rounded-lg border-2 transition-all font-semibold text-sm",
                  "border-[hsl(var(--accent))]/40 hover:bg-[hsl(var(--accent))]/10 text-foreground",
                  "hover:border-[hsl(var(--accent))] active:scale-[0.98]",
                  incrementGoalMutation.isPending && "opacity-50 cursor-not-allowed"
                )}
              >
                Send next pitch (+1 {goal.unit})
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
