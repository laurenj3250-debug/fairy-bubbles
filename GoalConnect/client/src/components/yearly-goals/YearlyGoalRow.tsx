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
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";
import { SubItemList } from "./SubItemList";
import { CategoryStyle } from "./categoryStyles";
import confetti from "canvas-confetti";

interface YearlyGoalRowProps {
  goal: YearlyGoalWithProgress;
  categoryStyle: CategoryStyle;
  onToggle: () => void;
  onIncrement: (amount: number) => void;
  onToggleSubItem: (subItemId: string) => void;
  onClaimReward: () => void;
  isToggling?: boolean;
  isIncrementing?: boolean;
  isClaimingReward?: boolean;
  isLast?: boolean;
}

export function YearlyGoalRow({
  goal,
  categoryStyle,
  onToggle,
  onIncrement,
  onToggleSubItem,
  onClaimReward,
  isToggling,
  isIncrementing,
  isClaimingReward,
  isLast,
}: YearlyGoalRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isManual = goal.source === "manual";
  const isDisabled = !isManual && goal.goalType !== "compound";

  // Trigger confetti on completion
  const handleToggle = () => {
    if (goal.goalType === "binary" && !goal.isCompleted) {
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
    <div className={cn(
      "transition-colors",
      !isLast && "border-b border-white/5"
    )}>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02]">
        {/* Checkbox / Toggle / Expand button */}
        {goal.goalType === "binary" ? (
          <button
            onClick={handleToggle}
            disabled={isDisabled || isToggling}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 transition-all",
              goal.isCompleted
                ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                : cn("bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] ring-1 ring-white/10", !isDisabled && "hover:ring-white/20"),
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {goal.isCompleted ? (
              <Check className="w-4 h-4" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>
        ) : goal.goalType === "compound" ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 transition-all",
              expanded
                ? "bg-peach-400/10 ring-1 ring-peach-400/30 text-peach-400"
                : "bg-white/5 ring-1 ring-white/10 hover:ring-white/20 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          // Count goal indicator
          <div
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0",
              goal.isCompleted
                ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                : "bg-peach-400/10 text-peach-400 ring-1 ring-peach-400/30"
            )}
          >
            {goal.isCompleted ? (
              <Check className="w-4 h-4" />
            ) : (
              <span className="text-[10px] font-bold tabular-nums">{goal.progressPercent}%</span>
            )}
          </div>
        )}

        {/* Title and meta info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium truncate",
                goal.isCompleted ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
              )}
            >
              {goal.title}
            </span>

            {/* Auto-tracked badge */}
            {goal.source === "auto" && goal.sourceLabel && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-muted)] border border-white/10 flex-shrink-0">
                <LinkIcon className="w-2.5 h-2.5" />
                {goal.sourceLabel}
              </span>
            )}
          </div>

          {/* Progress bar for count goals */}
          {goal.goalType === "count" && (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    goal.isCompleted ? "bg-emerald-400" : "bg-peach-400"
                  )}
                  style={{ width: `${goal.progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)] tabular-nums">
                {goal.computedValue}/{goal.targetValue}
              </span>
            </div>
          )}

          {/* Progress for compound goals */}
          {goal.goalType === "compound" && (
            <div className="mt-1 flex items-center gap-2">
              <div className="flex gap-0.5">
                {goal.subItems.map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-4 h-1 rounded-full transition-colors",
                      item.completed ? "bg-emerald-400" : "bg-white/10"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {goal.computedValue}/{goal.targetValue}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Increment/decrement for manual count goals */}
          {isManual && goal.goalType === "count" && !goal.isCompleted && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleIncrement(-1)}
                disabled={isIncrementing || goal.computedValue <= 0}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 transition-all",
                  goal.computedValue <= 0
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleIncrement(1)}
                disabled={isIncrementing}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Reward claim button */}
          {goal.isCompleted && !goal.rewardClaimed && (
            <button
              onClick={handleClaimReward}
              disabled={isClaimingReward}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                "bg-peach-400/20 hover:bg-peach-400/30",
                "text-peach-400 text-sm font-medium",
                "ring-1 ring-peach-400/30",
                "animate-pulse"
              )}
            >
              <Trophy className="w-4 h-4" />
              <span>+{goal.xpReward}</span>
            </button>
          )}

          {/* Claimed indicator */}
          {goal.isCompleted && goal.rewardClaimed && (
            <div className="flex items-center gap-1.5 px-2 py-1 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs">Claimed</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded sub-items for compound goals */}
      {goal.goalType === "compound" && expanded && (
        <div className="pb-3 px-4 ml-11">
          <SubItemList
            subItems={goal.subItems}
            onToggle={onToggleSubItem}
            categoryStyle={categoryStyle}
          />
        </div>
      )}
    </div>
  );
}
