import { useState } from "react";
import { Check, Trophy, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";
import { getCategoryStyle } from "./categoryStyles";
import confetti from "canvas-confetti";

interface CompactGoalCardProps {
  goal: YearlyGoalWithProgress;
  onToggle?: () => void;
  onIncrement?: (amount: number) => void;
  onToggleSubItem?: (subItemId: string) => void;
  onClaimReward?: () => void;
  isToggling?: boolean;
  isIncrementing?: boolean;
  isClaimingReward?: boolean;
  onClick?: () => void;
}

export function CompactGoalCard({
  goal,
  onToggle,
  onIncrement,
  onToggleSubItem,
  onClaimReward,
  isToggling,
  isIncrementing,
  isClaimingReward,
  onClick,
}: CompactGoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const categoryStyle = getCategoryStyle(goal.category);
  const CategoryIcon = categoryStyle.icon;
  const isManual = goal.source === "manual";
  const hasSubItems = goal.goalType === "compound" && goal.subItems.length > 0;

  const handleToggle = () => {
    if (!onToggle) return;
    if (goal.goalType === "binary" && !goal.isCompleted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    onToggle();
  };

  const handleClaimReward = () => {
    if (!onClaimReward) return;
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 },
    });
    onClaimReward();
  };

  const handleCardClick = () => {
    if (hasSubItems) {
      setExpanded(!expanded);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm",
        "transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05]",
        hasSubItems && "cursor-pointer"
      )}
      onClick={handleCardClick}
    >
      {/* Main card content */}
      <div className="p-3">
        {/* Header: Icon + Title */}
        <div className="flex items-start gap-2 mb-2">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
              categoryStyle.iconBg,
              "border"
            )}
          >
            <CategoryIcon className={cn("w-3.5 h-3.5", categoryStyle.accentColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "text-sm font-medium leading-tight line-clamp-2",
                goal.isCompleted
                  ? "text-[var(--text-muted)] line-through"
                  : "text-[var(--text-primary)]"
              )}
            >
              {goal.title}
            </h3>
          </div>
          {/* Expand indicator for compound goals */}
          {hasSubItems && (
            <button
              className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                goal.isCompleted ? "bg-emerald-400" : "bg-peach-400"
              )}
              style={{ width: `${goal.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer: Progress text + XP */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            {goal.computedValue}/{goal.targetValue}
            {goal.goalType === "compound" && " chapters"}
          </span>

          {/* XP reward or claim button */}
          {goal.isCompleted && !goal.rewardClaimed ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClaimReward();
              }}
              disabled={isClaimingReward}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                "bg-peach-400/20 text-peach-400 ring-1 ring-peach-400/30",
                "hover:bg-peach-400/30 transition-colors",
                "animate-pulse"
              )}
            >
              <Trophy className="w-3 h-3" />
              +{goal.xpReward}
            </button>
          ) : goal.isCompleted && goal.rewardClaimed ? (
            <div className="flex items-center gap-1 text-emerald-400 text-xs">
              <Sparkles className="w-3 h-3" />
              <span>{goal.xpReward} XP</span>
            </div>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">
              {goal.xpReward} XP
            </span>
          )}
        </div>
      </div>

      {/* Expanded sub-items for compound goals */}
      {hasSubItems && expanded && (
        <div className="border-t border-white/5 px-3 py-2 space-y-1.5 max-h-64 overflow-y-auto">
          {goal.subItems.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-2 text-xs p-1.5 rounded-lg",
                "hover:bg-white/[0.03] transition-colors"
              )}
            >
              {/* Checkbox for manual goals */}
              {isManual ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleSubItem) onToggleSubItem(item.id);
                  }}
                  className={cn(
                    "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5",
                    item.completed
                      ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                      : "bg-white/5 ring-1 ring-white/10 hover:ring-white/20"
                  )}
                >
                  {item.completed && <Check className="w-2.5 h-2.5" />}
                </button>
              ) : (
                <div
                  className={cn(
                    "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5",
                    item.completed
                      ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                      : "bg-white/5 ring-1 ring-white/10"
                  )}
                >
                  {item.completed && <Check className="w-2.5 h-2.5" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "block truncate",
                    item.completed
                      ? "text-[var(--text-muted)] line-through"
                      : "text-[var(--text-primary)]"
                  )}
                >
                  {item.title}
                </span>
                {/* Page count for study chapters */}
                {(item as any).pageCount && (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {(item as any).pageCount} pages
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
