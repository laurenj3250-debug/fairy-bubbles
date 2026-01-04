/**
 * GoalsDeadlinesWidget
 * Clean, minimal view of goals due this month
 */

import { format, parseISO, isBefore } from "date-fns";
import {
  Calendar,
  Check,
  AlertTriangle,
  GraduationCap,
  Dumbbell,
  Mountain,
  TreePine,
  Globe,
  BookOpen,
  Music,
  Plane,
  Heart,
  Users,
  Wallet,
  Star,
  Circle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoalCalendar, type ConsolidatedGoal } from "@/hooks/useGoalCalendar";

// Category to icon mapping
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  residency: GraduationCap,
  fitness: Dumbbell,
  climbing: Mountain,
  outdoor: TreePine,
  german: Globe,
  books: BookOpen,
  piano: Music,
  travel: Plane,
  relationship: Heart,
  social: Users,
  financial: Wallet,
  bucket_list: Star,
};

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

  return (
    <div className="glass-card frost-accent flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          Due This Month
        </h3>
        <span className="text-xs text-[var(--text-muted)] font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-white/5 animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && consolidatedGoals.length === 0 && (
        <div className="text-center py-10">
          <Calendar className="w-10 h-10 text-[var(--text-muted)]/30 mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">No deadlines this month</p>
        </div>
      )}

      {/* Goals list */}
      {!isLoading && consolidatedGoals.length > 0 && (
        <div className="space-y-2 max-h-[340px] overflow-y-auto">
          {consolidatedGoals.map((goal) => {
            const allMet = goal.milestonesMet >= goal.milestonesThisMonth;
            const isOverdue = goal.nextDueDate && isBefore(parseISO(goal.nextDueDate), new Date());
            const CategoryIcon = CATEGORY_ICONS[goal.category] || Calendar;
            const progressPct = goal.targetValue > 0
              ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
              : 0;

            return (
              <div
                key={goal.goalId}
                className={cn(
                  "group relative rounded-xl p-3 transition-all",
                  "bg-white/[0.03] hover:bg-white/[0.06]",
                  "border border-white/[0.06]",
                  allMet && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Status indicator */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    allMet ? "bg-emerald-500/20" :
                    isOverdue ? "bg-rose-500/20" :
                    "bg-white/5"
                  )}>
                    <CategoryIcon className={cn(
                      "w-4 h-4",
                      allMet ? "text-emerald-400" :
                      isOverdue ? "text-rose-400" :
                      "text-[var(--text-muted)]"
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium truncate",
                        allMet ? "text-emerald-400 line-through" :
                        isOverdue ? "text-rose-400" :
                        "text-[var(--text-primary)]"
                      )}>
                        {goal.title}
                      </span>
                    </div>

                    {/* Progress info */}
                    <div className="flex items-center gap-3 mt-1.5">
                      {/* Progress bar */}
                      {goal.targetValue > 1 && (
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              allMet ? "bg-emerald-400" :
                              isOverdue ? "bg-rose-400" :
                              "bg-peach-400"
                            )}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}

                      {/* Progress text */}
                      <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                        {goal.currentValue}/{goal.targetValue}
                      </span>

                      {/* Milestone dots */}
                      {goal.milestonesThisMonth > 1 && (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: goal.milestonesThisMonth }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                i < goal.milestonesMet ? "bg-emerald-400" : "bg-white/20"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: date + action */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Due date */}
                    {goal.nextDueDate && !allMet && (
                      <span className={cn(
                        "text-[11px] tabular-nums",
                        isOverdue ? "text-rose-400 font-medium" : "text-[var(--text-muted)]"
                      )}>
                        {format(parseISO(goal.nextDueDate), "MMM d")}
                      </span>
                    )}

                    {/* Action button */}
                    {!allMet && !goal.isCompleted && (
                      <button
                        onClick={() => onIncrement(goal.goalId)}
                        disabled={isIncrementing}
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                          "bg-white/10 hover:bg-peach-400/20",
                          "text-[var(--text-muted)] hover:text-peach-400",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                        title={goal.targetValue > 1 ? "Log progress" : "Mark complete"}
                      >
                        {goal.targetValue > 1 ? (
                          <span className="text-xs font-medium">+1</span>
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {/* Completed indicator */}
                    {allMet && (
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
