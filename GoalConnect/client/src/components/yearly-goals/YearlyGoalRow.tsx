import { useState } from "react";
import {
  Check,
  Circle,
  Minus,
  Plus,
  Trophy,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";
import { GoalProgressBar } from "./GoalProgressBar";
import { SubItemList } from "./SubItemList";
import confetti from "canvas-confetti";

interface YearlyGoalRowProps {
  goal: YearlyGoalWithProgress;
  onToggle: () => void;
  onIncrement: (amount: number) => void;
  onToggleSubItem: (subItemId: string) => void;
  onClaimReward: () => void;
  isToggling?: boolean;
  isIncrementing?: boolean;
  isClaimingReward?: boolean;
}

export function YearlyGoalRow({
  goal,
  onToggle,
  onIncrement,
  onToggleSubItem,
  onClaimReward,
  isToggling,
  isIncrementing,
  isClaimingReward,
}: YearlyGoalRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isManual = goal.source === "manual";
  const isDisabled = !isManual && goal.goalType !== "compound";

  // Trigger confetti on completion
  const handleToggle = () => {
    if (goal.goalType === "binary" && !goal.isCompleted) {
      // Will become completed
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    onToggle();
  };

  const handleIncrement = (amount: number) => {
    const newValue = goal.computedValue + amount;
    if (!goal.isCompleted && newValue >= goal.targetValue) {
      // Will become completed
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    onIncrement(amount);
  };

  const handleClaimReward = () => {
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 },
    });
    onClaimReward();
  };

  return (
    <div className="border-b border-stone-800 last:border-b-0">
      <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
        {/* Checkbox / Toggle */}
        {goal.goalType === "binary" ? (
          <button
            onClick={handleToggle}
            disabled={isDisabled || isToggling}
            className={cn(
              "w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg flex-shrink-0 transition-all",
              goal.isCompleted
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-stone-800 text-stone-500 hover:text-stone-300",
              isDisabled && "opacity-60 cursor-not-allowed"
            )}
          >
            {goal.isCompleted ? (
              <Check className="w-5 h-5 sm:w-4 sm:h-4" />
            ) : (
              <Circle className="w-5 h-5 sm:w-4 sm:h-4" />
            )}
          </button>
        ) : goal.goalType === "compound" ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors flex-shrink-0"
          >
            {expanded ? (
              <ChevronDown className="w-5 h-5 sm:w-4 sm:h-4" />
            ) : (
              <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
            )}
          </button>
        ) : (
          <div
            className={cn(
              "w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg flex-shrink-0",
              goal.isCompleted
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-stone-800 text-stone-500"
            )}
          >
            {goal.isCompleted ? (
              <Check className="w-5 h-5 sm:w-4 sm:h-4" />
            ) : (
              <span className="text-xs font-medium">{goal.progressPercent}%</span>
            )}
          </div>
        )}

        {/* Title and progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm sm:text-base font-medium truncate",
                goal.isCompleted ? "text-stone-500 line-through" : "text-stone-200"
              )}
            >
              {goal.title}
            </span>
            {goal.source === "auto" && goal.sourceLabel && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-500 flex-shrink-0">
                {goal.sourceLabel}
              </span>
            )}
          </div>

          {/* Progress bar for count goals */}
          {goal.goalType === "count" && (
            <div className="mt-1.5 flex items-center gap-3">
              <GoalProgressBar
                value={goal.computedValue}
                max={goal.targetValue}
                className="flex-1"
              />
              <span className="text-xs text-stone-500 flex-shrink-0">
                {goal.computedValue}/{goal.targetValue}
              </span>
            </div>
          )}

          {/* Progress for compound goals */}
          {goal.goalType === "compound" && (
            <div className="mt-1 text-xs text-stone-500">
              {goal.computedValue}/{goal.targetValue} completed
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Increment/decrement for manual count goals */}
          {isManual && goal.goalType === "count" && !goal.isCompleted && (
            <>
              <button
                onClick={() => handleIncrement(-1)}
                disabled={isIncrementing || goal.computedValue <= 0}
                className={cn(
                  "w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-stone-800 transition-colors",
                  goal.computedValue <= 0
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-stone-700 text-stone-400"
                )}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleIncrement(1)}
                disabled={isIncrementing}
                className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Reward claim button */}
          {goal.isCompleted && !goal.rewardClaimed && (
            <button
              onClick={handleClaimReward}
              disabled={isClaimingReward}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                "bg-gradient-to-r from-amber-500/20 to-yellow-500/20",
                "hover:from-amber-500/30 hover:to-yellow-500/30",
                "text-amber-400 text-sm font-medium",
                "animate-pulse"
              )}
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">+{goal.xpReward} XP</span>
            </button>
          )}

          {/* Claimed indicator */}
          {goal.isCompleted && goal.rewardClaimed && (
            <div className="flex items-center gap-1 px-2 py-1 text-emerald-500 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Claimed</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded sub-items for compound goals */}
      {goal.goalType === "compound" && expanded && (
        <div className="pb-3 px-3 sm:px-4">
          <SubItemList
            subItems={goal.subItems}
            onToggle={onToggleSubItem}
          />
        </div>
      )}
    </div>
  );
}
