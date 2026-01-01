/**
 * GoalsDeadlinesWidget
 * Single unified list of all goals due this month (weekly goals + milestones)
 */

import { useMemo } from "react";
import { format, parseISO, isBefore } from "date-fns";
import { Calendar, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoalCalendar, type CalendarGoalWithStatus } from "@/hooks/useGoalCalendar";

interface GoalsDeadlinesWidgetProps {
  onIncrement: (goalId: number) => void;
  isIncrementing: boolean;
}

export function GoalsDeadlinesWidget({
  onIncrement,
  isIncrementing,
}: GoalsDeadlinesWidgetProps) {
  const currentMonth = new Date();
  const { goals: calendarGoals, isLoading } = useGoalCalendar(currentMonth);

  // All goals sorted by due date
  const allGoals = useMemo(() => {
    return [...calendarGoals].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [calendarGoals]);

  const getStatusIcon = (goal: CalendarGoalWithStatus) => {
    const isDone = goal.status === "completed" || goal.status === "milestone-met";
    const isOverdue = goal.status === "overdue" || goal.status === "milestone-behind";

    if (isDone) return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
    if (isOverdue) return <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />;
    if (goal.status === "due-soon") return <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />;
    return <Calendar className="w-4 h-4 text-sky-400 flex-shrink-0" />;
  };

  const getStatusColor = (goal: CalendarGoalWithStatus) => {
    switch (goal.status) {
      case "completed":
      case "milestone-met":
        return "text-emerald-400";
      case "overdue":
      case "milestone-behind":
        return "text-rose-400";
      case "due-soon":
        return "text-amber-400";
      case "behind":
        return "text-orange-400";
      default:
        return "text-[var(--text-primary)]";
    }
  };

  return (
    <div className="glass-card frost-accent flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="card-title">Due This Month</span>
        <span className="text-xs text-[var(--text-muted)]">
          {format(currentMonth, "MMMM")}
        </span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-white/5 animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && allGoals.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="w-8 h-8 text-[var(--text-muted)]/40 mx-auto mb-2" />
          <p className="text-sm text-[var(--text-muted)]">No goals due this month</p>
        </div>
      )}

      {/* Unified goals list */}
      {!isLoading && allGoals.length > 0 && (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {allGoals.map((goal) => {
            const isDone = goal.status === "completed" || goal.status === "milestone-met";
            const isOverdue = isBefore(parseISO(goal.dueDate), new Date()) && !isDone;
            const isWeeklyGoal = goal.source === "weekly";
            const progress = goal.targetValue > 0
              ? Math.round((goal.currentValue / goal.targetValue) * 100)
              : 0;

            return (
              <div
                key={`${goal.source}-${goal.id}`}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors",
                  isDone && "opacity-60"
                )}
              >
                {/* Increment button for weekly goals, status icon for others */}
                {isWeeklyGoal && !isDone ? (
                  <button
                    onClick={() => onIncrement(goal.id)}
                    disabled={isIncrementing}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-white/10 text-[var(--text-primary)] hover:bg-peach-400/20 hover:text-peach-400 transition-all flex-shrink-0"
                  >
                    +1
                  </button>
                ) : (
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    {getStatusIcon(goal)}
                  </div>
                )}

                {/* Goal info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm truncate",
                    isDone ? "line-through text-emerald-400" : getStatusColor(goal)
                  )}>
                    {goal.title}
                    {goal.isMilestone && goal.checkpointNumber && (
                      <span className="text-[var(--text-muted)]"> #{goal.checkpointNumber}</span>
                    )}
                  </p>

                  {/* Progress bar for count goals */}
                  {goal.targetValue > 1 && !isDone && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full",
                            isOverdue ? "bg-rose-400" : "bg-peach-400"
                          )}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                        {goal.currentValue}/{goal.targetValue}
                      </span>
                    </div>
                  )}
                </div>

                {/* Due date */}
                <span className={cn(
                  "text-xs whitespace-nowrap",
                  isOverdue ? "text-rose-400 font-medium" : "text-[var(--text-muted)]"
                )}>
                  {format(parseISO(goal.dueDate), "MMM d")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
