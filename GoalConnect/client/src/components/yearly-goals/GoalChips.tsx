/**
 * GoalChips
 * Minimal chip/pill display for yearly goals
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";
import { getCategoryStyle } from "./categoryStyles";

interface GoalChipsProps {
  goals: YearlyGoalWithProgress[];
  onGoalClick?: (goal: YearlyGoalWithProgress) => void;
}

export function GoalChips({ goals, onGoalClick }: GoalChipsProps) {
  if (goals.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {goals.map((goal) => {
        const categoryStyle = getCategoryStyle(goal.category);
        const CategoryIcon = categoryStyle.icon;
        const isComplete = goal.isCompleted;

        // Short progress display
        const progressText = goal.targetValue > 1
          ? `${goal.computedValue}/${goal.targetValue}`
          : isComplete ? "done" : "";

        return (
          <button
            key={goal.id}
            onClick={() => onGoalClick?.(goal)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs",
              "transition-all hover:scale-105",
              "border",
              isComplete
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-white/5 border-white/10 text-[var(--text-primary)] hover:border-peach-400/30"
            )}
          >
            {isComplete ? (
              <Check className="w-3 h-3" />
            ) : (
              <CategoryIcon className="w-3 h-3 text-peach-400" />
            )}
            <span className={cn(
              "max-w-[120px] truncate",
              isComplete && "line-through opacity-60"
            )}>
              {goal.title}
            </span>
            {progressText && (
              <span className={cn(
                "tabular-nums text-[10px]",
                isComplete ? "text-emerald-400/60" : "text-[var(--text-muted)]"
              )}>
                {progressText}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
