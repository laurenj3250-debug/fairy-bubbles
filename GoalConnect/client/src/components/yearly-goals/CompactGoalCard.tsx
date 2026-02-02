import { useState } from "react";
import { Check, Trophy, ChevronDown, ChevronUp, Sparkles, Calendar, Zap, Plus, Minus, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";
import { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";
import { getCategoryStyle } from "./categoryStyles";
import confetti from "canvas-confetti";

// Type for outdoor logging options
export type OutdoorLogType = "quick" | "full";

// Calculate progress status based on expected vs actual progress
function getProgressStatus(goal: YearlyGoalWithProgress): "ahead" | "on-track" | "behind" | null {
  // Only calculate for count goals that aren't completed
  if (goal.isCompleted || goal.goalType === "binary") return null;
  if (goal.targetValue <= 1) return null;

  const now = new Date();
  const yearStart = new Date(parseInt(goal.year), 0, 1);
  const yearEnd = goal.dueDate
    ? new Date(goal.dueDate)
    : new Date(parseInt(goal.year), 11, 31);

  // If past due date, don't show status (will show overdue instead)
  if (goal.dueDate && now > yearEnd) return null;

  const totalDays = (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);
  const daysPassed = Math.max(0, (now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
  const expectedProgress = (daysPassed / totalDays) * goal.targetValue;

  const buffer = 0.15; // 15% buffer for "on-track"
  if (goal.computedValue >= expectedProgress * (1 + buffer)) return "ahead";
  if (goal.computedValue >= expectedProgress * (1 - buffer)) return "on-track";
  return "behind";
}

// Get due date status
function getDueDateStatus(dueDate: string | null): "overdue" | "soon" | "ok" | null {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 14) return "soon";
  return "ok";
}

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
  // Outdoor day logging callback
  onLogOutdoorDay?: (type: OutdoorLogType) => void;
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
  onLogOutdoorDay,
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
            <div className="flex items-start gap-1.5">
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
              {goal.source === "auto" && (
                <span
                  className="flex-shrink-0 flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded bg-sky-500/20 text-sky-400"
                  title={goal.sourceLabel ? `Auto-tracks from ${goal.sourceLabel}` : "Auto-tracking"}
                >
                  <Zap className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
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

        {/* Action buttons for manual goals */}
        {isManual && !goal.isCompleted && (
          <div className="flex items-center gap-2 mb-2">
            {goal.goalType === "binary" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle();
                }}
                disabled={isToggling}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium",
                  "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30",
                  "hover:bg-emerald-500/30 transition-colors",
                  isToggling && "opacity-50"
                )}
              >
                <Check className="w-3.5 h-3.5" />
                Complete
              </button>
            ) : goal.goalType === "count" ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onIncrement) onIncrement(-1);
                  }}
                  disabled={isIncrementing || goal.computedValue <= 0}
                  className={cn(
                    "p-1.5 rounded-lg",
                    "bg-white/5 text-[var(--text-muted)] ring-1 ring-white/10",
                    "hover:bg-white/10 hover:text-[var(--text-primary)] transition-colors",
                    (isIncrementing || goal.computedValue <= 0) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onIncrement) onIncrement(1);
                  }}
                  disabled={isIncrementing}
                  className={cn(
                    "p-1.5 rounded-lg",
                    "bg-peach-400/20 text-peach-400 ring-1 ring-peach-400/30",
                    "hover:bg-peach-400/30 transition-colors",
                    isIncrementing && "opacity-50"
                  )}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Action buttons for outdoor day goals - one-click tick + optional full log */}
        {!goal.isCompleted && onLogOutdoorDay && (goal.sourceLabel === "Adventures" || goal.sourceLabel === "Climbing Log") && (
          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLogOutdoorDay("quick");
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium",
                "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30",
                "hover:bg-amber-500/30 transition-colors"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              Outdoor day
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLogOutdoorDay("full");
              }}
              className={cn(
                "p-1.5 rounded-lg",
                "bg-white/5 text-[var(--text-muted)] ring-1 ring-white/10",
                "hover:bg-white/10 hover:text-amber-400 transition-colors"
              )}
              title="Log full adventure with photos"
            >
              <Mountain className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Footer: Progress text + Status + XP */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-xs text-[var(--text-muted)] tabular-nums">
              {goal.computedValue}/{goal.targetValue}
              {goal.goalType === "compound" && " chapters"}
            </span>

            {/* Progress status badge */}
            {(() => {
              const status = getProgressStatus(goal);
              if (!status) return null;
              return (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  status === "ahead" && "bg-emerald-500/20 text-emerald-400",
                  status === "on-track" && "bg-yellow-500/20 text-yellow-400",
                  status === "behind" && "bg-red-500/20 text-red-400"
                )}>
                  {status === "ahead" ? "ahead" : status === "on-track" ? "on track" : "behind"}
                </span>
              );
            })()}

            {/* Due date indicator */}
            {goal.dueDate && !goal.isCompleted && (() => {
              const status = getDueDateStatus(goal.dueDate);
              if (!status || status === "ok") return null;
              return (
                <span className={cn(
                  "flex items-center gap-0.5 text-[10px]",
                  status === "overdue" && "text-red-400",
                  status === "soon" && "text-yellow-400"
                )}>
                  <Calendar className="w-2.5 h-2.5" />
                  {status === "overdue" ? "overdue" : "due soon"}
                </span>
              );
            })()}
          </div>

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
        <div
          className="border-t border-white/5 px-3 py-2 space-y-1.5 max-h-64 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {goal.subItems.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-2 text-xs p-1.5 rounded-lg",
                "hover:bg-white/[0.03] transition-colors"
              )}
            >
              {/* Checkbox - clickable if onToggleSubItem provided */}
              {onToggleSubItem ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSubItem(item.id);
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
