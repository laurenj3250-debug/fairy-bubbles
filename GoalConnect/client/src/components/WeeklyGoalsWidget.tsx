import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Goal } from "@shared/schema";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export function WeeklyGoalsWidget() {
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  // Get current week start (Monday) and end (Sunday)
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    };
  }, []);

  // Filter goals due this week
  const weeklyGoals = useMemo(() => {
    return goals
      .filter(goal => {
        const deadline = goal.deadline;
        return deadline >= weekDates.start && deadline <= weekDates.end;
      })
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [goals, weekDates]);

  if (weeklyGoals.length === 0) {
    return null;
  }

  return (
    <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-3xl p-6 shadow-lg topo-pattern" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-bold text-white flex items-center gap-2"
          style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}
        >
          <Target className="w-5 h-5 text-blue-400" />
          This Week's Goals
        </h3>
        <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30">
          {weeklyGoals.length}
        </Badge>
      </div>

      <div className="space-y-3">
        {weeklyGoals.map(goal => {
          const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
          const daysUntil = Math.ceil(
            (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );

          let urgencyColor = "text-white/90";
          let urgencyBg = "bg-white/10";
          let urgencyBorder = "border-white/20";

          if (daysUntil <= 1) {
            urgencyColor = "text-red-200";
            urgencyBg = "bg-red-500/20";
            urgencyBorder = "border-red-400/30";
          } else if (daysUntil <= 3) {
            urgencyColor = "text-orange-200";
            urgencyBg = "bg-orange-500/20";
            urgencyBorder = "border-orange-400/30";
          } else if (progress >= 75) {
            urgencyColor = "text-green-200";
            urgencyBg = "bg-green-500/20";
            urgencyBorder = "border-green-400/30";
          }

          return (
            <div
              key={goal.id}
              className={cn(
                "backdrop-blur-xl rounded-2xl p-4 border-2 transition-all hover-elevate",
                urgencyBg,
                urgencyBorder
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className={cn("font-semibold text-sm mb-1 truncate", urgencyColor)}>
                    {goal.title}
                  </h4>
                  <p className="text-xs text-white/60">
                    {goal.currentValue} / {goal.targetValue} {goal.unit}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-white mb-0.5">{progress}%</div>
                  <div className="text-xs text-white/70">
                    {daysUntil === 0 ? (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Today!
                      </span>
                    ) : daysUntil === 1 ? (
                      '1 day'
                    ) : (
                      `${daysUntil} days`
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    progress >= 75 ? "bg-green-400" : progress >= 50 ? "bg-blue-400" : "bg-orange-400"
                  )}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Link href="/goals">
        <button className="w-full mt-4 py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white text-sm font-medium transition-all hover-elevate">
          View All Goals
        </button>
      </Link>
    </div>
  );
}
