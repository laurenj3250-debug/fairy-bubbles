/**
 * GoalsDeadlinesWidget
 * Merged widget showing Weekly Goals + Due This Month deadlines
 */

import { useMemo } from "react";
import { format, parseISO, isBefore } from "date-fns";
import { Calendar, CheckCircle2, AlertCircle, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoalCalendar, type CalendarGoalWithStatus } from "@/hooks/useGoalCalendar";
import { Link } from "wouter";

interface WeeklyGoal {
  id: number;
  title: string;
  currentValue: number;
  targetValue: number;
}

interface GoalsDeadlinesWidgetProps {
  weeklyGoals: WeeklyGoal[];
  weeklyLoading: boolean;
  onIncrement: (goalId: number) => void;
  isIncrementing: boolean;
}

export function GoalsDeadlinesWidget({
  weeklyGoals,
  weeklyLoading,
  onIncrement,
  isIncrementing,
}: GoalsDeadlinesWidgetProps) {
  const currentMonth = new Date();
  const { goals: calendarGoals, isLoading: deadlinesLoading } = useGoalCalendar(currentMonth);

  // Get deadlines due this month (all goals including milestones)
  const dueThisMonth = useMemo(() => {
    return [...calendarGoals].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [calendarGoals]);

  const getStatusIcon = (goal: CalendarGoalWithStatus) => {
    if (goal.status === "completed" || goal.status === "milestone-met") {
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
    }
    if (goal.status === "overdue" || goal.status === "milestone-behind") {
      return <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />;
    }
    if (goal.status === "due-soon") {
      return <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
    }
    return <Calendar className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;
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
      {/* Weekly Goals Section */}
      <div className="mb-4">
        <span className="card-title flex items-center gap-2">
          <Target className="w-4 h-4" />
          Weekly Goals
        </span>
        <div className="mt-2">
          {weeklyLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg" />)}
            </div>
          ) : weeklyGoals.length === 0 ? (
            <Link href="/goals">
              <div className="text-sm text-[var(--text-muted)] hover:text-peach-400 py-3 text-center cursor-pointer transition-colors">
                + Add weekly goals
              </div>
            </Link>
          ) : (
            <div className="space-y-2">
              {weeklyGoals.map(goal => {
                const progress = goal.targetValue > 0
                  ? Math.round((goal.currentValue / goal.targetValue) * 100)
                  : 0;
                const isComplete = goal.currentValue >= goal.targetValue;

                return (
                  <div
                    key={goal.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg bg-white/5",
                      isComplete && "opacity-60"
                    )}
                  >
                    <button
                      onClick={() => onIncrement(goal.id)}
                      disabled={isIncrementing || isComplete}
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                        isComplete
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/10 text-[var(--text-primary)] hover:bg-peach-400/20 hover:text-peach-400"
                      )}
                    >
                      {isComplete ? <CheckCircle2 className="w-4 h-4" /> : "+1"}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        isComplete && "line-through text-emerald-400"
                      )}>
                        {goal.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full",
                              isComplete ? "bg-emerald-400" : "bg-peach-400"
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                          {goal.currentValue}/{goal.targetValue}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 my-2" />

      {/* Due This Month Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="card-title flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Due This Month
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {format(currentMonth, "MMM")}
          </span>
        </div>

        {deadlinesLoading ? (
          <div className="space-y-1.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-white/5 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : dueThisMonth.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-3">
            No deadlines this month
          </p>
        ) : (
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
            {dueThisMonth.map((goal) => {
              const isOverdue = isBefore(parseISO(goal.dueDate), new Date()) &&
                goal.status !== "completed" && goal.status !== "milestone-met";

              return (
                <div
                  key={`${goal.source}-${goal.id}`}
                  className={cn(
                    "flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors",
                    (goal.status === "completed" || goal.status === "milestone-met") && "opacity-60"
                  )}
                >
                  {getStatusIcon(goal)}
                  <span className={cn(
                    "flex-1 text-xs truncate",
                    getStatusColor(goal),
                    (goal.status === "completed" || goal.status === "milestone-met") && "line-through"
                  )}>
                    {goal.title}
                    {goal.isMilestone && goal.checkpointNumber && (
                      <span className="text-[var(--text-muted)]"> #{goal.checkpointNumber}</span>
                    )}
                  </span>
                  <span className={cn(
                    "text-[10px] whitespace-nowrap",
                    isOverdue ? "text-rose-400" : "text-[var(--text-muted)]"
                  )}>
                    {format(parseISO(goal.dueDate), "d")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
