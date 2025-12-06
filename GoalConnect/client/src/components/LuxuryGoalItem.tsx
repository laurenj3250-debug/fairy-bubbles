import { cn } from '@/lib/utils';

interface LuxuryGoalItemProps {
  title: string;
  current: number;
  target: number;
  isComplete?: boolean;
  className?: string;
  onIncrement?: () => void;
  isPending?: boolean;
}

export function LuxuryGoalItem({
  title,
  current,
  target,
  isComplete,
  className,
  onIncrement,
  isPending,
}: LuxuryGoalItemProps) {
  const progress = Math.min((current / target) * 100, 100);
  const complete = isComplete ?? current >= target;

  return (
    <button
      type="button"
      onClick={onIncrement}
      disabled={complete || !onIncrement || isPending}
      role="listitem"
      aria-label={`${title}: ${current} of ${target}${complete ? ', completed' : ''}${isPending ? ', updating...' : ''}. ${!complete && onIncrement && !isPending ? 'Click to increment.' : ''}`}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all goal-item text-left",
        complete ? "bg-peach-400/10" : "bg-white/5 hover:bg-white/10",
        !complete && onIncrement && !isPending && "cursor-pointer",
        isPending && "opacity-50",
        className
      )}
    >
      {/* Checkmark circle */}
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all",
          complete
            ? "bg-peach-400 text-ice-deep shadow-[0_0_10px_rgba(228,168,128,0.4)] goal-complete-check"
            : "border-2 border-white/20"
        )}
      >
        {complete && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Title */}
      <span
        className={cn(
          "flex-1 font-heading text-sm",
          complete ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
        )}
      >
        {title}
      </span>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {/* Mini progress bar */}
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden"
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: complete ? 'var(--peach-400)' : 'var(--peach-300)',
            }}
          />
        </div>
        {/* Count */}
        <span
          className={cn(
            "font-heading text-xs font-medium min-w-[32px] text-right",
            complete ? "text-peach-400" : "text-[var(--text-muted)]"
          )}
        >
          {current}/{target}
        </span>
      </div>
    </button>
  );
}
