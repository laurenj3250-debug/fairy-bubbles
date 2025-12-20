import { ChevronLeft, ChevronRight, Target, Trophy, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface YearlyGoalsHeaderProps {
  year: string;
  onYearChange: (year: string) => void;
  stats: {
    totalGoals: number;
    completedGoals: number;
    completionPercent: number;
    avgProgress: number;
  };
}

export function YearlyGoalsHeader({
  year,
  onYearChange,
  stats,
}: YearlyGoalsHeaderProps) {
  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(year);

  const goToPreviousYear = () => onYearChange((yearNum - 1).toString());
  const goToNextYear = () => onYearChange((yearNum + 1).toString());

  // Calculate ring progress for the circular indicator
  const ringProgress = stats.totalGoals > 0
    ? (stats.completedGoals / stats.totalGoals) * 100
    : 0;
  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference - (ringProgress / 100) * circumference;

  return (
    <div className="mb-8">
      {/* Header with year selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-peach-400/20 to-peach-500/10 flex items-center justify-center border border-peach-400/20">
            <Target className="w-5 h-5 text-peach-400" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-semibold text-[var(--text-primary)] tracking-wide">
              Yearly Goals
            </h1>
            <p className="text-sm text-[var(--text-muted)] font-body">
              Your aspirations for the year
            </p>
          </div>
        </div>

        {/* Year selector */}
        <div className="glass-card frost-accent !p-1 flex items-center gap-1">
          <button
            onClick={goToPreviousYear}
            className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-heading font-medium text-[var(--text-primary)] min-w-[72px] text-center tabular-nums">
            {year}
          </span>
          <button
            onClick={goToNextYear}
            className={cn(
              "p-2 rounded-lg transition-colors",
              yearNum >= currentYear + 1
                ? "text-[var(--text-muted)]/40 cursor-not-allowed"
                : "hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
            disabled={yearNum >= currentYear + 1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats dashboard */}
      <div className="glass-card frost-accent !p-6">
        <div className="flex items-center gap-8">
          {/* Circular progress indicator */}
          <div className="relative flex-shrink-0">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              {/* Background ring */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/5"
              />
              {/* Progress ring */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                  transition: 'stroke-dashoffset 0.8s ease-out',
                }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--peach-300)" />
                  <stop offset="100%" stopColor="var(--peach-500)" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-heading font-light text-[var(--text-primary)] tabular-nums">
                {stats.completionPercent}%
              </span>
              <span className="text-xs text-[var(--text-muted)] font-body uppercase tracking-wider">
                complete
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="flex-1 grid grid-cols-3 gap-6">
            {/* Total Goals */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Target className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-body">Total</span>
              </div>
              <div className="text-3xl font-heading font-light text-[var(--text-primary)] tabular-nums">
                {stats.totalGoals}
              </div>
              <div className="text-xs text-[var(--text-muted)] font-body">goals set</div>
            </div>

            {/* Completed */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <Trophy className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-body">Done</span>
              </div>
              <div className="text-3xl font-heading font-light text-emerald-400 tabular-nums">
                {stats.completedGoals}
              </div>
              <div className="text-xs text-[var(--text-muted)] font-body">achieved</div>
            </div>

            {/* Average Progress */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-body">Progress</span>
              </div>
              <div className="text-3xl font-heading font-light text-amber-400 tabular-nums">
                {stats.avgProgress}%
              </div>
              <div className="text-xs text-[var(--text-muted)] font-body">average</div>
            </div>
          </div>
        </div>

        {/* Motivational message when making good progress */}
        {stats.avgProgress >= 50 && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-sm text-peach-400/80">
            <Sparkles className="w-4 h-4" />
            <span className="font-body italic">
              You're making great progress this year!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
