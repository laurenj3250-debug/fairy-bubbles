/**
 * GoalsDeadlinesWidget
 * Consolidated view of goals due this month - each goal appears once with milestone counts
 */

import { format, parseISO, isBefore } from "date-fns";
import { Calendar, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoalCalendar, type ConsolidatedGoal } from "@/hooks/useGoalCalendar";

interface GoalsDeadlinesWidgetProps {
  onIncrement: (goalId: number) => void;
  isIncrementing: boolean;
}

export function GoalsDeadlinesWidget({
  onIncrement,
  isIncrementing,
}: GoalsDeadlinesWidgetProps) {
  const currentMonth = new Date();
  const { consolidatedGoals, isLoading } = useGoalCalendar(currentMonth);

  const getStatusInfo = (goal: ConsolidatedGoal) => {
    const allMet = goal.milestonesMet >= goal.milestonesThisMonth;
    const someMet = goal.milestonesMet > 0;
    const isOverdue = goal.nextDueDate && isBefore(parseISO(goal.nextDueDate), new Date());

    if (goal.isCompleted || allMet) {
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
        color: "text-emerald-400"
      };
    }
    if (isOverdue) {
      return {
        icon: <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />,
        color: "text-rose-400"
      };
    }
    if (someMet) {
      return {
        icon: <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />,
        color: "text-sky-400"
      };
    }
    return {
      icon: <Calendar className="w-4 h-4 text-sky-400 flex-shrink-0" />,
      color: "text-[var(--text-primary)]"
    };
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
      {!isLoading && consolidatedGoals.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="w-8 h-8 text-[var(--text-muted)]/40 mx-auto mb-2" />
          <p className="text-sm text-[var(--text-muted)]">No goals due this month</p>
        </div>
      )}

      {/* Consolidated goals list */}
      {!isLoading && consolidatedGoals.length > 0 && (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {consolidatedGoals.map((goal) => {
            const { icon, color } = getStatusInfo(goal);
            const allMet = goal.milestonesMet >= goal.milestonesThisMonth;
            const canIncrement = !goal.isCompleted && goal.targetValue > 1;
            const isOverdue = goal.nextDueDate && isBefore(parseISO(goal.nextDueDate), new Date());

            return (
              <div
                key={goal.goalId}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors",
                  allMet && "opacity-60"
                )}
              >
                {/* Increment button or status icon */}
                {canIncrement ? (
                  <button
                    onClick={() => onIncrement(goal.goalId)}
                    disabled={isIncrementing}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-white/10 text-[var(--text-primary)] hover:bg-peach-400/20 hover:text-peach-400 transition-all flex-shrink-0"
                  >
                    +1
                  </button>
                ) : (
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                )}

                {/* Goal info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm truncate",
                    allMet ? "line-through text-emerald-400" : color
                  )}>
                    {goal.title}
                  </p>

                  {/* Milestone count badge */}
                  {goal.milestonesThisMonth > 1 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[var(--text-muted)]">
                        <span className={goal.milestonesMet > 0 ? "text-emerald-400" : ""}>
                          {goal.milestonesMet}
                        </span>
                        /{goal.milestonesThisMonth} due this month
                      </span>
                    </div>
                  )}

                  {/* Progress bar for count goals */}
                  {goal.targetValue > 1 && !allMet && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full",
                            isOverdue ? "bg-rose-400" : "bg-peach-400"
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

                {/* Next due date */}
                {goal.nextDueDate && (
                  <span className={cn(
                    "text-xs whitespace-nowrap",
                    isOverdue ? "text-rose-400 font-medium" : "text-[var(--text-muted)]"
                  )}>
                    {format(parseISO(goal.nextDueDate), "MMM d")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
