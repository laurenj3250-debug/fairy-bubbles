import { useState } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";
import { YearlyGoalRow } from "./YearlyGoalRow";
import { getCategoryStyle } from "./categoryStyles";

interface YearlyCategoryProps {
  category: string;
  categoryLabel: string;
  goals: YearlyGoalWithProgress[];
  onToggle: (goalId: number) => void;
  onIncrement: (goalId: number, amount: number) => void;
  onToggleSubItem: (goalId: number, subItemId: string) => void;
  onClaimReward: (goalId: number) => void;
  isToggling?: boolean;
  isIncrementing?: boolean;
  isClaimingReward?: boolean;
}

export function YearlyCategory({
  category,
  categoryLabel,
  goals,
  onToggle,
  onIncrement,
  onToggleSubItem,
  onClaimReward,
  isToggling,
  isIncrementing,
  isClaimingReward,
}: YearlyCategoryProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Get category styling
  const style = getCategoryStyle(category);
  const CategoryIcon = style.icon;

  // Calculate category stats
  const completedCount = goals.filter((g) => g.isCompleted).length;
  const totalCount = goals.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount && totalCount > 0;

  return (
    <div className={cn(
      "glass-card overflow-hidden transition-all duration-300",
      isComplete && "ring-1 ring-emerald-500/30"
    )}>
      {/* Category header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group"
      >
        {/* Category icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105",
          style.iconBg
        )}>
          <CategoryIcon className={cn("w-5 h-5", style.accentColor)} />
        </div>

        {/* Category name and progress text */}
        <div className="flex-1 text-left">
          <h3 className="text-lg font-heading font-medium text-[var(--text-primary)]">
            {categoryLabel}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-sm font-body", style.accentColor)}>
              {completedCount} of {totalCount} complete
            </span>
            {isComplete && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" />
                Done
              </span>
            )}
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            {/* Background ring */}
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-white/5"
            />
            {/* Progress ring */}
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke={isComplete ? "#10b981" : "currentColor"}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              className={cn(!isComplete && style.accentColor)}
              style={{
                strokeDasharray: 2 * Math.PI * 20,
                strokeDashoffset: 2 * Math.PI * 20 * (1 - progressPercent / 100),
                transition: 'stroke-dashoffset 0.5s ease-out',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-[var(--text-primary)] tabular-nums">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Expand/collapse chevron */}
        <div className="w-6 h-6 flex items-center justify-center text-[var(--text-muted)] transition-transform duration-200">
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Goals list */}
      {!collapsed && (
        <div className="border-t border-white/5">
          {goals.map((goal, index) => (
            <YearlyGoalRow
              key={goal.id}
              goal={goal}
              categoryStyle={style}
              onToggle={() => onToggle(goal.id)}
              onIncrement={(amount) => onIncrement(goal.id, amount)}
              onToggleSubItem={(subItemId) => onToggleSubItem(goal.id, subItemId)}
              onClaimReward={() => onClaimReward(goal.id)}
              isToggling={isToggling}
              isIncrementing={isIncrementing}
              isClaimingReward={isClaimingReward}
              isLast={index === goals.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
