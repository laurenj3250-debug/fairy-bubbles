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

  // Filter to show only incomplete goals
  const activeGoals = consolidatedGoals.filter(g => g.milestonesMet < g.milestonesThisMonth);

  // Don't render if no active goals
  if (!isLoading && activeGoals.length === 0) {
    return null;
  }

  return (
    <div className="glass-card frost-accent py-3 px-4">
      {/* Compact header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
          Due {format(currentMonth, "MMMM")}
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 w-32 bg-white/5 animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {/* Compact horizontal goal rows */}
      {!isLoading && activeGoals.length > 0 && (
        <div className="space-y-2">
          {activeGoals.map((goal) => {
            const isOverdue = goal.nextDueDate && isBefore(parseISO(goal.nextDueDate), new Date());
            const progressPct = goal.targetValue > 0
              ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
              : 0;

            return (
              <div
                key={goal.goalId}
                className="flex items-center gap-3 group"
              >
                {/* Title */}
                <span className={cn(
                  "text-sm min-w-[140px] truncate",
                  isOverdue ? "text-rose-400" : "text-[var(--text-primary)]"
                )}>
                  {goal.title}
                </span>

                {/* Progress bar */}
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-[120px]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isOverdue ? "bg-rose-400" : "bg-peach-400"
                    )}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Progress text */}
                <span className="text-xs text-[var(--text-muted)] tabular-nums w-12">
                  {goal.currentValue}/{goal.targetValue}
                </span>

                {/* Due date */}
                {goal.nextDueDate && (
                  <span className={cn(
                    "text-xs tabular-nums w-14",
                    isOverdue ? "text-rose-400" : "text-[var(--text-muted)]"
                  )}>
                    {format(parseISO(goal.nextDueDate), "MMM d")}
                  </span>
                )}

                {/* Action button */}
                <button
                  onClick={() => onIncrement(goal.goalId)}
                  disabled={isIncrementing}
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center transition-all",
                    "bg-white/5 hover:bg-peach-400/20",
                    "text-[var(--text-muted)] hover:text-peach-400",
                    "opacity-0 group-hover:opacity-100",
                    "disabled:opacity-50"
                  )}
                >
                  {goal.targetValue > 1 ? (
                    <span className="text-[10px] font-medium">+1</span>
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
