/**
 * DueThisMonthWidget
 * Shows all goals and milestones due in the current month
 */

import { useMemo } from "react";
import { format, parseISO, isBefore, startOfMonth, endOfMonth } from "date-fns";
import { Calendar, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoalCalendar, type CalendarGoalWithStatus } from "@/hooks/useGoalCalendar";

export function DueThisMonthWidget() {
  const currentMonth = new Date();
  const { goals, isLoading } = useGoalCalendar(currentMonth);

  // Filter to non-milestone goals and sort by due date
  const dueThisMonth = useMemo(() => {
    return goals
      .filter(g => !g.isMilestone && g.source !== "milestone")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [goals]);

  // Stats
  const stats = useMemo(() => {
    const total = dueThisMonth.length;
    const completed = dueThisMonth.filter(g => g.status === "completed").length;
    const overdue = dueThisMonth.filter(g => g.status === "overdue").length;
    const dueSoon = dueThisMonth.filter(g => g.status === "due-soon").length;
    return { total, completed, overdue, dueSoon };
  }, [dueThisMonth]);

  const getStatusIcon = (goal: CalendarGoalWithStatus) => {
    if (goal.status === "completed") {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
    if (goal.status === "overdue") {
      return <AlertCircle className="w-4 h-4 text-rose-400" />;
    }
    if (goal.status === "due-soon") {
      return <Clock className="w-4 h-4 text-amber-400" />;
    }
    return <Calendar className="w-4 h-4 text-sky-400" />;
  };

  const getStatusColor = (goal: CalendarGoalWithStatus) => {
    switch (goal.status) {
      case "completed": return "text-emerald-400";
      case "overdue": return "text-rose-400";
      case "due-soon": return "text-amber-400";
      case "behind": return "text-orange-400";
      default: return "text-[var(--text-primary)]";
    }
  };

  return (
    <div className="glass-card frost-accent">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="card-title">Due This Month</span>
        <span className="text-xs text-[var(--text-muted)]">
          {format(currentMonth, "MMMM yyyy")}
        </span>
      </div>

      {/* Stats row */}
      {stats.total > 0 && (
        <div className="flex items-center gap-4 mb-3 text-xs">
          <span className="text-[var(--text-muted)]">
            <span className="text-emerald-400 font-medium">{stats.completed}</span>/{stats.total} done
          </span>
          {stats.overdue > 0 && (
            <span className="text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {stats.overdue} overdue
            </span>
          )}
          {stats.dueSoon > 0 && (
            <span className="text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {stats.dueSoon} due soon
            </span>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {/* Goals list */}
      {!isLoading && dueThisMonth.length > 0 && (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {dueThisMonth.map((goal) => {
            const isOverdue = isBefore(parseISO(goal.dueDate), new Date()) && goal.status !== "completed";

            return (
              <div
                key={`${goal.source}-${goal.id}`}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors",
                  goal.status === "completed" && "opacity-60"
                )}
              >
                {getStatusIcon(goal)}

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm truncate",
                    getStatusColor(goal),
                    goal.status === "completed" && "line-through"
                  )}>
                    {goal.title}
                  </p>

                  {/* Progress bar for count goals */}
                  {goal.targetValue > 1 && goal.status !== "completed" && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full",
                            goal.status === "overdue" ? "bg-rose-400" :
                            goal.status === "due-soon" ? "bg-amber-400" :
                            goal.status === "behind" ? "bg-orange-400" : "bg-sky-400"
                          )}
                          style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                        {goal.currentValue}/{goal.targetValue}
                      </span>
                    </div>
                  )}
                </div>

                <div className={cn(
                  "text-xs whitespace-nowrap",
                  isOverdue ? "text-rose-400 font-medium" : "text-[var(--text-muted)]"
                )}>
                  {format(parseISO(goal.dueDate), "MMM d")}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && dueThisMonth.length === 0 && (
        <div className="text-center py-6">
          <Calendar className="w-8 h-8 text-[var(--text-muted)]/40 mx-auto mb-2" />
          <p className="text-sm text-[var(--text-muted)]">
            No goals due this month
          </p>
        </div>
      )}
    </div>
  );
}
