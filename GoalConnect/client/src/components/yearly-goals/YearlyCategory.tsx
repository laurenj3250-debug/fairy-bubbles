import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";
import { YearlyGoalRow } from "./YearlyGoalRow";
import { GoalProgressBar } from "./GoalProgressBar";

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

  // Calculate category stats
  const completedCount = goals.filter((g) => g.isCompleted).length;
  const totalCount = goals.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-stone-900/50 rounded-xl border border-stone-800 overflow-hidden">
      {/* Category header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-800/30 transition-colors"
      >
        <div className="w-6 h-6 flex items-center justify-center text-stone-400">
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>

        <h3 className="text-base font-semibold text-stone-200 flex-1 text-left">
          {categoryLabel}
        </h3>

        {/* Category progress */}
        <div className="flex items-center gap-3">
          <GoalProgressBar
            value={completedCount}
            max={totalCount}
            className="w-20 sm:w-32"
          />
          <span className="text-sm text-stone-500 w-16 text-right">
            {completedCount}/{totalCount}
          </span>
        </div>
      </button>

      {/* Goals list */}
      {!collapsed && (
        <div className="border-t border-stone-800">
          {goals.map((goal) => (
            <YearlyGoalRow
              key={goal.id}
              goal={goal}
              onToggle={() => onToggle(goal.id)}
              onIncrement={(amount) => onIncrement(goal.id, amount)}
              onToggleSubItem={(subItemId) => onToggleSubItem(goal.id, subItemId)}
              onClaimReward={() => onClaimReward(goal.id)}
              isToggling={isToggling}
              isIncrementing={isIncrementing}
              isClaimingReward={isClaimingReward}
            />
          ))}
        </div>
      )}
    </div>
  );
}
