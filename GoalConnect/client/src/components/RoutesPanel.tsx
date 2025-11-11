import { useQuery, useMutation } from "@tanstack/react-query";
import type { Goal } from "@shared/schema";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check, Target } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RoutesPanelProps {
  className?: string;
}

interface GoalProgress {
  goal: Goal;
  percentage: number;
  remaining: number;
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

  // Calculate progress for each goal
  const goalProgress = useMemo(() => {
    const progress: GoalProgress[] = goals.map((goal) => {
      const percentage = Math.round((goal.currentValue / goal.targetValue) * 100);
      const remaining = Math.max(0, goal.targetValue - goal.currentValue);

      return {
        goal,
        percentage: Math.min(percentage, 100),
        remaining,
      };
    });

    return progress;
  }, [goals]);

  const incrementGoalMutation = useMutation({
    mutationFn: async ({ goalId }: { goalId: number }) => {
      return await apiRequest("/api/goal-updates", "POST", {
        goalId,
        value: 1,
        date: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const handleIncrementGoal = (event: React.MouseEvent, goalId: number) => {
    event.stopPropagation();
    incrementGoalMutation.mutate({ goalId });
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
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Routes
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Long-term goals & projects
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

      {/* Goals list */}
      <div className="space-y-4 relative z-10">
        {goalProgress.length === 0 && (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              No routes yet.
              <br />
              Create goals to track your big climbs!
            </p>
          </div>
        )}

        {goalProgress.map(({ goal, percentage, remaining }) => {
          const isComplete = percentage >= 100;

          return (
            <div
              key={goal.id}
              className={cn(
                "route-item p-4 rounded-xl border transition-all duration-300",
                "bg-muted/10",
                isComplete
                  ? "border-[hsl(var(--accent))]/60 bg-[hsl(var(--accent))]/10"
                  : "border-border/50 hover:border-border"
              )}
            >
              {/* Goal header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-primary/20 flex-shrink-0">
                  🎯
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm">{goal.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 space-x-2">
                    <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                    <span>•</span>
                    <span>{percentage}%</span>
                  </div>
                </div>
                {isComplete && (
                  <div className="flex-shrink-0">
                    <div className="bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] text-xs px-2 py-1 rounded-full flex items-center gap-1 font-semibold border border-[hsl(var(--accent))]/30">
                      <Check className="w-3 h-3" />
                      Complete
                    </div>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 rounded-full",
                      isComplete
                        ? "bg-gradient-to-r from-[hsl(var(--accent))] to-primary"
                        : "bg-gradient-to-r from-primary to-[hsl(var(--accent))]"
                    )}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>

              {/* Action button */}
              {!isComplete && (
                <button
                  onClick={(e) => handleIncrementGoal(e, goal.id)}
                  disabled={incrementGoalMutation.isPending}
                  className={cn(
                    "w-full py-2 px-3 rounded-lg border-2 transition-all font-semibold text-sm",
                    "border-[hsl(var(--accent))]/40 hover:bg-[hsl(var(--accent))]/10 text-foreground",
                    "hover:border-[hsl(var(--accent))] active:scale-[0.98]",
                    incrementGoalMutation.isPending && "opacity-50 cursor-not-allowed"
                  )}
                >
                  +1 {goal.unit}
                </button>
              )}

              {isComplete && (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  Route complete! 🏔️
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
